import { normalizeDigits } from "./format";
import { jalaaliToISO, pad2, todayISO } from "./jalali";
import * as jalaali from "jalaali-js";

export type TxType = "income" | "expense" | "transfer";

export interface ParseContext {
  projects: { id: string; name: string; keywords?: string | null }[];
  categories: {
    id: string;
    name: string;
    kind?: string;
    scope?: string;
    keywords?: string | null;
    stage?: string | null;
  }[];
  parties?: { id: string; name: string; keywords?: string | null }[];
}

export interface ParsedRow {
  raw: string;
  date: string | null;
  amount: number | null; // همیشه تومان
  currencyHint: "rial" | "toman" | null;
  type: TxType;
  projectId: string | null;
  categoryId: string | null;
  partyId: string | null;
  isPersonal: boolean;
  counterparty: string;
  description: string;
  confidence: "high" | "medium" | "low";
}

const STOPWORDS = [
  "بانک",
  "حساب",
  "کارت",
  "نام",
  "شماره",
  "مبلغ",
  "تاریخ",
  "موجودی",
  "ریال",
  "تومان",
  "انتقال",
  "واریز",
  "برداشت",
  "پرداخت",
  "دریافت",
  "خرید",
  "به",
  "از",
  "و",
  "با",
  "برای",
  "توسط",
  "ساعت",
  "دقیقه",
];

function cleanWord(w: string): string {
  return w.replace(/[^\u0600-\u06FFa-zA-Z0-9]/g, "");
}

/** استخراج تاریخ جلالی یا میلادی از خط */
function extractDate(line: string): string | null {
  const j = /(1[3-4]\d{2})[\/\-.](\d{1,2})[\/\-.](\d{1,2})/.exec(line);
  if (j) {
    try {
      return jalaaliToISO(Number(j[1]), Number(j[2]), Number(j[3]));
    } catch {
      return null;
    }
  }
  const g = /(20\d{2})[\/\-.](\d{1,2})[\/\-.](\d{1,2})/.exec(line);
  if (g) {
    return `${g[1]}-${pad2(Number(g[2]))}-${pad2(Number(g[3]))}`;
  }
  return null;
}

interface AmountCandidate {
  value: number; // مقدار خام
  unit: "rial" | "toman" | "thousand" | "million" | "billion" | null;
  position: number;
}

/** استخراج مبلغ (ریال/تومان با واحد‌های فارسی) */
function extractAmount(line: string): { toman: number | null; hint: "rial" | "toman" | null } {
  // مبلغ: 12,500,000 ریال  ←  دقیق‌ترین حالت
  const money = /(?:مبلغ|بهمبلغ)\s*[:：]?\s*([\d]{1,14})/i.exec(line);
  let anchor = money ? money.index! + money[0].length : -1;
  let moneyRaw: string | null = money ? money[1] : null;

  const candidates: AmountCandidate[] = [];
  const re = /([\d]{4,10})(?:\s*(ریال|تومان|هزار|میلیون|میلیارد))?/g;
  let mm: RegExpExecArray | null;
  while ((mm = re.exec(line))) {
    const [full, numStr, unitWord] = mm;
    const n = Number(numStr);
    if (!Number.isFinite(n)) continue;
    // رد کردن شماره کارت/حساب بلند، شماره موبایل، کد ملی و اعداد داخل تاریخ
    if (numStr.length >= 12) continue;
    if (numStr.length === 11 && (/^09/.test(numStr) || /^02/.test(numStr))) continue;
    if (moneyRaw === numStr) {
      anchor = mm.index;
      continue;
    }
    let unit: AmountCandidate["unit"] = null;
    if (unitWord === "ریال") unit = "rial";
    else if (unitWord === "تومان") unit = "toman";
    else if (unitWord === "هزار") unit = "thousand";
    else if (unitWord === "میلیون") unit = "million";
    else if (unitWord === "میلیارد") unit = "billion";
    candidates.push({ value: n, unit, position: mm.index });
  }

  const toToman = (c: AmountCandidate): number => {
    switch (c.unit) {
      case "rial":
        return c.value / 10;
      case "thousand":
        return c.value * 1000;
      case "million":
        return c.value * 1_000_000;
      case "billion":
        return c.value * 1_000_000_000;
      default:
        return c.value;
    }
  };

  if (moneyRaw && Number(moneyRaw) > 0) {
    // پیدا کردن واحد بعد از مبلغ
    const after = line.slice(anchor);
    const u = /(ریال|تومان)/.exec(after);
    if (u && u[1] === "ریال") return { toman: Number(moneyRaw) / 10, hint: "rial" };
    if (u && u[1] === "تومان") return { toman: Number(moneyRaw), hint: "toman" };
    return { toman: Number(moneyRaw), hint: null };
  }

  // اولویت: کاندید دارای واحد
  const withUnit = candidates.filter((c) => c.unit && c.unit !== "thousand");
  if (withUnit.length > 0) {
    const c = withUnit[withUnit.length - 1];
    return { toman: toToman(c), hint: c.unit === "rial" ? "rial" : "toman" };
  }
  if (candidates.length === 0) return { toman: null, hint: null };
  // بدون واحد: نزدیک‌ترین به آخر خط
  const c = candidates[candidates.length - 1];
  return { toman: c.value, hint: null };
}

