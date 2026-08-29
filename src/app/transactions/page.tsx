import { Card, CardHeader, Badge, Empty } from "@/components/ui";
import { OpenTxForm, DeleteButton } from "@/components/buttons";
import { decorateTx, loadAll } from "@/lib/finance";
import { fmtMoney, fmtNumber } from "@/lib/format";
import { formatJalali } from "@/lib/jalali";
import { addTransaction, deleteTransaction } from "../actions";

export const dynamic = "force-dynamic";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string; account?: string; category?: string; type?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const data = await loadAll();

  let txs = data.txs.map((t) => decorateTx(t, data));
  if (sp.project) txs = txs.filter((t) => t.projectId === sp.project);
  if (sp.account) txs = txs.filter((t) => t.accountId === sp.account);
  if (sp.category) txs = txs.filter((t) => t.categoryId === sp.category);
  if (sp.type) txs = txs.filter((t) => t.type === sp.type);
  if (sp.q) {
    const q = sp.q.trim();
    txs = txs.filter(
      (t) =>
        (t.description ?? "").includes(q) ||
        (t.counterparty ?? "").includes(q) ||
        (t.projectName ?? "").includes(q) ||
        (t.categoryName ?? "").includes(q)
    );
  }
  txs = txs.sort((a, b) => (a.date < b.date ? 1 : -1));

  const sumExpense = txs.filter((t) => t.type === "expense").reduce((a, t) => a + t.amount, 0);
  const sumIncome = txs.filter((t) => t.type === "income").reduce((a, t) => a + t.amount, 0);

  const typeLabel: Record<string, { label: string; tone: "green" | "red" | "blue" }> = {
    income: { label: "دریافت", tone: "green" },
    expense: { label: "خرج", tone: "red" },
    transfer: { label: "انتقال", tone: "blue" },
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800">تراکنش‌ها</h1>
          <p className="mt-1 text-[13px] text-slate-500">
            {fmtNumber(txs.length)} تراکنش — مجموع خرج: {fmtMoney(sumExpense, false)} · مجموع دریافت: {fmtMoney(sumIncome, false)}
          </p>
        </div>
        <OpenTxForm
          action={addTransaction}
          accounts={data.accts.map((a) => ({ id: a.id, name: a.name, bankName: a.bankName, isPersonal: a.isPersonal, initialBalance: a.initialBalance }))}
          projects={data.projs.map((p) => ({ id: p.id, name: p.name }))}
          categories={data.cats.map((c) => ({ id: c.id, name: c.name, kind: c.kind, scope: c.scope }))}
          contractors={data.conts.map((c) => ({ id: c.id, name: c.name }))}
          workers={data.wrks.map((w) => ({ id: w.id, name: w.name }))}
          parties={data.parties.map((p) => ({ id: p.id, name: p.name }))}
        />
      </div>

      <Card className="p-4">
        <form method="get" className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <div>
            <label className="field-label">پروژه</label>
            <select name="project" className="field-input" defaultValue={sp.project ?? ""}>
              <option value="">همه</option>
              {data.projs.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">حساب</label>
            <select name="account" className="field-input" defaultValue={sp.account ?? ""}>
              <option value="">همه</option>
              {data.accts.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">دسته</label>
            <select name="category" className="field-input" defaultValue={sp.category ?? ""}>
              <option value="">همه</option>
              {data.cats.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">نوع</label>
            <select name="type" className="field-input" defaultValue={sp.type ?? ""}>
              <option value="">همه</option>
              <option value="expense">خرج</option>
              <option value="income">دریافت</option>
              <option value="transfer">انتقال</option>
            </select>
          </div>
          <div>
            <label className="field-label">جستجو در شرح / طرف حساب</label>
            <input name="q" className="field-input" defaultValue={sp.q ?? ""} placeholder="مثلا: سیمان" />
          </div>
          <div className="col-span-2 flex gap-2 md:col-span-5">
            <button className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
              اعمال فیلتر
            </button>
            <a href="/transactions" className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
              حذف فیلتر
            </a>
          </div>
        </form>
      </Card>

      <Card>
        {txs.length === 0 ? (
          <Empty text="تراکنشی با این فیلتر پیدا نشد" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px]">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="table-th">تاریخ</th>
                  <th className="table-th">شرح</th>
                  <th className="table-th">طرف حساب</th>
                  <th className="table-th">مقدار</th>
                  <th className="table-th">پروژه</th>
                  <th className="table-th">حساب</th>
                  <th className="table-th">دسته</th>
                  <th className="table-th">نوع</th>
                  <th className="table-th">مبلغ</th>
                  <th className="table-th"></th>
                </tr>
              </thead>
              <tbody>
                {txs.slice(0, 300).map((t) => (
                  <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                    <td className="table-td">{formatJalali(t.date)}</td>
                    <td className="table-td max-w-[260px]">
                      <p className="truncate text-[13px] font-medium text-slate-700">{t.description}</p>
                      {t.rawText && <p className="truncate text-[11.5px] text-slate-400">{t.rawText}</p>}
                    </td>
                    <td className="table-td text-[13px]">{t.counterparty ?? "—"}</td>
                    <td className="table-td text-[12.5px] text-slate-400">
                      {t.quantity && t.unit ? `${fmtNumber(t.quantity)} ${t.unit}` : "—"}
                    </td>
                    <td className="table-td text-[13px]">
                      {t.projectName ? (
                        <Badge tone="violet">{t.projectName}</Badge>
                      ) : t.isPersonalCat ? (
                        <Badge tone="amber">شخصی</Badge>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="table-td text-[13px]">
                      {t.type === "transfer" ? (
                        <span className="text-sky-600">{t.accountName} ← {t.toAccountName}</span>
                      ) : (
                        t.accountName
                      )}
                    </td>
                    <td className="table-td text-[13px]">
                      {t.categoryName && (
                        <span className="inline-flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full" style={{ background: t.categoryColor ?? "#94a3b8" }} />
                          {t.categoryName}
                        </span>
                      )}
                    </td>
                    <td className="table-td">
                      <Badge tone={typeLabel[t.type]?.tone ?? "slate"}>{typeLabel[t.type]?.label ?? t.type}</Badge>
                    </td>
                    <td className={`table-td text-left font-bold ${t.type === "income" ? "text-emerald-600" : t.type === "expense" ? "text-rose-600" : "text-sky-600"}`}>
                      {t.type === "income" ? "+" : "−"} {fmtMoney(t.amount, false)}
                    </td>
                    <td className="table-td">
                      <DeleteButton id={t.id} action={deleteTransaction} confirmText="این تراکنش حذف شود؟ (موجودی حساب اصلاح می‌شود)" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {txs.length > 300 && (
              <p className="p-3 text-center text-[13px] text-slate-400">
                فقط ۳۰۰ ردیف اول نمایش داده می‌شود — برای دیدن بقیه از فیلتر استفاده کنید.
              </p>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
