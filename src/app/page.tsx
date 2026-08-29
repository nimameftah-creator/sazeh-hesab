import Link from "next/link";
import {
  Wallet, TrendingUp, TrendingDown, Scale, ScrollText, AlertTriangle,
  Users, Building2, Bell, Sparkles, ArrowLeft,
} from "lucide-react";
import { Card, CardHeader, Badge, Empty, ProgressRing, ShareRow } from "@/components/ui";
import {
  CashflowChart, Donut, ChequeTimeline, RankBar, BudgetGauge, Sparkline,
} from "@/components/charts";
import { accountBalances, decorateTx, loadAll, monthlySeries, projectFinancials } from "@/lib/finance";
import { chequeAlerts, chequeTimeline, groupBy, monthlyTotals, partyLedger, stageReport } from "@/lib/analytics";
import { fmtCompact, fmtMoney, fmtNumber } from "@/lib/format";
import { formatJalali, jalaliMonthLabel, todayISO } from "@/lib/jalali";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const data = await loadAll();

  // ---------- حالت خالی: راهنمای شروع ----------
  const isEmpty = data.projs.length === 0 && data.accts.length === 0 && data.txs.length === 0;
  if (isEmpty) {
    const steps = [
      {
        n: 1,
        title: "حساب‌های بانکی را ثبت کن",
        desc: "هر کارت یا حسابی که با آن کار می‌کنی، همراه با موجودی اولیه. کارتی که خرج خانه می‌کنی را «شخصی» علامت بزن.",
        href: "/accounts",
        cta: "افزودن حساب بانکی",
      },
      {
        n: 2,
        title: "پروژه ساختمانی تعریف کن",
        desc: "نام پروژه را دقیقاً همان‌طور بنویس که در شرح تراکنش‌های بانکی می‌نویسی (مثلاً «گلشهر») و کلمات کلیدی‌اش را وارد کن.",
        href: "/projects",
        cta: "ساخت پروژه جدید",
      },
      {
        n: 3,
        title: "طرف حساب‌ها را اضافه کن",
        desc: "فروشندگان مصالح و پیمانکارانی که از آن‌ها خرید می‌کنی. با این کار بعداً می‌فهمی به هرکس چقدر بدهکاری.",
        href: "/parties",
        cta: "افزودن طرف حساب",
      },
      {
        n: 4,
        title: "پرینت بانک را وارد کن",
        desc: "متن پرینت را بچسبان؛ سیستم خودش تاریخ، مبلغ، پروژه، دسته هزینه و طرف حساب را تشخیص می‌دهد.",
        href: "/import",
        cta: "ورود پرینت بانک",
      },
    ];
    return (
      <div className="space-y-5">
        <div className="animate-fade card-glass overflow-hidden rounded-2xl p-6 md:p-8">
          <p className="text-[12.5px] text-slate-400">{formatJalali(todayISO())}</p>
          <h1 className="mt-1 text-2xl font-extrabold md:text-3xl">
            <span className="text-gradient">به دفتر ساختمان خوش آمدی</span>
          </h1>
          <p className="mt-3 max-w-2xl text-[13.5px] leading-7 text-slate-400">
            این برنامه تمام پول‌های پروژه‌های ساختمانی‌ات را یک‌جا نشان می‌دهد:
            هزینه‌ها به تفکیک مرحله ساخت، حساب پیمانکاران، کارگران، چک‌های خریداران،
            موجودی حساب‌ها و سود و زیان هر پروژه.
            <br />
            برای شروع، این چهار مرحله را به ترتیب انجام بده:
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {steps.map((s) => (
            <Link
              key={s.n}
              href={s.href}
              className="card-glass card-glass-hover group rounded-2xl p-5"
            >
              <div className="flex items-start gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/30 to-cyan-500/10 text-sm font-extrabold text-emerald-300 ring-1 ring-emerald-400/20">
                  {s.n}
                </span>
                <div className="min-w-0">
                  <p className="text-[14.5px] font-bold text-slate-700">{s.title}</p>
                  <p className="mt-1.5 text-[12.5px] leading-6 text-slate-400">{s.desc}</p>
                  <p className="mt-2.5 inline-flex items-center gap-1 text-[12.5px] font-medium text-emerald-400 transition group-hover:gap-2">
                    {s.cta} ←
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <Card className="p-5">
          <h3 className="text-[14.5px] font-bold text-slate-700">یک عادت طلایی که برنامه را قدرتمند می‌کند</h3>
          <p className="mt-2.5 text-[13px] leading-7 text-slate-400">
            وقتی پولی حواله می‌کنی، در شرح انتقال بانکی این الگو را بنویس:
          </p>
          <div className="mt-3 rounded-xl border border-emerald-400/25 bg-emerald-500/10 p-4 text-center">
            <p dir="rtl" className="text-[14.5px] font-bold text-emerald-300">
              گلشهر - خرید سیمان
            </p>
            <p className="mt-1.5 text-[11.5px] text-slate-400">نام پروژه ← خط تیره ← چه چیزی خریدی</p>
          </div>
          <p className="mt-3 text-[12.5px] leading-6 text-slate-400">
            با همین یک کار، سیستم خودکار می‌فهمد این پول مربوط به کدام پروژه و کدام مرحله ساخت است
            و از چه کسی خرید کردی. برای خرج خودت کلمه «<b className="text-slate-300">خونه</b>» یا
            «<b className="text-slate-300">شخصی</b>» را بنویس تا از هزینه پروژه جدا شود.
          </p>
        </Card>

        <div className="flex flex-wrap gap-2">
          <Link href="/install" className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300/70 px-3.5 py-2 text-[13px] text-slate-500 hover:border-emerald-500/50 hover:text-emerald-300">
            نصب روی کامپیوتر و موبایل ←
          </Link>
          <Link href="/settings" className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300/70 px-3.5 py-2 text-[13px] text-slate-500 hover:border-emerald-500/50 hover:text-emerald-300">
            تنظیمات و چک‌لیست راه‌اندازی ←
          </Link>
        </div>
      </div>
    );
  }

  const balances = accountBalances(data.accts, data.txs);
  const totalBalance = Object.values(balances).reduce((a, b) => a + b, 0);

  let totalExpense = 0, projectExpense = 0, personalExpense = 0, totalIncome = 0;
  const personalCatIds = new Set(data.cats.filter((c) => c.scope === "personal").map((c) => c.id));
  for (const t of data.txs) {
    if (t.type === "expense") {
      totalExpense += t.amount;
      const isPersonal = !t.projectId && t.categoryId && personalCatIds.has(t.categoryId);
      if (isPersonal) personalExpense += t.amount;
      else projectExpense += t.amount;
    } else if (t.type === "income") totalIncome += t.amount;
  }

  // تفکیک بر اساس دسته
  const catSlices = groupBy("category", data.txs.filter((t) => t.type === "expense" && t.projectId), data);
  // تفکیک بر اساس مرحله
  const stageSlices = groupBy("stage", data.txs.filter((t) => t.type === "expense" && t.projectId), data);
  // روند ماهانه
  const series = monthlySeries(data.txs, 12);
  const monthly = monthlyTotals(data.txs);
  // طرف حساب‌ها
  const ledger = partyLedger(data).filter((p) => p.type !== "buyer");
  const topSuppliers = ledger.slice(0, 8).map((p) => ({ name: p.name, value: p.cashPurchases + p.invoiceTotal }));
  const totalDebt = ledger.reduce((a, p) => a + Math.max(0, p.balance), 0);
  // چک‌ها
  const alerts = chequeAlerts(data, 14);
  const urgentAlerts = alerts.filter((a) => a.level === "overdue" || a.level === "urgent" || a.level === "soon");
  const chqTimeline = chequeTimeline(data);
  const activeCheques = data.chqs.filter((c) => c.status === "in_hand" || c.status === "received");
  const activeValue = activeCheques.reduce((a, c) => a + c.amount, 0);
  // مراحل پروژه اصلی
  const mainProject = data.projs.find((p) => p.status === "active") ?? data.projs[0];
  const stages = mainProject ? stageReport(mainProject.id, data) : [];
  const budgetUsed = mainProject && mainProject.estimatedCost > 0
    ? Math.round((projectExpense / mainProject.estimatedCost) * 100)
    : 0;

  const recent = [...data.txs].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 8).map((t) => decorateTx(t, data));
  const sparkIncome = series.map((s) => s.income);
  const sparkExpense = series.map((s) => s.expense);
  const sparkBalance = series.map((s) => s.income - s.expense);

  return (
    <div className="space-y-5">
      {/* هدر */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[12.5px] text-slate-400">نمای کلی · {formatJalali(todayISO())}</p>
          <h1 className="mt-0.5 text-2xl font-extrabold">
            <span className="text-gradient">داشبورد مدیریت ساخت‌وساز</span>
          </h1>
          <p className="mt-1 text-[12.5px] text-slate-400">
            {fmtNumber(data.projs.length)} پروژه فعال · {fmtNumber(data.txs.length)} تراکنش · {fmtNumber(data.parties.length)} طرف حساب
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/reports" className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-l from-violet-500 via-fuchsia-500 to-sky-500 px-3.5 py-2 text-[13px] font-medium text-white shadow-lg shadow-violet-900/30 hover:brightness-110">
            <Sparkles size={15} />
            گزارش‌ساز
          </Link>
          <Link href="/import" className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-l from-emerald-500 to-teal-600 px-3.5 py-2 text-[13px] font-medium text-white shadow-lg shadow-emerald-900/30 hover:brightness-110">
            <ScrollText size={15} />
            ورود پرینت بانک
          </Link>
        </div>
      </div>

      {/* KPI اصلی */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="card-glass card-glass-hover rounded-2xl p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[12.5px] text-slate-400">موجودی نقد کل</p>
              <p className="mt-1.5 text-xl font-extrabold text-sky-400">{fmtCompact(totalBalance)}</p>
              <p className="mt-0.5 text-[11.5px] text-slate-400">{fmtNumber(data.accts.length)} حساب بانکی</p>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500/30 to-sky-500/5 text-sky-300 ring-1 ring-white/5">
              <Wallet size={18} />
            </span>
          </div>
          <Sparkline data={sparkBalance} color="#38bdf8" />
        </div>
        <div className="card-glass card-glass-hover rounded-2xl p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[12.5px] text-slate-400">کل دریافتی‌ها</p>
              <p className="mt-1.5 text-xl font-extrabold text-emerald-400">{fmtCompact(totalIncome)}</p>
              <p className="mt-0.5 text-[11.5px] text-slate-400">فروش واحد + تسهیلات</p>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/30 to-emerald-500/5 text-emerald-300 ring-1 ring-white/5">
              <TrendingUp size={18} />
            </span>
          </div>
          <Sparkline data={sparkIncome} color="#10b981" />
        </div>
        <div className="card-glass card-glass-hover rounded-2xl p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[12.5px] text-slate-400">هزینه پروژه‌ها</p>
              <p className="mt-1.5 text-xl font-extrabold text-rose-400">{fmtCompact(projectExpense)}</p>
              <p className="mt-0.5 text-[11.5px] text-slate-400">جدا از خرج شخصی</p>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500/30 to-rose-500/5 text-rose-300 ring-1 ring-white/5">
              <TrendingDown size={18} />
            </span>
          </div>
          <Sparkline data={sparkExpense} color="#f43f5e" />
        </div>
        <div className="card-glass card-glass-hover rounded-2xl p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[12.5px] text-slate-400">خالص جریان نقدی</p>
              <p className={`mt-1.5 text-xl font-extrabold ${totalIncome - totalExpense >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {fmtCompact(totalIncome - totalExpense)}
              </p>
              <p className="mt-0.5 text-[11.5px] text-slate-400">خرج شخصی: {fmtCompact(personalExpense)}</p>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/30 to-violet-500/5 text-violet-300 ring-1 ring-white/5">
              <Scale size={18} />
            </span>
          </div>
          <Sparkline data={sparkBalance} color="#a78bfa" />
        </div>
      </div>

      {/* ردیف دوم: نمودار جریان نقدی + گیج بودجه + هشدار چک */}
      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="روند دریافتی و هزینه"
            subtitle="۱۲ ماه اخیر به تفکیک ماه شمسی"
            accent="emerald"
          />
          <div className="p-4">
            <CashflowChart data={series} />
          </div>
        </Card>

        <div className="space-y-4">
          {mainProject && (
            <Card>
              <CardHeader title={`مصرف بودجه · ${mainProject.name}`} accent="amber" />
              <div className="p-4">
                <BudgetGauge value={budgetUsed} />
                <div className="mt-2 grid grid-cols-2 gap-2 text-center">
                  <div className="rounded-xl bg-slate-100 p-2.5">
                    <p className="text-[11.5px] text-slate-400">برآورد کل</p>
                    <p className="text-[13px] font-bold text-slate-700">{fmtCompact(mainProject.estimatedCost)}</p>
                  </div>
                  <div className="rounded-xl bg-slate-100 p-2.5">
                    <p className="text-[11.5px] text-slate-400">هزینه‌شده</p>
                    <p className="text-[13px] font-bold text-rose-400">{fmtCompact(projectExpense)}</p>
                  </div>
                </div>
              </div>
            </Card>
          )}

          <Card>
            <CardHeader
              title="یادآور چک‌ها"
              subtitle={urgentAlerts.length > 0 ? `${urgentAlerts.length} چک نیاز به پیگیری` : "مورد فوری ندارید"}
              accent={urgentAlerts.length > 0 ? "rose" : "sky"}
              action={<Link href="/cheques" className="text-[12.5px] text-emerald-400 hover:text-emerald-300">همه ←</Link>}
            />
            <div className="max-h-[220px] space-y-2 overflow-y-auto p-4">
              {urgentAlerts.length === 0 && <Empty icon="✅" text="همه چک‌ها در وضعیت عادی هستند" />}
              {urgentAlerts.slice(0, 6).map((a) => (
                <Link
                  key={a.id}
                  href="/cheques"
                  className={`flex items-center justify-between gap-2 rounded-xl border p-2.5 transition hover:bg-slate-100 ${
                    a.level === "overdue"
                      ? "border-rose-500/30 bg-rose-500/10"
                      : a.level === "urgent"
                        ? "border-amber-500/30 bg-amber-500/10"
                        : "border-slate-200 bg-slate-100/60"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="truncate text-[12.5px] font-medium text-slate-600">
                      {a.drawer ?? "—"} · چک {a.chequeNumber}
                    </p>
                    <p className="text-[11.5px] text-slate-400">
                      {a.projectName ?? "—"} · سررسید {formatJalali(a.dueDate)}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className="text-[12.5px] font-bold text-slate-700">{fmtCompact(a.amount)}</p>
                    <p className={`text-[11.5px] ${a.level === "overdue" ? "text-rose-400" : a.level === "urgent" ? "text-amber-400" : "text-sky-400"}`}>
                      {a.daysLeft < 0 ? `${Math.abs(a.daysLeft)} روز گذشته` : a.daysLeft === 0 ? "امروز" : `${a.daysLeft} روز مانده`}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* ردیف سوم: مراحل ساخت + دسته‌ها */}
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader
            title="سهم مراحل ساخت از هزینه"
            subtitle="درصد وزنی برنامه در برابر سهم واقعی"
            accent="violet"
            action={
              mainProject && (
                <Link href={`/projects/${mainProject.id}`} className="text-[12.5px] text-emerald-400 hover:text-emerald-300">
                  جزئیات {mainProject.name} ←
                </Link>
              )
            }
          />
          <div className="p-4">
            {stageSlices.length > 0 ? (
              <Donut data={stageSlices} height={230} centerLabel="کل هزینه" centerValue={fmtCompact(stageSlices.reduce((a, b) => a + b.value, 0))} />
            ) : (
              <Empty text="هزینه‌ای ثبت نشده" />
            )}
          </div>
          {stages.length > 0 && (
            <div className="space-y-2.5 border-t border-slate-200/70 px-5 py-4">
              {stages.slice(0, 6).map((s) => {
                const overWeight = s.weight > 0 && s.sharePct > s.plannedSharePct * 1.35;
                return (
                  <div key={s.id}>
                    <ShareRow
                      name={s.name}
                      value={s.actual}
                      total={stageSlices.reduce((a, b) => a + b.value, 0) || 1}
                      color={overWeight ? "#f43f5e" : "#8b5cf6"}
                      extra={
                        s.weight > 0 ? (
                          <span className="text-[11.5px] text-slate-400">وزن {s.weight}٪</span>
                        ) : undefined
                      }
                    />
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader
            title="تفکیک هزینه بر اساس دسته"
            subtitle="سیمان، میلگرد، آرماتور، نازک‌کاری و..."
            accent="sky"
            action={<Link href="/categories" className="text-[12.5px] text-emerald-400 hover:text-emerald-300">مدیریت ←</Link>}
          />
          <div className="p-4">
            {catSlices.length > 0 ? (
              <Donut data={catSlices} height={230} centerLabel="هزینه کل" centerValue={fmtCompact(catSlices.reduce((a, b) => a + b.value, 0))} />
            ) : (
              <Empty text="هزینه‌ای ثبت نشده" />
            )}
          </div>
        </Card>
      </div>

      {/* ردیف چهارم: چک‌ها + طرف حساب‌ها */}
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader
            title="خط زمانی چک‌ها"
            subtitle="بر اساس ماه سررسید"
            accent="amber"
          />
          <div className="p-4">
            <ChequeTimeline data={chqTimeline} />
          </div>
          <div className="grid grid-cols-3 gap-2 border-t border-slate-200/70 px-5 py-3 text-center">
            <div>
              <p className="text-[11.5px] text-slate-400">در جریان</p>
              <p className="text-sm font-bold text-amber-400">{fmtCompact(activeValue)}</p>
            </div>
            <div>
              <p className="text-[11.5px] text-slate-400">نقد/واریز شده</p>
              <p className="text-sm font-bold text-emerald-400">
                {fmtCompact(data.chqs.filter((c) => c.status === "cashed" || c.status === "deposited").reduce((a, c) => a + c.amount, 0))}
              </p>
            </div>
            <div>
              <p className="text-[11.5px] text-slate-400">برگشتی</p>
              <p className="text-sm font-bold text-rose-400">
                {fmtCompact(data.chqs.filter((c) => c.status === "bounced").reduce((a, c) => a + c.amount, 0))}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="بزرگ‌ترین طرف حساب‌ها"
            subtitle={`مجموع بدهی شما: ${fmtCompact(totalDebt)}`}
            accent="rose"
            action={<Link href="/parties" className="text-[12.5px] text-emerald-400 hover:text-emerald-300">همه ←</Link>}
          />
          <div className="p-4">
            <RankBar data={topSuppliers} height={280} />
          </div>
        </Card>
      </div>

      {/* پروژه‌ها */}
      <Card>
        <CardHeader
          title="پروژه‌های ساختمانی"
          subtitle="هر پروژه جدید خودکار به داشبورد اضافه می‌شود"
          accent="emerald"
          action={<Link href="/projects" className="text-[12.5px] text-emerald-400 hover:text-emerald-300">مدیریت پروژه‌ها ←</Link>}
        />
        {data.projs.length === 0 ? (
          <Empty text="هنوز پروژه‌ای تعریف نشده" />
        ) : (
          <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
            {data.projs.map((p) => {
              const fin = projectFinancials(p.id, data);
              const pStages = stageReport(p.id, data);
              const used = p.estimatedCost > 0 ? Math.round((fin.projectExpense / p.estimatedCost) * 100) : 0;
              return (
                <Link key={p.id} href={`/projects/${p.id}`} className="card-glass-hover rounded-2xl border border-slate-200 bg-slate-100/60 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-base font-extrabold text-slate-700">{p.name}</p>
                      <p className="mt-0.5 truncate text-[12.5px] text-slate-400">{p.location ?? "—"}</p>
                    </div>
                    <ProgressRing value={p.progress} label="پیشرفت" />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-[12.5px]">
                    <div className="rounded-xl bg-slate-100 p-2.5">
                      <p className="text-slate-400">هزینه تاکنون</p>
                      <p className="mt-0.5 font-bold text-rose-400">{fmtCompact(fin.projectExpense)}</p>
                    </div>
                    <div className="rounded-xl bg-slate-100 p-2.5">
                      <p className="text-slate-400">درآمد فروش</p>
                      <p className="mt-0.5 font-bold text-emerald-400">{fmtCompact(fin.income)}</p>
                    </div>
                    <div className="rounded-xl bg-slate-100 p-2.5">
                      <p className="text-slate-400">واحد فروخته‌شده</p>
                      <p className="mt-0.5 font-bold text-slate-600">
                        {fmtNumber(fin.soldUnits)} / {fmtNumber(fin.totalUnits)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-100 p-2.5">
                      <p className="text-slate-400">بودجه مصرفی</p>
                      <p className={`mt-0.5 flex items-center gap-1 font-bold ${used > 100 ? "text-rose-400" : "text-slate-600"}`}>
                        {used > 100 && <AlertTriangle size={11} />}
                        {fmtNumber(used)}٪
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1.5">
                    {pStages.slice(0, 3).map((s) => (
                      <ShareRow
                        key={s.id}
                        name={s.name}
                        value={s.actual}
                        total={fin.projectExpense || 1}
                        color={s.weight > 0 && s.sharePct > s.plannedSharePct * 1.35 ? "#f43f5e" : "#10b981"}
                      />
                    ))}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </Card>

      {/* آخرین تراکنش‌ها */}
      <Card>
        <CardHeader
          title="آخرین تراکنش‌ها"
          accent="sky"
          action={<Link href="/transactions" className="text-[12.5px] text-emerald-400 hover:text-emerald-300">همه ←</Link>}
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px]">
            <tbody>
              {recent.map((t) => (
                <tr key={t.id} className="border-b border-slate-200/40 transition hover:bg-slate-100/50">
                  <td className="table-td text-[12.5px]">{formatJalali(t.date)}</td>
                  <td className="table-td max-w-[260px]">
                    <p className="truncate text-[13px] font-medium text-slate-600">{t.description}</p>
                    <p className="truncate text-[11.5px] text-slate-400">
                      {t.projectName ?? "شخصی"} · {t.accountName} · {t.counterparty ?? ""}
                    </p>
                  </td>
                  <td className="table-td">
                    {t.categoryName && (
                      <Badge tone={t.isPersonalCat ? "amber" : "slate"}>{t.categoryName}</Badge>
                    )}
                  </td>
                  <td className={`table-td text-left text-[13px] font-bold ${t.type === "income" ? "text-emerald-400" : t.type === "expense" ? "text-rose-400" : "text-sky-400"}`}>
                    {t.type === "transfer" ? "⇄ " : t.type === "income" ? "+ " : "− "}
                    {fmtMoney(t.amount, false)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center gap-1.5 border-t border-slate-200/70 px-5 py-2.5 text-[11.5px] text-slate-400">
          <ArrowLeft size={11} />
          برای ثبت دستی تراکنش وارد صفحه «تراکنش‌ها» شوید.
        </div>
      </Card>

      {/* خلاصه ماهانه */}
      <Card>
        <CardHeader title="خلاصه نقدی ماهانه" subtitle="دریافتی، هزینه و خالص هر ماه" accent="violet" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px]">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="table-th">ماه</th>
                <th className="table-th">دریافتی</th>
                <th className="table-th">هزینه</th>
                <th className="table-th">خالص</th>
                <th className="table-th w-1/2">نمودار</th>
              </tr>
            </thead>
            <tbody>
              {monthly.slice(-8).map((m) => {
                const net = m.income - m.expense;
                const maxV = Math.max(m.income, m.expense, 1);
                return (
                  <tr key={m.key} className="border-b border-slate-200/40">
                    <td className="table-td text-[13px] font-medium">{m.label}</td>
                    <td className="table-td text-[13px] text-emerald-400">{fmtMoney(m.income, false)}</td>
                    <td className="table-td text-[13px] text-rose-400">{fmtMoney(m.expense, false)}</td>
                    <td className={`table-td text-[13px] font-bold ${net >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {fmtMoney(net, false)}
                    </td>
                    <td className="table-td w-1/2">
                      <div className="flex items-center gap-1.5">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200/60">
                          <div className="h-full rounded-full bg-gradient-to-l from-emerald-400 to-teal-500" style={{ width: `${(m.income / maxV) * 100}%` }} />
                        </div>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200/60">
                          <div className="h-full rounded-full bg-gradient-to-l from-rose-400 to-pink-500" style={{ width: `${(m.expense / maxV) * 100}%` }} />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
