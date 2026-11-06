import { useEffect, useState } from 'react'
import type { CitySearchItem } from '../types/weather'
import { searchCities, HOT_CITIES } from '../services/weatherService'

interface Props {
  open: boolean
  onClose: () => void
  onSelect: (city: CitySearchItem) => void
}

export default function CitySearchSheet({ open, onClose, onSelect }: Props) {
  const [keyword, setKeyword] = useState('')
  const [results, setResults] = useState<CitySearchItem[]>([])
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) {
      setKeyword('')
      setResults([])
      setError('')
      return
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const q = keyword.trim()
    if (!q) {
      setResults([])
      setError('')
      return
    }

    const timer = window.setTimeout(async () => {
      setSearching(true)
      setError('')
      try {
        const list = await searchCities(q)
        setResults(list)
        if (!list.length) setError('没有找到相关城市')
      } catch {
        setError('搜索失败，请稍后重试')
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 350)

    return () => window.clearTimeout(timer)
  }, [keyword, open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[130] flex items-end justify-center bg-black/40 px-3 pb-24"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[430px] rounded-t-[22px] rounded-b-[18px] bg-white p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold text-kitty-text">切换城市</h3>
          <button
            type="button"
            className="rounded-full bg-kitty-wash px-3 py-1 text-sm text-kitty-deep"
            onClick={onClose}
          >
            关闭
          </button>
        </div>

        <input
          autoFocus
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="输入城市名，如：北京 / 上海 / 合肥"
          className="mb-3 w-full rounded-xl border border-pink-200 bg-[#fffafb] px-3 py-3 text-[15px] text-kitty-text outline-none focus:border-kitty-pink"
        />

        <div className="max-h-[46vh] overflow-y-auto">
          {searching && (
            <div className="py-6 text-center text-sm text-kitty-muted">搜索中…</div>
          )}
          {!searching && error && (
            <div className="py-6 text-center text-sm text-kitty-muted">{error}</div>
          )}
          {!searching &&
            results.map((item) => (
              <button
                key={item.id}
                type="button"
                className="flex w-full items-center justify-between border-b border-pink-100 px-1 py-3 text-left last:border-0"
                onClick={() => onSelect(item)}
              >
                <span className="text-[15px] text-kitty-text">{item.label}</span>
                <span className="text-xs text-kitty-muted">选择</span>
              </button>
            ))}
          {!searching && !keyword.trim() && (
            <div className="py-3">
              <p className="mb-2 text-center text-xs text-kitty-muted">热门城市，点一下就好</p>
              <div className="flex flex-wrap justify-center gap-2">
                {HOT_CITIES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => onSelect(c)}
                    className="rounded-full bg-kitty-wash px-3.5 py-1.5 text-sm text-kitty-deep active:scale-95"
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
