/*
  KAKEIBO – service worker (the part that makes the app work offline).

  What it does:
    1. The first time the app opens, it saves a copy of every app file
       on the phone.
    2. After that, the app opens from that saved copy, so it works with
       no signal and opens quickly.
    3. Your money data is NOT here. That lives in the phone's database
       (IndexedDB) and is never sent anywhere.

  When you change any app file: change VERSION below (e.g. "v2" → "v3").
  The phone then notices the change, saves the new copy, and uses it the
  next time the app is opened.
*/
const VERSION = "kakeibo-v1";

/* Every file the app needs */
const FILES = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./fonts/jost-latin.woff2",
  "./fonts/marcellus-latin.woff2",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png"
];

/* 1. Save a copy of every file */
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(VERSION)
      .then(cache => cache.addAll(FILES))
      .then(() => self.skipWaiting())        // use the new copy as soon as it's saved
  );
});

/* 2. Throw away copies from older versions */
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(names => Promise.all(names.filter(n => n !== VERSION).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

/* 3. Answer every request from the saved copy, falling back to the internet */
self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;

  event.respondWith(
    caches.match(request, { ignoreSearch: true }).then(saved => {
      if (saved) return saved;
      return fetch(request).catch(() =>
        // Offline and not saved: opening the app still shows the app
        request.mode === "navigate" ? caches.match("./index.html") : Response.error()
      );
    })
  );
});
