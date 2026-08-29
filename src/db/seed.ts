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
import { monthsAgoISO, addMonthsISO } from "../lib/jalali";

const uid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

// ===== مراحل ساخت استاندارد با درصد وزنی (جمع وزن‌های ساخت = ۱۰۰) =====
const GOLSHAHR_STAGES: [number, string, number, number][] = [
  // uid, نام مرحله, درصد وزنی, بودجه (تومان)
  [400, "زمین و مجوزها", 0, 4_180_000_000],
  [401, "خاک‌برداری و پی‌کنی", 3, 270_000_000],
  [402, "فونداسیون و بتن‌ریزی", 8, 720_000_000],
  [403, "آرماتوربندی و اسکلت", 18, 1_620_000_000],
  [404, "سقف و تیرچه‌بلوک", 7, 630_000_000],
  [405, "دیوارچینی و تیغه‌چینی", 10, 900_000_000],
  [406, "تأسیسات برقی و مکانیکی", 12, 1_080_000_000],
  [407, "نازک‌کاری و گچ‌کاری", 9, 810_000_000],
  [408, "سنگ‌کاری و سرامیک", 7, 630_000_000],
  [409, "درب و پنجره", 5, 450_000_000],
  [410, "نما (سنگ/کامپوزیت)", 9, 810_000_000],
  [411, "رنگ و نقاشی", 4, 360_000_000],
  [412, "آسانسور", 4, 360_000_000],
  [413, "محوطه و مشاعات", 4, 360_000_000],
];

const MARZDARAN_STAGES: [number, string, number, number][] = [
  [420, "زمین و مجوزها", 0, 6_750_000_000],
  [421, "خاک‌برداری و فونداسیون", 12, 360_000_000],
  [422, "آرماتوربندی و اسکلت", 20, 600_000_000],
  [423, "سقف و دیوارچینی", 18, 540_000_000],
  [424, "تأسیسات برقی و مکانیکی", 14, 420_000_000],
  [425, "نازک‌کاری", 16, 480_000_000],
  [426, "نما و محوطه", 12, 360_000_000],
  [427, "رنگ و تکمیلی", 8, 240_000_000],
];

