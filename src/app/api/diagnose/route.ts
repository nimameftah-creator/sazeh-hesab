import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db, pool } from "@/db";
import { APP_VERSION } from "@/lib/version";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * ابزار تشخیص — وقتی صفحه خطا می‌دهد، اینجا را باز کن
 * ═══════════════════════════════════════════════════════════
 * مرحله به مرحله بررسی می‌کند:
 *   ۱. متغیر DATABASE_URL تنظیم شده؟
 *   ۲. اتصال به دیتابیس برقرار است؟
 *   ۳. جدول‌ها ساخته شده‌اند؟
 *   ۴. داده‌های پایه موجودند؟
 * ═══════════════════════════════════════════════════════════
 */

const EXPECTED_TABLES = [
  "projects", "bank_accounts", "categories", "stages", "parties", "invoices",
  "invoice_items", "materials", "contractors", "contractor_statements",
  "contractor_payments", "workers", "worker_payments", "units", "cheques",
  "permits", "transactions",
];

function mask(url: string): string {
  return url.replace(/:\/\/([^:]+):([^@]+)@/, "://$1:••••••••@");
}

const PAGE = (ok: boolean, title: string, body: string) => `<!doctype html>
<html lang="fa" dir="rtl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>تشخیص — ${title}</title>
<style>
 @font-face{font-family:V;src:url("https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/fonts/webfonts/Vazirmatn%5Bwght%5D.woff2") format("woff2-variations");font-weight:100 900}
 *{box-sizing:border-box}
 body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;
   background:#080e1a;background-image:radial-gradient(900px 420px at 85% 0,rgba(16,185,129,.14),transparent 60%),radial-gradient(700px 420px at 5% 100%,rgba(56,189,248,.12),transparent 55%);
   font-family:V,Tahoma,sans-serif;color:#e2e8f0}
 .box{max-width:700px;width:100%;border:1px solid #25324a;border-radius:20px;padding:30px;
   background:linear-gradient(160deg,rgba(28,38,55,.94),rgba(17,26,43,.94));box-shadow:0 24px 70px -20px rgba(0,0,0,.75)}
 h1{font-size:19px;margin:0 0 4px}
 .sub{font-size:12.5px;color:#94a3b8;margin:0 0 20px}
 .step{display:flex;gap:12px;padding:13px 15px;border-radius:12px;margin-bottom:9px;background:#101a2b}
 .ic{font-size:17px;line-height:1.4;flex-shrink:0}
 .tt{font-size:13.5px;font-weight:700;margin-bottom:3px}
 .dd{font-size:12px;color:#94a3b8;line-height:1.85;word-break:break-word}
 .ok .tt{color:#34d399}.no .tt{color:#fb7185}.wa .tt{color:#fbbf24}
 code{background:#0d1524;padding:2px 7px;border-radius:6px;font-size:11.5px;color:#34d399;direction:ltr;display:inline-block;margin:2px 0}
 .fix{margin-top:18px;padding:15px;border-radius:12px;border:1px solid #fbbf2444;background:rgba(251,191,36,.08)}
 .fix b{color:#fbbf24;font-size:13.5px}
 .fix ol{margin:9px 0 0;padding-right:20px;font-size:12.5px;line-height:2;color:#cbd5e1}
 .btn{display:inline-block;margin-top:18px;padding:11px 24px;border-radius:12px;text-decoration:none;
   background:linear-gradient(to left,#10b981,#0d9488);color:#fff;font-size:13.5px;font-weight:600}
 .btn2{background:#25324a;margin-right:8px}
</style></head><body><div class="box">
<h1>${ok ? "✅" : "⚠️"} ${title}</h1>
<p class="sub">نسخه ${APP_VERSION} — بررسی مرحله‌به‌مرحله اتصال و دیتابیس</p>
${body}
</div></body></html>`;

