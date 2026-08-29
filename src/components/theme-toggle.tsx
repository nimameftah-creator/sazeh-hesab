"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "dark" | "light";

/**
 * این اسکریپت باید داخل <head> و قبل از رندر بدنه اجرا شود،
 * وگرنه کاربر یک لحظه تم اشتباه را می‌بیند (FOUC).
 */
export const themeInitScript = `(function(){
  try {
    var t = localStorage.getItem('daftar-theme');
    if (t !== 'light' && t !== 'dark') t = 'dark';
    document.documentElement.setAttribute('data-theme', t);
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();`;

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = document.documentElement.getAttribute("data-theme");
    setTheme(t === "light" ? "light" : "dark");
    setMounted(true);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("daftar-theme", next);
    } catch {
      /* ignore */
    }
    // هماهنگ‌سازی رنگ نوار مرورگر
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", next === "light" ? "#f4f6fa" : "#080e1a");
  }

  const isLight = theme === "light";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isLight ? "تغییر به حالت شب" : "تغییر به حالت روز (برای محیط پرنور)"}
      title={isLight ? "حالت شب" : "حالت روز — برای کار زیر آفتاب"}
      className="group flex w-full items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-100/60 px-3 py-2.5 text-[12.5px] font-medium text-slate-500 transition hover:border-emerald-500/50 hover:text-slate-300"
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-200/70 transition group-hover:bg-emerald-500/15">
        {mounted ? (
          isLight ? (
            <Sun size={15} className="text-amber-500" />
          ) : (
            <Moon size={15} className="text-sky-400" />
          )
        ) : (
          <Moon size={15} />
        )}
      </span>
      <span className="min-w-0 flex-1 text-right">
        {mounted ? (isLight ? "حالت روز" : "حالت شب") : "حالت نمایش"}
      </span>
      <span
        className={`relative h-5 w-9 shrink-0 rounded-full transition ${
          isLight ? "bg-amber-500/70" : "bg-slate-300"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${
            isLight ? "right-0.5" : "right-[18px]"
          }`}
        />
      </span>
    </button>
  );
}
