// 本地存储工具：恋爱起始日、经期记录、习惯打卡、待办
export const KEYS = {
  loveStart: 'kitty_love_start_v1',
  periodDays: 'kitty_period_days_v1',
  habits: 'kitty_habits_v1',
  todos: 'kitty_todos_v1',
} as const

export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // 忽略写入失败
  }
}

/** 本地时区的 YYYY-MM-DD */
export function dayKey(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseDay(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function diffDays(from: string, to: string = dayKey()): number {
  const a = parseDay(from).getTime()
  const b = parseDay(to).getTime()
  return Math.round((b - a) / 86400000)
}

export const WEEK_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

/**
 * 按天气城市的当地时间返回一个 Date。
 * 用它的 getUTCHours / getUTCMinutes / getUTCDate 等读取当地墙钟时间。
 */
export function cityNow(): Date {
  let offsetSec = 0
  try {
    offsetSec = Number(localStorage.getItem('kitty_weather_tz_v1') || 0) || 0
  } catch {
    offsetSec = 0
  }
  return new Date(Date.now() + offsetSec * 1000)
}
