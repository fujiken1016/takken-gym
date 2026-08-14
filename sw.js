const CACHE = 'takken-gym-v11';
// URLは必ず200を返す正規形（.html なし）で並べる。.html を書くと308リダイレクトを踏む。
const ASSETS = ['/', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png', '/icon-180.png', '/legal.css', '/about', '/privacy', '/disclaimer', '/contact', '/og.png', '/courses/', '/ichimon/', '/ichimon/gyoho', '/ichimon/kenri', '/ichimon/horei', '/ichimon/zei', '/blog/takken-dokugaku-benkyohou', '/blog/takken-benkyo-jikan'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== location.origin) return;
  // ページ本体はネット優先（更新を確実に反映）→ オフライン時はキャッシュ
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put('/', cp)); return r; })
        .catch(() => caches.match('/'))
    );
    return;
  }
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(r => {
      const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); return r;
    }).catch(() => hit))
  );
});
