import { useMemo, useState } from 'react'
import { useToast } from '../components/Toast'
import { KEYS, dayKey, load, save } from '../services/store'

const HABITS = [
  { id: 'water', icon: '💧', name: '喝水', hint: '今天还没开始喝水哦，点击记录每一杯~' },
  { id: 'fruit', icon: '🍎', name: '吃水果', hint: '点击打卡完成今天的任务~' },
  { id: 'sleep', icon: '😴', name: '睡觉时间', hint: '点击记录今晚睡觉时间 🌙' },
  { id: 'skin', icon: '🧴', name: '认真护肤', hint: '点击打卡完成今天的任务~' },
  { id: 'housework', icon: '🏠', name: '做家务', hint: '点击打卡完成今天的任务~' },
  { id: 'stretch', icon: '🧘', name: '拉伸放松', hint: '点击打卡完成今天的任务~' },
  { id: 'vitc', icon: '💊', name: '补充维C', hint: '点击打卡完成今天的任务~' },
  { id: 'walk', icon: '🚶', name: '散步', hint: '点击打卡完成今天的任务~' },
  { id: 'read', icon: '📖', name: '阅读', hint: '点击打卡完成今天的任务~' },
]

type HabitMap = Record<string, Record<string, boolean>>

export default function HabitsPage() {
  const { showToast } = useToast()
  const [offset, setOffset] = useState(0)
  const [all, setAll] = useState<HabitMap>(() => load(KEYS.habits, {}))

  const viewDate = new Date()
  viewDate.setDate(viewDate.getDate() + offset)
  const key = dayKey(viewDate)
  const isToday = offset === 0

  const done = all[key] || {}
  const doneCount = HABITS.filter((h) => done[h.id]).length

  const toggle = (id: string, name: string) => {
    const next: HabitMap = { ...all, [key]: { ...done } }
    if (next[key][id]) {
      delete next[key][id]
      showToast(`已取消「${name}」`)
    } else {
      next[key][id] = true
      showToast(`打卡成功：${name} 🎉`)
    }
    setAll(next)
    save(KEYS.habits, next)
  }

  const label = useMemo(() => {
    const m = viewDate.getMonth() + 1
    const d = viewDate.getDate()
    if (offset === 0) return `今日打卡 ${m}月${d}日`
    if (offset === -1) return `昨日打卡 ${m}月${d}日`
    return `${m}月${d}日`
  }, [offset])

  return (
    <div className="space-y-3 pb-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-[15px] font-semibold text-kitty-text">
          {label}
          <span className="ml-2 rounded-full bg-pink-100 px-2 py-0.5 text-xs font-medium text-kitty-deep">
            {doneCount}/{HABITS.length}
          </span>
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOffset((o) => o - 1)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-kitty-deep shadow-sm"
            aria-label="前一天"
          >
            ‹
          </button>
          {!isToday && (
            <button
              type="button"
              onClick={() => setOffset(0)}
              className="rounded-full bg-pink-50 px-2.5 py-1 text-xs text-kitty-deep"
            >
              今天
            </button>
          )}
          <button
            type="button"
            onClick={() => setOffset((o) => o + 1)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-kitty-deep shadow-sm"
            aria-label="后一天"
          >
            ›
          </button>
        </div>
      </div>

      <section className="overflow-hidden rounded-[18px] glass">
        {HABITS.map((h, i) => {
          const checked = !!done[h.id]
          return (
            <button
              key={h.id}
              type="button"
              onClick={() => toggle(h.id, h.name)}
              className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition active:bg-pink-50 ${
                i !== HABITS.length - 1 ? 'border-b border-dashed border-pink-100' : ''
              }`}
            >
              <span className="text-2xl">{h.icon}</span>
              <span className="flex-1">
                <span className="block text-[14px] font-semibold text-kitty-text">
                  {h.name}
                </span>
                <span className={`mt-0.5 block text-xs ${checked ? 'text-kitty-deep' : 'text-kitty-muted'}`}>
                  {checked ? '今日已完成，真棒~ 🌸' : h.hint}
                </span>
              </span>
              <span
                className="flex h-6 w-6 items-center justify-center rounded-full border-2 text-xs"
                style={
                  checked
                    ? { background: '#ff6b9e', borderColor: '#ff6b9e', color: '#fff' }
                    : { borderColor: '#ffc2d1', color: 'transparent' }
                }
              >
                ✓
              </span>
            </button>
          )
        })}
      </section>
    </div>
  )
}
