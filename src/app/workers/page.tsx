import { Card, CardHeader, Badge, Empty } from "@/components/ui";
import { OpenWorkerForm, OpenWorkerPaymentForm, DeleteButton } from "@/components/buttons";
import { loadAll } from "@/lib/finance";
import { fmtMoney } from "@/lib/format";
import { formatJalali } from "@/lib/jalali";
import { addWorker, addWorkerPayment, deleteWorker, deleteWorkerPayment } from "../actions";

export const dynamic = "force-dynamic";

export default async function WorkersPage() {
  const data = await loadAll();
  const totalPaid = data.wpays.reduce((a, p) => a + p.amount, 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800">کارگران</h1>
          <p className="mt-1 text-[13px] text-slate-500">
            روزمزد و ماهانه — مجموع پرداختی‌ها: {fmtMoney(totalPaid, false)}
          </p>
        </div>
        <div className="flex gap-2">
          <OpenWorkerForm action={addWorker} />
          <OpenWorkerPaymentForm
            action={addWorkerPayment}
            workers={data.wrks.map((w) => ({ id: w.id, name: w.name }))}
            projects={data.projs.map((p) => ({ id: p.id, name: p.name }))}
            accounts={data.accts.map((a) => ({ id: a.id, name: a.name }))}
            categories={data.cats.map((c) => ({ id: c.id, name: c.name, kind: c.kind }))}
          />
        </div>
      </div>

      {data.wrks.length === 0 ? (
        <Card>
          <Empty text="کارگری ثبت نشده است" />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.wrks.map((w) => {
            const pays = data.wpays
              .filter((p) => p.workerId === w.id)
              .sort((a, b) => (a.date < b.date ? 1 : -1));
            const total = pays.reduce((a, p) => a + p.amount, 0);
            const days = pays.reduce((a, p) => a + (p.days ?? 0), 0);
            return (
              <Card key={w.id} className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-slate-800">{w.name}</p>
                    <p className="mt-0.5 text-[12.5px] text-slate-400">
                      {w.type === "daily"
                        ? `روزمزد ${fmtMoney(w.dailyRate, false)} / روز`
                        : `ماهانه ${fmtMoney(w.monthlySalary, false)}`}
                    </p>
                  </div>
                  <Badge tone={w.active ? "green" : "slate"}>{w.active ? "فعال" : "غیرفعال"}</Badge>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-center">
                  <div className="rounded-xl bg-slate-50 py-2.5">
                    <p className="text-[11.5px] text-slate-400">مجموع پرداختی</p>
                    <p className="text-sm font-bold text-slate-800">{fmtMoney(total, false)}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 py-2.5">
                    <p className="text-[11.5px] text-slate-400">روزهای کارکرد</p>
                    <p className="text-sm font-bold text-slate-800">{days > 0 ? `${days} روز` : "—"}</p>
                  </div>
                </div>
                {pays.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    {pays.slice(0, 5).map((p) => (
                      <div key={p.id} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-1.5 text-[13px]">
                        <span className="text-slate-500">
                          {formatJalali(p.date)}
                          {p.days ? ` · ${p.days} روز` : ""}
                          <span className="mr-1 text-slate-400">
                            {data.projs.find((x) => x.id === p.projectId)?.name ?? ""}
                          </span>
                        </span>
                        <span className="flex items-center gap-2">
                          <b className="text-emerald-700">{fmtMoney(p.amount, false)}</b>
                          <DeleteButton id={p.id} action={deleteWorkerPayment} confirmText="این پرداخت حذف شود؟" />
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-4 flex justify-end border-t border-slate-100 pt-3">
                  <DeleteButton id={w.id} action={deleteWorker} confirmText="کارگر و سوابقش حذف شود؟" />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
