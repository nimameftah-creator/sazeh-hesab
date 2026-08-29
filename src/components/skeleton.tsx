export function StatSkeleton() {
  return (
    <div className="card-glass rounded-2xl p-4">
      <div className="skeleton mb-3 h-3 w-24" />
      <div className="skeleton mb-2 h-6 w-32" />
      <div className="skeleton h-2.5 w-20" />
    </div>
  );
}

export function CardSkeleton({ rows = 4, height }: { rows?: number; height?: number }) {
  return (
    <div className="card-glass rounded-2xl">
      <div className="border-b border-slate-200 px-5 py-4">
        <div className="skeleton h-3.5 w-40" />
      </div>
      <div className="space-y-3 p-5" style={height ? { height } : undefined}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="skeleton h-3 flex-1" style={{ maxWidth: `${70 - i * 8}%` }} />
            <div className="skeleton h-3 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChartSkeleton({ height = 280 }: { height?: number }) {
  return (
    <div className="card-glass rounded-2xl">
      <div className="border-b border-slate-200 px-5 py-4">
        <div className="skeleton h-3.5 w-48" />
      </div>
      <div className="flex items-end gap-2 p-5" style={{ height }}>
        {[38, 62, 45, 78, 55, 88, 41, 70, 58, 82, 49, 66].map((h, i) => (
          <div
            key={i}
            className="skeleton flex-1"
            style={{ height: `${h}%`, animationDelay: `${i * 60}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="card-glass rounded-2xl">
      <div className="border-b border-slate-200 px-5 py-4">
        <div className="skeleton h-3.5 w-36" />
      </div>
      <div className="divide-y divide-slate-200/60">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-3.5">
            <div className="skeleton h-3 w-16" />
            <div className="skeleton h-3 flex-1" />
            <div className="skeleton h-3 w-20" />
            <div className="skeleton h-3 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** چیدمان لودینگ داشبورد */
export function DashboardLoading() {
  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <div className="skeleton h-3 w-28" />
          <div className="skeleton mt-2 h-7 w-64" />
          <div className="skeleton mt-2 h-2.5 w-48" />
        </div>
        <div className="skeleton h-10 w-36 rounded-xl" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatSkeleton />
        <StatSkeleton />
        <StatSkeleton />
        <StatSkeleton />
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ChartSkeleton />
        </div>
        <CardSkeleton rows={5} height={280} />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <CardSkeleton rows={6} />
        <TableSkeleton rows={5} />
      </div>
      <p className="flex items-center justify-center gap-2 py-2 text-[12.5px] text-slate-400">
        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
        در حال بارگذاری اطلاعات...
      </p>
    </div>
  );
}
