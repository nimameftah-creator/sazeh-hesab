"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Wifi, WifiOff, CheckCircle2 } from "lucide-react";
import { APP_VERSION } from "@/lib/version";

type State =
  | { kind: "idle" }
  | { kind: "update-ready"; version: string }
  | { kind: "updating" }
  | { kind: "updated"; version: string };

/**
 * بنر به‌روزرسانی PWA
 * ───────────────────────────────────────────────
 * وقتی Service Worker نسخه جدیدی پیدا کند، پیام می‌دهد و این بنر
 * نمایش داده می‌شود. با کلیک کاربر، نسخه جدید فعال و صفحه رفرش می‌شود.
 *
 * روی موبایل و دسکتاپِ نصب‌شده، این همان «آپدیت خودکار» است.
 */
export function UpdateBanner() {
  const [state, setState] = useState<State>({ kind: "idle" });

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const sw = navigator.serviceWorker;

    const onMessage = (e: MessageEvent) => {
      const d = e.data;
      if (!d || typeof d !== "object") return;
      if (d.type === "UPDATE_AVAILABLE") {
        setState({ kind: "update-ready", version: d.version ?? "" });
      } else if (d.type === "SW_UPDATED") {
        setState({ kind: "updated", version: d.version ?? "" });
        // دو ثانیه نشان بده، بعد رفرش کن تا نسخه جدید بارگذاری شود
        setTimeout(() => window.location.reload(), 1800);
      }
    };
    sw.addEventListener("message", onMessage);

    // اگر همین حالا یک SW در انتظار نصب است
    sw.ready
      .then((reg) => {
        if (reg.waiting) {
          setState({ kind: "update-ready", version: "" });
        }
        // بررسی دوره‌ای نسخه جدید (هر ۳۰ دقیقه)
        const check = () => reg.update().catch(() => undefined);
        const id = window.setInterval(check, 30 * 60 * 1000);
        reg.addEventListener("updatefound", () => {
          const nw = reg.installing;
          nw?.addEventListener("statechange", () => {
            if (nw.state === "installed" && sw.controller) {
              setState({ kind: "update-ready", version: "" });
            }
          });
        });
        return () => window.clearInterval(id);
      })
      .catch(() => undefined);

    return () => sw.removeEventListener("message", onMessage);
  }, []);

  if (state.kind === "idle") return null;

  if (state.kind === "updating") {
    return (
      <div className="fixed inset-x-0 bottom-0 z-[60] flex items-center justify-center gap-2 border-t border-sky-400/30 bg-sky-500/15 px-4 py-3 text-[13px] text-sky-300 backdrop-blur-xl">
        <RefreshCw size={15} className="animate-spin" />
        در حال به‌روزرسانی...
      </div>
    );
  }

  if (state.kind === "updated") {
    return (
      <div className="fixed inset-x-0 bottom-0 z-[60] flex items-center justify-center gap-2 border-t border-emerald-400/30 bg-emerald-500/15 px-4 py-3 text-[13px] text-emerald-300 backdrop-blur-xl">
        <CheckCircle2 size={15} />
        به نسخه {state.version || APP_VERSION} به‌روز شد
      </div>
    );
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] flex flex-wrap items-center justify-center gap-3 border-t border-emerald-400/30 bg-slate-100/95 px-4 py-3 backdrop-blur-xl">
      <span className="flex items-center gap-2 text-[13px] font-medium text-slate-600">
        <RefreshCw size={15} className="text-emerald-400" />
        نسخه جدید برنامه آماده است
      </span>
      <button
        type="button"
        onClick={() => {
          setState({ kind: "updating" });
          navigator.serviceWorker.ready
            .then((reg) => {
              reg.waiting?.postMessage("SKIP_WAITING");
              // اگر waiting نبود، رفرش ساده
              setTimeout(() => window.location.reload(), 1500);
            })
            .catch(() => window.location.reload());
        }}
        className="rounded-xl bg-gradient-to-l from-emerald-500 to-teal-600 px-4 py-2 text-[13px] font-medium text-white shadow-lg shadow-emerald-900/30 transition hover:brightness-110 active:scale-[0.98]"
      >
        به‌روزرسانی کن
      </button>
      <button
        type="button"
        onClick={() => setState({ kind: "idle" })}
        className="rounded-xl border border-slate-300/70 px-3 py-2 text-[13px] text-slate-500 transition hover:text-slate-300"
      >
        بعداً
      </button>
    </div>
  );
}

/**
 * نشانگر وضعیت اتصال به سرور
 * ───────────────────────────────────────────────
 * هر ۴۵ ثانیه سرور را چک می‌کند. اگر قطع بود، هشدار می‌دهد.
 */
export function ConnectionStatus({ compact = false }: { compact?: boolean }) {
  const [online, setOnline] = useState(true);
  const [version, setVersion] = useState<string | null>(null);
  const [checkedAt, setCheckedAt] = useState<Date | null>(null);

  useEffect(() => {
    let alive = true;
    async function check() {
      try {
        const r = await fetch("/api/version", { cache: "no-store" });
        if (!r.ok) throw new Error("bad status");
        const j = (await r.json()) as { version: string };
        if (!alive) return;
        setOnline(true);
        setVersion(j.version);
        setCheckedAt(new Date());
      } catch {
        if (alive) setOnline(false);
      }
    }
    check();
    const id = window.setInterval(check, 45_000);
    const onOnline = () => check();
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", () => alive && setOnline(false));
    return () => {
      alive = false;
      window.clearInterval(id);
      window.removeEventListener("online", onOnline);
    };
  }, []);

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 text-[12px] ${
          online ? "text-emerald-400" : "text-rose-400"
        }`}
        title={
          online
            ? `متصل به سرور · نسخه ${version ?? "—"}${
                checkedAt
                  ? ` · بررسی ${checkedAt.toLocaleTimeString("fa-IR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}`
                  : ""
              }`
            : "ارتباط با سرور قطع است"
        }
      >
        {online ? <Wifi size={13} /> : <WifiOff size={13} />}
        {online ? "متصل" : "قطع"}
      </span>
    );
  }

  return (
    <div
      className={`flex items-center gap-2.5 rounded-xl border p-3 ${
        online ? "border-emerald-400/25 bg-emerald-500/10" : "border-rose-400/25 bg-rose-500/10"
      }`}
    >
      {online ? (
        <Wifi size={16} className="shrink-0 text-emerald-400" />
      ) : (
        <WifiOff size={16} className="shrink-0 text-rose-400" />
      )}
      <div className="min-w-0">
        <p className={`text-[13px] font-medium ${online ? "text-emerald-400" : "text-rose-400"}`}>
          {online ? "متصل به سرور" : "ارتباط با سرور قطع است"}
        </p>
        <p className="mt-0.5 text-[12px] text-slate-400">
          {online
            ? `نسخه سرور ${version ?? "—"} · نسخه دستگاه ${APP_VERSION}`
            : "داده‌های تازه بارگذاری نمی‌شوند. اتصال اینترنت را بررسی کن."}
        </p>
      </div>
    </div>
  );
}
