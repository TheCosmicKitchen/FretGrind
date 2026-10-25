// Offline cache. Bump CACHE when you deploy changes so users get the new files.
const CACHE = "fret-grind-v17";
const ASSETS = [
  "./", "index.html", "css/styles.css", "manifest.webmanifest",
  "icons/icon.svg", "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png",
  ...[
    "js/cards/mine.js",
    "js/cards/page.js",
    "js/cards/questions.js",
    "js/cards/scheduler.js",
    "js/core/audio.js",
    "js/core/bus.js",
    "js/core/decks.js",
    "js/core/dom.js",
    "js/core/listen-io.js",
    "js/core/listen-ui.js",
    "js/core/listen-worklet.js",
    "js/core/listen.js",
    "js/core/mic.js",
    "js/core/pitch.js",
    "js/core/store.js",
    "js/core/theory.js",
    "js/courses/curriculum.js",
    "js/courses/drills.js",
    "js/courses/dsl.js",
    "js/courses/figures.js",
    "js/courses/guitar/g1.js",
    "js/courses/guitar/g10.js",
    "js/courses/guitar/g2.js",
    "js/courses/guitar/g3.js",
    "js/courses/guitar/g4.js",
    "js/courses/guitar/g5.js",
    "js/courses/guitar/g6.js",
    "js/courses/guitar/g7.js",
    "js/courses/guitar/g8.js",
    "js/courses/guitar/g9.js",
    "js/courses/map.js",
    "js/courses/motion-view.js",
    "js/courses/motion.js",
    "js/courses/page.js",
    "js/courses/progress.js",
    "js/courses/runner.js",
    "js/courses/theory/t1.js",
    "js/courses/theory/t10.js",
    "js/courses/theory/t11.js",
    "js/courses/theory/t2.js",
    "js/courses/theory/t3.js",
    "js/courses/theory/t4.js",
    "js/courses/theory/t5.js",
    "js/courses/theory/t6.js",
    "js/courses/theory/t7.js",
    "js/courses/theory/t8.js",
    "js/courses/theory/t9.js",
    "js/courses/today.js",
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
    "js/songs/grade.js",
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
