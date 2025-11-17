"use client"

import type React from "react"
import { Mail } from "lucide-react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Power, PowerOff, Play } from "lucide-react"
import { toast } from "sonner"

interface EmailAccount {
  id: number
  email: string
  imap_server: string
  imap_port: number
  smtp_server: string
  smtp_port: number
  is_active: number
}

export function EmailAccountsTab() {
  const [accounts, setAccounts] = useState<EmailAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    imap_server: "",
    imap_port: "993",
    smtp_server: "",
    smtp_port: "465",
    password: "",
  })

  useEffect(() => {
    fetchAccounts()
  }, [])

  const fetchAccounts = async () => {
    try {
      const response = await fetch("/api/email-accounts")
      if (response.ok) {
        const data = await response.json()
        setAccounts(data)
      }
    } catch (error) {
      console.error("Failed to fetch accounts:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch("/api/email-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      if (response.ok) {
        setDialogOpen(false)
        setFormData({
          email: "",
          imap_server: "",
          imap_port: "993",
          smtp_server: "",
          smtp_port: "465",
          password: "",
        })
        fetchAccounts()
      }
    } catch (error) {
      console.error("Failed to add account:", error)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("确定要删除这个邮箱账号吗？")) return
    try {
      const response = await fetch(`/api/email-accounts?id=${id}`, {
        method: "DELETE",
      })
      if (response.ok) {
        fetchAccounts()
      }
    } catch (error) {
      console.error("Failed to delete account:", error)
    }
  }

  const handleToggleActive = async (id: number, currentStatus: number) => {
    try {
      const response = await fetch("/api/email-accounts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_active: currentStatus === 1 ? 0 : 1 }),
      })
      if (response.ok) {
        fetchAccounts()
      }
    } catch (error) {
      console.error("Failed to toggle account:", error)
    }
  }

  const handleProcessNow = async () => {
    setProcessing(true)
    try {
      const response = await fetch("/api/process-emails", {
        method: "POST",
      })
      const result = await response.json()

      if (result.success) {
        toast.success(result.message || "邮件处理完成")
      } else {
        toast.error(result.message || "处理失败")
      }
    } catch (error) {
      toast.error("处理邮件时出错")
    } finally {
      setProcessing(false)
    }
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>邮箱账号管理</CardTitle>
            <CardDescription>配置需要监控的邮箱账号</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleProcessNow}
              disabled={processing || accounts.length === 0}
              variant="outline"
              className="gap-2 bg-transparent"
            >
              <Play className="w-4 h-4" />
              {processing ? "处理中..." : "立即处理"}
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  添加邮箱
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>添加邮箱账号</DialogTitle>
                  <DialogDescription>配置IMAP和SMTP服务器信息以启用自动回复功能</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="email">邮箱地址</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="example@gmail.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="imap_server">IMAP服务器</Label>
                      <Input
                        id="imap_server"
                        placeholder="imap.gmail.com"
                        value={formData.imap_server}
                        onChange={(e) => setFormData({ ...formData, imap_server: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="imap_port">IMAP端口</Label>
                      <Input
                        id="imap_port"
                        type="number"
                        placeholder="993"
                        value={formData.imap_port}
                        onChange={(e) => setFormData({ ...formData, imap_port: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtp_server">SMTP服务器</Label>
                      <Input
                        id="smtp_server"
                        placeholder="smtp.gmail.com"
                        value={formData.smtp_server}
                        onChange={(e) => setFormData({ ...formData, smtp_server: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtp_port">SMTP端口</Label>
                      <Input
                        id="smtp_port"
                        type="number"
                        placeholder="465"
                        value={formData.smtp_port}
                        onChange={(e) => setFormData({ ...formData, smtp_port: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="password">邮箱密码/应用专用密码</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="输入邮箱密码"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      取消
                    </Button>
                    <Button type="submit">添加</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>正在加载邮箱账号...</p>
          </div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>还没有添加邮箱账号</p>
            <p className="text-sm">点击上方"添加邮箱"按钮开始配置</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>邮箱地址</TableHead>
                <TableHead>IMAP服务器</TableHead>
                <TableHead>SMTP服务器</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="font-medium">{account.email}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {account.imap_server}:{account.imap_port}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {account.smtp_server}:{account.smtp_port}
                  </TableCell>
                  <TableCell>
                    {account.is_active === 1 ? (
                      <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">启用</Badge>
                    ) : (
                      <Badge variant="secondary">禁用</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(account.id, account.is_active)}
                      >
                        {account.is_active === 1 ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(account.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
