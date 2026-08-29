"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * مودال دسترس‌پذیر:
 *  - role="dialog" + aria-modal برای صفحه‌خوان
 *  - بستن با کلید Escape
 *  - حبس فوکوس (Tab داخل مودال می‌ماند)
 *  - فوکوس خودکار روی اولین فیلد
 *  - قفل اسکرول پس‌زمینه
 *  - بستن با کلیک روی پس‌زمینه
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    // فوکوس روی اولین فیلد قابل ورود
    const t = window.setTimeout(() => {
      const el = ref.current?.querySelector<HTMLElement>(
        "input:not([type=hidden]), select, textarea"
      );
      (el ?? ref.current)?.focus();
    }, 40);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      // حبس فوکوس
      if (e.key !== "Tab" || !ref.current) return;
      const items = ref.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([type=hidden]), select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : "پنجره گفتگو"}
        tabIndex={-1}
        className={`animate-fade mt-6 w-full ${wide ? "max-w-3xl" : "max-w-lg"} overflow-hidden rounded-2xl border border-slate-300/40 bg-white shadow-2xl outline-none`}
      >
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-3.5">
          <h3 className="text-[14.5px] font-bold text-slate-700">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-200/60 hover:text-slate-200"
          >
            ✕
          </button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}
