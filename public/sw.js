/* Service Worker — دفتر ساختمان
 * ═══════════════════════════════════════════════════════════
 * استراتژی کش:
 *   - دارایی‌های ثابت (_next/static, آیکون‌ها, فونت‌ها): cache-first
 *   - صفحات (navigation): network-first با fallback آفلاین
 *   - API و درخواست‌های غیر GET: هرگز کش نمی‌شوند
 *
 * به‌روزرسانی:
 *   هر بار که نسخه عوض می‌شود، SW جدید نصب می‌شود و به صفحه
 *   پیام «UPDATE_AVAILABLE» می‌دهد تا بنر به‌روزرسانی نمایش داده شود.
 * ═══════════════════════════════════════════════════════════ */

const VERSION = "daftar-sakhteman-v1.1.0";
const STATIC_CACHE = `${VERSION}-static`;
const PAGE_CACHE = `${VERSION}-pages`;

const PRECACHE = ["/offline.html", "/icon-192.png", "/icon-512.png", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
      .then(() =>
        // اطلاع به همه تب‌های باز: نسخه جدید فعال شد
        self.clients
          .matchAll({ type: "window" })
          .then((list) => list.forEach((c) => c.postMessage({ type: "SW_UPDATED", version: VERSION })))
      )
  );
});

function isImmutable(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icon-") ||
    url.pathname.startsWith("/apple-touch-icon") ||
    url.pathname === "/favicon-48.png" ||
    url.hostname === "cdn.jsdelivr.net" ||
    url.hostname === "db.onlinewebfonts.com"
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;
  if (!sameOrigin && !isImmutable(url)) return;

  // صفحات: network-first
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(PAGE_CACHE).then((cache) => cache.put(request, copy));
          }
          return res;
        })
        .catch(() => caches.match(request).then((hit) => hit || caches.match("/offline.html")))
    );
    return;
  }

  // دارایی‌های ثابت: cache-first
  if (isImmutable(url)) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((res) => {
            if (res.ok && (sameOrigin || url.hostname.includes("jsdelivr"))) {
              const copy = res.clone();
              caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
            }
            return res;
          })
      )
    );
    return;
  }

  // بقیه: stale-while-revalidate
  event.respondWith(
    caches.match(request).then((hit) => {
      const network = fetch(request)
        .then((res) => {
          if (res.ok && sameOrigin) {
            const copy = res.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
          }
          return res;
        })
        .catch(() => hit);
      return hit || network;
    })
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
  if (event.data === "GET_VERSION" && event.source) {
    event.source.postMessage({ type: "SW_VERSION", version: VERSION });
  }
});
