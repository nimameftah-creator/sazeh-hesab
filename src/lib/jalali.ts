import * as jalaali from "jalaali-js";

const FA_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

export function toFaDigits(input: string | number): string {
  return String(input).replace(/\d/g, (d) => FA_DIGITS[Number(d)]);
}

export function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/** تبدیل تاریخ ISO میلادی به تاریخ جلالی */
export function isoToJalaali(iso: string): { jy: number; jm: number; jd: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return null;
  const { jy, jm, jd } = jalaali.toJalaali(Number(m[1]), Number(m[2]), Number(m[3]));
  return { jy, jm, jd };
}

/** تاریخ جلالی به ISO میلادی */
export function jalaaliToISO(jy: number, jm: number, jd: number): string {
  const { gy, gm, gd } = jalaali.toGregorian(jy, jm, jd);
  return `${gy}-${pad2(gm)}-${pad2(gd)}`;
}

/** نمایش تاریخ به شمسی: ۱۴۰۳/۰۵/۱۲ */
export function formatJalali(iso: string | null | undefined): string {
  if (!iso) return "—";
  const j = isoToJalaali(iso);
  if (!j) return iso;
  return toFaDigits(`${j.jy}/${pad2(j.jm)}/${pad2(j.jd)}`);
}

export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** کلید ماه شمسی برای گروه‌بندی: 1403-05 */
export function jalaliMonthKey(iso: string | null | undefined): string {
  const j = isoToJalaali(iso ?? "");
  if (!j) return "نامشخص";
  return `${j.jy}-${pad2(j.jm)}`;
}

/** نام ماه شمسی */
export function jalaliMonthLabel(key: string): string {
  const m = /^\d{4}-(\d{2})$/.exec(key);
  if (!m) return key;
  const names = [
    "فروردین",
    "اردیبهشت",
    "خرداد",
    "تیر",
    "مرداد",
    "شهریور",
    "مهر",
    "آبان",
    "آذر",
    "دی",
    "بهمن",
    "اسفند",
  ];
  const idx = Number(m[1]) - 1;
  return names[idx] ?? key;
}

/** چند ماه جلالی قبل از امروز */
export function monthsAgoISO(n: number): string {
  const now = new Date();
  const { jy, jm, jd } = jalaali.toJalaali(now.getFullYear(), now.getMonth() + 1, now.getDate());
  let total = jy * 12 + (jm - 1) - n;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  const d = Math.min(jd, jalaali.jalaaliMonthLength(ny, nm));
  return jalaaliToISO(ny, nm, d);
}

/** افزودن n ماه شمسی به یک تاریخ ISO */
export function addMonthsISO(iso: string, n: number): string {
  const j = isoToJalaali(iso);
  if (!j) return iso;
  let total = j.jy * 12 + (j.jm - 1) + n;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  const d = Math.min(j.jd, jalaali.jalaaliMonthLength(ny, nm));
  return jalaaliToISO(ny, nm, d);
}
