import { pool } from "@/db";
import { loadAll, type AllData } from "./finance";

/**
 * بارگذاری امن داده‌ها
 * ═══════════════════════════════════════════════════════════
 * به‌جای اینکه صفحه با خطای ناشناخته سقوط کند، علت دقیق را
 * برمی‌گرداند تا کاربر بداند چه کار کند.
 * ═══════════════════════════════════════════════════════════
 */

export type LoadResult =
  | { ok: true; data: AllData }
  | { ok: false; code: DiagCode; message: string; hint: string };

export type DiagCode =
  | "no_env"
  | "conn_failed"
  | "no_tables"
  | "partial_tables"
  | "query_failed";

const TABLES = [
  "projects", "bank_accounts", "categories", "stages", "parties", "invoices",
  "invoice_items", "materials", "contractors", "contractor_statements",
  "contractor_payments", "workers", "worker_payments", "units", "cheques",
  "permits", "transactions",
];

export async function safeLoad(): Promise<LoadResult> {
  // ۱. متغیر محیطی
  if (!process.env.DATABASE_URL) {
    return {
      ok: false,
      code: "no_env",
      message: "متغیر DATABASE_URL تنظیم نشده است",
      hint: "در تنظیمات لیارا → متغیرهای محیطی، رشته اتصال دیتابیس را با نام DATABASE_URL اضافه کن و دوباره Deploy کن.",
    };
  }

  // ۲. اتصال
  try {
    await pool.query("select 1");
  } catch (e) {
    return {
      ok: false,
      code: "conn_failed",
      message: "اتصال به دیتابیس برقرار نشد",
      hint:
        "رشته اتصال را از تب «اتصال به دیتابیس» در لیارا دوباره کپی کن. " +
        "مطمئن شو دیتابیس در حال اجراست و با برنامه در یک شبکه خصوصی قرار دارد. " +
        `جزئیات: ${(e as Error).message.slice(0, 200)}`,
    };
  }

  // ۳. جدول‌ها
  let missing: string[] = [];
  try {
    const r = await pool.query(
      "select table_name from information_schema.tables where table_schema='public'"
    );
    const have = new Set(r.rows.map((x: { table_name: string }) => x.table_name));
    missing = TABLES.filter((t) => !have.has(t));
  } catch (e) {
    return {
      ok: false,
      code: "query_failed",
      message: "بررسی جدول‌ها ناموفق بود",
      hint: (e as Error).message.slice(0, 200),
    };
  }

  if (missing.length === TABLES.length) {
    return {
      ok: false,
      code: "no_tables",
      message: "دیتابیس خالی است — هیچ جدولی ساخته نشده",
      hint:
        "این آدرس را در مرورگر باز کن تا جدول‌ها ساخته شوند:\n" +
        "/api/setup?key=daftar-1404",
    };
  }
  if (missing.length > 0) {
    return {
      ok: false,
      code: "partial_tables",
      message: `${missing.length} جدول کم است: ${missing.slice(0, 6).join("، ")}`,
      hint: "/api/setup?key=daftar-1404 را باز کن تا جدول‌های باقی‌مانده ساخته شوند.",
    };
  }

  // ۴. بارگذاری کامل
  try {
    const data = await loadAll();
    return { ok: true, data };
  } catch (e) {
    return {
      ok: false,
      code: "query_failed",
      message: "خواندن داده‌ها ناموفق بود",
      hint: (e as Error).message.slice(0, 250),
    };
  }
}

/** شمارش سریع برای صفحه تشخیص */
export async function quickCount(table: string): Promise<number | null> {
  // فقط جدول‌های شناخته‌شده مجازند (جلوگیری از SQL injection)
  if (!TABLES.includes(table)) return null;
  try {
    const r = await pool.query(`select count(*)::int as n from "${table}"`);
    return r.rows[0].n as number;
  } catch {
    return null;
  }
}
