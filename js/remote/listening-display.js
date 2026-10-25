// Ephemeral authenticated display-to-Pixel requests. Reconnection never replays an action.
import {randomToken} from './protocol.js';
export const LISTENING_TTL=15000;
export function listeningActive(state,now){return !!state&&state.protocol===1&&['STARTING','LISTENING','ALARM','CELEBRATING','DEPARTING','UNKNOWN'].includes(state.phase)&&state.expiresAt>now;}
export function listeningRequest(action,generation,sessionId,now,id=randomToken(16)){
  if(!['ARM','STOP'].includes(action)||!/^[A-Za-z0-9_-]{22}$/.test(generation))throw new Error('INVALID_LISTENING_REQUEST');
  return {id,sessionId:action==='ARM'?id:sessionId,action,generation,createdAt:now,expiresAt:now+LISTENING_TTL,status:'REQUESTED'};
}
export class ListeningDisplay{
  constructor({link,pairId,generation,notify=()=>{},onUnavailable=()=>{},onActive=()=>{}}){this.link=link;this.path='pairs/'+pairId;this.generation=generation;this.notify=notify;this.onUnavailable=onUnavailable;this.state=null;this.pending=null;this.timer=null;this.closed=false;
    this.off=link.watch(this.path+'/listenState',value=>{this.state=value;if(this.active)onActive(value);});
    this.ackOff=link.watch(this.path+'/listenRequest',value=>{
      if(!this.pending||value?.id!==this.pending.id||!['APPLIED','REJECTED'].includes(value.status))return;
      clearTimeout(this.timer);this.pending=null;
      if(value.status==='APPLIED')this.notify(value.action==='ARM'?'Pixel potwierdził nasłuch.':'Nasłuch zakończony.');else{this.notify('Pixel nie uruchomił nasłuchu. Otwórz Pilot na telefonie.');this.onUnavailable();}
    });
  }
  get active(){return listeningActive(this.state,this.link.now())||this.pending?.action==='ARM';}
  async request(action){
    if(this.closed)return;
    if(this.pending)return this.notify('Czekam na odpowiedź Pixela.');
    const session=this.state?.sessionId||this.lastSession;
    if(action==='STOP'&&!session)return;
    const value=listeningRequest(action,this.generation,session,this.link.now());this.pending=value;if(action==='ARM')this.lastSession=value.sessionId;
    this.notify(action==='ARM'?'Uruchamiam nasłuch na Pixelu…':'Kończę nasłuch…');
    this.timer=setTimeout(()=>{if(this.pending?.id===value.id){this.pending=null;this.notify('Brak potwierdzenia Pixela. Sprawdź Pilot na telefonie.');}},LISTENING_TTL+100);
    try{const current=await this.link.read(this.path+'/listenRequest');if(this.closed)return;await this.link.put(this.path+'/listenRequest',value,current.etag);}
    catch{if(!this.closed)this.notify('Nieznany wynik połączenia z Pixelem. Sprawdź Pilot; nie ponawiam automatycznie.');}
  }
  close(){this.closed=true;clearTimeout(this.timer);this.off?.();this.ackOff?.();}
}
