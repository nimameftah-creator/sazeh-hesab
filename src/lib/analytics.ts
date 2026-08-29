import type { AllData } from "./finance";
import { jalaliMonthKey, jalaliMonthLabel, todayISO } from "./jalali";

export type Dim =
  | "category"
  | "stage"
  | "party"
  | "project"
  | "account"
  | "month"
  | "counterparty"
  | "worker"
  | "contractor";

export interface Filters {
  projectId?: string | null;
  from?: string | null;
  to?: string | null;
  kind?: "expense" | "income" | "all";
}

export interface Slice {
  id: string;
  name: string;
  value: number;
  color: string;
}

const PALETTE = [
  "#10b981", "#22d3ee", "#8b5cf6", "#f59e0b", "#f43f5e",
  "#3b82f6", "#ec4899", "#14b8a6", "#a3e635", "#fb923c",
  "#6366f1", "#eab308", "#06b6d4", "#d946ef", "#84cc16",
];

export function dimLabel(d: Dim): string {
  return {
    category: "دسته‌بندی",
    stage: "مرحله ساخت",
    party: "طرف حساب",
    project: "پروژه",
    account: "حساب بانکی",
    month: "ماه",
    counterparty: "نام در شرح",
    worker: "کارگر",
    contractor: "پیمانکار",
  }[d];
}

/** اعمال فیلتر روی تراکنش‌ها */
export function filterTxs(txs: AllData["txs"], f: Filters) {
  return txs.filter((t) => {
    if (f.projectId && t.projectId !== f.projectId) return false;
    if (f.from && t.date < f.from) return false;
    if (f.to && t.date > f.to) return false;
    if (f.kind === "expense" && t.type !== "expense") return false;
    if (f.kind === "income" && t.type !== "income") return false;
    if (!f.kind || f.kind === "all") {
      // پیش‌فرض فقط هزینه و درآمد (انتقال داخلی لحاظ نمی‌شود)
      if (t.type === "transfer") return false;
    }
    return true;
  });
}

/** نام طرف حساب تراکنش (از شناسه یا متن شرح) */
export function partyNameOf(t: AllData["txs"][number], data: AllData): string {
  if (t.partyId) {
    const p = data.parties.find((x) => x.id === t.partyId);
    if (p) return p.name;
  }
  if (t.counterparty) {
    const cp = t.counterparty.trim();
    const hit = data.parties.find(
      (p) =>
        p.name.includes(cp) ||
        cp.includes(p.name) ||
        (p.keywords ?? "").split(/[،,]/).some((k) => k.trim() && cp.includes(k.trim()))
    );
    if (hit) return hit.name;
    return cp;
  }
  return "نامشخص";
}

/** گروه‌بندی تراکنش‌ها بر اساس یک بُعد دلخواه */
export function groupBy(
  dim: Dim,
  txs: AllData["txs"],
  data: AllData
): Slice[] {
  const map = new Map<string, number>();
  for (const t of txs) {
    let key = "";
    switch (dim) {
      case "category": {
        const c = data.cats.find((x) => x.id === t.categoryId);
        key = c?.name ?? (t.type === "income" ? "سایر درآمد" : "بدون دسته");
        break;
      }
      case "stage": {
        const c = data.cats.find((x) => x.id === t.categoryId);
        key = c?.stage ?? "تخصیص‌نیافته";
        break;
      }
      case "party":
        key = partyNameOf(t, data);
        break;
      case "project":
        key = data.projs.find((p) => p.id === t.projectId)?.name ?? "شخصی / بدون پروژه";
        break;
      case "account":
        key = data.accts.find((a) => a.id === t.accountId)?.name ?? "بدون حساب";
        break;
      case "month":
        key = jalaliMonthKey(t.date);
        break;
      case "counterparty":
        key = t.counterparty?.trim() || "نامشخص";
        break;
      case "worker": {
        const w = data.wrks.find((x) => x.id === t.workerId);
        key = w?.name ?? data.conts.find((x) => x.id === t.contractorId)?.name ?? "سایر";
        break;
      }
      case "contractor":
        key =
          data.conts.find((x) => x.id === t.contractorId)?.name ??
          data.wrks.find((x) => x.id === t.workerId)?.name ??
          "سایر";
        break;
    }
    map.set(key, (map.get(key) ?? 0) + t.amount);
  }
  return Array.from(map.entries())
    .map(([name, value], i) => ({
      id: name,
      name: dim === "month" ? jalaliMonthLabel(name) : name,
      value,
      color: dim === "category" ? data.cats.find((c) => c.name === name)?.color ?? PALETTE[i % PALETTE.length] : PALETTE[i % PALETTE.length],
    }))
    .sort((a, b) => b.value - a.value);
}

