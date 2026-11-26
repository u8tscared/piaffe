/* Stabl · service worker : coque hors ligne seulement. Jamais de cache pour l'API, l'authentification ni la passerelle. */
const VERSION = '__VERSION__';
const SHELL = 'piaffe-shell-' + VERSION;
const ASSETS = ['/', '/manifest.webmanifest', '/icon.svg', '/icon-192.png', '/icon-512.png'];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => c.addAll(ASSETS)).catch(() => {}).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('piaffe-shell-') && k !== SHELL).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  if (/^\/(api|auth|ics|webhooks|migration|admin)(\/|$)/.test(url.pathname)) return;
  /* navigation : réseau d'abord (version à jour), coque en cache si hors ligne */
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then((r) => { if (r.ok) { const cp = r.clone(); caches.open(SHELL).then((c) => c.put('/', cp)); } return r; })
      .catch(() => caches.match('/').then((r) => r || new Response('Hors ligne', { status: 503, headers: { 'content-type': 'text/plain; charset=utf-8' } }))));
    return;
  }
  if (ASSETS.includes(url.pathname)) e.respondWith(caches.match(req).then((r) => r || fetch(req)));
});
