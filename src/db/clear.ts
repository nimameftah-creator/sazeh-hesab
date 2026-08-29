import "dotenv/config";
import { db } from "./index";
import {
  bankAccounts,
  categories,
  cheques,
  contractorPayments,
  contractors,
  contractorStatements,
  invoices,
  parties,
  permits,
  projects,
  stages,
  transactions,
  units,
  workerPayments,
  workers,
} from "./schema";
import { sql } from "drizzle-orm";

/**
 * پاک‌سازی داده‌های نمونه.
 * حالت پیش‌فرض: همه‌چیز جز «دسته‌بندی‌ها» حذف می‌شود،
 * چون دسته‌ها موتور تشخیص خودکار پرینت بانک هستند و ساخت مجدد ۲۵ دسته دستی سخت است.
 * برای حذف کامل (شامل دسته‌ها): npm run --silent  ... -- --all
 */
async function main() {
  const wipeAll = process.argv.includes("--all");
  console.log(wipeAll ? "حذف کامل (شامل دسته‌بندی‌ها)..." : "حذف داده‌های نمونه (دسته‌بندی‌ها حفظ می‌شوند)...");

  await db.delete(invoices);
  await db.delete(workerPayments);
  await db.delete(contractorPayments);
  await db.delete(cheques);
  await db.delete(transactions);
  await db.delete(contractorStatements);
  await db.delete(permits);
  await db.delete(units);
  await db.delete(stages);
  await db.delete(workers);
  await db.delete(contractors);
  await db.delete(parties);
  await db.delete(bankAccounts);
  await db.delete(projects);
  if (wipeAll) await db.delete(categories);

  const [projectsLeft, catsLeft, txsLeft] = await Promise.all([
    db.select({ n: sql<number>`count(*)` }).from(projects),
    db.select({ n: sql<number>`count(*)` }).from(categories),
    db.select({ n: sql<number>`count(*)` }).from(transactions),
  ]);
  console.log("وضعیت پایانی:");
  console.log(`  پروژه: ${projectsLeft[0]?.n}`);
  console.log(`  دسته‌بندی: ${catsLeft[0]?.n}`);
  console.log(`  تراکنش: ${txsLeft[0]?.n}`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
