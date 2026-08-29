"use server";

import { revalidatePath } from "next/cache";
import { eq, inArray } from "drizzle-orm";
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
import { parseAmount } from "@/lib/format";
import { todayISO, jalaaliToISO } from "@/lib/jalali";

export type ActionResult = { ok: boolean; error?: string };

/** تبدیل ورودی تاریخ (شمسی ۱۴۰۳/۰۵/۱۲ یا میلادی 2024-05-12) به ISO میلادی */
function parseDate(v: FormDataEntryValue | null): string {
  const s = normalizeFa(String(v ?? "")).trim();
  if (!s) return todayISO();
  const j = /^(1[3-4]\d{2})[\/\-.](\d{1,2})[\/\-.](\d{1,2})$/.exec(s);
  if (j) {
    try {
      return jalaaliToISO(Number(j[1]), Number(j[2]), Number(j[3]));
    } catch {
      return todayISO();
    }
  }
  const g = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (g) return s;
  return todayISO();
}

async function fail(e: unknown): Promise<ActionResult> {
  console.error(e);
  return { ok: false, error: e instanceof Error ? e.message : "خطای نامشخص" };
}

function num(v: FormDataEntryValue | null): number {
  return parseAmount(v as string | null);
}

// ---------- پروژه ----------
const DEFAULT_STAGES = [
  "مجوزها و طراحی",
  "خاک‌برداری و فونداسیون",
  "اسکلت و سفت‌کاری",
  "تاسیسات",
  "نازک‌کاری",
  "نما و محوطه",
];

