import { Card, CardHeader, Badge, Empty } from "@/components/ui";
import { OpenCategoryForm, DeleteButton, OpenStageForm } from "@/components/buttons";
import { loadAll } from "@/lib/finance";
import { stageReport } from "@/lib/analytics";
import { fmtCompact, fmtMoney } from "@/lib/format";
import { addCategory, deleteCategory, addStage, updateStage } from "../actions";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const data = await loadAll();
  const expenses = data.cats.filter((c) => c.kind === "expense");
  const incomes = data.cats.filter((c) => c.kind === "income");

  const spent = new Map<string, number>();
  for (const t of data.txs) {
    if (t.categoryId) spent.set(t.categoryId, (spent.get(t.categoryId) ?? 0) + t.amount);
  }

  const Row = ({ c }: { c: (typeof data.cats)[number] }) => (
    <tr className="border-b border-slate-200/40 transition hover:bg-slate-100/50">
      <td className="table-td">
        <span className="flex items-center gap-2 text-[13px] font-medium text-slate-600">
          <span className="h-3 w-3 rounded-full" style={{ background: c.color ?? "#94a3b8" }} />
          {c.name}
        </span>
      </td>
      <td className="table-td">
        {c.scope === "personal" ? (
          <Badge tone="amber">شخصی</Badge>
        ) : c.scope === "both" ? (
          <Badge tone="violet">هر دو</Badge>
        ) : (
          <Badge tone="blue">پروژه</Badge>
        )}
      </td>
      <td className="table-td text-[12.5px] text-slate-400">{c.stage ?? "—"}</td>
      <td className="table-td max-w-[280px]">
        <p className="truncate text-[12.5px] text-slate-400" dir="rtl">{c.keywords ?? "—"}</p>
      </td>
      <td className="table-td text-[13px] font-bold text-slate-600">{fmtCompact(spent.get(c.id) ?? 0)}</td>
      <td className="table-td">
        <DeleteButton id={c.id} action={deleteCategory} confirmText="این دسته حذف شود؟ تراکنش‌های مرتبط بدون دسته می‌مانند." />
      </td>
    </tr>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">
            <span className="text-gradient">دسته‌بندی و مراحل ساخت</span>
          </h1>
          <p className="mt-1 text-[12.5px] leading-6 text-slate-400">
            هر دسته هزینه به یک «مرحله ساخت» وصل می‌شود تا بتوانید ببینید چه سهمی از کل پروژه
            صرف اسکلت، آرماتوربندی، دیوارچینی، سنگ‌کاری، تاسیسات و... شده است.
          </p>
        </div>
        <OpenCategoryForm action={addCategory} />
      </div>

      {/* مراحل ساخت هر پروژه */}
      {data.projs.map((p) => {
        const rows = stageReport(p.id, data);
        const totalWeight = rows.reduce((a, r) => a + r.weight, 0);
        return (
          <Card key={p.id}>
            <CardHeader
              title={`مراحل ساخت · ${p.name}`}
              subtitle={`جمع وزن‌های تعریف‌شده: ${totalWeight}٪`}
              accent="violet"
              action={
                <OpenStageForm
                  action={addStage}
                  defaults={{ projectId: p.id, name: "", weight: 0, budget: 0 }}
                  label="+ مرحله جدید"
                  tone="ghost"
                />
              }
            />
            {rows.length === 0 ? (
              <Empty text="مرحله‌ای تعریف نشده" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px]">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="table-th">مرحله</th>
                      <th className="table-th">درصد وزنی</th>
                      <th className="table-th">برآورد</th>
                      <th className="table-th">هزینه واقعی</th>
                      <th className="table-th">سهم واقعی از کل</th>
                      <th className="table-th">باقی‌مانده</th>
                      <th className="table-th"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((s) => {
                      const over = s.weight > 0 && s.sharePct > s.plannedSharePct * 1.35;
                      return (
                        <tr key={s.id} className="border-b border-slate-200/40">
                          <td className="table-td text-[13px] font-medium text-slate-600">{s.name}</td>
                          <td className="table-td">
                            {s.weight > 0 ? <Badge tone="violet">{s.weight}٪</Badge> : <span className="text-[12.5px] text-slate-400">—</span>}
                          </td>
                          <td className="table-td text-[12.5px] text-slate-400">{fmtMoney(s.budget, false)}</td>
                          <td className="table-td text-[13px] font-bold text-slate-600">{fmtMoney(s.actual, false)}</td>
                          <td className="table-td">
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-200/60">
                                <div className="h-full rounded-full" style={{ width: `${Math.min(100, s.sharePct)}%`, background: over ? "#f43f5e" : "#10b981" }} />
                              </div>
                              <span className={`text-[11.5px] ${over ? "text-rose-400" : "text-slate-400"}`}>
                                {s.sharePct.toFixed(1)}٪
                              </span>
                            </div>
                          </td>
                          <td className="table-td text-[12.5px] text-slate-400">{fmtMoney(s.remaining, false)}</td>
                          <td className="table-td">
                            <OpenStageForm
                              action={updateStage}
                              stage={{ id: s.id, name: s.name, budget: s.budget, weight: s.weight, projectId: p.id }}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        );
      })}

      <Card>
        <CardHeader title="دسته‌های هزینه" subtitle={`${expenses.length} دسته`} accent="sky" />
        {expenses.length === 0 ? (
          <Empty text="دسته‌ای نیست" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="table-th">نام</th>
                  <th className="table-th">محدوده</th>
                  <th className="table-th">مرحله ساخت</th>
                  <th className="table-th">کلیدواژه‌های تشخیص خودکار</th>
                  <th className="table-th">جمع هزینه</th>
                  <th className="table-th"></th>
                </tr>
              </thead>
              <tbody>{expenses.map((c) => <Row key={c.id} c={c} />)}</tbody>
            </table>
          </div>
        )}
      </Card>

      <Card>
        <CardHeader title="دسته‌های درآمد" subtitle={`${incomes.length} دسته`} accent="emerald" />
        {incomes.length === 0 ? (
          <Empty text="دسته‌ای نیست" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="table-th">نام</th>
                  <th className="table-th">محدوده</th>
                  <th className="table-th">مرحله ساخت</th>
                  <th className="table-th">کلیدواژه‌های تشخیص خودکار</th>
                  <th className="table-th">جمع</th>
                  <th className="table-th"></th>
                </tr>
              </thead>
              <tbody>{incomes.map((c) => <Row key={c.id} c={c} />)}</tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="p-5">
        <h3 className="text-[14.5px] font-bold text-slate-700">چطور دسته‌بندی خودکار را دقیق‌تر کنیم؟</h3>
        <ul className="mt-3 space-y-2 text-[12.5px] leading-6 text-slate-400">
          <li>• هرچه شرح تراکنش بانک دقیق‌تر باشد، دسته‌بندی بهتر می‌شود: <b className="text-slate-300">«گلشهر - خرید میلگرد ۱۸»</b> ← پروژه گلشهر + مرحله آرماتوربندی.</li>
          <li>• کلیدواژه‌ها را با ویرگول جدا کنید: <b className="text-slate-300">میلگرد، آرماتور، تیرآهن، اسکلت</b></li>
          <li>• «مرحله ساخت» هر دسته، همان چیزی است که درصد وزنی و سهم هزینه را در داشبورد می‌سازد.</li>
          <li>• هزینه‌های زندگی را با «خونه / شخصی» علامت بزنید تا از هزینه پروژه جدا شوند.</li>
          <li>• انتقال به کارت خودتان با «کارت خودم» نوع «انتقال» می‌گیرد و وارد هزینه پروژه نمی‌شود.</li>
        </ul>
      </Card>
    </div>
  );
}
