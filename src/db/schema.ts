import {
  pgTable,
  uuid,
  text,
  integer,
  bigint,
  numeric,
  timestamp,
  boolean,
  index,
} from "drizzle-orm/pg-core";

// ---------- پروژه‌ها ----------
export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  keywords: text("keywords"), // کلمات کلیدی برای شناسایی خودکار در پرینت بانک
  location: text("location"),
  status: text("status").notNull().default("active"),
  startDate: text("start_date"),
  landCost: bigint("land_cost", { mode: "number" }).notNull().default(0),
  estimatedCost: bigint("estimated_cost", { mode: "number" }).notNull().default(0),
  estimatedRevenue: bigint("estimated_revenue", { mode: "number" }).notNull().default(0),
  numUnits: integer("num_units").notNull().default(0),
  totalArea: numeric("total_area", { precision: 10, scale: 2 }).$type<number>(),
  progress: integer("progress").notNull().default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ---------- حساب‌های بانکی ----------
export const bankAccounts = pgTable("bank_accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  bankName: text("bank_name"),
  cardNumber: text("card_number"),
  accountNumber: text("account_number"),
  holder: text("holder"),
  isPersonal: boolean("is_personal").notNull().default(false),
  initialBalance: bigint("initial_balance", { mode: "number" }).notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// ---------- دسته‌بندی هزینه/درآمد ----------
export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  kind: text("kind").notNull().default("expense"), // expense | income
  scope: text("scope").notNull().default("project"), // project | personal | both
  stage: text("stage"), // نام مرحله ساخت مرتبط
  keywords: text("keywords"), // کلیدواژه برای دسته‌بندی خودکار
  color: text("color"),
  sort: integer("sort").notNull().default(0),
});

// ---------- مراحل ساخت هر پروژه (با درصد وزنی) ----------
export const stages = pgTable("stages", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  budget: bigint("budget", { mode: "number" }).notNull().default(0), // برآورد مالی مرحله
  weight: integer("weight").notNull().default(0), // درصد وزنی مرحله از کل پروژه
  sort: integer("sort").notNull().default(0),
});

