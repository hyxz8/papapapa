"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Mail, Settings, FileText, LogOut, KeyRound } from "lucide-react"
import { EmailAccountsTab } from "@/components/dashboard/email-accounts-tab"
import { ReplyConfigTab } from "@/components/dashboard/reply-config-tab"
import { LogsTab } from "@/components/dashboard/logs-tab"
import { ChangePasswordDialog } from "@/components/dashboard/change-password-dialog"

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [showChangePassword, setShowChangePassword] = useState(false)

  useEffect(() => {
    // 验证登录状态
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/check")
        if (!response.ok) {
          router.push("/login")
        }
      } catch (error) {
        router.push("/login")
      } finally {
        setLoading(false)
      }
    }
    checkAuth()
  }, [router])

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      router.push("/login")
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">邮件自动回复系统</h1>
              <p className="text-sm text-muted-foreground">管理面板</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setShowChangePassword(true)} className="gap-2 bg-transparent">
              <KeyRound className="w-4 h-4" />
              修改密码
            </Button>
            <Button variant="outline" onClick={handleLogout} className="gap-2 bg-transparent">
              <LogOut className="w-4 h-4" />
              登出
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="accounts" className="space-y-6">
          <TabsList className="bg-muted">
            <TabsTrigger value="accounts" className="gap-2">
              <Mail className="w-4 h-4" />
              邮箱管理
            </TabsTrigger>
            <TabsTrigger value="reply" className="gap-2">
              <Settings className="w-4 h-4" />
              回复设置
            </TabsTrigger>
            <TabsTrigger value="logs" className="gap-2">
              <FileText className="w-4 h-4" />
              系统日志
            </TabsTrigger>
          </TabsList>

          <TabsContent value="accounts" className="space-y-4">
            <EmailAccountsTab />
          </TabsContent>

          <TabsContent value="reply" className="space-y-4">
            <ReplyConfigTab />
          </TabsContent>

          <TabsContent value="logs" className="space-y-4">
            <LogsTab />
          </TabsContent>
        </Tabs>
      </main>

      <ChangePasswordDialog open={showChangePassword} onOpenChange={setShowChangePassword} />
    </div>
  )
}
