import Imap from "imap"
import { simpleParser } from "mailparser"
import nodemailer from "nodemailer"

export interface EmailAccount {
  id: number
  email: string
  imap_server: string
  imap_port: number
  smtp_server: string
  smtp_port: number
  password: string
  is_active: number
}

export interface ReplyConfig {
  content: string
}

export interface ProcessedEmail {
  email_account: string
  message_id: string
  sender: string
  subject: string
}

/**
 * 邮件处理器类
 * 负责连接 IMAP 服务器、检查未读邮件、发送自动回复
 */
export class EmailProcessor {
  private account: EmailAccount
  private replyConfig: ReplyConfig
  private onLog: (level: string, message: string, emailAccount?: string) => void

  constructor(
    account: EmailAccount,
    replyConfig: ReplyConfig,
    onLog: (level: string, message: string, emailAccount?: string) => void,
  ) {
    this.account = account
    this.replyConfig = replyConfig
    this.onLog = onLog
  }

  /**
   * 处理邮箱中的未读邮件（收件箱 + 垃圾箱）
   */
  async processUnreadEmails(
    isProcessed: (messageId: string) => Promise<boolean>,
    markAsProcessed: (email: ProcessedEmail) => Promise<void>,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const imap = new Imap({
        user: this.account.email,
        password: this.account.password,
        host: this.account.imap_server,
        port: this.account.imap_port,
        tls: true,
        tlsOptions: { rejectUnauthorized: false },
      })

      let isSettled = false
      const settle = (error?: Error) => {
        if (isSettled) {
          return
        }
        isSettled = true
        if (error) {
          reject(error)
        } else {
          resolve()
        }
      }

      const mailboxes = Array.from(new Set<string>(["INBOX", "Junk"]))
      const formatMailboxName = (name: string) => {
        if (name === "Junk") return "垃圾箱"
        if (name === "INBOX") return "收件箱"
        return name
      }

      const processedEmails: ProcessedEmail[] = []

      const closeMailbox = (callback: () => void) => {
        imap.closeBox(false, (closeErr) => {
          if (closeErr) {
            this.onLog(
              "WARNING",
              `关闭邮箱文件夹失败: ${closeErr.message}`,
              this.account.email,
            )
          }
          callback()
        })
      }

      const processMailbox = (index: number) => {
        if (isSettled) {
          return
        }

        if (index >= mailboxes.length) {
          this.onLog(
            "INFO",
            `完成处理 ${processedEmails.length} 封邮件`,
            this.account.email,
          )
          try {
            imap.end()
          } catch {
            // ignore end errors
          }
          settle()
          return
        }

        const mailbox = mailboxes[index]
        const mailboxLabel = formatMailboxName(mailbox)

        imap.openBox(mailbox, false, (openErr) => {
          if (openErr) {
            this.onLog(
              "WARNING",
              `无法打开邮箱文件夹 ${mailboxLabel}: ${openErr.message}`,
              this.account.email,
            )
            processMailbox(index + 1)
            return
          }

          this.onLog("INFO", `打开邮箱文件夹 ${mailboxLabel}`, this.account.email)

          imap.search(["UNSEEN"], (searchErr, results) => {
            if (searchErr) {
              this.onLog(
                "ERROR",
                `搜索 ${mailboxLabel} 未读邮件失败: ${searchErr.message}`,
                this.account.email,
              )
              closeMailbox(() => processMailbox(index + 1))
              return
            }

            if (!results || results.length === 0) {
              this.onLog("INFO", `${mailboxLabel} 没有未读邮件`, this.account.email)
              closeMailbox(() => processMailbox(index + 1))
              return
            }

            this.onLog(
              "INFO",
              `在 ${mailboxLabel} 中发现 ${results.length} 封未读邮件`,
              this.account.email,
            )

            const fetch = imap.fetch(results, { bodies: "" })
            const messagePromises: Promise<void>[] = []
            const processedBefore = processedEmails.length

            fetch.on("message", (msg, seqno) => {
              msg.on("body", (stream) => {
                const messagePromise = new Promise<void>((resolveMessage) => {
                  simpleParser(stream, async (parseErr, parsed) => {
                    try {
                      if (parseErr) {
                        this.onLog(
                          "ERROR",
                          `解析邮件失败: ${parseErr.message}`,
                          this.account.email,
                        )
                        return
                      }

                      const messageId =
                        parsed.messageId || `${mailbox}-${Date.now()}-${seqno}`
                      const sender = parsed.from?.value?.[0]?.address || ""
                      const senderName = parsed.from?.value?.[0]?.name || sender
                      const subject = parsed.subject || "(无主题)"
                      const date = parsed.date || new Date()
                      
                      // 获取原邮件内容（优先使用文本格式）
                      const originalContent = parsed.text || parsed.html || ""

                      const alreadyProcessed = await isProcessed(messageId)
                      if (alreadyProcessed) {
                        this.onLog(
                          "INFO",
                          `邮件已处理过，跳过 ${sender}`,
                          this.account.email,
                        )
                        return
                      }

                      this.onLog(
                        "INFO",
                        `处理来自 ${sender} 的邮件 ${subject}`,
                        this.account.email,
                      )

                      try {
                        await this.sendAutoReply(
                          sender,
                          senderName,
                          subject,
                          messageId,
                          date,
                          originalContent,
                        )

                        await markAsProcessed({
                          email_account: this.account.email,
                          message_id: messageId,
                          sender,
                          subject,
                        })

                        processedEmails.push({
                          email_account: this.account.email,
                          message_id: messageId,
                          sender,
                          subject,
                        })

                        this.onLog(
                          "INFO",
                          `成功发送自动回复给 ${sender}`,
                          this.account.email,
                        )
                      } catch (error: any) {
                        this.onLog(
                          "ERROR",
                          `发送回复失败: ${error.message}`,
                          this.account.email,
                        )
                      }
                    } finally {
                      resolveMessage()
                    }
                  })
                })

                messagePromises.push(messagePromise)
              })

              msg.once("attributes", (attrs) => {
                imap.addFlags(attrs.uid, ["\\Seen"], (flagErr) => {
                  if (flagErr) {
                    this.onLog(
                      "WARNING",
                      `标记已读失败: ${flagErr.message}`,
                      this.account.email,
                    )
                  }
                })
              })
            })

            fetch.once("error", (fetchErr) => {
              this.onLog(
                "ERROR",
                `获取 ${mailboxLabel} 邮件失败: ${fetchErr.message}`,
                this.account.email,
              )
            })

            fetch.once("end", () => {
              Promise.allSettled(messagePromises).finally(() => {
                const processedInMailbox =
                  processedEmails.length - processedBefore
                this.onLog(
                  "INFO",
                  `${mailboxLabel} 处理完毕，处理 ${processedInMailbox} 封邮件`,
                  this.account.email,
                )
                closeMailbox(() => processMailbox(index + 1))
              })
            })
          })
        })
      }

      imap.once("ready", () => {
        this.onLog("INFO", "成功连接到 IMAP 服务器", this.account.email)
        processMailbox(0)
      })

      imap.once("error", (err) => {
        this.onLog("ERROR", `IMAP 连接错误: ${err.message}`, this.account.email)
        try {
          imap.end()
        } catch {
          // ignore end errors
        }
        const error = err instanceof Error ? err : new Error(String(err))
        settle(error)
      })

      imap.once("end", () => {
        this.onLog("INFO", "断开 IMAP 连接", this.account.email)
      })

      imap.connect()
    })
  }

  /**
   * 发送自动回复邮件
   */
  private async sendAutoReply(
    to: string,
    senderName: string,
    originalSubject: string,
    messageId: string,
    originalDate: Date,
    originalContent: string,
  ): Promise<void> {
    const transporter = nodemailer.createTransport({
      host: this.account.smtp_server,
      port: this.account.smtp_port,
      secure: true, // 使用 SSL
      auth: {
        user: this.account.email,
        pass: this.account.password,
      },
    })

    // 构建回复主题，如果原主题已经是"回复："或"Re:"开头，则不重复添加
    let replySubject = originalSubject
    if (
      !originalSubject.toLowerCase().startsWith("re:") &&
      !originalSubject.startsWith("回复：")
    ) {
      replySubject = `Re：${originalSubject}`
    }

    // 格式化原邮件日期
    const dateStr = originalDate.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })

    // 格式化为标准的邮件日期格式
    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ]
    const weekday = weekdays[originalDate.getDay()]
    const day = originalDate.getDate()
    const month = months[originalDate.getMonth()]
    const year = originalDate.getFullYear()
    const hours = String(originalDate.getHours()).padStart(2, "0")
    const minutes = String(originalDate.getMinutes()).padStart(2, "0")
    const seconds = String(originalDate.getSeconds()).padStart(2, "0")
    const standardDateStr = `${weekday}, ${day} ${month} ${year} ${hours}:${minutes}:${seconds} +0800`

    // 转换自动回复内容为 HTML（保留换行）
    const replyContentHtml = this.replyConfig.content
      .split("\n")
      .map((line) => (line.trim() === "" ? "<br />" : `<div>${line}</div>`))
      .join("\n")

    // 转换原邮件内容为 HTML（保留换行）
    const originalContentHtml = originalContent
      .split("\n")
      .map((line) => (line.trim() === "" ? "<br />" : line))
      .join("<br />\n")

    // 构建 HTML 格式的回复邮件
    const htmlBody = `<div style="line-height:1.43;"><br /></div>
<div style="font-family:-apple-system,system-ui;font-size:14px;color:rgb(0,0,0);line-height:1.43;">${replyContentHtml}</div>
<article style="line-height:1.43;">
<div style="display:flex;align-items:center;padding-top:8px" contenteditable="false">
    <div style="color:#959DA6;font-size:12px;line-height:30px">原始邮件</div>
    <hr style="border:none;flex-grow:1;border-top:1px solid rgba(21,46,74,0.07);margin-left:8px" />
</div>
<table style="line-height:20px;border-radius:6px;background-color:rgba(20,46,77,0.05);margin:0px;width:100%;">
<tbody><tr><td style="line-height:20px;padding:8px;">
<div style="line-height:20px;font-size:12px;"><span style="color:rgb(92,97,102);">发件人：</span><span style="color:rgb(0,0,0);">"${senderName}" <${to}></span></div>
<div style="line-height:20px;font-size:12px;"><span style="color:rgb(92,97,102);">发送时间：</span><span style="color:rgb(0,0,0);">${standardDateStr}</span></div>
<div style="line-height:20px;font-size:12px;"><span style="color:rgb(92,97,102);">收件人：</span><span style="color:rgb(0,0,0);">${this.account.email}</span></div>
<div style="line-height:20px;font-size:12px;"><span style="color:rgb(92,97,102);">主题：</span><span style="color:rgb(0,0,0);">${originalSubject}</span></div>
</td></tr></tbody></table>
<div><br /></div>
<div style="line-height:1.5;font-family:&quot;Microsoft YaHei UI&quot;;font-size:14px;color:rgb(0,0,0);">${originalContentHtml}</div>
</article>
<div style="line-height:1.43;"><br /></div>`

    // 构建纯文本格式的回复邮件（作为备用）
    const quotedContent = originalContent
      .split("\n")
      .map((line) => `> ${line}`)
      .join("\n")

    const textBody = `${this.replyConfig.content}

---
原始邮件
发件人："${senderName}" <${to}>
发送时间：${standardDateStr}
收件人：${this.account.email}
主题：${originalSubject}

${quotedContent}`

    const mailOptions: any = {
      from: this.account.email,
      to: to,
      subject: replySubject,
      text: textBody,
      html: htmlBody,
      inReplyTo: messageId,
      references: messageId,
    }

    await transporter.sendMail(mailOptions)
  }
}

/**
 * 处理所有启用的邮箱账号
 */
export async function processAllAccounts(
  accounts: EmailAccount[],
  replyConfig: ReplyConfig,
  onLog: (level: string, message: string, emailAccount?: string) => void,
  isProcessed: (messageId: string) => Promise<boolean>,
  markAsProcessed: (email: ProcessedEmail) => Promise<void>,
): Promise<void> {
  const activeAccounts = accounts.filter((acc) => acc.is_active === 1)

  if (activeAccounts.length === 0) {
    onLog("WARNING", "没有启用的邮箱账号")
    return
  }

  onLog("INFO", `开始处理 ${activeAccounts.length} 个邮箱账号`)

  for (const account of activeAccounts) {
    try {
      const processor = new EmailProcessor(account, replyConfig, onLog)
      await processor.processUnreadEmails(isProcessed, markAsProcessed)
    } catch (error: any) {
      onLog(
        "ERROR",
        `处理邮箱 ${account.email} 时出错: ${error.message}`,
        account.email,
      )
    }
  }

  onLog("INFO", "所有邮箱处理完毕")
}
