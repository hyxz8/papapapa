import Database from "better-sqlite3"
import { createHash } from "crypto"
import path from "path"

const DB_PATH = path.join(process.cwd(), "email_auto_reply.db")

// 创建数据库连接单例
let db: Database.Database | null = null

function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH)
    db.pragma("journal_mode = WAL")
  }
  return db
}

// MD5加密函数
export function md5Hash(password: string): string {
  return createHash("md5").update(password).digest("hex")
}

// 管理员相关操作
export const adminDb = {
  // 验证管理员登录
  verifyAdmin(username: string, password: string): boolean {
    const db = getDb()
    const hashedPassword = md5Hash(password)
    const stmt = db.prepare("SELECT * FROM admin_users WHERE username = ? AND password = ?")
    const user = stmt.get(username, hashedPassword)
    return !!user
  },

  // 更新管理员密码
  updatePassword(username: string, newPassword: string): boolean {
    const db = getDb()
    const hashedPassword = md5Hash(newPassword)
    const stmt = db.prepare("UPDATE admin_users SET password = ?, updated_at = ? WHERE username = ?")
    const result = stmt.run(hashedPassword, new Date().toISOString(), username)
    return result.changes > 0
  },
}

// 邮箱账号相关操作
export const emailAccountDb = {
  // 获取所有邮箱账号
  getAll(): any[] {
    const db = getDb()
    const stmt = db.prepare("SELECT * FROM email_accounts ORDER BY created_at DESC")
    return stmt.all()
  },

  // 获取所有激活的邮箱账号
  getActive(): any[] {
    const db = getDb()
    const stmt = db.prepare("SELECT * FROM email_accounts WHERE is_active = 1 ORDER BY created_at DESC")
    return stmt.all()
  },

  // 添加邮箱账号
  add(data: {
    email: string
    imap_server: string
    imap_port: number
    smtp_server: string
    smtp_port: number
    password: string
  }): any {
    const db = getDb()
    const now = new Date().toISOString()
    const stmt = db.prepare(`
      INSERT INTO email_accounts (email, imap_server, imap_port, smtp_server, smtp_port, password, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
    `)
    const result = stmt.run(
      data.email,
      data.imap_server,
      data.imap_port,
      data.smtp_server,
      data.smtp_port,
      data.password,
      now,
      now,
    )
    return { id: result.lastInsertRowid, ...data, is_active: 1, created_at: now, updated_at: now }
  },

  // 删除邮箱账号
  delete(id: number): boolean {
    const db = getDb()
    const stmt = db.prepare("DELETE FROM email_accounts WHERE id = ?")
    const result = stmt.run(id)
    return result.changes > 0
  },

  // 更新邮箱账号状态
  updateStatus(id: number, is_active: number): boolean {
    const db = getDb()
    const stmt = db.prepare("UPDATE email_accounts SET is_active = ?, updated_at = ? WHERE id = ?")
    const result = stmt.run(is_active, new Date().toISOString(), id)
    return result.changes > 0
  },
}

// 回复配置相关操作
export const replyConfigDb = {
  // 获取回复配置
  get(): any {
    const db = getDb()
    const stmt = db.prepare("SELECT * FROM reply_config ORDER BY id DESC LIMIT 1")
    return stmt.get()
  },

  update(content: string): boolean {
    const db = getDb()
    const config = this.get()

    if (config) {
      const stmt = db.prepare(
        "UPDATE reply_config SET content = ?, updated_at = ? WHERE id = ?",
      )
      const result = stmt.run(content, new Date().toISOString(), config.id)
      return result.changes > 0
    } else {
      const stmt = db.prepare(
        "INSERT INTO reply_config (content, updated_at) VALUES (?, ?)",
      )
      const result = stmt.run(content, new Date().toISOString())
      return result.changes > 0
    }
  },
}

// 已处理邮件相关操作
export const processedEmailDb = {
  // 检查邮件是否已处理
  isProcessed(emailAccount: string, messageId: string): boolean {
    const db = getDb()
    const stmt = db.prepare("SELECT * FROM processed_emails WHERE email_account = ? AND message_id = ?")
    const result = stmt.get(emailAccount, messageId)
    return !!result
  },

  // 标记邮件为已处理
  markAsProcessed(emailAccount: string, messageId: string, sender: string, subject: string): boolean {
    const db = getDb()
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO processed_emails (email_account, message_id, sender, subject, processed_at)
      VALUES (?, ?, ?, ?, ?)
    `)
    const result = stmt.run(emailAccount, messageId, sender, subject, new Date().toISOString())
    return result.changes > 0
  },
}

// 日志相关操作（保留在数据库中作为备份）
export const logDb = {
  // 添加日志
  add(level: string, message: string, emailAccount?: string): void {
    const db = getDb()
    const stmt = db.prepare("INSERT INTO logs (level, message, email_account, created_at) VALUES (?, ?, ?, ?)")
    stmt.run(level, message, emailAccount || null, new Date().toISOString())
  },

  // 获取日志
  getAll(limit = 1000): any[] {
    const db = getDb()
    const stmt = db.prepare("SELECT * FROM logs ORDER BY created_at DESC LIMIT ?")
    return stmt.all(limit)
  },

  // 清空日志
  clear(): boolean {
    const db = getDb()
    const stmt = db.prepare("DELETE FROM logs")
    const result = stmt.run()
    return result.changes > 0
  },
}

export default getDb
