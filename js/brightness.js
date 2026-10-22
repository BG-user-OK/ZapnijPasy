// Zapnij Pasy vGPT_2.11.0 — device-local brightness, coarse location only, no remote writes.
import {KATOWICE,validCoordinates,daylightState} from './solar-times.js?v=vGPT_2.11.0';
export const BRIGHTNESS_LEVELS=Object.freeze([10,20,35,50,75,100]);
export const BRIGHTNESS_KEY='zapnij-pasy-brightness-v1';
const GPS_INTERVAL=600000,LOCATION_AGE=86400000;
export class BrightnessState{
  constructor({now=Date.now,storage=null}={}){
    this.now=now;this.storage=storage;this.nightLevel=20;this.override=null;this.location=null;
    try{const saved=JSON.parse(storage?.getItem(BRIGHTNESS_KEY)||'{}');if(BRIGHTNESS_LEVELS.includes(saved.nightLevel))this.nightLevel=saved.nightLevel;if(saved.override&&BRIGHTNESS_LEVELS.includes(saved.override.level)&&Number.isFinite(saved.override.until)&&Number.isFinite(saved.override.startedAt)&&typeof saved.override.night==='boolean'&&saved.override.until>saved.override.startedAt)this.override=saved.override;if(validCoordinates(saved.location)&&Number.isFinite(saved.location.at))this.location={latitude:Math.round(saved.location.latitude*100)/100,longitude:Math.round(saved.location.longitude*100)/100,at:saved.location.at};}catch{/* Storage is optional. */}
  }
  save(){try{this.storage?.setItem(BRIGHTNESS_KEY,JSON.stringify({nightLevel:this.nightLevel,override:this.override,location:this.location}));}catch{/* Keep working with memory-only settings. */}}
  current(){
    const now=this.now(),age=this.location?now-this.location.at:Infinity;
    const useLocation=age>=-60000&&age<=LOCATION_AGE;
    const point=useLocation?this.location:KATOWICE,solar=daylightState(now,point);
    if(this.location&&!useLocation){this.location=null;this.save();}
    if(this.override&&(now>=this.override.until||now<this.override.startedAt||solar.night!==this.override.night)){this.override=null;this.save();}
    return {...solar,level:this.override?.level??(solar.night?this.nightLevel:100),nightLevel:this.nightLevel,locationSource:useLocation?'gps':'katowice',locationAge:age,manual:!!this.override};
  }
  choose(level){
    if(!BRIGHTNESS_LEVELS.includes(level))throw new TypeError('Invalid brightness level');
    const solar=this.current();this.nightLevel=level;this.override={level,night:solar.night,startedAt:this.now(),until:solar.nextBoundary};this.save();return this.current();
  }
  setLocation(point){
    if(!validCoordinates(point))return false;
    this.location={latitude:Math.round(point.latitude*100)/100,longitude:Math.round(point.longitude*100)/100,at:this.now()};
    this.save();return true;
  }
}
export class BrightnessControl{
  constructor({document=globalThis.document,window=globalThis.window,storage,geolocation,now=Date.now,schedule=(fn,delay)=>window.setTimeout(fn,delay),cancel=id=>window.clearTimeout(id),state}={}){
    this.document=document;this.window=window;this.now=now;this.schedule=schedule;this.cancel=cancel;
    if(storage===undefined){try{storage=window.localStorage;}catch{storage=null;}}
    this.state=state||new BrightnessState({storage,now});this.geolocation=geolocation===undefined?window.navigator?.geolocation:geolocation;
    this.timer=null;this.suspended=false;this.locationRevision=0;this.inFlight=false;this.lastAttempt=-Infinity;this.denied=false;this.gpsError='';
    this.panel=document.createElement('section');this.panel.id='brightness-panel';this.panel.className='brightness-panel';this.panel.hidden=true;this.panel.setAttribute('role','dialog');this.panel.setAttribute('aria-modal','true');this.panel.setAttribute('aria-label','Jasność');
    const controls=document.createElement('div');controls.className='brightness-controls';
    this.title=document.createElement('p');this.title.className='brightness-title';controls.append(this.title);
    const bar=document.createElement('div');bar.className='brightness-bar';bar.setAttribute('role','group');bar.setAttribute('aria-label','Poziom jasności');
    this.buttons=BRIGHTNESS_LEVELS.map(level=>{const b=document.createElement('button');b.type='button';b.className='brightness-level';b.dataset.level=String(level);b.setAttribute('aria-label','Jasność '+level+' procent');const dot=document.createElement('span');dot.className='brightness-dot';dot.setAttribute('aria-hidden','true');const label=document.createElement('span');label.textContent=level+'%';b.append(dot,label);b.addEventListener('click',event=>{event.stopPropagation();this.state.choose(level);this.refresh();this.close();});bar.append(b);return b;});
    controls.append(bar);this.status=document.createElement('p');this.status.className='brightness-status';controls.append(this.status);this.panel.append(controls);document.body.append(this.panel);
    for(const event of ['pointerdown','pointerup','pointercancel'])this.panel.addEventListener(event,e=>e.stopPropagation());
    this.panel.addEventListener('click',e=>{e.stopPropagation();if(e.target===this.panel)this.close();});
    this.onKey=e=>{if(e.key==='Escape'&&!this.panel.hidden){e.preventDefault();this.close();}};document.addEventListener('keydown',this.onKey);
    this.refresh();
  }
  attach(view){
    if(!view.querySelector('.content-dimmer')){const dimmer=this.document.createElement('div');dimmer.className='content-dimmer';dimmer.setAttribute('aria-hidden','true');view.append(dimmer);}
  }
  refresh(){
    this.cancel(this.timer);this.timer=null;
    const current=this.state.current();this.document.documentElement.style.setProperty('--content-darkness',String((100-current.level)/100));
    for(const button of this.buttons)button.setAttribute('aria-pressed',String(Number(button.dataset.level)===current.level));
    this.title.textContent='Jasność · '+current.level+'%'+(current.manual?' · ręczna':current.night?' · noc':' · dzień');
    this.status.textContent=current.locationSource==='gps'?(this.gpsError?'Ostatnia lokalizacja GPS':current.locationAge>GPS_INTERVAL?'Ostatnia lokalizacja GPS':'Lokalizacja GPS'):(this.denied?'Katowice · zezwól na lokalizację w przeglądarce':'Katowice · lokalizacja zapasowa');
    if(!this.suspended)this.timer=this.schedule(()=>{this.refresh();this.requestLocation();},Math.max(1,Math.min(60000,current.nextBoundary-this.now())));
    return current;
  }
  requestLocation(force=false){
    if(this.suspended||this.inFlight||!this.geolocation||(this.denied&&!force))return;
    const elapsed=this.now()-this.lastAttempt;if(elapsed>=0&&elapsed<(force?60000:GPS_INTERVAL))return;
    this.lastAttempt=this.now();this.inFlight=true;const revision=++this.locationRevision;
    const finish=()=>{if(revision!==this.locationRevision||this.suspended)return false;this.inFlight=false;return true;};
    try{this.geolocation.getCurrentPosition(position=>{if(!finish())return;this.denied=false;if(this.state.setLocation(position?.coords)){this.gpsError='';}else this.gpsError='unavailable';this.refresh();},error=>{if(!finish())return;this.denied=error?.code===1;this.gpsError=this.denied?'denied':'unavailable';this.refresh();},{enableHighAccuracy:false,maximumAge:300000,timeout:10000});}catch{if(finish()){this.gpsError='unavailable';this.refresh();}}
  }
  open(){this.refresh();this.panel.hidden=false;this.document.querySelector('.brightness-toggle')?.setAttribute('aria-expanded','true');this.requestLocation(true);this.buttons.find(b=>b.getAttribute('aria-pressed')==='true')?.focus();}
  close(){if(this.panel.hidden)return;this.panel.hidden=true;const trigger=this.document.querySelector('.brightness-toggle');trigger?.setAttribute('aria-expanded','false');trigger?.focus();}
  suspend(){this.suspended=true;this.cancel(this.timer);this.timer=null;++this.locationRevision;this.inFlight=false;this.close();}
  resume(){this.suspended=false;this.refresh();this.requestLocation();}
  destroy(){this.suspend();this.document.removeEventListener('keydown',this.onKey);this.panel.remove();}
}
