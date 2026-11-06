import { useEffect, useRef, useState } from 'react'

interface Props {
  onToggle?: (playing: boolean) => void
}

export default function MusicButton({ onToggle }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    const a = new Audio('/music/tianwaiwu.flac')
    a.loop = true
    a.volume = 0.5
    audioRef.current = a
    return () => {
      a.pause()
    }
  }, [])

  const toggle = () => {
    const a = audioRef.current
    if (!a) return
    if (playing) {
      a.pause()
      setPlaying(false)
      onToggle?.(false)
    } else {
      void a.play().then(() => {
        setPlaying(true)
        onToggle?.(true)
      }).catch(() => undefined)
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="背景音乐"
      className="glass-soft flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg shadow-md active:scale-90"
    >
      <span className={playing ? 'animate-spin-slow inline-block' : 'inline-block'}>
        {playing ? '⏸️' : '🎵'}
      </span>
    </button>
  )
}
