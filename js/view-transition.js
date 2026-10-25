// Zapnij Pasy vGPT_2.19.0 — two physical flaps between complete views.
export class ViewTransition {
  constructor(stage, views, { beforeChange = () => {}, beforeReveal = () => {}, onChange = () => {}, onFinish = () => {}, reducedMotion = () => false, duration = 820, measure } = {}) {
    this.stage = stage;
    this.views = views;
    this.beforeChange = beforeChange;
    this.beforeReveal = beforeReveal;
    this.onChange = onChange;
    this.onFinish = onFinish;
    this.reducedMotion = reducedMotion;
    this.duration = duration;
    this.measure=measure||(()=>this.stage.getBoundingClientRect());
    this.phase = null;
    this.mode = 'clock';
    this.busy = false;
    this.timer = null;
    this.waiters = [];
    this.overlay = document.createElement('div');
    this.overlay.className = 'view-transition';
    this.overlay.setAttribute('aria-hidden', 'true');
    this.overlay.style.setProperty('--view-flip-duration', duration + 'ms');
    this.overlay.style.setProperty('--flap-settle-duration','1000ms');
    stage.append(this.overlay);
    this.overlay.addEventListener('animationstart', event => {
      if(event.target===this.lastPanel&&event.animationName==='view-flap-settle')this.beginSettle();
    });
    this.overlay.addEventListener('animationend', event => {
      if(event.target!==this.lastPanel)return;
      if((event.animationName==='view-flap-fall'||event.animationName==='view-clock-fall')&&this.phase==='fall')this.mode==='clock'?this.beginSettle():this.finish();
      else if(event.animationName==='view-flap-settle'&&this.phase==='settling')this.finish();
    });
    this.applyMode();
  }

  applyMode() {
    this.stage.dataset.mode = this.mode;
    for (const [name, element] of Object.entries(this.views)) element.setAttribute('aria-hidden', String(name !== this.mode));
    this.onChange(this.mode);
  }

  configure(stage,views) {
    this.finish();this.stage=stage;this.views=views;stage.append(this.overlay);this.applyMode();
  }

  capture(view, x, y, width, height) {
    const viewport = document.createElement('div');
    viewport.className = 'snapshot-viewport';
    Object.assign(viewport.style, { width:width + 'px', height:height + 'px', left:-x + 'px', top:-y + 'px' });
    const clone = view.cloneNode(true);
    clone.removeAttribute('id');
    clone.setAttribute('aria-hidden', 'true');
    Object.assign(clone.style, { visibility:'visible', left:'0px', top:'0px', width:width + 'px', height:height + 'px' });
    viewport.append(clone);
    return viewport;
  }

  toggle() { return this.show(this.mode === 'clock' ? 'signs' : 'clock'); }

  show(target, { animate = true, prepare = () => {}, force = false } = {}) {
    if (this.busy || (target === this.mode && !force) || !this.views[target]) return false;
    this.beforeChange(target);
    const outgoing = this.views[this.mode].cloneNode(true);
    prepare();
    this.beforeReveal(target);
    this.stage.classList.remove('is-clock-settling','is-clock-return');
    if(target==='clock')this.stage.classList.add('is-clock-return');
    this.mode = target;
    this.busy = true;
    this.applyMode();
    if (!animate || this.reducedMotion()) { this.finish(); return true; }
    const { width, height } = this.measure();
    const incoming = this.views[target];
    const lower = document.createElement('div');
    lower.className = 'transition-bottom';
    lower.append(this.capture(outgoing, 0, height / 2, width, height));
    this.overlay.append(lower);
    this.lower=lower;
    for (let index = 0; index < 2; index++) {
      const left = width * index / 2;
      const panel = document.createElement('div');
      panel.className = 'transition-panel';
      Object.assign(panel.style, { left:left + 'px', width:width / 2 + 'px' });
      for (const side of ['front', 'back']) {
        const face = document.createElement('div');
        face.className = 'transition-face transition-face--' + side;
        face.append(this.capture(side === 'front' ? outgoing : incoming, left, side === 'front' ? 0 : height / 2, width, height));
        panel.append(face);
      }
      this.overlay.append(panel);
      this.lastPanel = panel;
    }
    this.phase='fall';
    this.overlay.classList.add('is-visible');
    void this.overlay.offsetHeight;
    this.overlay.classList.add('is-running');
    this.timer = setTimeout(() => this.mode==='clock' ? this.beginSettle() : this.finish(), this.duration + 150);
    return true;
  }

  beginSettle() {
    if(!this.busy||this.phase!=='fall')return;
    clearTimeout(this.timer);this.phase='settling';
    this.stage.classList.add('is-clock-settling');
    const {width,height}=this.measure();
    this.lower.replaceChildren();this.lower.append(this.capture(this.views[this.mode],0,height/2,width,height));
    this.overlay.classList.add('is-settling');
    this.timer=setTimeout(()=>this.finish(),1120);
  }
  whenFinished() {
    if (!this.busy) return Promise.resolve();
    return new Promise(resolve => this.waiters.push(resolve));
  }

  finish() {
    if (!this.busy) return;
    clearTimeout(this.timer);
    this.timer = null;
    this.phase=null;
    this.stage.classList.remove('is-clock-return','is-clock-settling');
    this.overlay.classList.remove('is-running', 'is-visible','is-settling');
    this.overlay.replaceChildren();
    this.lastPanel = null;
    this.busy = false;
    this.onFinish(this.mode);
    this.waiters.splice(0).forEach(resolve => resolve());
  }
}
