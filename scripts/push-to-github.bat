@echo off
REM ═══════════════════════════════════════════════════════
REM  دفتر ساختمان — ارسال کد به گیت‌هاب (ویندوز)
REM ═══════════════════════════════════════════════════════
REM  در CMD یا PowerShell داخل پوشه پروژه اجرا کن:
REM      scripts\push-to-github.bat
REM ═══════════════════════════════════════════════════════

chcp 65001 >nul
cd /d "%~dp0\.."

echo ════════════════════════════════════════════
echo    دفتر ساختمان — ارسال به گیت‌هاب
echo ════════════════════════════════════════════
echo.

where git >nul 2>&1
if errorlevel 1 (
    echo [X] git نصب نیست. از git-scm.com نصبش کن.
    pause
    exit /b 1
)

if not exist .git (
    echo [*] مخزن گیت ساخته می‌شود...
    git init -q -b main
)

set /p GH_USER="نام کاربری گیت‌هاب: "
set /p GH_REPO="نام ریپازیتوری [daftar-sakhteman]: "
if "%GH_REPO%"=="" set GH_REPO=daftar-sakhteman

echo.
echo [!] قبل از ادامه مطمئن شو:
echo     ۱. در گیت‌هاب یک ریپازیتوری خالی به نام %GH_REPO% ساختی
echo     ۲. موقع ساخت تیک README و .gitignore را نزدی
echo.
set /p OK="انجام شد؟ (y/n): "
if /i not "%OK%"=="y" (
    echo لغو شد.
    pause
    exit /b 0
)

REM بررسی اینکه .env کامیت نشود
git ls-files --error-unmatch .env >nul 2>&1
if not errorlevel 1 (
    echo [X] خطر! فایل .env در مخزن است. اول اجرا کن:
    echo     git rm --cached .env
    pause
    exit /b 1
)
echo [OK] .env امن است

git config user.email "%GH_USER%@users.noreply.github.com" >nul 2>&1
git config user.name "%GH_USER%" >nul 2>&1

git add -A
git diff --cached --quiet
if errorlevel 1 (
    git commit -q -m "به‌روزرسانی دفتر ساختمان"
    echo [OK] کامیت شد
) else (
    echo [i] تغییر جدیدی نیست
)

git remote remove origin >nul 2>&1
git remote add origin https://github.com/%GH_USER%/%GH_REPO%.git
git branch -M main

echo.
echo [*] در حال ارسال...
echo [!] اگر رمز پرسید، Personal Access Token بزن نه رمز عبور
echo.

git push -u origin main
if errorlevel 1 (
    echo.
    echo [X] ارسال ناموفق. دلایل رایج:
    echo     - ریپازیتوری در گیت‌هاب ساخته نشده
    echo     - نام ریپازیتوری اشتباه است
    echo     - توکن دسترسی ندارد
    echo     - رمز عبور زدی به‌جای توکن
    pause
    exit /b 1
)

echo.
echo ════════════════════════════════════════════
echo    [OK] با موفقیت ارسال شد!
echo ════════════════════════════════════════════
echo.
echo    ریپازیتوری: https://github.com/%GH_USER%/%GH_REPO%
echo.
echo قدم بعدی:
echo    ۱. برو به https://console.liara.ir
echo    ۲. دیتابیس PostgreSQL ۱۶ بساز
echo    ۳. برنامه NextJS با شناسه daftar-sakhteman بساز
echo    ۴. متغیر DATABASE_URL را تنظیم کن
echo    ۵. تنظیمات برنامه - اتصال به Git - این ریپازیتوری
echo.
pause
