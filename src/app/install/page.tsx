import { Monitor, Smartphone, Download, Terminal, CheckCircle2, AlertTriangle } from "lucide-react";
import { Card, CardHeader, Badge } from "@/components/ui";
import { InstallPrompt } from "@/components/pwa";

export const dynamic = "force-dynamic";

const CODE = "rounded-lg bg-slate-900/70 px-2 py-1 font-mono text-[12.5px] text-emerald-300 ring-1 ring-inset ring-emerald-400/20";

function CodeBlock({ children, label }: { children: string; label?: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-900/60">
      {label && (
        <div className="flex items-center gap-1.5 border-b border-slate-200/60 px-3 py-1.5">
          <Terminal size={11} className="text-slate-400" />
          <span className="text-[11.5px] text-slate-400">{label}</span>
        </div>
      )}
      <pre dir="ltr" className="overflow-x-auto px-3 py-2.5 text-left">
        <code className="font-mono text-[13px] leading-6 text-emerald-300">{children}</code>
      </pre>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/30 to-cyan-500/10 text-[13px] font-extrabold text-emerald-300 ring-1 ring-emerald-400/20">
        {n}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-bold text-slate-600">{title}</p>
        <div className="mt-2 space-y-2 text-[13px] leading-7 text-slate-400">{children}</div>
      </div>
    </div>
  );
}

