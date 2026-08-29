import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardHeader, Badge, Empty, ProgressBar } from "@/components/ui";
import { Donut, MonthlyBars } from "@/components/charts";
import {
  OpenInvoiceForm, OpenPayInvoiceForm, DeleteButton,
} from "@/components/buttons";
import { loadAll } from "@/lib/finance";
import { partyLedger, partyNameOf } from "@/lib/analytics";
import { fmtCompact, fmtMoney, fmtNumber } from "@/lib/format";
import { formatJalali, jalaliMonthKey, jalaliMonthLabel } from "@/lib/jalali";
import { addInvoice, payInvoice, deleteInvoice } from "../../actions";

export const dynamic = "force-dynamic";

export default async function PartyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await loadAll();
  const party = data.parties.find((p) => p.id === id);
  if (!party) notFound();

  const ledger = partyLedger(data).find((l) => l.partyId === id);
  const myInvoices = data.invoices.filter((i) => i.partyId === id);
  const myTxs = data.txs
    .filter((t) => t.partyId === id || partyNameOf(t, data) === party.name)
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  // روند ماهانه خرید از این شخص
  const monthMap = new Map<string, { income: number; expense: number }>();
  for (const t of myTxs) {
    const k = jalaliMonthKey(t.date);
    const v = monthMap.get(k) ?? { income: 0, expense: 0 };
    if (t.type === "expense") v.expense += t.amount;
    if (t.type === "income") v.income += t.amount;
    monthMap.set(k, v);
  }
  const monthly = Array.from(monthMap.entries())
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([key, v]) => ({ key, ...v }));

  const catSlices = (ledger?.topCategories ?? []).map((c) => ({ name: c.name, value: c.value, color: c.color }));
  const totalBuy = (ledger?.cashPurchases ?? 0) + (ledger?.invoiceTotal ?? 0);
  const typeLabel: Record<string, string> = {
    supplier: "فروشنده مصالح",
    contractor: "پیمانکار",
    buyer: "خریدار واحد",
    worker: "کارگر",
    other: "سایر",
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/parties" className="text-[12.5px] text-slate-400 hover:text-slate-300">
            طرف حساب‌ها ←
          </Link>
          <div className="mt-1 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/30 to-cyan-500/10 text-lg font-extrabold text-emerald-300 ring-1 ring-emerald-400/20">
              {party.name.slice(0, 1)}
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-700">{party.name}</h1>
              <p className="mt-0.5 flex items-center gap-2 text-[12.5px] text-slate-400">
                <Badge tone="violet">{typeLabel[party.type] ?? party.type}</Badge>
                {party.phone ? <span>{party.phone}</span> : null}
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <OpenInvoiceForm
            action={addInvoice}
            parties={[party]}
            projects={data.projs.map((p) => ({ id: p.id, name: p.name }))}
            categories={data.cats.map((c) => ({ id: c.id, name: c.name, kind: c.kind }))}
            defaultParty={party.id}
            label="+ فاکتور نسیه"
          />
        </div>
      </div>

      {/* کارت‌های خلاصه */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="card-glass rounded-2xl p-4">
          <p className="text-[12.5px] text-slate-400">جمع خرید از ایشان</p>
          <p className="mt-1.5 text-lg font-extrabold text-slate-700">{fmtCompact(totalBuy)}</p>
          <p className="mt-0.5 text-[11.5px] text-slate-400">نقدی + نسیه</p>
        </div>
        <div className="card-glass rounded-2xl p-4">
          <p className="text-[12.5px] text-slate-400">خرید نقدی</p>
          <p className="mt-1.5 text-lg font-extrabold text-sky-400">{fmtCompact(ledger?.cashPurchases ?? 0)}</p>
          <p className="mt-0.5 text-[11.5px] text-slate-400">{fmtNumber(ledger?.txCount ?? 0)} تراکنش</p>
        </div>
        <div className="card-glass rounded-2xl p-4">
          <p className="text-[12.5px] text-slate-400">فاکتور نسیه</p>
          <p className="mt-1.5 text-lg font-extrabold text-amber-400">{fmtCompact(ledger?.invoiceTotal ?? 0)}</p>
          <p className="mt-0.5 text-[11.5px] text-slate-400">پرداخت‌شده: {fmtCompact(ledger?.invoicePaid ?? 0)}</p>
        </div>
        <div className="card-glass rounded-2xl p-4">
          <p className="text-[12.5px] text-slate-400">مانده حساب</p>
          {party.type === "buyer" ? (
            <p className="mt-1.5 text-lg font-extrabold text-emerald-400">
              دریافتی {fmtCompact(ledger?.receivedFrom ?? 0)}
            </p>
          ) : (
            <p className={`mt-1.5 text-lg font-extrabold ${(ledger?.balance ?? 0) > 0 ? "text-rose-400" : "text-emerald-400"}`}>
              {(ledger?.balance ?? 0) > 0 ? `بدهکار ${fmtCompact(ledger!.balance)}` : "تسویه"}
            </p>
          )}
          <p className="mt-0.5 text-[11.5px] text-slate-400">
            {(ledger?.balance ?? 0) > 0 ? "شما به ایشان بدهکارید" : party.type === "buyer" ? "مبالغ دریافت‌شده" : "بدهی معوق ندارید"}
          </p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader title="چه چیزهایی از ایشان خریدیم؟" subtitle="تفکیک بر اساس دسته‌بندی" accent="sky" />
          <div className="p-4">
            {catSlices.length > 0 ? (
              <Donut data={catSlices} height={250} centerLabel="جمع خرید" centerValue={fmtCompact(totalBuy)} />
            ) : (
              <Empty text="خریدی ثبت نشده" />
            )}
          </div>
          {catSlices.length > 0 && (
            <div className="space-y-2 border-t border-slate-200/70 px-5 py-3">
              {catSlices.slice(0, 5).map((c) => (
                <div key={c.name} className="flex items-center justify-between text-[12.5px]">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <span className="h-2 w-2 rounded-full" style={{ background: c.color }} />
                    {c.name}
                  </span>
                  <span className="font-medium text-slate-600">{fmtMoney(c.value, false)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="روند ماهانه" subtitle="خرید ماهانه از این طرف حساب" accent="violet" />
          <div className="p-4">
            {monthly.length > 0 ? <MonthlyBars data={monthly} height={250} /> : <Empty text="داده‌ای نیست" />}
          </div>
        </Card>
      </div>

      {/* فاکتورهای نسیه */}
      <Card>
        <CardHeader
          title="فاکتورهای نسیه"
          subtitle="خریدهای مدت‌دار و وضعیت تسویه"
          accent="amber"
        />
        {myInvoices.length === 0 ? (
          <Empty text="فاکتور نسیه‌ای ثبت نشده — یعنی همه خریدها نقدی بوده" />
        ) : (
          <div className="space-y-2 p-4">
            {myInvoices.map((inv) => {
              const remaining = inv.amount - inv.paidAmount;
              const pct = inv.amount > 0 ? Math.round((inv.paidAmount / inv.amount) * 100) : 0;
              return (
                <div key={inv.id} className="rounded-xl border border-slate-200 bg-slate-100/50 p-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[13px] font-bold text-slate-600">{inv.description ?? "فاکتور"}</p>
                      <p className="mt-0.5 text-[11.5px] text-slate-400">
                        {formatJalali(inv.date)} · {data.projs.find((p) => p.id === inv.projectId)?.name ?? "—"} ·{" "}
                        {data.cats.find((c) => c.id === inv.categoryId)?.name ?? "بدون دسته"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone={inv.status === "paid" ? "green" : inv.status === "partial" ? "amber" : "red"}>
                        {inv.status === "paid" ? "تسویه شد" : inv.status === "partial" ? "پرداخت جزئی" : "پرداخت‌نشده"}
                      </Badge>
                      {remaining > 0 && inv.status !== "paid" && (
                        <OpenPayInvoiceForm
                          action={payInvoice}
                          invoiceId={inv.id}
                          remaining={remaining}
                          accounts={data.accts.map((a) => ({ id: a.id, name: a.name }))}
                          label="پرداخت"
                        />
                      )}
                      <DeleteButton id={inv.id} action={deleteInvoice} confirmText="این فاکتور حذف شود؟" />
                    </div>
                  </div>
                  <div className="mt-2.5 grid grid-cols-3 gap-2 text-center text-[11.5px]">
                    <div>
                      <p className="text-slate-400">مبلغ فاکتور</p>
                      <p className="text-[13px] font-bold text-slate-600">{fmtMoney(inv.amount, false)}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">پرداخت‌شده</p>
                      <p className="text-[13px] font-bold text-emerald-400">{fmtMoney(inv.paidAmount, false)}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">مانده</p>
                      <p className="text-[13px] font-bold text-rose-400">{fmtMoney(remaining, false)}</p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <ProgressBar value={pct} tone={pct >= 100 ? "emerald" : "amber"} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* ریز تراکنش‌ها */}
      <Card>
        <CardHeader
          title="ریز تراکنش‌ها"
          subtitle={`${fmtNumber(myTxs.length)} تراکنش با این طرف حساب`}
          accent="emerald"
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="table-th">تاریخ</th>
                <th className="table-th">شرح</th>
                <th className="table-th">پروژه</th>
                <th className="table-th">مقدار</th>
                <th className="table-th">نوع</th>
                <th className="table-th">مبلغ</th>
              </tr>
            </thead>
            <tbody>
              {myTxs.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[13px] text-slate-400">تراکنشی ثبت نشده</td>
                </tr>
              )}
              {myTxs.slice(0, 150).map((t) => {
                const cat = data.cats.find((c) => c.id === t.categoryId);
                return (
                  <tr key={t.id} className="border-b border-slate-200/40">
                    <td className="table-td text-[12.5px]">{formatJalali(t.date)}</td>
                    <td className="table-td max-w-[260px]">
                      <p className="truncate text-[13px] text-slate-600">{t.description}</p>
                      {cat && (
                        <p className="mt-0.5 flex items-center gap-1 text-[11.5px] text-slate-400">
                          <span className="h-1.5 w-1.5 rounded-full" style={{ background: cat.color ?? "#94a3b8" }} />
                          {cat.name}
                        </p>
                      )}
                    </td>
                    <td className="table-td text-[12.5px]">
                      {data.projs.find((p) => p.id === t.projectId)?.name ?? "شخصی"}
                    </td>
                    <td className="table-td text-[12.5px] text-slate-400">
                      {t.quantity && t.unit ? `${fmtNumber(t.quantity)} ${t.unit}` : "—"}
                    </td>
                    <td className="table-td">
                      <Badge tone={t.type === "income" ? "green" : "red"}>
                        {t.type === "income" ? "دریافت" : "پرداخت"}
                      </Badge>
                    </td>
                    <td className={`table-td text-left text-[13px] font-bold ${t.type === "income" ? "text-emerald-400" : "text-rose-400"}`}>
                      {t.type === "income" ? "+ " : "− "}{fmtMoney(t.amount, false)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
