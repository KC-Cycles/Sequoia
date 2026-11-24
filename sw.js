// Network first, so app updates arrive as soon as there is a connection.
// The cache is the fallback for opening Sequoia in a gym with no signal.
var CACHE = 'sequoia-shell-v8';
var SHELL = ['./', 'index.html', 'css/app.css', 'js/app.js', 'js/engine.js', 'js/figures.js', 'js/store.js', 'js/art.js', 'js/sync.js', 'js/coach.js', 'js/boot.js', 'js/version.js',
  'js/data/exercises.js', 'js/data/sessions.js', 'js/data/figs.js', 'js/data/notes.js',
  'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png',
  'art/today.webp', 'art/workout.webp', 'art/library.webp', 'art/progress.webp', 'art/coach.webp',
  'fonts/figtree-latin-400-normal.woff2', 'fonts/figtree-latin-500-normal.woff2', 'fonts/figtree-latin-600-normal.woff2', 'fonts/figtree-latin-700-normal.woff2',
  'fonts/zilla-slab-latin-600-normal.woff2', 'fonts/zilla-slab-latin-700-normal.woff2'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    // 'no-cache' makes the browser check with the server every time instead of trusting a copy it kept,
    // so a new version of the app shows up on the next open rather than minutes later.
    fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' }).then(function (res) {
      if (res && res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
      return res;
    }).catch(function () {
      return caches.match(req, { ignoreSearch: true }).then(function (hit) {
        return hit || (req.mode === 'navigate' ? caches.match('index.html') : Response.error());
      });
    })
  );
});
