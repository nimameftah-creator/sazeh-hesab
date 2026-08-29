/**
 * دفتر ساختمان — نسخه دسکتاپ (Electron)
 * ═══════════════════════════════════════════════════════════
 * آدرس سرور به سه روش تعیین می‌شود (به ترتیب اولویت):
 *   ۱) متغیر محیطی DAFTAR_APP_URL
 *   ۲) فایل تنظیمات ذخیره‌شده (از منوی «تغییر آدرس سرور» در برنامه)
 *   ۳) مقدار پیش‌فرض: http://localhost:3000
 *
 * یعنی برای عوض کردن آدرس سرور، نیازی به ساخت دوباره فایل نصبی نیست.
 */

const { app, BrowserWindow, Menu, shell, dialog } = require("electron");
const path = require("path");
const fs = require("fs");

const APP_NAME = "دفتر ساختمان";
const DEFAULT_URL = "http://localhost:3000";
const OFFLINE_FILE = path.join(__dirname, "offline.html");

/* ── به‌روزرسانی خودکار ─────────────────────────────────────
 * فقط در نسخه نصب‌شده کار می‌کند (نه حالت npm start).
 * اگر سرور به‌روزرسانی پیکربندی نشده باشد، بی‌صدا رد می‌شود.
 * ────────────────────────────────────────────────────────── */
let updater = null;
let updateChecked = false;

function initAutoUpdater() {
  // در حالت توسعه فایل نصبی وجود ندارد
  if (!app.isPackaged) return;
  try {
    // eslint-disable-next-line global-require
    const { autoUpdater } = require("electron-updater");
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = true;

    autoUpdater.on("update-available", async (info) => {
      const { response } = await dialog.showMessageBox(mainWindow, {
        type: "info",
        title: "به‌روزرسانی موجود است",
        message: `نسخه جدید ${info.version} آماده است`,
        detail: `نسخه فعلی: ${app.getVersion()}\n\nالان دانلود شود؟`,
        buttons: ["دانلود کن", "بعداً"],
        defaultId: 0,
        cancelId: 1,
      });
      if (response === 0) autoUpdater.downloadUpdate().catch(() => undefined);
    });

    autoUpdater.on("download-progress", (p) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.setProgressBar(Math.max(0, Math.min(1, p.percent / 100)));
      }
    });

    autoUpdater.on("update-downloaded", async (info) => {
      if (mainWindow && !mainWindow.isDestroyed()) mainWindow.setProgressBar(-1);
      const { response } = await dialog.showMessageBox(mainWindow, {
        type: "info",
        title: "به‌روزرسانی آماده است",
        message: `نسخه ${info.version} دانلود شد`,
        detail: "با بستن برنامه، به‌روزرسانی نصب می‌شود.\n\nالان نصب شود؟",
        buttons: ["الان نصب کن", "بعداً (هنگام خروج)"],
        defaultId: 0,
        cancelId: 1,
      });
      if (response === 0) autoUpdater.quitAndInstall();
    });

    autoUpdater.on("error", () => {
      /* سرور به‌روزرسانی در دسترس نیست — بی‌صدا رد شو */
      if (mainWindow && !mainWindow.isDestroyed()) mainWindow.setProgressBar(-1);
    });

    updater = autoUpdater;
    updateChecked = true;

    // بررسی هنگام باز شدن برنامه (با کمی تأخیر تا برنامه اول بالا بیاید)
    setTimeout(() => autoUpdater.checkForUpdates().catch(() => undefined), 4000);
  } catch {
    /* electron-updater نصب نیست — بدون آپدیت خودکار ادامه بده */
  }
}

async function checkForUpdatesManually() {
  if (!updater) {
    await dialog.showMessageBox(mainWindow, {
      type: "info",
      title: "به‌روزرسانی",
      message: app.isPackaged
        ? "سرور به‌روزرسانی پیکربندی نشده است."
        : "در حالت توسعه، به‌روزرسانی خودکار فعال نیست.",
      detail:
        "برای فعال‌سازی، در فایل desktop/package.json بخش «publish» را\n" +
        "به آدرس سرور خودت تغییر بده و دوباره npm run dist:win را بزن.\n\n" +
        "نسخه فعلی: " +
        app.getVersion(),
      buttons: ["باشه"],
    });
    return;
  }
  await dialog.showMessageBox(mainWindow, {
    type: "info",
    title: "به‌روزرسانی",
    message: "در حال بررسی نسخه جدید...",
    buttons: ["باشه"],
  });
  updater.checkForUpdates().catch(() => undefined);
}

