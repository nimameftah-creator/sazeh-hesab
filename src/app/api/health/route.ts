import { NextResponse } from "next/server";
import { APP_VERSION } from "@/lib/version";

export const dynamic = "force-dynamic";

/**
 * بررسی سلامت برنامه
 * ═══════════════════════════════════════════════════════════
 * ⚠️ مهم: این مسیر برای health check لیارا استفاده می‌شود.
 * باید همیشه ۲۰۰ برگرداند — حتی اگر دیتابیس قطع باشد.
 *
 * چرا؟ چون اگر اینجا ۵۰۰ بدهد، لیارا فکر می‌کند برنامه مرده
 * و آن را از دسترس خارج می‌کند (۵۰۲). در حالی که برنامه زنده
 * است و فقط دیتابیس مشکل دارد.
 *
 * برای وضعیت دیتابیس، از /api/health/db استفاده کن.
 * ═══════════════════════════════════════════════════════════
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    status: "alive",
    version: APP_VERSION,
    time: new Date().toISOString(),
  });
}
