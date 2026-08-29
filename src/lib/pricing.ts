import type { AllData } from "./finance";

/** یک نقطه در نمودار روند قیمت */
export interface PricePoint {
  id: string;
  date: string; // ISO
  price: number; // فی (تومان بر واحد)
  quantity: number;
  total: number;
  source: "invoice" | "transaction";
  sourceLabel: string; // نام فروشنده / شرح
  invoiceNumber: string | null;
}

export interface PriceStats {
  points: PricePoint[];
  latest: PricePoint | null;
  first: PricePoint | null;
  min: number;
  max: number;
  avg: number;
  totalQty: number;
  totalSpend: number;
  changePct: number | null; // تغییر آخرین نسبت به قبلی
  changeFromFirstPct: number | null; // تغییر از اولین خرید تا امروز
  purchaseCount: number;
}

/**
 * تاریخچه قیمت فی یک کالا از دو منبع:
 *  ۱) اقلام فاکتور (invoice_items) — منبع اصلی و دقیق
 *  ۲) تراکنش‌های دارای مقدار که به کالا وصل شده‌اند — فی = مبلغ ÷ مقدار
 */
export function priceHistory(materialId: string, data: AllData): PricePoint[] {
  const points: PricePoint[] = [];

  // ۱) از اقلام فاکتور
  for (const item of data.items) {
    if (item.materialId !== materialId) continue;
    const inv = data.invoices.find((i) => i.id === item.invoiceId);
    if (!inv) continue;
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unitPrice) || 0;
    if (qty <= 0 || price <= 0) continue;
    points.push({
      id: item.id,
      date: inv.date,
      price,
      quantity: qty,
      total: item.amount || qty * price,
      source: "invoice",
      sourceLabel: data.parties.find((p) => p.id === inv.partyId)?.name ?? "—",
      invoiceNumber: inv.invoiceNumber,
    });
  }

  // ۲) از تراکنش‌های دارای مقدار
  for (const t of data.txs) {
    if (t.materialId !== materialId || t.type !== "expense") continue;
    const qty = Number(t.quantity) || 0;
    if (qty <= 0 || t.amount <= 0) continue;
    // اگر این تراکنش قبلاً از طریق فاکتور ثبت شده، دوباره حساب نشود
    if (t.invoiceId && points.some((p) => p.invoiceNumber !== null && data.invoices.find((i) => i.id === t.invoiceId)?.invoiceNumber === p.invoiceNumber)) {
      continue;
    }
    points.push({
      id: t.id,
      date: t.date,
      price: t.amount / qty,
      quantity: qty,
      total: t.amount,
      source: "transaction",
      sourceLabel: t.counterparty || t.description || "ثبت دستی",
      invoiceNumber: data.invoices.find((i) => i.id === t.invoiceId)?.invoiceNumber ?? null,
    });
  }

  return points.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

/** آمار کامل قیمت یک کالا */
export function priceStats(materialId: string, data: AllData): PriceStats {
  const points = priceHistory(materialId, data);
  if (points.length === 0) {
    return {
      points,
      latest: null,
      first: null,
      min: 0,
      max: 0,
      avg: 0,
      totalQty: 0,
      totalSpend: 0,
      changePct: null,
      changeFromFirstPct: null,
      purchaseCount: 0,
    };
  }
  const prices = points.map((p) => p.price);
  const totalSpend = points.reduce((a, p) => a + p.total, 0);
  const totalQty = points.reduce((a, p) => a + p.quantity, 0);
  const latest = points[points.length - 1];
  const first = points[0];
  const prev = points.length >= 2 ? points[points.length - 2] : null;

  return {
    points,
    latest,
    first,
    min: Math.min(...prices),
    max: Math.max(...prices),
    // میانگین وزنی بر اساس مقدار خرید — نه میانگین ساده
    avg: totalQty > 0 ? totalSpend / totalQty : 0,
    totalQty,
    totalSpend,
    changePct: prev && prev.price > 0 ? ((latest.price - prev.price) / prev.price) * 100 : null,
    changeFromFirstPct:
      first.price > 0 && points.length > 1 ? ((latest.price - first.price) / first.price) * 100 : null,
    purchaseCount: points.length,
  };
}

/** خلاصه همه کالاها برای جدول و نمودار مقایسه‌ای */
export interface MaterialSummary {
  id: string;
  name: string;
  unit: string;
  latestPrice: number | null;
  changePct: number | null;
  changeFromFirstPct: number | null;
  totalQty: number;
  totalSpend: number;
  purchaseCount: number;
  lastDate: string | null;
  points: PricePoint[];
}

export function materialSummaries(data: AllData): MaterialSummary[] {
  return data.materials
    .map((m) => {
      const s = priceStats(m.id, data);
      return {
        id: m.id,
        name: m.name,
        unit: m.unit,
        latestPrice: s.latest?.price ?? null,
        changePct: s.changePct,
        changeFromFirstPct: s.changeFromFirstPct,
        totalQty: s.totalQty,
        totalSpend: s.totalSpend,
        purchaseCount: s.purchaseCount,
        lastDate: s.latest?.date ?? null,
        points: s.points,
      };
    })
    .sort((a, b) => b.totalSpend - a.totalSpend);
}

/** تشخیص کالا از روی شرح تراکنش */
export function detectMaterial(text: string, data: AllData): string | null {
  const line = text.replace(/[ي]/g, "ی").replace(/[ك]/g, "ک");
  let best: { id: string; len: number } | null = null;
  for (const m of data.materials) {
    const names = [
      m.name,
      ...(m.keywords ? m.keywords.split(/[،,]/).map((k) => k.trim()) : []),
    ].filter(Boolean);
    for (const n of names) {
      const nn = n.replace(/[ي]/g, "ی").replace(/[ك]/g, "ک").trim();
      if (nn.length >= 3 && line.includes(nn)) {
        if (!best || nn.length > best.len) best = { id: m.id, len: nn.length };
      }
    }
  }
  return best?.id ?? null;
}
