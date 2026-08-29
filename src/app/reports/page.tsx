import Link from "next/link";
import { Card, CardHeader, Badge, Empty } from "@/components/ui";
import { Donut, RankBar, MonthlyBars, CashflowChart } from "@/components/charts";
import { loadAll } from "@/lib/finance";
import { dimLabel, drilldown, filterTxs, groupBy, type Dim } from "@/lib/analytics";
import { fmtCompact, fmtMoney, fmtNumber } from "@/lib/format";
import { formatJalali, jalaliMonthKey, jalaliMonthLabel, todayISO, monthsAgoISO } from "@/lib/jalali";
import { decorateTx } from "@/lib/finance";

export const dynamic = "force-dynamic";

const DIMS: { key: Dim; label: string }[] = [
  { key: "category", label: "دسته‌بندی" },
  { key: "stage", label: "مرحله ساخت" },
  { key: "party", label: "طرف حساب" },
  { key: "project", label: "پروژه" },
  { key: "account", label: "حساب بانکی" },
  { key: "month", label: "ماه" },
  { key: "counterparty", label: "نام در شرح" },
];

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ dim?: string; project?: string; kind?: string; from?: string; to?: string; value?: string }>;
}) {
  const sp = await searchParams;
  const dim = (DIMS.find((d) => d.key === sp.dim)?.key ?? "category") as Dim;
  const kind = (sp.kind === "income" || sp.kind === "expense" ? sp.kind : "expense") as "expense" | "income";
  const from = sp.from || null;
  const to = sp.to || null;
  const projectId = sp.project || null;
  const selected = sp.value || null;

  const data = await loadAll();
  const filtered = filterTxs(data.txs, { projectId, from, to, kind });
  const slices = groupBy(dim, filtered, data);
  const total = slices.reduce((a, b) => a + b.value, 0);
  const rows = selected ? drilldown(dim, selected, filtered, data).map((t) => decorateTx(t, data)) : [];

  // روند ماهانه برای نمودار پایین
  const monthlyMap = new Map<string, { income: number; expense: number }>();
  for (const t of data.txs) {
    if (projectId && t.projectId !== projectId) continue;
    const k = jalaliMonthKey(t.date);
    const v = monthlyMap.get(k) ?? { income: 0, expense: 0 };
    if (t.type === "income") v.income += t.amount;
    if (t.type === "expense") v.expense += t.amount;
    monthlyMap.set(k, v);
  }
  const monthly = Array.from(monthlyMap.entries())
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([key, v]) => ({ key, expense: v.expense, income: v.income }));

  const qs = (patch: Record<string, string | null>) => {
    const p = new URLSearchParams();
    const base: Record<string, string | null> = {
      dim, project: projectId, kind, from, to, value: selected,
    };
    for (const [k, v] of Object.entries({ ...base, ...patch })) {
      if (v) p.set(k, v);
    }
    const s = p.toString();
    return s ? `/reports?${s}` : "/reports";
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold">
          <span className="text-gradient">گزارش‌ساز</span>
        </h1>
        <p className="mt-1 text-[12.5px] text-slate-400">
          هر بُعدی را انتخاب کنید: مثلا «چقدر آرماتور خریدیم؟ از کی؟ چقدر بدهکاریم؟»
        </p>
      </div>

      {/* فیلترها */}
      <Card className="p-4">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {DIMS.map((d) => (
              <Link
                key={d.key}
                href={qs({ dim: d.key, value: null })}
                className={`rounded-xl px-3 py-1.5 text-[12.5px] font-medium transition ${
                  dim === d.key
                    ? "bg-gradient-to-l from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-900/30"
                    : "border border-slate-300/70 bg-slate-100/60 text-slate-500 hover:border-emerald-500/50 hover:text-emerald-300"
                }`}
              >
                {d.label}
              </Link>
            ))}
          </div>
          <form method="get" className="grid grid-cols-2 gap-3 md:grid-cols-5">
            <input type="hidden" name="dim" value={dim} />
            <div>
              <label className="field-label">پروژه</label>
              <select name="project" className="field-input" defaultValue={projectId ?? ""}>
                <option value="">همه پروژه‌ها</option>
                {data.projs.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label">نوع</label>
              <select name="kind" className="field-input" defaultValue={kind}>
                <option value="expense">هزینه‌ها</option>
                <option value="income">دریافت‌ها</option>
              </select>
            </div>
            <div>
              <label className="field-label">از تاریخ (میلادی)</label>
              <input type="date" name="from" className="field-input" defaultValue={from ?? ""} />
            </div>
            <div>
              <label className="field-label">تا تاریخ (میلادی)</label>
              <input type="date" name="to" className="field-input" defaultValue={to ?? ""} />
            </div>
            <div className="flex items-end gap-2">
              <button className="flex-1 rounded-xl bg-gradient-to-l from-emerald-500 to-teal-600 px-3 py-2 text-[13px] font-medium text-white hover:brightness-110">
                اعمال
              </button>
              <Link href="/reports" className="rounded-xl border border-slate-300/70 px-3 py-2 text-[13px] text-slate-500 hover:text-slate-300">
                پاک
              </Link>
            </div>
          </form>
        </div>
      </Card>

      {/* خلاصه */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="card-glass rounded-2xl p-4">
          <p className="text-[12.5px] text-slate-400">جمع {dimLabel(dim)}</p>
          <p className="mt-1.5 text-lg font-extrabold text-slate-700">{fmtCompact(total)}</p>
        </div>
        <div className="card-glass rounded-2xl p-4">
          <p className="text-[12.5px] text-slate-400">تعداد ردیف</p>
          <p className="mt-1.5 text-lg font-extrabold text-sky-400">{fmtNumber(filtered.length)}</p>
        </div>
        <div className="card-glass rounded-2xl p-4">
          <p className="text-[12.5px] text-slate-400">تعداد گروه</p>
          <p className="mt-1.5 text-lg font-extrabold text-violet-400">{fmtNumber(slices.length)}</p>
        </div>
        <div className="card-glass rounded-2xl p-4">
          <p className="text-[12.5px] text-slate-400">میانگین هر ردیف</p>
          <p className="mt-1.5 text-lg font-extrabold text-amber-400">
            {fmtCompact(filtered.length ? Math.round(total / filtered.length) : 0)}
          </p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader title={`نمودار دایره‌ای — ${dimLabel(dim)}`} accent="emerald" />
          <div className="p-4">
            {slices.length > 0 ? <Donut data={slices} height={280} centerLabel="جمع" centerValue={fmtCompact(total)} /> : <Empty text="داده‌ای با این فیلتر نیست" />}
          </div>
        </Card>
        <Card>
          <CardHeader title={`رتبه‌بندی — ${dimLabel(dim)}`} accent="violet" />
          <div className="max-h-[340px] overflow-y-auto p-4">
            <RankBar data={slices.slice(0, 15).map((s) => ({ name: s.name, value: s.value }))} height={300} />
          </div>
        </Card>
      </div>

      {/* جدول مقادیر با امکان دریل‌داون */}
      <Card>
        <CardHeader
          title={`جدول ${dimLabel(dim)}`}
          subtitle="روی هر ردیف کلیک کنید تا ریز تراکنش‌هایش را ببینید"
          accent="sky"
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px]">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="table-th">{dimLabel(dim)}</th>
                <th className="table-th">مبلغ</th>
                <th className="table-th">سهم</th>
                <th className="table-th w-1/3">نمودار</th>
              </tr>
            </thead>
            <tbody>
              {slices.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-[13px] text-slate-400">داده‌ای نیست</td>
                </tr>
              )}
              {slices.map((s) => (
                <tr
                  key={s.id}
                  className={`cursor-pointer border-b border-slate-200/40 transition hover:bg-slate-100/60 ${selected === s.id ? "bg-emerald-500/10" : ""}`}
                >
                  <td className="table-td">
                    <Link href={qs({ value: selected === s.id ? null : s.id })} className="flex items-center gap-2 text-[13px] font-medium text-slate-600">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                      {s.name}
                    </Link>
                  </td>
                  <td className="table-td text-[13px] font-bold text-slate-600">{fmtMoney(s.value, false)}</td>
                  <td className="table-td text-[13px] text-slate-400">
                    {total > 0 ? `${((s.value / total) * 100).toFixed(1)}٪` : "—"}
                  </td>
                  <td className="table-td w-1/3">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200/60">
                      <div className="h-full rounded-full" style={{ width: `${total > 0 ? (s.value / total) * 100 : 0}%`, background: s.color }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ریز تراکنش‌های انتخاب‌شده */}
      {selected && (
        <Card>
          <CardHeader
            title={`ریز تراکنش‌ها: ${selected}`}
            subtitle={`${fmtNumber(rows.length)} تراکنش · جمع ${fmtCompact(rows.reduce((a, t) => a + t.amount, 0))}`}
            accent="amber"
            action={
              <Link href={qs({ value: null })} className="text-[12.5px] text-slate-400 hover:text-slate-200">
                بستن ✕
              </Link>
            }
          />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="table-th">تاریخ</th>
                  <th className="table-th">شرح</th>
                  <th className="table-th">طرف حساب</th>
                  <th className="table-th">پروژه</th>
                  <th className="table-th">مقدار</th>
                  <th className="table-th">مبلغ</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[13px] text-slate-400">تراکنشی نیست</td>
                  </tr>
                )}
                {rows.slice(0, 200).map((t) => (
                  <tr key={t.id} className="border-b border-slate-200/40">
                    <td className="table-td text-[12.5px]">{formatJalali(t.date)}</td>
                    <td className="table-td max-w-[240px]">
                      <p className="truncate text-[13px] text-slate-600">{t.description}</p>
                    </td>
                    <td className="table-td text-[12.5px]">{t.counterparty ?? "—"}</td>
                    <td className="table-td text-[12.5px]">
                      {t.projectName ? <Badge tone="violet">{t.projectName}</Badge> : "شخصی"}
                    </td>
                    <td className="table-td text-[12.5px] text-slate-400">
                      {t.quantity && t.unit ? `${fmtNumber(t.quantity)} ${t.unit}` : "—"}
                    </td>
                    <td className={`table-td text-left text-[13px] font-bold ${t.type === "income" ? "text-emerald-400" : "text-rose-400"}`}>
                      {t.type === "income" ? "+ " : "− "}{fmtMoney(t.amount, false)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* نمودار ماهانه کل */}
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader title="روند ماهانه (منطقه‌ای)" accent="emerald" />
          <div className="p-4">
            {monthly.length > 0 ? <CashflowChart data={monthly} height={250} /> : <Empty text="داده‌ای نیست" />}
          </div>
        </Card>
        <Card>
          <CardHeader title="مقایسه ستونی ماهانه" accent="sky" />
          <div className="p-4">
            {monthly.length > 0 ? <MonthlyBars data={monthly.slice(-8)} height={250} /> : <Empty text="داده‌ای نیست" />}
          </div>
        </Card>
      </div>
    </div>
  );
}
