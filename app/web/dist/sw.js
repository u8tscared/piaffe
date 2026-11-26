/* Stabl · service worker : l'appli complète est gardée sur l'appareil et s'ouvre sans réseau.
   - Précache versionné (une version = un cache) : la page de l'appli (tout le code y est), le manifeste, les icônes
     et les écrans de démarrage. Installation tout ou rien : un précache incomplet n'est jamais activé.
   - Navigation : la page en cache d'abord (ouverture instantanée, même sans réseau), le réseau en secours ;
     si rien n'est disponible, une page « hors ligne » propre (jamais de page blanche).
   - Polices et three.js (autres origines) : gardés au premier passage, réutilisés hors ligne.
   - Jamais de cache pour l'API, l'authentification, les calendriers, les webhooks ni la passerelle de migration :
     les données du club sont gardées par l'appli elle-même (IndexedDB) avec leur file de synchronisation.
   - Mise à jour : la nouvelle version s'installe en arrière-plan puis attend ; l'appli affiche « Recharger »
     et envoie SKIP_WAITING quand l'utilisateur le décide (ou tout de suite s'il n'est pas dans l'appli). */
const VERSION = '202611262354';
const SHELL = 'stabl-shell-' + VERSION;
const RUNTIME = 'stabl-runtime-v1';
const PRECACHE = ["/","/manifest.webmanifest","/vendor/three-r128.min.js","/icon-180.png","/icon-192.png","/icon-512.png","/icon-maskable-512.png","/icon.svg"];
const NETWORK_ONLY = /^\/(api|auth|ics|webhooks|migration|mcp|oauth|\.well-known|admin|c|s)(\/|$)/;
const OFFLINE_HTML = '<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>Stabl · hors ligne</title>' +
  '<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0a1636;color:#fff;font:16px/1.5 system-ui,-apple-system,sans-serif;text-align:center;padding:24px}' +
  'b{font-size:22px;display:block;margin-bottom:8px}button{margin-top:18px;font:600 16px system-ui;padding:12px 22px;border-radius:12px;border:0;background:#2f5bea;color:#fff}</style></head>' +
  '<body><div><b>Pas de connexion</b>Stabl n’a pas encore été enregistré sur cet appareil.<br>Ouvrez-le une fois avec du réseau : il marchera ensuite même sans.<br><button onclick="location.reload()">Réessayer</button></div></body></html>';

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(SHELL);
    await c.addAll(PRECACHE.map((u) => new Request(u, { cache: 'reload' })));
    /* première installation : rien à remplacer, on prend la main tout de suite */
    if (!self.registration.active) await self.skipWaiting();
  })());
});
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => (k.startsWith('stabl-shell-') || k.startsWith('piaffe-shell-')) && k !== SHELL).map((k) => caches.delete(k)));
    if (self.registration.navigationPreload) { try { await self.registration.navigationPreload.disable(); } catch (x) { /* rien */ } }
    await self.clients.claim();
  })());
});
self.addEventListener('message', (e) => { if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting(); });

async function shell() {
  const c = await caches.open(SHELL);
  return (await c.match('/')) || (await caches.match('/'));
}
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {
    if (NETWORK_ONLY.test(url.pathname) || url.pathname === '/sw.js') return;
    if (req.mode === 'navigate') {
      e.respondWith((async () => {
        const cached = await shell();
        if (cached) return cached;
        try {
          const r = await fetch(req);
          if (r.ok && url.pathname === '/') (await caches.open(SHELL)).put('/', r.clone());
          return r;
        } catch (x) {
          return new Response(OFFLINE_HTML, { status: 503, headers: { 'content-type': 'text/html; charset=utf-8' } });
        }
      })());
      return;
    }
    if (PRECACHE.includes(url.pathname)) {
      e.respondWith(caches.match(req, { ignoreSearch: true }).then((r) => r || fetch(req)));
    }
    return;
  }
  /* polices Google et three.js : cache d'abord, réseau en arrière-plan pour rafraîchir */
  if (/^(fonts\.googleapis\.com|fonts\.gstatic\.com|cdnjs\.cloudflare\.com)$/.test(url.hostname)) {
    e.respondWith((async () => {
      const c = await caches.open(RUNTIME);
      const hit = await c.match(req);
      const net = fetch(req).then((r) => { if (r && (r.ok || r.type === 'opaque')) c.put(req, r.clone()); return r; }).catch(() => null);
      if (hit) { e.waitUntil(net); return hit; }
      const r = await net;
      return r || Response.error();
    })());
  }
});