// ---------- طرف حساب‌ها (فروشندگان مصالح، پیمانکاران، خریداران) ----------
export const parties = pgTable("parties", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull().default("supplier"), // supplier | contractor | buyer | worker | other
  keywords: text("keywords"), // نام‌های جایگزین برای تشخیص خودکار در پرینت بانک
  phone: text("phone"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ---------- کالا / مصالح ----------
export const materials = pgTable("materials", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(), // میلگرد ۱۸، سیمان تیپ ۲، بلوک سبک...
  unit: text("unit").notNull().default("عدد"), // کیلوگرم، کیسه، مترمربع، شاخه...
  keywords: text("keywords"), // برای تشخیص خودکار در شرح تراکنش
  categoryId: uuid("category_id").references(() => categories.id, {
    onDelete: "set null",
  }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ---------- فاکتورهای نسیه / تعهدات خرید ----------
export const invoices = pgTable("invoices", {
  id: uuid("id").defaultRandom().primaryKey(),
  partyId: uuid("party_id")
    .notNull()
    .references(() => parties.id, { onDelete: "cascade" }),
  projectId: uuid("project_id").references(() => projects.id, {
    onDelete: "set null",
  }),
  categoryId: uuid("category_id").references(() => categories.id, {
    onDelete: "set null",
  }),
  transactionId: uuid("transaction_id"), // پیوند نرم با تراکنش پرداخت (FK واقعی از سمت transactions است)
  invoiceNumber: text("invoice_number"), // شماره فاکتور فروشنده
  date: text("date").notNull(),
  amount: bigint("amount", { mode: "number" }).notNull(),
  paidAmount: bigint("paid_amount", { mode: "number" }).notNull().default(0),
  status: text("status").notNull().default("unpaid"), // unpaid | partial | paid
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ---------- اقلام فاکتور (قیمت فی واحد هر کالا) ----------
export const invoiceItems = pgTable(
  "invoice_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    invoiceId: uuid("invoice_id")
      .notNull()
      .references(() => invoices.id, { onDelete: "cascade" }),
    materialId: uuid("material_id")
      .notNull()
      .references(() => materials.id, { onDelete: "cascade" }),
    quantity: numeric("quantity", { precision: 14, scale: 3, mode: "number" }).notNull(),
    unitPrice: numeric("unit_price", { precision: 16, scale: 2, mode: "number" }).notNull(), // فی (تومان)
    amount: bigint("amount", { mode: "number" }).notNull(), // مقدار × فی
    description: text("description"),
  },
  (t) => [index("item_material_idx").on(t.materialId)]
);

// ---------- پیمانکاران ----------
export const contractors = pgTable("contractors", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  specialty: text("specialty"),
  phone: text("phone"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const contractorStatements = pgTable("contractor_statements", {
  id: uuid("id").defaultRandom().primaryKey(),
  contractorId: uuid("contractor_id")
    .notNull()
    .references(() => contractors.id, { onDelete: "cascade" }),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  stageId: uuid("stage_id").references(() => stages.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  date: text("date").notNull(),
  amount: bigint("amount", { mode: "number" }).notNull(),
  status: text("status").notNull().default("approved"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const contractorPayments = pgTable("contractor_payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  contractorId: uuid("contractor_id")
    .notNull()
    .references(() => contractors.id, { onDelete: "cascade" }),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  statementId: uuid("statement_id").references(() => contractorStatements.id, {
    onDelete: "set null",
  }),
  date: text("date").notNull(),
  amount: bigint("amount", { mode: "number" }).notNull(),
  description: text("description"),
  transactionId: uuid("transaction_id").references(() => transactions.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").defaultNow(),
});

// ---------- کارگران ----------
export const workers = pgTable("workers", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull().default("daily"),
  dailyRate: bigint("daily_rate", { mode: "number" }).default(0),
  monthlySalary: bigint("monthly_salary", { mode: "number" }).default(0),
  phone: text("phone"),
  active: boolean("active").notNull().default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const workerPayments = pgTable("worker_payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  workerId: uuid("worker_id")
    .notNull()
    .references(() => workers.id, { onDelete: "cascade" }),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  amount: bigint("amount", { mode: "number" }).notNull(),
  days: integer("days"),
  description: text("description"),
  transactionId: uuid("transaction_id").references(() => transactions.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").defaultNow(),
});

// ---------- واحدها ----------
export const units = pgTable("units", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  unitNumber: text("unit_number").notNull(),
  floor: integer("floor"),
  area: numeric("area", { precision: 10, scale: 2 }).$type<number>(),
  price: bigint("price", { mode: "number" }).notNull().default(0),
  soldPrice: bigint("sold_price", { mode: "number" }).notNull().default(0),
  buyerName: text("buyer_name"),
  buyerPhone: text("buyer_phone"),
  status: text("status").notNull().default("available"),
  soldDate: text("sold_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ---------- چک‌ها ----------
export const cheques = pgTable("cheques", {
  id: uuid("id").defaultRandom().primaryKey(),
  chequeNumber: text("cheque_number").notNull(),
  bankName: text("bank_name"),
  drawer: text("drawer"),
  partyId: uuid("party_id").references(() => parties.id, { onDelete: "set null" }),
  projectId: uuid("project_id").references(() => projects.id, {
    onDelete: "set null",
  }),
  unitId: uuid("unit_id").references(() => units.id, { onDelete: "set null" }),
  amount: bigint("amount", { mode: "number" }).notNull(),
  dueDate: text("due_date").notNull(),
  receivedDate: text("received_date"),
  status: text("status").notNull().default("in_hand"),
  // received | in_hand | deposited | cashed | transferred | bounced | returned
  settledDate: text("settled_date"),
  transferTo: text("transfer_to"),
  reminderDays: integer("reminder_days").notNull().default(7),
  notes: text("notes"),
  transactionId: uuid("transaction_id").references(() => transactions.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").defaultNow(),
});

// ---------- مجوزها ----------
export const permits = pgTable("permits", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  status: text("status").notNull().default("in_progress"),
  issueDate: text("issue_date"),
  expiryDate: text("expiry_date"),
  cost: bigint("cost", { mode: "number" }).notNull().default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ---------- تراکنش‌ها ----------
export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    date: text("date").notNull(),
    amount: bigint("amount", { mode: "number" }).notNull(), // تومان، همیشه مثبت
    type: text("type").notNull(), // income | expense | transfer
    accountId: uuid("account_id").references(() => bankAccounts.id, {
      onDelete: "cascade",
    }),
    toAccountId: uuid("to_account_id").references(() => bankAccounts.id, {
      onDelete: "set null",
    }),
    projectId: uuid("project_id").references(() => projects.id, {
      onDelete: "set null",
    }),
    categoryId: uuid("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    partyId: uuid("party_id").references(() => parties.id, {
      onDelete: "set null",
    }),
    contractorId: uuid("contractor_id").references(() => contractors.id, {
      onDelete: "set null",
    }),
    workerId: uuid("worker_id").references(() => workers.id, {
      onDelete: "set null",
    }),
    chequeId: uuid("cheque_id"),
    invoiceId: uuid("invoice_id").references(() => invoices.id, {
      onDelete: "set null",
    }), // اتصال تراکنش به فاکتور
    materialId: uuid("material_id").references(() => materials.id, {
      onDelete: "set null",
    }), // کالای خریداری‌شده
    counterparty: text("counterparty"),
    quantity: numeric("quantity", { precision: 14, scale: 3, mode: "number" }),
    unit: text("unit"), // کیسه، شاخه، تن، مترمربع...
    description: text("description"),
    rawText: text("raw_text"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => [
    index("tx_date_idx").on(t.date),
    index("tx_project_idx").on(t.projectId),
    index("tx_party_idx").on(t.partyId),
  ]
);
