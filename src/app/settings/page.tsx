import Link from "next/link";
import {
  Landmark, Building2, Tags, Users, ArrowLeftRight, ScrollText,
  HardHat, FileText, CheckCircle2, AlertCircle, Download,
} from "lucide-react";
import { Card, CardHeader, Badge } from "@/components/ui";
import { InstallPrompt } from "@/components/pwa";
import { ResetButton } from "@/components/reset-button";
import { ConnectionStatus } from "@/components/update-banner";
import { APP_VERSION, APP_NAME, BUILD_DATE } from "@/lib/version";
import { loadAll } from "@/lib/finance";
import { fmtNumber } from "@/lib/format";
import { formatJalali, todayISO } from "@/lib/jalali";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const data = await loadAll();

  const checks = [
    {
      label: "حساب بانکی ثبت کن",
      href: "/accounts",
      done: data.accts.length > 0,
      count: data.accts.length,
      icon: Landmark,
      hint: "هر کارتی که با آن کار می‌کنی + موجودی اولیه",
    },
    {
      label: "پروژه ساختمانی تعریف کن",
      href: "/projects",
      done: data.projs.length > 0,
      count: data.projs.length,
      icon: Building2,
      hint: "نام، کلمات کلیدی، برآورد هزینه و درآمد",
    },
    {
      label: "طرف حساب‌ها را اضافه کن",
      href: "/parties",
      done: data.parties.length > 0,
      count: data.parties.length,
      icon: Users,
      hint: "فروشندگان مصالح و پیمانکاران — برای فهمیدن بدهی",
    },
    {
      label: "دسته‌بندی‌ها را چک کن",
      href: "/categories",
      done: data.cats.length > 0,
      count: data.cats.length,
      icon: Tags,
      hint: "سیمان، میلگرد، آرماتور، نازک‌کاری و...",
    },
    {
      label: "پیمانکاران را ثبت کن",
      href: "/contractors",
      done: data.conts.length > 0,
      count: data.conts.length,
      icon: HardHat,
      hint: "برای صورت‌وضعیت و مانده حساب",
    },
    {
      label: "اولین تراکنش را وارد کن",
      href: "/import",
      done: data.txs.length > 0,
      count: data.txs.length,
      icon: ArrowLeftRight,
      hint: "پرینت بانک را بچسبان تا خودکار دسته‌بندی شود",
    },
  ];

  const doneCount = checks.filter((c) => c.done).length;

  const stats = [
    { label: "پروژه", value: data.projs.length },
    { label: "حساب بانکی", value: data.accts.length },
    { label: "طرف حساب", value: data.parties.length },
    { label: "دسته", value: data.cats.length },
    { label: "مراحل ساخت", value: data.stgs.length },
    { label: "پیمانکار", value: data.conts.length },
    { label: "کارگر", value: data.wrks.length },
    { label: "واحد", value: data.unts.length },
    { label: "مجوز", value: data.perms.length },
    { label: "چک", value: data.chqs.length },
    { label: "فاکتور نسیه", value: data.invoices.length },
    { label: "صورت‌وضعیت", value: data.stmts.length },
    { label: "تراکنش", value: data.txs.length },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold">
          <span className="text-gradient">تنظیمات</span>
        </h1>
        <p className="mt-1 text-[12.5px] text-slate-400">
          نصب برنامه، راهنمای شروع، وضعیت داده‌ها و پاک‌سازی
        </p>
      </div>

      {/* چک‌لیست شروع */}
      <Card>
        <CardHeader
          title="چک‌لیست راه‌اندازی"
          subtitle={`${fmtNumber(doneCount)} از ${fmtNumber(checks.length)} مرحله انجام شده`}
          accent={doneCount === checks.length ? "emerald" : "amber"}
        />
        <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
          {checks.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className={`card-glass-hover rounded-xl border p-3.5 ${
                c.done ? "border-emerald-400/25 bg-emerald-500/5" : "border-amber-400/25 bg-amber-500/5"
              }`}
            >
              <div className="flex items-start gap-2.5">
                {c.done ? (
                  <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-emerald-400" />
                ) : (
                  <AlertCircle size={17} className="mt-0.5 shrink-0 text-amber-400" />
                )}
                <div className="min-w-0">
                  <p className="text-[13.5px] font-bold text-slate-600">{c.label}</p>
                  <p className="mt-1 text-[11.5px] leading-5 text-slate-400">{c.hint}</p>
                  <p className="mt-1.5 text-[11.5px] font-medium">
                    {c.done ? (
                      <Badge tone="green">{fmtNumber(c.count)} ثبت شده</Badge>
                    ) : (
                      <Badge tone="amber">انجام نشده</Badge>
                    )}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </Card>

      {/* نصب برنامه */}
      <Card>
        <CardHeader
          title="نصب روی گوشی یا کامپیوتر"
          subtitle="بدون نوار آدرس، مثل یک اپ واقعی"
          accent="violet"
        />
        <div className="grid gap-4 p-5 lg:grid-cols-2">
          <div className="space-y-3">
            <div className="rounded-xl border border-sky-400/25 bg-sky-500/10 p-3.5">
              <p className="mb-1.5 text-[13.5px] font-bold text-sky-300">📱 آیفون / آیپد</p>
              <ol className="list-inside list-decimal space-y-1 text-[13px] leading-6 text-slate-500">
                <li>صفحه را در <b>Safari</b> باز کن</li>
                <li>دکمه <b>اشتراک</b> (مربع با فلش بالا)</li>
                <li><b>Add to Home Screen</b> / افزودن به صفحه اصلی</li>
                <li>دکمه <b>Add</b></li>
              </ol>
            </div>
            <div className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 p-3.5">
              <p className="mb-1.5 text-[13.5px] font-bold text-emerald-300">🤖 اندروید</p>
              <ol className="list-inside list-decimal space-y-1 text-[13px] leading-6 text-slate-500">
                <li>مرورگر <b>Chrome</b></li>
                <li>منوی <b>⋮</b> ← <b>Install app</b></li>
                <li>یا نوار «نصب برنامه» پایین صفحه</li>
              </ol>
            </div>
          </div>
          <div className="space-y-3">
            <div className="rounded-xl border border-violet-400/25 bg-violet-500/10 p-3.5">
              <p className="mb-1.5 text-[13.5px] font-bold text-violet-300">💻 ویندوز / مک</p>
              <ol className="list-inside list-decimal space-y-1 text-[13px] leading-6 text-slate-500">
                <li>در Chrome یا Edge، آیکون <b>نصب</b> در نوار آدرس (سمت چپ)</li>
                <li>یا منوی <b>⋮</b> ← <b>Install page as app</b></li>
                <li>پنجره مستقل با آیکون خودش باز می‌شود</li>
              </ol>
            </div>
            <div className="rounded-xl bg-slate-100 p-3.5">
              <p className="mb-1.5 flex items-center gap-1.5 text-[13.5px] font-bold text-slate-600">
                <Download size={13} />
                میان‌برهای سریع بعد از نصب
              </p>
              <p className="text-[13px] leading-6 text-slate-500">
                با کلیک راست / نگه‌داشتن روی آیکون برنامه، سه میان‌بر مستقیم داری:
                <b> ثبت تراکنش</b>، <b>پرینت بانک</b>، <b>گزارش‌ساز</b>.
              </p>
            </div>
          </div>
        </div>
        <div className="border-t border-slate-200/70 p-4">
          <div className="max-w-xs">
            <InstallPrompt />
          </div>
        </div>
      </Card>

      {/* وضعیت داده‌ها */}
      <Card>
        <CardHeader title="وضعیت داده‌ها" subtitle={`آخرین بازدید: ${formatJalali(todayISO())}`} accent="sky" />
        <div className="grid grid-cols-2 gap-2.5 p-4 sm:grid-cols-3 lg:grid-cols-5">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl bg-slate-100 p-3 text-center">
              <p className="text-lg font-extrabold text-slate-700">{fmtNumber(s.value)}</p>
              <p className="mt-0.5 text-[11.5px] text-slate-400">{s.label}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* نسخه و به‌روزرسانی */}
      <Card>
        <CardHeader
          title="نسخه و به‌روزرسانی"
          subtitle="وضعیت اتصال به سرور و همگام‌سازی بین دستگاه‌ها"
          accent="emerald"
        />
        <div className="space-y-4 p-5">
          <ConnectionStatus />

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-100 p-3">
              <p className="text-[12.5px] text-slate-400">نام برنامه</p>
              <p className="mt-1 text-[14px] font-bold text-slate-700">{APP_NAME}</p>
            </div>
            <div className="rounded-xl bg-slate-100 p-3">
              <p className="text-[12.5px] text-slate-400">نسخه</p>
              <p className="mt-1 text-[14px] font-bold text-slate-700" dir="ltr">
                v{APP_VERSION}
              </p>
            </div>
            <div className="rounded-xl bg-slate-100 p-3">
              <p className="text-[12.5px] text-slate-400">تاریخ ساخت</p>
              <p className="mt-1 text-[14px] font-bold text-slate-700">{BUILD_DATE}</p>
            </div>
          </div>

          <div className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 p-4">
            <p className="mb-2 text-[13px] font-bold text-emerald-400">
              ✅ همگام‌سازی بین موبایل و کامپیوتر
            </p>
            <p className="text-[13px] leading-7 text-slate-500">
              همه دستگاه‌ها به <b className="text-slate-300">یک دیتابیس مشترک</b> روی سرور وصل
              هستند. یعنی چیزی برای سینک کردن وجود ندارد — هر چه روی گوشی ثبت کنی،{" "}
              <b className="text-slate-300">همان لحظه</b> روی کامپیوتر هم هست و برعکس.
              <br />
              کافی است هر دو دستگاه به <b className="text-slate-300">یک آدرس سرور</b> وصل باشند.
            </p>
          </div>

          <div className="rounded-xl border border-sky-400/25 bg-sky-500/10 p-4">
            <p className="mb-2 text-[13px] font-bold text-sky-400">🔄 به‌روزرسانی خودکار</p>
            <ul className="list-inside list-disc space-y-1.5 text-[13px] leading-7 text-slate-500">
              <li>
                <b className="text-slate-300">موبایل و دسکتاپ نصب‌شده (PWA):</b> خودکار. هر ۳۰
                دقیقه نسخه جدید بررسی می‌شود و بنر «به‌روزرسانی کن» پایین صفحه می‌آید.
              </li>
              <li>
                <b className="text-slate-300">نسخه Electron:</b> از منوی{" "}
                <b className="text-slate-300">برنامه ← بررسی به‌روزرسانی</b> یا خودکار هنگام
                باز شدن برنامه.
              </li>
              <li>
                <b className="text-slate-300">داده‌ها:</b> همیشه روی سرور هستند، پس با
                به‌روزرسانی برنامه هیچ داده‌ای از دست نمی‌رود.
              </li>
            </ul>
          </div>
        </div>
      </Card>

      {/* منطقه خطر */}
      <Card>
        <CardHeader
          title="پاک‌سازی داده‌ها"
          subtitle="این عملیات قابل بازگشت نیست — از اطلاعات مهم خود نسخه پشتیبان داشته باش"
          accent="rose"
        />
        <div className="grid gap-4 p-5 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-100/50 p-4">
            <p className="text-[13.5px] font-bold text-slate-600">پاک کردن فقط داده‌های مالی</p>
            <p className="mt-1.5 text-[12.5px] leading-6 text-slate-400">
              تراکنش‌ها، چک‌ها، فاکتورهای نسیه، پرداخت‌های پیمانکار و کارگر، صورت‌وضعیت‌ها،
              مجوزها و واحدها حذف می‌شوند.
              <br />
              <b className="text-slate-300">حفظ می‌شود:</b> پروژه‌ها، حساب‌های بانکی،
              دسته‌بندی‌ها، مراحل ساخت، طرف‌حساب‌ها، پیمانکاران و کارگران.
            </p>
            <div className="mt-3">
              <ResetButton
                mode="financial"
                label="پاک کردن داده‌های مالی"
                confirmWord="پاک کن"
                description="همه تراکنش‌ها، چک‌ها، فاکتورها و پرداخت‌ها حذف می‌شوند. ساختار پروژه‌ها، حساب‌ها و دسته‌بندی‌ها باقی می‌ماند. این عملیات قابل بازگشت نیست."
              />
            </div>
          </div>

          <div className="rounded-xl border border-rose-500/25 bg-rose-500/5 p-4">
            <p className="text-[13.5px] font-bold text-rose-400">شروع از صفر مطلق</p>
            <p className="mt-1.5 text-[12.5px] leading-6 text-slate-400">
              <b>همه‌چیز</b> حذف می‌شود: پروژه‌ها، حساب‌ها، دسته‌بندی‌ها، مراحل ساخت،
              طرف‌حساب‌ها، پیمانکاران، کارگران و تمام تراکنش‌ها.
              <br />
              برنامه کاملاً خالی می‌شود و باید دوباره از مرحله ۱ شروع کنی.
            </p>
            <div className="mt-3">
              <ResetButton
                mode="all"
                label="حذف همه‌چیز"
                confirmWord="حذف کامل"
                description="همه داده‌های برنامه بدون استثنا حذف می‌شود. برنامه کاملاً خالی می‌شود و باید دوباره پروژه، حساب بانکی و دسته‌بندی بسازی. این عملیات قابل بازگشت نیست."
              />
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="text-[14.5px] font-bold text-slate-700">نکات مهم</h3>
        <ul className="mt-3 space-y-2 text-[12.5px] leading-6 text-slate-400">
          <li>
            • این برنامه روی <b className="text-slate-300">سرور ابری</b> اجرا می‌شود. نصب شدن
            (PWA) فقط ظاهر اپ می‌دهد؛ برای دیدن داده تازه به اینترنت نیاز داری.
          </li>
          <li>
            • همه مبالغ در این برنامه به <b className="text-slate-300">تومان</b> ثبت می‌شوند.
            هنگام ورود پرینت ریالی، سیستم خودش تقسیم بر ۱۰ می‌کند.
          </li>
          <li>
            • قبل از پاک‌سازی، اگر داده مهمی داری از صفحه <Link href="/reports" className="text-emerald-400 hover:text-emerald-300">گزارش‌ساز</Link> یا جداول، اسکرین‌شات بگیر.
          </li>
          <li>
            • اگر آیکون نصب در مرورگرت ظاهر نمی‌شود، مطمئن شو آدرس با <b className="text-slate-300">https</b> باز شده و مرورگر Chrome، Edge یا Safari است.
          </li>
        </ul>
      </Card>
    </div>
  );
}
