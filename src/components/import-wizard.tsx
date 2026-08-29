"use client";

import { useMemo, useState, useTransition } from "react";
import { Card, CardHeader, Btn, Badge, Field } from "./ui";
import { Modal } from "./modal";
import { parseStatement, type ParsedRow } from "@/lib/parser";
import { parseAmount, normalizeDigits } from "@/lib/format";
import { formatJalali, jalaaliToISO } from "@/lib/jalali";
import type { Opt, AcctOpt } from "./forms";
import { importTransactions } from "@/app/actions";
import type { TxType } from "@/lib/parser";

const SAMPLE = `۱۴۰۳/۰۸/۰۵ - انتقال به آقای تبریزی - گلشهر - خرید سیمان - 98,000,000 ریال
۱۴۰۳/۰۸/۱۲ - واریز از خانم صادقی - گلشهر - پیش پرداخت واحد ۲ - 700,000,000 ریال
۱۴۰۳/۰۸/۱۵ - انتقال به آقای رضایی - گلشهر - صورتوضعیت اسکلت - 1,400,000,000 ریال
۱۴۰۳/۰۸/۲۰ - برداشت به کارت خودم - انتقال به کارت شخصی - 100,000,000 ریال
۱۴۰۳/۰۸/۲۵ - خرج خونه - خرید منزل - 35,000,000 ریال
۱۴۰۳/۰۸/۲۹ - انتقال به آقای کاظمی - گلشهر - خرید بلوک - 64,000,000 ریال`;

interface RowState extends ParsedRow {
  date: string;
  amount: number | null;
}

