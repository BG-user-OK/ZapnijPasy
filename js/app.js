// Zapnij Pasy vGPT_2.20.1
import { Flap } from './flap.js?v=vGPT_2.20.1';
import { Clock } from './clock.js?v=vGPT_2.20.1';
import { ViewTransition } from './view-transition.js?v=vGPT_2.20.1';
import { SeatBeltAnimation, createSeatBeltSign } from './seat-belt-animation.js?v=vGPT_2.20.1';
import { ConfirmationAnimation } from './confirmation-animation.js?v=vGPT_2.20.1';
import { ExtrasAnimation } from './extras-animation.js?v=vGPT_2.20.1';
import { ProhibitionAnimation, prohibitionGeometry } from './prohibition-animation.js?v=vGPT_2.20.1';
import { DisplayController } from './display-controller.js?v=vGPT_2.20.1';
import { bindHoldControl } from './hold-control.js?v=vGPT_2.20.1';
import { startUpdates } from './updates.js?v=vGPT_2.20.1';
import { BrightnessControl } from './brightness.js?v=vGPT_2.20.1';
import { DisplayLayout, layoutGeometry } from './display-layout.js?v=vGPT_2.20.1';
import { DateFlap } from './date-flap.js?v=vGPT_2.20.1';
import { SceneBlackout } from './scene-blackout.js?v=vGPT_2.20.1';
import { MusicSlide } from './music-slide.js?v=vGPT_2.20.1';

const APP_VERSION='vGPT_2.20.1';
const stage = document.querySelector('.stage');
const root = stage.querySelector('.clock');
const signs = stage.querySelector('.signs');
const toggle = stage.querySelector('.mode-toggle');
const brightnessToggle = stage.querySelector('.brightness-toggle');
const layoutToggle = stage.querySelector('.layout-toggle');
const clockOnlyToggle = stage.querySelector('.clock-only-toggle');
let layoutStorage=null;try{layoutStorage=window.localStorage;}catch{/* Device-local preference is optional. */}
const layout = new DisplayLayout({stage,clock:root,signs,document,storage:layoutStorage});
const brightness = new BrightnessControl({version:APP_VERSION,onTaxiChange:()=>controller?.extrasPreferenceChanged()});
brightness.attach(root);
brightness.attach(signs);
const modules = Array.from(root.querySelectorAll('.digit'), element => new Flap(element));
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const dateFlap = new DateFlap(layout.blank,{reducedMotion:()=>reducedMotion.matches});
brightness.attach(layout.blank);
const blackout = new SceneBlackout(stage,{reducedMotion:()=>reducedMotion.matches});
const UPDATE_STATE = 'zapnij-pasy-update-sequence-v1';
const graphics = {
  rules:[['no-smoking-vaping','Zakaz palenia'],['no-food-drink','Zakaz jedzenia i picia']]
};
let remote=null;
let music=null;
let remoteLoading=null;
let fallbackInteractions=0;
let controller;
let transition;
let currentView = 'clock';
let suspended = false;
let interrupting = false;
let started = false;
let checkForUpdates = () => {};
let visualRevision=0;

