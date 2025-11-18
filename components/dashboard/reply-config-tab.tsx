"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Save, CheckCircle } from "lucide-react"

interface ReplyConfig {
  content: string
}

export function ReplyConfigTab() {
  const [config, setConfig] = useState<ReplyConfig>({ content: "" })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      const response = await fetch("/api/reply-config")
      if (response.ok) {
        const data = await response.json()
        setConfig(data)
      }
    } catch (error) {
      console.error("Failed to fetch config:", error)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      const response = await fetch("/api/reply-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      })
      if (response.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch (error) {
      console.error("Failed to save config:", error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>自动回复内容设置</CardTitle>
        <CardDescription>
          配置发送给发件人的自动回复邮件内容。邮件将以"回复：原标题"的格式自动回复对方
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="content">邮件内容</Label>
          <Textarea
            id="content"
            placeholder="输入自动回复的邮件内容..."
            value={config.content}
            onChange={(e) => setConfig({ ...config, content: e.target.value })}
            rows={12}
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            提示：邮件内容支持多行文本，将按原格式发送。邮件主题将自动设置为"回复：原邮件标题"
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saved ? (
              <>
                <CheckCircle className="w-4 h-4" />
                已保存
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {saving ? "保存中..." : "保存设置"}
              </>
            )}
          </Button>
          {saved && <span className="text-sm text-green-500">设置已成功保存</span>}
        </div>
      </CardContent>
    </Card>
  )
}
