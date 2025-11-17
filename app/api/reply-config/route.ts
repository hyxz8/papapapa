import { type NextRequest, NextResponse } from "next/server"
import { replyConfigDb } from "@/lib/database"

export async function GET() {
  try {
    const config = replyConfigDb.get()

    if (config) {
      return NextResponse.json(config)
    } else {
      // 返回默认配置
      return NextResponse.json({
        sender_name: "自动回复系统",
        subject: "自动回复",
        content:
          "您好！\n\n感谢您的来信。这是一封自动回复邮件。\n\n我们已经收到您的邮件，会尽快处理并回复您。\n\n祝好！",
      })
    }
  } catch (error) {
    console.error("Get reply config error:", error)
    return NextResponse.json({ error: "获取回复配置失败" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { sender_name, subject, content } = await request.json()

    const success = replyConfigDb.update(sender_name || "自动回复系统", subject, content)

    if (success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: "保存失败" }, { status: 500 })
    }
  } catch (error) {
    console.error("Update reply config error:", error)
    return NextResponse.json({ error: "保存回复配置失败" }, { status: 500 })
  }
}
