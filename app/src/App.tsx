import { useEffect, useRef, useState } from 'react'
import BottomNav, { type TabKey } from './components/BottomNav'
import { ToastProvider } from './components/Toast'
import HomePage from './pages/HomePage'
import PeriodPage from './pages/PeriodPage'
import HabitsPage from './pages/HabitsPage'
import TodoPage from './pages/TodoPage'
import WeatherPage from './pages/WeatherPage'

const SONGS = [
  { title: '天外来物', artist: '薛之谦', src: '/music/tianwaiwu.mp3', lrc: '/music/tianwaiwu.lrc' },
  { title: '绅士', artist: '薛之谦', src: '/music/shenshi.mp3', lrc: '/music/shenshi.lrc' },
  { title: '暧昧', artist: '薛之谦', src: '/music/aimei.mp3', lrc: '/music/aimei.lrc' },
]

export default function App() {
  const [tab, setTab] = useState<TabKey>('home')
  const [playing, setPlaying] = useState(false)
  const [songIdx, setSongIdx] = useState(0)
  const [lyricLine, setLyricLine] = useState('')
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const lrcRef = useRef<{ t: number; text: string }[]>([])
  const analyserRef = useRef<AnalyserNode | null>(null)

  useEffect(() => {
    const a = new Audio(SONGS[0].src)
    a.loop = true
    a.volume = 0.5
    audioRef.current = a
    // 系统灵动岛/锁屏/控制中心 歌曲信息
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: '天外来物',
        artist: '薛之谦',
        album: '天外来物',
        artwork: [
          { src: '/island.jpg', sizes: '512x512', type: 'image/jpeg' },
        ],
      })
      navigator.mediaSession.setActionHandler('play', () => { void a.play(); setPlaying(true) })
      navigator.mediaSession.setActionHandler('pause', () => { a.pause(); setPlaying(false) })
      navigator.mediaSession.setActionHandler('previoustrack', () => { setSongIdx((i) => (i - 1 + SONGS.length) % SONGS.length) })
      navigator.mediaSession.setActionHandler('nexttrack', () => { setSongIdx((i) => (i + 1) % SONGS.length) })
    }
    return () => { a.pause() }
  }, [])

  const ensureAnalyser = () => {
    const a = audioRef.current
    if (!a || analyserRef.current) return
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const ctx = new Ctx()
      const src = ctx.createMediaElementSource(a)
      const an = ctx.createAnalyser()
      an.fftSize = 64
      src.connect(an)
      an.connect(ctx.destination)
      analyserRef.current = an
    } catch { /* ignore */ }
  }

  const toggle = () => {
    const a = audioRef.current
    if (!a) return
    if (playing) { a.pause(); setPlaying(false) }
    else {
      ensureAnalyser()
      void a.play().then(() => setPlaying(true)).catch(() => undefined)
    }
  }

  const song = SONGS[songIdx]

  useEffect(() => {
    const a = audioRef.current
    if (!a) return
    a.src = SONGS[songIdx].src
    if (playing) void a.play().catch(() => undefined)
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: SONGS[songIdx].title,
        artist: SONGS[songIdx].artist,
        album: '薛之谦',
        artwork: [{ src: '/island.jpg', sizes: '512x512', type: 'image/jpeg' }],
      })
    }
  }, [songIdx])

  // 加载歌词
  useEffect(() => {
    lrcRef.current = []
    setLyricLine('')
    fetch(SONGS[songIdx].lrc)
      .then((r) => r.text())
      .then((text) => {
        const lines: { t: number; text: string }[] = []
        for (const raw of text.split('\n')) {
          const m = raw.match(/\[(\d+):(\d+)(?:\.(\d+))?\](.*)/)
          if (m) {
            const t = parseInt(m[1]) * 60 + parseInt(m[2]) + (m[3] ? parseInt(m[3].padEnd(2, '0')) / 100 : 0)
            const txt = m[4].trim()
            if (txt) lines.push({ t, text: txt })
          }
        }
        lines.sort((a, b) => a.t - b.t)
        lrcRef.current = lines
      })
      .catch(() => undefined)
  }, [songIdx])

  // timeupdate 更新当前歌词
  useEffect(() => {
    const a = audioRef.current
    if (!a) return
    const onTime = () => {
      const lines = lrcRef.current
      if (!lines.length) return
      const cur = a.currentTime
      let line = ''
      for (const l of lines) {
        if (l.t <= cur) line = l.text
        else break
      }
      setLyricLine(line)
    }
    a.addEventListener('timeupdate', onTime)
    return () => a.removeEventListener('timeupdate', onTime)
  }, [])

  useEffect(() => {
    document.title = playing ? `${song.title} - ${song.artist}` : '美少女专属空间'
  }, [playing, song])

  return (
    <ToastProvider>
      <div className="relative mx-auto flex h-full max-w-[430px] flex-col overflow-hidden bg-gradient-to-b from-[#fffbfd] via-[#ffeef5] to-[#ffdcec] shadow-[0_20px_60px_rgba(255,107,158,0.18)]">
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
          <div className="absolute -left-16 top-16 h-56 w-56 rounded-full bg-pink-300/45 blur-3xl" />
          <div className="absolute -right-14 top-1/3 h-64 w-64 rounded-full bg-fuchsia-200/50 blur-3xl" />
          <div className="absolute -left-10 bottom-24 h-48 w-48 rounded-full bg-rose-300/40 blur-3xl" />
          <div className="absolute right-10 bottom-10 h-40 w-40 rounded-full bg-rose-200/50 blur-3xl" />
        </div>
        {tab !== 'weather' && tab !== 'period' && (
          <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
            <img
              src="/kitty-bg.png"
              alt=""
              className="absolute left-1/2 top-[26%] w-[420px] -translate-x-1/2 opacity-[0.55] mix-blend-multiply"
            />
          </div>
        )}

        <header className="relative z-30 flex shrink-0 items-center gap-2 px-3 pb-2 pt-[max(10px,env(safe-area-inset-top))]">
          <img
            src="/island.jpg"
            alt="头像"
            className={`h-10 w-10 shrink-0 rounded-full object-cover ${playing ? 'animate-spin-slow' : ''}`}
          />
          <div
            onClick={() => { if (!playing) toggle() }}
            className="glass-soft flex flex-1 items-center gap-2 rounded-full py-2 px-3"
          >
            {/* 左：音频条（CSS 动画，类似 iOS 灵动岛） */}
            <div className="flex h-5 items-end gap-[3px]">
              <span className="eq-bar w-[3px] rounded-full bg-kitty-pink" />
              <span className="eq-bar eq-bar-2 w-[3px] rounded-full bg-kitty-pink" />
              <span className="eq-bar w-[3px] rounded-full bg-kitty-pink" />
              <span className="eq-bar eq-bar-3 w-[3px] rounded-full bg-kitty-pink" />
              <span className="eq-bar eq-bar-2 w-[3px] rounded-full bg-kitty-pink" />
            </div>
            <div className="flex min-w-0 flex-1 items-center gap-2">
              {playing ? (
                <>
                  <div className="shrink-0 text-[13px] font-semibold text-kitty-text">{song.title}</div>
                  <div className="min-w-0 flex-1 truncate text-[13px] text-kitty-deep">{lyricLine || `${song.artist} · 正在播放`}</div>
                </>
              ) : (
                <h1 className="w-full text-center text-[15px] font-semibold tracking-wide text-kitty-text">
                  美少女专属空间
                </h1>
              )}
            </div>
          </div>
          <button
            onClick={toggle}
            aria-label="播放/暂停"
            className="glass-soft flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg shadow-md active:scale-90"
          >
            {playing ? '⏸️' : '🎵'}
          </button>
        </header>

        <main className="relative z-10 flex-1 overflow-y-auto px-4 pb-[86px] pt-1">
          {tab === 'home' && <HomePage />}
          {tab === 'weather' && <WeatherPage />}
          {tab === 'period' && <PeriodPage />}
          {tab === 'habits' && <HabitsPage />}
          {tab === 'todo' && <TodoPage />}
        </main>

        <BottomNav active={tab} onChange={setTab} />
      </div>
    </ToastProvider>
  )
}
