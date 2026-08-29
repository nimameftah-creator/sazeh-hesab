import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardHeader, Stat, Badge, ProgressBar, Empty } from "@/components/ui";
import {
  OpenProjectForm,
  OpenUnitForm,
  OpenUnitEditForm,
  OpenPermitForm,
  OpenContractorPaymentForm,
  DeleteButton,
  OpenStageForm,
  PermitStatusSelect,
} from "@/components/buttons";
import { StageBars } from "@/components/charts";
import { decorateTx, loadAll, projectFinancials } from "@/lib/finance";
import { stageReport } from "@/lib/analytics";
import { fmtCompact, fmtMoney, fmtNumber } from "@/lib/format";
import { formatJalali } from "@/lib/jalali";
import {
  addPermit,
  addUnit,
  addContractorPayment,
  deletePermit,
  deleteUnit,
  updatePermitStatus,
  updateProject,
  updateStage,
  updateUnit,
  deleteProject,
  addStage,
} from "../../actions";

export const dynamic = "force-dynamic";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await loadAll();
  const project = data.projs.find((p) => p.id === id);
  if (!project) notFound();

  const fin = projectFinancials(id, data);
  const projectStages = data.stgs.filter((s) => s.projectId === id);
  const projectUnits = data.unts.filter((u) => u.projectId === id);
  const projectPermits = data.perms.filter((p) => p.projectId === id);
  const projectTxs = data.txs
    .filter((t) => t.projectId === id)
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 12)
    .map((t) => decorateTx(t, data));

  const stageRows = stageReport(id, data);

  const categoryNames = new Map(data.cats.map((c) => [c.id, c]));
  const catRows = Object.entries(fin.byCategory)
    .filter(([catId]) => {
      const c = categoryNames.get(catId);
      return c?.kind !== "income";
    })
    .map(([catId, value]) => ({
      id: catId,
      name: categoryNames.get(catId)?.name ?? "بدون دسته",
      color: categoryNames.get(catId)?.color ?? "#94a3b8",
      value,
    }))
    .sort((a, b) => b.value - a.value);

  const margin = project.estimatedRevenue - project.estimatedCost;
  const spentRatio =
    project.estimatedCost > 0
      ? Math.round((fin.projectExpense / project.estimatedCost) * 100)
      : 0;

  const statusLabel: Record<string, string> = {
    active: "در حال ساخت",
    completed: "تمام شده",
    paused: "متوقف",
    planned: "برنامه‌ریزی",
  };
  const statusTone: Record<string, "green" | "blue" | "red" | "amber"> = {
    active: "green",
    completed: "blue",
    paused: "red",
    planned: "amber",
  };
  const permitStatusLabel: Record<string, string> = {
    in_progress: "در حال پیگیری",
    pending: "در انتظار صدور",
    issued: "صادر شده",
    rejected: "رد شده",
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/projects" className="text-[13px] text-slate-400 hover:text-slate-600">
              پروژه‌ها ←
            </Link>
          </div>
          <h1 className="mt-1 text-xl font-extrabold text-slate-800">{project.name}</h1>
          <p className="mt-1 text-[13px] text-slate-500">
            {project.location ?? "—"} · شروع {formatJalali(project.startDate)} · زیربنا{" "}
            {project.totalArea ? `${fmtNumber(project.totalArea)} مترمربع` : "—"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={statusTone[project.status] ?? "slate"}>{statusLabel[project.status] ?? project.status}</Badge>
          <OpenProjectForm
            action={updateProject}
            label="ویرایش پروژه"
            defaults={{
              id: project.id,
              name: project.name,
              keywords: project.keywords,
              location: project.location,
              status: project.status,
              startDate: project.startDate,
              progress: project.progress,
              landCost: project.landCost,
              estimatedCost: project.estimatedCost,
              estimatedRevenue: project.estimatedRevenue,
              numUnits: project.numUnits,
              totalArea: project.totalArea,
            }}
          />
          <DeleteButton id={project.id} action={deleteProject} label="حذف" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Stat label="هزینه تاکنون" value={fmtCompact(fin.projectExpense)} tone="bad" />
        <Stat label="برآورد تمام‌شده" value={fmtCompact(project.estimatedCost)} sub={`${fmtNumber(spentRatio)}٪ بودجه مصرف شده`} tone={spentRatio > 100 ? "bad" : "default"} />
        <Stat label="درآمد (فروش)" value={fmtCompact(fin.income)} tone="good" />
        <Stat label="سود برآوردی" value={fmtCompact(margin)} tone={margin >= 0 ? "good" : "bad"} />
        <Stat
          label="هزینه هر مترمربع"
          value={fin.costPerMeter ? fmtMoney(fin.costPerMeter) : "—"}
          tone="info"
          sub="بر اساس هزینه واقعی تاکنون"
        />
        <Stat label="پیشرفت" value={`${fmtNumber(project.progress)}٪`} tone="warn" />
      </div>

      {/* مراحل ساخت */}
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader
            title="مراحل ساخت — برآورد در برابر هزینه واقعی"
            subtitle="هزینه واقعی از تراکنش‌ها و صورت‌وضعیت‌های مصوب محاسبه می‌شود"
          />
          <div className="p-4">
            <StageBars data={stageRows} />
          </div>
        </Card>
        <Card>
          <CardHeader
            title="مراحل ساخت — وزن، برآورد و هزینه واقعی"
            subtitle="درصد وزنی = سهم برنامه‌ای مرحله از کل ساخت"
            accent="violet"
            action={
              <OpenStageForm
                action={addStage}
                defaults={{ projectId: id, name: "", weight: 0, budget: 0 }}
                label="+ مرحله جدید"
                tone="ghost"
              />
            }
          />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="table-th">مرحله</th>
                  <th className="table-th">وزن</th>
                  <th className="table-th">برآورد</th>
                  <th className="table-th">هزینه واقعی</th>
                  <th className="table-th">سهم واقعی</th>
                  <th className="table-th">انحراف</th>
                  <th className="table-th"></th>
                </tr>
              </thead>
              <tbody>
                {stageRows.map((s) => {
                  const overWeight = s.weight > 0 && s.sharePct > s.plannedSharePct * 1.35;
                  return (
                    <tr key={s.id} className="border-b border-slate-200/40">
                      <td className="table-td text-[13px] font-medium text-slate-600">{s.name}</td>
                      <td className="table-td text-[13px]">
                        {s.weight > 0 ? <Badge tone="violet">{s.weight}٪</Badge> : "—"}
                      </td>
                      <td className="table-td text-[13px] text-slate-500">{fmtMoney(s.budget, false)}</td>
                      <td className="table-td text-[13px] font-bold text-slate-600">{fmtMoney(s.actual, false)}</td>
                      <td className="table-td">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-200/60">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${Math.min(100, s.sharePct)}%`, background: overWeight ? "#f43f5e" : "#10b981" }}
                            />
                          </div>
                          <span className="text-[11.5px] text-slate-400">{s.sharePct.toFixed(1)}٪</span>
                        </div>
                      </td>
                      <td className={`table-td text-[13px] font-bold ${s.deviation > 0 ? "text-rose-400" : "text-emerald-400"}`}>
                        {s.deviation > 0 ? "+" : ""}{fmtMoney(s.deviation, false)}
                      </td>
                      <td className="table-td">
                        <OpenStageForm
                          action={updateStage}
                          stage={{ id: s.id, name: s.name, budget: s.budget, weight: s.weight, projectId: id }}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* واحدها */}
      <Card>
        <CardHeader
          title={`واحدها (${fmtNumber(projectUnits.length)})`}
          subtitle="وضعیت فروش واحدها"
          action={<OpenUnitForm action={addUnit} projects={[project]} />}
        />
        {projectUnits.length === 0 ? (
          <Empty text="واحدی ثبت نشده است" />
        ) : (
          <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
            {projectUnits.map((u) => (
              <div key={u.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-slate-800">{u.unitNumber}</p>
                  <Badge tone={u.status === "sold" ? "green" : u.status === "reserved" ? "amber" : "slate"}>
                    {u.status === "sold" ? "فروخته شد" : u.status === "reserved" ? "رزرو" : "آزاد"}
                  </Badge>
                </div>
                <div className="mt-2 space-y-1 text-[13px] text-slate-500">
                  <p>طبقه {u.floor ?? "—"} · {u.area ? `${fmtNumber(u.area)} متر` : "—"}</p>
                  <p>
                    قیمت پایه: <b className="text-slate-700">{fmtMoney(u.price, false)}</b>
                  </p>
                  {u.status === "sold" && (
                    <>
                      <p className="text-emerald-600">
                        فروش: <b>{fmtMoney(u.soldPrice || u.price, false)}</b> ({formatJalali(u.soldDate)})
                      </p>
                      <p>خریدار: {u.buyerName ?? "—"}</p>
                    </>
                  )}
                  {u.status === "reserved" && u.buyerName && <p>رزرو برای: {u.buyerName}</p>}
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <OpenUnitEditForm
                    action={updateUnit}
                    projects={[project]}
                    accounts={data.accts.map((a) => ({ id: a.id, name: a.name }))}
                    unit={u}
                  />
                  <DeleteButton id={u.id} action={deleteUnit} label="حذف" confirmText="این واحد حذف شود؟" />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* مجوزها */}
      <Card>
        <CardHeader
          title="مجوزها"
          subtitle="جواز ساخت، پایان کار و..."
          action={<OpenPermitForm action={addPermit} projects={[project]} />}
        />
        {projectPermits.length === 0 ? (
          <Empty text="مجوزی ثبت نشده است" />
        ) : (
          <div className="divide-y divide-slate-100">
            {projectPermits.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-700">{p.name}</p>
                  <p className="text-[12.5px] text-slate-400">
                    {p.issueDate ? `صدور: ${formatJalali(p.issueDate)}` : "—"} ·{" "}
                    {p.expiryDate ? `اعتبار: ${formatJalali(p.expiryDate)}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {p.cost > 0 && <span className="text-[13px] text-slate-500">هزینه: {fmtMoney(p.cost, false)}</span>}
                  <PermitStatusSelect permitId={p.id} status={p.status} action={updatePermitStatus} />
                  <Badge
                    tone={
                      p.status === "issued"
                        ? "green"
                        : p.status === "rejected"
                          ? "red"
                          : p.status === "pending"
                            ? "amber"
                            : "blue"
                    }
                  >
                    {permitStatusLabel[p.status] ?? p.status}
                  </Badge>
                  <DeleteButton id={p.id} action={deletePermit} label="حذف" confirmText="این مجوز حذف شود؟" />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* حساب پیمانکاران */}
      <Card>
        <CardHeader
          title="حساب‌های پیمانکاران پروژه"
          subtitle="مبلغ صورت‌وضعیت‌های مصوب در برابر پرداخت‌شده"
          action={
            <OpenContractorPaymentForm
              action={addContractorPayment}
              contractors={data.conts.map((c) => ({ id: c.id, name: c.name }))}
              projects={[project]}
              accounts={data.accts.map((a) => ({ id: a.id, name: a.name }))}
              categories={data.cats.map((c) => ({ id: c.id, name: c.name, kind: c.kind }))}
              statements={data.stmts
                .filter((s) => s.projectId === id)
                .map((s) => ({ id: s.id, name: s.title }))}
            />
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px]">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="table-th">پیمانکار</th>
                <th className="table-th">رشته</th>
                <th className="table-th">مجموع مصوب</th>
                <th className="table-th">پرداخت‌شده</th>
                <th className="table-th">مانده بدهی</th>
              </tr>
            </thead>
            <tbody>
              {fin.contractorStats
                .filter((c) => c.statementTotal > 0 || c.paidTotal > 0)
                .map((c) => {
                  const cnt = data.conts.find((x) => x.id === c.contractorId);
                  return (
                    <tr key={c.contractorId} className="border-b border-slate-50">
                      <td className="table-td font-medium">{c.name}</td>
                      <td className="table-td text-slate-500">{cnt?.specialty ?? "—"}</td>
                      <td className="table-td">{fmtMoney(c.statementTotal, false)}</td>
                      <td className="table-td text-emerald-600">{fmtMoney(c.paidTotal, false)}</td>
                      <td className={`table-td font-bold ${c.balance > 0 ? "text-rose-600" : "text-slate-400"}`}>
                        {fmtMoney(c.balance, false)}
                      </td>
                    </tr>
                  );
                })}
              {fin.contractorStats.filter((c) => c.statementTotal > 0 || c.paidTotal > 0).length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-sm text-slate-400">
                    هنوز قرارداد یا پرداختی برای پیمانکاری ثبت نشده
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        {/* تفکیک هزینه */}
        <Card>
          <CardHeader title="تفکیک هزینه‌های پروژه" subtitle="بر اساس دسته‌بندی" />
          <div className="space-y-2 p-4">
            {catRows.length === 0 && <Empty text="هزینه‌ای ثبت نشده" />}
            {catRows.map((c) => {
              const total = fin.projectExpense || 1;
              return (
                <div key={c.id}>
                  <div className="mb-1 flex justify-between text-[13px]">
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
                      {c.name}
                    </span>
                    <span className="font-medium text-slate-700">
                      {fmtCompact(c.value)} · {fmtNumber(Math.round((c.value / total) * 100))}٪
                    </span>
                  </div>
                  <ProgressBar value={(c.value / total) * 100} tone="sky" />
                </div>
              );
            })}
          </div>
        </Card>

        {/* تراکنش‌های اخیر پروژه */}
        <Card>
          <CardHeader title="آخرین تراکنش‌های پروژه" />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px]">
              <tbody>
                {projectTxs.map((t) => (
                  <tr key={t.id} className="border-b border-slate-50">
                    <td className="table-td">{formatJalali(t.date)}</td>
                    <td className="table-td max-w-[220px]">
                      <p className="truncate text-[13px] font-medium">{t.description}</p>
                      <p className="truncate text-[11.5px] text-slate-400">
                        {t.accountName} · {t.counterparty ?? ""} · {t.categoryName ?? "بدون دسته"}
                      </p>
                    </td>
                    <td className={`table-td text-left font-bold ${t.type === "income" ? "text-emerald-600" : "text-rose-600"}`}>
                      {t.type === "income" ? "+" : "−"} {fmtMoney(t.amount, false)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
