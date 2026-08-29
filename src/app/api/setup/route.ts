import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { SETUP_SQL } from "@/db/setup-sql";
import { CATEGORIES, MATERIALS } from "@/db/seed-data";
import { categories, materials } from "@/db/schema";
import { APP_VERSION } from "@/lib/version";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * صفحه راه‌اندازی یک‌بارمصرف
 * ═══════════════════════════════════════════════════════════
 * چون در محیط‌های PaaS مثل لیارا دسترسی به ترمینال سخت است،
 * این مسیر همان کار `drizzle-kit push` و اسکریپت‌های seed را
 * از طریق مرورگر انجام می‌دهد.
 *
 * همه دستورات idempotent هستند → اجرای چندباره بی‌خطر است.
 *
 * استفاده:   /api/setup?key=daftar-1404
 * ═══════════════════════════════════════════════════════════
 */
const DEFAULT_KEY = "daftar-1404";

const PAGE = (ok: boolean, title: string, body: string) => `<!doctype html>
<html lang="fa" dir="rtl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<style>
 @font-face{font-family:V;src:url("https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/fonts/webfonts/Vazirmatn%5Bwght%5D.woff2") format("woff2-variations");font-weight:100 900}
 *{box-sizing:border-box}
 body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;
   background:#080e1a;background-image:radial-gradient(900px 420px at 85% 0,rgba(16,185,129,.14),transparent 60%),radial-gradient(700px 420px at 5% 100%,rgba(56,189,248,.12),transparent 55%);
   font-family:V,Tahoma,sans-serif;color:#e2e8f0}
 .box{max-width:640px;width:100%;border:1px solid #25324a;border-radius:20px;padding:32px;
   background:linear-gradient(160deg,rgba(28,38,55,.94),rgba(17,26,43,.94));box-shadow:0 24px 70px -20px rgba(0,0,0,.75)}
 h1{font-size:20px;margin:0 0 6px}
 .sub{font-size:13px;color:#94a3b8;margin:0 0 22px}
 .ok{color:#34d399}.no{color:#fb7185}
 table{width:100%;border-collapse:collapse;font-size:13px;margin-top:8px}
 td{padding:9px 10px;border-bottom:1px solid #1e2b40}
 td:last-child{text-align:left;font-weight:700;font-variant-numeric:tabular-nums}
 .btn{display:inline-block;margin-top:22px;padding:11px 26px;border-radius:12px;text-decoration:none;
   background:linear-gradient(to left,#10b981,#0d9488);color:#fff;font-size:14px;font-weight:600;
   box-shadow:0 12px 28px -12px rgba(16,185,129,.65)}
 .note{margin-top:20px;padding:13px 15px;border-radius:12px;background:#101a2b;font-size:12.5px;line-height:1.9;color:#94a3b8}
 code{background:#0d1524;padding:2px 7px;border-radius:6px;font-size:12px;color:#34d399;direction:ltr;display:inline-block}
 pre{background:#0d1524;padding:12px;border-radius:10px;overflow-x:auto;font-size:12px;color:#fb7185;direction:ltr;text-align:left}
</style></head><body><div class="box">
<h1 class="${ok ? "ok" : "no"}">${ok ? "✅" : "❌"} ${title}</h1>
${body}
</div></body></html>`;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");
  const expected = process.env.SETUP_KEY || DEFAULT_KEY;

  if (key !== expected) {
    return new NextResponse(
      PAGE(
        false,
        "کلید نامعتبر",
        `<p class="sub">برای اجرای راه‌اندازی، کلید را به آدرس اضافه کن:</p>
         <pre>/api/setup?key=${expected}</pre>
         <div class="note">اگر نمی‌خواهی این کلید پیش‌فرض بماند، در متغیرهای محیطی
         <code>SETUP_KEY</code> را به مقدار دلخواه خودت تغییر بده.</div>`
      ),
      { status: 401, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  const rows: [string, string][] = [];
  const errors: string[] = [];

  try {
    // ── ۱. ساخت جدول‌ها ────────────────────────────────────
    let created = 0;
    for (const stmt of SETUP_SQL) {
      try {
        await db.execute(sql.raw(stmt));
        created++;
      } catch (e) {
        // drizzle پیام اصلی PostgreSQL را می‌پوشاند، پس چند لایه را می‌کاویم
        const err = e as { message?: string; cause?: unknown };
        const parts = [
          err?.message ?? "",
          err?.cause instanceof Error ? err.cause.message : "",
          (() => {
            try {
              return JSON.stringify(e);
            } catch {
              return String(e);
            }
          })(),
        ].join(" | ");

        // «تکراری بودن» در اجرای دوم طبیعی است → بی‌خطر
        const benign = /already exists|duplicate|42P07|42710/i.test(parts);
        if (!benign) {
          const detail =
            err?.cause instanceof Error ? err.cause.message : err?.message ?? String(e);
          errors.push(detail.slice(0, 160));
        }
      }
    }
    rows.push(["دستورات SQL اجرا شده", String(created)]);

    // ── ۲. دسته‌بندی‌ها ────────────────────────────────────
    const existingCats = await db.select({ name: categories.name }).from(categories);
    const haveCats = new Set(existingCats.map((c) => c.name));
    const newCats = CATEGORIES.filter(([n]) => !haveCats.has(n));
    if (newCats.length > 0) {
      await db.insert(categories).values(
        newCats.map(([name, kind, scope, stage, keywords, color], i) => ({
          name,
          kind,
          scope,
          stage: stage || null,
          keywords: keywords || null,
          color,
          sort: i,
        }))
      );
    }
    rows.push(["دسته‌بندی‌ها", `${newCats.length}جدید / ${existingCats.length} موجود`]);

    // ── ۳. کاتالوگ کالاها ──────────────────────────────────
    const catRows = await db.select().from(categories);
    const catByStage = (stage: string) => catRows.find((c) => c.stage === stage)?.id ?? null;

    const existingMats = await db.select({ name: materials.name }).from(materials);
    const haveMats = new Set(existingMats.map((m) => m.name));
    const newMats = MATERIALS.filter(([n]) => !haveMats.has(n));
    if (newMats.length > 0) {
      await db.insert(materials).values(
        newMats.map(([name, unit, keywords, stage]) => ({
          name,
          unit,
          keywords,
          categoryId: catByStage(stage),
        }))
      );
    }
    rows.push(["کالاهای کاتالوگ", `${newMats.length}جدید / ${existingMats.length} موجود`]);

    const okAll = errors.length === 0;
    const table = rows
      .map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`)
      .join("");

    return new NextResponse(
      PAGE(
        okAll,
        okAll ? "راه‌اندازی با موفقیت انجام شد" : "راه‌اندازی با هشدار انجام شد",
        `<p class="sub">نسخه ${APP_VERSION} — جدول‌ها و داده‌های پایه آماده‌اند.</p>
         <table>${table}</table>
         ${
           errors.length > 0
             ? `<div class="note"><b class="no">هشدارها:</b><pre>${errors
                 .slice(0, 5)
                 .join("\n")}</pre></div>`
             : ""
         }
         <div class="note">
           <b>قدم بعدی:</b> حالا می‌توانی وارد برنامه شوی و اولین پروژه و حساب بانکی را بسازی.
           <br>این صفحه را می‌توانی چند بار باز کنی — هیچ داده‌ای پاک نمی‌شود.
         </div>
         <a class="btn" href="/">ورود به برنامه ←</a>`
      ),
      { headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new NextResponse(
      PAGE(
        false,
        "خطا در راه‌اندازی",
        `<p class="sub">اتصال به دیتابیس یا ساخت جدول‌ها ناموفق بود.</p>
         <pre>${msg.slice(0, 500)}</pre>
         <div class="note">
           رایج‌ترین علت: متغیر <code>DATABASE_URL</code> در تنظیمات لیارا درست تنظیم نشده.
           <br>رشته اتصال دیتابیس را از تب «اتصال به دیتابیس» کپی کن و در متغیرهای محیطی بگذار.
         </div>`
      ),
      { status: 500, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }
}
