import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const session = request.cookies.get("session")
  const { pathname } = request.nextUrl

  // 如果访问仪表盘但没有session，重定向到登录页
  if (pathname.startsWith("/dashboard") && !session) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // 如果已登录访问登录页，重定向到仪表盘
  if (pathname === "/login" && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // 根路径重定向到登录页
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/", "/login", "/dashboard/:path*"],
}
