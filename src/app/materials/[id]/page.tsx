import Link from "next/link";
import { notFound } from "next/navigation";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardHeader, Badge, Empty } from "@/components/ui";
import { PriceTrendChart } from "@/components/charts";
import { OpenInvoiceWithItemsForm } from "@/components/invoice-form";
import { loadAll } from "@/lib/finance";
import { priceStats } from "@/lib/pricing";
import { fmtCompact, fmtMoney, fmtNumber } from "@/lib/format";
import { formatJalali, toFaDigits } from "@/lib/jalali";

export const dynamic = "force-dynamic";

export default async function MaterialPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await loadAll();
  const material = data.materials.find((m) => m.id === id);
  if (!material) notFound();

  const stats = priceStats(id, data);
  const chartData = stats.points.map((p) => ({
    date: p.date,
    label: formatJalali(p.date),
    price: Math.round(p.price),
    quantity: p.quantity,
    source:
      p.source === "invoice"
        ? `فاکتور از ${p.sourceLabel}${p.invoiceNumber ? " شماره " + p.invoiceNumber : ""}`
        : `تراکنش: ${p.sourceLabel}`,
  }));

  const up = (stats.changePct ?? 0) > 0;
  const down = (stats.changePct ?? 0) < 0;
  const totalUp = (stats.changeFromFirstPct ?? 0) > 0;

  return (
    <div className="space-y-5">
      {/* هدر */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/materials" className="text-[12.5px] text-slate-400 hover:text-slate-300">
            کالاها ←
          </Link>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/30 to-sky-500/10 text-lg font-extrabold text-cyan-300 ring-1 ring-cyan-400/20">
              {material.name.slice(0, 1)}
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-700">{material.name}</h1>
              <p className="mt-0.5 text-[12.5px] text-slate-400">
                واحد: <b className="text-slate-500">{material.unit}</b>
                {data.cats.find((c) => c.id === material.categoryId) && (
                  <>
                    {" · "}دسته:{" "}
                    <b className="text-slate-500">
                      {data.cats.find((c) => c.id === material.categoryId)?.name}
                    </b>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
        <OpenInvoiceWithItemsForm
          parties={data.parties.map((p) => ({ id: p.id, name: p.name }))}
          projects={data.projs.map((p) => ({ id: p.id, name: p.name }))}
          categories={data.cats.map((c) => ({ id: c.id, name: c.name, kind: c.kind }))}
          materials={data.materials.map((m) => ({ id: m.id, name: m.name, unit: m.unit }))}
          accounts={data.accts.map((a) => ({ id: a.id, name: a.name }))}
          label="+ ثبت فاکتور خرید"
        />
      </div>

      {stats.points.length === 0 ? (
        <Card>
          <Empty
            icon="📈"
            text="هنوز خریدی برای این کالا ثبت نشده. با «ثبت فاکتور خرید» مقدار و قیمت فی را وارد کن تا نمودار ساخته شود."
          />
        </Card>
      ) : (
        <>
          {/* کارت‌های آماری */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <div className="card-glass rounded-2xl p-4">
              <p className="text-[12.5px] text-slate-400">آخرین قیمت فی</p>
              <p className="mt-1.5 text-lg font-extrabold text-cyan-400">
                {fmtMoney(stats.latest?.price ?? 0, false)}
              </p>
              <p className="mt-0.5 text-[11.5px] text-slate-400">تومان / {material.unit}</p>
            </div>
            <div className="card-glass rounded-2xl p-4">
              <p className="text-[12.5px] text-slate-400">تغییر نسبت به خرید قبل</p>
              <p
                className={`mt-1.5 flex items-center gap-1 text-lg font-extrabold ${
                  up ? "text-rose-400" : down ? "text-emerald-400" : "text-slate-500"
                }`}
              >
                {up ? <TrendingUp size={16} /> : down ? <TrendingDown size={16} /> : <Minus size={16} />}
                {stats.changePct !== null ? `${up ? "+" : ""}${toFaDigits(Math.round(stats.changePct))}٪` : "—"}
              </p>
            </div>
            <div className="card-glass rounded-2xl p-4">
              <p className="text-[12.5px] text-slate-400">از اولین خرید تا امروز</p>
              <p
                className={`mt-1.5 text-lg font-extrabold ${
                  totalUp ? "text-rose-400" : "text-emerald-400"
                }`}
              >
                {stats.changeFromFirstPct !== null
                  ? `${totalUp ? "+" : ""}${toFaDigits(Math.round(stats.changeFromFirstPct))}٪`
                  : "—"}
              </p>
            </div>
            <div className="card-glass rounded-2xl p-4">
              <p className="text-[12.5px] text-slate-400">کمترین / بیشترین</p>
              <p className="mt-1.5 text-[13px] font-bold text-slate-600">
                {fmtMoney(stats.min, false)}
              </p>
              <p className="text-[13px] font-bold text-slate-600">{fmtMoney(stats.max, false)}</p>
            </div>
            <div className="card-glass rounded-2xl p-4">
              <p className="text-[12.5px] text-slate-400">میانگین وزنی فی</p>
              <p className="mt-1.5 text-lg font-extrabold text-slate-700">{fmtMoney(stats.avg, false)}</p>
              <p className="mt-0.5 text-[11.5px] text-slate-400">بر اساس مقدار خرید</p>
            </div>
            <div className="card-glass rounded-2xl p-4">
              <p className="text-[12.5px] text-slate-400">جمع خرید</p>
              <p className="mt-1.5 text-lg font-extrabold text-sky-400">{fmtCompact(stats.totalSpend)}</p>
              <p className="mt-0.5 text-[11.5px] text-slate-400">
                {fmtNumber(stats.totalQty)} {material.unit} در {fmtNumber(stats.purchaseCount)} خرید
              </p>
            </div>
          </div>

          {/* نمودار روند */}
          <Card>
            <CardHeader
              title="روند تغییر قیمت فی"
              subtitle={`از ${formatJalali(stats.first?.date ?? "")} تا ${formatJalali(stats.latest?.date ?? "")}`}
              accent="emerald"
              action={
                stats.changeFromFirstPct !== null && (
                  <Badge tone={totalUp ? "red" : "green"}>
                    {totalUp ? "▲" : "▼"} {toFaDigits(Math.abs(Math.round(stats.changeFromFirstPct)))}٪
                    کل دوره
                  </Badge>
                )
              }
            />
            <div className="p-4">
              <PriceTrendChart data={chartData} unit={material.unit} />
            </div>
          </Card>

          {/* جدول خریدها */}
          <Card>
            <CardHeader
              title="تاریخچه خریدها"
              subtitle={`${fmtNumber(stats.points.length)} خرید ثبت‌شده`}
              accent="sky"
            />
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="table-th">تاریخ</th>
                    <th className="table-th">منبع</th>
                    <th className="table-th">فروشنده / شرح</th>
                    <th className="table-th">مقدار</th>
                    <th className="table-th">قیمت فی</th>
                    <th className="table-th">مبلغ کل</th>
                    <th className="table-th">تغییر</th>
                  </tr>
                </thead>
                <tbody>
                  {[...stats.points].reverse().map((p, idx, arr) => {
                    const older = arr[idx + 1];
                    const chg = older && older.price > 0 ? ((p.price - older.price) / older.price) * 100 : null;
                    return (
                      <tr key={p.id} className="border-b border-slate-200/40">
                        <td className="table-td text-[12.5px]">{formatJalali(p.date)}</td>
                        <td className="table-td">
                          <Badge tone={p.source === "invoice" ? "blue" : "slate"}>
                            {p.source === "invoice" ? "فاکتور" : "تراکنش"}
                          </Badge>
                          {p.invoiceNumber && (
                            <p className="mt-0.5 font-mono text-[11px] text-slate-400" dir="ltr">
                              {p.invoiceNumber}
                            </p>
                          )}
                        </td>
                        <td className="table-td text-[12.5px] text-slate-500">{p.sourceLabel}</td>
                        <td className="table-td text-[13px]">
                          {fmtNumber(p.quantity)} {material.unit}
                        </td>
                        <td className="table-td text-[13px] font-bold text-cyan-400">
                          {fmtMoney(p.price, false)}
                        </td>
                        <td className="table-td text-[13px] text-slate-500">{fmtMoney(p.total, false)}</td>
                        <td className="table-td">
                          {chg === null ? (
                            <span className="text-[12.5px] text-slate-400">—</span>
                          ) : (
                            <span className={chg > 0 ? "text-[12.5px] text-rose-400" : "text-[12.5px] text-emerald-400"}>
                              {chg > 0 ? "+" : ""}
                              {toFaDigits(Math.round(chg))}٪
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
