import { NextResponse } from "next/server";
import { pool } from "@/db";

export const dynamic = "force-dynamic";

/**
 * بررسی سلامت دیتابیس — جدا از health check اصلی
 * ═══════════════════════════════════════════════════════════
 * این مسیر برای عیب‌یابی است، نه برای health check لیارا.
 * علت خطا را هم نشان می‌دهد تا بفهمی مشکل کجاست.
 * ═══════════════════════════════════════════════════════════
 */
export async function GET() {
  const started = Date.now();

  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      {
        ok: false,
        stage: "env",
        error: "متغیر DATABASE_URL تنظیم نشده است",
        fix: "در تنظیمات لیارا → متغیرهای محیطی، DATABASE_URL را اضافه کن",
      },
      { status: 200 }
    );
  }

  // آدرس را ماسک می‌کنیم تا رمز لو نرود
  const masked = process.env.DATABASE_URL.replace(/:\/\/([^:]+):([^@]+)@/, "://$1:••••@");

  try {
    const r = await pool.query("select current_database() as db, version() as v");
    return NextResponse.json({
      ok: true,
      stage: "connected",
      database: r.rows[0].db,
      server: String(r.rows[0].v).split(",")[0],
      latencyMs: Date.now() - started,
      url: masked,
    });
  } catch (e) {
    const err = e as { message?: string; code?: string; hostname?: string };
    return NextResponse.json(
      {
        ok: false,
        stage: "connect",
        error: err.message ?? String(e),
        code: err.code,
        hostname: err.hostname,
        url: masked,
        fix:
          err.code === "ENOTFOUND"
            ? `آدرس «${err.hostname}» پیدا نشد. رشته اتصال را از تب «اتصال به دیتابیس» در لیارا دوباره کپی کن.`
            : err.code === "ECONNREFUSED"
              ? "اتصال رد شد. مطمئن شو دیتابیس در حال اجراست."
              : "رشته اتصال را بررسی کن.",
      },
      { status: 200 }
    );
  }
}
