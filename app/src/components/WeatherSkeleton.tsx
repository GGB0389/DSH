export default function WeatherSkeleton() {
  return (
    <div className="space-y-3">
      <div className="rounded-[18px] glass-soft p-5 shadow-[0_8px_24px_rgba(255,107,158,0.12)]">
        <div className="skeleton mx-auto mb-4 h-4 w-24" />
        <div className="mb-4 flex items-center justify-center gap-3">
          <div className="skeleton h-14 w-14 rounded-full" />
          <div className="space-y-2">
            <div className="skeleton h-12 w-28" />
            <div className="skeleton h-4 w-16" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 border-t border-dashed border-pink-200 pt-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="space-y-2 rounded-xl bg-white/50 p-3">
              <div className="skeleton mx-auto h-3 w-10" />
              <div className="skeleton mx-auto h-6 w-6 rounded-full" />
              <div className="skeleton mx-auto h-3 w-14" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-[18px] bg-white/80 p-4">
            <div className="skeleton mx-auto mb-2 h-5 w-5 rounded-full" />
            <div className="skeleton mx-auto mb-2 h-3 w-12" />
            <div className="skeleton mx-auto h-4 w-10" />
          </div>
        ))}
      </div>

      <div className="rounded-[18px] bg-white/80 p-4">
        <div className="skeleton mb-3 h-4 w-24" />
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="mb-3 flex gap-2 last:mb-0">
            <div className="skeleton h-5 w-5 rounded-full" />
            <div className="skeleton h-5 flex-1" />
          </div>
        ))}
      </div>
    </div>
  )
}
