import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import crypto from "crypto"
import { adminDb } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: "用户名和密码不能为空" }, { status: 400 })
    }

    const isValid = adminDb.verifyAdmin(username, password)

    if (isValid) {
      // 创建会话token
      const sessionToken = crypto.randomBytes(32).toString("hex")

      // 设置cookie
      const cookieStore = await cookies()
      cookieStore.set("session", sessionToken, {
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7天
      })

      cookieStore.set("username", username, {
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7天
      })

      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: "用户名或密码错误" }, { status: 401 })
    }
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "服务器错误" }, { status: 500 })
  }
}
