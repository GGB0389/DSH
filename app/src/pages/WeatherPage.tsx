import { useCallback, useEffect, useState } from 'react'
import CitySearchSheet from '../components/CitySearchSheet'
import WeatherSkeleton from '../components/WeatherSkeleton'
import { useToast } from '../components/Toast'
import type { CitySearchItem, GeoLocation, WeatherData } from '../types/weather'
import {
  fetchWeatherByCity,
  getDefaultCity,
  locateUserCity,
} from '../services/weatherService'

const STORAGE_KEY = 'kitty_weather_city_v1'

function loadSavedCity(): GeoLocation | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as GeoLocation) : null
  } catch {
    return null
  }
}

function saveCity(city: GeoLocation) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(city))
}

export default function WeatherPage() {
  const { showToast } = useToast()
  const [location, setLocation] = useState<GeoLocation | null>(null)
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [bootstrapped, setBootstrapped] = useState(false)

  const loadWeather = useCallback(
    async (city: GeoLocation, opts?: { silent?: boolean }) => {
      if (!opts?.silent) setLoading(true)
      else setRefreshing(true)

      try {
        const data = await fetchWeatherByCity(city)
        setWeather(data)
        setLocation(city)
        saveCity(city)
      } catch {
        showToast('天气获取失败，请稍后重试')
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [showToast],
  )

  // 首次进入：优先已保存城市 → 自动定位 → 默认北京
  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      const saved = loadSavedCity()
      if (saved) {
        if (!cancelled) {
          setLocation(saved)
          setBootstrapped(true)
        }
        return
      }

      try {
        const located = await locateUserCity()
        if (!cancelled) {
          setLocation(located)
          showToast(`已定位到 ${located.city}`)
        }
      } catch {
        const fallback = getDefaultCity()
        if (!cancelled) {
          setLocation(fallback)
          showToast('定位失败，已切换至默认城市')
        }
      } finally {
        if (!cancelled) setBootstrapped(true)
      }
    }

    void bootstrap()
    return () => {
      cancelled = true
    }
  }, [showToast])

  // 城市变化时重新请求天气
  useEffect(() => {
    if (!bootstrapped || !location) return
    void loadWeather(location)
  }, [bootstrapped, location?.latitude, location?.longitude, location?.city]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleRefresh = async () => {
    if (!location || refreshing) return
    await loadWeather(location, { silent: true })
    showToast('天气已刷新')
  }

  const handleRelocate = async () => {
    setRefreshing(true)
    try {
      const located = await locateUserCity()
      setLocation(located)
      showToast(`已定位到 ${located.city}`)
    } catch {
      showToast('定位失败，请手动搜索城市')
    } finally {
      setRefreshing(false)
    }
  }

  const handleSelectCity = (item: CitySearchItem) => {
    setSheetOpen(false)
    setLocation({
      latitude: item.latitude,
      longitude: item.longitude,
      city: item.name,
      admin1: item.admin1,
      country: item.country,
    })
    showToast(`已切换到 ${item.name}`)
  }

  return (
    <div className="pb-4">
      {/* 顶部：定位 + 城市 + 刷新 */}
      <div className="mb-3 flex items-center justify-center gap-2 text-sm text-kitty-muted">
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-full glass-soft px-3 py-1.5 shadow-sm"
          onClick={() => setSheetOpen(true)}
        >
          <span>📍</span>
          <span className="font-medium text-kitty-text">
            {location?.city || '定位中…'}
          </span>
          <span className="text-kitty-pink">▾</span>
        </button>
        <button
          type="button"
          className={`rounded-full glass-soft px-2.5 py-1.5 shadow-sm ${refreshing ? 'animate-spin' : ''}`}
          title="刷新天气"
          onClick={() => void handleRefresh()}
        >
          🔄
        </button>
        <button
          type="button"
          className="rounded-full glass-soft px-2.5 py-1.5 text-xs text-kitty-deep shadow-sm"
          onClick={() => void handleRelocate()}
        >
          重新定位
        </button>
      </div>

      {loading || !weather ? (
        <WeatherSkeleton />
      ) : (
        <div className="space-y-3">
          {/* 主天气卡片 */}
          <section className="glass-pink relative overflow-hidden rounded-[22px] p-5 text-center">
            <div className="relative z-10 mb-2 text-sm text-kitty-muted">
              📍 {weather.city}
            </div>
            <div className="relative z-10 mb-4 flex items-center justify-center gap-3">
              <div className="text-5xl">{weather.icon}</div>
              <div className="text-left">
                <div className="text-5xl font-bold leading-none text-kitty-text">
                  {Math.round(weather.temperature)}
                  <span className="text-3xl">°</span>
                </div>
                <div className="mt-1 text-sm text-kitty-muted">{weather.description}</div>
              </div>
            </div>

            <div className="relative z-10 grid grid-cols-3 gap-2 border-t border-dashed border-pink-200 pt-3">
              {weather.forecast.map((day) => (
                <div
                  key={day.date}
                  className="rounded-xl bg-white/50 px-2 py-2"
                >
                  <div className="text-xs text-kitty-muted">{day.weekLabel}</div>
                  <div className="my-1 text-xl">{day.icon}</div>
                  <div className="text-xs text-kitty-text">
                    {day.tempMin}°-{day.tempMax}°
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 指标卡片 */}
          <section className="grid grid-cols-3 gap-2.5">
            <MetricCard icon="🌡️" label="体感温度" value={`${Math.round(weather.feelsLike)}°`} />
            <MetricCard icon="💧" label="湿度" value={`${weather.humidity}%`} />
            <MetricCard icon="🍃" label="风力" value={weather.windText} />
          </section>

          {/* 今日建议 */}
          <section className="rounded-[20px] glass p-4">
            <h3 className="mb-1 text-[15px] font-semibold text-kitty-text">🌸 今日建议</h3>
            <TipRow icon="👗" title="穿衣" text={weather.tips.clothing} />
            <TipRow icon="🧴" title="护肤" text={weather.tips.skincare} />
            <TipRow icon="🌡️" title="温差" text={weather.tips.temperature} />
            <TipRow icon="💡" title="心情" text={weather.tips.mood} last />
          </section>
        </div>
      )}

      <CitySearchSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSelect={handleSelectCity}
      />
    </div>
  )
}

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: string
  label: string
  value: string
}) {
  return (
    <div className="min-h-[96px] rounded-[18px] glass p-3 text-center shadow-[0_8px_24px_rgba(255,107,158,0.12)] backdrop-blur-md">
      <div className="mb-1.5 text-[22px]">{icon}</div>
      <div className="mb-1 text-xs text-kitty-muted">{label}</div>
      <div className="text-sm font-semibold leading-snug text-kitty-text">{value}</div>
    </div>
  )
}

function TipRow({
  icon,
  title,
  text,
  last,
}: {
  icon: string
  title: string
  text: string
  last?: boolean
}) {
  return (
    <div
      className={`flex items-start gap-2 py-2 ${
        last ? '' : 'border-b border-dashed border-pink-200'
      }`}
    >
      <span className="text-lg">{icon}</span>
      <p className="text-[13px] leading-relaxed text-kitty-text">
        <b className="font-semibold text-kitty-deep">{title}：</b>
        {text}
      </p>
    </div>
  )
}
