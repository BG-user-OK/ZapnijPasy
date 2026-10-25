export function driverIndicators(value,now){
  const fresh=value?.protocol===1&&Number.isFinite(value.updatedAt)&&value.updatedAt<=now+1000&&value.updatedAt>=now-15000&&value.expiresAt>now&&value.expiresAt<=now+15000;
  return {ready:!!(fresh&&value.ready===true&&value.workMode==='WORK'),listening:!!(fresh&&value.microphoneHealthy===true)};
}
export class DriverStatus {
  constructor({link,pairId,document=globalThis.document,window=globalThis.window}){
    this.link=link;this.window=window;this.value=null;this.closed=false;
    if(!document?.body){this.closed=true;return;}
    this.view=document.createElement('div');this.view.className='driver-status';this.view.hidden=true;
    this.green=document.createElement('span');this.green.className='driver-ready';this.green.setAttribute('aria-label','Praca i automat gotowe');
    this.yellow=document.createElement('span');this.yellow.className='driver-listening';this.yellow.setAttribute('aria-label','Sprawny nasłuch aktywny');
    this.view.append(this.green,this.yellow);document.body.append(this.view);
    this.off=link.watch('pairs/'+pairId+'/driverStatus',v=>{this.value=v;this.render()},()=>{this.value=null;this.render()});
  }
  render(){
    if(this.closed)return;this.window.clearTimeout(this.timer);
    const status=driverIndicators(this.value,this.link.now());this.green.hidden=!status.ready;this.yellow.hidden=!status.listening;this.view.hidden=!status.ready&&!status.listening;
    if(this.value?.expiresAt>this.link.now())this.timer=this.window.setTimeout(()=>this.render(),Math.min(1000,this.value.expiresAt-this.link.now()+1));
  }
  close(){this.closed=true;this.off?.();this.window?.clearTimeout(this.timer);this.view?.remove()}
}
