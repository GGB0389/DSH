import { useEffect, useState } from 'react'
import WorkEncourager from '../components/WorkEncourager'
import PetWidget from '../components/PetWidget'
import { KEYS, dayKey, diffDays, load, cityNow } from '../services/store'
import { fetchWeatherByCity } from '../services/weatherService'
import type { GeoLocation, WeatherData } from '../types/weather'

function greeting(): string {
  const h = cityNow().getUTCHours()
  if (h < 6) return '夜深了'
  if (h < 11) return '早上好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
}

/** 距离她的生日（9月5日）还有几天 */
function daysToBirthday(): number {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  let next = new Date(now.getFullYear(), 8, 5)
  if (next.getTime() < today.getTime()) next = new Date(now.getFullYear() + 1, 8, 5)
  return Math.round((next.getTime() - today.getTime()) / 86400000)
}

export default function HomePage() {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [petVisible, setPetVisible] = useState(true)

  // 今日天气（读已保存城市）
  useEffect(() => {
    const raw = localStorage.getItem('kitty_weather_city_v1')
    if (!raw) return
    try {
      const city = JSON.parse(raw) as GeoLocation
      void fetchWeatherByCity(city).then(setWeather).catch(() => undefined)
    } catch {
      // 忽略
    }
  }, [])

  // 今日打卡数
  const todayHabitKey = dayKey()
  const habits = load<Record<string, Record<string, boolean>>>(KEYS.habits, {})
  const todayDone = Object.keys(habits[todayHabitKey] || {}).length

  // 待办数
  const todos = load<Array<{ done: boolean }>>(KEYS.todos, [])
  const undone = todos.filter((t) => !t.done).length

  // 下次经期
  const periodDays = load<string[]>(KEYS.periodDays, [])
  let periodText = '暂无数据'
  if (periodDays.length > 0) {
    const today = todayHabitKey
    const past = periodDays.filter((d) => d <= today).sort()
    if (past.length > 0) {
      const last = past[past.length - 1]
      const since = diffDays(last)
      if (since < 5) periodText = `经期第 ${since + 1} 天`
      else periodText = `约 ${Math.max(0, 28 - since)} 天后`
    }
  }

  return (
    <div className="space-y-3 pb-4">
      {/* 问候 + 打气 */}
      <div className="flex items-center justify-between px-1">
        <p className="text-sm text-kitty-muted">{greeting()}</p>
        <p className="text-xs text-kitty-deep">🎂 生日倒计时 {daysToBirthday()} 天</p>
      </div>
      <div
        className="relative overflow-hidden rounded-[18px] px-4 py-6 text-center shadow-[0_10px_24px_rgba(255,107,158,0.2)]"
        style={{ background: 'linear-gradient(135deg,#ffd6e6,#ffb9d1)' }}
      >
        <button
          type="button"
          onClick={() => setPetVisible((v) => !v)}
          aria-label="切换桌宠"
          className="absolute right-3 top-1 text-3xl opacity-80 transition-transform active:scale-90"
        >
          🎀
        </button>
        <p className="text-[17px] font-bold tracking-wide text-white drop-shadow-sm">
          加油，你是最棒的小宝宝！
        </p>
      </div>

      {/* 上班鼓励器 */}
      <WorkEncourager />

      {/* 四宫格 */}
      <div className="grid grid-cols-2 gap-2.5">
        <MiniCard
          icon="🌥️"
          label="今日天气"
          value={weather ? `${Math.round(weather.temperature)}° ${weather.description}` : '加载中…'}
        />
        <MiniCard icon="📅" label="下次经期" value={periodText} />
        <MiniCard icon="💪" label="今日打卡" value={`${todayDone}/9`} />
        <MiniCard icon="✅" label="待办事项" value={`${undone} 项`} />
      </div>

      <div className="h-10" />
      <PetWidget visible={petVisible} weather={weather} />
    </div>
  )
}

function MiniCard({
  icon,
  label,
  value,
}: {
  icon: string
  label: string
  value: string
}) {
  return (
    <div className="rounded-[18px] glass p-4 text-center shadow-[0_8px_24px_rgba(255,107,158,0.12)]">
      <div className="mb-1.5 text-2xl">{icon}</div>
      <div className="text-xs text-kitty-muted">{label}</div>
      <div className="mt-1 text-[15px] font-semibold text-kitty-text">{value}</div>
    </div>
  )
}
