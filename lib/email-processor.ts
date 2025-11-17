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
  sender_name: string
  subject: string
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
                      const subject = parsed.subject || "(无主题)"

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
                        await this.sendAutoReply(sender, subject)

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
  private async sendAutoReply(to: string, originalSubject: string): Promise<void> {
    const transporter = nodemailer.createTransport({
      host: this.account.smtp_server,
      port: this.account.smtp_port,
      secure: true, // 使用 SSL
      auth: {
        user: this.account.email,
        pass: this.account.password,
      },
    })

    const mailOptions = {
      from: `"${this.replyConfig.sender_name}" <${this.account.email}>`,
      to: to,
      subject: this.replyConfig.subject,
      text: this.replyConfig.content,
      inReplyTo: originalSubject,
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
