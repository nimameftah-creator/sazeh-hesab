"use client";

import { useState, useTransition } from "react";
import { Field, Btn } from "./ui";
import { Modal } from "./modal";
import { parseAmount } from "@/lib/format";
import { formatJalali, todayISO } from "@/lib/jalali";
import type { ActionResult } from "@/app/actions";

// ---------- نوع‌های داده ساده‌شده برای کلاینت ----------
export interface Opt {
  id: string;
  name: string;
  keywords?: string | null;
  scope?: string;
  kind?: string;
  stage?: string | null;
  [k: string]: unknown;
}
export interface AcctOpt extends Opt {
  bankName: string | null;
  isPersonal: boolean;
  initialBalance: number;
}
export interface ProjectOpt extends Opt {
  keywords: string | null;
  status: string;
  estimatedCost: number;
  estimatedRevenue: number;
  numUnits: number;
  progress: number;
}
export interface StageOpt extends Opt {
  budget: number;
  projectId: string;
}
export interface UnitOpt {
  id: string;
  name?: string;
  unitNumber: string;
  status: string;
  projectId: string;
  price: number;
  buyerName: string | null;
}
export interface ContractorOpt extends Opt {
  specialty: string | null;
}
export interface WorkerOpt extends Opt {
  type: string;
  dailyRate: number;
  monthlySalary: number;
}

// ---------- هوک ارسال فرم ----------
export function useSubmit(fn: (fd: FormData) => Promise<ActionResult>, onSuccess?: () => void) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  function submit(fd: FormData) {
    setError(null);
    setOk(false);
    start(async () => {
      const r = await fn(fd);
      if (r.ok) {
        setOk(true);
        onSuccess?.();
      } else {
        setError(r.error ?? "خطا در ثبت");
      }
    });
  }
  return { pending, error, ok, submit };
}

export function FormFeedback({ error, ok }: { error: string | null; ok: boolean }) {
  if (!error && !ok) return null;
  return (
    <p
      className={`mt-2 rounded-lg px-3 py-2 text-[13px] font-medium ${
        ok ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-600"
      }`}
    >
      {ok ? "✓ با موفقیت ثبت شد" : error}
    </p>
  );
}

/** ورودی تاریخ: پذیرای تاریخ شمسی (۱۴۰۳/۰۵/۱۲) یا میلادی */
export function DateInput({
  name,
  defaultValue,
  required = true,
}: {
  name: string;
  defaultValue?: string | null;
  required?: boolean;
}) {
  return (
    <input
      type="text"
      dir="ltr"
      name={name}
      required={required}
      defaultValue={defaultValue ? formatJalali(defaultValue) : formatJalali(todayISO())}
      placeholder="۱۴۰۳/۰۵/۱۲"
      className="field-input text-right"
    />
  );
}

export function MoneyInput({
  name,
  defaultValue,
  required = true,
  placeholder = "مبلغ به تومان",
}: {
  name: string;
  defaultValue?: number;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      inputMode="numeric"
      name={name}
      required={required}
      defaultValue={defaultValue ? parseAmount(defaultValue).toLocaleString("en-US") : ""}
      placeholder={placeholder}
      className="field-input text-left"
      dir="ltr"
    />
  );
}

export function SelectField({
  name,
  label,
  options,
  defaultValue,
  required = true,
  emptyLabel = "انتخاب کنید...",
  className = "",
}: {
  name: string;
  label?: string;
  options: Opt[];
  defaultValue?: string | null;
  required?: boolean;
  emptyLabel?: string;
  className?: string;
}) {
  const select = (
    <select name={name} defaultValue={defaultValue ?? ""} required={required} className="field-input">
      <option value="" disabled>
        {emptyLabel}
      </option>
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.name}
        </option>
      ))}
    </select>
  );
  if (!label) return select;
  return <Field label={label}>{select}</Field>;
}

