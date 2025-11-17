import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '邮件自动回复系统',
  description: '一个非常优秀的邮件自动回复系统',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN">
      <body className={`font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}
