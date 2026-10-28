import {Flap} from './flap.js?v=vGPT_2.20.0';
const DAYS=['niedziela','poniedziałek','wtorek','środa','czwartek','piątek','sobota'];
const MONTHS=['stycznia','lutego','marca','kwietnia','maja','czerwca','lipca','sierpnia','września','października','listopada','grudnia'];
export function polishDate(date=new Date()){
  return {key:[date.getFullYear(),date.getMonth(),date.getDate()].join('-'),weekday:DAYS[date.getDay()],dayMonth:date.getDate()+' '+MONTHS[date.getMonth()]};
}
export function dateFontSize(width,height,date){return Math.max(1,Math.floor(Math.min(height*.27,Math.max(1,width-24)/(Math.max(date.weekday.length,date.dayMonth.length)*.65))));}
/** One wide double-sided leaf, using exactly the existing clock mechanics. */
export class DateFlap{
  constructor(host,{now=()=>new Date(),reducedMotion=()=>false}={}){
    Object.assign(this,{host,now,reducedMotion});this.active=false;this.current=null;
    this.element=document.createElement('div');this.element.className='digit date-flap';host.append(this.element);
    this.flap=new Flap(this.element,{render:(face,value)=>{
      const span=document.createElement('span');span.className='date-text';
      if(value){for(const text of [value.weekday,value.dayMonth]){const line=document.createElement('span');line.textContent=text;span.append(line);}}
      face.replaceChildren(span);
      // Blank outgoing faces must be black, not an old date or a second grey panel.
      if(value)face.parentElement.style.removeProperty('background');else face.parentElement.style.background='#000';
    }});
  }
  show({animate=true}={}){
    this.active=true;this.host.dataset.dateActive='true';
    this.flap.finish();this.flap.setValue('',{animate:false});this.current=null;
    this.refresh({animate});return this.flap.whenFinished();
  }
  refresh({animate=false}={}){
    if(!this.active)return;
    const value=polishDate(this.now());this.resize(value);
    if(value.key===this.current?.key)return;
    this.current=value;this.host.setAttribute('aria-label',value.weekday+' '+value.dayMonth);
    this.flap.setValue(value,{animate:animate&&!this.reducedMotion()});
  }
  resize(value=this.current||polishDate(this.now())){
    const r=this.element.getBoundingClientRect();
    this.element.style.setProperty('--date-font-size',dateFontSize(r.width,r.height,value)+'px');
  }
  hide(){this.flap.finish();this.active=false;this.host.dataset.dateActive='false';}
  cancel(){this.flap.finish();}
  get busy(){return this.flap.pending!==undefined;}
}
