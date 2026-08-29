import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { readdir } from "fs/promises";
import path from "path";
import { ZipArchive } from "archiver";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * دانلود کد به‌صورت zip آماده برای لیارا
 * ═══════════════════════════════════════════════════════════
 * چرا این لازم است؟
 *   وقتی از گیت‌هاب zip دانلود می‌کنی، همه‌چیز داخل پوشه‌ی
 *   sazeh-hesab-main/ قرار می‌گیرد. اگر همان را در لیارا آپلود کنی،
 *   لیارا package.json را در ریشه پیدا نمی‌کند و خطای
 *   «COPY failed: no source files were specified» می‌دهد.
 *
 *   این مسیر فایل‌ها را مستقیم در ریشهٔ zip می‌گذارد.
 * ═══════════════════════════════════════════════════════════
 */

const ROOT = process.cwd();

const SKIP_DIRS = new Set([
  "node_modules",
  ".next",
  ".git",
  "release",
  "dist",
  ".turbo",
  "coverage",
  ".cache",
]);
const SKIP_FILES = new Set([
  ".env",
  ".env.local",
  ".env.production",
  "npm-debug.log",
  ".DS_Store",
  "Thumbs.db",
  "next-env.d.ts",
]);
const SKIP_EXT = new Set([".log", ".tsbuildinfo"]);

async function collect(dir: string, base: string, out: string[]): Promise<void> {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    const rel = base ? `${base}/${e.name}` : e.name;

    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name)) continue;
      await collect(full, rel, out);
    } else if (e.isFile()) {
      if (SKIP_FILES.has(e.name)) continue;
      if (SKIP_EXT.has(path.extname(e.name))) continue;
      out.push(rel);
    }
  }
}

export async function GET(req: Request) {
  const raw = new URL(req.url).searchParams.get("raw") === "1";

  const files: string[] = [];
  try {
    await collect(ROOT, "", files);
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: `خواندن فایل‌ها ناموفق بود: ${(e as Error).message}` },
      { status: 500 }
    );
  }
  if (files.length === 0) {
    return NextResponse.json({ ok: false, error: "فایلی پیدا نشد" }, { status: 404 });
  }

  // ساخت zip در حافظه (کد منبع کوچک است، پس امن است)
  const chunks: Buffer[] = [];
  const archive = new ZipArchive({ zlib: { level: 9 } });

  archive.on("data", (c: Buffer) => chunks.push(c));

  const done = new Promise<void>((resolve, reject) => {
    archive.on("end", () => resolve());
    archive.on("close", () => resolve());
    archive.on("error", (e: Error) => reject(e));
  });

  for (const rel of files) {
    try {
      const buf = await readFile(path.join(ROOT, rel));
      archive.append(buf, { name: rel });
    } catch {
      /* فایل خوانده نشد، رد شو */
    }
  }
  await archive.finalize();
  await done;

  const zip = Buffer.concat(chunks);
  const sizeKB = Math.round(zip.length / 1024);

  // حالت مستقیم — اگر پروکسی اجازه دهد
  if (raw) {
    return new NextResponse(new Uint8Array(zip), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="daftar-sakhteman-liara.zip"',
        "Content-Length": String(zip.length),
        "Cache-Control": "no-store",
      },
    });
  }

  const b64 = zip.toString("base64");

  // پروکسی بعضی محیط‌ها دانلود مستقیم فایل را 403 می‌کند،
  // پس zip را داخل یک صفحه HTML به‌صورت data URI می‌گذاریم.
  const html = `<!doctype html>
<html lang="fa" dir="rtl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>دانلود کد — دفتر ساختمان</title>
<style>
 @font-face{font-family:V;src:url("https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/fonts/webfonts/Vazirmatn%5Bwght%5D.woff2") format("woff2-variations");font-weight:100 900}
 *{box-sizing:border-box}
 body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;
  background:#080e1a;background-image:radial-gradient(900px 420px at 85% 0,rgba(16,185,129,.14),transparent 60%),radial-gradient(700px 420px at 5% 100%,rgba(56,189,248,.12),transparent 55%);
  font-family:V,Tahoma,sans-serif;color:#e2e8f0}
 .box{max-width:600px;width:100%;border:1px solid #25324a;border-radius:20px;padding:32px;
  background:linear-gradient(160deg,rgba(28,38,55,.94),rgba(17,26,43,.94));box-shadow:0 24px 70px -20px rgba(0,0,0,.75);text-align:center}
 h1{font-size:19px;margin:0 0 8px;color:#34d399}
 p{font-size:13px;color:#94a3b8;line-height:1.9;margin:0 0 20px}
 .big{display:block;padding:16px 30px;border-radius:14px;text-decoration:none;font-size:15px;font-weight:700;
  background:linear-gradient(to left,#10b981,#0d9488);color:#fff;box-shadow:0 14px 32px -12px rgba(16,185,129,.65);margin:0 auto 14px}
 .big:active{transform:scale(.98)}
 .meta{font-size:12px;color:#64748b;margin-top:18px}
 ol{text-align:right;font-size:12.5px;line-height:2.1;color:#cbd5e1;background:#101a2b;padding:16px 16px 16px 34px;border-radius:12px;margin-top:20px}
 code{background:#0d1524;padding:2px 7px;border-radius:6px;font-size:11.5px;color:#34d399;direction:ltr;display:inline-block}
 .alt{margin-top:14px;font-size:12px;color:#64748b}
 .alt a{color:#38bdf8}
 #st{font-size:12px;color:#fbbf24;margin-top:10px;min-height:18px}
</style></head><body><div class="box">
<h1>✅ کد آماده دانلود است</h1>
<p>این zip ساختار درستی دارد — فایل‌ها مستقیم در ریشه هستند،<br>پس در لیارا خطای <code>COPY failed</code> نمی‌دهد.</p>

<a id="dl" class="big" download="daftar-sakhteman-liara.zip"
   href="data:application/zip;base64,${b64}">
  📥 دانلود daftar-sakhteman-liara.zip
</a>
<div id="st"></div>

<ol>
  <li>روی دکمه بالا بزن تا دانلود شود</li>
  <li>در لیارا، همان‌جایی که قبلاً zip را drag کردی، این فایل را بکش و بنداز</li>
  <li>صبر کن تا Deploy تمام شود</li>
  <li>باز کن: <code>/api/diagnose</code></li>
  <li>باز کن: <code>/api/setup?key=daftar-1404</code></li>
</ol>

<div class="meta">${files.length} فایل &nbsp;|&nbsp; ${sizeKB} کیلوبایت</div>
<div class="alt">اگر دکمه کار نکرد، <a href="?raw=1">اینجا را بزن</a> (دانلود مستقیم)</div>

<script>
 document.getElementById('dl').addEventListener('click',function(){
   document.getElementById('st').textContent='در حال دانلود... اگر چیزی نیامد، لینک پایین را بزن.';
 });
</script>
</div></body></html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}