/** تشخیص نوع تراکنش */
function detectType(line: string): TxType {
  if (
    /(انتقال به|انتقالی به).{0,40}(خودم|خود|شخصی|کارت خود|حساب خود)/.test(line) ||
    /به (کارت|حساب) (خودم|خود)/.test(line)
  ) {
    return "transfer";
  }
  if (/(واریز|واریزی|افزایش موجودی|دریافت|سود|شارژ|انتقال از)/.test(line)) return "income";
  if (/(برداشت|خرید|پرداخت|کارمزد|کسر)/.test(line)) return "expense";
  // «انتقال به» دیگران (فروشنده/پیمانکار) = خرج؛ فقط انتقال به کارت خودم = انتقال داخلی
  if (/انتقال/.test(line)) {
    return /(خودم|خود|شخصی)/.test(line) ? "transfer" : "expense";
  }
  return "expense";
}

/** شناسایی پروژه از روی نام/کلمات کلیدی */
function detectProject(
  line: string,
  projects: ParseContext["projects"]
): { id: string | null; name: string | null } {
  for (const p of projects) {
    const tokens = [
      p.name,
      ...(p.keywords ? p.keywords.split(/[،,]/).map((k) => k.trim()) : []),
    ].filter(Boolean);
    for (const t of tokens) {
      const tt = cleanWord(t);
      if (tt.length >= 3 && line.includes(tt)) {
        return { id: p.id, name: p.name };
      }
    }
  }
  return { id: null, name: null };
}

/** استخراج طرف حساب (فامیلی) از شرح */
function extractCounterparty(line: string): string {
  const patterns = [
    /(?:کارت به نام|حساب به نام|به نام)\s*([آ-یa-zA-Z]+)/,
    /(?:به |توسط )?(?:آقای|خانم|آقا|حاج|حاجی)\s+([آ-یa-zA-Z]+(?:\s[آ-یa-zA-Z]+)?)/,
    /(?:پرداخت به|انتقال به)\s+([آ-یa-zA-Z]+(?:\s[آ-یa-zA-Z]+)?)/,
  ];
  for (const p of patterns) {
    const m = p.exec(line);
    if (m && m[1]) {
      const words = m[1]
        .trim()
        .split(/\s+/)
        .map(cleanWord)
        .filter((w) => w.length >= 2 && !STOPWORDS.includes(w));
      const result = words.slice(0, 2).join(" ");
      if (result && !/(خودم|خود|شخصی)/.test(result)) return result;
      return "";
    }
  }
  return "";
}

/** دسته‌بندی خودکار بر اساس کلیدواژه‌ها */
function detectCategory(
  line: string,
  type: TxType,
  isPersonal: boolean,
  categories: ParseContext["categories"]
): string | null {
  const kind = type === "income" ? "income" : "expense";
  const pool = categories.filter((c) => c.kind === kind);
  if (isPersonal) {
    const personal = pool.find((c) => c.scope === "personal");
    if (personal) return personal.id;
  }
  let best: { id: string; score: number } | null = null;
  for (const c of pool) {
    if (!c.keywords) continue;
    const kws = c.keywords.split(/[،,]/).map((k) => cleanWord(k.trim())).filter((k) => k.length >= 2);
    let score = 0;
    for (const k of kws) {
      if (line.includes(k)) score += Math.max(k.length, 3);
    }
    if (score > 0 && (!best || score > best.score)) best = { id: c.id, score };
  }
  return best?.id ?? null;
}

/** شناسایی طرف حساب از روی فهرست اشخاص ثبت‌شده */
function detectParty(line: string, parties: NonNullable<ParseContext["parties"]>): string | null {
  let best: { id: string; len: number } | null = null;
  for (const p of parties) {
    const names = [
      p.name,
      ...(p.keywords ? p.keywords.split(/[،,]/).map((k) => k.trim()) : []),
    ].filter(Boolean);
    for (const n of names) {
      const nn = cleanWord(n);
      if (nn.length >= 3 && line.includes(nn)) {
        if (!best || nn.length > best.len) best = { id: p.id, len: nn.length };
      }
    }
  }
  return best?.id ?? null;
}

/** تجزیه کامل متن پرینت بانک */
export function parseStatement(
  text: string,
  ctx: ParseContext,
  defaultCurrency: "rial" | "toman" = "rial"
): ParsedRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 5);
  const rows: ParsedRow[] = [];
  for (const raw of lines) {
    const line = normalizeDigits(raw);
    const date = extractDate(line);
    const { toman: rawAmount, hint } = extractAmount(line);
    let amount = rawAmount;
    let currencyHint = hint;
    if (amount !== null && !hint) {
      amount = defaultCurrency === "rial" ? amount / 10 : amount;
      currencyHint = defaultCurrency;
    }
    if (amount !== null) amount = Math.round(amount);
    const type = detectType(line);
    const isPersonal = /(شخصی|خونه|خانه|منزل|خرید منزل|دخل و خرج)/.test(line);
    const proj = detectProject(line, ctx.projects);
    const categoryId = detectCategory(line, type, isPersonal, ctx.categories);
    const counterparty = type === "transfer" ? "" : extractCounterparty(line);
    const partyId = detectParty(line, ctx.parties ?? []);
    let confidence: ParsedRow["confidence"] = "low";
    if (date && amount && hint) confidence = "high";
    else if (amount) confidence = "medium";
    rows.push({
      raw,
      date: date ?? todayISO(),
      amount,
      currencyHint,
      type,
      projectId: isPersonal ? null : proj.id,
      categoryId,
      partyId,
      isPersonal,
      counterparty,
      description: raw,
      confidence,
    });
  }
  return rows;
}