// ---------- فرم تراکنش ----------
export function TransactionForm({
  open,
  onClose,
  accounts,
  projects,
  categories,
  contractors,
  workers,
  parties,
  materials,
  invoices,
  action,
}: {
  open: boolean;
  onClose: () => void;
  accounts: AcctOpt[];
  projects: Opt[];
  categories: Opt[];
  contractors: Opt[];
  workers: Opt[];
  parties?: Opt[];
  materials?: Opt[];
  invoices?: Opt[];
  action: (fd: FormData) => Promise<ActionResult>;
}) {
  const [type, setType] = useState("expense");
  const [projectId, setProjectId] = useState("");
  const cats = categories.filter((c) => (type === "income" ? c.kind === "income" : c.kind === "expense"));
  const h = useSubmit(action, onClose);
  return (
    <Modal open={open} onClose={onClose} title="ثبت تراکنش جدید">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          h.submit(new FormData(e.currentTarget));
        }}
        className="space-y-3"
      >
        <div className="grid grid-cols-2 gap-3">
          <Field label="نوع">
            <select name="type" value={type} onChange={(e) => setType(e.target.value)} className="field-input">
              <option value="expense">خرج / هزینه</option>
              <option value="income">دریافت / درآمد</option>
              <option value="transfer">انتقال بین حساب‌های خودم</option>
            </select>
          </Field>
          <Field label="تاریخ (شمسی یا میلادی)">
            <DateInput name="date" />
          </Field>
          <Field label="مبلغ (تومان)">
            <MoneyInput name="amount" />
          </Field>
          <SelectField
            name="accountId"
            label={type === "transfer" ? "از حساب" : "حساب بانکی"}
            options={accounts}
            required={false}
            emptyLabel="— بدون حساب (چک و...) —"
          />
          {type === "transfer" && (
            <SelectField name="toAccountId" label="به حساب" options={accounts} />
          )}
          {type !== "transfer" && (
            <Field label="پروژه">
              <select
                name="projectId"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="field-input"
              >
                <option value="">— هزینه شخصی / بدون پروژه —</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>
          )}
          {type !== "transfer" && (
            <SelectField
              name="categoryId"
              label="دسته‌بندی"
              options={cats}
              required={false}
              emptyLabel="— بدون دسته —"
            />
          )}
          {type === "expense" && (
            <SelectField
              name="contractorId"
              label="پیمانکار (اختیاری)"
              options={contractors}
              required={false}
              emptyLabel="— هیچ‌کدام —"
            />
          )}
          {type === "expense" && (
            <SelectField
              name="workerId"
              label="کارگر (اختیاری)"
              options={workers}
              required={false}
              emptyLabel="— هیچ‌کدام —"
            />
          )}
          {type !== "transfer" && parties && parties.length > 0 && (
            <SelectField
              name="partyId"
              label="طرف حساب (از فهرست)"
              options={parties}
              required={false}
              emptyLabel="— انتخاب نشده —"
            />
          )}
          <Field label="طرف حساب (نام آزاد)" className="col-span-1">
            <input name="counterparty" className="field-input" placeholder="مثلا: رضایی" />
          </Field>
          {type === "expense" && (
            <>
              {materials && materials.length > 0 && (
                <SelectField
                  name="materialId"
                  label="کالا / مصالح"
                  options={materials}
                  required={false}
                  emptyLabel="— انتخاب نشده —"
                />
              )}
              {invoices && invoices.length > 0 && (
                <SelectField
                  name="invoiceId"
                  label="اتصال به فاکتور"
                  options={invoices}
                  required={false}
                  emptyLabel="— بدون فاکتور —"
                />
              )}
              <Field label="مقدار (اختیاری)">
                <input name="quantity" inputMode="decimal" dir="ltr" className="field-input text-left" placeholder="2400" />
              </Field>
              <Field label="واحد (اختیاری)">
                <input name="unit" list="unit-options" className="field-input" placeholder="کیلوگرم" />
                <datalist id="unit-options">
                  <option value="کیلوگرم" />
                  <option value="تن" />
                  <option value="کیسه" />
                  <option value="مترمربع" />
                  <option value="مترمکعب" />
                  <option value="عدد" />
                  <option value="قالب" />
                  <option value="شاخه" />
                  <option value="روز" />
                </datalist>
              </Field>
            </>
          )}
          <Field label="شرح" className="col-span-2">
            <input
              name="description"
              className="field-input"
              required
              placeholder="مثلا: گلشهر - خرید سیمان"
            />
          </Field>
        </div>
        <FormFeedback error={h.error} ok={h.ok} />
        <div className="flex justify-end gap-2 pt-1">
          <Btn tone="ghost" onClick={onClose}>
            انصراف
          </Btn>
          <Btn type="submit" disabled={h.pending}>
            {h.pending ? "در حال ثبت..." : "ثبت تراکنش"}
          </Btn>
        </div>
      </form>
    </Modal>
  );
}

// ---------- فرم پروژه ----------
export function ProjectForm({
  open,
  onClose,
  action,
  defaults,
}: {
  open: boolean;
  onClose: () => void;
  action: (fd: FormData) => Promise<ActionResult>;
  defaults?: Partial<Record<string, string | number | null>>;
}) {
  const h = useSubmit(action, onClose);
  const d = defaults ?? {};
  return (
    <Modal open={open} onClose={onClose} title={d.id ? "ویرایش پروژه" : "پروژه جدید"}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          h.submit(new FormData(e.currentTarget));
        }}
        className="space-y-3"
      >
        {d.id && <input type="hidden" name="id" value={String(d.id)} />}
        <div className="grid grid-cols-2 gap-3">
          <Field label="نام پروژه">
            <input name="name" required defaultValue={String(d.name ?? "")} className="field-input" placeholder="مثلا: گلشهر" />
          </Field>
          <Field label="کلمات کلیدی برای شناسایی در پرینت بانک">
            <input name="keywords" defaultValue={String(d.keywords ?? "")} className="field-input" placeholder="گلشهر، گل شهر" />
          </Field>
          <Field label="موقعیت">
            <input name="location" defaultValue={String(d.location ?? "")} className="field-input" placeholder="کرج، گلشهر" />
          </Field>
          <Field label="وضعیت">
            <select name="status" defaultValue={String(d.status ?? "active")} className="field-input">
              <option value="active">در حال ساخت</option>
              <option value="planned">در مرحله مجوز / برنامه‌ریزی</option>
              <option value="paused">متوقف</option>
              <option value="completed">تمام شده</option>
            </select>
          </Field>
          <Field label="تاریخ شروع">
            <DateInput name="startDate" defaultValue={d.startDate ? String(d.startDate) : null} required={false} />
          </Field>
          <Field label="درصد پیشرفت فیزیکی">
            <input name="progress" inputMode="numeric" defaultValue={String(d.progress ?? 0)} className="field-input text-left" dir="ltr" placeholder="0 تا 100" />
          </Field>
          <Field label="هزینه زمین (تومان)">
            <MoneyInput name="landCost" defaultValue={d.landCost ? Number(d.landCost) : 0} />
          </Field>
          <Field label="برآورد کل هزینه تمام‌شده (تومان)">
            <MoneyInput name="estimatedCost" defaultValue={d.estimatedCost ? Number(d.estimatedCost) : 0} />
          </Field>
          <Field label="برآورد کل درآمد فروش (تومان)">
            <MoneyInput name="estimatedRevenue" defaultValue={d.estimatedRevenue ? Number(d.estimatedRevenue) : 0} />
          </Field>
          <Field label="تعداد واحد">
            <input name="numUnits" inputMode="numeric" defaultValue={String(d.numUnits ?? 0)} className="field-input text-left" dir="ltr" />
          </Field>
          <Field label="زیربنای کل (مترمربع)">
            <input name="totalArea" inputMode="decimal" defaultValue={String(d.totalArea ?? "")} className="field-input text-left" dir="ltr" />
          </Field>
        </div>
        <FormFeedback error={h.error} ok={h.ok} />
        <div className="flex justify-end gap-2 pt-1">
          <Btn tone="ghost" onClick={onClose}>انصراف</Btn>
          <Btn type="submit" disabled={h.pending}>{h.pending ? "در حال ثبت..." : "ذخیره پروژه"}</Btn>
        </div>
      </form>
    </Modal>
  );
}

