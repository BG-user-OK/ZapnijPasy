// Zapnij Pasy vGPT_2.4.0 — one shared CSS animation start for both independent tongues.
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
      if (event.animationName !== 'buckle-insert' || !this.resolve || !this.tongues.has(event.target)) return;
      this.finished.add(event.target);
      if (this.finished.size === 2) this.stop(true);
    });
  }
  play() {
    this.stop(false);
    if (this.reducedMotion()) { this.host.classList.add('is-fastened'); return Promise.resolve(); }
    this.tongues = new Set(this.host.querySelectorAll('.buckle-tongue'));
    const complete = new Promise(resolve => { this.resolve = resolve; });
    void this.host.offsetHeight;
    this.host.classList.add('is-inserting');
    this.timer = this.schedule(() => this.stop(true), this.duration+120);
    return complete;
  }
  stop(complete = false) {
    if (this.timer !== null) this.cancel(this.timer);
    this.timer = null;
    this.host.classList.remove('is-inserting', 'is-fastened');
    if (complete) this.host.classList.add('is-fastened');
    this.finished.clear();
    this.tongues.clear();
    const resolve = this.resolve;
    this.resolve = null;
    resolve?.();
  }
}