function fitViewport() {
  if (transition?.busy) transition.finish();
  const viewport = window.visualViewport;
  const width = viewport ? viewport.width : window.innerWidth;
  const height = viewport ? viewport.height : window.innerHeight;
  Object.assign(stage.style, {width:width+'px',height:height+'px',left:(viewport ? viewport.offsetLeft : 0)+'px',top:(viewport ? viewport.offsetTop : 0)+'px'});
  const style = getComputedStyle(root);
  const {gap,cardHeight,digitSize,signSize}=layoutGeometry(width,height,layout.portrait,{top:parseFloat(style.paddingTop),bottom:parseFloat(style.paddingBottom),left:parseFloat(style.paddingLeft),right:parseFloat(style.paddingRight)});
  stage.style.setProperty('--gap', gap+'px');
  stage.style.setProperty('--card-height',cardHeight+'px');
  stage.style.setProperty('--digit-size',digitSize+'px');
  const signStyle=getComputedStyle(signs);
  const landscapeSize=prohibitionGeometry({width,height,size:Math.min(width,height),left:parseFloat(signStyle.paddingLeft)||0,right:parseFloat(signStyle.paddingRight)||0,top:parseFloat(signStyle.paddingTop)||0,bottom:parseFloat(signStyle.paddingBottom)||0,gap:parseFloat(signStyle.columnGap)||6}).size;
  stage.style.setProperty('--sign-size',(layout.portrait?signSize:Math.floor(landscapeSize))+'px');
  Object.assign(toggle.style,{left:width/2+'px',top:height/2+'px',width:width/2+'px',height:height/2+'px'});
  extras.resize();
  prohibitions.resize();
  dateFlap.resize();
}
function image(name, alt = '') {
  const element = document.createElement('img');
  element.src = './Grafiki/signs/'+name+'.png';
  element.alt = alt;
  element.width = element.height = 512;
  return element;
}
function renderGraphic(view) {
  prohibitions.cancel();
  confirmation.cancel();
  extras.cancel();
  buckle.stop(false);
  buckle.stopReminder();
  signs.replaceChildren();
  if(view==='black'){
    signs.setAttribute('aria-label','');
  } else if(view==='extras'){
    extras.prepare();extras.resize();
    signs.setAttribute('aria-label','Monitoring, następnie skarbonka na napiwki');
  } else if (view === 'belts') {
    signs.append(createSeatBeltSign(image('seat-belt','Zapnij pasy')));
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
    signs.setAttribute('aria-label','Zapnij pasy — osoba po lewej, zapinanie klamry po prawej');
  } else {
    for (const [asset,alt] of graphics[view]) signs.append(image(asset,alt));
    signs.setAttribute('aria-label',graphics[view].map(item=>item[1]).join('. '));
  }
  signs.dataset.content = view;if(view==='belts')signs.dataset.alarmBright='true';
  if(view==='rules')prepareProhibitions();
  brightness.attach(signs);
}
function prepareProhibitions(){prohibitions.prepare([...signs.querySelectorAll('img')]);}
const clock = new Clock({update(time,{animate}) {
  modules.forEach((module,index)=>module.setValue(time.digits[index],{animate:animate && !reducedMotion.matches}));
  root.setAttribute('aria-label',time.text);
  if(controller?.clockOnly&&layout.portrait)dateFlap.refresh({animate});
  controller?.onClockMinute(time,{natural:animate,completed:Promise.all(modules.map(module=>module.whenFinished()))});
}});
function settleClock() { clock.stop(); modules.forEach(module=>module.finish()); }
const extras = new ExtrasAnimation(signs,{reducedMotion:()=>reducedMotion.matches,cameraEnabled:()=>!brightness.taxiMode});
const prohibitions = new ProhibitionAnimation(signs,{reducedMotion:()=>reducedMotion.matches});
const confirmation = new ConfirmationAnimation(signs,{reducedMotion:()=>reducedMotion.matches});
const buckle = new SeatBeltAnimation(signs,{reducedMotion:()=>reducedMotion.matches});
transition = new ViewTransition(stage,{clock:root,signs},{
  measure:()=>layout.bounds(),
  beforeChange:()=>{if(!layout.portrait)settleClock();},
  beforeReveal(mode) { if (mode==='clock'&&!layout.portrait) clock.sync(true); },
  onChange(mode) { stage.dataset.mode=mode;toggle.setAttribute('aria-pressed',String(mode==='signs')); },
  reducedMotion:()=>reducedMotion.matches
});
layout.apply(transition);
layoutToggle.setAttribute('aria-pressed',String(layout.portrait));
function cancelVisuals(completeInsertion=false) {
  music?.cancel();
  interrupting = true;
  ++visualRevision;
  transition.finish();
  blackout.freezeInto(transition.views[transition.mode]);
  dateFlap.cancel();
  prohibitions.cancel();
  extras.cancel();
  confirmation.cancel({preserveBlack:true});
  buckle.stopReminder();
  buckle.stop(completeInsertion && currentView==='belts');
  if(!layout.portrait||document.hidden||suspended)settleClock();
  interrupting = false;
}
controller = new DisplayController({continuous:()=>layout.portrait,cameraEnabled:()=>!brightness.taxiMode,passengerAllowed:()=>remote?.workAllowed===true,storage:layoutStorage,effects:{
  clockOnly:updateClockOnlyControl,
  dimBelts:bright=>{signs.dataset.alarmBright=String(bright);},
  async fadeToBlack({animate}){
    brightness.close();const revision=++visualRevision;
    const completed=await blackout.play({animate});
    if(revision!==visualRevision||!completed)return false;
    transition.show('signs',{animate:false,force:true,prepare:()=>{renderGraphic('black');dateFlap.hide();}});
    currentView='black';blackout.clear();return true;
  },
  async show(view,{animate}) {
    if(view==='belts')brightness.close();
    const revision=++visualRevision;
    const target = view==='clock'||view==='solo' ? 'clock' : 'signs';
    const rollingEntry=view==='rules'&&animate;
    const mechanical=animate&&view!=='rules'&&!(layout.portrait&&(currentView==='rules'||view==='solo'));
    const changed = currentView!==view || view==='solo' || (view==='belts'&&!!signs.querySelector('.confirmation-blackout'));
    currentView = view;
    toggle.setAttribute('aria-label',view==='clock' || view==='solo' || view==='rules' || view==='extras' ? 'Nowy pasażer — pokaż przypomnienie o pasach' : 'Pasażer zapiął pasy — potwierdź');
    const reveal=async()=>{
      let rolling=null,dateReady=null;
      transition.show(target,{animate:mechanical,force:changed,prepare:()=>{
        for(const surface of [root,signs,layout.blank])surface.querySelectorAll('.scene-frozen-blackout').forEach(node=>node.remove());
        if(view==='solo'&&layout.portrait)dateReady=dateFlap.show({animate});else dateFlap.hide();
        if(target==='signs')renderGraphic(view);if(rollingEntry)rolling=prohibitions.play('enter');
      }});
      if(view==='rules'&&!animate){prepareProhibitions();prohibitions.rest();}
      await transition.whenFinished();
      if(rolling)await rolling;
      if(dateReady)await dateReady;
    };
    await reveal();
    if(revision!==visualRevision)return;
    if(view==='clock'&&currentView==='clock'){
      confirmation.cancel();
      if(!document.hidden&&!suspended&&!interrupting)clock.start();
    }
    if(view==='solo'&&currentView==='solo'){
      confirmation.cancel();if(!document.hidden&&!suspended&&!interrupting&&!clock.running)clock.start();
    }
    if(layout.portrait&&!document.hidden&&!suspended&&!interrupting&&!clock.running)clock.start();
  },
  extras:options=>extras.play(options),
  music:options=>music?.play(options),
  departRules:options=>{prepareProhibitions();return prohibitions.play('exit',options);},
  insert:()=>buckle.play(),
  retract:()=>buckle.play({reverse:true}),
  resetInsertion:()=>{buckle.stop(false);buckle.startReminder();},
  confirmation:(name,options)=>{brightness.close();return confirmation.play(name,options);},
  freeze:()=>cancelVisuals(true),
  cancel:()=>cancelVisuals(false),
  idle:()=>{remote?.clockRestored();checkForUpdates();}
}});
music=new MusicSlide({onMode:action=>{
  if(remote?.workAllowed!==true)return;
  if(controller.state.kind.startsWith('PASSENGER'))return;
  if(action==='SOLO'){if(remote)remote.localClockOnly();else controller.enterClockOnly();}
  else if(remote)remote.startPresentation();else controller.beginPresentation();
},eligible:()=>started&&!layout.portrait&&!controller.suspended&&!remote?.listening?.active&&!controller.state.kind.startsWith('PASSENGER')});
brightness.attach(music.view);
function updateClockOnlyControl(value){
  clockOnlyToggle.setAttribute('aria-pressed',String(value));
  clockOnlyToggle.setAttribute('aria-label',value?'Pokaż znaki i muzykę — bez przypomnienia o pasach':'Jadę sam — tylko zegar');
}
updateClockOnlyControl(controller.clockOnly);
function suspend() {
  brightness.suspend();
  remote?.suspend();
  suspended = true;
  controller.suspend();
  cancelVisuals(false);
}
function resume() {
  if(document.hidden) return;
  brightness.resume();
  suspended = false;
  remote?.resume();
  fitViewport();
  if(started) {
    if(controller.suspended) controller.resume();
    else if((layout.portrait||currentView==='clock'||currentView==='solo') && !transition.busy && !clock.running) clock.start();
  }
}
bindHoldControl(toggle,{onTap:()=>{if(remote?.workAllowed!==true)return;music.cancel();if(remote)remote.localTap();else if(controller.tap())++fallbackInteractions;},onHold:()=>loadRemote({show:true})});
bindHoldControl(brightnessToggle,{onTap:()=>brightness.open(),onHold:()=>{brightness.close();loadRemote({show:true});}});
bindHoldControl(clockOnlyToggle,{onTap:()=>{if(!started)return;if(remote)remote.localToggleClockOnly();else if(controller.toggleClockOnly())++fallbackInteractions;}});
layoutToggle.addEventListener('click',()=>{
  if(!started)return;
  brightness.close();layout.toggle(transition);layoutToggle.setAttribute('aria-pressed',String(layout.portrait));fitViewport();
  if(currentView==='rules'&&!prohibitions.pending){prepareProhibitions();prohibitions.rest();}
  if(layout.portrait&&!document.hidden&&!suspended&&!clock.running)clock.start();
  else if(!layout.portrait&&currentView!=='clock'&&currentView!=='solo')settleClock();
  if(!layout.portrait)dateFlap.hide();
  controller.layoutChanged();
});
window.addEventListener('resize',fitViewport);
window.addEventListener('orientationchange',fitViewport);
window.visualViewport?.addEventListener('resize',fitViewport);
window.visualViewport?.addEventListener('scroll',fitViewport);
window.addEventListener('pageshow',resume);
window.addEventListener('pagehide',suspend);
window.addEventListener('focus',resume);
document.addEventListener('visibilitychange',()=>document.hidden ? suspend() : resume());
reducedMotion.addEventListener('change',()=>{extras.updateMotion();prohibitions.updateMotion();if(reducedMotion.matches){modules.forEach(module=>module.finish());dateFlap.cancel();blackout.finish(true);transition.finish();if(signs.classList.contains('is-inserting')||signs.classList.contains('is-retracting'))buckle.stop(signs.classList.contains('is-inserting'));}});
fitViewport();
clock.start();
if(document.hidden)brightness.suspend();else brightness.requestLocation();
const requiredAssets = ['thumbs-up.svg','seat-belt','no-food-drink','no-smoking-vaping','cctv','tip','buckle-base','buckle-tongue'];
Promise.all(requiredAssets.map(name=>new Promise((resolve,reject)=>{
  const asset = new Image();
  asset.onload = resolve;
  asset.onerror = ()=>reject(new Error('Sign image unavailable: '+name));
  asset.src = './Grafiki/signs/'+name+(name.includes('.')?'':'.png');
}))).then(async()=>{
  let saved = {};
  try { saved = JSON.parse(sessionStorage.getItem(UPDATE_STATE)||'{}'); sessionStorage.removeItem(UPDATE_STATE); } catch { /* Start safely if storage is unavailable. */ }
  started = true;
  toggle.disabled = false;
  layoutToggle.disabled = false;
  clockOnlyToggle.disabled = false;
  if(document.hidden) { controller.nextPair=saved.nextPair===1 ? 1 : 0; controller.state={kind:controller.clockOnly?'CLOCK_ONLY':'CLOCK_WAITING_FOR_MINUTE'}; controller.suspend(); }
  // Pairing must be able to interrupt the first rolling entrance, without waiting for it.
  else controller.start(saved || {}).catch(error=>console.warn(error.message));
  try{if(localStorage.getItem('zapnij-pasy-remote-pair-v1')||/^#supervisor-invite=/.test(location.hash))loadRemote();}catch{/* Local clock remains available. */}
}).catch(error=>console.warn(error.message));
checkForUpdates = startUpdates({
  isBusy:()=>transition.busy || blackout.busy || dateFlap.busy || modules.some(module=>module.pending!==undefined),
  deferReload:()=>!controller.safeToReload || !brightness.panel.hidden,
  beforeReload:()=>{try{sessionStorage.setItem(UPDATE_STATE,JSON.stringify(controller.snapshot()));}catch{} suspend();}
}) || (()=>{});

async function loadRemote({show=false}={}) {
  if(remote){if(show)remote.show();return remote;}
  if(!remoteLoading)remoteLoading=(async()=>{
    const [{RemoteDisplay},response]=await Promise.all([
      import('./remote/display.bundle.js?v=vGPT_2.20.1'),fetch('./firebase-config.json')
    ]);
    if(!response.ok)throw new Error('Remote configuration unavailable');
    const {config}=await response.json();
    remote=new RemoteDisplay({controller,config,preferLocal:fallbackInteractions>0,onListeningActive:()=>music.cancel()});
    await remote.initialize();return remote;
  })().catch(()=>{remoteLoading=null;console.warn('Pilot niedostępny; zegar i lokalny dotyk działają.');return null;});
  const ready=await remoteLoading;
  if(ready&&show)ready.show();
  else if(show){
    const panel=document.createElement('section');panel.className='pairing-panel';panel.setAttribute('role','dialog');
    const text=document.createElement('p');text.textContent='Parowanie niedostępne. Sprawdź połączenie i ponownie otwórz aplikację. Zegar działa lokalnie.';
    const close=document.createElement('button');close.textContent='Wróć do zegara';close.onclick=()=>panel.remove();
    const musicButton=document.createElement('button');musicButton.textContent='Pokaz muzyki TBox';musicButton.onclick=()=>{panel.remove();music.open();};
    panel.append(text,musicButton,close);document.body.append(panel);
  }
  return ready;
}
