import { NextResponse } from "next/server";
import { APP_VERSION, APP_NAME, BUILD_DATE } from "@/lib/version";

export const dynamic = "force-dynamic";

/**
 * نسخه سرور را برمی‌گرداند.
 * کلاینت‌ها (PWA و دسکتاپ) با مقایسه این عدد با نسخه خودشان
 * می‌فهمند که به‌روزرسانی لازم است یا نه.
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    name: APP_NAME,
    version: APP_VERSION,
    buildDate: BUILD_DATE,
    serverTime: new Date().toISOString(),
  });
}
