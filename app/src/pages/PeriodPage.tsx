import { useMemo, useState } from 'react'
import { useToast } from '../components/Toast'
import { KEYS, dayKey, diffDays, load, save, parseDay } from '../services/store'

const CYCLE = 28
const PERIOD_LEN = 5

function CareCard({
  icon,
  title,
  text,
}: {
  icon: string
  title: string
  text: string
}) {
  return (
    <div className="rounded-[16px] glass p-3.5 shadow-[0_6px_18px_rgba(255,107,158,0.12)]">
      <p className="mb-1 flex items-center gap-1.5 text-[14px] font-semibold text-kitty-deep">
        <span className="text-lg">{icon}</span>
        {title}
      </p>
      <p className="text-[13px] leading-relaxed text-kitty-text">{text}</p>
    </div>
  )
}

export default function PeriodPage() {
  const { showToast } = useToast()
  const today = dayKey()
  const [year, setYear] = useState(() => new Date().getFullYear())
  const [month, setMonth] = useState(() => new Date().getMonth()) // 0-based
  const [days, setDays] = useState<Set<string>>(
    () => new Set(load<string[]>(KEYS.periodDays, [])),
  )

  const persist = (next: Set<string>) => {
    setDays(next)
    save(KEYS.periodDays, Array.from(next))
  }

  const toggleDay = (key: string) => {
    const next = new Set(days)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    persist(next)
    showToast(next.has(key) ? '已记录经期' : '已取消记录')
  }

  const recordToday = () => {
    if (days.has(today)) {
      showToast('今天已经记录过啦')
      return
    }
    const next = new Set(days)
    next.add(today)
    persist(next)
    showToast('记录成功，要好好照顾自己哦 💕')
  }

  const phase = useMemo(() => {
    const list = Array.from(days).sort()
    if (list.length === 0) return null

    // 把连续记录的日子归成一次经期（间隔 >2 天算新一轮）
    const runs: string[][] = []
    for (const d of list) {
      const lastRun = runs[runs.length - 1]
      if (lastRun && diffDays(lastRun[lastRun.length - 1], d) <= 2) lastRun.push(d)
      else runs.push([d])
    }
    const lastRun = runs.filter((r) => r[0] <= today).pop()
    if (!lastRun) return null
    const starts = runs.map((r) => r[0]).filter((s) => s <= today)
    const cycles: number[] = []
    for (let i = 1; i < starts.length; i++) {
      cycles.push(diffDays(starts[i - 1], starts[i]))
    }
    const avg = cycles.length
      ? Math.round(cycles.reduce((a, b) => a + b, 0) / cycles.length)
      : CYCLE

    const lastStart = lastRun[0]
    const lastCycle = cycles[cycles.length - 1]
    const trend = !lastCycle
      ? ''
      : lastCycle > avg
        ? ` · 上次推迟 ${lastCycle - avg} 天`
        : lastCycle < avg
          ? ` · 上次提前 ${avg - lastCycle} 天`
          : ' · 周期很规律'

    const since = diffDays(lastStart)
    if (since >= 0 && since < PERIOD_LEN) {
      return {
        text: `经期中 · 第 ${since + 1} 天`,
        sub: `本次已记录 ${lastRun.length} 天 · 平均周期 ${avg} 天${trend}`,
      }
    }

    // 按平均周期预测下次
    const nextDate = new Date(parseDay(lastStart))
    nextDate.setDate(nextDate.getDate() + avg)
    const toNext = diffDays(today, dayKey(nextDate))
    const inOvulation = since >= 12 && since <= 16
    return {
      text: `距离下次经期约 ${toNext} 天`,
      sub: `预计 ${nextDate.getMonth() + 1}月${nextDate.getDate()} 日来 · 平均周期 ${avg} 天${trend}${inOvulation ? ' · 易孕期注意防护哦' : ''}`,
    }
  }, [days, today])

  // 日历格子
  const cells = useMemo(() => {
    const first = new Date(year, month, 1)
    const startWeekday = first.getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const arr: Array<{ key: string; day: number; out: boolean } | null> = []
    for (let i = 0; i < startWeekday; i++) arr.push(null)
    for (let d = 1; d <= daysInMonth; d++) {
      arr.push({ key: dayKey(new Date(year, month, d)), day: d, out: false })
    }
    while (arr.length % 7 !== 0) arr.push(null)
    return arr
  }, [year, month])

  const shiftMonth = (delta: number) => {
    const d = new Date(year, month + delta, 1)
    setYear(d.getFullYear())
    setMonth(d.getMonth())
  }

  // 历史：按每次经期分组
  const history = useMemo(() => {
    const list = Array.from(days).sort()
    const runs: string[][] = []
    for (const d of list) {
      const lastRun = runs[runs.length - 1]
      if (lastRun && diffDays(lastRun[lastRun.length - 1], d) <= 2) lastRun.push(d)
      else runs.push([d])
    }
    return runs
      .slice()
      .reverse()
      .map((r) => ({
        start: r[0],
        len: r.length,
        last: r[r.length - 1],
      }))
      .slice(0, 8)
  }, [days])

  return (
    <div className="space-y-3 pb-4">
      {/* 日历卡片 */}
      <section className="relative overflow-hidden rounded-[18px] glass p-4 shadow-[0_8px_24px_rgba(255,107,158,0.14)]">
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-pink-50 text-kitty-deep"
            aria-label="上个月"
          >
            ◀
          </button>
          <h2 className="text-base font-semibold text-kitty-text">
            {year} 年 {month + 1} 月
          </h2>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-pink-50 text-kitty-deep"
            aria-label="下个月"
          >
            ▶
          </button>
        </div>

        <div className="mb-1 grid grid-cols-7 text-center text-xs text-kitty-muted">
          {['日', '一', '二', '三', '四', '五', '六'].map((w) => (
            <div key={w} className="py-1">{w}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-1 text-center">
          {cells.map((c, i) => {
            if (!c) return <div key={`e${i}`} />
            const active = days.has(c.key)
            const isToday = c.key === today
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => toggleDay(c.key)}
                className="mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm transition active:scale-90"
                style={
                  active
                    ? { background: '#ff6b9e', color: '#fff', fontWeight: 600 }
                    : isToday
                      ? { border: '1.5px solid #ff6b9e', color: '#e85a8b', fontWeight: 600 }
                      : { color: '#5d4037' }
                }
              >
                {c.day}
              </button>
            )
          })}
        </div>
        <p className="mt-2 text-center text-[11px] text-kitty-muted">
          点日子可以记录 / 取消经期
        </p>
      </section>

      {/* 当前阶段 */}
      <section className="rounded-[18px] glass p-4 text-center shadow-[0_8px_24px_rgba(255,107,158,0.14)]">
        <p className="text-[15px] font-semibold text-kitty-text">
          {phase ? phase.text : '当前阶段：暂无数据'}
        </p>
        <p className="mt-1 text-xs text-kitty-muted">
          {phase ? phase.sub : '点日历中的日期来记录经期吧 📅'}
        </p>
      </section>

      {/* 经期护理指南 */}
      <section>
        <h3 className="mb-2 px-1 text-[14px] font-semibold text-kitty-text">
          📋 经期护理指南
        </h3>
        <div className="space-y-2.5">
          <CareCard
            icon="🍽️"
            title="饮食"
            text="温补饮食为主。多喝红糖姜茶、热牛奶，多吃含铁食物（瘦肉、菠菜、红枣）。避免生冷、寒凉、辛辣食物。"
          />
          <CareCard
            icon="🏃"
            title="运动"
            text="轻度运动为主：散步、瑜伽拉伸。每次 20-30 分钟即可，不要勉强。避免剧烈运动、长时间站立或久坐。"
          />
          <CareCard
            icon="💪"
            title="身体"
            text="注意腹部和腰部保暖，可用暖宝宝或热水袋。保证 8 小时睡眠，避免熬夜。腹痛腰酸是正常现象，热水泡脚有助缓解。"
          />
          <CareCard
            icon="💖"
            title="情绪"
            text="激素波动容易情绪低落或易怒，这是完全正常的。听舒缓音乐、看轻松剧集，给自己多一些温柔和耐心。"
          />
          <CareCard
            icon="⚠️"
            title="避免"
            text="冷水洗浴、吃冷饮冰淇淋、喝咖啡浓茶、剧烈运动、熬夜通宵、过度劳累。"
          />
        </div>
      </section>

      {/* 记录今天 */}
      <button
        type="button"
        onClick={recordToday}
        className="w-full rounded-[18px] py-3.5 text-center text-[15px] font-semibold text-white shadow-[0_10px_24px_rgba(255,107,158,0.35)] transition active:scale-[0.98]"
        style={{ background: 'linear-gradient(90deg,#ff8fb3,#ff6b9e)' }}
      >
        📝 记录今天
      </button>

      {/* 历史记录 */}
      <section className="rounded-[18px] glass p-4 shadow-[0_8px_24px_rgba(255,107,158,0.14)]">
        <h3 className="mb-2 text-[14px] font-semibold text-kitty-text">📋 历史记录</h3>
        {history.length === 0 ? (
          <p className="py-3 text-center text-sm text-kitty-muted">暂无记录</p>
        ) : (
          <div className="space-y-2">
            {history.map((h, i) => {
              const older = history[i + 1]
              const gap = older ? diffDays(older.start, h.start) : null
              return (
                <div
                  key={h.start}
                  className="flex items-center justify-between rounded-xl bg-pink-50/70 px-3 py-2 text-xs"
                >
                  <span className="text-kitty-text">
                    🩸 {h.start.slice(5).replace('-', '月')}日开始 · 共{h.len}天
                  </span>
                  <span className="text-kitty-muted">
                    {gap === null
                      ? '首次记录'
                      : `周期 ${gap} 天`}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
