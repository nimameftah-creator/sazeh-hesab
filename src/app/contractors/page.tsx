import { Card, CardHeader, Badge, Empty } from "@/components/ui";
import {
  OpenContractorForm,
  OpenStatementForm,
  OpenContractorPaymentForm,
  DeleteButton,
} from "@/components/buttons";
import { loadAll } from "@/lib/finance";
import { fmtMoney } from "@/lib/format";
import { formatJalali } from "@/lib/jalali";
import {
  addContractor,
  addStatement,
  addContractorPayment,
  deleteContractor,
  deleteStatement,
  deleteContractorPayment,
} from "../actions";

export const dynamic = "force-dynamic";

export default async function ContractorsPage() {
  const data = await loadAll();
  const stmtStatusLabel: Record<string, { label: string; tone: "green" | "amber" | "blue" | "red" | "slate" }> = {
    approved: { label: "مصوب", tone: "blue" },
    partially_paid: { label: "پرداخت جزئی", tone: "amber" },
    paid: { label: "تسویه شد", tone: "green" },
    draft: { label: "پیش‌نویس", tone: "slate" },
    rejected: { label: "رد شد", tone: "red" },
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800">پیمانکاران</h1>
          <p className="mt-1 text-[13px] text-slate-500">صورت‌وضعیت‌ها، پرداخت‌ها و مانده حساب هر پیمانکار</p>
        </div>
        <div className="flex gap-2">
          <OpenContractorForm action={addContractor} />
          <OpenStatementForm
            action={addStatement}
            contractors={data.conts.map((c) => ({ id: c.id, name: c.name }))}
            projects={data.projs.map((p) => ({ id: p.id, name: p.name }))}
            stages={data.stgs.map((s) => ({ id: s.id, name: s.name, budget: s.budget, projectId: s.projectId }))}
          />
        </div>
      </div>

      {data.conts.length === 0 ? (
        <Card>
          <Empty text="پیمانکاری ثبت نشده است" />
        </Card>
      ) : (
        data.conts.map((c) => {
          const stmts = data.stmts.filter((s) => s.contractorId === c.id);
          const payments = data.pays.filter((p) => p.contractorId === c.id);
          const stmtTotal = stmts.reduce((a, s) => a + s.amount, 0);
          const paidTotal = payments.reduce((a, p) => a + p.amount, 0);
          return (
            <Card key={c.id}>
              <CardHeader
                title={
                  <span className="flex items-center gap-2">
                    {c.name}
                    {c.specialty && <Badge tone="violet">{c.specialty}</Badge>}
                  </span>
                }
                subtitle={c.phone ? `تلفن: ${c.phone}` : undefined}
                action={
                  <div className="flex items-center gap-3">
                    <span className="text-[13px] text-slate-500">
                      مصوب: <b>{fmtMoney(stmtTotal, false)}</b> · پرداخت‌شده:{" "}
                      <b className="text-emerald-600">{fmtMoney(paidTotal, false)}</b> · مانده:{" "}
                      <b className={stmtTotal - paidTotal > 0 ? "text-rose-600" : ""}>
                        {fmtMoney(stmtTotal - paidTotal, false)}
                      </b>
                    </span>
                    <OpenContractorPaymentForm
                      action={addContractorPayment}
                      contractors={[c]}
                      projects={data.projs.map((p) => ({ id: p.id, name: p.name }))}
                      accounts={data.accts.map((a) => ({ id: a.id, name: a.name }))}
                      categories={data.cats.map((x) => ({ id: x.id, name: x.name, kind: x.kind }))}
                      statements={stmts.map((s) => ({ id: s.id, name: s.title }))}
                      defaultContractor={c.id}
                      label="پرداخت"
                    />
                    <DeleteButton id={c.id} action={deleteContractor} confirmText="پیمانکار و همه سوابقش حذف شود؟" />
                  </div>
                }
              />
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px]">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="table-th">صورت‌وضعیت</th>
                      <th className="table-th">پروژه</th>
                      <th className="table-th">تاریخ</th>
                      <th className="table-th">مبلغ</th>
                      <th className="table-th">وضعیت</th>
                      <th className="table-th">پرداخت‌ها</th>
                      <th className="table-th"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {stmts.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-sm text-slate-400">
                          صورت‌وضعیتی ثبت نشده
                        </td>
                      </tr>
                    )}
                    {stmts.map((s) => {
                      const sp = payments
                        .filter((p) => p.statementId === s.id)
                        .reduce((a, p) => a + p.amount, 0);
                      const st = stmtStatusLabel[s.status] ?? stmtStatusLabel.approved;
                      return (
                        <tr key={s.id} className="border-b border-slate-50">
                          <td className="table-td text-[13px] font-medium">{s.title}</td>
                          <td className="table-td text-[13px]">
                            {data.projs.find((p) => p.id === s.projectId)?.name ?? "—"}
                          </td>
                          <td className="table-td text-[13px]">{formatJalali(s.date)}</td>
                          <td className="table-td font-bold">{fmtMoney(s.amount, false)}</td>
                          <td className="table-td">
                            <Badge tone={st.tone}>{st.label}</Badge>
                          </td>
                          <td className="table-td text-[13px] text-slate-500">
                            {fmtMoney(sp, false)}
                            {s.amount - sp > 0 && (
                              <span className="mr-1 text-rose-500">(مانده {fmtMoney(s.amount - sp, false)})</span>
                            )}
                          </td>
                          <td className="table-td">
                            <DeleteButton id={s.id} action={deleteStatement} confirmText="این صورت‌وضعیت حذف شود؟" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {payments.length > 0 && (
                <div className="border-t border-slate-100 px-4 py-3">
                  <p className="mb-2 text-[12.5px] font-medium text-slate-500">پرداخت‌های ثبت‌شده</p>
                  <div className="flex flex-wrap gap-2">
                    {payments.map((p) => (
                      <span key={p.id} className="inline-flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-1.5 text-[13px]">
                        <span className="text-slate-400">{formatJalali(p.date)}</span>
                        <b className="text-emerald-700">{fmtMoney(p.amount, false)}</b>
                        {p.description && <span className="text-slate-500">({p.description})</span>}
                        <span className="text-slate-300">·</span>
                        <span className="text-slate-400">
                          {data.projs.find((x) => x.id === p.projectId)?.name ?? "—"}
                        </span>
                        <DeleteButton id={p.id} action={deleteContractorPayment} confirmText="این پرداخت حذف شود؟" />
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          );
        })
      )}
    </div>
  );
}
