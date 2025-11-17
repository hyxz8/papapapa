import { NextResponse } from "next/server"
import { getLogger } from "@/lib/logger"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const level = searchParams.get("level")
    const account = searchParams.get("account")
    const limit = searchParams.get("limit")

    const logger = getLogger()
    let logs

    // 根据查询参数筛选日志
    if (level) {
      logs = logger.getLogsByLevel(level as "INFO" | "WARNING" | "ERROR")
    } else if (account) {
      logs = logger.getLogsByAccount(account)
    } else if (limit) {
      logs = logger.getRecentLogs(Number.parseInt(limit))
    } else {
      logs = logger.getLogs()
    }

    return NextResponse.json(logs)
  } catch (error: any) {
    console.error("获取日志失败:", error)
    return NextResponse.json({ error: "获取日志失败" }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const logger = getLogger()
    logger.clearLogs()
    return NextResponse.json({ success: true, message: "日志已清空" })
  } catch (error: any) {
    console.error("清空日志失败:", error)
    return NextResponse.json({ error: "清空日志失败" }, { status: 500 })
  }
}
