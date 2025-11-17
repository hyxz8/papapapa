import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, Shield, Zap, Clock, ArrowRight, CheckCircle2 } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-xl font-semibold text-foreground">邮件自动回复系统</h1>
          </div>
          <Link href="/login">
            <Button variant="outline" className="gap-2 bg-transparent">
              登录
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground text-balance">智能邮件自动回复系统</h2>
          <p className="text-lg text-muted-foreground text-pretty max-w-2xl mx-auto">
            自动监控您的邮箱，智能回复未读邮件。节省时间，提高效率，让您专注于更重要的工作。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link href="/login">
              <Button size="lg" className="gap-2 w-full sm:w-auto">
                立即开始
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <h3 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-12">核心功能</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-border bg-card">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-lg">自动监控</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>实时监控IMAP邮箱，自动检测未读邮件并快速响应</CardDescription>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-lg">智能回复</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>自定义回复内容和主题，自动发送专业的回复邮件</CardDescription>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-lg">安全可靠</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>加密存储邮箱凭证，支持多账号管理，保障数据安全</CardDescription>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-lg">日志追踪</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>完整的操作日志记录，轻松追踪每一封邮件的处理状态</CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <h3 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-12">使用流程</h3>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-1">1. 登录系统</h4>
                <p className="text-muted-foreground">使用管理员账号登录到控制面板</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-1">2. 配置邮箱</h4>
                <p className="text-muted-foreground">添加需要监控的邮箱账号，配置IMAP和SMTP服务器信息</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-1">3. 设置回复内容</h4>
                <p className="text-muted-foreground">自定义自动回复的邮件主题和内容</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-1">4. 启动监控</h4>
                <p className="text-muted-foreground">系统自动监控邮箱并发送回复，您可以在日志中查看处理记录</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 bg-muted/30">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h3 className="text-2xl md:text-3xl font-bold text-foreground">准备好开始了吗？</h3>
          <p className="text-muted-foreground">立即登录系统，开始配置您的自动回复服务</p>
          <Link href="/login">
            <Button size="lg" className="gap-2">
              前往登录
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>邮件自动回复系统 © 2025</p>
        </div>
      </footer>
    </div>
  )
}
