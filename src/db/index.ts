import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

/**
 * اتصال دیتابیس — به‌صورت تنبل (lazy)
 * ═══════════════════════════════════════════════════════════
 * ⚠️ مهم: قبلاً اینجا اگر DATABASE_URL نبود، در زمان import
 * خطا می‌داد. نتیجه: کل سرور می‌افتاد و لیارا ۵۰۲ می‌داد،
 * حتی برای صفحه‌هایی که به دیتابیس نیاز نداشتند.
 *
 * حالا Pool همیشه ساخته می‌شود و خطا فقط هنگام استفاده واقعی
 * رخ می‌دهد — جایی که safeLoad() آن را می‌گیرد و پیام دقیق
 * نشان می‌دهد.
 * ═══════════════════════════════════════════════════════════
 */

const globalForDb = globalThis as typeof globalThis & {
  __daftarPool?: Pool;
};

function makePool(): Pool {
  const url = process.env.DATABASE_URL;
  return new Pool({
    // اگر تنظیم نشده باشد، یک آدرس نامعتبر می‌دهیم تا هنگام
    // استفاده خطای واضح بدهد (نه هنگام import)
    connectionString: url || "postgresql://invalid:invalid@127.0.0.1:1/invalid",
    // اگر اتصال برقرار نشد، سریع خطا بده (نه اینکه ۳۰ ثانیه آویزان بماند)
    connectionTimeoutMillis: 8000,
    max: 10,
    idleTimeoutMillis: 30000,
  });
}

export const pool: Pool = globalForDb.__daftarPool ?? makePool();

if (process.env.NODE_ENV !== "production") {
  globalForDb.__daftarPool = pool;
}

export const db = drizzle(pool);