export async function addProject(fd: FormData): Promise<ActionResult> {
  try {
    const [p] = await db
      .insert(projects)
      .values({
        name: String(fd.get("name") ?? "").trim(),
        keywords: String(fd.get("keywords") ?? "").trim() || null,
        location: String(fd.get("location") ?? "").trim() || null,
        status: String(fd.get("status") ?? "active"),
        startDate: fd.get("startDate") ? parseDate(fd.get("startDate")) : null,
        landCost: num(fd.get("landCost")),
        estimatedCost: num(fd.get("estimatedCost")),
        estimatedRevenue: num(fd.get("estimatedRevenue")),
        numUnits: num(fd.get("numUnits")),
        totalArea: fd.get("totalArea") ? parseFloat(normalizeFa(String(fd.get("totalArea")))) : null,
        progress: num(fd.get("progress")),
      })
      .returning({ id: projects.id });
    await db.insert(stages).values(
      DEFAULT_STAGES.map((name, i) => ({
        projectId: p.id,
        name,
        budget: 0,
        sort: i + 1,
      }))
    );
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

function normalizeFa(s: string): string {
  return s
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

export async function updateProject(fd: FormData): Promise<ActionResult> {
  try {
    const id = String(fd.get("id"));
    await db
      .update(projects)
      .set({
        name: String(fd.get("name") ?? "").trim(),
        keywords: String(fd.get("keywords") ?? "").trim() || null,
        location: String(fd.get("location") ?? "").trim() || null,
        status: String(fd.get("status") ?? "active"),
        startDate: fd.get("startDate") ? parseDate(fd.get("startDate")) : null,
        landCost: num(fd.get("landCost")),
        estimatedCost: num(fd.get("estimatedCost")),
        estimatedRevenue: num(fd.get("estimatedRevenue")),
        numUnits: num(fd.get("numUnits")),
        totalArea: fd.get("totalArea") ? parseFloat(normalizeFa(String(fd.get("totalArea")))) : null,
        progress: num(fd.get("progress")),
      })
      .where(eq(projects.id, id));
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteProject(id: string): Promise<ActionResult> {
  try {
    await db.delete(projects).where(eq(projects.id, id));
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

// ---------- حساب بانکی ----------
export async function addAccount(fd: FormData): Promise<ActionResult> {
  try {
    await db.insert(bankAccounts).values({
      name: String(fd.get("name") ?? "").trim(),
      bankName: String(fd.get("bankName") ?? "").trim() || null,
      cardNumber: String(fd.get("cardNumber") ?? "").trim() || null,
      accountNumber: String(fd.get("accountNumber") ?? "").trim() || null,
      holder: String(fd.get("holder") ?? "").trim() || null,
      isPersonal: fd.get("isPersonal") === "on",
      initialBalance: num(fd.get("initialBalance")),
    });
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteAccount(id: string): Promise<ActionResult> {
  try {
    await db.delete(bankAccounts).where(eq(bankAccounts.id, id));
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

// ---------- دسته‌بندی ----------
export async function addCategory(fd: FormData): Promise<ActionResult> {
  try {
    await db.insert(categories).values({
      name: String(fd.get("name") ?? "").trim(),
      kind: String(fd.get("kind") ?? "expense"),
      scope: String(fd.get("scope") ?? "project"),
      stage: String(fd.get("stage") ?? "").trim() || null,
      keywords: String(fd.get("keywords") ?? "").trim() || null,
      color: String(fd.get("color") ?? "") || null,
    });
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  try {
    await db.delete(categories).where(eq(categories.id, id));
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

// ---------- تراکنش ----------
export async function addTransaction(fd: FormData): Promise<ActionResult> {
  try {
    const type = String(fd.get("type") ?? "expense");
    await db.insert(transactions).values({
      date: parseDate(fd.get("date")),
      amount: num(fd.get("amount")),
      type,
      accountId: String(fd.get("accountId") || "") || null,
      toAccountId: type === "transfer" ? String(fd.get("toAccountId") || "") || null : null,
      projectId: String(fd.get("projectId") || "") || null,
      categoryId: String(fd.get("categoryId") || "") || null,
      partyId: String(fd.get("partyId") || "") || null,
      contractorId: String(fd.get("contractorId") || "") || null,
      workerId: String(fd.get("workerId") || "") || null,
      materialId: String(fd.get("materialId") || "") || null,
      invoiceId: String(fd.get("invoiceId") || "") || null,
      quantity: fd.get("quantity") ? parseFloat(normalizeFa(String(fd.get("quantity")))) : null,
      unit: String(fd.get("unit") ?? "").trim() || null,
      counterparty: String(fd.get("counterparty") ?? "").trim() || null,
      description: String(fd.get("description") ?? "").trim(),
    });
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteTransaction(id: string): Promise<ActionResult> {
  try {
    await db.delete(transactions).where(eq(transactions.id, id));
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

// ---------- ورود گروهی پرینت بانک ----------
export async function importTransactions(input: {
  accountId: string;
  rows: {
    date: string;
    amount: number;
    type: string;
    projectId: string | null;
    categoryId: string | null;
    partyId?: string | null;
    counterparty: string;
    description: string;
    rawText: string;
  }[];
}): Promise<ActionResult> {
  try {
    const valid = input.rows.filter((r) => r.amount > 0);
    if (valid.length === 0) return { ok: false, error: "هیچ ردیف معتبری وجود ندارد" };
    await db.insert(transactions).values(
      valid.map((r) => ({
        date: r.date,
        amount: Math.round(r.amount),
        type: r.type,
        accountId: input.accountId,
        projectId: r.projectId || null,
        categoryId: r.categoryId || null,
        partyId: r.partyId || null,
        counterparty: r.counterparty || null,
        description: r.description,
        rawText: r.rawText,
      }))
    );
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

// ---------- پیمانکار ----------
export async function addContractor(fd: FormData): Promise<ActionResult> {
  try {
    await db.insert(contractors).values({
      name: String(fd.get("name") ?? "").trim(),
      specialty: String(fd.get("specialty") ?? "").trim() || null,
      phone: String(fd.get("phone") ?? "").trim() || null,
    });
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteContractor(id: string): Promise<ActionResult> {
  try {
    await db.delete(contractors).where(eq(contractors.id, id));
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function addStatement(fd: FormData): Promise<ActionResult> {
  try {
    await db.insert(contractorStatements).values({
      contractorId: String(fd.get("contractorId")),
      projectId: String(fd.get("projectId")),
      stageId: String(fd.get("stageId") || "") || null,
      title: String(fd.get("title") ?? "").trim(),
      date: parseDate(fd.get("date")),
      amount: num(fd.get("amount")),
      status: String(fd.get("status") ?? "approved"),
    });
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteStatement(id: string): Promise<ActionResult> {
  try {
    await db.delete(contractorStatements).where(eq(contractorStatements.id, id));
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

async function findCategoryByName(kind: string, ...names: string[]): Promise<string | null> {
  const rows = await db.select().from(categories).where(eq(categories.kind, kind));
  const hit = rows.find((c) => names.some((n) => c.name.includes(n)));
  return hit?.id ?? null;
}

export async function addContractorPayment(fd: FormData): Promise<ActionResult> {
  try {
    const contractorId = String(fd.get("contractorId"));
    const projectId = String(fd.get("projectId"));
    const amount = num(fd.get("amount"));
    const date = parseDate(fd.get("date"));
    const description = String(fd.get("description") ?? "").trim();
    const createTx = fd.get("createTx") === "on";
    const accountId = String(fd.get("accountId") || "");
    let transactionId: string | null = null;
    if (createTx && accountId) {
      const categoryId = String(fd.get("categoryId") || "") || (await findCategoryByName("expense", "پیمانکار", "قرارداد"));
      const [tx] = await db
        .insert(transactions)
        .values({
          date,
          amount,
          type: "expense",
          accountId,
          projectId,
          categoryId,
          contractorId,
          counterparty: String(fd.get("counterparty") ?? "").trim() || null,
          description,
        })
        .returning({ id: transactions.id });
      transactionId = tx.id;
    }
    await db.insert(contractorPayments).values({
      contractorId,
      projectId,
      statementId: String(fd.get("statementId") || "") || null,
      date,
      amount,
      description,
      transactionId,
    });
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteContractorPayment(id: string): Promise<ActionResult> {
  try {
    await db.delete(contractorPayments).where(eq(contractorPayments.id, id));
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

// ---------- کارگر ----------
export async function addWorker(fd: FormData): Promise<ActionResult> {
  try {
    await db.insert(workers).values({
      name: String(fd.get("name") ?? "").trim(),
      type: String(fd.get("type") ?? "daily"),
      dailyRate: num(fd.get("dailyRate")),
      monthlySalary: num(fd.get("monthlySalary")),
      phone: String(fd.get("phone") ?? "").trim() || null,
    });
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteWorker(id: string): Promise<ActionResult> {
  try {
    await db.delete(workers).where(eq(workers.id, id));
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function addWorkerPayment(fd: FormData): Promise<ActionResult> {
  try {
    const workerId = String(fd.get("workerId"));
    const projectId = String(fd.get("projectId"));
    const amount = num(fd.get("amount"));
    const date = parseDate(fd.get("date"));
    const description = String(fd.get("description") ?? "").trim();
    const createTx = fd.get("createTx") === "on";
    const accountId = String(fd.get("accountId") || "");
    let transactionId: string | null = null;
    if (createTx && accountId) {
      const categoryId = String(fd.get("categoryId") || "") || (await findCategoryByName("expense", "دستمزد"));
      const [tx] = await db
        .insert(transactions)
        .values({
          date,
          amount,
          type: "expense",
          accountId,
          projectId,
          categoryId,
          workerId,
          counterparty: String(fd.get("counterparty") ?? "").trim() || null,
          description,
        })
        .returning({ id: transactions.id });
      transactionId = tx.id;
    }
    await db.insert(workerPayments).values({
      workerId,
      projectId,
      date,
      amount,
      days: fd.get("days") ? num(fd.get("days")) : null,
      description,
      transactionId,
    });
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteWorkerPayment(id: string): Promise<ActionResult> {
  try {
    await db.delete(workerPayments).where(eq(workerPayments.id, id));
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

// ---------- واحد ----------
export async function addUnit(fd: FormData): Promise<ActionResult> {
  try {
    await db.insert(units).values({
      projectId: String(fd.get("projectId")),
      unitNumber: String(fd.get("unitNumber") ?? "").trim(),
      floor: fd.get("floor") ? num(fd.get("floor")) : null,
      area: fd.get("area") ? parseFloat(normalizeFa(String(fd.get("area")))) : null,
      price: num(fd.get("price")),
      status: String(fd.get("status") ?? "available"),
    });
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function updateUnit(fd: FormData): Promise<ActionResult> {
  try {
    const id = String(fd.get("id"));
    const status = String(fd.get("status") ?? "available");
    const createIncomeTx = fd.get("createIncomeTx") === "on";
    const paidAmount = num(fd.get("paidAmount"));
    const accountId = String(fd.get("accountId") || "");
    await db
      .update(units)
      .set({
        unitNumber: String(fd.get("unitNumber") ?? "").trim(),
        floor: fd.get("floor") ? num(fd.get("floor")) : null,
        area: fd.get("area") ? parseFloat(normalizeFa(String(fd.get("area")))) : null,
        price: num(fd.get("price")),
        soldPrice: num(fd.get("soldPrice")),
        buyerName: String(fd.get("buyerName") ?? "").trim() || null,
        buyerPhone: String(fd.get("buyerPhone") ?? "").trim() || null,
        status,
        soldDate: status === "sold" ? parseDate(fd.get("soldDate")) : null,
      })
      .where(eq(units.id, id));
    if (createIncomeTx && paidAmount > 0 && accountId) {
      const categoryId =
        String(fd.get("categoryId") || "") || (await findCategoryByName("income", "فروش واحد"));
      await db.insert(transactions).values({
        date: String(fd.get("soldDate") ?? todayISO()),
        amount: paidAmount,
        type: "income",
        accountId,
        projectId: String(fd.get("projectId")),
        categoryId,
        counterparty: String(fd.get("buyerName") ?? "").trim() || null,
        description: `دریافت بابت ${String(fd.get("unitNumber"))}`,
      });
    }
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteUnit(id: string): Promise<ActionResult> {
  try {
    await db.delete(units).where(eq(units.id, id));
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

// ---------- مجوز ----------
export async function addPermit(fd: FormData): Promise<ActionResult> {
  try {
    await db.insert(permits).values({
      projectId: String(fd.get("projectId")),
      name: String(fd.get("name") ?? "").trim(),
      status: String(fd.get("status") ?? "in_progress"),
      issueDate: fd.get("issueDate") ? parseDate(fd.get("issueDate")) : null,
      expiryDate: fd.get("expiryDate") ? parseDate(fd.get("expiryDate")) : null,
      cost: num(fd.get("cost")),
    });
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function updatePermitStatus(id: string, status: string): Promise<ActionResult> {
  try {
    await db.update(permits).set({ status }).where(eq(permits.id, id));
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deletePermit(id: string): Promise<ActionResult> {
  try {
    await db.delete(permits).where(eq(permits.id, id));
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

// ---------- مرحله ساخت ----------
export async function updateStageBudget(fd: FormData): Promise<ActionResult> {
  try {
    await db
      .update(stages)
      .set({ budget: num(fd.get("budget")), name: String(fd.get("name") ?? "").trim() })
      .where(eq(stages.id, String(fd.get("id"))));
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

// ---------- چک ----------
export async function addCheque(fd: FormData): Promise<ActionResult> {
  try {
    await db.insert(cheques).values({
      chequeNumber: String(fd.get("chequeNumber") ?? "").trim(),
      bankName: String(fd.get("bankName") ?? "").trim() || null,
      drawer: String(fd.get("drawer") ?? "").trim() || null,
      projectId: String(fd.get("projectId") || "") || null,
      unitId: String(fd.get("unitId") || "") || null,
      amount: num(fd.get("amount")),
      dueDate: parseDate(fd.get("dueDate")),
      receivedDate: parseDate(fd.get("receivedDate")),
      status: "in_hand",
      notes: String(fd.get("notes") ?? "").trim() || null,
    });
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteCheque(id: string): Promise<ActionResult> {
  try {
    await db.delete(cheques).where(eq(cheques.id, id));
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function chequeAction(
  id: string,
  action: "deposited" | "cashed" | "transferred" | "bounced" | "returned" | "in_hand",
  extra: { transferTo?: string; accountId?: string; categoryId?: string } = {}
): Promise<ActionResult> {
  try {
    const [chq] = await db.select().from(cheques).where(eq(cheques.id, id));
    if (!chq) return { ok: false, error: "چک پیدا نشد" };
    let transactionId = chq.transactionId;

    if (action === "deposited" || action === "cashed") {
      if (!transactionId && extra.accountId) {
        const categoryId =
          extra.categoryId || (await findCategoryByName("income", "فروش واحد")) || null;
        const [tx] = await db
          .insert(transactions)
          .values({
            date: todayISO(),
            amount: chq.amount,
            type: "income",
            accountId: extra.accountId,
            projectId: chq.projectId,
            categoryId,
            chequeId: chq.id,
            counterparty: chq.drawer,
            description: `چک شماره ${chq.chequeNumber}${action === "cashed" ? " – نقد شد" : " – واریز شد"}`,
          })
          .returning({ id: transactions.id });
        transactionId = tx.id;
      }
    } else if (action === "transferred") {
      if (!transactionId) {
        const categoryId = extra.categoryId || (await findCategoryByName("expense", "پیمانکار", "مصالح"));
        const [tx] = await db
          .insert(transactions)
          .values({
            date: todayISO(),
            amount: chq.amount,
            type: "expense",
            accountId: extra.accountId || null,
            projectId: chq.projectId,
            categoryId,
            chequeId: chq.id,
            counterparty: extra.transferTo || chq.transferTo,
            description: `چک شماره ${chq.chequeNumber} واگذار شد به ${extra.transferTo || ""}`,
          })
          .returning({ id: transactions.id });
        transactionId = tx.id;
      }
    }

    await db
      .update(cheques)
      .set({
        status: action,
        settledDate: action === "in_hand" ? null : todayISO(),
        transferTo: action === "transferred" ? extra.transferTo || chq.transferTo : chq.transferTo,
        transactionId,
      })
      .where(eq(cheques.id, id));
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

// ---------- طرف حساب‌ها ----------
export async function addParty(fd: FormData): Promise<ActionResult> {
  try {
    await db.insert(parties).values({
      name: String(fd.get("name") ?? "").trim(),
      type: String(fd.get("type") ?? "supplier"),
      keywords: String(fd.get("keywords") ?? "").trim() || null,
      phone: String(fd.get("phone") ?? "").trim() || null,
    });
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteParty(id: string): Promise<ActionResult> {
  try {
    await db.delete(parties).where(eq(parties.id, id));
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

// ---------- فاکتورهای نسیه ----------
export async function addInvoice(fd: FormData): Promise<ActionResult> {
  try {
    await db.insert(invoices).values({
      partyId: String(fd.get("partyId")),
      projectId: String(fd.get("projectId") || "") || null,
      categoryId: String(fd.get("categoryId") || "") || null,
      date: parseDate(fd.get("date")),
      amount: num(fd.get("amount")),
      paidAmount: num(fd.get("paidAmount")),
      description: String(fd.get("description") ?? "").trim(),
    });
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function payInvoice(fd: FormData): Promise<ActionResult> {
  try {
    const id = String(fd.get("id"));
    const amount = num(fd.get("amount"));
    const [inv] = await db.select().from(invoices).where(eq(invoices.id, id));
    if (!inv) return { ok: false, error: "فاکتور پیدا نشد" };
    const paid = Math.min(inv.amount, inv.paidAmount + amount);
    await db
      .update(invoices)
      .set({
        paidAmount: paid,
        status: paid >= inv.amount ? "paid" : paid > 0 ? "partial" : "unpaid",
      })
      .where(eq(invoices.id, id));
    // ثبت تراکنش بانکی در صورت انتخاب حساب
    const accountId = String(fd.get("accountId") || "");
    if (accountId) {
      await db.insert(transactions).values({
        date: parseDate(fd.get("date")),
        amount,
        type: "expense",
        accountId,
        projectId: inv.projectId,
        categoryId: inv.categoryId,
        partyId: inv.partyId,
        description: `پرداخت فاکتور${inv.description ? " – " + inv.description : ""}`,
      });
    }
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteInvoice(id: string): Promise<ActionResult> {
  try {
    await db.delete(invoices).where(eq(invoices.id, id));
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

// ---------- کالا / مصالح ----------
export async function addMaterial(fd: FormData): Promise<ActionResult> {
  try {
    await db.insert(materials).values({
      name: String(fd.get("name") ?? "").trim(),
      unit: String(fd.get("unit") ?? "عدد").trim() || "عدد",
      keywords: String(fd.get("keywords") ?? "").trim() || null,
      categoryId: String(fd.get("categoryId") || "") || null,
    });
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteMaterial(id: string): Promise<ActionResult> {
  try {
    await db.delete(materials).where(eq(materials.id, id));
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export interface ItemInput {
  materialId: string;
  quantity: number;
  unitPrice: number;
  description?: string;
}

/** ثبت فاکتور همراه با اقلام (قیمت فی هر کالا) */
export async function addInvoiceWithItems(input: {
  partyId: string;
  projectId: string | null;
  categoryId: string | null;
  date: string;
  invoiceNumber: string | null;
  description: string;
  paidAmount: number;
  items: ItemInput[];
  /** در صورت انتخاب حساب، تراکنش پرداخت هم ثبت می‌شود */
  accountId?: string | null;
}): Promise<ActionResult> {
  try {
    const validItems = input.items.filter(
      (i) => i.materialId && i.quantity > 0 && i.unitPrice > 0
    );
    if (validItems.length === 0) {
      return { ok: false, error: "حداقل یک قلم کالا با مقدار و قیمت فی وارد کنید" };
    }
    const amount = validItems.reduce(
      (a, i) => a + Math.round(i.quantity * i.unitPrice),
      0
    );

    const [inv] = await db
      .insert(invoices)
      .values({
        partyId: input.partyId,
        projectId: input.projectId || null,
        categoryId: input.categoryId || null,
        invoiceNumber: input.invoiceNumber || null,
        date: input.date,
        amount,
        paidAmount: Math.min(input.paidAmount || 0, amount),
        status: (input.paidAmount || 0) >= amount ? "paid" : (input.paidAmount || 0) > 0 ? "partial" : "unpaid",
        description: input.description,
      })
      .returning({ id: invoices.id });

    await db.insert(invoiceItems).values(
      validItems.map((i) => ({
        invoiceId: inv.id,
        materialId: i.materialId,
        quantity: i.quantity,
        unitPrice: Math.round(i.unitPrice * 100) / 100,
        amount: Math.round(i.quantity * i.unitPrice),
        description: i.description || null,
      }))
    );

    // ثبت تراکنش پرداخت در صورت انتخاب حساب
    if (input.accountId && (input.paidAmount || 0) > 0) {
      await db.insert(transactions).values({
        date: input.date,
        amount: input.paidAmount,
        type: "expense",
        accountId: input.accountId,
        projectId: input.projectId || null,
        categoryId: input.categoryId || null,
        partyId: input.partyId,
        invoiceId: inv.id,
        description: `پرداخت فاکتور${input.invoiceNumber ? " شماره " + input.invoiceNumber : ""}${input.description ? " – " + input.description : ""}`,
      });
    }

    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/** اتصال یک تراکنش موجود به فاکتور */
export async function linkTransactionToInvoice(
  transactionId: string,
  invoiceId: string | null
): Promise<ActionResult> {
  try {
    await db
      .update(transactions)
      .set({ invoiceId: invoiceId || null })
      .where(eq(transactions.id, transactionId));
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/** حذف یک قلم از فاکتور */
export async function deleteInvoiceItem(id: string): Promise<ActionResult> {
  try {
    await db.delete(invoiceItems).where(eq(invoiceItems.id, id));
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

// ---------- مراحل ساخت ----------
export async function addStage(fd: FormData): Promise<ActionResult> {
  try {
    await db.insert(stages).values({
      projectId: String(fd.get("projectId")),
      name: String(fd.get("name") ?? "").trim(),
      weight: num(fd.get("weight")),
      budget: num(fd.get("budget")),
      sort: 99,
    });
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function updateStage(fd: FormData): Promise<ActionResult> {
  try {
    await db
      .update(stages)
      .set({
        name: String(fd.get("name") ?? "").trim(),
        weight: num(fd.get("weight")),
        budget: num(fd.get("budget")),
      })
      .where(eq(stages.id, String(fd.get("id"))));
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteStage(id: string): Promise<ActionResult> {
  try {
    await db.delete(stages).where(eq(stages.id, id));
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

// ---------- پاک‌سازی داده‌ها ----------
/**
 * mode:
 *  - "financial": فقط داده‌های مالی (تراکنش، چک، فاکتور، پرداخت‌ها، صورت‌وضعیت)
 *                 پروژه‌ها، حساب‌ها، دسته‌ها، طرف‌حساب‌ها و مراحل دست‌نخورده می‌مانند
 *  - "all":       همه‌چیز، شروع از صفر مطلق
 */
export async function resetData(mode: "financial" | "all"): Promise<ActionResult> {
  try {
    // ترتیب مهم است (کلیدهای خارجی)
    await db.delete(invoices);
    await db.delete(workerPayments);
    await db.delete(contractorPayments);
    await db.delete(cheques);
    await db.delete(transactions);
    await db.delete(contractorStatements);
    await db.delete(permits);
    await db.delete(units);

    if (mode === "all") {
      await db.delete(stages);
      await db.delete(workers);
      await db.delete(contractors);
      await db.delete(parties);
      await db.delete(categories);
      await db.delete(bankAccounts);
      await db.delete(projects);
    }
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}
