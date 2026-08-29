import Link from "next/link";
import { Card, CardHeader, Badge, Stat, Empty, ProgressBar } from "@/components/ui";
import { OpenChequeForm, DeleteButton } from "@/components/buttons";
import { ChequeActionButton } from "@/components/forms";
import { ChequeTimeline, Donut } from "@/components/charts";
import { loadAll } from "@/lib/finance";
import { chequeAlerts, chequeTimeline } from "@/lib/analytics";
import { fmtCompact, fmtMoney } from "@/lib/format";
import { formatJalali, todayISO } from "@/lib/jalali";
import { addCheque, chequeAction, deleteCheque } from "../actions";

export const dynamic = "force-dynamic";

const statusMeta: Record<string, { label: string; tone: "green" | "blue" | "amber" | "red" | "slate" | "violet" }> = {
  received: { label: "دریافت شده", tone: "blue" },
  in_hand: { label: "نزد من", tone: "amber" },
  deposited: { label: "واریز به حساب", tone: "green" },
  cashed: { label: "نقد شد", tone: "green" },
  transferred: { label: "واگذار شد", tone: "violet" },
  bounced: { label: "برگشت خورد", tone: "red" },
  returned: { label: "برگشت به صادرکننده", tone: "slate" },
};

const levelStyle: Record<string, { box: string; text: string; label: string }> = {
  overdue: { box: "border-rose-500/40 bg-rose-500/10", text: "text-rose-400", label: "سررسید گذشته" },
  urgent: { box: "border-amber-500/40 bg-amber-500/10", text: "text-amber-400", label: "خیلی نزدیک" },
  soon: { box: "border-sky-500/40 bg-sky-500/10", text: "text-sky-400", label: "به‌زودی" },
  ok: { box: "border-slate-200 bg-slate-100/50", text: "text-slate-400", label: "زمان دارد" },
};

