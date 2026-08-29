import Link from "next/link";
import { Card, CardHeader, Badge, Empty } from "@/components/ui";
import { RankBar, Donut } from "@/components/charts";
import { OpenPartyForm, DeleteButton } from "@/components/buttons";
import { OpenInvoiceWithItemsForm } from "@/components/invoice-form";
import { loadAll } from "@/lib/finance";
import { partyLedger } from "@/lib/analytics";
import { fmtCompact, fmtMoney, fmtNumber } from "@/lib/format";
import { formatJalali } from "@/lib/jalali";
import { addParty, addInvoice, deleteParty } from "../actions";

export const dynamic = "force-dynamic";

const typeLabel: Record<string, { label: string; tone: "blue" | "violet" | "green" | "amber" | "slate" }> = {
  supplier: { label: "فروشنده مصالح", tone: "blue" },
  contractor: { label: "پیمانکار", tone: "violet" },
  buyer: { label: "خریدار واحد", tone: "green" },
  worker: { label: "کارگر", tone: "amber" },
  other: { label: "سایر", tone: "slate" },
};

export default async function PartiesPage() {
  const data = await loadAll();
  const ledger = partyLedger(data);
  const suppliers = ledger.filter((l) => l.type === "supplier" || l.type === "contractor");
  const buyers = ledger.filter((l) => l.type === "buyer");
  const totalDebt = ledger.reduce((a, p) => a + Math.max(0, p.balance), 0);
  const totalReceivable = buyers.reduce((a, p) => a + Math.max(0, p.receivedFrom > 0 ? 0 : 0), 0);
  void totalReceivable;

  const allSlices = ledger
    .filter((l) => l.type !== "buyer")
    .map((l) => ({ name: l.name, value: l.cashPurchases + l.invoiceTotal }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">
            <span className="text-gradient">طرف حساب‌ها</span>
          </h1>
          <p className="mt-1 text-[12.5px] text-slate-400">
            هر کسی که از او خرید می‌کنید، به او پول می‌دهید یا از او پول می‌گیرید
          </p>
        </div>
        <div className="flex gap-2">
          <OpenPartyForm action={addParty} />
          <OpenInvoiceWithItemsForm
            parties={data.parties.map((p) => ({ id: p.id, name: p.name }))}
            projects={data.projs.map((p) => ({ id: p.id, name: p.name }))}
            categories={data.cats.map((c) => ({ id: c.id, name: c.name, kind: c.kind }))}
            materials={data.materials.map((m) => ({ id: m.id, name: m.name, unit: m.unit }))}
            accounts={data.accts.map((a) => ({ id: a.id, name: a.name }))}
            label="ثبت فاکتور خرید"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="card-glass rounded-2xl p-4">
          <p className="text-[12.5px] text-slate-400">تعداد طرف حساب</p>
          <p className="mt-1.5 text-xl font-extrabold text-slate-700">{fmtNumber(ledger.length)}</p>
        </div>
        <div className="card-glass rounded-2xl p-4">
          <p className="text-[12.5px] text-slate-400">جمع بدهی شما (نسیه)</p>
          <p className="mt-1.5 text-xl font-extrabold text-rose-400">{fmtCompact(totalDebt)}</p>
        </div>
        <div className="card-glass rounded-2xl p-4">
          <p className="text-[12.5px] text-slate-400">فروشندگان و پیمانکاران</p>
          <p className="mt-1.5 text-xl font-extrabold text-sky-400">{fmtNumber(suppliers.length)}</p>
        </div>
        <div className="card-glass rounded-2xl p-4">
          <p className="text-[12.5px] text-slate-400">خریداران واحد</p>
          <p className="mt-1.5 text-xl font-extrabold text-emerald-400">{fmtNumber(buyers.length)}</p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="خرید از هر شخص"
            subtitle="نقدی (تراکنش‌ها) + نسیه (فاکتورها)"
            accent="sky"
          />
          <div className="p-4">
            <RankBar data={allSlices.slice(0, 10)} height={320} />
          </div>
        </Card>
        <Card>
          <CardHeader title="سهم خرید" accent="violet" />
          <div className="p-4">
            {allSlices.length > 0 ? (
              <Donut data={allSlices.slice(0, 8)} height={250} centerLabel="جمع خرید" centerValue={fmtCompact(allSlices.reduce((a, b) => a + b.value, 0))} />
            ) : (
              <Empty text="داده‌ای نیست" />
            )}
          </div>
        </Card>
      </div>

      {/* فروشندگان و پیمانکاران */}
      <Card>
        <CardHeader
          title="فروشندگان مصالح و پیمانکاران"
          subtitle="خرید نقدی، فاکتور نسیه و مانده بدهی"
          accent="emerald"
        />
        {suppliers.length === 0 ? (
          <Empty text="هنوز طرف حسابی ثبت نشده" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px]">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="table-th">نام</th>
                  <th className="table-th">نوع</th>
                  <th className="table-th">خرید نقدی</th>
                  <th className="table-th">فاکتور نسیه</th>
                  <th className="table-th">پرداخت بابت نسیه</th>
                  <th className="table-th">مانده (بدهی شما)</th>
                  <th className="table-th">آخرین فعالیت</th>
                  <th className="table-th"></th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((p) => (
                  <tr key={p.partyId} className="border-b border-slate-200/40 transition hover:bg-slate-100/50">
                    <td className="table-td">
                      <Link href={`/parties/${p.partyId}`} className="text-[13px] font-bold text-emerald-400 hover:text-emerald-300">
                        {p.name}
                      </Link>
                      {p.topCategories.length > 0 && (
                        <p className="mt-0.5 max-w-[220px] truncate text-[11.5px] text-slate-400">
                          {p.topCategories.slice(0, 2).map((c) => c.name).join("، ")}
                        </p>
                      )}
                    </td>
                    <td className="table-td">
                      <Badge tone={typeLabel[p.type]?.tone ?? "slate"}>{typeLabel[p.type]?.label ?? p.type}</Badge>
                    </td>
                    <td className="table-td text-[13px] text-slate-500">{fmtMoney(p.cashPurchases, false)}</td>
                    <td className="table-td text-[13px] text-slate-500">{fmtMoney(p.invoiceTotal, false)}</td>
                    <td className="table-td text-[13px] text-emerald-400">{fmtMoney(p.invoicePaid, false)}</td>
                    <td className="table-td">
                      {p.balance > 0 ? (
                        <Badge tone="red">ما بدهکاریم {fmtMoney(p.balance, false)}</Badge>
                      ) : (
                        <span className="text-[12.5px] text-slate-400">تسویه</span>
                      )}
                    </td>
                    <td className="table-td text-[12.5px] text-slate-400">{p.lastDate ? formatJalali(p.lastDate) : "—"}</td>
                    <td className="table-td">
                      <div className="flex items-center gap-2">
                        <Link href={`/parties/${p.partyId}`} className="text-[12.5px] text-emerald-400 hover:text-emerald-300">
                          جزئیات
                        </Link>
                        <DeleteButton id={p.partyId} action={deleteParty} confirmText="این طرف حساب حذف شود؟" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* خریداران */}
      <Card>
        <CardHeader title="خریداران واحدها" subtitle="مبالغ دریافتی از هر خریدار" accent="emerald" />
        {buyers.length === 0 ? (
          <Empty text="خریداری ثبت نشده" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="table-th">خریدار</th>
                  <th className="table-th">مبلغ قرارداد</th>
                  <th className="table-th">دریافتی تاکنون</th>
                  <th className="table-th">مانده طلب شما</th>
                  <th className="table-th">آخرین دریافت</th>
                  <th className="table-th"></th>
                </tr>
              </thead>
              <tbody>
                {buyers.map((p) => {
                  const unit = data.unts.find((u) => u.buyerName && p.name.includes(u.buyerName));
                  const contract = unit ? unit.soldPrice || unit.price : 0;
                  const remaining = Math.max(0, contract - p.receivedFrom);
                  return (
                    <tr key={p.partyId} className="border-b border-slate-200/40">
                      <td className="table-td">
                        <Link href={`/parties/${p.partyId}`} className="text-[13px] font-bold text-emerald-400 hover:text-emerald-300">
                          {p.name}
                        </Link>
                      </td>
                      <td className="table-td text-[13px] text-slate-500">{fmtMoney(contract, false)}</td>
                      <td className="table-td text-[13px] text-emerald-400">{fmtMoney(p.receivedFrom, false)}</td>
                      <td className="table-td">
                        {remaining > 0 ? (
                          <Badge tone="amber">طلبکار {fmtMoney(remaining, false)}</Badge>
                        ) : (
                          <Badge tone="green">تسویه شده</Badge>
                        )}
                      </td>
                      <td className="table-td text-[12.5px] text-slate-400">{p.lastDate ? formatJalali(p.lastDate) : "—"}</td>
                      <td className="table-td">
                        <DeleteButton id={p.partyId} action={deleteParty} confirmText="این خریدار حذف شود؟" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
