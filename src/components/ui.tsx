import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
  glass = true,
}: {
  children: ReactNode;
  className?: string;
  glass?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl ${glass ? "card-glass" : "border border-slate-200 bg-white"} ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  accent = "emerald",
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  accent?: "emerald" | "sky" | "violet" | "amber" | "rose";
}) {
  const accents: Record<string, string> = {
    emerald: "from-emerald-400 to-cyan-400",
    sky: "from-sky-400 to-indigo-400",
    violet: "from-violet-400 to-fuchsia-400",
    amber: "from-amber-400 to-orange-400",
    rose: "from-rose-400 to-pink-400",
  };
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 px-5 py-3.5">
      <div className="flex items-center gap-2.5">
        <span className={`h-6 w-1 rounded-full bg-gradient-to-b ${accents[accent]}`} />
        <div>
          <h3 className="text-[14.5px] font-bold text-slate-700">{title}</h3>
          {subtitle && <p className="mt-0.5 text-[12.5px] text-slate-400">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export function Stat({
  label,
  value,
  sub,
  tone = "default",
  icon,
  gradient,
  chart,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: "default" | "good" | "bad" | "warn" | "info" | "violet";
  icon?: ReactNode;
  gradient?: string;
  chart?: ReactNode;
}) {
  const grads: Record<string, string> = {
    default: "from-slate-500/25 to-slate-500/5 text-slate-300",
    good: "from-emerald-500/30 to-emerald-500/5 text-emerald-300",
    bad: "from-rose-500/30 to-rose-500/5 text-rose-300",
    warn: "from-amber-500/30 to-amber-500/5 text-amber-300",
    info: "from-sky-500/30 to-sky-500/5 text-sky-300",
    violet: "from-violet-500/30 to-violet-500/5 text-violet-300",
  };
  const tones: Record<string, string> = {
    default: "text-slate-700",
    good: "text-emerald-400",
    bad: "text-rose-400",
    warn: "text-amber-400",
    info: "text-sky-400",
    violet: "text-violet-400",
  };
  return (
    <div className="card-glass card-glass-hover group relative overflow-hidden rounded-2xl p-4">
      {gradient && (
        <div className={`pointer-events-none absolute -left-8 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${gradient} blur-2xl`} />
      )}
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[12.5px] font-medium text-slate-400">{label}</p>
          <p className={`mt-1.5 truncate text-[19px] font-extrabold ${tones[tone]}`}>{value}</p>
          {sub && <p className="mt-1 text-[11.5px] leading-4 text-slate-400">{sub}</p>}
        </div>
        {icon && (
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${
              grads[tone] ?? grads.default
            } ring-1 ring-white/5`}
          >
            {icon}
          </span>
        )}
      </div>
      {chart && <div className="relative mt-2">{chart}</div>}
    </div>
  );
}

const badgeTones: Record<string, string> = {
  slate: "bg-slate-400/15 text-slate-300 ring-slate-400/20",
  green: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/25",
  red: "bg-rose-500/15 text-rose-300 ring-rose-400/25",
  amber: "bg-amber-500/15 text-amber-300 ring-amber-400/25",
  blue: "bg-sky-500/15 text-sky-300 ring-sky-400/25",
  violet: "bg-violet-500/15 text-violet-300 ring-violet-400/25",
  cyan: "bg-cyan-500/15 text-cyan-300 ring-cyan-400/25",
};

export function Badge({
  children,
  tone = "slate",
}: {
  children: ReactNode;
  tone?: keyof typeof badgeTones;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-medium ring-1 ring-inset ${badgeTones[tone]}`}
    >
      {children}
    </span>
  );
}

export function Btn({
  children,
  tone = "primary",
  size = "md",
  type = "button",
  className = "",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: "primary" | "ghost" | "danger" | "subtle" | "premium";
  size?: "sm" | "md";
}) {
  const tones: Record<string, string> = {
    primary:
      "bg-gradient-to-l from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-900/30 hover:shadow-emerald-900/50 hover:brightness-110 disabled:opacity-50",
    premium:
      "bg-gradient-to-l from-violet-500 via-fuchsia-500 to-sky-500 text-white shadow-lg shadow-violet-900/30 hover:brightness-110 disabled:opacity-50",
    ghost:
      "border border-slate-300/70 bg-slate-100/60 text-slate-500 hover:border-emerald-500/50 hover:text-emerald-300 disabled:opacity-50",
    danger:
      "border border-rose-500/25 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 disabled:opacity-50",
    subtle: "text-emerald-300 hover:bg-emerald-500/10 disabled:opacity-50",
  };
  const sizes: Record<string, string> = {
    // حداقل ارتفاع لمس‌پذیر: sm=۳۸px برای جدول‌های پرتراکم، md=۴۴px استاندارد
    sm: "px-3 py-2 text-[12.5px] min-h-[38px]",
    md: "px-4 py-2.5 text-[14px] min-h-[44px]",
  };
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl font-medium transition active:scale-[0.98] ${tones[tone]} ${sizes[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="field-label">{label}</label>
      {children}
    </div>
  );
}

export function Empty({ text, icon = "📭" }: { text: string; icon?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-12 text-center">
      <span className="text-3xl opacity-60">{icon}</span>
      <p className="text-[13px] text-slate-400">{text}</p>
    </div>
  );
}

export function ProgressBar({
  value,
  tone = "emerald",
  height = "h-2",
}: {
  value: number;
  tone?: string;
  height?: string;
}) {
  const tones: Record<string, string> = {
    emerald: "from-emerald-400 to-teal-500",
    amber: "from-amber-400 to-orange-500",
    rose: "from-rose-400 to-pink-500",
    sky: "from-sky-400 to-indigo-500",
    violet: "from-violet-400 to-fuchsia-500",
  };
  return (
    <div className={`w-full overflow-hidden rounded-full bg-slate-200/70 ${height}`}>
      <div
        className={`h-full rounded-full bg-gradient-to-l ${tones[tone] ?? tones.emerald} transition-all duration-700`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

/** حلقه درصدی دایره‌ای برای کارت پروژه */
export function ProgressRing({
  value,
  size = 62,
  label,
}: {
  value: number;
  size?: number;
  label?: string;
}) {
  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#243044" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * pct) / 100}
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.22,1,0.36,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[12.5px] font-extrabold text-slate-700">{pct}٪</span>
        {label && <span className="text-[10.5px] text-slate-400">{label}</span>}
      </div>
    </div>
  );
}

/** نوار افقی برای نمایش سهم درصدی (جایگزین جدول) */
export function ShareRow({
  name,
  value,
  total,
  color,
  extra,
}: {
  name: string;
  value: number;
  total: number;
  color: string;
  extra?: ReactNode;
}) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="group">
      <div className="mb-1 flex items-center justify-between gap-2 text-[12.5px]">
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: color }} />
          <span className="truncate text-slate-500">{name}</span>
        </span>
        <span className="flex shrink-0 items-center gap-2 font-medium text-slate-600">
          {extra}
          <span className="w-9 text-left text-slate-400">{pct.toFixed(1)}٪</span>
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200/60">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${Math.min(100, pct)}%`, background: color }}
        />
      </div>
    </div>
  );
}