export async function GET() {
  const steps: { kind: "ok" | "no" | "wa"; title: string; detail: string }[] = [];
  let dbOk = false;
  let tablesOk = false;
  let missingTables: string[] = [];
  let counts: Record<string, number> = {};

  // ── ۱. متغیر محیطی ──────────────────────────────────────
  const url = process.env.DATABASE_URL;
  if (!url) {
    steps.push({
      kind: "no",
      title: "متغیر DATABASE_URL تنظیم نشده",
      detail:
        "این متغیر در محیط اجرا وجود ندارد. باید در تنظیمات لیارا اضافه شود.",
    });
  } else {
    steps.push({
      kind: "ok",
      title: "متغیر DATABASE_URL تنظیم شده",
      detail: `<code>${mask(url)}</code>`,
    });
  }

  // ── ۲. اتصال به دیتابیس ─────────────────────────────────
  if (url) {
    try {
      const r = await pool.query("select version() as v, current_database() as d");
      dbOk = true;
      steps.push({
        kind: "ok",
        title: "اتصال به دیتابیس برقرار است",
        detail: `دیتابیس: <code>${r.rows[0].d}</code><br>${String(r.rows[0].v).slice(0, 70)}`,
      });
    } catch (e) {
      steps.push({
        kind: "no",
        title: "اتصال به دیتابیس ناموفق بود",
        detail: `<code>${(e instanceof Error ? e.message : String(e)).slice(0, 300)}</code>`,
      });
    }
  }

  // ── ۳. جدول‌ها ──────────────────────────────────────────
  if (dbOk) {
    try {
      const r = await db.execute<{ table_name: string }>(
        sql`select table_name from information_schema.tables where table_schema='public'`
      );
      const rows = (r as unknown as { rows?: { table_name: string }[] }).rows ?? [];
      const have = new Set(rows.map((x) => x.table_name));
      missingTables = EXPECTED_TABLES.filter((t) => !have.has(t));
      tablesOk = missingTables.length === 0;

      if (tablesOk) {
        steps.push({
          kind: "ok",
          title: `همه ${EXPECTED_TABLES.length} جدول ساخته شده‌اند`,
          detail: "ساختار دیتابیس کامل است.",
        });
      } else if (have.size === 0) {
        steps.push({
          kind: "no",
          title: "هیچ جدولی در دیتابیس نیست",
          detail: "ساختار دیتابیس هنوز ساخته نشده. باید صفحه راه‌اندازی را باز کنی.",
        });
      } else {
        steps.push({
          kind: "wa",
          title: `${missingTables.length} جدول کم است`,
          detail: `مفقود: <code>${missingTables.join("</code> <code>")}</code>`,
        });
      }
    } catch (e) {
      steps.push({
        kind: "no",
        title: "بررسی جدول‌ها ناموفق بود",
        detail: `<code>${(e instanceof Error ? e.message : String(e)).slice(0, 250)}</code>`,
      });
    }
  }

  // ── ۴. داده‌های پایه ────────────────────────────────────
  if (tablesOk) {
    try {
      const q = async (t: string) => {
        const r = await pool.query(`select count(*)::int n from "${t}"`);
        return r.rows[0].n as number;
      };
      counts = {
        دسته‌بندی: await q("categories"),
        کالا: await q("materials"),
        پروژه: await q("projects"),
        "حساب بانکی": await q("bank_accounts"),
        "طرف حساب": await q("parties"),
        تراکنش: await q("transactions"),
      };
      const catCount = counts["دسته‌بندی"] ?? 0;
      const matCount = counts["کالا"] ?? 0;
      if (catCount === 0) {
        steps.push({
          kind: "wa",
          title: "دسته‌بندی‌ها خالی هستند",
          detail: "برای تشخیص خودکار پرینت بانک، دسته‌بندی لازم است.",
        });
      } else {
        steps.push({
          kind: "ok",
          title: "داده‌های پایه موجودند",
          detail: Object.entries(counts)
            .map(([k, v]) => `${k}: <code>${v}</code>`)
            .join(" &nbsp;|&nbsp; "),
        });
      }
      void matCount;
    } catch (e) {
      steps.push({
        kind: "wa",
        title: "شمارش داده‌ها ناموفق بود",
        detail: `<code>${(e instanceof Error ? e.message : String(e)).slice(0, 200)}</code>`,
      });
    }
  }

  const allOk = steps.every((s) => s.kind === "ok");

  // ── راهنمای رفع مشکل ────────────────────────────────────
  let fix = "";
  const firstProblem = steps.find((s) => s.kind !== "ok");
  if (firstProblem) {
    if (!url) {
      fix = `<div class="fix"><b>🔧 راه‌حل: متغیر محیطی را اضافه کن</b>
        <ol>
          <li>در لیارا: دیتابیس PostgreSQL بساز (اگر نساختی)</li>
          <li>تب «اتصال به دیتابیس» → رشته اتصال را کپی کن</li>
          <li>برنامه → تنظیمات → متغیرهای محیطی</li>
          <li>نام: <code>DATABASE_URL</code> — مقدار: رشته کپی‌شده</li>
          <li>ذخیره کن و برنامه را دوباره Deploy کن</li>
        </ol></div>`;
    } else if (!dbOk) {
      fix = `<div class="fix"><b>🔧 راه‌حل: رشته اتصال را بررسی کن</b>
        <ol>
          <li>مطمئن شو دیتابیس در لیارا <b>در حال اجرا</b> است (نه متوقف)</li>
          <li>رشته اتصال را دوباره از تب «اتصال به دیتابیس» کپی کن</li>
          <li>اگر دیتابیس و برنامه در <b>شبکه‌های خصوصی مختلف</b> هستند،
              باید هر دو در یک شبکه باشند یا اتصال عمومی دیتابیس را فعال کنی</li>
          <li>مطمئن شو رشته با <code>postgresql://</code> شروع می‌شود</li>
        </ol></div>`;
    } else if (!tablesOk) {
      fix = `<div class="fix"><b>🔧 راه‌حل: صفحه راه‌اندازی را باز کن</b>
        <ol>
          <li>این آدرس را در مرورگر باز کن:</li>
          <li><code>/api/setup?key=daftar-1404</code></li>
          <li>صبر کن تا «✅ راه‌اندازی با موفقیت انجام شد» را ببینی</li>
          <li>بعد به صفحه اصلی برگرد</li>
        </ol></div>`;
    } else {
      fix = `<div class="fix"><b>🔧 راه‌حل: داده پایه را بساز</b>
        <ol><li><code>/api/setup?key=daftar-1404</code> را باز کن</li></ol></div>`;
    }
  }

  const body =
    steps
      .map(
        (s) => `<div class="step ${s.kind}">
          <div class="ic">${s.kind === "ok" ? "✅" : s.kind === "wa" ? "⚠️" : "❌"}</div>
          <div><div class="tt">${s.title}</div><div class="dd">${s.detail}</div></div>
        </div>`
      )
      .join("") +
    fix +
    `<a class="btn ${allOk ? "" : "btn2"}" href="/">ورود به برنامه ←</a>
     <a class="btn" href="/api/setup?key=daftar-1404">اجرای راه‌اندازی</a>`;

  return new NextResponse(
    PAGE(allOk, allOk ? "همه‌چیز سالم است" : "مشکلی پیدا شد", body),
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}
