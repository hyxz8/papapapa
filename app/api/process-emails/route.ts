import { NextResponse } from "next/server"
import { processAllAccounts } from "@/lib/email-processor"
import { getLogger } from "@/lib/logger"
import { emailAccountDb, replyConfigDb, processedEmailDb } from "@/lib/database"

function addLog(level: string, message: string, emailAccount?: string) {
  const logger = getLogger()
  logger.log(level as "INFO" | "WARNING" | "ERROR", message, emailAccount)
}

async function isProcessed(messageId: string, emailAccount: string): Promise<boolean> {
  return processedEmailDb.isProcessed(emailAccount, messageId)
}

async function markAsProcessed(email: any): Promise<void> {
  processedEmailDb.markAsProcessed(email.email_account, email.message_id, email.sender, email.subject || "")
}

/**
 * POST /api/process-emails
 * 手动触发邮件处理
 */
export async function POST() {
  try {
    addLog("INFO", "开始手动处理邮件")

    const accounts = emailAccountDb.getActive()
    const config = replyConfigDb.get()

    if (!accounts || accounts.length === 0) {
      addLog("WARNING", "没有配置邮箱账号")
      return NextResponse.json({ success: false, message: "没有配置邮箱账号" })
    }

    if (!config) {
      addLog("WARNING", "没有配置回复内容")
      return NextResponse.json({ success: false, message: "没有配置回复内容" })
    }

    // 处理所有邮箱
    await processAllAccounts(accounts, config, addLog, isProcessed, markAsProcessed)

    addLog("INFO", "邮件处理完成")

    return NextResponse.json({
      success: true,
      message: "邮件处理完成",
    })
  } catch (error: any) {
    addLog("ERROR", `处理邮件时出错: ${error.message}`)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

/**
 * GET /api/process-emails
 * 用于定时任务/Cron Job调用
 */
export async function GET() {
  try {
    addLog("INFO", "定时任务：开始处理邮件")

    const accounts = emailAccountDb.getActive()
    const config = replyConfigDb.get()

    if (!accounts || accounts.length === 0) {
      addLog("WARNING", "定时任务：没有配置邮箱账号")
      return NextResponse.json({ success: false, message: "没有配置邮箱账号" })
    }

    if (!config) {
      addLog("WARNING", "定时任务：没有配置回复内容")
      return NextResponse.json({ success: false, message: "没有配置回复内容" })
    }

    // 处理所有邮箱
    await processAllAccounts(accounts, config, addLog, isProcessed, markAsProcessed)

    addLog("INFO", "定时任务：邮件处理完成")

    return NextResponse.json({
      success: true,
      message: "定时任务执行成功",
    })
  } catch (error: any) {
    addLog("ERROR", `定时任务出错: ${error.message}`)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
