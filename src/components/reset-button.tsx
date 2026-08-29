"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import { Btn, Field } from "./ui";
import { Modal } from "./modal";
import { resetData, type ActionResult } from "@/app/actions";

export function ResetButton({
  mode,
  label,
  description,
  confirmWord,
}: {
  mode: "financial" | "all";
  label: string;
  description: string;
  confirmWord: string;
}) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();

  function run() {
    setError(null);
    start(async () => {
      const r: ActionResult = await resetData(mode);
      if (r.ok) {
        setDone(true);
        setTimeout(() => {
          setOpen(false);
          setDone(false);
          setTyped("");
        }, 1600);
      } else {
        setError(r.error ?? "خطا در پاک‌سازی");
      }
    });
  }

  return (
    <>
      <Btn tone="danger" size="md" onClick={() => setOpen(true)}>
        <Trash2 size={14} />
        {label}
      </Btn>
      <Modal open={open} onClose={() => !pending && setOpen(false)} title={label}>
        {done ? (
          <div className="py-8 text-center">
            <p className="text-3xl">✅</p>
            <p className="mt-3 text-sm font-bold text-emerald-400">با موفقیت پاک شد</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-3 rounded-xl border border-rose-500/25 bg-rose-500/10 p-3.5">
              <AlertTriangle size={18} className="mt-0.5 shrink-0 text-rose-400" />
              <p className="text-[13.5px] leading-6 text-slate-500">{description}</p>
            </div>
            <Field label={`برای تایید، عبارت «${confirmWord}» را بنویس`}>
              <input
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                className="field-input"
                placeholder={confirmWord}
                autoFocus
              />
            </Field>
            {error && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-[13px] text-rose-400">{error}</p>}
            <div className="flex justify-end gap-2">
              <Btn tone="ghost" onClick={() => setOpen(false)} disabled={pending}>
                انصراف
              </Btn>
              <Btn tone="danger" onClick={run} disabled={pending || typed.trim() !== confirmWord}>
                {pending ? "در حال پاک‌سازی..." : "پاک کن"}
              </Btn>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
