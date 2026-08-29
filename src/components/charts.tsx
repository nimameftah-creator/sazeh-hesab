"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  PolarAngleAxis,
  Line,
  LineChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fmtCompact, fmtNumber } from "@/lib/format";
import { jalaliMonthLabel } from "@/lib/jalali";

export const PALETTE = [
  "#10b981", "#22d3ee", "#8b5cf6", "#f59e0b", "#f43f5e",
  "#3b82f6", "#ec4899", "#14b8a6", "#a3e635", "#fb923c",
  "#6366f1", "#eab308", "#06b6d4", "#d946ef", "#84cc16",
];

const tipBase = {
  backgroundColor: "#111a2b",
  border: "1px solid #243044",
  borderRadius: 14,
  boxShadow: "0 12px 32px -8px rgba(0,0,0,0.7)",
  padding: "10px 12px",
  fontFamily: "Yekan, Vazirmatn, Tahoma, sans-serif",
  fontSize: 12,
};

function Tip({ active, payload, label, unit = "تومان" }: any) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div style={tipBase}>
      <p className="mb-1.5 text-[12.5px] font-bold text-slate-400">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="flex items-center gap-1.5 text-[12.5px] text-slate-300">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color || p.fill }} />
          <span>{p.name}:</span>
          <b className="text-slate-100">
            {fmtNumber(p.value)} {unit}
          </b>
        </p>
      ))}
    </div>
  );
}

