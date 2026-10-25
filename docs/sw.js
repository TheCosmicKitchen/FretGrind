// Offline cache. Bump CACHE when you deploy changes so users get the new files.
const CACHE = "fret-grind-v12";
const ASSETS = [
  "./", "index.html", "css/styles.css", "manifest.webmanifest",
  "icons/icon.svg", "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png",
  ...[
    "js/cards/page.js",
    "js/cards/questions.js",
    "js/cards/scheduler.js",
    "js/core/audio.js",
    "js/core/bus.js",
    "js/core/decks.js",
    "js/core/dom.js",
    "js/core/mic.js",
    "js/core/pitch.js",
    "js/core/store.js",
    "js/core/theory.js",
    "js/games/page.js",
    "js/games/rhythm-patterns.js",
    "js/games/rhythm-view.js",
    "js/games/rhythm.js",
    "js/games/score.js",
    "js/games/songs.js",
    "js/library/catalog.js",
    "js/library/chorddb.js",
    "js/library/draw.js",
    "js/library/metronome.js",
    "js/library/pages.js",
    "js/main.js",
    "js/songs/data.js",
    "js/songs/draw.js",
    "js/songs/format.js",
    "js/songs/page.js",
    "js/songs/player.js",
    "js/songs/tabify.js",
    "js/view/chrome.js",
    "js/view/notation.js",
  ],
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Network-first so updates show up right away; fall back to cache when offline.
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    // cache:"no-cache" forces a revalidation, so GitHub Pages' 10-minute HTTP cache can't serve a stale copy
    fetch(e.request, { cache: "no-cache" })
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(e.request).then((r) => r || caches.match("index.html")))
  );
});
