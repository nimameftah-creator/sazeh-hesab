import Link from "next/link";
import { Card, CardHeader, Badge, Empty } from "@/components/ui";
import { PriceSpark, RankBar } from "@/components/charts";
import { DeleteButton, OpenMaterialForm } from "@/components/buttons";
import { loadAll } from "@/lib/finance";
import { materialSummaries } from "@/lib/pricing";
import { fmtCompact, fmtMoney, fmtNumber } from "@/lib/format";
import { formatJalali, toFaDigits } from "@/lib/jalali";
import { addMaterial, deleteMaterial } from "../actions";

export const dynamic = "force-dynamic";

export default async function MaterialsPage() {
  const data = await loadAll();
  const summaries = materialSummaries(data);
  const withData = summaries.filter((s) => s.purchaseCount > 0);

  const totalSpend = summaries.reduce((a, s) => a + s.totalSpend, 0);
  const risers = withData.filter((s) => (s.changePct ?? 0) > 0);

  // گران‌ترین رشدها
  const topRisers = [...withData]
    .filter((s) => s.changePct !== null)
    .sort((a, b) => (b.changePct ?? 0) - (a.changePct ?? 0))
    .slice(0, 8);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">
            <span className="text-gradient">کالاها و روند قیمت</span>
          </h1>
          <p className="mt-1 text-[12.5px] leading-6 text-slate-400">
            قیمت فی هر کالا از فاکتورهای خرید استخراج می‌شود و روند تغییرش در زمان نشان داده می‌شود
          </p>
        </div>
        <OpenMaterialForm
          action={addMaterial}
          categories={data.cats.filter((c) => c.kind === "expense").map((c) => ({
            id: c.id,
            name: c.name,
          }))}
        />
      </div>

      {/* آمار کلی */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="card-glass rounded-2xl p-4">
          <p className="text-[12.5px] text-slate-400">تعداد کالاها</p>
          <p className="mt-1.5 text-xl font-extrabold text-slate-700">{fmtNumber(summaries.length)}</p>
        </div>
        <div className="card-glass rounded-2xl p-4">
          <p className="text-[12.5px] text-slate-400">دارای سابقه خرید</p>
          <p className="mt-1.5 text-xl font-extrabold text-emerald-400">{fmtNumber(withData.length)}</p>
        </div>
        <div className="card-glass rounded-2xl p-4">
          <p className="text-[12.5px] text-slate-400">جمع خرید مصالح</p>
          <p className="mt-1.5 text-xl font-extrabold text-sky-400">{fmtCompact(totalSpend)}</p>
        </div>
        <div className="card-glass rounded-2xl p-4">
          <p className="text-[12.5px] text-slate-400">کالاهای گران‌شده</p>
          <p className="mt-1.5 text-xl font-extrabold text-rose-400">{fmtNumber(risers.length)}</p>
          <p className="mt-0.5 text-[11.5px] text-slate-400">نسبت به خرید قبلی</p>
        </div>
      </div>

      {summaries.length === 0 ? (
        <Card>
          <Empty
            icon="🧱"
            text="هنوز کالایی تعریف نشده. اول کالاها را بساز، بعد در فاکتور خرید قیمت فی‌شان را وارد کن."
          />
        </Card>
      ) : (
        <>
          {/* نمودار گران‌ترین رشدها */}
          {topRisers.length > 0 && (
            <Card>
              <CardHeader
                title="بیشترین افزایش قیمت"
                subtitle="نسبت به آخرین خرید قبلی"
                accent="rose"
              />
              <div className="p-4">
                <RankBar
                  data={topRisers.map((s) => ({
                    name: `${s.name} (${s.changePct !== null && s.changePct > 0 ? "+" : ""}${toFaDigits(Math.round(s.changePct ?? 0))}٪)`,
                    value: Math.round(s.latestPrice ?? 0),
                  }))}
                  unit="تومان"
                  color="#f43f5e"
                />
              </div>
            </Card>
          )}

          {/* جدول کالاها */}
          <Card>
            <CardHeader
              title="فهرست کالاها"
              subtitle="روی هر کالا کلیک کن تا نمودار کامل روند قیمت را ببینی"
              accent="emerald"
            />
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px]">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="table-th">کالا</th>
                    <th className="table-th">آخرین قیمت فی</th>
                    <th className="table-th">تغییر</th>
                    <th className="table-th">روند</th>
                    <th className="table-th">جمع خرید</th>
                    <th className="table-th">مقدار کل</th>
                    <th className="table-th">تعداد خرید</th>
                    <th className="table-th">آخرین خرید</th>
                    <th className="table-th"></th>
                  </tr>
                </thead>
                <tbody>
                  {summaries.map((s) => {
                    const up = (s.changePct ?? 0) > 0;
                    const down = (s.changePct ?? 0) < 0;
                    return (
                      <tr key={s.id} className="border-b border-slate-200/40 transition hover:bg-slate-100/50">
                        <td className="table-td">
                          <Link
                            href={`/materials/${s.id}`}
                            className="text-[13.5px] font-bold text-emerald-400 hover:text-emerald-300"
                          >
                            {s.name}
                          </Link>
                          <p className="mt-0.5 text-[11.5px] text-slate-400">واحد: {s.unit}</p>
                        </td>
                        <td className="table-td">
                          {s.latestPrice !== null ? (
                            <span className="text-[13.5px] font-bold text-slate-600">
                              {fmtMoney(s.latestPrice, false)}
                            </span>
                          ) : (
                            <span className="text-[12.5px] text-slate-400">بدون خرید</span>
                          )}
                        </td>
                        <td className="table-td">
                          {s.changePct === null ? (
                            <span className="text-[12.5px] text-slate-400">—</span>
                          ) : (
                            <Badge tone={up ? "red" : down ? "green" : "slate"}>
                              {up ? "▲" : down ? "▼" : "■"}{" "}
                              {toFaDigits(Math.abs(Math.round(s.changePct)))}٪
                            </Badge>
                          )}
                        </td>
                        <td className="table-td">
                          <PriceSpark
                            data={s.points.map((p) => p.price)}
                            color={up ? "#f43f5e" : "#10b981"}
                          />
                        </td>
                        <td className="table-td text-[13px] text-slate-500">{fmtMoney(s.totalSpend, false)}</td>
                        <td className="table-td text-[13px] text-slate-500">
                          {s.totalQty > 0 ? `${fmtNumber(s.totalQty)} ${s.unit}` : "—"}
                        </td>
                        <td className="table-td text-[13px]">{fmtNumber(s.purchaseCount)}</td>
                        <td className="table-td text-[12.5px] text-slate-400">
                          {s.lastDate ? formatJalali(s.lastDate) : "—"}
                        </td>
                        <td className="table-td">
                          <DeleteButton
                            id={s.id}
                            action={deleteMaterial}
                            itemName={s.name}
                            confirmText="این کالا و همه اقلام فاکتور مرتبط با آن حذف شوند؟"
                          />
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

      <Card className="p-5">
        <h3 className="text-[14.5px] font-bold text-slate-700">چطور قیمت فی وارد برنامه می‌شود؟</h3>
        <ol className="mt-3 list-inside list-decimal space-y-2 text-[13px] leading-7 text-slate-400">
          <li>
            در صفحه <Link href="/parties" className="text-emerald-400 hover:text-emerald-300">طرف حساب‌ها</Link>{" "}
            یا همین صفحه، دکمه <b className="text-slate-300">«ثبت فاکتور خرید»</b> را بزن.
          </li>
          <li>
            فروشنده، شماره فاکتور و تاریخ را وارد کن؛ بعد برای هر قلم: <b className="text-slate-300">کالا + مقدار + قیمت فی</b>.
          </li>
          <li>
            اگر پولش را همان لحظه دادی، مبلغ پرداختی و حساب بانکی را هم انتخاب کن تا تراکنش خودکار ثبت و به فاکتور متصل شود.
          </li>
          <li>
            از آن لحظه، آن قیمت فی در <b className="text-slate-300">نمودار روند قیمت</b> همان کالا ثبت می‌شود.
          </li>
        </ol>
        <p className="mt-3 rounded-xl bg-slate-100 px-3 py-2 text-[12.5px] leading-6 text-slate-400">
          💡 اگر فاکتور رسمی نداری و مستقیم کارت به کارت کردی، در فرم ثبت تراکنش هم می‌توانی{" "}
          <b className="text-slate-300">کالا + مقدار</b> را وارد کنی؛ برنامه خودش فی را از
          «مبلغ ÷ مقدار» محاسبه و در نمودار نشان می‌دهد.
        </p>
      </Card>
    </div>
  );
}
