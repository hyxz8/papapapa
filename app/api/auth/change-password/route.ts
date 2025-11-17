import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { adminDb } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const username = cookieStore.get("username")?.value
    const session = cookieStore.get("session")?.value

    if (!username || !session) {
      return NextResponse.json({ error: "未登录" }, { status: 401 })
    }

    const { oldPassword, newPassword } = await request.json()

    if (!oldPassword || !newPassword) {
      return NextResponse.json({ error: "旧密码和新密码不能为空" }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "新密码长度至少为6位" }, { status: 400 })
    }

    // 验证旧密码
    const isValid = adminDb.verifyAdmin(username, oldPassword)
    if (!isValid) {
      return NextResponse.json({ error: "旧密码错误" }, { status: 401 })
    }

    // 更新密码
    const success = adminDb.updatePassword(username, newPassword)
    if (success) {
      return NextResponse.json({ success: true, message: "密码修改成功" })
    } else {
      return NextResponse.json({ error: "密码修改失败" }, { status: 500 })
    }
  } catch (error) {
    console.error("Change password error:", error)
    return NextResponse.json({ error: "服务器错误" }, { status: 500 })
  }
}
