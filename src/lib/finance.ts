import { db } from "@/db";
import {
  bankAccounts,
  categories,
  cheques,
  contractorPayments,
  contractors,
  contractorStatements,
  permits,
  projects,
  stages,
  transactions,
  units,
  workerPayments,
  workers,
  parties,
  invoices,
  materials,
  invoiceItems,
} from "@/db/schema";
import { jalaliMonthKey, monthsAgoISO } from "./jalali";

export interface TxRow {
  id: string;
  date: string;
  amount: number;
  type: string;
  accountId: string | null;
  toAccountId: string | null;
  projectId: string | null;
  categoryId: string | null;
  contractorId: string | null;
  workerId: string | null;
  chequeId: string | null;
  invoiceId: string | null;
  materialId: string | null;
  counterparty: string | null;
  quantity: number | null;
  unit: string | null;
  description: string | null;
  rawText: string | null;
}

export interface CatRow {
  id: string;
  name: string;
  kind: string;
  scope: string;
  stage: string | null;
  color: string | null;
}

/** بارگذاری کامل داده‌ها (مقیاس کوچک - تک‌کاربره) */
export async function loadAll() {
  const [
    projs, accts, cats, stgs, conts, stmts, pays, wrks, wpays, chqs, unts, perms, txs,
    partyRows, invoiceRows, materialRows, invoiceItemRows,
  ] = await Promise.all([
      db.select().from(projects).orderBy(projects.createdAt),
      db.select().from(bankAccounts).orderBy(bankAccounts.createdAt),
      db.select().from(categories).orderBy(categories.sort, categories.name),
      db.select().from(stages).orderBy(stages.sort),
      db.select().from(contractors).orderBy(contractors.name),
      db.select().from(contractorStatements).orderBy(contractorStatements.date),
      db.select().from(contractorPayments).orderBy(contractorPayments.date),
      db.select().from(workers).orderBy(workers.name),
      db.select().from(workerPayments).orderBy(workerPayments.date),
      db.select().from(cheques).orderBy(cheques.dueDate),
      db.select().from(units).orderBy(units.unitNumber),
      db.select().from(permits).orderBy(permits.createdAt),
      db.select().from(transactions).orderBy(transactions.date, transactions.createdAt),
      db.select().from(parties).orderBy(parties.name),
      db.select().from(invoices).orderBy(invoices.date),
      db.select().from(materials).orderBy(materials.name),
      db.select().from(invoiceItems),
    ]);
  return {
    projs, accts, cats, stgs, conts, stmts, pays, wrks, wpays, chqs, unts, perms, txs,
    parties: partyRows,
    invoices: invoiceRows,
    materials: materialRows,
    items: invoiceItemRows,
  };
}

export type AllData = Awaited<ReturnType<typeof loadAll>>;

/** آیا تراکنش از جیب خارج شده (خروجی نقدی) */
export function isOutflow(tx: { type: string }): boolean {
  return tx.type === "expense" || tx.type === "transfer";
}

/** آیا تراکنش ورودی نقدی است */
export function isInflow(tx: { type: string }): boolean {
  return tx.type === "income";
}

/** موجودی هر حساب */
export function accountBalances(
  accts: AllData["accts"],
  txs: TxRow[]
): Record<string, number> {
  const map: Record<string, number> = {};
  for (const a of accts) map[a.id] = a.initialBalance;
  for (const t of txs) {
    if (!t.accountId) continue; // تراکنش غیربانکی (مثل چک واگذارشده)
    if (t.type === "income") map[t.accountId] = (map[t.accountId] ?? 0) + t.amount;
    else if (t.type === "expense") map[t.accountId] = (map[t.accountId] ?? 0) - t.amount;
    else if (t.type === "transfer") {
      map[t.accountId] = (map[t.accountId] ?? 0) - t.amount;
      if (t.toAccountId) map[t.toAccountId] = (map[t.toAccountId] ?? 0) + t.amount;
    }
  }
  return map;
}

export interface ProjectFinancials {
  totalExpense: number;
  personalExpense: number; // هزینه‌های شخصی انجام‌شده از هر حساب
  projectExpense: number; // فقط هزینه پروژه
  income: number; // درآمد (فروش و...)
  netCash: number; // جریان نقدی خالص پروژه
  byCategory: Record<string, number>;
  byMonth: { key: string; label: string; expense: number; income: number }[];
  stageActuals: Record<string, number>;
  contractorStats: {
    contractorId: string;
    name: string;
    statementTotal: number;
    paidTotal: number;
    balance: number;
  }[];
  workerStats: { workerId: string; name: string; total: number; days: number }[];
  soldUnits: number;
  totalUnits: number;
  saleIncome: number;
  paidForUnits: number;
  costPerMeter: number | null;
}

const CATEGORY_ID_FOR_ESTIMATE = 0;

