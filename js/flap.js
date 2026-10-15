// Zapnij Pasy vGPT_2.0.0 — reusable flap; the caller supplies content and rendering.
export class Flap {
  constructor(element, { render = (host, value) => {
    const text = document.createElement('span');
    text.textContent = String(value);
    host.replaceChildren(text);
  }, duration = 560 } = {}) {
    this.element = element;
    this.render = render;
    this.duration = duration;
    this.value = undefined;
    this.pending = undefined;
    this.timer = null;
    this.waiters = [];
    this.faces = {};
    for (const name of ['upper', 'lower', 'moving-upper', 'moving-lower']) {
      const half = document.createElement('div');
      half.className = 'half half--' + (name.includes('upper') ? 'upper' : 'lower');
      if (name.startsWith('moving-')) half.classList.add('half--' + name);
      const content = document.createElement('div');
      content.className = 'face-content';
      half.append(content);
      element.append(half);
      this.faces[name] = content;
    }
    for (const className of ['seam', 'hinge hinge--left', 'hinge hinge--right']) {
      const detail = document.createElement('div');
      detail.className = className;
      element.append(detail);
    }
    element.style.setProperty('--flip-duration', duration + 'ms');
    element.addEventListener('animationend', event => {
      if (event.animationName === 'lower-fall' && event.target === this.faces['moving-lower'].parentElement) this.finish();
    });
  }

  paint(name, value) { this.render(this.faces[name], value); }

  setValue(value, { animate = true } = {}) {
    if (this.pending !== undefined) this.finish();
    if (Object.is(value, this.value)) return false;
    if (!animate || this.value === undefined) {
      this.value = value;
      this.paint('upper', value);
      this.paint('lower', value);
      return false;
    }
    this.pending = value;
    this.paint('upper', value);
    this.paint('moving-upper', this.value);
    this.paint('moving-lower', value);
    // Flush only the changed module to reliably restart a WebKit CSS animation.
    void this.element.offsetHeight;
    this.element.classList.add('is-flipping');
    this.timer = setTimeout(() => this.finish(), this.duration + 120);
    return true;
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
    this.element.classList.remove('is-flipping');
    this.waiters.splice(0).forEach(resolve => resolve());
  }
}
