import Link from "next/link";
import { Btn } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center py-16 text-center">
      <p className="text-5xl">🧭</p>
      <h1 className="mt-5 text-xl font-extrabold text-slate-700">این صفحه پیدا نشد</h1>
      <p className="mt-3 text-[13.5px] leading-7 text-slate-400">
        آدرسی که وارد کردی در برنامه وجود ندارد. ممکن است موردی که دنبالش بودی حذف شده باشد.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Link href="/">
          <Btn>بازگشت به داشبورد</Btn>
        </Link>
        <Link href="/reports">
          <Btn tone="ghost">گزارش‌ساز</Btn>
        </Link>
      </div>
    </div>
  );
}
