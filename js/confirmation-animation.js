// Zapnij Pasy vGPT_2.7.0 — shared confirmation timeline and cancellable presentation.
export const CONFIRMATION_STEPS = Object.freeze([
  {name:'checks',duration:800,animation:'confirmation-mark'},
  {name:'checks-hold',duration:3000},
  {name:'thumb-first',duration:1000,animation:'confirmation-first'},
  {name:'thumb-shrink-one',duration:1000,animation:'confirmation-shrink'},
  {name:'thumb-grow-two',duration:1000,animation:'confirmation-grow'},
  {name:'thumb-shrink-two',duration:1000,animation:'confirmation-shrink'},
  {name:'thumb-grow-three',duration:1000,animation:'confirmation-grow'},
  {name:'thumb-hold',duration:4000},
  {name:'scene-fade',duration:800,animation:'confirmation-scene-fade'},
  {name:'black-hold',duration:200}
]);
export const CONFIRMATION_DURATION = CONFIRMATION_STEPS.reduce((total,step)=>total+step.duration,0);
export class ConfirmationAnimation {
  constructor(host,{reducedMotion=()=>false,schedule=(fn,ms)=>setTimeout(fn,ms),cancel=id=>clearTimeout(id)}={}) {
    this.host=host;this.reducedMotion=reducedMotion;this.schedule=schedule;this.cancelTimer=cancel;this.pending=null;
    host.addEventListener('animationend',event=>{
      const p=this.pending;
      if(!p||event.animationName!==p.animation||!p.targets.has(event.target))return;
      p.targets.delete(event.target);
      if(!p.targets.size)this.finish(true);
    });
  }
  finish(completed) {
    const p=this.pending;this.pending=null;
    if(p){this.cancelTimer(p.timer);if(completed&&p.animation==='confirmation-scene-fade'){const black=this.host.querySelector('.confirmation-blackout');if(black)black.style.opacity='1';this.host.dataset.confirmation='black-hold';}p.resolve(completed);}
  }
  cancel({preserveBlack=false}={}) {
    const black=this.host.querySelector('.confirmation-blackout');
    if(preserveBlack&&black)black.style.opacity=getComputedStyle(black).opacity;
    this.finish(false);
    this.host.querySelectorAll('.confirmation-checks, .confirmation-thumb').forEach(element=>element.remove());
    if(!preserveBlack)black?.remove();
    delete this.host.dataset.confirmation;
    this.host.classList.remove('is-thumb-mode');
  }
  prepare() {
    if(this.host.querySelector('.confirmation-checks'))return;
    this.host.querySelector('.confirmation-blackout')?.remove();
    const layer=document.createElement('div');layer.className='confirmation-checks';layer.setAttribute('aria-hidden','true');
    for(let i=0;i<2;i++) {
      const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
      svg.setAttribute('viewBox','0 0 512 512');
      const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d','M 100 270 L 210 370 L 420 140');
      svg.append(path);layer.append(svg);
    }
    const thumb=document.createElement('div');thumb.className='confirmation-thumb';
    const image=document.createElement('img');image.src='./Grafiki/signs/thumbs-up.svg';image.alt='Pasy zapięte — dziękujemy';
    const black=document.createElement('div');black.className='confirmation-blackout';black.setAttribute('aria-hidden','true');
    thumb.append(image);this.host.append(layer,thumb,black);
  }
  play(name,{elapsed=0,duration}={}) {
    this.finish(false);this.prepare();
    const step=CONFIRMATION_STEPS.find(item=>item.name===name);
    if(!step)throw new Error('Unknown confirmation phase');
    const remaining=Math.max(0,(duration??step.duration)-elapsed);
    this.host.dataset.confirmation=name;
    this.host.classList.toggle('is-thumb-mode',!name.startsWith('checks'));
    this.host.style.setProperty('--confirmation-delay',-elapsed+'ms');
    this.host.style.setProperty('--confirmation-duration',(duration??step.duration)+'ms');
    if(!step.animation)return Promise.resolve(true);
    const selector=name==='checks'?'.confirmation-checks path':name==='scene-fade'?'.confirmation-blackout':'.confirmation-thumb img';
    const targets=new Set(this.host.querySelectorAll(selector));
    // Both marker strokes share one style change; both must finish before the hold starts.
    return new Promise(resolve=>{
      this.pending={resolve,animation:step.animation,targets,timer:this.schedule(()=>this.finish(true),remaining+(this.reducedMotion()?0:120))};
    });
  }
}
