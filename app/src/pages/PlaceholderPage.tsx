export default function PlaceholderPage({
  title,
  emoji,
}: {
  title: string
  emoji: string
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="animate-float mb-3 text-6xl opacity-70">{emoji}</div>
      <h2 className="mb-2 text-lg font-semibold text-kitty-text">{title}</h2>
      <p className="max-w-[240px] text-sm leading-relaxed text-kitty-muted">
        本页后续可继续完善。当前重点已实现【天气】模块的定位、搜城与实时数据。
      </p>
    </div>
  )
}
