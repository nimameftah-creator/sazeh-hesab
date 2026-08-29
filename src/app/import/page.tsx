import { ImportWizard } from "@/components/import-wizard";
import { loadAll } from "@/lib/finance";

export const dynamic = "force-dynamic";

export default async function ImportPage() {
  const data = await loadAll();
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-extrabold text-slate-800">ورود خودکار پرینت بانک</h1>
        <p className="mt-1 text-[13px] leading-6 text-slate-500">
          متن پرینت بانک (SMS یا خروجی) را بچسبانید؛ سیستم خودش تاریخ، مبلغ، پروژه (مثلا
          «گلشهر»)، دسته هزینه (مثلا «خرید سیمان» ← مصالح) و نام طرف حساب (فامیلی در شرح
          انتقال) را تشخیص می‌دهد. قبل از ثبت نهایی همه ردیف‌ها را بازبینی می‌کنید.
        </p>
      </div>
      <ImportWizard
        accounts={data.accts.map((a) => ({
          id: a.id,
          name: a.name,
          bankName: a.bankName,
          isPersonal: a.isPersonal,
          initialBalance: a.initialBalance,
        }))}
        projects={data.projs.map((p) => ({ id: p.id, name: p.name, keywords: p.keywords }))}
        categories={data.cats.map((c) => ({
          id: c.id,
          name: c.name,
          kind: c.kind,
          scope: c.scope,
          keywords: c.keywords,
        }))}
        parties={data.parties.map((p) => ({
          id: p.id,
          name: p.name,
          keywords: p.keywords,
        }))}
      />
    </div>
  );
}