// ---------- فرم حساب بانکی ----------
export function AccountForm({
  open,
  onClose,
  action,
}: {
  open: boolean;
  onClose: () => void;
  action: (fd: FormData) => Promise<ActionResult>;
}) {
  const h = useSubmit(action, onClose);
  return (
    <Modal open={open} onClose={onClose} title="حساب بانکی جدید">
      <form onSubmit={(e) => { e.preventDefault(); h.submit(new FormData(e.currentTarget)); }} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="نام حساب">
            <input name="name" required className="field-input" placeholder="کارت اصلی (ملت)" />
          </Field>
          <Field label="بانک">
            <input name="bankName" className="field-input" placeholder="ملت" />
          </Field>
          <Field label="شماره کارت">
            <input name="cardNumber" dir="ltr" className="field-input text-left" placeholder="6104-..." />
          </Field>
          <Field label="شماره حساب">
            <input name="accountNumber" dir="ltr" className="field-input text-left" placeholder="..." />
          </Field>
          <Field label="به نام">
            <input name="holder" className="field-input" placeholder="خودم" />
          </Field>
          <Field label="موجودی اولیه (تومان)">
            <MoneyInput name="initialBalance" defaultValue={0} />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" name="isPersonal" className="h-4 w-4 accent-emerald-600" />
          کارت هزینه‌های شخصی / خونه
        </label>
        <FormFeedback error={h.error} ok={h.ok} />
        <div className="flex justify-end gap-2 pt-1">
          <Btn tone="ghost" onClick={onClose}>انصراف</Btn>
          <Btn type="submit" disabled={h.pending}>{h.pending ? "در حال ثبت..." : "ذخیره حساب"}</Btn>
        </div>
      </form>
    </Modal>
  );
}

// ---------- فرم دسته‌بندی ----------
export function CategoryForm({
  open,
  onClose,
  action,
}: {
  open: boolean;
  onClose: () => void;
  action: (fd: FormData) => Promise<ActionResult>;
}) {
  const h = useSubmit(action, onClose);
  return (
    <Modal open={open} onClose={onClose} title="دسته‌بندی جدید">
      <form onSubmit={(e) => { e.preventDefault(); h.submit(new FormData(e.currentTarget)); }} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="نام دسته">
            <input name="name" required className="field-input" placeholder="مصالح (سفت‌کاری)" />
          </Field>
          <Field label="نوع">
            <select name="kind" className="field-input">
              <option value="expense">هزینه</option>
              <option value="income">درآمد</option>
            </select>
          </Field>
          <Field label="محدوده">
            <select name="scope" className="field-input">
              <option value="project">پروژه</option>
              <option value="personal">شخصی</option>
              <option value="both">هر دو</option>
            </select>
          </Field>
          <Field label="مرحله ساخت (اختیاری)">
            <input name="stage" className="field-input" placeholder="اسکلت و سفت‌کاری" />
          </Field>
          <Field label="کلیدواژه‌ها برای تشخیص خودکار (با ویرگول)" className="col-span-2">
            <input name="keywords" className="field-input" placeholder="سیمان، میلگرد، آهن، بتن" />
          </Field>
          <Field label="رنگ">
            <input name="color" type="color" defaultValue="#10b981" className="h-10 w-full rounded-lg border border-slate-300" />
          </Field>
        </div>
        <FormFeedback error={h.error} ok={h.ok} />
        <div className="flex justify-end gap-2 pt-1">
          <Btn tone="ghost" onClick={onClose}>انصراف</Btn>
          <Btn type="submit" disabled={h.pending}>{h.pending ? "در حال ثبت..." : "ذخیره"}</Btn>
        </div>
      </form>
    </Modal>
  );
}

// ---------- فرم پیمانکار ----------
export function ContractorForm({
  open,
  onClose,
  action,
}: {
  open: boolean;
  onClose: () => void;
  action: (fd: FormData) => Promise<ActionResult>;
}) {
  const h = useSubmit(action, onClose);
  return (
    <Modal open={open} onClose={onClose} title="پیمانکار جدید">
      <form onSubmit={(e) => { e.preventDefault(); h.submit(new FormData(e.currentTarget)); }} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="نام">
            <input name="name" required className="field-input" placeholder="رضایی (سفت‌کاری)" />
          </Field>
          <Field label="رشته کاری">
            <input name="specialty" className="field-input" placeholder="سفت‌کاری" />
          </Field>
          <Field label="تلفن" className="col-span-2">
            <input name="phone" dir="ltr" className="field-input text-left" placeholder="0912-..." />
          </Field>
        </div>
        <FormFeedback error={h.error} ok={h.ok} />
        <div className="flex justify-end gap-2 pt-1">
          <Btn tone="ghost" onClick={onClose}>انصراف</Btn>
          <Btn type="submit" disabled={h.pending}>{h.pending ? "در حال ثبت..." : "ذخیره"}</Btn>
        </div>
      </form>
    </Modal>
  );
}

// ---------- فرم صورت‌وضعیت ----------
export function StatementForm({
  open,
  onClose,
  action,
  contractors,
  projects,
  stages,
}: {
  open: boolean;
  onClose: () => void;
  action: (fd: FormData) => Promise<ActionResult>;
  contractors: Opt[];
  projects: Opt[];
  stages: StageOpt[];
}) {
  const [projectId, setProjectId] = useState("");
  const h = useSubmit(action, onClose);
  const projStages = stages.filter((s) => s.projectId === projectId);
  return (
    <Modal open={open} onClose={onClose} title="صورت‌وضعیت جدید">
      <form onSubmit={(e) => { e.preventDefault(); h.submit(new FormData(e.currentTarget)); }} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <SelectField name="contractorId" label="پیمانکار" options={contractors} />
          <Field label="پروژه">
            <select name="projectId" value={projectId} onChange={(e) => setProjectId(e.target.value)} required className="field-input">
              <option value="" disabled>انتخاب کنید...</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          <SelectField name="stageId" label="مرحله ساخت (اختیاری)" options={projStages} required={false} emptyLabel="— بدون مرحله —" />
          <Field label="تاریخ صدور">
            <DateInput name="date" />
          </Field>
          <Field label="عنوان صورت‌وضعیت" className="col-span-2">
            <input name="title" required className="field-input" placeholder="صورت‌وضعیت ۳ – سفت‌کاری" />
          </Field>
          <Field label="مبلغ مصوب (تومان)">
            <MoneyInput name="amount" />
          </Field>
          <Field label="وضعیت">
            <select name="status" className="field-input">
              <option value="approved">مصوب / تایید شده</option>
              <option value="partially_paid">پرداخت جزئی</option>
              <option value="paid">تسویه شده</option>
              <option value="draft">پیش‌نویس</option>
              <option value="rejected">رد شده</option>
            </select>
          </Field>
        </div>
        <FormFeedback error={h.error} ok={h.ok} />
        <div className="flex justify-end gap-2 pt-1">
          <Btn tone="ghost" onClick={onClose}>انصراف</Btn>
          <Btn type="submit" disabled={h.pending}>{h.pending ? "در حال ثبت..." : "ثبت صورت‌وضعیت"}</Btn>
        </div>
      </form>
    </Modal>
  );
}

