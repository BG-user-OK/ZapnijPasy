// Zapnij Pasy 1.1.0
const VERSION = '1.1.0';
const PREFIX = 'zapnij-pasy-';
const CACHE = PREFIX + VERSION;
const BASE = '/ZapnijPasy/';
const SHELL = ['./index.html','./styles.css?v=1.1.0','./js/app.js?v=1.1.0','./js/clock.js?v=1.1.0','./js/flap.js?v=1.1.0','./js/updates.js?v=1.1.0','./manifest.webmanifest','./icons/apple-touch-icon.png','./icons/icon-192.png','./icons/icon-512.png','./icons/maskable-512.png'];
const URLS = new Set(SHELL.map(path => new URL(path, self.location).href));
const readyClients = new Set();
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL.map(path => new Request(new URL(path,self.location).href,{cache:'reload'})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  // Retain previous bundles until every open app window acknowledges this release.
  event.waitUntil(self.clients.claim());
});
self.addEventListener('message', event => {
  if (event.data?.type === 'ACTIVATE_UPDATE') { event.waitUntil(self.skipWaiting()); return; }
  if (event.data?.type !== 'CLIENT_READY' || event.data.version !== VERSION || !event.source?.id) return;
  readyClients.add(event.source.id);
  event.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(clients => {
    const appClients = clients.filter(client => new URL(client.url).origin === self.location.origin && new URL(client.url).pathname.startsWith(BASE));
    if (!appClients.length || appClients.some(client => !readyClients.has(client.id))) return;
    return caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith(PREFIX) && key !== CACHE).map(key => caches.delete(key))));
  }));
});
async function navigation(request) {
  const cache = await caches.open(CACHE);
  const fallback = await cache.match(new URL('./index.html',self.location).href);
  const controller = new AbortController();
  let timer;
  try {
    const network = (async () => {
      const response = await fetch(request,{cache:'no-store',signal:controller.signal});
      if (!response.ok) throw new Error('Navigation failed');
      const html = await response.clone().text();
      // Do not mix newer network HTML with this worker's older offline assets.
      if (!html.includes('name="app-version" content="' + VERSION + '"')) return fallback || Response.error();
      return response;
    })();
    const timeout = new Promise(resolve => { timer = setTimeout(() => { controller.abort(); resolve(fallback || Response.error()); },2500); });
    return await Promise.race([network,timeout]);
  } catch { return fallback || Response.error(); }
  finally { clearTimeout(timer); }
}
async function asset(request) {
  const cache = await caches.open(CACHE);
  const current = await cache.match(request);
  if (current) return current;
  // Old already-open documents can still request assets from their retained release.
  for (const key of await caches.keys()) {
    if (!key.startsWith(PREFIX) || key === CACHE) continue;
    const stored = await (await caches.open(key)).match(request);
    if (stored) return stored;
  }
  return fetch(request);
}
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(BASE)) return;
  if (event.request.mode === 'navigate') event.respondWith(navigation(event.request));
  else if (URLS.has(url.href) || (/\.(js|css)$/.test(url.pathname) && /^\d+\.\d+\.\d+$/.test(url.searchParams.get('v') || ''))) event.respondWith(asset(event.request));
});
