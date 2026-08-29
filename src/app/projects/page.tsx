import Link from "next/link";
import { Card, CardHeader, Badge, ProgressBar, Empty } from "@/components/ui";
import { OpenProjectForm } from "@/components/buttons";
import { loadAll, projectFinancials } from "@/lib/finance";
import { fmtCompact, fmtNumber } from "@/lib/format";
import { formatJalali } from "@/lib/jalali";
import { addProject, updateProject } from "../actions";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const data = await loadAll();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800">پروژه‌های ساختمانی</h1>
          <p className="mt-1 text-[13px] text-slate-500">
            هر پروژه جدید که تعریف کنید، خودکار به داشبورد اضافه می‌شود
          </p>
        </div>
        <OpenProjectForm action={addProject} />
      </div>

      {data.projs.length === 0 ? (
        <Card>
          <Empty text="هنوز پروژه‌ای ندارید. اولین پروژه را ثبت کنید." />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.projs.map((p) => {
            const fin = projectFinancials(p.id, data);
            const margin = p.estimatedRevenue - p.estimatedCost;
            return (
              <Card key={p.id} className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-base font-extrabold text-slate-800">{p.name}</p>
                    <p className="mt-0.5 text-[13px] text-slate-400">
                      {p.location ?? "بدون موقعیت"} · شروع: {formatJalali(p.startDate)}
                    </p>
                  </div>
                  <Badge
                    tone={
                      p.status === "active"
                        ? "green"
                        : p.status === "completed"
                          ? "blue"
                          : p.status === "paused"
                            ? "red"
                            : "amber"
                    }
                  >
                    {p.status === "active"
                      ? "در حال ساخت"
                      : p.status === "completed"
                        ? "تمام شده"
                        : p.status === "paused"
                          ? "متوقف"
                          : "برنامه‌ریزی"}
                  </Badge>
                </div>

                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">پیشرفت</span>
                    <span className="font-bold">{fmtNumber(p.progress)}٪</span>
                  </div>
                  <ProgressBar value={p.progress} />
                  <div className="grid grid-cols-2 gap-2 pt-2 text-[13px]">
                    <div className="rounded-xl bg-slate-50 p-2.5">
                      <p className="text-slate-400">هزینه تاکنون</p>
                      <p className="mt-1 font-bold text-rose-600">{fmtCompact(fin.projectExpense)}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-2.5">
                      <p className="text-slate-400">درآمد فروش</p>
                      <p className="mt-1 font-bold text-emerald-600">{fmtCompact(fin.income)}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-2.5">
                      <p className="text-slate-400">برآورد تمام‌شده</p>
                      <p className="mt-1 font-bold text-slate-700">{fmtCompact(p.estimatedCost)}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-2.5">
                      <p className="text-slate-400">سود برآوردی</p>
                      <p className={`mt-1 font-bold ${margin >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                        {fmtCompact(margin)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex justify-between border-t border-slate-100 pt-3">
                  <Link href={`/projects/${p.id}`} className="text-sm font-medium text-emerald-600 hover:text-emerald-700">
                    مشاهده جزئیات کامل ←
                  </Link>
                  <OpenProjectForm
                    action={updateProject}
                    label="ویرایش"
                    defaults={{
                      id: p.id,
                      name: p.name,
                      keywords: p.keywords,
                      location: p.location,
                      status: p.status,
                      startDate: p.startDate,
                      progress: p.progress,
                      landCost: p.landCost,
                      estimatedCost: p.estimatedCost,
                      estimatedRevenue: p.estimatedRevenue,
                      numUnits: p.numUnits,
                      totalArea: p.totalArea,
                    }}
                  />
                </div>
              </Card>
            );
          })}
        </div>
      )}
      <p className="text-[13px] text-slate-400">
        تعداد کل: {fmtNumber(data.projs.length)} پروژه
      </p>
    </div>
  );
}