/** ردیف‌های خامِ یک مقدار مشخص برای دریل‌داون */
export function drilldown(
  dim: Dim,
  value: string,
  txs: AllData["txs"],
  data: AllData
) {
  return txs
    .filter((t) => {
      switch (dim) {
        case "category":
          return (data.cats.find((x) => x.id === t.categoryId)?.name ?? "بدون دسته") === value;
        case "stage":
          return (data.cats.find((x) => x.id === t.categoryId)?.stage ?? "تخصیص‌نیافته") === value;
        case "party":
          return partyNameOf(t, data) === value;
        case "project":
          return (data.projs.find((p) => p.id === t.projectId)?.name ?? "شخصی / بدون پروژه") === value;
        case "account":
          return (data.accts.find((a) => a.id === t.accountId)?.name ?? "بدون حساب") === value;
        case "month":
          return jalaliMonthKey(t.date) === value;
        case "counterparty":
          return (t.counterparty?.trim() || "نامشخص") === value;
        default:
          return true;
      }
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

// ---------------- مراحل ساخت ----------------
export interface StageRow {
  id: string;
  name: string;
  weight: number;
  budget: number;
  actual: number;
  remaining: number;
  sharePct: number; // سهم واقعی از کل هزینه پروژه
  plannedSharePct: number; // سهم برنامه‌ای بر اساس وزن
  deviation: number; // انحراف مالی
}

export function stageReport(projectId: string, data: AllData): StageRow[] {
  const projStages = data.stgs.filter((s) => s.projectId === projectId);
  // هزینه واقعی هر مرحله از روی دسته‌بندی تراکنش‌ها
  const actualByStage = new Map<string, number>();
  for (const t of data.txs) {
    if (t.projectId !== projectId || t.type !== "expense") continue;
    const c = data.cats.find((x) => x.id === t.categoryId);
    const key = c?.stage ?? "تخصیص‌نیافته";
    actualByStage.set(key, (actualByStage.get(key) ?? 0) + t.amount);
  }
  // صورت‌وضعیت‌های مصوب پیمانکاران هم در مرحله‌شان لحاظ می‌شود
  for (const s of data.stmts) {
    if (s.projectId !== projectId || s.status === "rejected") continue;
    const st = projStages.find((x) => x.id === s.stageId);
    if (st) actualByStage.set(st.name, (actualByStage.get(st.name) ?? 0) + s.amount);
  }

  const totalActual = Array.from(actualByStage.values()).reduce((a, b) => a + b, 0);
  const totalWeight = projStages.reduce((a, s) => a + s.weight, 0) || 100;

  const rows: StageRow[] = projStages.map((s) => {
    const actual = actualByStage.get(s.name) ?? 0;
    return {
      id: s.id,
      name: s.name,
      weight: s.weight,
      budget: s.budget,
      actual,
      remaining: Math.max(0, s.budget - actual),
      sharePct: totalActual > 0 ? (actual / totalActual) * 100 : 0,
      plannedSharePct: (s.weight / totalWeight) * 100,
      deviation: actual - s.budget,
    };
  });

  // مراحلی که تراکنش دارند ولی در فهرست پروژه نیستند
  for (const [name, actual] of actualByStage) {
    if (!rows.find((r) => r.name === name)) {
      rows.push({
        id: `extra-${name}`,
        name,
        weight: 0,
        budget: 0,
        actual,
        remaining: 0,
        sharePct: totalActual > 0 ? (actual / totalActual) * 100 : 0,
        plannedSharePct: 0,
        deviation: actual,
      });
    }
  }
  return rows.sort((a, b) => b.actual - a.actual);
}

// ---------------- طرف حساب‌ها ----------------
export interface PartyLedger {
  partyId: string;
  name: string;
  type: string;
  phone: string | null;
  cashPurchases: number; // خرید نقدی (تراکنش‌ها)
  receivedFrom: number; // دریافتی از او (فروش/برگشتی)
  invoiceTotal: number; // فاکتورهای نسیه
  invoicePaid: number; // پرداخت بابت فاکتور
  balance: number; // مثبت = ما بدهکاریم | منفی = ما طلبکاریم
  txCount: number;
  topCategories: { name: string; value: number; color: string }[];
  lastDate: string | null;
}

export function partyLedger(data: AllData, projectId?: string | null): PartyLedger[] {
  const rows: PartyLedger[] = [];
  const byId = new Map<string, PartyLedger>();

  const ensure = (id: string, name: string, type: string, phone: string | null) => {
    let r = byId.get(id);
    if (!r) {
      r = {
        partyId: id,
        name,
        type,
        phone,
        cashPurchases: 0,
        receivedFrom: 0,
        invoiceTotal: 0,
        invoicePaid: 0,
        balance: 0,
        txCount: 0,
        topCategories: [],
        lastDate: null,
      };
      byId.set(id, r);
      rows.push(r);
    }
    return r;
  };

  const catTotals = new Map<string, Map<string, number>>();
  const addCat = (pid: string, catId: string | null, amount: number) => {
    let m = catTotals.get(pid);
    if (!m) {
      m = new Map();
      catTotals.set(pid, m);
    }
    const c = data.cats.find((x) => x.id === catId);
    const key = c?.name ?? "بدون دسته";
    m.set(key, (m.get(key) ?? 0) + amount);
  };

  for (const t of data.txs) {
    if (t.type === "transfer") continue;
    if (projectId && t.projectId !== projectId) continue;
    const name = partyNameOf(t, data);
    if (name === "نامشخص" && !t.partyId) continue;
    const p =
      data.parties.find((x) => x.id === t.partyId) ??
      data.parties.find((x) => x.name === name) ??
      { id: `virtual-${name}`, name, type: t.type === "income" ? "buyer" : "supplier", phone: null };
    const r = ensure(p.id, p.name, p.type, p.phone);
    r.txCount += 1;
    if (!r.lastDate || t.date > r.lastDate) r.lastDate = t.date;
    if (t.type === "expense") {
      r.cashPurchases += t.amount;
      if (t.categoryId) addCat(p.id, t.categoryId, t.amount);
    } else if (t.type === "income") {
      r.receivedFrom += t.amount;
    }
  }

  for (const inv of data.invoices) {
    if (projectId && inv.projectId !== projectId) continue;
    const p = data.parties.find((x) => x.id === inv.partyId);
    if (!p) continue;
    const r = ensure(p.id, p.name, p.type, p.phone);
    r.invoiceTotal += inv.amount;
    r.invoicePaid += inv.paidAmount;
    if (!r.lastDate || inv.date > r.lastDate) r.lastDate = inv.date;
  }

  for (const r of rows) {
    r.balance = r.invoiceTotal - r.invoicePaid;
    const m = catTotals.get(r.partyId);
    r.topCategories = Array.from(m ?? [])
      .map(([name, value], i) => ({
        name,
        value,
        color: data.cats.find((c) => c.name === name)?.color ?? PALETTE[i % PALETTE.length],
      }))
      .sort((a, b) => b.value - a.value);
  }

  return rows.sort((a, b) => b.cashPurchases + b.invoiceTotal - (a.cashPurchases + a.invoiceTotal));
}

// ---------------- چک‌ها ----------------
export interface ChequeAlert {
  id: string;
  chequeNumber: string;
  drawer: string | null;
  amount: number;
  dueDate: string;
  daysLeft: number;
  level: "overdue" | "urgent" | "soon" | "ok";
  projectName: string | null;
  notes: string | null;
}

export function chequeAlerts(data: AllData, windowDays = 14): ChequeAlert[] {
  const today = todayISO();
  return data.chqs
    .filter((c) => c.status === "in_hand" || c.status === "received")
    .map((c) => {
      const ms = new Date(`${c.dueDate}T00:00:00`).getTime() - new Date(`${today}T00:00:00`).getTime();
      const daysLeft = Math.round(ms / 86400000);
      const w = c.reminderDays || windowDays;
      let level: ChequeAlert["level"] = "ok";
      if (daysLeft < 0) level = "overdue";
      else if (daysLeft <= 3) level = "urgent";
      else if (daysLeft <= w) level = "soon";
      return {
        id: c.id,
        chequeNumber: c.chequeNumber,
        drawer: c.drawer,
        amount: c.amount,
        dueDate: c.dueDate,
        daysLeft,
        level,
        projectName: data.projs.find((p) => p.id === c.projectId)?.name ?? null,
        notes: c.notes,
      };
    })
    .sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1));
}

export function chequeTimeline(data: AllData, projectId?: string | null) {
  const map = new Map<string, { key: string; pending: number; cashed: number; bounced: number; transferred: number }>();
  const ensure = (k: string) => {
    let v = map.get(k);
    if (!v) {
      v = { key: k, pending: 0, cashed: 0, bounced: 0, transferred: 0 };
      map.set(k, v);
    }
    return v;
  };
  for (const c of data.chqs) {
    if (projectId && c.projectId !== projectId) continue;
    const v = ensure(jalaliMonthKey(c.dueDate));
    if (c.status === "in_hand" || c.status === "received") v.pending += c.amount;
    else if (c.status === "cashed" || c.status === "deposited") v.cashed += c.amount;
    else if (c.status === "bounced") v.bounced += c.amount;
    else if (c.status === "transferred") v.transferred += c.amount;
  }
  const keys = Array.from(map.keys()).sort();
  const all = keys.length ? keys : [jalaliMonthKey(todayISO())];
  // محدود کردن به حداکثر ۸ ماه پیرامون امروز
  const nowKey = jalaliMonthKey(todayISO());
  const idx = all.indexOf(nowKey);
  const start = Math.max(0, (idx < 0 ? all.length : idx) - 4);
  return all.slice(start, start + 9).map((k) => map.get(k) ?? { key: k, pending: 0, cashed: 0, bounced: 0, transferred: 0 });
}

// ---------------- سری ماهانه ----------------
export function monthlyTotals(txs: AllData["txs"]) {
  const map = new Map<string, { income: number; expense: number }>();
  for (const t of txs) {
    const k = jalaliMonthKey(t.date);
    const v = map.get(k) ?? { income: 0, expense: 0 };
    if (t.type === "income") v.income += t.amount;
    else if (t.type === "expense") v.expense += t.amount;
    map.set(k, v);
  }
  return Array.from(map.entries())
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([key, v]) => ({ key, label: jalaliMonthLabel(key), ...v }));
}
