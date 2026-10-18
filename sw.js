// Zapnij Pasy vGPT_2.4.2
const VERSION = 'vGPT_2.4.2';
const PREFIX = 'zapnij-pasy-';
const CACHE = PREFIX + VERSION;
const BASE = '/ZapnijPasy/';
const SHELL = ['./js/confirmation-animation.js?v=vGPT_2.4.2','./Grafiki/signs/thumbs-up.svg','./js/hold-control.js?v=vGPT_2.4.2','./js/remote/display.bundle.js?v=vGPT_2.4.2','./js/remote/transport.bundle.js?v=vGPT_2.4.2','./firebase-config.json','./pilot-proof.html','./pilot-proof.js?v=vGPT_2.4.2','./index.html','./styles.css?v=vGPT_2.4.2','./js/app.js?v=vGPT_2.4.2','./js/clock.js?v=vGPT_2.4.2','./js/flap.js?v=vGPT_2.4.2','./js/updates.js?v=vGPT_2.4.2','./js/view-transition.js?v=vGPT_2.4.2','./js/display-controller.js?v=vGPT_2.4.2','./js/seat-belt-animation.js?v=vGPT_2.4.2','./Grafiki/signs/buckle-base.png','./Grafiki/signs/buckle-tongue.png','./Grafiki/signs/seat-belt.png','./Grafiki/signs/no-food-drink.png','./Grafiki/signs/no-smoking-vaping.png','./Grafiki/signs/cctv.png','./Grafiki/signs/tip.png','./manifest.webmanifest','./Grafiki/icons/apple-touch-icon.png','./Grafiki/icons/icon-192.png','./Grafiki/icons/icon-512.png','./Grafiki/icons/maskable-512.png'];
const URLS = new Set(SHELL.map(path => new URL(path, self.location).href));
// Keep older already-open views working until their cached release can be safely retired.
const LEGACY_GRAPHICS = new Set(SHELL.filter(path => path.startsWith('./Grafiki/') && path.endsWith('.png')).map(path => new URL(path.replace('./Grafiki/signs/','./assets/signs/').replace('./Grafiki/icons/','./icons/'), self.location).href));
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
  const fallback = await cache.match(new URL(new URL(request.url).pathname.endsWith('/pilot-proof.html')?'./pilot-proof.html':'./index.html',self.location).href);
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
  // APK installation is online-only and must never become a cached clock navigation.
  if (url.pathname === BASE + 'pilot-install.html' || url.pathname.startsWith(BASE + 'downloads/')) return;
  if (event.request.mode === 'navigate') event.respondWith(navigation(event.request));
  else if (URLS.has(url.href) || LEGACY_GRAPHICS.has(url.href) || (/\.(js|css)$/.test(url.pathname) && /^(?:vGPT_)?\d+\.\d+\.\d+$/.test(url.searchParams.get('v') || ''))) event.respondWith(asset(event.request));
});
