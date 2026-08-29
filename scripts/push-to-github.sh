#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════
# دفتر ساختمان — ارسال کد به گیت‌هاب
# ═══════════════════════════════════════════════════════════
# این اسکریپت را در پوشه پروژه اجرا کن:
#     bash scripts/push-to-github.sh
#
# نام کاربری و توکن را از تو می‌پرسد و هیچ‌جا ذخیره نمی‌کند.
# ═══════════════════════════════════════════════════════════

set -e

G='\033[0;32m'; Y='\033[1;33m'; R='\033[0;31m'; B='\033[1;34m'; N='\033[0m'

echo -e "${B}════════════════════════════════════════════${N}"
echo -e "${B}   دفتر ساختمان — ارسال به گیت‌هاب${N}"
echo -e "${B}════════════════════════════════════════════${N}"
echo

# ── بررسی پیش‌نیازها ──────────────────────────────────────
command -v git >/dev/null 2>&1 || { echo -e "${R}❌ git نصب نیست. از git-scm.com نصبش کن.${N}"; exit 1; }

cd "$(dirname "$0")/.." || exit 1

if [ ! -d .git ]; then
  echo -e "${Y}⚙️  مخزن گیت ساخته می‌شود...${N}"
  git init -q -b main
fi

# ── گرفتن اطلاعات ─────────────────────────────────────────
read -rp "$(echo -e ${G})نام کاربری گیت‌هاب: $(echo -e ${N})" GH_USER
read -rp "$(echo -e ${G})نام ریپازیتوری [daftar-sakhteman]: $(echo -e ${N})" GH_REPO
GH_REPO=${GH_REPO:-daftar-sakhteman}

echo
echo -e "${Y}⚠️  قبل از ادامه، مطمئن شو:${N}"
echo -e "   ۱. در گیت‌هاب یک ریپازیتوری ${B}خالی${N} به نام ${B}${GH_REPO}${N} ساختی"
echo -e "   ۲. موقع ساخت، تیک ${B}README${N} و ${B}.gitignore${N} را ${R}نزدی${N}"
echo
read -rp "$(echo -e ${G})انجام شد؟ (y/n): $(echo -e ${N})" OK
[ "$OK" != "y" ] && { echo -e "${R}لغو شد.${N}"; exit 0; }

# ── اطمینان از اینکه .env کامیت نمی‌شود ───────────────────
if git ls-files --error-unmatch .env >/dev/null 2>&1; then
  echo -e "${R}❌ خطر! فایل .env در مخزن است. اول این را اجرا کن:${N}"
  echo -e "   git rm --cached .env"
  exit 1
fi
echo -e "${G}✓ .env امن است (کامیت نمی‌شود)${N}"

# ── تنظیم هویت ────────────────────────────────────────────
git config user.email "${GH_USER}@users.noreply.github.com" 2>/dev/null || true
git config user.name "${GH_USER}" 2>/dev/null || true

# ── کامیت ─────────────────────────────────────────────────
git add -A
if git diff --cached --quiet; then
  echo -e "${Y}ℹ️  تغییر جدیدی برای کامیت نیست${N}"
else
  git commit -q -m "به‌روزرسانی دفتر ساختمان"
  echo -e "${G}✓ کامیت شد${N}"
fi

# ── تنظیم remote ──────────────────────────────────────────
git remote remove origin 2>/dev/null || true
git remote add origin "https://github.com/${GH_USER}/${GH_REPO}.git"
git branch -M main

# ── push ──────────────────────────────────────────────────
echo
echo -e "${B}در حال ارسال...${N}"
echo -e "${Y}(اگر نام کاربری و رمز پرسید، رمز = Personal Access Token است نه رمز عبور)${N}"
echo

if git push -u origin main; then
  echo
  echo -e "${G}════════════════════════════════════════════${N}"
  echo -e "${G}   ✅ با موفقیت ارسال شد!${N}"
  echo -e "${G}════════════════════════════════════════════${N}"
  echo
  echo -e "   ریپازیتوری: ${B}https://github.com/${GH_USER}/${GH_REPO}${N}"
  echo
  echo -e "${Y}قدم بعدی:${N}"
  echo -e "   ۱. برو به ${B}https://console.liara.ir${N}"
  echo -e "   ۲. دیتابیس PostgreSQL ۱۶ بساز"
  echo -e "   ۳. برنامه NextJS با شناسه ${B}daftar-sakhteman${N} بساز"
  echo -e "   ۴. متغیر ${B}DATABASE_URL${N} را تنظیم کن"
  echo -e "   ۵. در تنظیمات برنامه ← ${B}اتصال به Git${N} ← این ریپازیتوری"
  echo
else
  echo
  echo -e "${R}❌ ارسال ناموفق بود. دلایل رایج:${N}"
  echo -e "   • ریپازیتوری در گیت‌هاب ساخته نشده"
  echo -e "   • نام ریپازیتوری اشتباه است"
  echo -e "   • توکن دسترسی ندارد (باید تیک ${B}repo${N} یا ${B}Contents: Read and write${N} داشته باشد)"
  echo -e "   • رمز عبور زدی به‌جای توکن"
  exit 1
fi