async function main() {
  console.log("Seeding...");
  await db.delete(invoices);
  await db.delete(transactions);
  await db.delete(contractorPayments);
  await db.delete(workerPayments);
  await db.delete(cheques);
  await db.delete(contractorStatements);
  await db.delete(permits);
  await db.delete(units);
  await db.delete(stages);
  await db.delete(workers);
  await db.delete(contractors);
  await db.delete(parties);
  await db.delete(categories);
  await db.delete(bankAccounts);
  await db.delete(projects);

  // ---------- پروژه‌ها ----------
  const [golshahr, marzdaran] = await db
    .insert(projects)
    .values([
      {
        id: uid(1),
        name: "گلشهر",
        keywords: "گلشهر، گل شهر، پروژه گلشهر",
        location: "کرج، گلشهر",
        status: "active",
        startDate: monthsAgoISO(15),
        landCost: 4_000_000_000,
        estimatedCost: 13_180_000_000,
        estimatedRevenue: 15_900_000_000,
        numUnits: 6,
        totalArea: 1260,
        progress: 62,
        notes: "ساختمان ۶ واحدی، ۳ طبقه روی پیلوت",
      },
      {
        id: uid(2),
        name: "مرزداران",
        keywords: "مرزداران، پروژه مرزداران",
        location: "تهران، مرزداران",
        status: "active",
        startDate: monthsAgoISO(3),
        landCost: 6_500_000_000,
        estimatedCost: 9_500_000_000,
        estimatedRevenue: 12_800_000_000,
        numUnits: 4,
        totalArea: 640,
        progress: 8,
        notes: "در مرحله اخذ جواز و خاک‌برداری",
      },
    ])
    .returning();

  // ---------- حساب‌ها ----------
  const [mainAcct, personalAcct, secondAcct] = await db
    .insert(bankAccounts)
    .values([
      { id: uid(10), name: "کارت اصلی (ملت)", bankName: "بانک ملت", cardNumber: "6104-3388-****-1021", holder: "خودم", isPersonal: false, initialBalance: 85_000_000 },
      { id: uid(11), name: "کارت شخصی (ملی)", bankName: "بانک ملی", cardNumber: "6037-9910-****-5543", holder: "خودم", isPersonal: true, initialBalance: 12_000_000 },
      { id: uid(12), name: "حساب دوم (تجارت)", bankName: "بانک تجارت", accountNumber: "612-1457892-01", holder: "خودم", isPersonal: false, initialBalance: 220_000_000 },
    ])
    .returning();

  // ---------- دسته‌بندی‌ها (با اتصال به مرحله ساخت) ----------
  const catDefs: [number, string, string, string, string, string, string][] = [
    // uid, نام, kind, scope, stage, keywords, color
    [20, "زمین", "expense", "project", "زمین و مجوزها", "زمین، سند، ملک، انتقال سند", "#8b5cf6"],
    [21, "مجوزها و عوارض", "expense", "project", "زمین و مجوزها", "جواز، پروانه، شهرداری، پایان کار، نظام مهندسی، عوارض", "#f59e0b"],
    [22, "طراحی و نظارت", "expense", "project", "زمین و مجوزها", "نقشه، محاسب، طراح، معماری، نظارت", "#0ea5e9"],
    [23, "خاک‌برداری و گودبرداری", "expense", "project", "خاک‌برداری و پی‌کنی", "خاک، گودبرداری، خاکبرداری، بیل مکانیکی، تخلیه", "#a855f7"],
    [24, "بتن و فونداسیون", "expense", "project", "فونداسیون و بتن‌ریزی", "بتن، سیمان، شن، ماسه، فونداسیون، قالب، پمپ بتن", "#f97316"],
    [25, "آرماتوربندی و اسکلت", "expense", "project", "آرماتوربندی و اسکلت", "میلگرد، آرماتور، تیرآهن، آهن، اسکلت، ورق، پروفیل، نبشی", "#ef4444"],
    [26, "سقف و تیرچه‌بلوک", "expense", "project", "سقف و تیرچه‌بلوک", "تیرچه، بلوک، یونولیت، سقف، کرومیت", "#14b8a6"],
    [27, "دیوارچینی و مصالح بنایی", "expense", "project", "دیوارچینی و تیغه‌چینی", "آجر، سفال، هبلکس، بلوک سبک، دیوار، ملات، تیغه", "#84cc16"],
    [28, "تأسیسات برقی و مکانیکی", "expense", "project", "تأسیسات برقی و مکانیکی", "لوله، کابل، کلید، پریز، شوفاژ، پکیج، کولر، موتورخانه، کنتور، تاسیسات", "#06b6d4"],
    [29, "آسانسور", "expense", "project", "آسانسور", "آسانسور، بالابر، کابین", "#6366f1"],
    [30, "نازک‌کاری و گچ‌کاری", "expense", "project", "نازک‌کاری و گچ‌کاری", "گچ، خاک، کناف، سفیدکاری، نازک کاری، زیرسازی", "#ec4899"],
    [31, "سنگ، کاشی و سرامیک", "expense", "project", "سنگ‌کاری و سرامیک", "سرامیک، کاشی، سنگ، پارکت، لمینت، قرنیز، چسب کاشی", "#22c55e"],
    [32, "درب و پنجره", "expense", "project", "درب و پنجره", "درب، پنجره، شیشه، یراق، دوجداره", "#eab308"],
    [33, "نما", "expense", "project", "نما (سنگ/کامپوزیت)", "نما، کامپوزیت، سنگ نما، چوب پلاست، ترموود", "#f43f5e"],
    [34, "رنگ و نقاشی", "expense", "project", "رنگ و نقاشی", "رنگ، نقاشی، بتونه، پرایمر، روغن", "#d946ef"],
    [35, "محوطه و مشاعات", "expense", "project", "محوطه و مشاعات", "محوطه، حیاط، پارکینگ، راه‌پله، مشاعات، حفاظ، درب پارکینگ", "#64748b"],
    [36, "دستمزد کارگر", "expense", "project", "", "دستمزد، کارگر، روزمزد، حقوق، کارگری", "#fb923c"],
    [37, "قرارداد پیمانکار", "expense", "project", "", "پیمانکار، قرارداد، صورت وضعیت، صورتوضعیت", "#10b981"],
    [38, "حمل و نقل", "expense", "project", "", "باربری، کرایه، حمل، خاور، وانت", "#94a3b8"],
    [39, "مالیات و بیمه", "expense", "project", "", "مالیات، بیمه، دارایی، تامین اجتماعی", "#a855f7"],
    [40, "هزینه شخصی", "expense", "personal", "", "شخصی، خونه، خانه، منزل، قسط، پوشاک", "#fb7185"],
    [41, "سایر هزینه‌ها", "expense", "project", "", "", "#94a3b8"],
    [42, "فروش واحد", "income", "project", "", "فروش، واحد، پیش پرداخت، پیش‌پرداخت، قسط واحد", "#10b981"],
    [43, "وام و تسهیلات", "income", "project", "", "وام، تسهیلات، مشارکت", "#3b82f6"],
    [44, "سایر درآمد", "income", "project", "", "", "#22c55e"],
  ];

  await db.insert(categories).values(
    catDefs.map(([id, name, kind, scope, stage, keywords, color], i) => ({
      id: uid(id),
      name,
      kind,
      scope,
      stage: stage || null,
      keywords: keywords || null,
      color,
      sort: i,
    }))
  );
  const catId = (n: number) => uid(n);
  const C = {
    land: catId(20), permit: catId(21), design: catId(22), excavation: catId(23),
    concrete: catId(24), rebar: catId(25), ceiling: catId(26), wall: catId(27),
    facility: catId(28), elevator: catId(29), plaster: catId(30), tile: catId(31),
    door: catId(32), facade: catId(33), paint: catId(34), yard: catId(35),
    labor: catId(36), contract: catId(37), transport: catId(38), tax: catId(39),
    personal: catId(40), other: catId(41), sale: catId(42), loan: catId(43), otherInc: catId(44),
  };

  // ---------- مراحل ساخت ----------
  await db.insert(stages).values(
    GOLSHAHR_STAGES.map(([id, name, weight, budget], i) => ({
      id: uid(id), projectId: golshahr.id, name, weight, budget, sort: i,
    }))
  );
  await db.insert(stages).values(
    MARZDARAN_STAGES.map(([id, name, weight, budget], i) => ({
      id: uid(id), projectId: marzdaran.id, name, weight, budget, sort: i,
    }))
  );
  const S = (n: number) => uid(n);
  const ST = {
    land: S(400), excav: S(401), found: S(402), rebar: S(403), ceiling: S(404),
    wall: S(405), facility: S(406), plaster: S(407), tile: S(408), door: S(409),
    facade: S(410), paint: S(411), elevator: S(412), yard: S(413),
  };

  // ---------- طرف حساب‌ها ----------
  const partyDefs: [number, string, string, string][] = [
    [500, "آهن‌فروشی راد", "supplier", "راد، آهن فروشی راد، آهنفروشی"],
    [501, "مصالح‌فروشی تبریزی", "supplier", "تبریزی، مصالح تبریزی"],
    [502, "بتن آماده البرز", "supplier", "البرز، بتن البرز"],
    [503, "بلوک و آجر کاظمی", "supplier", "کاظمی، آجر کاظمی"],
    [504, "کاشی و سرامیک آرین", "supplier", "آرین، سرامیک آرین"],
    [505, "پنجره‌ساز آریا", "supplier", "آریا، اربابی، پنجره آریا"],
    [506, "لوله و اتصالات سام", "supplier", "سام، اتصالات سام"],
    [507, "سنگ‌فروشی مهیار", "supplier", "مهیار، سنگ مهیار"],
    [508, "رضایی (پیمانکار سفت‌کاری)", "contractor", "رضایی"],
    [509, "کریمی (تأسیسات)", "contractor", "کریمی"],
    [510, "شرکت آسانسور پارس", "contractor", "آسانسور پارس، پارس آسانسور"],
    [511, "محبی (خریدار واحد ۱)", "buyer", "محبی"],
    [512, "صادقی (خریدار واحد ۲)", "buyer", "صادقی"],
    [513, "نعمتی (خریدار واحد ۳)", "buyer", "نعمتی"],
    [514, "توکلی (خریدار واحد ۴)", "buyer", "توکلی"],
  ];
  await db.insert(parties).values(
    partyDefs.map(([id, name, type, keywords]) => ({ id: uid(id), name, type, keywords }))
  );
  const P = {
    rad: uid(500), tabrizi: uid(501), beton: uid(502), kazemi: uid(503),
    aryan: uid(504), aria: uid(505), sam: uid(506), mahyar: uid(507),
    rezaei: uid(508), karimi: uid(509), asansor: uid(510),
    mohebbi: uid(511), sadeghi: uid(512), nemati: uid(513), tavakoli: uid(514),
  };

  // ---------- پیمانکاران ----------
  const [cRezaei, cKarimi, cAsansor] = await db
    .insert(contractors)
    .values([
      { id: uid(50), name: "رضایی (سفت‌کاری)", specialty: "سفت‌کاری", phone: "0912-345-6789" },
      { id: uid(51), name: "کریمی (تأسیسات)", specialty: "تأسیسات", phone: "0919-876-5432" },
      { id: uid(52), name: "شرکت آسانسور پارس", specialty: "آسانسور", phone: "021-8877-6655" },
    ])
    .returning();

  await db.insert(contractorStatements).values([
    { id: uid(60), contractorId: cRezaei.id, projectId: golshahr.id, stageId: ST.excav, title: "صورت‌وضعیت ۱ – خاک‌برداری و فونداسیون", date: monthsAgoISO(11), amount: 900_000_000, status: "paid" },
    { id: uid(61), contractorId: cRezaei.id, projectId: golshahr.id, stageId: ST.rebar, title: "صورت‌وضعیت ۲ – اسکلت و آرماتوربندی", date: monthsAgoISO(8), amount: 1_400_000_000, status: "paid" },
    { id: uid(62), contractorId: cRezaei.id, projectId: golshahr.id, stageId: ST.wall, title: "صورت‌وضعیت ۳ – دیوارچینی", date: monthsAgoISO(2), amount: 1_050_000_000, status: "partially_paid" },
    { id: uid(63), contractorId: cKarimi.id, projectId: golshahr.id, stageId: ST.facility, title: "صورت‌وضعیت ۱ – لوله‌کشی و برق‌کشی", date: monthsAgoISO(4), amount: 480_000_000, status: "paid" },
    { id: uid(64), contractorId: cAsansor.id, projectId: golshahr.id, stageId: ST.elevator, title: "قرارداد آسانسور (علی‌الحساب)", date: monthsAgoISO(1), amount: 650_000_000, status: "approved" },
  ]);

  // ---------- کارگران ----------
  const [wAli, wHossein, wAkbar] = await db
    .insert(workers)
    .values([
      { id: uid(70), name: "علی (بنا)", type: "daily", dailyRate: 900_000 },
      { id: uid(71), name: "حسین (کارگر)", type: "daily", dailyRate: 600_000 },
      { id: uid(72), name: "اکبر (سرکارگر)", type: "monthly", monthlySalary: 28_000_000 },
    ])
    .returning();

  // ---------- واحدها ----------
  await db.insert(units).values([
    { id: uid(80), projectId: golshahr.id, unitNumber: "واحد ۱", floor: 1, area: 210, price: 2_600_000_000, soldPrice: 2_550_000_000, buyerName: "محبی", status: "sold", soldDate: monthsAgoISO(9) },
    { id: uid(81), projectId: golshahr.id, unitNumber: "واحد ۲", floor: 1, area: 210, price: 2_600_000_000, soldPrice: 2_600_000_000, buyerName: "صادقی", status: "sold", soldDate: monthsAgoISO(6) },
    { id: uid(82), projectId: golshahr.id, unitNumber: "واحد ۳", floor: 2, area: 210, price: 2_650_000_000, soldPrice: 2_620_000_000, buyerName: "نعمتی", status: "sold", soldDate: monthsAgoISO(3) },
    { id: uid(83), projectId: golshahr.id, unitNumber: "واحد ۴", floor: 2, area: 210, price: 2_650_000_000, buyerName: "توکلی", status: "reserved" },
    { id: uid(84), projectId: golshahr.id, unitNumber: "واحد ۵", floor: 3, area: 210, price: 2_700_000_000, status: "available" },
    { id: uid(85), projectId: golshahr.id, unitNumber: "واحد ۶", floor: 3, area: 210, price: 2_700_000_000, status: "available" },
  ]);

  // ---------- مجوزها ----------
  await db.insert(permits).values([
    { id: uid(90), projectId: golshahr.id, name: "جواز ساخت", status: "issued", issueDate: monthsAgoISO(14), cost: 180_000_000 },
    { id: uid(91), projectId: golshahr.id, name: "پایان کار", status: "in_progress" },
    { id: uid(92), projectId: golshahr.id, name: "گواهی عدم خلاف", status: "pending" },
    { id: uid(93), projectId: marzdaran.id, name: "جواز ساخت", status: "pending", cost: 250_000_000 },
  ]);

  // ---------- تراکنش‌ها ----------
  const d = (n: number) => monthsAgoISO(n);
  interface Tx {
    id: number; date: string; amount: number; type: "income" | "expense" | "transfer";
    accountId: string; opts?: Record<string, unknown>;
  }
  const T = (id: number, date: string, amount: number, type: "income" | "expense" | "transfer", opts: Record<string, unknown> = {}): Tx => ({
    id, date, amount, type, accountId: mainAcct.id, opts,
  });
  const txDefs: Tx[] = [
    // زمین و مجوزها
    T(100, d(15), 4_000_000_000, "expense", { projectId: golshahr.id, categoryId: C.land, partyId: null, counterparty: "قنبری", description: "گلشهر - خرید زمین" }),
    T(101, d(3), 6_500_000_000, "expense", { projectId: marzdaran.id, categoryId: C.land, counterparty: "شریفی", description: "مرزداران - خرید زمین" }),
    T(102, d(14), 180_000_000, "expense", { projectId: golshahr.id, categoryId: C.permit, counterparty: "شهرداری", description: "گلشهر - عوارض جواز ساخت" }),
    T(103, d(14), 120_000_000, "expense", { projectId: golshahr.id, categoryId: C.design, counterparty: "موسوی", description: "گلشهر - نقشه معماری و محاسبات" }),
    T(104, d(2), 60_000_000, "expense", { projectId: marzdaran.id, categoryId: C.permit, counterparty: "شهرداری", description: "مرزداران - هزینه جواز ساخت" }),
    // خاک‌برداری
    T(105, d(13), 145_000_000, "expense", { projectId: golshahr.id, categoryId: C.excavation, counterparty: "باربری البرز", description: "گلشهر - خاک‌برداری و گودبرداری" }),
    T(106, d(13), 42_000_000, "expense", { projectId: golshahr.id, categoryId: C.transport, counterparty: "خاور دار", description: "گلشهر - تخلیه خاک" }),
    // فونداسیون و بتن
    T(107, d(12), 76_000_000, "expense", { projectId: golshahr.id, categoryId: C.concrete, partyId: P.beton, counterparty: "بتن آماده البرز", description: "گلشهر - بتن فونداسیون ۸۵ مترمکعب", quantity: 85, unit: "مترمکعب" }),
    T(108, d(12), 98_000_000, "expense", { projectId: golshahr.id, categoryId: C.concrete, partyId: P.tabrizi, counterparty: "تبریزی", description: "گلشهر - سیمان و ماسه فونداسیون", quantity: 320, unit: "کیسه" }),
    // آرماتوربندی و اسکلت  ←  مهم‌ترین ردیف برای «چقدر آرماتور خریدیم»
    T(109, d(12), 145_000_000, "expense", { projectId: golshahr.id, categoryId: C.rebar, partyId: P.rad, counterparty: "راد", description: "گلشهر - میلگرد ۱۸ (فونداسیون)", quantity: 2400, unit: "کیلوگرم" }),
    T(110, d(10), 132_000_000, "expense", { projectId: golshahr.id, categoryId: C.rebar, partyId: P.rad, counterparty: "راد", description: "گلشهر - تیرآهن ۱۶ و ورق", quantity: 1800, unit: "کیلوگرم" }),
    T(111, d(7), 88_000_000, "expense", { projectId: golshahr.id, categoryId: C.rebar, partyId: P.rad, counterparty: "راد", description: "گلشهر - میلگرد ۱۴ و ۱۲", quantity: 1450, unit: "کیلوگرم" }),
    T(112, d(4), 47_000_000, "expense", { projectId: golshahr.id, categoryId: C.rebar, partyId: P.rad, counterparty: "راد", description: "گلشهر - آرماتوربندی ستون‌ها", quantity: 780, unit: "کیلوگرم" }),
    // سقف و تیرچه‌بلوک
    T(113, d(9), 64_000_000, "expense", { projectId: golshahr.id, categoryId: C.ceiling, partyId: P.kazemi, counterparty: "کاظمی", description: "گلشهر - بلوک و تیرچه سقف طبقه اول", quantity: 2200, unit: "عدد" }),
    T(114, d(6), 58_000_000, "expense", { projectId: golshahr.id, categoryId: C.ceiling, partyId: P.kazemi, counterparty: "کاظمی", description: "گلشهر - یونولیت و تیرچه طبقه دوم", quantity: 1900, unit: "عدد" }),
    // دیوارچینی
    T(115, d(8), 55_000_000, "expense", { projectId: golshahr.id, categoryId: C.wall, partyId: P.kazemi, counterparty: "کاظمی", description: "گلشهر - آجر و بلوک دیوارچینی", quantity: 6800, unit: "قالب" }),
    T(116, d(5), 72_000_000, "expense", { projectId: golshahr.id, categoryId: C.wall, partyId: P.tabrizi, counterparty: "تبریزی", description: "گلشهر - هبلکس تیغه‌چینی", quantity: 5400, unit: "قالب" }),
    // تاسیسات
    T(117, d(6), 150_000_000, "expense", { projectId: golshahr.id, categoryId: C.facility, partyId: P.sam, counterparty: "سام", description: "گلشهر - لوله و اتصالات آب و فاضلاب" }),
    T(118, d(5), 86_000_000, "expense", { projectId: golshahr.id, categoryId: C.facility, partyId: P.sam, counterparty: "سام", description: "گلشهر - کابل و سیم‌کشی برق" }),
    // نازک‌کاری
    T(119, d(4), 118_000_000, "expense", { projectId: golshahr.id, categoryId: C.plaster, counterparty: "استادکار گچ", description: "گلشهر - گچ و خاک نازک‌کاری" }),
    T(120, d(2), 95_000_000, "expense", { projectId: golshahr.id, categoryId: C.tile, partyId: P.aryan, counterparty: "آرین", description: "گلشهر - سرامیک واحدهای طبقه اول", quantity: 420, unit: "مترمربع" }),
    // درب و پنجره
    T(121, d(3), 72_000_000, "expense", { projectId: golshahr.id, categoryId: C.door, partyId: P.aria, counterparty: "آریا", description: "گلشهر - پنجره دوجداره", quantity: 26, unit: "عدد" }),
    T(122, d(2), 95_000_000, "expense", { projectId: golshahr.id, categoryId: C.door, partyId: P.aria, counterparty: "آریا", description: "گلشهر - درب‌های داخلی و ضدسرقت" }),
    // نما
    T(123, d(3), 22_000_000, "expense", { projectId: golshahr.id, categoryId: C.facade, partyId: P.mahyar, counterparty: "مهیار", description: "گلشهر - سنگ نما (پیش‌پرداخت)", quantity: 45, unit: "مترمربع" }),
    T(124, d(1), 138_000_000, "expense", { projectId: golshahr.id, categoryId: C.facade, partyId: P.mahyar, counterparty: "مهیار", description: "گلشهر - سنگ تراورتن نما", quantity: 260, unit: "مترمربع" }),
    // آسانسور
    T(125, d(1), 210_000_000, "expense", { projectId: golshahr.id, categoryId: C.elevator, partyId: P.asansor, counterparty: "آسانسور پارس", description: "گلشهر - پیش‌پرداخت آسانسور" }),
    // محوطه
    T(126, d(0), 48_000_000, "expense", { projectId: golshahr.id, categoryId: C.yard, counterparty: "پیمانکار محوطه", description: "گلشهر - کف‌سازی پارکینگ" }),
    // پیمانکاران (صورت‌وضعیت)
    T(127, d(11), 900_000_000, "expense", { projectId: golshahr.id, categoryId: C.contract, contractorId: cRezaei.id, partyId: P.rezaei, counterparty: "رضایی", description: "پرداخت صورت‌وضعیت ۱ – خاک‌برداری و فونداسیون" }),
    T(128, d(8), 1_400_000_000, "expense", { projectId: golshahr.id, categoryId: C.contract, contractorId: cRezaei.id, partyId: P.rezaei, counterparty: "رضایی", description: "پرداخت صورت‌وضعیت ۲ – اسکلت" }),
    T(129, d(2), 600_000_000, "expense", { projectId: golshahr.id, categoryId: C.contract, contractorId: cRezaei.id, partyId: P.rezaei, counterparty: "رضایی", description: "علی‌الحساب صورت‌وضعیت ۳ – دیوارچینی" }),
    T(130, d(4), 480_000_000, "expense", { accountId: secondAcct.id, projectId: golshahr.id, categoryId: C.contract, contractorId: cKarimi.id, partyId: P.karimi, counterparty: "کریمی", description: "پرداخت صورت‌وضعیت ۱ – تأسیسات" }),
    // دستمزد کارگران
    T(131, d(12), 27_000_000, "expense", { projectId: golshahr.id, categoryId: C.labor, workerId: wAli.id, counterparty: "علی", description: "دستمزد بنا – ۳۰ روز", quantity: 30, unit: "روز" }),
    T(132, d(12), 18_000_000, "expense", { projectId: golshahr.id, categoryId: C.labor, workerId: wHossein.id, counterparty: "حسین", description: "دستمزد کارگر – ۳۰ روز", quantity: 30, unit: "روز" }),
    T(133, d(11), 28_000_000, "expense", { projectId: golshahr.id, categoryId: C.labor, workerId: wAkbar.id, counterparty: "اکبر", description: "حقوق سرکارگر" }),
    T(134, d(10), 24_000_000, "expense", { projectId: golshahr.id, categoryId: C.labor, workerId: wAkbar.id, counterparty: "اکبر", description: "حقوق سرکارگر" }),
    T(135, d(8), 27_000_000, "expense", { projectId: golshahr.id, categoryId: C.labor, workerId: wAli.id, counterparty: "علی", description: "دستمزد بنا – ۳۰ روز", quantity: 30, unit: "روز" }),
    T(136, d(8), 28_000_000, "expense", { projectId: golshahr.id, categoryId: C.labor, workerId: wAkbar.id, counterparty: "اکبر", description: "حقوق سرکارگر" }),
    T(137, d(7), 18_000_000, "expense", { projectId: golshahr.id, categoryId: C.labor, workerId: wHossein.id, counterparty: "حسین", description: "دستمزد کارگر – ۳۰ روز", quantity: 30, unit: "روز" }),
    T(138, d(6), 25_000_000, "expense", { projectId: golshahr.id, categoryId: C.labor, workerId: wAkbar.id, counterparty: "اکبر", description: "حقوق سرکارگر" }),
    T(139, d(5), 26_000_000, "expense", { projectId: golshahr.id, categoryId: C.labor, workerId: wAli.id, counterparty: "علی", description: "دستمزد بنا – ۲۸ روز", quantity: 28, unit: "روز" }),
    T(140, d(2), 24_000_000, "expense", { projectId: golshahr.id, categoryId: C.labor, workerId: wAkbar.id, counterparty: "اکبر", description: "حقوق سرکارگر" }),
    T(141, d(1), 25_000_000, "expense", { projectId: marzdaran.id, categoryId: C.labor, workerId: wAli.id, counterparty: "علی", description: "مرزداران - دستمزد بنا", quantity: 28, unit: "روز" }),
    // متفرقه
    T(142, d(9), 4_500_000, "expense", { projectId: golshahr.id, categoryId: C.transport, counterparty: "باربری", description: "گلشهر - کرایه حمل مصالح" }),
    T(143, d(6), 35_000_000, "expense", { projectId: golshahr.id, categoryId: C.tax, counterparty: "دارایی", description: "گلشهر - مالیات نقل و انتقال" }),
    // فروش واحدها
    T(144, d(9), 800_000_000, "income", { projectId: golshahr.id, categoryId: C.sale, partyId: P.mohebbi, counterparty: "محبی", description: "پیش‌پرداخت فروش واحد ۱" }),
    T(145, d(6), 700_000_000, "income", { projectId: golshahr.id, categoryId: C.sale, partyId: P.sadeghi, counterparty: "صادقی", description: "پیش‌پرداخت فروش واحد ۲" }),
    T(146, d(5), 1_750_000_000, "income", { accountId: secondAcct.id, projectId: golshahr.id, categoryId: C.sale, partyId: P.mohebbi, counterparty: "محبی", description: "تسویه باقیمانده واحد ۱ (چک)" }),
    T(147, d(3), 1_900_000_000, "income", { projectId: golshahr.id, categoryId: C.sale, partyId: P.sadeghi, counterparty: "صادقی", description: "تسویه باقیمانده واحد ۲" }),
    T(148, d(3), 900_000_000, "income", { projectId: golshahr.id, categoryId: C.sale, partyId: P.nemati, counterparty: "نعمتی", description: "پیش‌پرداخت فروش واحد ۳" }),
    T(149, d(0), 620_000_000, "income", { projectId: golshahr.id, categoryId: C.sale, partyId: P.nemati, counterparty: "نعمتی", description: "قسط اول واحد ۳ (چک نقد شد)" }),
    T(150, d(1), 300_000_000, "income", { projectId: golshahr.id, categoryId: C.loan, counterparty: "بانک مسکن", description: "وام مشارکت مدنی" }),
    // هزینه شخصی
    T(151, d(14), 40_000_000, "expense", { accountId: personalAcct.id, categoryId: C.personal, description: "هزینه خونه - خواربار و قبوض" }),
    T(152, d(12), 35_000_000, "expense", { accountId: personalAcct.id, categoryId: C.personal, description: "هزینه خونه - خرید منزل" }),
    T(153, d(10), 42_000_000, "expense", { accountId: personalAcct.id, categoryId: C.personal, description: "هزینه خونه - مدرسه و خرج روزمره" }),
    T(154, d(8), 38_000_000, "expense", { accountId: personalAcct.id, categoryId: C.personal, description: "هزینه خونه" }),
    T(155, d(6), 45_000_000, "expense", { accountId: personalAcct.id, categoryId: C.personal, description: "هزینه خونه - خرج روزمره" }),
    T(156, d(4), 36_000_000, "expense", { accountId: personalAcct.id, categoryId: C.personal, description: "هزینه خونه" }),
    T(157, d(2), 41_000_000, "expense", { accountId: personalAcct.id, categoryId: C.personal, description: "هزینه خونه - قبض و خرج روزمره" }),
    T(158, d(0), 33_000_000, "expense", { accountId: personalAcct.id, categoryId: C.personal, description: "هزینه خونه" }),
    // انتقال به کارت شخصی
    T(159, d(12), 100_000_000, "transfer", { toAccountId: personalAcct.id, description: "انتقال به کارت شخصی" }),
    T(160, d(10), 120_000_000, "transfer", { toAccountId: personalAcct.id, description: "انتقال به کارت شخصی" }),
    T(161, d(8), 130_000_000, "transfer", { toAccountId: personalAcct.id, description: "انتقال به کارت شخصی" }),
    T(162, d(6), 100_000_000, "transfer", { toAccountId: personalAcct.id, description: "انتقال به کارت شخصی" }),
    T(163, d(4), 110_000_000, "transfer", { toAccountId: personalAcct.id, description: "انتقال به کارت شخصی" }),
    T(164, d(2), 150_000_000, "transfer", { toAccountId: personalAcct.id, description: "انتقال به کارت شخصی" }),
    T(165, d(0), 140_000_000, "transfer", { toAccountId: personalAcct.id, description: "انتقال به کارت شخصی" }),
  ];

  await db.insert(transactions).values(
    txDefs.map((t) => ({
      id: uid(t.id),
      date: t.date,
      amount: t.amount,
      type: t.type,
      accountId: (t.opts?.accountId as string) ?? t.accountId,
      ...t.opts,
    }))
  );

  // ---------- پرداخت‌های پیمانکار ----------
  await db.insert(contractorPayments).values([
    { id: uid(200), contractorId: cRezaei.id, projectId: golshahr.id, statementId: uid(60), date: d(11), amount: 900_000_000, transactionId: uid(127) },
    { id: uid(201), contractorId: cRezaei.id, projectId: golshahr.id, statementId: uid(61), date: d(8), amount: 1_400_000_000, transactionId: uid(128) },
    { id: uid(202), contractorId: cRezaei.id, projectId: golshahr.id, statementId: uid(62), date: d(2), amount: 600_000_000, transactionId: uid(129), description: "علی‌الحساب" },
    { id: uid(203), contractorId: cKarimi.id, projectId: golshahr.id, statementId: uid(63), date: d(4), amount: 480_000_000, transactionId: uid(130) },
  ]);

  // ---------- پرداخت‌های کارگر ----------
  await db.insert(workerPayments).values(
    [
      [200, 131, wAli.id, d(12), 27_000_000, 30],
      [201, 132, wHossein.id, d(12), 18_000_000, 30],
      [202, 133, wAkbar.id, d(11), 28_000_000, 0],
      [203, 134, wAkbar.id, d(10), 24_000_000, 0],
      [204, 135, wAli.id, d(8), 27_000_000, 30],
      [205, 136, wAkbar.id, d(8), 28_000_000, 0],
      [206, 137, wHossein.id, d(7), 18_000_000, 30],
      [207, 138, wAkbar.id, d(6), 25_000_000, 0],
      [208, 139, wAli.id, d(5), 26_000_000, 28],
      [209, 140, wAkbar.id, d(2), 24_000_000, 0],
      [210, 141, wAli.id, d(1), 25_000_000, 28],
    ].map(([pid, txid, workerId, date, amount, days]) => ({
      id: uid(pid as number),
      workerId: workerId as string,
      projectId: txid === 141 ? marzdaran.id : golshahr.id,
      date: date as string,
      amount: amount as number,
      days: days as number,
      transactionId: uid(txid as number),
    }))
  );

  // ---------- فاکتورهای نسیه ----------
  await db.insert(invoices).values([
    { id: uid(500), partyId: P.rad, projectId: golshahr.id, categoryId: C.rebar, date: d(1), amount: 320_000_000, paidAmount: 0, status: "unpaid", description: "میلگرد ۱۶ و ۱۸ – ۴ تن (نسیه ۳۰ روزه)" },
    { id: uid(501), partyId: P.aryan, projectId: golshahr.id, categoryId: C.tile, date: d(1), amount: 95_000_000, paidAmount: 0, status: "unpaid", description: "سرامیک طبقه دوم – نسیه" },
    { id: uid(502), partyId: P.mahyar, projectId: golshahr.id, categoryId: C.facade, date: d(2), amount: 60_000_000, paidAmount: 20_000_000, status: "partial", description: "سنگ نما – پیش‌پرداخت ۲۰ میلیون" },
    { id: uid(503), partyId: P.sam, projectId: golshahr.id, categoryId: C.facility, date: d(0), amount: 45_000_000, paidAmount: 0, status: "unpaid", description: "لوله و اتصالات طبقه دوم" },
  ]);

  // ---------- چک‌ها ----------
  const chq = (id: number, number: string, bank: string, drawer: string, partyId: string | null, projectId: string, unitId: string | null, amount: number, dueOffset: number, recvOffset: number, status: string, extra: Record<string, unknown> = {}) => ({
    id: uid(id), chequeNumber: number, bankName: bank, drawer, partyId, projectId, unitId,
    amount, dueDate: addMonthsISO(monthsAgoISO(0), dueOffset), receivedDate: monthsAgoISO(recvOffset), status, ...extra,
  });

  await db.insert(cheques).values([
    chq(300, "852147-301", "صادرات", "محبی", P.mohebbi, golshahr.id, uid(80), 1_750_000_000, -6, 9, "deposited", { settledDate: monthsAgoISO(-6), transactionId: uid(146), notes: "چک تسویه واحد ۱ - واریز به حساب دوم" }),
    chq(301, "741852-502", "ملت", "نعمتی", P.nemati, golshahr.id, uid(82), 620_000_000, -1, 1, "cashed", { settledDate: monthsAgoISO(-1), transactionId: uid(149), notes: "قسط اول واحد ۳ - پاس شد" }),
    chq(302, "369852-714", "تجارت", "نعمتی", P.nemati, golshahr.id, uid(82), 620_000_000, 0, 0, "in_hand", { notes: "قسط دوم واحد ۳ - سررسید همین ماه", reminderDays: 7 }),
    chq(303, "951753-803", "ملی", "صادقی", P.sadeghi, golshahr.id, uid(81), 250_000_000, 1, 3, "in_hand", { notes: "مابقی واحد ۲", reminderDays: 7 }),
    chq(304, "147258-906", "ملت", "توکلی", P.tavakoli, golshahr.id, uid(83), 400_000_000, 2, 2, "in_hand", { notes: "پیش‌پرداخت واحد ۴ (رزرو)", reminderDays: 10 }),
    chq(305, "753951-204", "کشاورزی", "توکلی", P.tavakoli, golshahr.id, uid(83), 350_000_000, 3, 2, "in_hand", { notes: "قسط دوم واحد ۴", reminderDays: 10 }),
    chq(306, "258369-612", "کشاورزی", "محبی", P.mohebbi, golshahr.id, uid(80), 300_000_000, 0, 4, "transferred", { transferTo: "آهن‌فروشی راد", settledDate: monthsAgoISO(3), notes: "چک واگذارشده بابت خرید میلگرد" }),
    chq(307, "963852-411", "صادرات", "نعمتی", P.nemati, golshahr.id, uid(82), 500_000_000, -2, 5, "bounced", { settledDate: monthsAgoISO(-2), notes: "برگشت خورد - پیگیری حقوقی" }),
  ]);

  console.log("Seeded:", {
    projects: 2,
    stages: GOLSHAHR_STAGES.length + MARZDARAN_STAGES.length,
    accounts: 3,
    categories: catDefs.length,
    parties: partyDefs.length,
    contractors: 3,
    workers: 3,
    units: 6,
    cheques: 8,
    invoices: 4,
    transactions: txDefs.length,
  });
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