export default async function ChequesPage() {
  const data = await loadAll();
  const active = data.chqs.filter((c) => c.status === "in_hand" || c.status === "received");
  const activeValue = active.reduce((a, c) => a + c.amount, 0);
  const overdue = active.filter((c) => c.dueDate < todayISO());
  const overdueValue = overdue.reduce((a, c) => a + c.amount, 0);
  const cashedValue = data.chqs
    .filter((c) => c.status === "cashed" || c.status === "deposited")
    .reduce((a, c) => a + c.amount, 0);
  const transferredValue = data.chqs
    .filter((c) => c.status === "transferred")
    .reduce((a, c) => a + c.amount, 0);
  const bouncedValue = data.chqs.filter((c) => c.status === "bounced").reduce((a, c) => a + c.amount, 0);

  const alerts = chequeAlerts(data, 14);
  const timeline = chequeTimeline(data);

  // تفکیک چک‌ها بر اساس صادرکننده
  const byDrawer = new Map<string, number>();
  for (const c of data.chqs) {
    const k = c.drawer ?? "نامشخص";
    byDrawer.set(k, (byDrawer.get(k) ?? 0) + c.amount);
  }
  const drawerSlices = Array.from(byDrawer.entries())
    .map(([name, value], i) => ({
      name,
      value,
      color: ["#10b981", "#22d3ee", "#8b5cf6", "#f59e0b", "#f43f5e", "#3b82f6"][i % 6],
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">
            <span className="text-gradient">چک‌های خریداران</span>
          </h1>
          <p className="mt-1 text-[12.5px] text-slate-400">
            دریافت، سررسید، واگذاری به فروشنده مصالح/پیمانکار و پیگیری
          </p>
        </div>
        <OpenChequeForm
          action={addCheque}
          projects={data.projs.map((p) => ({ id: p.id, name: p.name }))}
          units={data.unts.map((u) => ({
            id: u.id, unitNumber: u.unitNumber, status: u.status,
            projectId: u.projectId, price: u.price, buyerName: u.buyerName,
          }))}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat label="چک‌های نزد من" value={fmtCompact(activeValue)} tone="info" sub={`${active.length} چک در دست`} />
        <Stat label="سررسید گذشته" value={fmtCompact(overdueValue)} tone="bad" sub={`${overdue.length} چک معوق — پیگیری کنید`} />
        <Stat label="نقد / واریز شده" value={fmtCompact(cashedValue)} tone="good" />
        <Stat label="واگذار شده" value={fmtCompact(transferredValue)} tone="violet" sub="چک خرج‌شده برای خرید" />
        <Stat label="برگشت خورده" value={fmtCompact(bouncedValue)} tone="bad" />
      </div>

      {/* پنل یادآور */}
      <Card>
        <CardHeader
          title="یادآور سررسیدها"
          subtitle="چک‌هایی که نزد شماست و باید پیگیری شوند"
          accent={alerts.some((a) => a.level === "overdue") ? "rose" : "amber"}
        />
        {alerts.length === 0 ? (
          <Empty icon="✅" text="چکی در جریان نیست" />
        ) : (
          <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
            {alerts.map((a) => {
              const st = levelStyle[a.level];
              return (
                <div key={a.id} className={`rounded-2xl border p-4 ${st.box}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-bold text-slate-600">{a.drawer ?? "نامشخص"}</p>
                      <p className="mt-0.5 truncate text-[11.5px] text-slate-400">
                        چک {a.chequeNumber} · {a.projectName ?? "—"}
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11.5px] font-medium ${st.text} bg-slate-900/40`}>
                      {st.label}
                    </span>
                  </div>
                  <p className="mt-2.5 text-base font-extrabold text-slate-700">{fmtMoney(a.amount)}</p>
                  <div className="mt-1 flex items-center justify-between text-[11.5px]">
                    <span className="text-slate-400">سررسید {formatJalali(a.dueDate)}</span>
                    <span className={`font-bold ${st.text}`}>
                      {a.daysLeft < 0
                        ? `${Math.abs(a.daysLeft)} روز گذشته`
                        : a.daysLeft === 0
                          ? "امروز سررسید است"
                          : `${a.daysLeft} روز مانده`}
                    </span>
                  </div>
                  {a.level !== "ok" && (
                    <div className="mt-2">
                      <ProgressBar
                        value={a.level === "overdue" ? 100 : a.level === "urgent" ? 80 : 55}
                        tone={a.level === "overdue" ? "rose" : a.level === "urgent" ? "amber" : "sky"}
                        height="h-1"
                      />
                    </div>
                  )}
                  {a.notes && <p className="mt-2 truncate text-[11.5px] text-slate-400">{a.notes}</p>}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="خط زمانی چک‌ها" subtitle="بر اساس ماه سررسید" accent="amber" />
          <div className="p-4">
            <ChequeTimeline data={timeline} height={270} />
          </div>
        </Card>
        <Card>
          <CardHeader title="سهم هر صادرکننده" accent="violet" />
          <div className="p-4">
            {drawerSlices.length > 0 ? (
              <Donut data={drawerSlices} height={250} centerLabel="جمع چک‌ها" centerValue={fmtCompact(drawerSlices.reduce((a, b) => a + b.value, 0))} />
            ) : (
              <Empty text="چکی ثبت نشده" />
            )}
          </div>
        </Card>
      </div>

      {/* جدول همه چک‌ها */}
      <Card>
        <CardHeader title="همه چک‌ها" subtitle="مرتب بر اساس سررسید" accent="sky" />
        {data.chqs.length === 0 ? (
          <Empty text="چکی ثبت نشده است" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="table-th">شماره چک</th>
                  <th className="table-th">صادرکننده</th>
                  <th className="table-th">بانک</th>
                  <th className="table-th">پروژه / واحد</th>
                  <th className="table-th">مبلغ</th>
                  <th className="table-th">دریافت</th>
                  <th className="table-th">سررسید</th>
                  <th className="table-th">وضعیت</th>
                  <th className="table-th">اقدامات</th>
                </tr>
              </thead>
              <tbody>
                {[...data.chqs]
                  .sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1))
                  .map((c) => {
                    const meta = statusMeta[c.status] ?? statusMeta.in_hand;
                    const unit = data.unts.find((u) => u.id === c.unitId);
                    const isOverdue = (c.status === "in_hand" || c.status === "received") && c.dueDate < todayISO();
                    return (
                      <tr key={c.id} className="border-b border-slate-200/40 transition hover:bg-slate-100/50">
                        <td className="table-td text-[12.5px] font-medium" dir="ltr">{c.chequeNumber}</td>
                        <td className="table-td text-[12.5px]">{c.drawer ?? "—"}</td>
                        <td className="table-td text-[12.5px] text-slate-400">{c.bankName ?? "—"}</td>
                        <td className="table-td text-[12.5px]">
                          {data.projs.find((p) => p.id === c.projectId)?.name ?? "—"}
                          {unit ? ` · ${unit.unitNumber}` : ""}
                        </td>
                        <td className="table-td text-[13px] font-bold text-slate-600">{fmtMoney(c.amount, false)}</td>
                        <td className="table-td text-[12.5px]">{formatJalali(c.receivedDate)}</td>
                        <td className={`table-td text-[12.5px] font-medium ${isOverdue ? "text-rose-400" : ""}`}>
                          {formatJalali(c.dueDate)}
                          {isOverdue && " ⚠"}
                        </td>
                        <td className="table-td">
                          <Badge tone={meta.tone}>{meta.label}</Badge>
                          {c.transferTo && <p className="mt-1 text-[11.5px] text-slate-400">به: {c.transferTo}</p>}
                          {c.notes && <p className="mt-0.5 max-w-[160px] truncate text-[11.5px] text-slate-400">{c.notes}</p>}
                        </td>
                        <td className="table-td">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {(c.status === "in_hand" || c.status === "received") && (
                              <>
                                <ChequeActionButton action={chequeAction} chequeId={c.id} label="واریز به حساب" actionType="deposited" accounts={data.accts.map((a) => ({ id: a.id, name: a.name }))} />
                                <ChequeActionButton action={chequeAction} chequeId={c.id} label="نقد شد" actionType="cashed" tone="ghost" accounts={data.accts.map((a) => ({ id: a.id, name: a.name }))} />
                                <ChequeActionButton action={chequeAction} chequeId={c.id} label="واگذاری" actionType="transferred" tone="subtle" />
                                <ChequeActionButton action={chequeAction} chequeId={c.id} label="برگشت خورد" actionType="bounced" tone="danger" />
                              </>
                            )}
                            {c.status === "bounced" && (
                              <ChequeActionButton action={chequeAction} chequeId={c.id} label="برگشت به صادرکننده" actionType="returned" tone="ghost" />
                            )}
                            <DeleteButton id={c.id} action={deleteCheque} confirmText="این چک حذف شود؟" />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="p-5">
        <h3 className="text-[14.5px] font-bold text-slate-700">راهنمای چرخه چک</h3>
        <ul className="mt-3 space-y-2 text-[12.5px] leading-6 text-slate-400">
          <li>• <b className="text-emerald-400">واریز به حساب / نقد شد:</b> یک تراکنش «درآمد» به‌صورت خودکار در حساب انتخابی ثبت می‌شود.</li>
          <li>• <b className="text-violet-400">واگذاری:</b> یک تراکنش «هزینه» به نام طرف مقابل ثبت می‌شود (بدون نیاز به حساب بانکی) — همان «چک گرفتم و خرج کردم».</li>
          <li>• <b className="text-rose-400">برگشت خورد:</b> در داشبورد و این صفحه هشدار می‌بینید؛ باید درآمد ثبت‌شده اصلاح شود.</li>
          <li>• یادآورها: تا ۳ روز مانده «خیلی نزدیک»، تا ۱۴ روز «به‌زودی» و بعد از سررسید «سررسید گذشته».</li>
          <li>• پیشنهاد: چک‌های نزد سررسید را در صفحه <Link href="/reports?dim=party" className="text-emerald-400 hover:text-emerald-300">گزارش‌ساز</Link> به تفکیک خریدار ببینید.</li>
        </ul>
      </Card>
    </div>
  );
}