// ---------- فرم پرداخت به پیمانکار ----------
export function ContractorPaymentForm({
  open,
  onClose,
  action,
  contractors,
  projects,
  accounts,
  categories,
  statements,
  defaultContractor,
}: {
  open: boolean;
  onClose: () => void;
  action: (fd: FormData) => Promise<ActionResult>;
  contractors: Opt[];
  projects: Opt[];
  accounts: Opt[];
  categories: Opt[];
  statements: Opt[];
  defaultContractor?: string | null;
}) {
  const [createTx, setCreateTx] = useState(true);
  const h = useSubmit(action, onClose);
  const expCats = categories.filter((c) => c.kind === "expense");
  return (
    <Modal open={open} onClose={onClose} title="پرداخت به پیمانکار">
      <form onSubmit={(e) => { e.preventDefault(); h.submit(new FormData(e.currentTarget)); }} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <SelectField name="contractorId" label="پیمانکار" options={contractors} defaultValue={defaultContractor} />
          <SelectField name="projectId" label="پروژه" options={projects} />
          <SelectField name="statementId" label="بابت صورت‌وضعیت (اختیاری)" options={statements} required={false} emptyLabel="— علی‌الحساب —" />
          <Field label="تاریخ پرداخت">
            <DateInput name="date" />
          </Field>
          <Field label="مبلغ (تومان)">
            <MoneyInput name="amount" />
          </Field>
          <Field label="شرح">
            <input name="description" className="field-input" placeholder="علی‌الحساب صورت‌وضعیت ۳" />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" name="createTx" checked={createTx} onChange={(e) => setCreateTx(e.target.checked)} className="h-4 w-4 accent-emerald-600" />
          ثبت خودکار تراکنش بانکی
        </label>
        {createTx && (
          <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3">
            <SelectField name="accountId" label="از حساب" options={accounts} />
            <SelectField name="categoryId" label="دسته هزینه" options={expCats} required={false} emptyLabel="— خودکار (قرارداد پیمانکار) —" />
          </div>
        )}
        <FormFeedback error={h.error} ok={h.ok} />
        <div className="flex justify-end gap-2 pt-1">
          <Btn tone="ghost" onClick={onClose}>انصراف</Btn>
          <Btn type="submit" disabled={h.pending}>{h.pending ? "در حال ثبت..." : "ثبت پرداخت"}</Btn>
        </div>
      </form>
    </Modal>
  );
}

// ---------- فرم کارگر ----------
export function WorkerForm({
  open,
  onClose,
  action,
}: {
  open: boolean;
  onClose: () => void;
  action: (fd: FormData) => Promise<ActionResult>;
}) {
  const [type, setType] = useState("daily");
  const h = useSubmit(action, onClose);
  return (
    <Modal open={open} onClose={onClose} title="کارگر جدید">
      <form onSubmit={(e) => { e.preventDefault(); h.submit(new FormData(e.currentTarget)); }} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="نام">
            <input name="name" required className="field-input" placeholder="علی (بنا)" />
          </Field>
          <Field label="نوع">
            <select name="type" value={type} onChange={(e) => setType(e.target.value)} className="field-input">
              <option value="daily">روزمزد</option>
              <option value="monthly">ماهانه</option>
            </select>
          </Field>
          {type === "daily" ? (
            <Field label="دستمزد روزانه (تومان)">
              <MoneyInput name="dailyRate" defaultValue={0} />
            </Field>
          ) : (
            <Field label="حقوق ماهانه (تومان)">
              <MoneyInput name="monthlySalary" defaultValue={0} />
            </Field>
          )}
          <Field label="تلفن">
            <input name="phone" dir="ltr" className="field-input text-left" placeholder="0912-..." />
          </Field>
        </div>
        <FormFeedback error={h.error} ok={h.ok} />
        <div className="flex justify-end gap-2 pt-1">
          <Btn tone="ghost" onClick={onClose}>انصراف</Btn>
          <Btn type="submit" disabled={h.pending}>{h.pending ? "در حال ثبت..." : "ذخیره"}</Btn>
        </div>
      </form>
    </Modal>
  );
}

