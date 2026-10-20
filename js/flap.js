// Zapnij Pasy vGPT_2.7.3 — one rigid, double-sided leaf for each complete value.
export const FLAP_SETTLE_DURATION=1000;
export class Flap {
  constructor(element, { render = (host, value) => {
    const text = document.createElement('span');
    text.textContent = String(value);
    host.replaceChildren(text);
  }, duration = 800, settleDuration = FLAP_SETTLE_DURATION } = {}) {
    this.element = element;
    this.render = render;
    this.duration = duration;
    this.settleDuration = settleDuration;
    this.phase = null;
    this.value = undefined;
    this.pending = undefined;
    this.timer = null;
    this.waiters = [];
    this.faces = {};
    this.leaf = document.createElement('div');
    this.leaf.className = 'falling-flap';
    for (const name of ['upper', 'lower', 'moving-upper', 'moving-lower']) {
      const half = document.createElement('div');
      half.className = 'half half--' + (name.includes('upper') ? 'upper' : 'lower');
      if (name.startsWith('moving-')) half.classList.add('half--' + name);
      const content = document.createElement('div');
      content.className = 'face-content';
      half.append(content);
      (name.startsWith('moving-') ? this.leaf : element).append(half);
      this.faces[name] = content;
    }
    element.append(this.leaf);
    for (const className of ['seam', 'hinge hinge--left', 'hinge hinge--right']) {
      const detail = document.createElement('div');
      detail.className = className;
      element.append(detail);
    }
    element.style.setProperty('--flip-duration', duration + 'ms');
    element.style.setProperty('--flap-settle-duration', settleDuration + 'ms');
    element.addEventListener('animationstart', event => {
      if(event.target===this.leaf&&event.animationName==='flap-settle')this.beginSettle();
    });
    element.addEventListener('animationend', event => {
      if(event.target!==this.leaf)return;
      if(event.animationName==='flap-fall'&&this.phase==='fall')this.settles?this.beginSettle():this.finish();
      else if(event.animationName==='flap-settle'&&this.phase==='settling')this.finish();
    });
  }
  paint(name, value) { this.render(this.faces[name], value); }
  setValue(value, { animate = true, settle = true, duration = this.duration, force = false } = {}) {
    if (this.pending !== undefined) this.finish();
    if (Object.is(value, this.value) && !force) return false;
    if (!animate || this.value === undefined) {
      this.value = value;
      this.paint('upper', value);
      this.paint('lower', value);
      return false;
    }
    this.pending = value;
    this.settles = settle;
    this.phase = 'fall';
    this.element.style.setProperty('--flip-duration', duration + 'ms');
    this.paint('upper', value);
    this.paint('moving-upper', this.value);
    this.paint('moving-lower', value);
    void this.element.offsetHeight;
    if(settle)this.element.classList.add('is-settle-enabled');
    this.element.classList.add('is-flipping');
    this.timer = setTimeout(() => this.settles ? this.beginSettle() : this.finish(), duration + 120);
    return true;
  }
  beginSettle() {
    if(this.phase!=='fall'||this.pending===undefined)return;
    clearTimeout(this.timer);this.phase='settling';
    this.paint('lower',this.pending); // The bouncing leaf must reveal the new lower half.
    this.element.classList.add('is-settling');
    this.timer=setTimeout(()=>this.finish(),this.settleDuration+120);
  }
  whenFinished() {
    if (this.pending === undefined) return Promise.resolve();
    return new Promise(resolve => this.waiters.push(resolve));
  }
  finish() {
    clearTimeout(this.timer);
    this.timer = null;
    if (this.pending !== undefined) {
      this.value = this.pending;
      this.pending = undefined;
      this.paint('upper', this.value);
      this.paint('lower', this.value);
    }
    this.phase=null;
    this.element.classList.remove('is-flipping','is-settling','is-settle-enabled');
    this.waiters.splice(0).forEach(resolve => resolve());
  }
}
