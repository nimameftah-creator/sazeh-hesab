import { Card, CardHeader, Badge, Empty } from "@/components/ui";
import { OpenAccountForm, DeleteButton } from "@/components/buttons";
import { accountBalances, decorateTx, loadAll } from "@/lib/finance";
import { fmtCompact, fmtMoney } from "@/lib/format";
import { formatJalali } from "@/lib/jalali";
import { addAccount, deleteAccount } from "../actions";

export const dynamic = "force-dynamic";

export default async function AccountsPage() {
  const data = await loadAll();
  const balances = accountBalances(data.accts, data.txs);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800">حساب‌های بانکی</h1>
          <p className="mt-1 text-[13px] text-slate-500">
            مجموع موجودی فعلی: {fmtCompact(Object.values(balances).reduce((a, b) => a + b, 0))}
          </p>
        </div>
        <OpenAccountForm action={addAccount} />
      </div>

      {data.accts.length === 0 ? (
        <Card>
          <Empty text="حسابی ثبت نشده. اولین حساب بانکی خود را اضافه کنید." />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.accts.map((a) => {
            const balance = balances[a.id] ?? 0;
            const acctTxs = data.txs
              .filter((t) => t.accountId === a.id || t.toAccountId === a.id)
              .sort((x, y) => (x.date < y.date ? 1 : -1))
              .slice(0, 6)
              .map((t) => decorateTx(t, data));
            const inflow = data.txs
              .filter((t) => t.accountId === a.id && t.type === "income")
              .reduce((s, t) => s + t.amount, 0) +
              data.txs
                .filter((t) => t.toAccountId === a.id && t.type === "transfer")
                .reduce((s, t) => s + t.amount, 0);
            const outflow = data.txs
              .filter((t) => t.accountId === a.id && (t.type === "expense" || t.type === "transfer"))
              .reduce((s, t) => s + t.amount, 0);
            return (
              <Card key={a.id} className="overflow-hidden">
                <div className="border-b border-slate-100 bg-gradient-to-l from-emerald-50/60 to-white px-5 py-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-slate-800">{a.name}</p>
                      <p className="mt-0.5 text-[12.5px] text-slate-400">
                        {a.bankName ?? "—"} · {a.cardNumber ?? a.accountNumber ?? "—"}
                      </p>
                    </div>
                    {a.isPersonal && <Badge tone="amber">شخصی</Badge>}
                  </div>
                  <p className="mt-3 text-2xl font-extrabold text-slate-900">
                    {fmtMoney(balance)}
                  </p>
                  <div className="mt-1 flex gap-3 text-[12.5px] text-slate-400">
                    <span>مانده اولیه: {fmtMoney(a.initialBalance, false)}</span>
                  </div>
                </div>
                <div className="flex divide-x divide-slate-100 border-b border-slate-100 text-center">
                  <div className="flex-1 py-2.5">
                    <p className="text-[11.5px] text-slate-400">مجموع واریز</p>
                    <p className="text-sm font-bold text-emerald-600">+{fmtMoney(inflow, false)}</p>
                  </div>
                  <div className="flex-1 py-2.5">
                    <p className="text-[11.5px] text-slate-400">مجموع برداشت</p>
                    <p className="text-sm font-bold text-rose-600">−{fmtMoney(outflow, false)}</p>
                  </div>
                </div>
                <div className="px-5 py-3">
                  <p className="mb-2 text-[12.5px] font-medium text-slate-500">آخرین تراکنش‌ها</p>
                  <div className="space-y-1.5">
                    {acctTxs.length === 0 && <p className="text-[13px] text-slate-400">تراکنشی ثبت نشده</p>}
                    {acctTxs.map((t) => (
                      <div key={t.id} className="flex items-center justify-between gap-2 text-[13px]">
                        <span className="min-w-0">
                          <span className="text-slate-400">{formatJalali(t.date)}</span>{" "}
                          <span className="truncate text-slate-600">{t.description}</span>
                        </span>
                        <span className={`shrink-0 font-bold ${t.type === "income" ? "text-emerald-600" : t.type === "expense" ? "text-rose-600" : "text-sky-600"}`}>
                          {t.type === "transfer" && t.toAccountId === a.id ? "+" : t.type === "income" ? "+" : "−"}
                          {fmtMoney(t.amount, false)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="border-t border-slate-100 px-5 py-3">
                  <DeleteButton
                    id={a.id}
                    action={deleteAccount}
                    confirmText="با حذف حساب، تراکنش‌های آن هم حذف می‌شوند. ادامه می‌دهید؟"
                  />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
