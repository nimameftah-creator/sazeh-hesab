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

export async function GET() {
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

  return new NextResponse(new Uint8Array(zip), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="daftar-sakhteman-liara.zip"',
      "Content-Length": String(zip.length),
      "Cache-Control": "no-store",
    },
  });
}
