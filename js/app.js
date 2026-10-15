// Zapnij Pasy 1.1.0
import { Flap } from './flap.js?v=1.1.0';
import { Clock } from './clock.js?v=1.1.0';
import { startUpdates } from './updates.js?v=1.1.0';

const root = document.querySelector('.clock');
const modules = Array.from(root.querySelectorAll('.digit'), element => new Flap(element));
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function fitViewport() {
  const viewport = window.visualViewport;
  const width = viewport ? viewport.width : window.innerWidth;
  const height = viewport ? viewport.height : window.innerHeight;
  root.style.width = width + 'px';
  root.style.height = height + 'px';
  root.style.left = (viewport ? viewport.offsetLeft : 0) + 'px';
  root.style.top = (viewport ? viewport.offsetTop : 0) + 'px';
  const gap = Math.max(5, Math.min(12, width * 0.012));
  root.style.setProperty('--gap', gap + 'px');
  const style = getComputedStyle(root);
  const usableHeight = height - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
  const usableWidth = width - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight) - gap * 4;
  const moduleWidth = usableWidth / 4.1;
  const cardHeight = Math.max(1, Math.floor(Math.min(usableHeight, moduleWidth * 2.32)));
  root.style.setProperty('--card-height', cardHeight + 'px');
  // Limit wide glyphs by width as well as height; keep every digit inside its flap.
  root.style.setProperty('--digit-size', Math.floor(Math.min(cardHeight * 1.16, moduleWidth * 2.10)) + 'px');
}

const clock = new Clock({
  update(time, { animate }) {
    modules.forEach((module, index) => module.setValue(time.digits[index], { animate: animate && !reducedMotion.matches }));
    root.setAttribute('aria-label', time.text);
  }
});

function resume() {
  fitViewport();
  if (!document.hidden) clock.start();
}
function suspend() {
  clock.stop();
  modules.forEach(module => module.finish());
}
window.addEventListener('resize', fitViewport);
window.addEventListener('orientationchange', fitViewport);
window.visualViewport?.addEventListener('resize', fitViewport);
window.visualViewport?.addEventListener('scroll', fitViewport);
window.addEventListener('pageshow', resume);
window.addEventListener('pagehide', suspend);
window.addEventListener('focus', resume);
document.addEventListener('visibilitychange', () => document.hidden ? suspend() : resume());
reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) modules.forEach(module => module.finish()); });
resume();

startUpdates({ isBusy: () => modules.some(module => module.pending !== undefined), beforeReload: suspend });