// ---------- فرم پرداخت کارگر ----------
export function WorkerPaymentForm({
  open,
  onClose,
  action,
  workers,
  projects,
  accounts,
  categories,
}: {
  open: boolean;
  onClose: () => void;
  action: (fd: FormData) => Promise<ActionResult>;
  workers: Opt[];
  projects: Opt[];
  accounts: Opt[];
  categories: Opt[];
}) {
  const [createTx, setCreateTx] = useState(true);
  const h = useSubmit(action, onClose);
  const expCats = categories.filter((c) => c.kind === "expense");
  return (
    <Modal open={open} onClose={onClose} title="ثبت پرداخت کارگر">
      <form onSubmit={(e) => { e.preventDefault(); h.submit(new FormData(e.currentTarget)); }} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <SelectField name="workerId" label="کارگر" options={workers} />
          <SelectField name="projectId" label="پروژه" options={projects} />
          <Field label="تاریخ پرداخت">
            <DateInput name="date" />
          </Field>
          <Field label="تعداد روز (برای روزمزد)">
            <input name="days" inputMode="numeric" className="field-input text-left" dir="ltr" placeholder="30" />
          </Field>
          <Field label="مبلغ (تومان)">
            <MoneyInput name="amount" />
          </Field>
          <Field label="شرح">
            <input name="description" className="field-input" placeholder="دستمزد بنا – ۳۰ روز" />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" name="createTx" checked={createTx} onChange={(e) => setCreateTx(e.target.checked)} className="h-4 w-4 accent-emerald-600" />
          ثبت خودکار تراکنش بانکی
        </label>
        {createTx && (
          <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3">
            <SelectField name="accountId" label="از حساب" options={accounts} />
            <SelectField name="categoryId" label="دسته هزینه" options={expCats} required={false} emptyLabel="— خودکار (دستمزد کارگر) —" />
          </div>
        )}
        <FormFeedback error={h.error} ok={h.ok} />
        <div className="flex justify-end gap-2 pt-1">
          <Btn tone="ghost" onClick={onClose}>انصراف</Btn>
          <Btn type="submit" disabled={h.pending}>{h.pending ? "در حال ثبت..." : "ثبت پرداخت"}</Btn>
        </div>
      </form>
    </Modal>
  );
}

// ---------- فرم واحد ----------
export function UnitForm({
  open,
  onClose,
  action,
  projects,
}: {
  open: boolean;
  onClose: () => void;
  action: (fd: FormData) => Promise<ActionResult>;
  projects: Opt[];
}) {
  const h = useSubmit(action, onClose);
  return (
    <Modal open={open} onClose={onClose} title="واحد جدید">
      <form onSubmit={(e) => { e.preventDefault(); h.submit(new FormData(e.currentTarget)); }} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <SelectField name="projectId" label="پروژه" options={projects} />
          <Field label="شماره واحد">
            <input name="unitNumber" required className="field-input" placeholder="واحد ۷" />
          </Field>
          <Field label="طبقه">
            <input name="floor" inputMode="numeric" className="field-input text-left" dir="ltr" placeholder="3" />
          </Field>
          <Field label="متراژ">
            <input name="area" inputMode="decimal" className="field-input text-left" dir="ltr" placeholder="210" />
          </Field>
          <Field label="قیمت پایه (تومان)">
            <MoneyInput name="price" defaultValue={0} />
          </Field>
          <Field label="وضعیت">
            <select name="status" className="field-input">
              <option value="available">آزاد</option>
              <option value="reserved">رزرو شده</option>
              <option value="sold">فروخته شده</option>
            </select>
          </Field>
        </div>
        <FormFeedback error={h.error} ok={h.ok} />
        <div className="flex justify-end gap-2 pt-1">
          <Btn tone="ghost" onClick={onClose}>انصراف</Btn>
          <Btn type="submit" disabled={h.pending}>{h.pending ? "در حال ثبت..." : "ذخیره"}</Btn>
        </div>
      </form>
    </Modal>
  );
}

// ---------- فرم ویرایش/فروش واحد ----------
export function UnitEditForm({
  open,
  onClose,
  action,
  projects,
  accounts,
  unit,
}: {
  open: boolean;
  onClose: () => void;
  action: (fd: FormData) => Promise<ActionResult>;
  projects: Opt[];
  accounts: Opt[];
  unit: UnitOpt & { floor: number | null; area: number | null; soldPrice: number; buyerPhone: string | null; soldDate: string | null };
}) {
  const [createTx, setCreateTx] = useState(false);
  const [status, setStatus] = useState(unit.status);
  const h = useSubmit(action, onClose);
  return (
    <Modal open={open} onClose={onClose} title={`ویرایش ${unit.unitNumber}`}>
      <form onSubmit={(e) => { e.preventDefault(); h.submit(new FormData(e.currentTarget)); }} className="space-y-3">
        <input type="hidden" name="id" value={unit.id} />
        <input type="hidden" name="projectId" value={unit.projectId} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="شماره واحد">
            <input name="unitNumber" required defaultValue={unit.unitNumber} className="field-input" />
          </Field>
          <Field label="طبقه">
            <input name="floor" inputMode="numeric" defaultValue={String(unit.floor ?? "")} className="field-input text-left" dir="ltr" />
          </Field>
          <Field label="متراژ">
            <input name="area" inputMode="decimal" defaultValue={String(unit.area ?? "")} className="field-input text-left" dir="ltr" />
          </Field>
          <Field label="وضعیت">
            <select name="status" value={status} onChange={(e) => setStatus(e.target.value)} className="field-input">
              <option value="available">آزاد</option>
              <option value="reserved">رزرو شده</option>
              <option value="sold">فروخته شده</option>
            </select>
          </Field>
          <Field label="قیمت پایه (تومان)">
            <MoneyInput name="price" defaultValue={unit.price} />
          </Field>
          <Field label="قیمت فروش (تومان)">
            <MoneyInput name="soldPrice" defaultValue={unit.soldPrice} />
          </Field>
          <Field label="نام خریدار">
            <input name="buyerName" defaultValue={unit.buyerName ?? ""} className="field-input" placeholder="آقای محبی" />
          </Field>
          <Field label="تلفن خریدار">
            <input name="buyerPhone" dir="ltr" defaultValue={unit.buyerPhone ?? ""} className="field-input text-left" placeholder="0912-..." />
          </Field>
          {status === "sold" && (
            <Field label="تاریخ فروش">
              <DateInput name="soldDate" defaultValue={unit.soldDate} required={false} />
            </Field>
          )}
        </div>
        {status === "sold" && (
          <div className="rounded-xl bg-slate-50 p-3">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" name="createIncomeTx" checked={createTx} onChange={(e) => setCreateTx(e.target.checked)} className="h-4 w-4 accent-emerald-600" />
              ثبت درآمد دریافتی همزمان (تراکنش بانکی)
            </label>
            {createTx && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <SelectField name="accountId" label="واریز به حساب" options={accounts} />
                <Field label="مبلغ دریافتی (تومان)">
                  <MoneyInput name="paidAmount" defaultValue={unit.soldPrice} />
                </Field>
              </div>
            )}
          </div>
        )}
        <FormFeedback error={h.error} ok={h.ok} />
        <div className="flex justify-end gap-2 pt-1">
          <Btn tone="ghost" onClick={onClose}>انصراف</Btn>
          <Btn type="submit" disabled={h.pending}>{h.pending ? "در حال ثبت..." : "ذخیره"}</Btn>
        </div>
      </form>
    </Modal>
  );
}

