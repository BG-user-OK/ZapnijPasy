// Zapnij Pasy vGPT_2.11.0 — quiet, coordinated updates; no installation UI.
const VERSION = 'vGPT_2.11.0';
const BASE = '/ZapnijPasy/';
export function startUpdates({ isBusy = () => false, beforeReload = () => {}, deferReload = () => false } = {}) {
  if (!('serviceWorker' in navigator) || !window.isSecureContext) return;
  let registration;
  let checkInProgress = false;
  let hadController = Boolean(navigator.serviceWorker.controller);
  let reloadPending = false;
  let reloading = false;
  let retryTimer;
  function acknowledge() {
    navigator.serviceWorker.controller?.postMessage({type:'CLIENT_READY',version:VERSION});
  }
  function refreshWhenIdle() {
    clearTimeout(retryTimer);
    if (!reloadPending || reloading || document.hidden || deferReload()) return;
    if (isBusy()) { retryTimer = setTimeout(refreshWhenIdle, 100); return; }
    reloading = true;
    beforeReload();
    window.location.reload();
  }
  // Attach before registration so even a fast installation cannot race this listener.
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController) { hadController = true; acknowledge(); return; }
    reloadPending = true;
    refreshWhenIdle();
  });
  async function check() {
    refreshWhenIdle();
    if (!registration || checkInProgress || document.hidden || !navigator.onLine) return;
    acknowledge();
    checkInProgress = true;
    try {
      await registration.update();
      registration.waiting?.postMessage({type:'ACTIVATE_UPDATE'});
    } catch { /* A failed update leaves the installed offline bundle intact. */ }
    finally { checkInProgress = false; }
  }
  navigator.serviceWorker.register(BASE + 'sw.js', {scope:BASE,updateViaCache:'none'}).then(value => {
    registration = value;
    registration.addEventListener('updatefound', () => {
      const installing = registration.installing;
      installing?.addEventListener('statechange', () => {
        if (installing.state === 'installed') registration.waiting?.postMessage({type:'ACTIVATE_UPDATE'});
      });
    });
    acknowledge();
    check();
  }).catch(error => console.warn('Offline registration failed:', error));
  document.addEventListener('visibilitychange', () => { if (!document.hidden) check(); });
  window.addEventListener('online', check);
  window.addEventListener('pageshow', check);
  setInterval(check, 60000);
  return check;
}
