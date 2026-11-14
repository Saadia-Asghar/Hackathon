// SignBridge service worker: makes the app work offline.
// Heavy static assets (models, wasm, sign videos) = cache-first.
// Pages = network-first, falling back to cache. /api/* is never cached.
const CACHE = "signbridge-v1";
const PRECACHE = [
  "/", "/translate", "/speak", "/learn", "/dictionary", "/sos", "/contribute", "/conversation",
  "/mediapipe/hand_landmarker.task", "/mediapipe/pose_landmarker_lite.task",
];
const CACHE_FIRST = [/^\/mediapipe\//, /^\/ort\//, /^\/models\//, /^\/signs\//, /^\/_next\/static\//];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => Promise.all(PRECACHE.map((u) => c.add(u).catch(() => undefined)))),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  if (CACHE_FIRST.some((r) => r.test(url.pathname))) {
    event.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
      })),
    );
    return;
  }

  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match("/"))),
  );
});
