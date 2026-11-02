// Spor Defteri service worker: uygulamayı çevrimdışı çalıştırır.
// Sayfa için önce ağ denenir (güncellemeler hemen gelsin), ağ yoksa önbellekteki sürüm açılır.
// Yeni bir sürüm yayınlarken CACHE adını artır ki eski önbellek temizlensin.
const CACHE = "spor-defteri-v11";
const ASSETS = [
  "./",
  "./spor-defteri.html",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./icons/apple-touch-icon.png",
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res; })
        .catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match("./spor-defteri.html")))
    );
    return;
  }
  e.respondWith(caches.match(req).then(r => r || fetch(req)));
});
