/* Rajasthan Kaam service worker — offline support for low-connectivity users. */
const VERSION = "v2";
const STATIC = `rk-static-${VERSION}`;
const PAGES = "rk-pages-v1";
const SAVED = "rk-saved-pages-v1"; // written by the "Save for offline" button; never expired automatically
const OFFLINE_URL = "/offline";
const MAX_PAGES = 40;

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(STATIC);
    await cache.addAll([OFFLINE_URL, "/manifest.webmanifest", "/icon.svg"]);
    // the offline page must be able to run its own scripts and styles without a network
    try {
      const html = await (await cache.match(OFFLINE_URL)).text();
      const assets = [...new Set(html.match(/\/_next\/static\/[^"'\s)]+/g) || [])];
      await cache.addAll(assets);
    } catch { /* best effort */ }
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => (k.startsWith("rk-static-") || k.startsWith("rk-pages-")) && k !== STATIC && k !== PAGES).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

async function trim(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  for (const k of keys.slice(0, Math.max(0, keys.length - max))) await cache.delete(k);
}

function timeout(ms) {
  return new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms));
}

// pages that are worth keeping for offline reading (public job/business/safety pages)
const CACHEABLE_PAGE = /^\/(jobs(\/\d+)?|employers\/\d+|safety|letters\/[A-Z0-9-]+)?$/;

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // immutable build assets and fonts: cache first
  if (url.pathname.startsWith("/_next/static/") || /\.(woff2?|svg|png|ico)$/.test(url.pathname)) {
    event.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(STATIC).then((c) => c.put(req, copy)); }
        return res;
      })),
    );
    return;
  }

  // full page loads: network first (with a timeout for slow 2G), fall back to saved copies
  if (req.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const res = await Promise.race([fetch(req), timeout(8000)]);
        if (res.ok && CACHEABLE_PAGE.test(url.pathname) && !url.search) {
          const copy = res.clone();
          caches.open(PAGES).then((c) => c.put(url.pathname, copy)).then(() => trim(PAGES, MAX_PAGES));
        }
        return res;
      } catch {
        const hit = (await caches.match(url.pathname, { cacheName: SAVED })) || (await caches.match(url.pathname, { cacheName: PAGES }));
        return hit || (await caches.match(OFFLINE_URL)) || Response.error();
      }
    })());
  }
});