export function projectFinancials(projectId: string, data: AllData): ProjectFinancials {
  const { txs, cats, stgs, conts, stmts, pays, wrks, wpays, unts } = data;
  const catById = new Map(cats.map((c) => [c.id, c]));
  const projTxs = txs.filter((t) => t.projectId === projectId);
  const personalTxs = txs.filter((t) => {
    if (t.projectId) return false;
    const cat = t.categoryId ? catById.get(t.categoryId) : undefined;
    return cat?.scope === "personal";
  });

  let totalExpense = 0;
  let projectExpense = 0;
  let personalExpense = 0;
  let income = 0;
  const byCategory: Record<string, number> = {};
  const byMonthMap = new Map<string, { expense: number; income: number }>();
  const stageActuals: Record<string, number> = {};

  for (const t of txs) {
    const isProject = t.projectId === projectId;
    const cat = t.categoryId ? catById.get(t.categoryId) : undefined;
    const isPersonalTx = !t.projectId && cat?.scope === "personal";
    if (t.type === "expense") {
      if (isProject || isPersonalTx) {
        totalExpense += t.amount;
        if (isProject) projectExpense += t.amount;
        else personalExpense += t.amount;
        const key = t.categoryId ?? "بدون دسته";
        byCategory[key] = (byCategory[key] ?? 0) + t.amount;
        if (isProject && cat?.stage) {
          stageActuals[cat.stage] = (stageActuals[cat.stage] ?? 0) + t.amount;
        }
      }
      const mk = byMonthMap.get(jalaliMonthKey(t.date)) ?? { expense: 0, income: 0 };
      mk.expense += t.amount;
      byMonthMap.set(jalaliMonthKey(t.date), mk);
    } else if (t.type === "income" && isProject) {
      income += t.amount;
      const key = t.categoryId ?? "سایر درآمد";
      byCategory[key] = (byCategory[key] ?? 0) + t.amount;
      const mk = byMonthMap.get(jalaliMonthKey(t.date)) ?? { expense: 0, income: 0 };
      mk.income += t.amount;
      byMonthMap.set(jalaliMonthKey(t.date), mk);
    }
  }

  const byMonth = Array.from(byMonthMap.entries())
    .map(([key, v]) => ({ key, label: key, expense: v.expense, income: v.income }))
    .sort((a, b) => (a.key < b.key ? -1 : 1));

  // صورت‌وضعیت‌های مصوب هم باید در هزینه مرحله لحاظ شوند (تعهدی)
  const projStmts = stmts.filter((s) => s.projectId === projectId && s.status !== "rejected");
  for (const s of projStmts) {
    const stg = stgs.find((g) => g.id === s.stageId);
    if (stg) stageActuals[stg.name] = (stageActuals[stg.name] ?? 0) + s.amount;
  }
  void CATEGORY_ID_FOR_ESTIMATE;

  const contractorStats = conts.map((c) => {
    const stTotal = projStmts
      .filter((s) => s.contractorId === c.id)
      .reduce((a, s) => a + s.amount, 0);
    const pTotal = pays
      .filter((p) => p.contractorId === c.id && p.projectId === projectId)
      .reduce((a, p) => a + p.amount, 0);
    return {
      contractorId: c.id,
      name: c.name,
      statementTotal: stTotal,
      paidTotal: pTotal,
      balance: stTotal - pTotal,
    };
  });

  const workerStats = wrks.map((w) => {
    const wps = wpays.filter((p) => p.workerId === w.id && p.projectId === projectId);
    return {
      workerId: w.id,
      name: w.name,
      total: wps.reduce((a, p) => a + p.amount, 0),
      days: wps.reduce((a, p) => a + (p.days ?? 0), 0),
    };
  });

  const projUnits = unts.filter((u) => u.projectId === projectId);
  const soldUnits = projUnits.filter((u) => u.status === "sold");
  const saleIncome = soldUnits.reduce((a, u) => a + (u.soldPrice || u.price), 0);
  const proj = data.projs.find((p) => p.id === projectId);
  const costPerMeter =
    proj && proj.totalArea && proj.totalArea > 0 ? projectExpense / proj.totalArea : null;

  return {
    totalExpense,
    personalExpense,
    projectExpense,
    income,
    netCash: income - projectExpense - personalExpense,
    byCategory,
    byMonth,
    stageActuals,
    contractorStats,
    workerStats,
    soldUnits: soldUnits.length,
    totalUnits: projUnits.length,
    saleIncome,
    paidForUnits: income,
    costPerMeter,
  };
}

/** سری ۱۲ ماه اخیر برای نمودار */
export function monthlySeries(txs: TxRow[], months = 12) {
  const keys: string[] = [];
  let iso = monthsAgoISO(months - 1);
  for (let i = 0; i < months; i++) {
    keys.push(jalaliMonthKey(iso));
    iso = monthsAgoISO(months - 2 - i);
  }
  const map = new Map<string, { expense: number; income: number; transfer: number }>();
  for (const k of keys) map.set(k, { expense: 0, income: 0, transfer: 0 });
  for (const t of txs) {
    const k = jalaliMonthKey(t.date);
    const v = map.get(k);
    if (!v) continue;
    if (t.type === "expense") v.expense += t.amount;
    else if (t.type === "income") v.income += t.amount;
    else v.transfer += t.amount;
  }
  return keys.map((k) => ({ key: k, ...map.get(k)! }));
}

export interface TxView extends TxRow {
  projectName: string | null;
  accountName: string;
  toAccountName: string | null;
  categoryName: string | null;
  categoryColor: string | null;
  isPersonalCat: boolean;
  materialName?: string | null;
  invoiceNumber?: string | null;
}

export function decorateTx(tx: TxRow, data: AllData): TxView {
  const cat = data.cats.find((c) => c.id === tx.categoryId);
  const proj = data.projs.find((p) => p.id === tx.projectId);
  const acct = data.accts.find((a) => a.id === tx.accountId);
  const toAcct = data.accts.find((a) => a.id === tx.toAccountId);
  return {
    ...tx,
    projectName: proj?.name ?? null,
    accountName: acct?.name ?? "—",
    toAccountName: toAcct?.name ?? null,
    categoryName: cat?.name ?? null,
    categoryColor: cat?.color ?? null,
    isPersonalCat: cat?.scope === "personal",
    materialName: data.materials.find((m) => m.id === tx.materialId)?.name ?? null,
    invoiceNumber: data.invoices.find((i) => i.id === tx.invoiceId)?.invoiceNumber ?? null,
  };
}
