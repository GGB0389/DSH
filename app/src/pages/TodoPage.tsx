import { useState, type CSSProperties } from 'react'
import { useToast } from '../components/Toast'
import { KEYS, load, save } from '../services/store'

type Tag = 'none' | 'important' | 'urgent'

interface Todo {
  id: string
  text: string
  tag: Tag
  done: boolean
}

const TAG_META: Record<Tag, { label: string; style?: CSSProperties }> = {
  none: { label: '' },
  important: { label: '重要', style: { background: '#ffe0ea', color: '#e85a8b' } },
  urgent: { label: '紧急', style: { background: '#fff3d6', color: '#c07d20' } },
}

export default function TodoPage() {
  const { showToast } = useToast()
  const [items, setItems] = useState<Todo[]>(() => load<Todo[]>(KEYS.todos, []))
  const [text, setText] = useState('')
  const [tag, setTag] = useState<Tag>('none')

  const persist = (next: Todo[]) => {
    setItems(next)
    save(KEYS.todos, next)
  }

  const add = () => {
    const t = text.trim()
    if (!t) {
      showToast('先写点要做的事吧~')
      return
    }
    const next: Todo[] = [
      { id: `${Date.now()}`, text: t, tag, done: false },
      ...items,
    ]
    persist(next)
    setText('')
    setTag('none')
    showToast('已添加 ✅')
  }

  const toggle = (id: string) => {
    persist(items.map((it) => (it.id === id ? { ...it, done: !it.done } : it)))
  }

  const remove = (id: string) => {
    persist(items.filter((it) => it.id !== id))
  }

  return (
    <div className="space-y-3 pb-4">
      <section className="rounded-[18px] glass p-4 shadow-[0_8px_24px_rgba(255,107,158,0.14)]">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-kitty-text">待办事项</h2>
          <button
            type="button"
            onClick={add}
            className="flex h-9 w-9 items-center justify-center rounded-full text-lg text-white shadow-md transition active:scale-90"
            style={{ background: '#ff6b9e' }}
            aria-label="添加待办"
          >
            +
          </button>
        </div>

        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') add()
          }}
          placeholder="今天要做点什么？"
          className="mb-3 w-full rounded-xl bg-pink-50 px-3 py-2.5 text-sm text-kitty-text outline-none placeholder:text-kitty-muted"
        />
        <div className="mb-2 flex gap-2">
          {(['important', 'urgent', 'none'] as Tag[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTag(t)}
              className="rounded-full px-3 py-1 text-xs"
              style={
                tag === t
                  ? { background: '#ff6b9e', color: '#fff' }
                  : { background: '#fbeef3', color: '#a1887f' }
              }
            >
              {t === 'none' ? '普通' : TAG_META[t].label}
            </button>
          ))}
        </div>

        {items.length === 0 ? (
          <p className="py-6 text-center text-sm text-kitty-muted">
            还没有待办，点右上角 + 加一条吧 🎀
          </p>
        ) : (
          <ul>
            {items.map((it) => (
              <li
                key={it.id}
                className="flex items-center gap-3 border-b border-dashed border-pink-100 py-3 last:border-0"
              >
                <button
                  type="button"
                  onClick={() => toggle(it.id)}
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-[10px]"
                  style={
                    it.done
                      ? { background: '#ff6b9e', borderColor: '#ff6b9e', color: '#fff' }
                      : { borderColor: '#ffc2d1', color: 'transparent' }
                  }
                  aria-label="完成"
                >
                  ✓
                </button>
                <span
                  className={`flex-1 text-sm ${
                    it.done ? 'text-kitty-muted line-through' : 'text-kitty-text'
                  }`}
                >
                  {it.text}
                </span>
                {it.tag !== 'none' && (
                  <span
                    className="rounded-full px-2 py-0.5 text-[11px]"
                    style={TAG_META[it.tag].style}
                  >
                    {TAG_META[it.tag].label}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => remove(it.id)}
                  className="px-1 text-kitty-muted active:text-kitty-deep"
                  aria-label="删除"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