// ---------- فرم مجوز ----------
export function PermitForm({
  open,
  onClose,
  action,
  projects,
}: {
  open: boolean;
  onClose: () => void;
  action: (fd: FormData) => Promise<ActionResult>;
  projects: Opt[];
}) {
  const h = useSubmit(action, onClose);
  return (
    <Modal open={open} onClose={onClose} title="مجوز جدید">
      <form onSubmit={(e) => { e.preventDefault(); h.submit(new FormData(e.currentTarget)); }} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <SelectField name="projectId" label="پروژه" options={projects} />
          <Field label="نام مجوز">
            <input name="name" required className="field-input" placeholder="جواز ساخت" />
          </Field>
          <Field label="وضعیت">
            <select name="status" className="field-input">
              <option value="in_progress">در حال پیگیری</option>
              <option value="pending">در انتظار صدور</option>
              <option value="issued">صادر شده</option>
              <option value="rejected">رد شده</option>
            </select>
          </Field>
          <Field label="هزینه (تومان)">
            <MoneyInput name="cost" defaultValue={0} />
          </Field>
          <Field label="تاریخ صدور">
            <DateInput name="issueDate" required={false} />
          </Field>
          <Field label="تاریخ اعتبار">
            <DateInput name="expiryDate" required={false} />
          </Field>
        </div>
        <FormFeedback error={h.error} ok={h.ok} />
        <div className="flex justify-end gap-2 pt-1">
          <Btn tone="ghost" onClick={onClose}>انصراف</Btn>
          <Btn type="submit" disabled={h.pending}>{h.pending ? "در حال ثبت..." : "ذخیره"}</Btn>
        </div>
      </form>
    </Modal>
  );
}

// ---------- فرم چک ----------
export function ChequeForm({
  open,
  onClose,
  action,
  projects,
  units,
}: {
  open: boolean;
  onClose: () => void;
  action: (fd: FormData) => Promise<ActionResult>;
  projects: Opt[];
  units: UnitOpt[];
}) {
  const [projectId, setProjectId] = useState("");
  const h = useSubmit(action, onClose);
  const projUnits = units.filter((u) => u.projectId === projectId);
  return (
    <Modal open={open} onClose={onClose} title="ثبت چک دریافتی">
      <form onSubmit={(e) => { e.preventDefault(); h.submit(new FormData(e.currentTarget)); }} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="شماره چک">
            <input name="chequeNumber" dir="ltr" required className="field-input text-left" placeholder="852147-301" />
          </Field>
          <Field label="بانک صادرکننده">
            <input name="bankName" className="field-input" placeholder="صادرات" />
          </Field>
          <Field label="صادرکننده / خریدار">
            <input name="drawer" className="field-input" placeholder="محبی" />
          </Field>
          <Field label="پروژه">
            <select name="projectId" value={projectId} onChange={(e) => setProjectId(e.target.value)} className="field-input">
              <option value="">— بدون پروژه —</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          <Field label="بابت واحد (اختیاری)">
            <select name="unitId" className="field-input">
              <option value="">— انتخاب نشده —</option>
              {projUnits.map((u) => <option key={u.id} value={u.id}>{u.unitNumber} – {u.buyerName ?? "بدون خریدار"}</option>)}
            </select>
          </Field>
          <Field label="مبلغ (تومان)">
            <MoneyInput name="amount" />
          </Field>
          <Field label="تاریخ دریافت">
            <DateInput name="receivedDate" />
          </Field>
          <Field label="سررسید">
            <DateInput name="dueDate" />
          </Field>
          <Field label="توضیحات" className="col-span-2">
            <input name="notes" className="field-input" placeholder="قسط دوم واحد ۳" />
          </Field>
        </div>
        <FormFeedback error={h.error} ok={h.ok} />
        <div className="flex justify-end gap-2 pt-1">
          <Btn tone="ghost" onClick={onClose}>انصراف</Btn>
          <Btn type="submit" disabled={h.pending}>{h.pending ? "در حال ثبت..." : "ثبت چک"}</Btn>
        </div>
      </form>
    </Modal>
  );
}