export function ImportWizard({
  accounts,
  projects,
  categories,
  parties,
}: {
  accounts: AcctOpt[];
  projects: Opt[];
  categories: Opt[];
  parties?: Opt[];
}) {
  const [text, setText] = useState("");
  const [currency, setCurrency] = useState<"rial" | "toman">("rial");
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [rows, setRows] = useState<RowState[] | null>(null);
  const [parsedCount, setParsedCount] = useState(0);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(0);
  const [warnOpen, setWarnOpen] = useState(false);

  const expCats = categories.filter((c) => c.kind === "expense");
  const incCats = categories.filter((c) => c.kind === "income");

  function runParse() {
    setError(null);
    setRows(null);
    const parsed = parseStatement(text, { projects, categories, parties: parties ?? [] }, currency);
    const valid = parsed.filter((r) => r.amount && r.amount > 0).length;
    setParsedCount(valid);
    setRows(parsed as RowState[]);
  }

  function updateRow(i: number, patch: Partial<RowState>) {
    setRows((rs) => rs?.map((r, idx) => (idx === i ? { ...r, ...patch } : r)) ?? null);
  }

  function save() {
    if (!rows || !accountId) {
      setError("حساب بانکی را انتخاب کنید");
      return;
    }
    setError(null);
    const payload = rows
      .filter((r) => r.amount && r.amount > 0 && !r.raw.includes("!! حذف"))
      .map((r) => ({
        date: r.date,
        amount: r.amount as number,
        type: r.type,
        projectId: r.projectId,
        categoryId: r.categoryId,
        partyId: r.partyId ?? null,
        counterparty: r.counterparty,
        description: r.description,
        rawText: r.raw,
      }));
    start(async () => {
      const res = await importTransactions({ accountId, rows: payload });
      if (res.ok) setDone(payload.length);
      else setError(res.error ?? "خطا در ثبت");
    });
  }

  const goodCount = useMemo(
    () => rows?.filter((r) => r.amount && r.amount > 0).length ?? 0,
    [rows]
  );

  if (done > 0) {
    return (
      <Card className="p-10 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl">
          ✅
        </div>
        <h2 className="text-lg font-extrabold text-slate-800">
          {done} تراکنش با موفقیت ثبت شد
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          حالا می‌توانید آن‌ها را در داشبورد و صفحه تراکنش‌ها ببینید.
        </p>
        <Btn className="mt-5" onClick={() => { setDone(0); setRows(null); setText(""); }}>
          ورود پرینت دیگر
        </Btn>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title="۱) متن پرینت بانک را بچسبانید"
          subtitle="هر خط = یک تراکنش. شماره کارت، مبلغ، تاریخ، شرح انتقال و نام طرف حساب تشخیص داده می‌شود."
        />
        <div className="space-y-3 p-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            dir="rtl"
            className="field-input font-mono text-[13px] leading-6"
            placeholder={"مثلا:\n۱۴۰۳/۰۸/۰۵ - انتقال به آقای تبریزی - گلشهر - خرید سیمان - 98,000,000 ریال"}
          />
          <div className="flex flex-wrap items-center gap-3">
            <Field label="حساب بانکی این پرینت">
              <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className="field-input w-56">
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="واحد مبالغ بدون ذکر واحد">
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as "rial" | "toman")}
                className="field-input w-40"
              >
                <option value="rial">ریال (پرینت بانک)</option>
                <option value="toman">تومان</option>
              </select>
            </Field>
            <div className="flex gap-2 pt-5">
              <Btn onClick={runParse} disabled={text.trim().length === 0}>
                تجزیه و پیش‌نمایش
              </Btn>
              <Btn tone="ghost" onClick={() => setText(SAMPLE)}>
                پر کردن نمونه
              </Btn>
            </div>
          </div>
        </div>
      </Card>

      {rows && (
        <Card>
          <CardHeader
            title="۲) بازبینی و اصلاح"
            subtitle={`${goodCount} ردیف معتبر از ${rows.length} خط — موارد مشکوک را قبل از ثبت اصلاح کنید`}
            action={
              <div className="flex gap-2">
                <Btn tone="ghost" onClick={() => { setRows(null); setText(""); }}>
                  شروع دوباره
                </Btn>
                <Btn onClick={() => setWarnOpen(true)} disabled={pending || goodCount === 0}>
                  {pending ? "در حال ثبت..." : `ثبت ${goodCount} تراکنش`}
                </Btn>
              </div>
            }
          />
          <div className="overflow-x-auto p-4">
            <table className="w-full min-w-[900px] text-right">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="table-th">وضعیت</th>
                  <th className="table-th">تاریخ</th>
                  <th className="table-th">مبلغ (تومان)</th>
                  <th className="table-th">نوع</th>
                  <th className="table-th">پروژه</th>
                  <th className="table-th">دسته</th>
                  <th className="table-th">طرف حساب (از فهرست)</th>
                  <th className="table-th">نام آزاد</th>
                  <th className="table-th">شرح (قابل ویرایش)</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const cats = r.type === "income" ? incCats : expCats;
                  return (
                    <tr key={`${i}-${r.raw.slice(0, 16)}`} className="border-b border-slate-100 align-top">
                      <td className="table-td">
                        {r.confidence === "high" ? (
                          <Badge tone="green">مطمئن</Badge>
                        ) : r.confidence === "medium" ? (
                          <Badge tone="amber">مرور شود</Badge>
                        ) : (
                          <Badge tone="red">نامطمئن</Badge>
                        )}
                      </td>
                      <td className="table-td">
                        <input
                          type="text"
                          dir="ltr"
                          className="field-input w-28 text-[13px]"
                          defaultValue={formatJalali(r.date)}
                          onBlur={(e) => {
                            const v = normalizeDigits(e.target.value).trim();
                            const j = /^(1[3-4]\d{2})[\/\-.](\d{1,2})[\/\-.](\d{1,2})$/.exec(v);
                            if (j) {
                              try {
                                const iso = jalaaliToISO(Number(j[1]), Number(j[2]), Number(j[3]));
                                updateRow(i, { date: iso });
                              } catch {
                                /* ignore */
                              }
                            } else if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
                              updateRow(i, { date: v });
                            }
                          }}
                        />
                      </td>
                      <td className="table-td">
                        <input
                          type="text"
                          inputMode="numeric"
                          dir="ltr"
                          className="field-input w-32 text-left text-[13px]"
                          value={r.amount ? r.amount.toLocaleString("en-US") : ""}
                          onChange={(e) =>
                            updateRow(i, { amount: parseAmount(e.target.value) || null })
                          }
                        />
                      </td>
                      <td className="table-td">
                        <select
                          className="field-input w-28 text-[13px]"
                          value={r.type}
                          onChange={(e) => updateRow(i, { type: e.target.value as TxType })}
                        >
                          <option value="expense">خرج</option>
                          <option value="income">دریافت</option>
                          <option value="transfer">انتقال</option>
                        </select>
                      </td>
                      <td className="table-td">
                        <select
                          className="field-input w-32 text-[13px]"
                          value={r.projectId ?? ""}
                          onChange={(e) =>
                            updateRow(i, { projectId: e.target.value || null })
                          }
                        >
                          <option value="">شخصی / هیچ</option>
                          {projects.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="table-td">
                        <select
                          className="field-input w-36 text-[13px]"
                          value={r.categoryId ?? ""}
                          onChange={(e) =>
                            updateRow(i, { categoryId: e.target.value || null })
                          }
                        >
                          <option value="">— دسته —</option>
                          {cats.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="table-td">
                        <select
                          className="field-input w-32 text-[13px]"
                          value={r.partyId ?? ""}
                          onChange={(e) => updateRow(i, { partyId: e.target.value || null })}
                        >
                          <option value="">— انتخاب نشده —</option>
                          {(parties ?? []).map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="table-td">
                        <input
                          className="field-input w-28 text-[13px]"
                          value={r.counterparty}
                          onChange={(e) => updateRow(i, { counterparty: e.target.value })}
                        />
                      </td>
                      <td className="table-td max-w-xs">
                        <input
                          className="field-input w-64 text-[13px]"
                          value={r.description}
                          onChange={(e) => updateRow(i, { description: e.target.value })}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {error && (
        <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</p>
      )}

      <Modal open={warnOpen} onClose={() => setWarnOpen(false)} title="تایید نهایی">
        <p className="text-sm leading-6 text-slate-600">
          {goodCount} تراکنش در حساب «
          {accounts.find((a) => a.id === accountId)?.name}» ثبت خواهد شد. ثبت پس از تایید
          قابل حذف تکی است (از صفحه تراکنش‌ها).
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Btn tone="ghost" onClick={() => setWarnOpen(false)}>
            بازگشت
          </Btn>
          <Btn
            onClick={() => {
              setWarnOpen(false);
              save();
            }}
          >
            ثبت نهایی
          </Btn>
        </div>
      </Modal>

      {parsedCount > 0 && !rows && (
        <p className="text-sm text-slate-500">در حال نمایش... </p>
      )}
    </div>
  );
}
