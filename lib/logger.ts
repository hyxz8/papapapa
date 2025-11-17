import fs from "fs"
import path from "path"

export interface LogEntry {
  id: number
  level: "INFO" | "WARNING" | "ERROR"
  message: string
  email_account: string | null
  created_at: string
}

/**
 * 日志管理器
 * 使用内存存储 + 文件持久化
 */
class Logger {
  private logs: LogEntry[] = []
  private logFilePath: string
  private maxLogs = 1000 // 最多保留1000条日志
  private nextId = 1

  constructor() {
    // 日志文件存储在项目根目录的 logs 文件夹
    const logsDir = path.join(process.cwd(), "logs")
    this.logFilePath = path.join(logsDir, "app.log")

    // 确保日志目录存在
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true })
    }

    // 启动时加载已有日志
    this.loadLogs()
  }

  /**
   * 从文件加载日志
   */
  private loadLogs() {
    try {
      if (fs.existsSync(this.logFilePath)) {
        const data = fs.readFileSync(this.logFilePath, "utf-8")
        const lines = data.trim().split("\n").filter(Boolean)

        this.logs = lines
          .map((line) => {
            try {
              return JSON.parse(line) as LogEntry
            } catch {
              return null
            }
          })
          .filter((log): log is LogEntry => log !== null)

        // 更新下一个ID
        if (this.logs.length > 0) {
          this.nextId = Math.max(...this.logs.map((log) => log.id)) + 1
        }

        // 只保留最新的日志
        if (this.logs.length > this.maxLogs) {
          this.logs = this.logs.slice(-this.maxLogs)
        }
      }
    } catch (error) {
      console.error("加载日志文件失败:", error)
      this.logs = []
    }
  }

  /**
   * 保存日志到文件
   */
  private saveLogs() {
    try {
      // 只保存最新的日志到文件
      const logsToSave = this.logs.slice(-this.maxLogs)
      const data = logsToSave.map((log) => JSON.stringify(log)).join("\n") + "\n"
      fs.writeFileSync(this.logFilePath, data, "utf-8")
    } catch (error) {
      console.error("保存日志文件失败:", error)
    }
  }

  /**
   * 添加日志
   */
  log(level: "INFO" | "WARNING" | "ERROR", message: string, emailAccount?: string) {
    const logEntry: LogEntry = {
      id: this.nextId++,
      level,
      message,
      email_account: emailAccount || null,
      created_at: new Date().toISOString(),
    }

    this.logs.push(logEntry)

    // 控制台输出
    const prefix = `[${level}]`
    const suffix = emailAccount ? ` (${emailAccount})` : ""
    console.log(`${prefix} ${message}${suffix}`)

    // 如果日志过多，删除旧日志
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }

    // 异步保存到文件（不阻塞）
    setImmediate(() => this.saveLogs())
  }

  /**
   * 获取所有日志（按时间倒序）
   */
  getLogs(): LogEntry[] {
    return [...this.logs].reverse()
  }

  /**
   * 获取最近N条日志
   */
  getRecentLogs(count: number): LogEntry[] {
    return [...this.logs].reverse().slice(0, count)
  }

  /**
   * 清空日志
   */
  clearLogs() {
    this.logs = []
    this.nextId = 1
    try {
      if (fs.existsSync(this.logFilePath)) {
        fs.unlinkSync(this.logFilePath)
      }
    } catch (error) {
      console.error("删除日志文件失败:", error)
    }
  }

  /**
   * 按级别筛选日志
   */
  getLogsByLevel(level: "INFO" | "WARNING" | "ERROR"): LogEntry[] {
    return this.logs.filter((log) => log.level === level).reverse()
  }

  /**
   * 按邮箱账号筛选日志
   */
  getLogsByAccount(emailAccount: string): LogEntry[] {
    return this.logs.filter((log) => log.email_account === emailAccount).reverse()
  }
}

// 单例模式
let loggerInstance: Logger | null = null

export function getLogger(): Logger {
  if (!loggerInstance) {
    loggerInstance = new Logger()
  }
  return loggerInstance
}

// 便捷函数
export function logInfo(message: string, emailAccount?: string) {
  getLogger().log("INFO", message, emailAccount)
}

export function logWarning(message: string, emailAccount?: string) {
  getLogger().log("WARNING", message, emailAccount)
}

export function logError(message: string, emailAccount?: string) {
  getLogger().log("ERROR", message, emailAccount)
}