export default function InstallPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold">
          <span className="text-gradient">نصب روی کامپیوتر و موبایل</span>
        </h1>
        <p className="mt-1 text-[12.5px] leading-6 text-slate-400">
          دو راه داری: <b className="text-slate-300">نصب سریع</b> (بدون دانلود، همین الان) یا{" "}
          <b className="text-slate-300">ساخت فایل نصبی واقعی</b> برای ویندوز و مک.
        </p>
      </div>

      {/* راه اول: PWA */}
      <Card>
        <CardHeader
          title="راه اول: نصب سریع (پیشنهادی)"
          subtitle="بدون دانلود چیزی — ۳۰ ثانیه"
          accent="emerald"
          action={<Badge tone="green">همین الان کار می‌کند</Badge>}
        />
        <div className="grid gap-4 p-5 lg:grid-cols-3">
          <div className="rounded-xl border border-violet-400/25 bg-violet-500/10 p-4">
            <p className="mb-2 flex items-center gap-1.5 text-[14px] font-bold text-violet-300">
              <Monitor size={15} />
              ویندوز
            </p>
            <ol className="list-inside list-decimal space-y-1.5 text-[13px] leading-7 text-slate-500">
              <li>با <b>Edge</b> یا <b>Chrome</b> باز کن</li>
              <li>
                در <b>نوار آدرس، سمت چپ</b>، آیکون نصب (مانیتور با فلش پایین) را بزن
              </li>
              <li>یا منوی <b>⋮</b> ← <b>Apps</b> ← <b>Install this site as an app</b></li>
              <li>تایید کن</li>
            </ol>
            <p className="mt-2.5 rounded-lg bg-slate-100 p-2.5 text-[12px] leading-6 text-slate-400">
              نتیجه: آیکون در <b>منوی Start</b> و دسکتاپ، پنجره مستقل بدون نوار آدرس،
              امکان سنجاق کردن به Taskbar.
            </p>
          </div>

          <div className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 p-4">
            <p className="mb-2 flex items-center gap-1.5 text-[14px] font-bold text-emerald-300">
              <Monitor size={15} />
              مک
            </p>
            <ol className="list-inside list-decimal space-y-1.5 text-[13px] leading-7 text-slate-500">
              <li>با <b>Chrome</b> یا <b>Edge</b> باز کن (Safari هم می‌شود)</li>
              <li>منوی <b>⋮</b> ← <b>Cast, save, and share</b> ← <b>Install page as app</b></li>
              <li>تایید کن</li>
              <li>در <b>Launchpad</b> پیدایش می‌کنی</li>
            </ol>
            <p className="mt-2.5 rounded-lg bg-slate-100 p-2.5 text-[12px] leading-6 text-slate-400">
              در Safari: منوی <b>File</b> ← <b>Add to Dock</b>
            </p>
          </div>

          <div className="rounded-xl border border-sky-400/25 bg-sky-500/10 p-4">
            <p className="mb-2 flex items-center gap-1.5 text-[14px] font-bold text-sky-300">
              <Smartphone size={15} />
              موبایل
            </p>
            <p className="mb-1.5 text-[12.5px] font-bold text-slate-500">آیفون (Safari)</p>
            <ol className="list-inside list-decimal space-y-1 text-[13px] leading-6 text-slate-500">
              <li>دکمه <b>اشتراک</b> پایین صفحه</li>
              <li><b>Add to Home Screen</b></li>
            </ol>
            <p className="mb-1.5 mt-3 text-[12.5px] font-bold text-slate-500">اندروید (Chrome)</p>
            <ol className="list-inside list-decimal space-y-1 text-[13px] leading-6 text-slate-500">
              <li>منوی <b>⋮</b> ← <b>Install app</b></li>
            </ol>
          </div>
        </div>
        <div className="border-t border-slate-200/70 p-4">
          <div className="max-w-sm">
            <InstallPrompt />
          </div>
        </div>
      </Card>

      {/* راه دوم: فایل نصبی واقعی */}
      <Card>
        <CardHeader
          title="راه دوم: فایل نصبی واقعی (.exe / .dmg)"
          subtitle="اپلیکیشن دسکتاپ با پنجره و آیکون اختصاصی"
          accent="violet"
          action={<Badge tone="violet">نیاز به Node.js</Badge>}
        />
        <div className="space-y-4 p-5">
          <div className="flex gap-3 rounded-xl border border-sky-400/25 bg-sky-500/10 p-3.5">
            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-sky-300" />
            <p className="text-[13px] leading-7 text-slate-500">
              پوشه <span className={CODE}>desktop/</span> داخل پروژه آماده است. با سه دستور،
              فایل نصبی ویندوز و مک ساخته می‌شود. این کار را باید{" "}
              <b className="text-slate-300">روی کامپیوتر خودت</b> انجام دهی
              (چون فایل نصبی مخصوص همان سیستم‌عامل ساخته می‌شود).
            </p>
          </div>

          <Step n={1} title="Node.js را نصب کن (یک بار)">
            <p>
              از <span className={CODE}>nodejs.org</span> نسخه <b>LTS</b> را دانلود و نصب کن.
              برای اطمینان:
            </p>
            <CodeBlock label="CMD یا PowerShell">{`node -v`}</CodeBlock>
            <p>باید چیزی مثل <span className={CODE}>v22.11.0</span> نشان دهد.</p>
          </Step>

          <Step n={2} title="وارد پوشه پروژه شو و وابستگی‌ها را نصب کن">
            <CodeBlock label="ترمینال">{`cd daftar-sakhteman
cd desktop
npm install`}</CodeBlock>
            <p className="text-[12.5px] text-slate-400">
              ≈ ۲۰۰ مگابایت دانلود می‌شود. فقط یک بار لازم است.
            </p>
          </Step>

          <Step n={3} title="فایل نصبی را بساز">
            <CodeBlock label="ویندوز">{`npm run dist:win`}</CodeBlock>
            <CodeBlock label="مک">{`npm run dist:mac`}</CodeBlock>
            <p>
              خروجی در پوشه <span className={CODE}>desktop/release/</span> ساخته می‌شود:
            </p>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[460px] text-right">
                <tbody>
                  {[
                    ["daftar-sakhteman-1.0.0-x64.exe", "🪟 فایل نصبی ویندوز — این را نصب کن"],
                    ["daftar-sakhteman-1.0.0-portable.exe", "نسخه بدون نصب — فقط دابل کلیک"],
                    ["daftar-sakhteman-1.0.0-x64.dmg", "🍎 مک اینتل"],
                    ["daftar-sakhteman-1.0.0-arm64.dmg", "🍎 مک M1 / M2 / M3"],
                  ].map(([f, d]) => (
                    <tr key={f} className="border-b border-slate-200/40">
                      <td className="px-3 py-2 font-mono text-[12px] text-emerald-300" dir="ltr">
                        {f}
                      </td>
                      <td className="px-3 py-2 text-[12.5px] text-slate-400">{d}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Step>

          <Step n={4} title="تست سریع قبل از ساخت (اختیاری)">
            <p>بدون ساخت فایل نصبی، برنامه را اجرا کن تا مطمئن شوی کار می‌کند:</p>
            <CodeBlock label="ترمینال">{`npm start`}</CodeBlock>
          </Step>
        </div>
      </Card>

      {/* مقایسه */}
      <Card>
        <CardHeader title="کدام را انتخاب کنم؟" accent="sky" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px]">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="table-th">ویژگی</th>
                <th className="table-th">راه اول (PWA)</th>
                <th className="table-th">راه دوم (Electron)</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["زمان لازم", "۳۰ ثانیه", "۱۰–۲۰ دقیقه (یک بار)"],
                ["نیاز به دانلود", "ندارد", "≈ ۲۰۰ مگابایت"],
                ["آیکون در منوی Start", "✅ دارد", "✅ دارد"],
                ["پنجره مستقل", "✅ دارد", "✅ دارد"],
                ["فایل نصبی واقعی (.exe)", "❌ ندارد", "✅ دارد"],
                ["کلید میان‌بر اختصاصی", "محدود", "✅ کامل"],
                ["توزیع به دیگران", "فقط لینک", "✅ فایل نصبی"],
                ["کار بدون اینترنت", "❌ نه", "❌ نه *"],
              ].map(([f, a, b]) => (
                <tr key={f} className="border-b border-slate-200/40">
                  <td className="table-td text-[13px] font-medium text-slate-600">{f}</td>
                  <td className="table-td text-[13px]">{a}</td>
                  <td className="table-td text-[13px]">{b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-200/70 p-4">
          <p className="flex gap-2 text-[12.5px] leading-6 text-slate-400">
            <AlertTriangle size={13} className="mt-0.5 shrink-0 text-amber-400" />
            <span>
              <b className="text-slate-300">* مهم:</b> هر دو نسخه برای دیدن داده‌ها به{" "}
              <b className="text-slate-300">اینترنت</b> نیاز دارند، چون اطلاعات روی سرور ذخیره
              می‌شود. نسخه Electron فقط «پوسته دسکتاپ» است، نه دیتابیس محلی.
              <br />
              اگر اپ <b className="text-slate-300">کاملاً آفلاین</b> می‌خواهی (بدون سرور، دیتابیس
              روی همین کامپیوتر)، باید برنامه به SQLite منتقل شود — پروژه جداگانه‌ای است، بگو تا
              بسازم.
            </span>
          </p>
        </div>
      </Card>

      {/* ویژگی‌های نسخه دسکتاپ */}
      <Card>
        <CardHeader title="چیزهایی که در نسخه دسکتاپ داری" accent="emerald" />
        <div className="grid gap-2.5 p-5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            "پنجره مستقل با آیکون اختصاصی",
            "آیکون روی دسکتاپ و منوی Start",
            "منوی فارسی (برنامه / پیمایش / راهنما)",
            "کلید میان‌بر: Ctrl+Home = داشبورد",
            "کلید میان‌بر: Ctrl+= و Ctrl+- = بزرگ‌نمایی",
            "ذخیره اندازه و موقعیت پنجره",
            "فقط یک نسخه در هر لحظه باز می‌شود",
            "صفحه اختصاصی هنگام قطع اینترنت",
            "لینک‌های بیرونی در مرورگر باز می‌شوند",
          ].map((f) => (
            <div key={f} className="flex items-center gap-2 rounded-xl bg-slate-100 p-2.5">
              <CheckCircle2 size={14} className="shrink-0 text-emerald-400" />
              <span className="text-[12.5px] text-slate-500">{f}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* اجرای کامل روی کامپیوتر خودشان */}
      <Card>
        <CardHeader
          title="راه سوم: اجرای کامل روی کامپیوتر خودت"
          subtitle="برنامه + دیتابیس، همه محلی — بدون وابستگی به سرور"
          accent="amber"
          action={<Badge tone="amber">نیاز به Docker</Badge>}
        />
        <div className="space-y-4 p-5">
          <p className="text-[13px] leading-7 text-slate-400">
            اگر می‌خواهی داده‌هایت روی سرور ابری نباشد و همه‌چیز روی کامپیوتر خودت اجرا شود،
            این مراحل را در پوشه پروژه انجام بده:
          </p>
          <CodeBlock label="۱ — دیتابیس PostgreSQL را بالا بیاور">{`docker compose up -d`}</CodeBlock>
          <CodeBlock label="۲ — فایل تنظیمات">{`# ویندوز
copy .env.example .env

# مک / لینوکس
cp .env.example .env`}</CodeBlock>
          <CodeBlock label="۳ — وابستگی‌ها و جدول‌های دیتابیس">{`npm install
npx drizzle-kit push`}</CodeBlock>
          <CodeBlock label="۴ — داده‌های پایه (دسته‌بندی‌ها و کاتالوگ کالاها)">{`npx tsx src/db/seed-materials.ts`}</CodeBlock>
          <CodeBlock label="۵ — اجرای برنامه">{`npm run dev          # برای تست
# یا برای استفاده جدی:
npm run build
npm run start`}</CodeBlock>
          <p className="text-[13px] leading-7 text-slate-400">
            حالا برنامه روی <span className={CODE}>http://localhost:3000</span> در دسترس است و
            نسخه دسکتاپ هم به‌صورت پیش‌فرض به همان وصل می‌شود.
          </p>
          <div className="flex gap-3 rounded-xl border border-amber-400/25 bg-amber-500/10 p-3.5">
            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-400" />
            <p className="text-[13px] leading-7 text-slate-500">
              <b className="text-slate-300">پشتیبان‌گیری را فراموش نکن:</b>
              <br />
              <span className={CODE}>
                docker compose exec db pg_dump -U postgres app_db &gt; backup.sql
              </span>
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="flex items-center gap-2 text-[14.5px] font-bold text-slate-700">
          <Download size={14} className="text-emerald-400" />
          توضیحات کامل‌تر
        </h3>
        <p className="mt-2.5 text-[13px] leading-7 text-slate-400">
          راهنمای کامل نصب (هر سه روش)، نگهداری روزمره، پشتیبان‌گیری و حل مشکلات رایج در فایل{" "}
          <span className={CODE}>README.md</span> و{" "}
          <span className={CODE}>desktop/README.md</span> داخل پروژه نوشته شده است.
        </p>
        <p className="mt-3 rounded-xl bg-slate-100 px-3 py-2.5 text-[13px] leading-7 text-slate-400">
          💡 <b className="text-slate-300">نکته درباره نسخه دسکتاپ:</b> بعد از نصب، برای تغییر
          آدرس سرور نیازی به ساخت دوباره فایل نصبی نیست. در منوی{" "}
          <b className="text-slate-300">برنامه ← تغییر آدرس سرور...</b> آدرس جدید را بنویس؛
          ذخیره می‌شود.
        </p>
      </Card>
    </div>
  );
}