/* ============ مدیریت آدرس سرور ============ */
function configPath() {
  return path.join(app.getPath("userData"), "config.json");
}

function readConfig() {
  try {
    return JSON.parse(fs.readFileSync(configPath(), "utf8"));
  } catch {
    return {};
  }
}

function writeConfig(cfg) {
  try {
    fs.writeFileSync(configPath(), JSON.stringify(cfg, null, 2), "utf8");
  } catch {
    /* بی‌خطر */
  }
}

function currentUrl() {
  return process.env.DAFTAR_APP_URL || readConfig().appUrl || DEFAULT_URL;
}

/* ============ آیکون ============ */
function appIcon() {
  if (process.platform === "win32") return path.join(__dirname, "build", "icon.ico");
  return path.join(__dirname, "build", "icon.png");
}

/* ============ فقط یک نسخه باز باشد ============ */
if (!app.requestSingleInstanceLock()) {
  app.quit();
}

let mainWindow = null;

/* ============ ذخیره اندازه و موقعیت پنجره ============ */
function stateFile() {
  return path.join(app.getPath("userData"), "window-state.json");
}
function loadWindowState() {
  try {
    return JSON.parse(fs.readFileSync(stateFile(), "utf8"));
  } catch {
    return { width: 1360, height: 880 };
  }
}
function saveWindowState() {
  if (!mainWindow) return;
  try {
    fs.writeFileSync(stateFile(), JSON.stringify(mainWindow.getBounds()), "utf8");
  } catch {
    /* بی‌خطر */
  }
}

/* ============ ساخت پنجره ============ */
function createWindow() {
  const st = loadWindowState();

  mainWindow = new BrowserWindow({
    width: st.width || 1360,
    height: st.height || 880,
    x: st.x,
    y: st.y,
    minWidth: 420,
    minHeight: 600,
    title: APP_NAME,
    icon: appIcon(),
    backgroundColor: "#080e1a",
    autoHideMenuBar: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false,
    },
  });

  mainWindow.once("ready-to-show", () => mainWindow.show());
  mainWindow.on("close", saveWindowState);
  mainWindow.on("resize", saveWindowState);
  mainWindow.on("move", saveWindowState);

  loadApp();

  /* خطای بارگذاری = اینترنت یا سرور در دسترس نیست */
  mainWindow.webContents.on("did-fail-load", (_e, code, _desc, _url, isMainFrame) => {
    if (isMainFrame && code !== -3) mainWindow.loadFile(OFFLINE_FILE);
  });

  /* لینک بیرونی در مرورگر باز شود */
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith(currentUrl())) {
      shell.openExternal(url);
      return { action: "deny" };
    }
    return { action: "allow" };
  });

  buildMenu();
}

function loadApp() {
  if (!mainWindow) return;
  mainWindow.loadURL(currentUrl());
}

/* ============ تغییر آدرس سرور بدون ساخت دوباره ============ */
async function changeServerUrl() {
  const { value, canceled } = await dialog.showMessageBox(mainWindow, {
    type: "question",
    title: "تغییر آدرس سرور",
    message: "آدرس سرور برنامه را وارد کنید",
    detail:
      "اگر برنامه را روی همین کامپیوتر اجرا می‌کنی:\n" +
      "    http://localhost:3000\n\n" +
      "اگر روی سرور یا دامنه خودت است، همان آدرس را بنویس:\n" +
      "    https://my-domain.com\n\n" +
      "آدرس فعلی: " +
      currentUrl(),
    buttons: ["تغییر آدرس", "انصراف"],
    defaultId: 0,
    cancelId: 1,
  });
  if (canceled || value !== 0) return;

  const input = await promptUrl();
  if (!input) return;

  writeConfig({ ...readConfig(), appUrl: input });
  await dialog.showMessageBox(mainWindow, {
    type: "info",
    title: "ذخیره شد",
    message: "آدرس سرور ذخیره شد",
    detail: input + "\n\nبرنامه در حال بارگذاری از آدرس جدید است.",
    buttons: ["باشه"],
  });
  loadApp();
}

