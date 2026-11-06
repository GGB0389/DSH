export type TabKey = 'home' | 'weather' | 'period' | 'habits' | 'todo'

interface Props {
  active: TabKey
  onChange: (tab: TabKey) => void
}

function IconHome() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" />
    </svg>
  )
}
function IconWeather() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="3.2" />
      <path d="M8 2.5v1.4M2.5 8h1.4M4.6 4.6l1 1M11.4 4.6l-1 1" />
      <path d="M6.5 18.5h10a3.5 3.5 0 0 0 .5-6.96 5 5 0 0 0-9.7 1.2A3.25 3.25 0 0 0 6.5 18.5Z" />
    </svg>
  )
}
function IconPeriod() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3.5" y="5" width="17" height="16" rx="3" />
      <path d="M3.5 10.5h17M8 3v3M16 3v3" />
      <circle cx="12" cy="15.5" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  )
}
function IconHabits() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20.5s-7.5-4.6-9.3-9.2C1.3 7.6 3.7 4.5 6.9 4.5c2 0 3.7 1.1 5.1 3 1.4-1.9 3.1-3 5.1-3 3.2 0 5.6 3.1 4.2 6.8-1.8 4.6-9.3 9.2-9.3 9.2Z" />
    </svg>
  )
}
function IconTodo() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12.2 2.7 2.7L16.5 9" />
    </svg>
  )
}

const TABS: Array<{ key: TabKey; label: string; icon: () => JSX.Element }> = [
  { key: 'home', label: '今日', icon: IconHome },
  { key: 'weather', label: '天气', icon: IconWeather },
  { key: 'period', label: '例假', icon: IconPeriod },
  { key: 'habits', label: '习惯', icon: IconHabits },
  { key: 'todo', label: '待办', icon: IconTodo },
]

export default function BottomNav({ active, onChange }: Props) {
  return (
    <nav className="absolute bottom-2 left-4 right-4 z-20 pb-[env(safe-area-inset-bottom)]">
      <div className="glass-soft grid h-14 grid-cols-5 rounded-full px-2">
        {TABS.map((tab) => {
          const isActive = tab.key === active
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              type="button"
              aria-label={tab.label}
              onClick={() => onChange(tab.key)}
              className="flex items-center justify-center"
            >
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 ${
                  isActive
                    ? 'bg-kitty-pink/20 text-kitty-deep shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]'
                    : 'text-kitty-muted/70'
                }`}
              >
                <Icon />
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
