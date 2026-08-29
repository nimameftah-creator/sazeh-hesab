"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Building2,
  Landmark,
  HardHat,
  Users,
  ScrollText,
  Tags,
  FileUp,
  Home,
  PieChart,
  Settings,
  Monitor,
  Sun,
  Moon,
  Package,
} from "lucide-react";
import { useEffect, useState } from "react";
import { InstallPrompt } from "./pwa";
import { ThemeToggle } from "./theme-toggle";

const items = [
  { href: "/", label: "داشبورد", icon: LayoutDashboard },
  { href: "/reports", label: "گزارش‌ساز", icon: PieChart },
  { href: "/transactions", label: "تراکنش‌ها", icon: ArrowLeftRight },
  { href: "/projects", label: "پروژه‌ها", icon: Building2 },
  { href: "/parties", label: "طرف حساب‌ها", icon: Users },
  { href: "/materials", label: "کالاها و قیمت", icon: Package },
  { href: "/accounts", label: "حساب‌های بانکی", icon: Landmark },
  { href: "/contractors", label: "پیمانکاران", icon: HardHat },
  { href: "/workers", label: "کارگران", icon: Users },
  { href: "/cheques", label: "چک‌ها", icon: ScrollText },
  { href: "/import", label: "ورود پرینت بانک", icon: FileUp },
  { href: "/categories", label: "دسته‌بندی و مراحل", icon: Tags },
  { href: "/install", label: "نصب روی کامپیوتر", icon: Monitor },
  { href: "/settings", label: "تنظیمات", icon: Settings },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <aside className="fixed inset-y-0 right-0 z-40 hidden w-[248px] flex-col border-l border-slate-200/70 bg-slate-100/80 backdrop-blur-xl lg:flex">
      <div className="flex items-center gap-3 border-b border-slate-200/70 px-5 py-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 text-white shadow-lg shadow-emerald-900/40">
          <Home size={19} />
        </span>
        <div>
          <p className="text-[14.5px] font-extrabold text-slate-800">دفتر ساختمان</p>
          <p className="text-[11.5px] text-slate-400">مدیریت مالی پروژه‌های ساخت</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {items.map((it) => {
          const active =
            it.href === "/" ? pathname === "/" : pathname.startsWith(it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium transition ${
                active
                  ? "bg-gradient-to-l from-emerald-500/20 to-cyan-500/10 text-emerald-300 ring-1 ring-inset ring-emerald-400/25"
                  : "text-slate-500 hover:bg-slate-200/40 hover:text-slate-300"
              }`}
            >
              <it.icon
                size={17}
                className={active ? "text-emerald-400" : "text-slate-500 group-hover:text-emerald-400"}
              />
              {it.label}
              {active && <span className="mr-auto h-1.5 w-1.5 rounded-full bg-emerald-400" />}
            </Link>
          );
        })}
      </nav>
      <div className="space-y-2 border-t border-slate-200/70 px-3 py-3">
        <ThemeToggle />
        <InstallPrompt />
        <p className="px-5 text-[11.5px] leading-5 text-slate-500">
          همه مبالغ به <b className="text-slate-400">تومان</b> است.
          <br />
          پرینت ریالی خودکار تبدیل می‌شود.
        </p>
      </div>
    </aside>
  );
}

export function MobileThemeToggle() {
  const [light, setLight] = useState(false);
  useEffect(() => {
    setLight(document.documentElement.getAttribute("data-theme") === "light");
  }, []);
  return (
    <button
      type="button"
      aria-label="تغییر حالت نمایش روز و شب"
      onClick={() => {
        const next = light ? "dark" : "light";
        setLight(!light);
        document.documentElement.setAttribute("data-theme", next);
        try {
          localStorage.setItem("daftar-theme", next);
        } catch {
          /* ignore */
        }
      }}
      className="ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500"
    >
      {light ? <Sun size={15} className="text-amber-500" /> : <Moon size={15} />}
    </button>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="sticky top-0 z-40 flex items-center gap-1 overflow-x-auto border-b border-slate-200/70 bg-slate-100/90 px-3 py-2 backdrop-blur-xl lg:hidden [&_a]:shrink-0">
      {items.map((it) => {
        const active = it.href === "/" ? pathname === "/" : pathname.startsWith(it.href);
        return (
          <Link
            key={it.href}
            href={it.href}
            className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12.5px] font-medium transition ${
              active ? "bg-emerald-500/20 text-emerald-300" : "text-slate-500"
            }`}
          >
            <it.icon size={13} />
            {it.label}
          </Link>
        );
      })}
      <MobileThemeToggle />
    </nav>
  );
}
