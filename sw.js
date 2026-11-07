// Zapnij Pasy vGPT_2.20.2
const VERSION = 'vGPT_2.20.2';
const PREFIX = 'zapnij-pasy-';
const CACHE = PREFIX + VERSION;
const BASE = '/ZapnijPasy/';
const SHELL = ['./js/music-slide.js?v=vGPT_2.20.2','./js/date-flap.js?v=vGPT_2.20.2','./js/scene-blackout.js?v=vGPT_2.20.2','./js/prohibition-animation.js?v=vGPT_2.20.2','./js/display-layout.js?v=vGPT_2.20.2','./js/brightness.js?v=vGPT_2.20.2','./js/solar-times.js?v=vGPT_2.20.2','./js/extras-animation.js?v=vGPT_2.20.2','./js/confirmation-animation.js?v=vGPT_2.20.2','./Grafiki/signs/thumbs-up.svg','./js/hold-control.js?v=vGPT_2.20.2','./js/remote/display.bundle.js?v=vGPT_2.20.2','./js/remote/transport.bundle.js?v=vGPT_2.20.2','./firebase-config.json','./index.html','./styles.css?v=vGPT_2.20.2','./js/app.js?v=vGPT_2.20.2','./js/clock.js?v=vGPT_2.20.2','./js/flap.js?v=vGPT_2.20.2','./js/updates.js?v=vGPT_2.20.2','./js/view-transition.js?v=vGPT_2.20.2','./js/display-controller.js?v=vGPT_2.20.2','./js/seat-belt-animation.js?v=vGPT_2.20.2','./Grafiki/signs/buckle-base.png','./Grafiki/signs/buckle-tongue.png','./Grafiki/signs/seat-belt.png','./Grafiki/signs/no-food-drink.png','./Grafiki/signs/no-smoking-vaping.png','./Grafiki/signs/cctv.png','./Grafiki/signs/tip.png','./manifest.webmanifest','./Grafiki/icons/apple-touch-icon.png','./Grafiki/icons/icon-192.png','./Grafiki/icons/icon-512.png','./Grafiki/icons/maskable-512.png'];
const URLS = new Set(SHELL.map(path => new URL(path, self.location).href));
// Keep older already-open views working until their cached release can be safely retired.
const LEGACY_GRAPHICS = new Set(SHELL.filter(path => path.startsWith('./Grafiki/') && path.endsWith('.png')).map(path => new URL(path.replace('./Grafiki/signs/','./assets/signs/').replace('./Grafiki/icons/','./icons/'), self.location).href));
const RUNTIME_PATHS = new Set([...URLS].map(url=>new URL(url).pathname));
const readyClients = new Set();
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL.map(path => new Request(new URL(path,self.location).href,{cache:'reload'})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  // Retain previous bundles until every open app window acknowledges this release.
  event.waitUntil(Promise.all([self.clients.claim(),caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith(PREFIX)).map(async key=>{
    const cache=await caches.open(key);for(const request of await cache.keys()){
      const url=new URL(request.url);if(url.origin===self.location.origin&&url.pathname.startsWith(BASE)&&!RUNTIME_PATHS.has(url.pathname)&&!LEGACY_GRAPHICS.has(url.href))await cache.delete(request);
    }
  }))) ]));
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
  // APK installation is online-only and must never become a cached clock navigation.
  if (!RUNTIME_PATHS.has(url.pathname) && url.pathname !== BASE && !LEGACY_GRAPHICS.has(url.href)) { event.respondWith(Promise.resolve(new Response('',{status:404}))); return; }
  if (event.request.mode === 'navigate') event.respondWith(navigation(event.request));
  else if (URLS.has(url.href) || LEGACY_GRAPHICS.has(url.href) || (/\.(js|css)$/.test(url.pathname) && /^(?:vGPT_)?\d+\.\d+\.\d+$/.test(url.searchParams.get('v') || ''))) event.respondWith(asset(event.request));
});