/** منطقه‌ای: روند درآمد و هزینه */
export function CashflowChart({
  data,
  height = 280,
}: {
  data: { key: string; expense: number; income: number; transfer?: number }[];
  height?: number;
}) {
  const rows = data.map((d) => ({ ...d, label: jalaliMonthLabel(d.key) }));
  return (
    <div dir="ltr" style={{ height }} className="w-full">
      <ResponsiveContainer>
        <AreaChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gInc" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="gExp" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#243044" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#94a3b8", fontFamily: "Yekan" }} tickLine={false} axisLine={false} interval={0} />
          <YAxis tick={{ fontSize: 10, fill: "#94a3b8", fontFamily: "Yekan" }} tickLine={false} axisLine={false} width={64} tickFormatter={(v: number) => fmtCompact(v)} />
          <Tooltip content={<Tip />} cursor={{ stroke: "#334155", strokeWidth: 1 }} />
          <Legend wrapperStyle={{ fontFamily: "Yekan", fontSize: 11, color: "#a8b5c7" }} iconType="circle" />
          <Area type="monotone" dataKey="income" name="دریافتی" stroke="#10b981" strokeWidth={2.5} fill="url(#gInc)" dot={false} activeDot={{ r: 4 }} />
          <Area type="monotone" dataKey="expense" name="هزینه" stroke="#f43f5e" strokeWidth={2.5} fill="url(#gExp)" dot={false} activeDot={{ r: 4 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** میله‌ای گروهی ماهانه */
export function MonthlyBars({
  data,
  height = 260,
}: {
  data: { key: string; expense: number; income: number }[];
  height?: number;
}) {
  const rows = data.map((d) => ({ ...d, label: jalaliMonthLabel(d.key) }));
  return (
    <div dir="ltr" style={{ height }} className="w-full">
      <ResponsiveContainer>
        <BarChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#243044" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#94a3b8", fontFamily: "Yekan" }} tickLine={false} axisLine={false} interval={0} />
          <YAxis tick={{ fontSize: 10, fill: "#94a3b8", fontFamily: "Yekan" }} tickLine={false} axisLine={false} width={64} tickFormatter={(v: number) => fmtCompact(v)} />
          <Tooltip content={<Tip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
          <Legend wrapperStyle={{ fontFamily: "Yekan", fontSize: 11, color: "#a8b5c7" }} iconType="circle" />
          <Bar dataKey="income" name="دریافتی" fill="#10b981" radius={[5, 5, 0, 0]} maxBarSize={22} />
          <Bar dataKey="expense" name="هزینه" fill="#f43f5e" radius={[5, 5, 0, 0]} maxBarSize={22} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** حلقه دونات با مرکز */
export function Donut({
  data,
  height = 260,
  centerLabel,
  centerValue,
}: {
  data: { name: string; value: number; color?: string }[];
  height?: number;
  centerLabel?: string;
  centerValue?: string;
}) {
  const total = data.reduce((a, b) => a + b.value, 0);
  const colored = data.map((d, i) => ({ ...d, color: d.color ?? PALETTE[i % PALETTE.length] }));
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div dir="ltr" style={{ height }} className="relative min-w-[220px] flex-1">
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={colored}
              dataKey="value"
              nameKey="name"
              innerRadius="62%"
              outerRadius="88%"
              paddingAngle={2}
              stroke="none"
            >
              {colored.map((d, i) => (
                <Cell key={i} fill={d.color} />
              ))}
            </Pie>
            <Tooltip content={<Tip />} />
          </PieChart>
        </ResponsiveContainer>
        {(centerLabel || centerValue) && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[11.5px] text-slate-400">{centerLabel}</span>
            <span className="text-base font-extrabold text-slate-700">{centerValue}</span>
          </div>
        )}
      </div>
      <div className="min-w-[190px] flex-1 space-y-2" dir="rtl">
        {colored.slice(0, 9).map((d) => (
          <div key={d.name} className="flex items-center justify-between gap-2 text-[12.5px]">
            <span className="flex min-w-0 items-center gap-1.5">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: d.color }} />
              <span className="truncate text-slate-500">{d.name}</span>
            </span>
            <span className="shrink-0 font-medium text-slate-600">
              {fmtCompact(d.value)}
              <span className="mr-1 text-slate-400">
                {total > 0 ? `${Math.round((d.value / total) * 100)}٪` : "0٪"}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** میله‌ای افقی: مقایسه برآورد و واقعی مراحل */
export function StageBars({
  data,
  height = 340,
}: {
  data: { name: string; budget: number; actual: number; weight?: number }[];
  height?: number;
}) {
  return (
    <div dir="ltr" style={{ height }} className="w-full">
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 12, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#243044" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 10, fill: "#94a3b8", fontFamily: "Yekan" }} tickLine={false} axisLine={false} tickFormatter={(v: number) => fmtCompact(v)} />
          <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 10, fill: "#a8b5c7", fontFamily: "Yekan" }} tickLine={false} axisLine={false} />
          <Tooltip content={<Tip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
          <Legend wrapperStyle={{ fontFamily: "Yekan", fontSize: 11, color: "#a8b5c7" }} iconType="circle" />
          <Bar dataKey="budget" name="برآورد" fill="#334155" radius={[0, 6, 6, 0]} barSize={13} />
          <Bar dataKey="actual" name="هزینه واقعی" fill="#10b981" radius={[0, 6, 6, 0]} barSize={13} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** میله‌ای افقی: رتبه‌بندی طرف حساب‌ها / دسته‌ها */
export function RankBar({
  data,
  height = 320,
  color = "#22d3ee",
  unit = "تومان",
}: {
  data: { name: string; value: number }[];
  height?: number;
  color?: string;
  unit?: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-2.5">
      {data.length === 0 && <p className="py-8 text-center text-[13px] text-slate-400">داده‌ای نیست</p>}
      {data.map((d, i) => (
        <div key={d.name}>
          <div className="mb-1 flex items-center justify-between gap-2 text-[12.5px]">
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="flex h-4 w-4 shrink-0 items-center justify-center rounded-md text-[11px] font-bold text-slate-100"
                style={{ background: PALETTE[i % PALETTE.length] }}
              >
                {i + 1}
              </span>
              <span className="truncate text-slate-500">{d.name}</span>
            </span>
            <span className="shrink-0 font-medium text-slate-600">
              {fmtNumber(d.value)} {unit}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200/60">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.max(2, (d.value / max) * 100)}%`,
                background: `linear-gradient(to left, ${PALETTE[i % PALETTE.length]}, ${color})`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/** خط زمانی چک‌ها: ستونی بر اساس ماه */
export function ChequeTimeline({
  data,
  height = 250,
}: {
  data: { key: string; pending: number; cashed: number; bounced: number; transferred: number }[];
  height?: number;
}) {
  const rows = data.map((d) => ({ ...d, label: jalaliMonthLabel(d.key) }));
  return (
    <div dir="ltr" style={{ height }} className="w-full">
      <ResponsiveContainer>
        <BarChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} stackOffset="sign">
          <CartesianGrid strokeDasharray="3 3" stroke="#243044" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#94a3b8", fontFamily: "Yekan" }} tickLine={false} axisLine={false} interval={0} />
          <YAxis tick={{ fontSize: 10, fill: "#94a3b8", fontFamily: "Yekan" }} tickLine={false} axisLine={false} width={64} tickFormatter={(v: number) => fmtCompact(Math.abs(v))} />
          <Tooltip content={<Tip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
          <Legend wrapperStyle={{ fontFamily: "Yekan", fontSize: 11, color: "#a8b5c7" }} iconType="circle" />
          <Bar dataKey="cashed" name="نقد/واریز شده" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={30} />
          <Bar dataKey="pending" name="در جریان" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={30} />
          <Bar dataKey="transferred" name="واگذار شده" stackId="a" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={30} />
          <Bar dataKey="bounced" name="برگشتی" stackId="a" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={30} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** گیج رادیال: درصد مصرف بودجه */
export function BudgetGauge({ value }: { value: number }) {
  const pct = Math.min(100, Math.max(0, value));
  const data = [{ name: "مصرف", value: pct, fill: pct > 100 ? "#f43f5e" : pct > 85 ? "#f59e0b" : "#10b981" }];
  return (
    <div dir="ltr" className="relative h-[150px] w-full">
      <ResponsiveContainer>
        <RadialBarChart
          data={data}
          innerRadius="72%"
          outerRadius="100%"
          startAngle={90}
          endAngle={-270}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar dataKey="value" cornerRadius={12} background={{ fill: "#243044" }} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-extrabold text-slate-700">{pct}٪</span>
        <span className="text-[11.5px] text-slate-400">بودجه مصرف‌شده</span>
      </div>
    </div>
  );
}

/** روند تغییر قیمت فی یک کالا در زمان */
export function PriceTrendChart({
  data,
  unit,
  height = 300,
}: {
  data: { date: string; label: string; price: number; quantity: number; source: string }[];
  unit: string;
  height?: number;
}) {
  if (data.length === 0) return null;
  return (
    <div dir="ltr" style={{ height }} className="w-full">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 10, right: 14, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#243044" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: "#94a3b8", fontFamily: "Yekan" }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#94a3b8", fontFamily: "Yekan" }}
            tickLine={false}
            axisLine={false}
            width={72}
            domain={["auto", "auto"]}
            tickFormatter={(v: number) => fmtCompact(v)}
          />
          <Tooltip
            content={({ active, payload, label }: any) => {
              if (!active || !payload?.length) return null;
              const p = payload[0].payload;
              return (
                <div style={tipBase}>
                  <p className="mb-1.5 text-[11px] font-bold text-slate-400">{label}</p>
                  <p className="text-[11px] text-cyan-300">
                    فی: <b className="text-slate-100">{fmtNumber(p.price)}</b> تومان
                  </p>
                  <p className="text-[11px] text-slate-300">
                    مقدار: {fmtNumber(p.quantity)} {unit}
                  </p>
                  <p className="text-[11px] text-slate-400">{p.source}</p>
                </div>
              );
            }}
            cursor={{ stroke: "#334155", strokeWidth: 1 }}
          />
          <Line
            type="monotone"
            dataKey="price"
            name="قیمت فی"
            stroke="#22d3ee"
            strokeWidth={2.5}
            dot={{ r: 4, fill: "#22d3ee", strokeWidth: 0 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/** اسپارک‌لاین کوچک قیمت برای جدول کالاها */
export function PriceSpark({ data, color = "#22d3ee" }: { data: number[]; color?: string }) {
  if (data.length < 2) return <span className="text-[11px] text-slate-400">—</span>;
  const rows = data.map((v, i) => ({ i, v }));
  return (
    <div dir="ltr" className="h-8 w-24">
      <ResponsiveContainer>
        <AreaChart data={rows} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`ps-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.45} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={2}
            fill={`url(#ps-${color.replace("#", "")})`}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** اسپارک‌لاین برای کارت‌های آماری */
export function Sparkline({
  data,
  color = "#10b981",
  height = 34,
}: {
  data: number[];
  color?: string;
  height?: number;
}) {
  if (data.length < 2) return null;
  const rows = data.map((v, i) => ({ i, v }));
  return (
    <div dir="ltr" style={{ height }} className="w-full">
      <ResponsiveContainer>
        <AreaChart data={rows} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`sp-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.45} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill={`url(#sp-${color.replace("#", "")})`} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
