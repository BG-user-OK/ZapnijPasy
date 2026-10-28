export function driverIndicators(value,now){
  const fresh=value?.protocol===1&&Number.isFinite(value.updatedAt)&&value.updatedAt<=now+1000&&value.updatedAt>=now-15000&&value.expiresAt>now&&value.expiresAt<=now+15000;
  return {ready:!!(fresh&&value.ready===true&&value.workMode==='WORK'),listening:!!(fresh&&value.microphoneHealthy===true)};
}
export function hourIndicator(value,now){const s=driverIndicators(value,now);return s.listening?'listening':s.ready?'ready':'idle';}
export class DriverStatus {
  constructor({link,pairId,document=globalThis.document,window=globalThis.window}){
    this.link=link;this.window=window;this.document=document;this.value=null;this.closed=!document?.documentElement;
    if(this.closed)return;
    this.off=link.watch('pairs/'+pairId+'/driverStatus',v=>{this.value=v;this.render()},()=>{this.value=null;this.render()});this.render();
  }
  render(){
    if(this.closed)return;this.window.clearTimeout(this.timer);
    this.document.documentElement.dataset.driverState=hourIndicator(this.value,this.link.now());
    if(this.value?.expiresAt>this.link.now())this.timer=this.window.setTimeout(()=>this.render(),Math.min(1000,this.value.expiresAt-this.link.now()+1));
  }
  close(){this.closed=true;this.off?.();this.window?.clearTimeout(this.timer);if(this.document?.documentElement)this.document.documentElement.dataset.driverState='idle';}
}
