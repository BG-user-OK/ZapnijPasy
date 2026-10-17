// Zapnij Pasy vGPT_2.2.1
import { Flap } from './flap.js?v=vGPT_2.2.1';
import { Clock } from './clock.js?v=vGPT_2.2.1';
import { ViewTransition } from './view-transition.js?v=vGPT_2.2.1';
import { SeatBeltAnimation } from './seat-belt-animation.js?v=vGPT_2.2.1';
import { DisplayController } from './display-controller.js?v=vGPT_2.2.1';
import { bindHoldControl } from './hold-control.js?v=vGPT_2.2.1';
import { startUpdates } from './updates.js?v=vGPT_2.2.1';

const stage = document.querySelector('.stage');
const root = stage.querySelector('.clock');
const signs = stage.querySelector('.signs');
const toggle = stage.querySelector('.mode-toggle');
const modules = Array.from(root.querySelectorAll('.digit'), element => new Flap(element));
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const UPDATE_STATE = 'zapnij-pasy-update-sequence-v1';
const graphics = {
  'belt-one':[['seat-belt','Zapnij pasy'],['seat-belt','Zapnij pasy']],
  rules:[['no-smoking-vaping','Zakaz palenia'],['no-food-drink','Zakaz jedzenia i picia']],
  extras:[['cctv','Monitoring'],['tip','Skarbonka na napiwki']]
};
let remote=null;
let remoteLoading=null;
let fallbackInteractions=0;
let controller;
let transition;
let currentView = 'clock';
let suspended = false;
let interrupting = false;
let started = false;
let checkForUpdates = () => {};