/** یک پنجره کوچک برای گرفتن آدرس (چون Electron ورودی متنی آماده ندارد) */
function promptUrl() {
  return new Promise((resolve) => {
    const win = new BrowserWindow({
      width: 520,
      height: 210,
      resizable: false,
      minimizable: false,
      maximizable: false,
      parent: mainWindow,
      modal: true,
      title: "آدرس سرور",
      backgroundColor: "#080e1a",
      webPreferences: { nodeIntegration: false, contextIsolation: true },
    });

    const url = currentUrl();
    const html = `<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8">
      <style>
        body{margin:0;padding:20px;background:#080e1a;color:#e2e8f0;
             font-family:"Segoe UI",Tahoma,sans-serif}
        label{display:block;font-size:12px;color:#94a3b8;margin-bottom:8px}
        input{width:100%;box-sizing:border-box;padding:10px 12px;border-radius:10px;
              border:1px solid #25324a;background:#101a2b;color:#f8fafc;font-size:14px;
              direction:ltr;text-align:left;outline:none}
        input:focus{border-color:#10b981}
        .row{display:flex;gap:8px;margin-top:16px;justify-content:flex-end}
        button{padding:9px 20px;border:0;border-radius:10px;font-size:13px;cursor:pointer;
               font-family:inherit}
        .ok{background:linear-gradient(to left,#10b981,#0d9488);color:#fff}
        .no{background:#25324a;color:#cbd5e1}
        .hint{font-size:11px;color:#64748b;margin-top:10px;line-height:1.7}
      </style></head><body>
      <label>آدرس سرور برنامه</label>
      <input id="u" value="${url}" autofocus />
      <div class="hint">برای اجرای محلی: http://localhost:3000</div>
      <div class="row">
        <button class="no" onclick="window.close()">انصراف</button>
        <button class="ok" onclick="done()">ذخیره</button>
      </div>
      <script>
        const i=document.getElementById('u');i.focus();i.select();
        i.addEventListener('keydown',e=>{if(e.key==='Enter')done()});
        function done(){
          const v=i.value.trim().replace(/\\/+$/,'');
          if(!v) return;
          document.title='SET::'+v;
          window.close();
        }
      </script></body></html>`;

    win.loadURL("data:text/html;charset=utf-8," + encodeURIComponent(html));
    win.on("page-title-updated", (e, title) => {
      if (title.startsWith("SET::")) {
        e.preventDefault();
        resolve(title.slice(5));
      }
    });
    win.on("closed", () => resolve(null));
  });
}

/* ============ منوی فارسی ============ */
function buildMenu() {
  Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      {
        label: "برنامه",
        submenu: [
          { label: "بارگذاری دوباره", accelerator: "CmdOrCtrl+R", click: () => mainWindow?.webContents.reload() },
          { label: "بازگشت به داشبورد", accelerator: "CmdOrCtrl+Home", click: () => loadApp() },
          { type: "separator" },
          { label: "تغییر آدرس سرور...", click: () => changeServerUrl() },
          { label: "بررسی به‌روزرسانی...", click: () => checkForUpdatesManually() },
          {
            label: "بازکردن در مرورگر",
            click: () => shell.openExternal(currentUrl()),
          },
          { type: "separator" },
          { label: "بزرگ‌نمایی", accelerator: "CmdOrCtrl+=", click: () => zoom(0.5) },
          { label: "کوچک‌نمایی", accelerator: "CmdOrCtrl+-", click: () => zoom(-0.5) },
          { label: "اندازه اصلی", accelerator: "CmdOrCtrl+0", click: () => mainWindow?.webContents.setZoomLevel(0) },
          { type: "separator" },
          { role: "quit", label: "خروج" },
        ],
      },
      {
        label: "پیمایش",
        submenu: [
          { role: "back", label: "عقب" },
          { role: "forward", label: "جلو" },
          { role: "reload", label: "بارگذاری مجدد" },
        ],
      },
      {
        label: "راهنما",
        submenu: [
          {
            label: "درباره برنامه",
            click: () =>
              dialog.showMessageBox(mainWindow, {
                type: "info",
                title: `درباره ${APP_NAME}`,
                icon: appIcon(),
                message: APP_NAME,
                detail:
                  `نسخه دسکتاپ ${app.getVersion()}\n\n` +
                  `آدرس سرور فعلی:\n${currentUrl()}\n\n` +
                  "برای تغییر آدرس: منوی «برنامه» ← «تغییر آدرس سرور»",
                buttons: ["باشه"],
              }),
          },
        ],
      },
    ])
  );
}

function zoom(delta) {
  if (!mainWindow) return;
  const wc = mainWindow.webContents;
  wc.setZoomLevel(wc.getZoomLevel() + delta);
}

/* ============ چرخه عمر ============ */
app.on("second-instance", () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.whenReady().then(() => {
  createWindow();
  initAutoUpdater();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
