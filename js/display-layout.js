// Zapnij Pasy vGPT_2.16.0 — device-local layout; one live clock, one graphic surface.
export const LAYOUT_KEY='zapnij-pasy-layout-v1';
export function layoutGeometry(width,height,portrait,padding){
  const regionHeight=portrait?height/2:height,gap=Math.max(5,Math.min(12,width*.012));
  const usableHeight=Math.max(1,regionHeight-padding.top-padding.bottom),moduleWidth=Math.max(1,(width-padding.left-padding.right-gap)/2);
  const cardHeight=Math.max(1,Math.floor(Math.min(usableHeight,moduleWidth*1.14)));
  return {regionHeight,gap,cardHeight,digitSize:Math.max(1,Math.floor(Math.min(cardHeight*1.14,moduleWidth*.94))),signSize:Math.max(1,Math.floor(Math.min(usableHeight,(width-36)/2)))};
}
export class DisplayLayout{
  constructor({stage,clock,signs,document,storage=null}){
    Object.assign(this,{stage,clock,signs,storage});this.portrait=false;
    try{this.portrait=storage?.getItem(LAYOUT_KEY)==='portrait';}catch{/* Landscape remains the default. */}
    this.blank=document.createElement('div');this.blank.className='blank-view';this.blank.setAttribute('aria-hidden','true');stage.append(this.blank);
  }
  bounds(){const {width,height}=this.stage.getBoundingClientRect();return {width,height:this.portrait?height/2:height};}
  apply(transition){
    transition?.finish();this.stage.dataset.layout=this.portrait?'portrait':'landscape';
    transition?.configure(this.stage,{clock:this.portrait?this.blank:this.clock,signs:this.signs});
    if(this.portrait)this.clock.setAttribute('aria-hidden','false');
  }
  toggle(transition){
    this.portrait=!this.portrait;
    try{this.storage?.setItem(LAYOUT_KEY,this.portrait?'portrait':'landscape');}catch{/* Layout still works without persistence. */}
    this.apply(transition);return this.portrait;
  }
}
