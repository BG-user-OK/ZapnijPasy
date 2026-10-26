// Zapnij Pasy vGPT_2.19.1 — two signs rolling as a spaced convoy in either layout.
export const PROHIBITION_ROLL_DURATION=4000;
export function prohibitionGeometry({width,height,size,left=12,right=12,top=10,bottom=10,gap=12}){
  const cell=Math.max(1,(width-left-right-gap)/2),diameter=Math.max(1,Math.min(size,cell,height-top-bottom));
  const first=left+(cell-diameter)/2;
  return {size:diameter,left:first,right:first+cell+gap,y:top+(height-top-bottom-diameter)/2,distance:width,angle:width/(diameter/2)*180/Math.PI};
}
export class ProhibitionAnimation{
  constructor(host,{reducedMotion=()=>false,now=()=>Date.now(),schedule=(fn,ms)=>setTimeout(fn,ms),cancel=id=>clearTimeout(id),measure}={}){
    Object.assign(this,{host,reducedMotion,now,schedule,cancelTimer:cancel});this.pending=null;
    this.measure=measure||(()=>{const r=host.getBoundingClientRect(),s=getComputedStyle(host);return {width:r.width,height:r.height,size:Math.min(r.width,r.height),left:parseFloat(s.paddingLeft)||0,right:parseFloat(s.paddingRight)||0,top:parseFloat(s.paddingTop)||0,bottom:parseFloat(s.paddingBottom)||0,gap:parseFloat(s.columnGap)||12};});
    host.addEventListener('animationend',e=>{const p=this.pending;if(p&&e.target===this.track&&e.animationName==='prohibition-travel'&&this.now()>=p.deadline-32)this.finish(true);});
  }
  prepare(images){
    const existing=this.host.querySelector('.prohibition-scene');if(existing){this.scene=existing;this.track=existing.querySelector('.prohibition-track');return existing;}
    if(!images||images.length!==2)throw Error('Two original prohibition signs required');
    this.scene=document.createElement('div');this.scene.className='prohibition-scene';this.track=document.createElement('div');this.track.className='prohibition-track';
    for(const image of images){const actor=document.createElement('div');actor.className='prohibition-actor';actor.append(image);this.track.append(actor);}
    this.scene.append(this.track);this.host.append(this.scene);this.resize();return this.scene;
  }
  resize(){
    if(!this.host.querySelector('.prohibition-scene'))return;
    const g=prohibitionGeometry(this.measure());this.scene.style.setProperty('--prohibition-size',g.size+'px');
    const actors=this.track.querySelectorAll('.prohibition-actor');actors.forEach((a,i)=>{a.style.left=(i?g.right:g.left)+'px';a.style.top=g.y+'px';});
    this.geometry=g;if(this.pending)this.configure(this.pending.direction);
  }
  configure(direction){
    const g=this.geometry,enter=direction==='enter';
    for(const [name,value] of Object.entries({from:enter?-g.distance:0,to:enter?0:g.distance}))this.scene.style.setProperty('--prohibition-'+name,value+'px');
    this.scene.style.setProperty('--prohibition-angle-from',(enter?-g.angle:0)+'deg');this.scene.style.setProperty('--prohibition-angle-to',(enter?0:g.angle)+'deg');
  }
  rest(){this.cancel();if(!this.track)return;this.resize();this.track.style.transform='translate3d(0px,0,0)';this.track.style.opacity='1';for(const img of this.track.querySelectorAll('img'))img.style.transform='rotate(0deg)';}
  play(direction,{elapsed=0}={}){
    if(!['enter','exit'].includes(direction))throw Error('Unknown prohibition direction');
    this.cancel();this.resize();elapsed=Math.max(0,Math.min(PROHIBITION_ROLL_DURATION,elapsed));this.configure(direction);
    this.scene.style.setProperty('--prohibition-delay',-elapsed+'ms');
    this.track.style.removeProperty('transform');this.track.style.opacity='1';for(const img of this.track.querySelectorAll('img'))img.style.removeProperty('transform');
    void this.scene.offsetHeight;this.scene.classList.add('is-prohibition-rolling');
    return new Promise(resolve=>{this.pending={direction,resolve,deadline:this.now()+PROHIBITION_ROLL_DURATION-elapsed,timer:this.schedule(()=>this.finish(true),PROHIBITION_ROLL_DURATION-elapsed+120)};if(this.reducedMotion()||elapsed===PROHIBITION_ROLL_DURATION)this.finish(true);});
  }
  finish(completed){
    const p=this.pending;if(!p)return;this.pending=null;this.cancelTimer(p.timer);
    if(completed){this.track.style.opacity=p.direction==='exit'?'0':'1';this.track.style.transform='translate3d(0px,0,0)';for(const img of this.track.querySelectorAll('img'))img.style.transform='rotate(0deg)';}
    this.scene.classList.remove('is-prohibition-rolling');p.resolve(completed);
  }
  cancel(){
    if(!this.pending)return;
    for(const el of [this.track,...this.track.querySelectorAll('img')]){const s=getComputedStyle(el);el.style.transform=s.transform;el.style.opacity=s.opacity;}
    this.finish(false);
  }
  updateMotion(){if(this.pending&&this.reducedMotion())this.finish(true);}
}
