"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw, AlertCircle, Info, AlertTriangle, Trash2 } from "lucide-react"

interface Log {
  id: number
  level: string
  message: string
  email_account: string | null
  created_at: string
}

export function LogsTab() {
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(false)
  const [clearing, setClearing] = useState(false)

  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/logs")
      if (response.ok) {
        const data = await response.json()
        setLogs(data)
      }
    } catch (error) {
      console.error("Failed to fetch logs:", error)
    } finally {
      setLoading(false)
    }
  }

  const clearLogs = async () => {
    if (!confirm("确定要清空所有日志吗？此操作不可恢复。")) {
      return
    }

    setClearing(true)
    try {
      const response = await fetch("/api/logs", {
        method: "DELETE",
      })
      if (response.ok) {
        setLogs([])
      }
    } catch (error) {
      console.error("Failed to clear logs:", error)
      alert("清空日志失败")
    } finally {
      setClearing(false)
    }
  }

  const getLevelIcon = (level: string) => {
    switch (level) {
      case "ERROR":
        return <AlertCircle className="w-4 h-4 text-red-500" />
      case "WARNING":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      default:
        return <Info className="w-4 h-4 text-blue-500" />
    }
  }

  const getLevelBadge = (level: string) => {
    switch (level) {
      case "ERROR":
        return <Badge className="bg-red-500/10 text-red-500">错误</Badge>
      case "WARNING":
        return <Badge className="bg-yellow-500/10 text-yellow-500">警告</Badge>
      default:
        return <Badge className="bg-blue-500/10 text-blue-500">信息</Badge>
    }
  }

  const stats = {
    total: logs.length,
    errors: logs.filter((log) => log.level === "ERROR").length,
    warnings: logs.filter((log) => log.level === "WARNING").length,
    info: logs.filter((log) => log.level === "INFO").length,
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>系统日志</CardTitle>
            <CardDescription>
              查看邮件处理和系统运行日志
              {stats.total > 0 && (
                <span className="ml-2 text-xs">
                  (共 {stats.total} 条{stats.errors > 0 && <span className="text-red-500"> · {stats.errors} 错误</span>}
                  {stats.warnings > 0 && <span className="text-yellow-500"> · {stats.warnings} 警告</span>})
                </span>
              )}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {logs.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearLogs}
                disabled={clearing}
                className="gap-2 bg-transparent text-red-500 hover:text-red-600 hover:bg-red-500/10"
              >
                <Trash2 className="w-4 h-4" />
                清空
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading} className="gap-2 bg-transparent">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              刷新
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Info className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>暂无日志记录</p>
            <p className="text-sm">系统运行后将在此显示日志信息</p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-3 p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="mt-0.5">{getLevelIcon(log.level)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {getLevelBadge(log.level)}
                    {log.email_account && (
                      <Badge variant="outline" className="text-xs font-mono">
                        {log.email_account}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground ml-auto">
                      {new Date(log.created_at).toLocaleString("zh-CN", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-foreground break-words">{log.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