// ---------- اکشن چک (نقد کردن، واگذاری و...) ----------
export function ChequeActionButton({
  action,
  chequeId,
  label,
  actionType,
  tone = "primary",
  accounts = [],
}: {
  action: (id: string, a: "deposited" | "cashed" | "transferred" | "bounced" | "returned" | "in_hand", extra?: { transferTo?: string; accountId?: string; categoryId?: string }) => Promise<ActionResult>;
  chequeId: string;
  label: string;
  actionType: "deposited" | "cashed" | "transferred" | "bounced" | "returned";
  tone?: "primary" | "ghost" | "danger" | "subtle";
  accounts?: Opt[];
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [accountId, setAccountId] = useState("");
  const [transferTo, setTransferTo] = useState("");

  const needsAccount = actionType === "deposited" || actionType === "cashed";
  const isTransfer = actionType === "transferred";

  function run() {
    setError(null);
    start(async () => {
      const r = await action(chequeId, actionType, {
        accountId: accountId || undefined,
        transferTo: transferTo || undefined,
      });
      if (!r.ok) setError(r.error ?? "خطا");
      else setOpen(false);
    });
  }

  return (
    <>
      <Btn tone={tone} size="sm" onClick={() => setOpen(true)}>
        {label}
      </Btn>
      <Modal open={open} onClose={() => setOpen(false)} title={label}>
        <div className="space-y-3">
          {needsAccount && (
            <Field label="حساب بانکی (برای ثبت تراکنش خودکار)">
              <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className="field-input">
                <option value="">— بدون تراکنش بانکی —</option>
                {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </Field>
          )}
          {isTransfer && (
            <Field label="چک به چه کسی واگذار می‌شود؟">
              <input value={transferTo} onChange={(e) => setTransferTo(e.target.value)} className="field-input" placeholder="آهنی‌فروشی راد" />
            </Field>
          )}
          <p className="rounded-xl bg-slate-50 px-3 py-2 text-[13px] leading-5 text-slate-500">
            {isTransfer
              ? "با تایید، یک «هزینه» به نام طرف مقابل ثبت می‌شود (چک به‌عنوان پرداخت)."
              : needsAccount
                ? "با تایید، یک «درآمد» در حساب انتخابی ثبت می‌شود."
                : "وضعیت چک بدون ثبت تراکنش تغییر می‌کند."}
          </p>
          {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-[13px] text-rose-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <Btn tone="ghost" onClick={() => setOpen(false)}>انصراف</Btn>
            <Btn onClick={run} disabled={pending}>{pending ? "در حال انجام..." : "تایید"}</Btn>
          </div>
        </div>
      </Modal>
    </>
  );
}

// ---------- فرم مرحله ساخت (با درصد وزنی) ----------
export function StageForm({
  open,
  onClose,
  action,
  stage,
  defaults,
}: {
  open: boolean;
  onClose: () => void;
  action: (fd: FormData) => Promise<ActionResult>;
  stage?: StageOpt | null;
  defaults?: Record<string, string | number | null>;
}) {
  const d = stage ?? defaults ?? {};
  const h = useSubmit(action, onClose);
  if (!d) return null;
  return (
    <Modal open={open} onClose={onClose} title={stage ? `ویرایش مرحله «${stage.name}»` : "مرحله ساخت جدید"}>
      <form onSubmit={(e) => { e.preventDefault(); h.submit(new FormData(e.currentTarget)); }} className="space-y-3">
        {stage && <input type="hidden" name="id" value={stage.id} />}
        {"projectId" in d && d.projectId ? <input type="hidden" name="projectId" value={String(d.projectId)} /> : null}
        <Field label="نام مرحله">
          <input name="name" defaultValue={String(d.name ?? "")} required className="field-input" placeholder="مثلا: آرماتوربندی و اسکلت" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="درصد وزنی مرحله از کل ساخت">
            <input
              name="weight"
              inputMode="numeric"
              defaultValue={String((d as Record<string, unknown>).weight ?? 0)}
              className="field-input text-left"
              dir="ltr"
              placeholder="مثلا 18"
            />
          </Field>
          <Field label="برآورد مالی (تومان)">
            <MoneyInput name="budget" defaultValue={Number(d.budget ?? 0)} />
          </Field>
        </div>
        <p className="rounded-xl bg-slate-100 px-3 py-2 text-[12.5px] leading-5 text-slate-400">
          درصد وزنی برای مقایسه «سهم برنامه‌ای» هر مرحله با «سهم واقعی هزینه» استفاده می‌شود —
          یعنی اگر مرحله اسکلت ۱۸٪ وزن دارد ولی ۳۰٪ هزینه کرده، داشبورد به شما هشدار می‌دهد.
        </p>
        <FormFeedback error={h.error} ok={h.ok} />
        <div className="flex justify-end gap-2 pt-1">
          <Btn tone="ghost" onClick={onClose}>انصراف</Btn>
          <Btn type="submit" disabled={h.pending}>{h.pending ? "در حال ثبت..." : "ذخیره"}</Btn>
        </div>
      </form>
    </Modal>
  );
}

// ---------- فرم کالا / مصالح ----------
export function MaterialForm({
  open,
  onClose,
  action,
  categories,
}: {
  open: boolean;
  onClose: () => void;
  action: (fd: FormData) => Promise<ActionResult>;
  categories: Opt[];
}) {
  const h = useSubmit(action, onClose);
  return (
    <Modal open={open} onClose={onClose} title="کالای جدید">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          h.submit(new FormData(e.currentTarget));
        }}
        className="space-y-3"
      >
        <div className="grid grid-cols-2 gap-3">
          <Field label="نام کالا" className="col-span-2">
            <input
              name="name"
              required
              className="field-input"
              placeholder="میلگرد ۱۸ / سیمان تیپ ۲ / بلوک سبک ۱۵"
            />
          </Field>
          <Field label="واحد اندازه‌گیری">
            <input name="unit" list="material-units" className="field-input" placeholder="کیلوگرم" />
            <datalist id="material-units">
              <option value="کیلوگرم" />
              <option value="تن" />
              <option value="کیسه" />
              <option value="مترمربع" />
              <option value="مترمکعب" />
              <option value="عدد" />
              <option value="قالب" />
              <option value="شاخه" />
              <option value="بشکه" />
              <option value="رول" />
              <option value="متر" />
            </datalist>
          </Field>
          <SelectField
            name="categoryId"
            label="دسته هزینه"
            options={categories}
            required={false}
            emptyLabel="— بدون دسته —"
          />
          <Field label="نام‌های جایگزین (برای تشخیص خودکار)" className="col-span-2">
            <input name="keywords" className="field-input" placeholder="میلگرد ۱۸، آرماتور ۱۸" />
          </Field>
        </div>
        <p className="rounded-xl bg-slate-100 px-3 py-2 text-[12.5px] leading-6 text-slate-400">
          واحد را درست انتخاب کن چون «قیمت فی» بر اساس آن محاسبه و در نمودار نمایش داده می‌شود
          (مثلاً تومان بر کیلوگرم).
        </p>
        <FormFeedback error={h.error} ok={h.ok} />
        <div className="flex justify-end gap-2 pt-1">
          <Btn tone="ghost" onClick={onClose}>
            انصراف
          </Btn>
          <Btn type="submit" disabled={h.pending}>
            {h.pending ? "در حال ثبت..." : "ذخیره کالا"}
          </Btn>
        </div>
      </form>
    </Modal>
  );
}

// ---------- فرم طرف حساب ----------
export function PartyForm({
  open,
  onClose,
  action,
}: {
  open: boolean;
  onClose: () => void;
  action: (fd: FormData) => Promise<ActionResult>;
}) {
  const h = useSubmit(action, onClose);
  return (
    <Modal open={open} onClose={onClose} title="طرف حساب جدید">
      <form onSubmit={(e) => { e.preventDefault(); h.submit(new FormData(e.currentTarget)); }} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="نام">
            <input name="name" required className="field-input" placeholder="آهن‌فروشی راد" />
          </Field>
          <Field label="نوع">
            <select name="type" className="field-input">
              <option value="supplier">فروشنده مصالح</option>
              <option value="contractor">پیمانکار</option>
              <option value="buyer">خریدار واحد</option>
              <option value="worker">کارگر</option>
              <option value="other">سایر</option>
            </select>
          </Field>
          <Field label="نام‌های جایگزین (برای تشخیص خودکار در پرینت بانک)">
            <input name="keywords" className="field-input" placeholder="راد، آهن فروشی راد" />
          </Field>
          <Field label="تلفن">
            <input name="phone" dir="ltr" className="field-input text-left" placeholder="0912-..." />
          </Field>
        </div>
        <p className="rounded-xl bg-slate-100 px-3 py-2 text-[12.5px] leading-5 text-slate-400">
          اگر در شرح تراکنش نام یا نام جایگزین این شخص باشد، سیستم خودکار تراکنش را به او نسبت می‌دهد.
        </p>
        <FormFeedback error={h.error} ok={h.ok} />
        <div className="flex justify-end gap-2 pt-1">
          <Btn tone="ghost" onClick={onClose}>انصراف</Btn>
          <Btn type="submit" disabled={h.pending}>{h.pending ? "در حال ثبت..." : "ذخیره"}</Btn>
        </div>
      </form>
    </Modal>
  );
}

// ---------- فرم فاکتور نسیه ----------
export function InvoiceForm({
  open,
  onClose,
  action,
  parties,
  projects,
  categories,
  defaultParty,
}: {
  open: boolean;
  onClose: () => void;
  action: (fd: FormData) => Promise<ActionResult>;
  parties: Opt[];
  projects: Opt[];
  categories: Opt[];
  defaultParty?: string | null;
}) {
  const h = useSubmit(action, onClose);
  const expCats = categories.filter((c) => c.kind === "expense");
  return (
    <Modal open={open} onClose={onClose} title="ثبت فاکتور نسیه (خرید مدت‌دار)">
      <form onSubmit={(e) => { e.preventDefault(); h.submit(new FormData(e.currentTarget)); }} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <SelectField name="partyId" label="از چه کسی خرید کردید؟" options={parties} defaultValue={defaultParty ?? undefined} />
          <SelectField name="projectId" label="پروژه" options={projects} />
          <SelectField name="categoryId" label="دسته هزینه" options={expCats} required={false} emptyLabel="— بدون دسته —" />
          <Field label="تاریخ فاکتور">
            <DateInput name="date" />
          </Field>
          <Field label="مبلغ فاکتور (تومان)">
            <MoneyInput name="amount" />
          </Field>
          <Field label="پرداختی اولیه (تومان)">
            <MoneyInput name="paidAmount" defaultValue={0} />
          </Field>
          <Field label="شرح کالا" className="col-span-2">
            <input name="description" className="field-input" placeholder="میلگرد ۱۶ و ۱۸ – ۴ تن (نسیه ۳۰ روزه)" />
          </Field>
        </div>
        <p className="rounded-xl bg-slate-100 px-3 py-2 text-[12.5px] leading-5 text-slate-400">
          با ثبت فاکتور نسیه، مبلغ مانده به‌عنوان «بدهی شما» در حساب آن شخص نمایش داده می‌شود.
          بعدا با «پرداخت فاکتور» بدهی تسویه می‌شود.
        </p>
        <FormFeedback error={h.error} ok={h.ok} />
        <div className="flex justify-end gap-2 pt-1">
          <Btn tone="ghost" onClick={onClose}>انصراف</Btn>
          <Btn type="submit" disabled={h.pending}>{h.pending ? "در حال ثبت..." : "ثبت فاکتور"}</Btn>
        </div>
      </form>
    </Modal>
  );
}

// ---------- فرم پرداخت فاکتور ----------
export function PayInvoiceForm({
  open,
  onClose,
  action,
  invoiceId,
  remaining,
  accounts,
}: {
  open: boolean;
  onClose: () => void;
  action: (fd: FormData) => Promise<ActionResult>;
  invoiceId: string;
  remaining: number;
  accounts: Opt[];
}) {
  const [createTx, setCreateTx] = useState(true);
  const h = useSubmit(action, onClose);
  return (
    <Modal open={open} onClose={onClose} title="پرداخت بدهی فاکتور">
      <form onSubmit={(e) => { e.preventDefault(); h.submit(new FormData(e.currentTarget)); }} className="space-y-3">
        <input type="hidden" name="id" value={invoiceId} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="مبلغ پرداخت (تومان)">
            <MoneyInput name="amount" defaultValue={remaining} />
          </Field>
          <Field label="تاریخ پرداخت">
            <DateInput name="date" />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-500">
          <input type="checkbox" name="createTx" checked={createTx} onChange={(e) => setCreateTx(e.target.checked)} className="h-4 w-4 accent-emerald-600" />
          ثبت خودکار تراکنش بانکی
        </label>
        {createTx && (
          <div className="rounded-xl bg-slate-100 p-3">
            <SelectField name="accountId" label="از حساب" options={accounts} required={false} emptyLabel="— بدون ثبت تراکنش —" />
          </div>
        )}
        <p className="text-[12.5px] text-slate-400">مانده فعلی فاکتور: {remaining.toLocaleString("en-US")} تومان</p>
        <FormFeedback error={h.error} ok={h.ok} />
        <div className="flex justify-end gap-2 pt-1">
          <Btn tone="ghost" onClick={onClose}>انصراف</Btn>
          <Btn type="submit" disabled={h.pending}>{h.pending ? "در حال ثبت..." : "ثبت پرداخت"}</Btn>
        </div>
      </form>
    </Modal>
  );
}
