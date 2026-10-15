// Zapnij Pasy vGPT_1.2.0
import { Flap } from './flap.js?v=vGPT_1.2.0';
import { Clock } from './clock.js?v=vGPT_1.2.0';
import { ViewTransition } from './view-transition.js?v=vGPT_1.2.0';
import { startUpdates } from './updates.js?v=vGPT_1.2.0';

const stage = document.querySelector('.stage');
const root = stage.querySelector('.clock');
const signs = stage.querySelector('.signs');
const toggle = stage.querySelector('.mode-toggle');
const modules = Array.from(root.querySelectorAll('.digit'), element => new Flap(element));
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let transition;
let suspended = false;
let checkForUpdates = () => {};

function fitViewport() {
  if (transition?.busy) transition.finish();
  const viewport = window.visualViewport;
  const width = viewport ? viewport.width : window.innerWidth;
  const height = viewport ? viewport.height : window.innerHeight;
  Object.assign(stage.style, {width:width + 'px',height:height + 'px',left:(viewport ? viewport.offsetLeft : 0) + 'px',top:(viewport ? viewport.offsetTop : 0) + 'px'});
  const gap = Math.max(5, Math.min(12, width * 0.012));
  stage.style.setProperty('--gap', gap + 'px');
  const style = getComputedStyle(root);
  const usableHeight = height - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
  const usableWidth = width - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight) - gap * 4;
  const moduleWidth = usableWidth / 4.1;
  const cardHeight = Math.max(1, Math.floor(Math.min(usableHeight, moduleWidth * 2.32)));
  stage.style.setProperty('--card-height', cardHeight + 'px');
  stage.style.setProperty('--digit-size', Math.floor(Math.min(cardHeight * 1.16, moduleWidth * 2.10)) + 'px');
  const first = modules[0].element.getBoundingClientRect();
  const bounds = stage.getBoundingClientRect();
  Object.assign(toggle.style, {left:first.left - bounds.left + 'px',top:first.top - bounds.top + 'px',width:first.width + 'px',height:first.height + 'px'});
}

const clock = new Clock({ update(time, { animate }) {
  modules.forEach((module, index) => module.setValue(time.digits[index], {animate:animate && !reducedMotion.matches}));
  root.setAttribute('aria-label', time.text);
}});
function settleClock() { clock.stop(); modules.forEach(module => module.finish()); }
transition = new ViewTransition(stage, {clock:root, signs}, {
  beforeChange:settleClock,
  beforeReveal(mode) { if (mode === 'clock') clock.sync(true); },
  onChange(mode) {
    toggle.setAttribute('aria-pressed', String(mode === 'signs'));
    toggle.setAttribute('aria-label', mode === 'clock' ? 'Nowy pasażer — pokaż pasy i zakaz jedzenia' : 'Pasażer zapiął pasy — wróć do zegara');
  },
  onFinish(mode) { if (mode === 'clock' && !document.hidden && !suspended) clock.start(); checkForUpdates(); },
  reducedMotion:() => reducedMotion.matches
});
function resume() {
  suspended = false;
  fitViewport();
  if (!document.hidden && transition.mode === 'clock' && !transition.busy) clock.start();
}
function suspend() { suspended = true; settleClock(); transition.finish(); }
toggle.addEventListener('click', () => transition.toggle());
// Keep the control inactive until both actual images can be displayed.
Promise.all(Array.from(signs.querySelectorAll('img'), image => {
  if (image.complete) return image.naturalWidth ? Promise.resolve() : Promise.reject(new Error('Sign image unavailable'));
  return new Promise((resolve, reject) => {
    image.addEventListener('load', resolve, {once:true});
    image.addEventListener('error', () => reject(new Error('Sign image unavailable')), {once:true});
  });
})).then(() => { toggle.disabled = false; }).catch(error => console.warn(error.message));
window.addEventListener('resize', fitViewport);
window.addEventListener('orientationchange', fitViewport);
window.visualViewport?.addEventListener('resize', fitViewport);
window.visualViewport?.addEventListener('scroll', fitViewport);
window.addEventListener('pageshow', resume);
window.addEventListener('pagehide', suspend);
window.addEventListener('focus', resume);
document.addEventListener('visibilitychange', () => document.hidden ? suspend() : resume());
reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) { modules.forEach(module => module.finish()); transition.finish(); } });
resume();
checkForUpdates = startUpdates({isBusy:() => transition.busy || modules.some(module => module.pending !== undefined), deferReload:() => transition.mode === 'signs', beforeReload:suspend}) || (() => {});
