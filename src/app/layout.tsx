import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { Nav, MobileNav } from "@/components/nav";
import { ServiceWorkerRegistrar } from "@/components/pwa";
import { themeInitScript } from "@/components/theme-toggle";
import { UpdateBanner } from "@/components/update-banner";

export const metadata: Metadata = {
  title: "دفتر ساختمان | مدیریت مالی پروژه‌های ساخت‌وساز",
  description:
    "داشبورد حرفه‌ای مدیریت مالی ساخت‌وساز: هزینه‌ها، درآمدها، مراحل ساخت، پیمانکاران، چک‌ها و گزارش‌ساز پویا",
  applicationName: "دفتر ساختمان",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "دفتر ساختمان",
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: "/favicon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#080e1a" },
    { media: "(prefers-color-scheme: light)", color: "#080e1a" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fa" dir="rtl" data-theme="dark" suppressHydrationWarning>
      <head>
        {/* قبل از رندر بدنه اجرا می‌شود تا تم اشتباه یک لحظه نمایش داده نشود */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="text-slate-600 antialiased">
        <ServiceWorkerRegistrar />
        <div className="flex min-h-screen">
          <Nav />
          <main className="min-w-0 flex-1 lg:mr-[248px]">
            <MobileNav />
            <div className="mx-auto max-w-[1500px] px-4 py-6 lg:px-7">{children}</div>
          </main>
        </div>
        <UpdateBanner />
      </body>
    </html>
  );
}
