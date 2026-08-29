import { toFaDigits } from "./jalali";

/** نرمال‌سازی ارقام فارسی/عربی و جداکننده‌ها به لاتین */
export function normalizeDigits(s: string): string {
  return s
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[٬٫,]/g, "")
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک");
}

/** تبدیل ورودی کاربر (مثلا "۲٬۵۰۰٬۰۰۰") به عدد */
export function parseAmount(input: string | number | null | undefined): number {
  if (typeof input === "number") return input;
  if (!input) return 0;
  const cleaned = normalizeDigits(String(input)).replace(/[^\d.-]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? Math.round(n) : 0;
}

/** قالب‌بندی پول با ارقام فارسی: ۱۲٬۵۰۰٬۰۰۰ تومان */
export function fmtMoney(n: number | null | undefined, withUnit = true): string {
  const v = n ?? 0;
  const grouped = toFaDigits(Math.round(Math.abs(v)).toLocaleString("en-US"));
  const sign = v < 0 ? "−" : "";
  return withUnit ? `${sign}${grouped} تومان` : `${sign}${grouped}`;
}

/** قالب فشرده: ۲.۴ میلیارد */
export function fmtCompact(n: number | null | undefined): string {
  const v = n ?? 0;
  const abs = Math.abs(v);
  const sign = v < 0 ? "−" : "";
  if (abs >= 1e9) return `${sign}${toFaDigits((abs / 1e9).toFixed(1))} میلیارد`;
  if (abs >= 1e6) return `${sign}${toFaDigits((abs / 1e6).toFixed(1))} میلیون`;
  if (abs >= 1e3) return `${sign}${toFaDigits((abs / 1e3).toFixed(0))} هزار`;
  return `${sign}${toFaDigits(abs.toFixed(0))}`;
}

export function fmtNumber(n: number | null | undefined): string {
  return toFaDigits(Math.round(n ?? 0).toLocaleString("en-US"));
}

export function fmtPercent(n: number | null | undefined): string {
  return toFaDigits(`${Math.round(n ?? 0)}٪`);
}
