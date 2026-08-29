"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Btn } from "@/components/ui";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center py-16 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-400 ring-1 ring-rose-400/25">
        <AlertTriangle size={28} />
      </span>
      <h1 className="mt-5 text-xl font-extrabold text-slate-700">مشکلی پیش آمد</h1>
      <p className="mt-3 text-[13.5px] leading-7 text-slate-400">
        در بارگذاری این صفحه خطایی رخ داد. ممکن است اتصال اینترنت قطع شده باشد یا سرور
        موقتاً در دسترس نباشد.
      </p>
      <p className="mt-4 rounded-xl bg-slate-100 px-4 py-3 font-mono text-[12px] text-slate-400" dir="ltr">
        {error.digest ?? error.message ?? "خطای ناشناخته"}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Btn onClick={reset}>تلاش دوباره</Btn>
        <Btn tone="ghost" onClick={() => (window.location.href = "/")}>
          بازگشت به داشبورد
        </Btn>
      </div>
    </div>
  );
}
