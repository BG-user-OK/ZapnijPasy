/** Cancellable fade; its frozen pose can be carried inside outgoing mechanical snapshots. */
export class SceneBlackout{
  constructor(stage,{reducedMotion=()=>false,schedule=(fn,ms)=>setTimeout(fn,ms),cancel=id=>clearTimeout(id),duration=600}={}){
    Object.assign(this,{stage,reducedMotion,schedule,cancelTimer:cancel,duration});this.pending=null;this.element=null;
  }
  play({animate=true}={}){
    this.clear();const node=document.createElement('div');node.className='scene-blackout';node.setAttribute('aria-hidden','true');this.element=node;this.stage.append(node);
    node.style.setProperty('--scene-fade-duration',this.duration+'ms');
    const promise=new Promise(resolve=>{this.pending={resolve,timer:this.schedule(()=>this.finish(true),this.duration+120)};});
    node.addEventListener('animationend',e=>{if(this.element===node&&e.target===node&&e.animationName==='scene-to-black')this.finish(true);});
    if(!animate||this.reducedMotion())this.finish(true);return promise;
  }
  finish(completed){
    if(!this.pending)return;const p=this.pending;this.pending=null;this.cancelTimer(p.timer);
    if(completed){this.element.style.opacity='1';this.element.style.animation='none';}p.resolve(completed);
  }
  freezeInto(view){
    if(this.element){const opacity=getComputedStyle(this.element).opacity;if(Number(opacity)>0){const frozen=document.createElement('div');frozen.className='scene-frozen-blackout';frozen.style.opacity=opacity;view.append(frozen);}}
    this.clear();
  }
  clear(){this.finish(false);this.element?.remove();this.element=null;}
  get busy(){return !!this.pending;}
}
