// Zapnij Pasy vGPT_2.5.0 — one cancellable camera/rolling-piggy timeline.
export const EXTRAS_DURATION=60000;
export const EXTRAS_STEPS=Object.freeze([
 {name:'camera-enter',start:0,end:4000},{name:'camera-visible',start:4000,end:34000},
 {name:'camera-exit',start:34000,end:38000},{name:'black',start:38000,end:41000},
 {name:'piggy-enter',start:41000,end:45000},{name:'piggy-hold',start:45000,end:56000},
 {name:'piggy-exit',start:56000,end:60000}
]);
export function extrasPhase(elapsed){return EXTRAS_STEPS.find(step=>elapsed<step.end)?.name||'complete';}
export function extrasGeometry({width,height,size}) {
 const diameter=Math.max(1,Math.min(size,width-24,height-20));
 const centerX=(width-diameter)/2;
 return {size:diameter,cameraStart:-diameter,cameraTop:10,cameraBottom:height-diameter-10,cameraEnd:height,
  centerX,piggyStart:width,piggyEnd:-diameter,centerY:(height-diameter)/2,
  rollStart:(width-centerX)/(diameter/2)*180/Math.PI,rollEnd:(-diameter-centerX)/(diameter/2)*180/Math.PI};
}
export class ExtrasAnimation {
 constructor(host,{reducedMotion=()=>false,now=()=>Date.now(),schedule=(fn,ms)=>setTimeout(fn,ms),cancel=id=>clearTimeout(id),measure}={}) {
  this.host=host;this.reducedMotion=reducedMotion;this.now=now;this.schedule=schedule;this.cancelTimer=cancel;this.pending=null;this.startedAt=0;
  this.measure=measure||(()=>{const rect=host.getBoundingClientRect();return {...rect,width:rect.width,height:rect.height,size:parseFloat(getComputedStyle(host).getPropertyValue('--sign-size'))||Math.min(rect.height-20,(rect.width-36)/2)};});
  host.addEventListener('animationend',event=>{
   if(this.pending&&event.target===this.host.querySelector('.extras-piggy')&&['extras-piggy-travel','extras-piggy-reduced'].includes(event.animationName)&&this.now()-this.startedAt>=EXTRAS_DURATION-32)this.finish(true);
  });
 }
 prepare(){
  let scene=this.host.querySelector('.extras-scene');if(scene)return scene;
  scene=document.createElement('div');scene.className='extras-scene';
  for(const [name,asset,alt] of [['camera','cctv','Monitoring'],['piggy','tip','Skarbonka na napiwki']]){
   const actor=document.createElement('div');actor.className='extras-'+name;
   const img=document.createElement('img');img.src='./Grafiki/signs/'+asset+'.png';img.alt=alt;img.width=img.height=512;
   actor.append(img);scene.append(actor);
  }
  this.host.append(scene);return scene;
 }
 configure(){
  const scene=this.prepare(),g=extrasGeometry(this.measure());
  for(const [name,value]of Object.entries({size:g.size,'camera-start':g.cameraStart,'camera-top':g.cameraTop,'camera-bottom':g.cameraBottom,'camera-end':g.cameraEnd,'center-x':g.centerX,'piggy-start':g.piggyStart,'piggy-end':g.piggyEnd,'center-y':g.centerY}))scene.style.setProperty('--extras-'+name,value+'px');
  scene.style.setProperty('--extras-roll-start',g.rollStart+'deg');scene.style.setProperty('--extras-roll-end',g.rollEnd+'deg');
 }
 apply(elapsed){
  const scene=this.prepare();scene.classList.remove('is-extras-running');
  for(const actor of scene.querySelectorAll('.extras-camera,.extras-piggy,.extras-piggy img')){actor.style.removeProperty('transform');actor.style.removeProperty('opacity');}
  scene.style.setProperty('--extras-delay',-elapsed+'ms');scene.style.setProperty('--piggy-delay',(41000-elapsed)+'ms');
  scene.classList.toggle('is-extras-reduced',this.reducedMotion());this.configure();
  void scene.offsetHeight;scene.classList.add('is-extras-running');
 }
 play({elapsed=0}={}) {
  this.cancel();elapsed=Math.max(0,Math.min(EXTRAS_DURATION,elapsed));this.startedAt=this.now()-elapsed;
  this.apply(elapsed);
  if(elapsed>=EXTRAS_DURATION)return Promise.resolve(true);
  return new Promise(resolve=>{this.pending={resolve,timer:this.schedule(()=>this.finish(true),EXTRAS_DURATION-elapsed+150)};});
 }
 finish(completed){const pending=this.pending;this.pending=null;if(pending){this.cancelTimer(pending.timer);pending.resolve(completed);}}
 cancel(){
  const scene=this.host.querySelector('.extras-scene');
  if(scene){
   // Preserve the current pose in the outgoing mechanical-flap snapshot.
   for(const actor of scene.querySelectorAll('.extras-camera,.extras-piggy,.extras-piggy img')){
    const style=getComputedStyle(actor);actor.style.transform=style.transform;actor.style.opacity=style.opacity;
   }
   scene.classList.remove('is-extras-running');
  }
  this.finish(false);
 }
 resize(){if(this.host.querySelector('.extras-scene'))this.configure();}
 updateMotion(){if(this.pending)this.apply(Math.max(0,Math.min(EXTRAS_DURATION,this.now()-this.startedAt)));}
}
