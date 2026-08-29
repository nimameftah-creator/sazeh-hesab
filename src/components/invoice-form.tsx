"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Field, Btn } from "./ui";
import { Modal } from "./modal";
import { SelectField, type Opt } from "./forms";
import { parseAmount, fmtMoney, normalizeDigits } from "@/lib/format";
import { todayISO, formatJalali, jalaaliToISO } from "@/lib/jalali";
import { addInvoiceWithItems, type ItemInput, type ActionResult } from "@/app/actions";

interface LineItem {
  key: number;
  materialId: string;
  quantity: string;
  unitPrice: string;
  description: string;
}

let seq = 0;
const newItem = (): LineItem => ({
  key: ++seq,
  materialId: "",
  quantity: "",
  unitPrice: "",
  description: "",
});

export function InvoiceWithItemsForm({
  open,
  onClose,
  parties,
  projects,
  categories,
  materials,
  accounts,
  defaultParty,
}: {
  open: boolean;
  onClose: () => void;
  parties: Opt[];
  projects: Opt[];
  categories: Opt[];
  materials: Opt[];
  accounts: Opt[];
  defaultParty?: string | null;
}) {
  const [items, setItems] = useState<LineItem[]>([newItem()]);
  const [partyId, setPartyId] = useState(defaultParty ?? "");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [dateText, setDateText] = useState(() => formatJalali(todayISO()));
  const [paidAmount, setPaidAmount] = useState("0");

  /** تبدیل تاریخ شمسی/میلادی واردشده به ISO */
  const dateISO = (() => {
    const v = normalizeDigits(dateText).trim();
    const j = /^(1[3-4]\d{2})[\/\-.](\d{1,2})[\/\-.](\d{1,2})$/.exec(v);
    if (j) {
      try {
        return jalaaliToISO(Number(j[1]), Number(j[2]), Number(j[3]));
      } catch {
        return todayISO();
      }
    }
    return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : todayISO();
  })();
  const [accountId, setAccountId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [pending, start] = useTransition();

  const expCats = categories.filter((c) => c.kind === "expense");

  function update(key: number, patch: Partial<LineItem>) {
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, ...patch } : i)));
  }

  const lineTotal = (i: LineItem) =>
    (parseAmount(i.quantity) || 0) * (parseAmount(i.unitPrice) || 0);
  const grandTotal = items.reduce((a, i) => a + lineTotal(i), 0);
  const paid = parseAmount(paidAmount);
  const remaining = Math.max(0, grandTotal - paid);

  function unitOf(materialId: string) {
    return materials.find((m) => m.id === materialId)?.unit ?? "";
  }

  function reset() {
    setItems([newItem()]);
    setInvoiceNumber("");
    setPaidAmount("0");
    setDescription("");
  }

  function submit() {
    setError(null);
    setOk(false);

    if (!partyId) {
      setError("فروشنده / طرف حساب را انتخاب کنید");
      return;
    }
    const valid = items.filter(
      (i) => i.materialId && parseAmount(i.quantity) > 0 && parseAmount(i.unitPrice) > 0
    );
    if (valid.length === 0) {
      setError("حداقل یک قلم کالا با مقدار و قیمت فی وارد کنید");
      return;
    }

    const payload: ItemInput[] = valid.map((i) => ({
      materialId: i.materialId,
      quantity: parseAmount(i.quantity),
      unitPrice: parseAmount(i.unitPrice),
      description: i.description || undefined,
    }));

    start(async () => {
      const r: ActionResult = await addInvoiceWithItems({
        partyId,
        projectId: projectId || null,
        categoryId: categoryId || null,
        // DateInput مقدار شمسی را در FormData می‌گذارد؛ اینجا مستقیم ISO امروز یا مقدار فرم
        date: dateISO,
        invoiceNumber: invoiceNumber || null,
        description,
        paidAmount: paid,
        items: payload,
        accountId: accountId || null,
      });
      if (r.ok) {
        setOk(true);
        reset();
        setTimeout(() => {
          setOk(false);
          onClose();
        }, 1200);
      } else {
        setError(r.error ?? "خطا در ثبت فاکتور");
      }
    });
  }



  return (
    <Modal open={open} onClose={onClose} title="ثبت فاکتور خرید با اقلام" wide>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="space-y-4"
      >
        {/* سربرگ فاکتور */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="فروشنده / طرف حساب">
            <select
              value={partyId}
              onChange={(e) => setPartyId(e.target.value)}
              className="field-input"
              required
            >
              <option value="" disabled>
                انتخاب کنید...
              </option>
              {parties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="شماره فاکتور فروشنده">
            <input
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              className="field-input"
              dir="ltr"
              placeholder="1403-0852"
            />
          </Field>
          <Field label="پروژه">
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="field-input"
            >
              <option value="">— بدون پروژه —</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="دسته هزینه">
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="field-input"
            >
              <option value="">— بدون دسته —</option>
              {expCats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="تاریخ فاکتور">
            <input
              value={dateText}
              onChange={(e) => setDateText(e.target.value)}
              dir="ltr"
              className="field-input text-right"
              placeholder="۱۴۰۳/۰۸/۱۲"
            />
          </Field>
          <Field label="شرح کلی فاکتور">
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="field-input"
              placeholder="خرید مصالح سفت‌کاری"
            />
          </Field>
        </div>

        {/* اقلام */}
        <div className="rounded-2xl border border-slate-200 bg-slate-100/60 p-3">
          <div className="mb-2.5 flex items-center justify-between">
            <p className="text-[13px] font-bold text-slate-600">اقلام فاکتور</p>
            <Btn tone="ghost" size="sm" type="button" onClick={() => setItems((p) => [...p, newItem()])}>
              <Plus size={13} />
              افزودن قلم
            </Btn>
          </div>

          <div className="space-y-2.5">
            {items.map((item, idx) => {
              const u = unitOf(item.materialId);
              return (
                <div key={item.key} className="rounded-xl border border-slate-200 bg-white/40 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[12px] font-medium text-slate-400">قلم {idx + 1}</span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setItems((p) => p.filter((x) => x.key !== item.key))}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-rose-400 transition hover:bg-rose-500/10"
                        aria-label="حذف این قلم"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
                    <div className="col-span-2">
                      <label className="field-label">کالا</label>
                      <select
                        value={item.materialId}
                        onChange={(e) => update(item.key, { materialId: e.target.value })}
                        className="field-input"
                        required
                      >
                        <option value="" disabled>
                          — کالا را انتخاب کنید —
                        </option>
                        {materials.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <Field label={`مقدار${u ? ` (${u})` : ""}`}>
                      <input
                        value={item.quantity}
                        onChange={(e) => update(item.key, { quantity: e.target.value })}
                        inputMode="decimal"
                        dir="ltr"
                        className="field-input text-left"
                        placeholder="2400"
                      />
                    </Field>
                    <Field label="قیمت فی (تومان)">
                      <input
                        value={item.unitPrice}
                        onChange={(e) => update(item.key, { unitPrice: e.target.value })}
                        inputMode="decimal"
                        dir="ltr"
                        className="field-input text-left"
                        placeholder="24500"
                      />
                    </Field>
                  </div>
                  <div className="mt-2 flex items-center justify-between rounded-lg bg-slate-100 px-3 py-1.5">
                    <span className="text-[12px] text-slate-400">مبلغ این قلم</span>
                    <span className="text-[13px] font-bold text-slate-600">
                      {fmtMoney(lineTotal(item), false)} تومان
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* جمع و پرداخت */}
        <div className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-[12px] text-slate-400">جمع فاکتور</p>
              <p className="mt-1 text-[15px] font-extrabold text-slate-700">{fmtMoney(grandTotal)}</p>
            </div>
            <div>
              <p className="text-[12px] text-slate-400">پرداختی</p>
              <p className="mt-1 text-[15px] font-extrabold text-emerald-400">{fmtMoney(paid)}</p>
            </div>
            <div>
              <p className="text-[12px] text-slate-400">مانده بدهی</p>
              <p className={`mt-1 text-[15px] font-extrabold ${remaining > 0 ? "text-rose-400" : "text-slate-400"}`}>
                {fmtMoney(remaining)}
              </p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Field label="مبلغ پرداختی الان (تومان)">
              <input
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                inputMode="numeric"
                dir="ltr"
                className="field-input text-left"
              />
            </Field>
            <Field label="پرداخت از حساب (اختیاری)">
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="field-input"
              >
                <option value="">— فقط ثبت بدهی، بدون تراکنش —</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </div>

        {(error || ok) && (
          <p
            className={`rounded-xl px-3 py-2 text-[13px] ${
              ok ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
            }`}
          >
            {ok ? "✓ فاکتور با موفقیت ثبت شد" : error}
          </p>
        )}

        <p className="rounded-xl bg-slate-100 px-3 py-2 text-[12px] leading-6 text-slate-400">
          با ثبت این فاکتور، <b className="text-slate-300">قیمت فی هر کالا</b> در دیتابیس ذخیره
          می‌شود و در نمودار روند قیمت آن کالا نمایش داده می‌شود. اگر مبلغ پرداختی وارد کنی و
          حساب را انتخاب کنی، تراکنش بانکی هم خودکار ثبت و به این فاکتور متصل می‌شود.
        </p>

        <div className="flex justify-end gap-2">
          <Btn tone="ghost" type="button" onClick={onClose}>
            انصراف
          </Btn>
          <Btn type="submit" disabled={pending}>
            {pending ? "در حال ثبت..." : `ثبت فاکتور (${fmtMoney(grandTotal, false)})`}
          </Btn>
        </div>
      </form>
    </Modal>
  );
}

/** دکمه بازشونده */
export function OpenInvoiceWithItemsForm(props: {
  parties: Opt[];
  projects: Opt[];
  categories: Opt[];
  materials: Opt[];
  accounts: Opt[];
  defaultParty?: string | null;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Btn onClick={() => setOpen(true)}>{props.label ?? "ثبت فاکتور خرید"}</Btn>
      <InvoiceWithItemsForm open={open} onClose={() => setOpen(false)} {...props} />
    </>
  );
}
