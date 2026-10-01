/* Service worker de Cauce / Smart APR (PWA).
 * Estrategia:
 *  - Assets estáticos de Next (_next/static, íconos, brand): cache-first.
 *  - Navegaciones (HTML): network-first, fallback al cache offline.
 *  - API Yggdra y mutaciones: passthrough (sin cachear).
 *
 * El build se lee de ?v= en la URL de registro (ServiceWorkerRegister).
 * Al cambiar v, activate borra caches de builds anteriores.
 */

const BUILD =
  (typeof self !== "undefined" &&
    self.location &&
    new URL(self.location.href).searchParams.get("v")) ||
  "dev";
const STATIC_CACHE = "cauce-static-" + BUILD;
const PAGES_CACHE = "cauce-pages-" + BUILD;

const APP_SHELL = [
  "/",
  "/login",
  "/dashboard",
  "/meters",
  "/readings",
  "/billing",
  "/sales",
  "/profile",
  "/cash-register",
  "/customers",
  "/survey/view",
  "/manifest.webmanifest",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/icons/icon-512x512-maskable.png",
];

const STATIC_RE = /\/_next\/static\//;
const SAME_ORIGIN = new RegExp("^" + self.location.origin);
const PAGES_CACHE_MAX = 60;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) =>
        Promise.allSettled(APP_SHELL.map((url) => cache.add(url)))
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== STATIC_CACHE && k !== PAGES_CACHE)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data || typeof data !== "object") return;
  if (data.type === "GET_VERSION") {
    event.ports?.[0]?.postMessage({ build: BUILD });
  }
  if (data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || !SAME_ORIGIN.test(request.url)) return;

  const url = new URL(request.url);

  // Nunca cachear llamadas a la API (aunque compartan origen vía proxy).
  if (url.pathname.startsWith("/api/") || url.hostname.includes("yggdra")) {
    return;
  }

  if (STATIC_RE.test(url.pathname) || url.pathname.startsWith("/icons/") || url.pathname.startsWith("/brand/")) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const res = await fetch(request);
        if (res.ok) cache.put(request, res.clone());
        return res;
      })
    );
    return;
  }

  if (request.mode === "navigate" || request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(request);
          const cache = await caches.open(PAGES_CACHE);
          if (res.ok) {
            cache.put(request, res.clone());
            const keys = await cache.keys();
            if (keys.length > PAGES_CACHE_MAX) {
              await cache.delete(keys[0]);
            }
          }
          return res;
        } catch {
          const cache = await caches.open(PAGES_CACHE);
          const cached = await cache.match(request);
          if (cached) return cached;
          return (
            (await cache.match("/")) ||
            new Response("Offline", { status: 503, statusText: "Offline" })
          );
        }
      })()
    );
  }
});