function fitViewport() {
  if (transition?.busy) transition.finish();
  const viewport = window.visualViewport;
  const width = viewport ? viewport.width : window.innerWidth;
  const height = viewport ? viewport.height : window.innerHeight;
  Object.assign(stage.style, {width:width+'px',height:height+'px',left:(viewport ? viewport.offsetLeft : 0)+'px',top:(viewport ? viewport.offsetTop : 0)+'px'});
  const gap = Math.max(5, Math.min(12, width*.012));
  stage.style.setProperty('--gap', gap+'px');
  const style = getComputedStyle(root);
  const usableHeight = height-parseFloat(style.paddingTop)-parseFloat(style.paddingBottom);
  const usableWidth = width-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight)-gap;
  const moduleWidth = usableWidth/2;
  const cardHeight = Math.max(1,Math.floor(Math.min(usableHeight,moduleWidth*1.14)));
  stage.style.setProperty('--card-height',cardHeight+'px');
  stage.style.setProperty('--digit-size',Math.floor(Math.min(cardHeight*1.14,moduleWidth*.94))+'px');
  stage.style.setProperty('--sign-size',Math.floor(Math.min(usableHeight,(width-36)/2))+'px');
  const first = modules[0].element.getBoundingClientRect();
  const bounds = stage.getBoundingClientRect();
  Object.assign(toggle.style,{left:first.left-bounds.left+'px',top:first.top-bounds.top+'px',width:first.width+'px',height:first.height+'px'});
}
function image(name, alt = '') {
  const element = document.createElement('img');
  element.src = './assets/signs/'+name+'.png';
  element.alt = alt;
  element.width = element.height = 512;
  return element;
}
function renderGraphic(view) {
  buckle.stop(false);
  signs.replaceChildren();
  if (view === 'belt-two') {
    for (let index=0;index<2;index++) {
      const graphic = document.createElement('div');
      graphic.className = 'buckle';
      graphic.setAttribute('role','img');
      graphic.setAttribute('aria-label','Zapnij pasy — klamra');
      for (const [part,asset] of [['base','base'],['tail','tongue'],['tongue','tongue'],['front','base']]) {
        const layer = image('buckle-'+asset);
        layer.className = 'buckle-'+part;
        layer.setAttribute('aria-hidden','true');
        graphic.append(layer);
      }
      signs.append(graphic);
    }
    signs.setAttribute('aria-label','Zapnij pasy — zapinanie klamry');
  } else {
    for (const [asset,alt] of graphics[view]) signs.append(image(asset,alt));
    signs.setAttribute('aria-label',graphics[view].map(item=>item[1]).join('. '));
  }
  signs.dataset.content = view;
}
const clock = new Clock({update(time,{animate}) {
  modules.forEach((module,index)=>module.setValue(time.digits[index],{animate:animate && !reducedMotion.matches}));
  root.setAttribute('aria-label',time.text);
  controller?.onClockMinute(time,{natural:animate,completed:Promise.all(modules.map(module=>module.whenFinished()))});
}});
function settleClock() { clock.stop(); modules.forEach(module=>module.finish()); }
const buckle = new SeatBeltAnimation(signs,{reducedMotion:()=>reducedMotion.matches});
transition = new ViewTransition(stage,{clock:root,signs},{
  beforeChange:settleClock,
  beforeReveal(mode) { if (mode==='clock') clock.sync(true); },
  onChange(mode) { toggle.setAttribute('aria-pressed',String(mode==='signs')); },
  onFinish(mode) { if(mode==='clock' && !document.hidden && !suspended && !interrupting) clock.start(); },
  reducedMotion:()=>reducedMotion.matches
});
function cancelVisuals(completeInsertion=false) {
  interrupting = true;
  transition.finish();
  buckle.stop(completeInsertion && currentView==='belt-two');
  settleClock();
  interrupting = false;
}
controller = new DisplayController({effects:{
  async show(view,{animate}) {
    const target = view==='clock' ? 'clock' : 'signs';
    const changed = currentView!==view;
    currentView = view;
    toggle.setAttribute('aria-label',view==='clock' || view==='rules' || view==='extras' ? 'Nowy pasażer — pokaż przypomnienie o pasach' : 'Pasażer zapiął pasy — potwierdź');
    const accepted = transition.show(target,{animate,force:changed,prepare:()=>{if(target==='signs')renderGraphic(view);}});
    if(!accepted && target==='clock' && !document.hidden && !suspended) clock.start();
    await transition.whenFinished();
  },
  insert:()=>buckle.play(),
  freeze:()=>cancelVisuals(true),
  cancel:()=>cancelVisuals(false),
  idle:()=>{remote?.clockRestored();checkForUpdates();}
}});
function suspend() {
  remote?.suspend();
  suspended = true;
  controller.suspend();
  cancelVisuals(false);
}
function resume() {
  if(document.hidden) return;
  suspended = false;
  remote?.resume();
  fitViewport();
  if(started) {
    if(controller.suspended) controller.resume();
    else if(currentView==='clock' && !transition.busy && !clock.running) clock.start();
  }
}
bindHoldControl(toggle,{onTap:()=>{if(remote)remote.localTap();else if(controller.tap())++fallbackInteractions;},onHold:()=>loadRemote({show:true})});
window.addEventListener('resize',fitViewport);
window.addEventListener('orientationchange',fitViewport);
window.visualViewport?.addEventListener('resize',fitViewport);
window.visualViewport?.addEventListener('scroll',fitViewport);
window.addEventListener('pageshow',resume);
window.addEventListener('pagehide',suspend);
window.addEventListener('focus',resume);
document.addEventListener('visibilitychange',()=>document.hidden ? suspend() : resume());
reducedMotion.addEventListener('change',()=>{if(reducedMotion.matches){modules.forEach(module=>module.finish());transition.finish();if(signs.classList.contains('is-inserting'))buckle.stop(true);}});
fitViewport();
clock.start();
const requiredAssets = ['seat-belt','no-food-drink','no-smoking-vaping','cctv','tip','buckle-base','buckle-tongue'];
Promise.all(requiredAssets.map(name=>new Promise((resolve,reject)=>{
  const asset = new Image();
  asset.onload = resolve;
  asset.onerror = ()=>reject(new Error('Sign image unavailable: '+name));
  asset.src = './assets/signs/'+name+'.png';
}))).then(async()=>{
  let saved = {};
  try { saved = JSON.parse(sessionStorage.getItem(UPDATE_STATE)||'{}'); sessionStorage.removeItem(UPDATE_STATE); } catch { /* Start safely if storage is unavailable. */ }
  started = true;
  toggle.disabled = false;
  if(document.hidden) { controller.nextPair=saved.nextPair===1 ? 1 : 0; controller.state={kind:'CLOCK_WAITING_FOR_MINUTE'}; controller.suspend(); }
  else await controller.start(saved || {});
  try{if(localStorage.getItem('zapnij-pasy-remote-pair-v1'))loadRemote();}catch{/* Local clock remains available. */}
}).catch(error=>console.warn(error.message));
checkForUpdates = startUpdates({
  isBusy:()=>transition.busy || modules.some(module=>module.pending!==undefined),
  deferReload:()=>!controller.safeToReload,
  beforeReload:()=>{try{sessionStorage.setItem(UPDATE_STATE,JSON.stringify(controller.snapshot()));}catch{} suspend();}
}) || (()=>{});

async function loadRemote({show=false}={}) {
  if(remote){if(show)remote.show();return remote;}
  if(!remoteLoading)remoteLoading=(async()=>{
    const [{RemoteDisplay},response]=await Promise.all([
      import('./remote/display.bundle.js?v=vGPT_2.2.1'),fetch('./firebase-config.json')
    ]);
    if(!response.ok)throw new Error('Remote configuration unavailable');
    const {config}=await response.json();
    remote=new RemoteDisplay({controller,config,preferLocal:fallbackInteractions>0});
    await remote.initialize();return remote;
  })().catch(()=>{remoteLoading=null;console.warn('Pilot niedostępny; zegar i lokalny dotyk działają.');return null;});
  const ready=await remoteLoading;
  if(ready&&show)ready.show();
  else if(show){
    const panel=document.createElement('section');panel.className='pairing-panel';panel.setAttribute('role','dialog');
    const text=document.createElement('p');text.textContent='Parowanie niedostępne. Sprawdź połączenie i ponownie otwórz aplikację. Zegar działa lokalnie.';
    const close=document.createElement('button');close.textContent='Wróć do zegara';close.onclick=()=>panel.remove();
    panel.append(text,close);document.body.append(panel);
  }
  return ready;
}
