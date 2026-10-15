// Zapnij Pasy vGPT_1.3.0 — no DOM dependencies; always derive time from the device.
export function readTime(date = new Date()) {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return { text: hours + ':' + minutes, digits: (hours + minutes).split(''), minute: Math.floor(date.getTime() / 60000) };
}

export function changedDigits(previous, next) {
  return next.map((digit, index) => !previous || previous[index] !== digit);
}

export function shouldAnimate(previous, next, elapsed, force = false) {
  if (force || !previous) return false;
  const wallElapsed = next.timestamp - previous.timestamp;
  return next.minute === previous.minute + 1 && elapsed >= 0 && elapsed < 2500 && Math.abs(wallElapsed - elapsed) < 1500;
}

export class Clock {
  constructor({ update, now = () => new Date(), monotonic = () => performance.now(), schedule = (callback, delay) => setTimeout(callback, delay), cancel = handle => clearTimeout(handle) }) {
    this.update = update;
    this.now = now;
    this.monotonic = monotonic;
    this.schedule = schedule;
    this.cancel = cancel;
    this.previous = null;
    this.timer = null;
    this.running = false;
  }

  sync(force = false) {
    const date = this.now();
    const next = { ...readTime(date), timestamp: date.getTime(), tick: this.monotonic() };
    const animate = shouldAnimate(this.previous, next, this.previous ? next.tick - this.previous.tick : 0, force);
    if (force || !this.previous || next.text !== this.previous.text) {
      this.update(next, { animate, changed: changedDigits(this.previous?.digits, next.digits) });
    }
    this.previous = next;
  }

  start() {
    this.stop();
    this.running = true;
    this.sync(true);
    this.queue();
  }

  queue() {
    if (!this.running) return;
    // Poll once per second, aligned to the wall clock: catch corrections promptly.
    const delay = 1000 - (this.now().getTime() % 1000) + 12;
    this.timer = this.schedule(() => {
      this.timer = null;
      if (!this.running) return;
      this.sync();
      this.queue();
    }, delay);
  }

  stop() {
    this.running = false;
    if (this.timer !== null) this.cancel(this.timer);
    this.timer = null;
  }
}
