import { useEffect, useMemo, useRef, useState } from 'react'
import { cityNow } from '../services/store'
import type { WeatherData } from '../types/weather'

const OUTFITS = [
  { id: 4, name: '网球运动装' },
  { id: 8, name: '天鹅黄帽' },
  { id: 9, name: '卷发美女' },
  { id: 10, name: '顶美自拍' },
]

interface WorkCfg {
  start: string
  end: string
}

function workStatus(): string {
  try {
    const raw = localStorage.getItem('kitty_work_v2')
    const cfg: WorkCfg = raw ? JSON.parse(raw) : { start: '09:00', end: '17:00' }
    const now = cityNow()
    const [sh, sm] = cfg.start.split(':').map(Number)
    const [eh, em] = cfg.end.split(':').map(Number)
    const mins = now.getUTCHours() * 60 + now.getUTCMinutes()
    const s = sh * 60 + sm
    const e = eh * 60 + em
    if (mins < s) return 'before'
    if (mins < e) return 'working'
    return 'off'
  } catch {
    return 'working'
  }
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function talkLine(weather: WeatherData | null): string {
  const st = workStatus()
  const temp = weather?.temperature
  const desc = weather?.description ?? ''

  const byStatus: Record<string, string[]> = {
    before: ['早安呀～今天也要元气满满', '再睡五分钟？不行啦要上班啦', '今天想吃什么早餐呀'],
    working: ['加油哦，我在陪你摸鱼', '再坚持一下下就下班啦', '别太累，偷偷喝口水', '今天也要开心上班呀'],
    off: ['辛苦啦！快回家休息', '下班快乐～去吃好吃的', '今天你超棒的，奖励自己'],
  }

  const byWeather: string[] = []
  if (typeof temp === 'number') {
    if (temp <= 5) byWeather.push('今天好冷，多穿点别冻着', '零下啦，围巾安排上')
    else if (temp <= 12) byWeather.push('有点凉，外套穿好', '降温啦，别只要风度不要温度')
    else if (temp <= 22) byWeather.push('今天温度刚刚好', '好舒服的天气，心情都会变好')
    else if (temp <= 30) byWeather.push('有点热啦，注意补水', '大太阳下记得防晒')
    else byWeather.push('太热啦，多喝水别中暑')
  }
  if (desc.includes('雨')) byWeather.push('下雨了，记得带伞哦', '雨天路滑，慢慢走')
  if (desc.includes('雪')) byWeather.push('下雪啦，好浪漫但路滑')
  if (desc.includes('阴')) byWeather.push('阴天也没关系，你就是小太阳')

  // 70% 状态相关，30% 天气相关
  return Math.random() < 0.7 ? pick(byStatus[st]) : pick(byWeather.length ? byWeather : byStatus.working)
}

interface Props {
  visible: boolean
  weather: WeatherData | null
}

export default function PetWidget({ visible, weather }: Props) {
  const [idx, setIdx] = useState(0)
  const [line, setLine] = useState(() => talkLine(weather))
  const petImgRef = useRef<HTMLImageElement | null>(null)

  // 跟着音乐节奏动
  useEffect(() => {
    let raf = 0
    const loop = () => {
      const b = (window as unknown as { __beat?: number }).__beat || 0
      if (petImgRef.current) {
        const s = 1 + b * 0.15
        petImgRef.current.style.transform = `translateY(${-b * 8}px) scale(${s})`
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  // 每 12 秒换一句
  useEffect(() => {
    if (!visible) return
    const t = window.setInterval(() => setLine(talkLine(weather)), 12000)
    return () => window.clearInterval(t)
  }, [visible, weather])

  const outfit = OUTFITS[idx]
  const bubble = useMemo(() => line, [line])

  if (!visible) return null

  return (
    <button
      type="button"
      onClick={() => {
        setIdx((i) => (i + 1) % OUTFITS.length)
        setLine(talkLine(weather))
      }}
      className="fixed bottom-24 right-3 z-40 flex flex-col items-center transition-transform active:scale-90"
      aria-label="点我换衣服"
    >
      {/* 气泡 */}
      <div className="relative mb-1 max-w-[160px] rounded-2xl rounded-br-sm bg-white/90 px-3 py-1.5 text-center text-[11px] leading-snug text-kitty-deep shadow-md">
        {bubble}
        <span className="absolute -bottom-1 right-3 h-2 w-2 rotate-45 bg-white/90" />
      </div>
      {/* 固定位置：统一高度，水平居中 */}
      <div className="flex h-[110px] w-[120px] items-end justify-center">
        <img
          ref={petImgRef}
          src={`/pet/pet${outfit.id}.png?v=3`}
          alt={outfit.name}
          className="h-[110px] w-auto object-contain"
        />
      </div>
      <span className="mt-0.5 rounded-full bg-white/70 px-2 py-0.5 text-[10px] text-kitty-deep">
        {outfit.name}
      </span>
    </button>
  )
}
