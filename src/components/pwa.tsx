"use client";

import { useEffect, useState } from "react";
import { Download, CheckCircle2, WifiOff, X } from "lucide-react";
import { Btn } from "./ui";

/* ---------------- ثبت Service Worker ---------------- */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    const onReady = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((reg) => {
          // اگر نسخه جدیدی آماده شد، فعالش کن
          reg.addEventListener("updatefound", () => {
            const nw = reg.installing;
            nw?.addEventListener("statechange", () => {
              if (nw.state === "installed" && navigator.serviceWorker.controller) {
                nw.postMessage("SKIP_WAITING");
              }
            });
          });
        })
        .catch(() => {
          /* ثبت SW حیاتی نیست؛ اپ بدون آن هم کار می‌کند */
        });
    };
    window.addEventListener("load", onReady);
    return () => window.removeEventListener("load", onReady);
  }, []);
  return null;
}

/* ---------------- تشخیص حالت نصب‌شده و پلتفرم ---------------- */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function detectPlatform(): "ios" | "android" | "desktop" {
  if (typeof window === "undefined") return "desktop";
  const ua = navigator.userAgent;
  const iOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (iOS) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "desktop";
}

/* ---------------- دکمه نصب برنامه ---------------- */
export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android" | "desktop">("desktop");
  const [dismissed, setDismissed] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // اگر کاربر قبلاً رد کرده بود، دیگر اذیتش نکن
    try {
      if (localStorage.getItem("pwa-dismissed") === "1") setDismissed(true);
    } catch {
      /* ignore */
    }
    setInstalled(isStandalone());
    setPlatform(detectPlatform());

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) {
    return (
      <div className="flex items-center gap-2 px-4 py-2.5 text-[12.5px] text-emerald-400">
        <CheckCircle2 size={14} />
        <span>نسخه نصب‌شده فعال است</span>
      </div>
    );
  }

  if (dismissed) return null;

  return (
    <>
      <div className="px-3">
        <div className="rounded-xl border border-emerald-400/25 bg-gradient-to-l from-emerald-500/15 to-cyan-500/5 p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-[13px] font-bold text-slate-600">
                <Download size={13} className="text-emerald-400" />
                نصب روی گوشی یا کامپیوتر
              </p>
              <p className="mt-1 text-[11.5px] leading-5 text-slate-400">
                مثل یک اپ واقعی باز می‌شود، بدون نوار آدرس مرورگر.
              </p>
            </div>
            <button
              onClick={() => {
                setDismissed(true);
                try {
                  localStorage.setItem("pwa-dismissed", "1");
                } catch {
                  /* ignore */
                }
              }}
              className="shrink-0 rounded-md p-1 text-slate-400 transition hover:bg-slate-200/60 hover:text-slate-200"
              aria-label="بستن"
            >
              <X size={13} />
            </button>
          </div>
          <div className="mt-2.5 flex gap-2">
            {deferred ? (
              <Btn
                size="sm"
                className="flex-1"
                onClick={async () => {
                  await deferred.prompt();
                  const choice = await deferred.userChoice;
                  if (choice.outcome === "accepted") setInstalled(true);
                  setDeferred(null);
                }}
              >
                <Download size={13} />
                نصب برنامه
              </Btn>
            ) : (
              <Btn size="sm" tone="ghost" className="flex-1" onClick={() => setShowHelp(true)}>
                راهنمای نصب
              </Btn>
            )}
          </div>
        </div>
      </div>

      {/* راهنمای نصب به تفکیک دستگاه */}
      {showHelp && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
          onClick={() => setShowHelp(false)}
        >
          <div
            className="animate-fade w-full max-w-md overflow-hidden rounded-2xl border border-slate-300/40 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
              <h3 className="text-[14.5px] font-bold text-slate-700">نصب دفتر ساختمان</h3>
              <button
                onClick={() => setShowHelp(false)}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-200/60 hover:text-slate-200"
              >
                <X size={15} />
              </button>
            </div>
            <div className="max-h-[70vh] space-y-4 overflow-y-auto p-5 text-[13.5px] leading-7 text-slate-500">
              {platform === "ios" && (
                <div className="rounded-xl border border-sky-400/25 bg-sky-500/10 p-3.5">
                  <p className="mb-1.5 text-[13.5px] font-bold text-sky-300">📱 آیفون / آیپد (Safari)</p>
                  <ol className="list-inside list-decimal space-y-1.5">
                    <li>در مرورگر <b>Safari</b> صفحه را باز کن</li>
                    <li>دکمه <b>اشتراک</b> (مربع با فلش بالا) پایین صفحه</li>
                    <li>گزینه <b>Add to Home Screen</b> / «افزودن به صفحه اصلی»</li>
                    <li>دکمه <b>Add</b> — تمام! آیکونش روی صفحه گوشی می‌آید</li>
                  </ol>
                </div>
              )}

              {platform === "android" && (
                <div className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 p-3.5">
                  <p className="mb-1.5 text-[13.5px] font-bold text-emerald-300">🤖 اندروید (Chrome)</p>
                  <ol className="list-inside list-decimal space-y-1.5">
                    <li>منوی <b>⋮</b> بالای مرورگر کروم</li>
                    <li><b>Install app</b> یا «افزودن به صفحه اصلی»</li>
                    <li>تایید کن — آیکون به صفحه اصلی اضافه می‌شود</li>
                  </ol>
                  <p className="mt-2 text-[12.5px] text-slate-400">
                    گاهی نوار «نصب برنامه» پایین صفحه ظاهر می‌شود؛ همان را بزن.
                  </p>
                </div>
              )}

              {platform === "desktop" && (
                <div className="rounded-xl border border-violet-400/25 bg-violet-500/10 p-3.5">
                  <p className="mb-1.5 text-[13.5px] font-bold text-violet-300">💻 ویندوز / مک (Chrome، Edge)</p>
                  <ol className="list-inside list-decimal space-y-1.5">
                    <li>
                      در نوار آدرس، سمت چپ، آیکون <b>نصب</b> (شکل مانیتور با فلش پایین) را بزن
                    </li>
                    <li>یا منوی <b>⋮</b> ← <b>Install / Cast, save and share</b> ← <b>Install page as app</b></li>
                    <li>تایید کن — یک پنجره مستقل با آیکون خودش باز می‌شود</li>
                  </ol>
                  <p className="mt-2 text-[12.5px] text-slate-400">
                    در مک: ⋮ ← «Install» — در منوی Start / Launchpad پیدایش می‌کنی.
                  </p>
                </div>
              )}

              <div className="rounded-xl bg-slate-100 p-3.5">
                <p className="mb-1.5 text-[13.5px] font-bold text-slate-600">✨ بعد از نصب چه می‌شود؟</p>
                <ul className="list-inside list-disc space-y-1">
                  <li>بدون نوار آدرس، مثل یک اپ واقعی باز می‌شود</li>
                  <li>آیکون مستقل روی صفحه اصلی / منوی استارت</li>
                  <li>میان‌برهای سریع: ثبت تراکنش، پرینت بانک، گزارش</li>
                  <li>اگر اینترنت قطع شود، صفحه آفلاین نشان می‌دهد</li>
                </ul>
              </div>

              <p className="flex items-start gap-1.5 text-[12.5px] text-slate-400">
                <WifiOff size={13} className="mt-1 shrink-0" />
                <span>
                  نکته مهم: این برنامه روی <b>سرور ابری</b> اجرا می‌شود. پس نصب شدن به معنی
                  آفلاین بودن نیست — برای دیدن اطلاعات تازه به اینترنت نیاز داری.
                </span>
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
