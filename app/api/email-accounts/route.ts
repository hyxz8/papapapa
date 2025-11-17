import { type NextRequest, NextResponse } from "next/server"
import { emailAccountDb } from "@/lib/database"

export async function GET() {
  try {
    const accounts = emailAccountDb.getAll()
    return NextResponse.json(accounts)
  } catch (error) {
    console.error("Get email accounts error:", error)
    return NextResponse.json({ error: "获取邮箱账号失败" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    const newAccount = emailAccountDb.add(data)

    return NextResponse.json(newAccount)
  } catch (error: any) {
    console.error("Add email account error:", error)
    // 处理唯一约束错误
    if (error.message?.includes("UNIQUE constraint failed")) {
      return NextResponse.json({ error: "该邮箱账号已存在" }, { status: 400 })
    }
    return NextResponse.json({ error: "添加邮箱账号失败" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = Number.parseInt(searchParams.get("id") || "0")

    const success = emailAccountDb.delete(id)

    if (success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: "邮箱账号不存在" }, { status: 404 })
    }
  } catch (error) {
    console.error("Delete email account error:", error)
    return NextResponse.json({ error: "删除邮箱账号失败" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, is_active } = await request.json()

    const success = emailAccountDb.updateStatus(id, is_active)

    if (success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: "邮箱账号不存在" }, { status: 404 })
    }
  } catch (error) {
    console.error("Update email account error:", error)
    return NextResponse.json({ error: "更新邮箱账号失败" }, { status: 500 })
  }
}
