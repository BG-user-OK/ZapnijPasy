// Zapnij Pasy vGPT_2.7.0 — bounded, cancellable physical flips; no text rolling.
import {FLAP_SETTLE_DURATION} from './flap.js?v=vGPT_2.7.0';
export const CLOCK_ENTRY_DURATION=3500;
const FINAL_FALL=280;
export class ClockEntryAnimation {
 constructor(modules,{read,reducedMotion=()=>false,now=()=>performance.now(),schedule=(fn,ms)=>setTimeout(fn,ms),cancel=id=>clearTimeout(id)}={}) {
  this.modules=modules;this.read=read;this.reducedMotion=reducedMotion;this.now=now;this.schedule=schedule;this.cancelTimer=cancel;this.operation=null;
 }
 get busy(){return this.operation!==null;}
 valid(operation){return this.operation===operation;}
 paintCurrent(){const time=this.read();this.modules.forEach((module,i)=>module.setValue(time.digits[i],{animate:false}));}
 finish(completed=true){const operation=this.operation;if(!operation)return;this.operation=null;this.cancelTimer(operation.timer);this.modules.forEach(module=>module.finish());if(completed)this.paintCurrent();operation.resolve(completed);}
 cancel(){this.finish(false);}
 play({reveal=()=>Promise.resolve()}={}) {
  this.cancel();
  const current=this.read().digits;
  const values=[(Number(current[0])+7)%24,(Number(current[1])+23)%60];
  this.modules.forEach((module,i)=>module.setValue(i?String(values[i]).padStart(2,'0'):String(values[i]),{animate:false}));
  let resolve;const result=new Promise(done=>resolve=done);const operation={resolve,timer:null};this.operation=operation;
  this.run(operation,values,reveal).catch(()=>{if(this.valid(operation))this.finish(true);});
  return result;
 }
 async run(operation,values,reveal){
  await reveal();if(!this.valid(operation))return;
  if(this.reducedMotion()){this.finish(true);return;}
  const startedAt=this.now(),fastDuration=CLOCK_ENTRY_DURATION-FINAL_FALL-FLAP_SETTLE_DURATION;
  operation.timer=this.schedule(()=>{if(this.valid(operation))this.finish(true);},CLOCK_ENTRY_DURATION+200);
  while(this.valid(operation)){
   const elapsed=this.now()-startedAt,remaining=fastDuration-elapsed;if(remaining<=1)break;
   const duration=Math.max(1,Math.min(120+100*Math.min(1,elapsed/fastDuration),remaining));
   values[0]=(values[0]+1)%24;values[1]=(values[1]+1)%60;
   this.modules.forEach((module,i)=>module.setValue(i?String(values[i]).padStart(2,'0'):String(values[i]),{duration,settle:false,force:true}));
   await Promise.all(this.modules.map(module=>module.whenFinished()));
  }
  if(!this.valid(operation))return;
  const target=this.read();
  this.modules.forEach((module,i)=>module.setValue(target.digits[i],{duration:FINAL_FALL,settle:true,force:true}));
  await Promise.all(this.modules.map(module=>module.whenFinished()));
  if(this.valid(operation))this.finish(true);
 }
}
