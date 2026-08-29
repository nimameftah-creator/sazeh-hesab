/**
 * Preload — پل امن بین فرآیند اصلی و صفحه
 * contextIsolation فعال است، پس فقط APIهای محدود و امن در دسترس صفحه قرار می‌گیرند.
 */
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("daftarDesktop", {
  isDesktop: true,
  platform: process.platform,
  versions: {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node,
  },
});

// حذف خودکار این فایل در حالت وب (جلوگیری از خطا)
void ipcRenderer;
