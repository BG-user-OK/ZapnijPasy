// Zapnij Pasy vGPT_2.9.3 — one shared CSS animation start; completes when all actual tongues finish.
// The original bitmap remains untouched beneath the two aligned belt strokes.
export function createSeatBeltSign(image) {
  const sign=document.createElement('div');sign.className='seat-belt-person';
  const overlay=document.createElementNS('http://www.w3.org/2000/svg','svg');
  overlay.setAttribute('class','seat-belt-reminder');overlay.setAttribute('viewBox','0 0 512 512');
  overlay.setAttribute('aria-hidden','true');overlay.setAttribute('focusable','false');
  for(const [index,d] of ['M 342 137 L 287 191 L 184 294 Q 165 321 136 337','M 136 323 Q 161 307 183 301 C 222 289 276 288 316 301 C 343 302 351 310 378 326 C 386 332 385 344 377 350 C 372 354 366 354 362 350 C 343 339 330 325 312 320 C 270 307 227 310 190 320 Q 166 328 144 350 C 135 356 124 348 123 340 Q 120 331 128 326 Z'].entries()) {
    const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d',d);
    // The lap belt includes the black outer ends, not just its white torso section.
    if(index===1){path.setAttribute('fill','#e9181c');path.setAttribute('stroke','none');}
    overlay.append(path);
  }
  sign.append(image,overlay);return sign;
}
export class SeatBeltAnimation {
  constructor(host, { reducedMotion = () => false, duration = 800, schedule = (fn, ms) => setTimeout(fn, ms), cancel = id => clearTimeout(id) } = {}) {
    this.host = host;
    this.reducedMotion = reducedMotion;
    this.duration = duration;
    this.schedule = schedule;
    this.cancel = cancel;
    this.timer = null;
    this.resolve = null;
    this.finished = new Set();
    this.tongues = new Set();
    host.style.setProperty('--buckle-duration', duration+'ms');
    host.addEventListener('animationend', event => {
      if (event.animationName !== this.animationName || !this.resolve || !this.tongues.has(event.target)) return;
      this.finished.add(event.target);
      if (this.finished.size === this.tongues.size) this.stop(this.targetFastened);
    });
  }
  startReminder() { this.host.classList.add('is-belt-reminding'); }
  stopReminder() { this.host.classList.remove('is-belt-reminding'); }
  play({reverse=false}={}) {
    this.stop(reverse);
    this.targetFastened=!reverse;
    this.animationName=reverse?'buckle-retract':'buckle-insert';
    if (this.reducedMotion()) { this.stop(!reverse); return Promise.resolve(); }
    this.tongues = new Set(this.host.querySelectorAll('.buckle-tongue'));
    const complete = new Promise(resolve => { this.resolve = resolve; });
    void this.host.offsetHeight;
    this.host.classList.add(reverse?'is-retracting':'is-inserting');
    this.timer = this.schedule(() => this.stop(!reverse), this.duration+120);
    return complete;
  }
  stop(complete = false) {
    if (this.timer !== null) this.cancel(this.timer);
    this.timer = null;
    this.host.classList.remove('is-inserting','is-retracting','is-fastened');
    if (complete) this.host.classList.add('is-fastened');
    this.finished.clear();
    this.tongues.clear();
    const resolve = this.resolve;
    this.resolve = null;
    resolve?.();
  }
}
