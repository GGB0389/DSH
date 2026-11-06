import { useEffect, useMemo, useState } from 'react'
import { cityNow } from '../services/store'

const STORE_KEY = 'kitty_work_v2'

interface WorkSettings {
  start: string
  end: string
  monthly: number
  workdays: number
}

const DEFAULT: WorkSettings = {
  start: '09:00',
  end: '17:00',
  monthly: 10000,
  workdays: 22,
}

function loadSettings(): WorkSettings {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    return raw ? { ...DEFAULT, ...JSON.parse(raw) } : DEFAULT
  } catch {
    return DEFAULT
  }
}

function fmtHMS(ms: number): string {
  if (ms < 0) ms = 0
  const s = Math.floor(ms / 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return `${h}小时${String(m).padStart(2, '0')}分${String(sec).padStart(2, '0')}秒`
}

export default function WorkEncourager() {
  const [settings, setSettings] = useState<WorkSettings>(loadSettings)
  const [editing, setEditing] = useState(false)
  const [now, setNow] = useState<Date>(() => cityNow())

  useEffect(() => {
    const t = window.setInterval(() => setNow(cityNow()), 100)
    return () => window.clearInterval(t)
  }, [])

  const save = (next: WorkSettings) => {
    setSettings(next)
    localStorage.setItem(STORE_KEY, JSON.stringify(next))
  }

  const calc = useMemo(() => {
    const [sh, sm] = settings.start.split(':').map(Number)
    const [eh, em] = settings.end.split(':').map(Number)
    const workMs = (eh * 60 + em - sh * 60 - sm) * 60000
    const dailyWage = settings.monthly / settings.workdays
    const hourly = dailyWage / (workMs / 3600000)
    const perSec = hourly / 3600

    const start = new Date(now)
    start.setUTCHours(sh, sm, 0, 0)
    const end = new Date(now)
    end.setUTCHours(eh, em, 0, 0)

    let status = '上班中'
    let elapsed = 0
    let remain = 0
    if (now < start) {
      status = '还没上班'
      remain = start.getTime() - now.getTime()
    } else if (now < end) {
      elapsed = now.getTime() - start.getTime()
      remain = end.getTime() - now.getTime()
    } else {
      status = '已下班'
      elapsed = workMs
    }
    const earned = Math.min(dailyWage, (elapsed / 1000) * perSec)
    const progress = Math.max(0, Math.min(1, elapsed / workMs))

    // 本月已过工作日
    const year = now.getUTCFullYear()
    const month = now.getUTCMonth()
    let weekdays = 0
    const todayDate = now.getUTCDate()
    for (let d = 1; d <= todayDate; d++) {
      const wd = new Date(Date.UTC(year, month, d)).getUTCDay()
      if (wd !== 0 && wd !== 6) weekdays++
    }
    const monthEarned = weekdays * dailyWage

    return { status, remain, earned, perSec, progress, dailyWage, hourly, monthEarned, workH: workMs / 3600000 }
  }, [now, settings])

  return (
    <section className="glass rounded-[20px] p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[15px] font-semibold text-kitty-text">💼 上班鼓励器</h3>
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          className="rounded-full bg-white/60 px-3 py-1 text-xs text-kitty-deep"
        >
          {editing ? '完成' : '设置'}
        </button>
      </div>

      {editing ? (
        <div className="space-y-2">
          <label className="flex items-center justify-between text-sm text-kitty-text">
            上班时间
            <input
              type="time"
              value={settings.start}
              onChange={(e) => save({ ...settings, start: e.target.value })}
              className="rounded-lg bg-white/70 px-2 py-1 text-sm outline-none"
            />
          </label>
          <label className="flex items-center justify-between text-sm text-kitty-text">
            下班时间
            <input
              type="time"
              value={settings.end}
              onChange={(e) => save({ ...settings, end: e.target.value })}
              className="rounded-lg bg-white/70 px-2 py-1 text-sm outline-none"
            />
          </label>
          <label className="flex items-center justify-between text-sm text-kitty-text">
            月工资（元）
            <input
              type="number"
              value={settings.monthly}
              onChange={(e) => save({ ...settings, monthly: Number(e.target.value) || 0 })}
              className="w-28 rounded-lg bg-white/70 px-2 py-1 text-sm outline-none"
            />
          </label>
          <label className="flex items-center justify-between text-sm text-kitty-text">
            月工作天数
            <input
              type="number"
              value={settings.workdays}
              onChange={(e) => save({ ...settings, workdays: Number(e.target.value) || 22 })}
              className="w-28 rounded-lg bg-white/70 px-2 py-1 text-sm outline-none"
            />
          </label>
        </div>
      ) : (
        <>
          <div className="mb-3 flex items-center justify-between text-sm">
            <span className="text-kitty-muted">状态</span>
            <span className="rounded-full bg-kitty-pink px-2.5 py-0.5 text-xs font-medium text-white">
              {calc.status}
            </span>
          </div>

          <div className="mb-3 flex items-end justify-between">
            <div>
              <div className="text-xs text-kitty-muted">
                {calc.status === '已下班'
                  ? '今天已赚'
                  : calc.status === '还没上班'
                    ? '距离上班'
                    : '距离下班'}
              </div>
              <div className="text-2xl font-bold text-kitty-deep">
                {calc.status === '已下班'
                  ? `¥ ${calc.dailyWage.toFixed(2)}`
                  : fmtHMS(calc.remain)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-kitty-muted">赚钱速度</div>
              <div className="text-lg font-semibold text-kitty-deep">
                ¥ {calc.perSec.toFixed(4)} <span className="text-xs font-normal">/秒</span>
              </div>
            </div>
          </div>

          <div className="mb-1 flex items-end justify-between">
            <div>
              <div className="text-xs text-kitty-muted">今日已赚</div>
              <div className="text-3xl font-bold text-kitty-pink">
                ¥ {calc.earned.toFixed(4)}
              </div>
            </div>
            <div className="text-right text-xs text-kitty-muted">
              今日满勤可得 ¥ {calc.dailyWage.toFixed(2)}
            </div>
          </div>

          {/* 进度条 */}
          <div className="mt-3">
            <div className="mb-1 flex justify-between text-[11px] text-kitty-muted">
              <span>工作进度</span>
              <span>{(calc.progress * 100).toFixed(1)}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/60">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${calc.progress * 100}%`,
                  background: 'linear-gradient(90deg,#ffb3cd,#ff6b9e)',
                }}
              />
            </div>
          </div>

          <p className="mt-3 text-center text-xs text-kitty-muted">
            {calc.status === '已下班'
              ? '辛苦啦！今天也很棒，早点休息 🌸'
              : calc.status === '还没上班'
                ? `还有 ${fmtHMS(calc.remain)} 上班，今天也要元气满满哦~`
                : `再过 ${fmtHMS(calc.remain)} 就下班啦，加油美少女 💗`}
          </p>
        </>
      )}
    </section>
  )
}
