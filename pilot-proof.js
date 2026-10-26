// Zapnij Pasy vGPT_2.19.2 — temporary Stage 1 controller; not the native Android app.
import {FirebaseLink,createCommand,randomToken} from './js/remote/transport.bundle.js?v=vGPT_2.19.2';
const $=id=>document.getElementById(id),PREFIX='zapnij-pasy-pilot-proof-v1-';
const save=(key,value)=>localStorage.setItem(PREFIX+key,JSON.stringify(value));
const load=key=>{try{return JSON.parse(localStorage.getItem(PREFIX+key)||'null');}catch{return null;}};
let link,pairId=load('pair'),pending=load('pending'),view,watchOff,busy=false;
let token=location.hash.slice(1);
if(token){history.replaceState(null,'',location.pathname+location.search);$('token').value=token;}
function status(text){$('status').textContent=text;}
function event(text){$('events').textContent=(new Date().toLocaleTimeString()+' '+text+'\n'+$('events').textContent).slice(0,3000);}
function controls(){const online=!!view?.display?.online;$('start').disabled=!online||!!pending||busy;$('confirm').disabled=!online||!!pending||busy||!view?.display?.sessionId;$('retry').hidden=!pending;}
async function connect(){
  if(link?.auth.currentUser)return;
  const response=await fetch('./firebase-config.json',{cache:'no-store'});
  if(!response.ok)throw new Error('Brak konfiguracji Firebase.');
  const settings=await response.json();
  link=new FirebaseLink({config:settings.config,name:'zapnij-pasy-pilot-proof'});
  try{await link.authenticate();}catch(error){await link.close();link=null;throw error;}
  $('identity').textContent='Identyfikator telefonu: '+link.auth.currentUser.uid.slice(-8);
  if(pairId)attach();
}
function attach(){
  watchOff?.();watchOff=link.watch('pairs/'+pairId,value=>{view=value;controls();if(!pending)status(value?.display?.online?'Wyświetlacz połączony. Gotowe do próby.':'Wyświetlacz niedostępny. Zapis do bazy nie oznacza odebrania polecenia.');},()=>status('Brak dostępu do pary. Sprawdź parowanie na iPhonie.'));
}
async function claim(){
  if(busy)return;busy=true;
  try{
    await connect();const invitation=$('token').value.trim();
    await link.claim(invitation);token='';$('token').value='';
    status('Porównaj identyfikator i zatwierdź telefon na iPhonie.');
    const off=link.watch('invitations/'+invitation,value=>{
      if(value?.approvedAt){pairId=value.pairId;save('pair',pairId);pending=null;save('pending',null);off();attach();}
    });
  }finally{busy=false;controls();}
}
async function inspectPending(){
  if(!pending)return;
  try{
    const ack=await link.waitForAck(pairId,pending.id);
    event('WYŚWIETLACZ POTWIERDZIŁ: '+ack.status+' '+ack.result);
    pending=null;save('pending',null);status('Odpowiedź wyświetlacza odebrana.');
  }catch{
    status('Wynik nieznany. Polecenie nie będzie wysyłane automatycznie ponownie.');
    if(pending&&pending.expiresAt<=link.now()){
      const latest=await link.read('pairs/'+pairId);
      view=latest.value;save('lastUnknown',pending);pending=null;save('pending',null);
      event('Poprzednie polecenie wygasło bez pewnego wyniku. Sprawdź iPhone. Nowa próba wymaga kliknięcia.');
    }
  }finally{controls();}
}
async function send(type){
  if(busy||pending)return;busy=true;controls();
  try{
    await connect();view=(await link.read('pairs/'+pairId)).value;
    if(!view?.display?.online)throw new Error('Wyświetlacz offline.');
    pending=createCommand({type,sessionId:type==='START_PASSENGER'?randomToken(16):view.display.sessionId,generation:view.display.generation,expectedRevision:view.display.revision,sequence:(view.mailbox?.sequence||0)+1,now:link.now()});
    save('pending',pending);controls();status('Polecenie zlecone — oczekiwanie na zapis i odpowiedź iPhone.');event('ZLECONO: '+type);
    await link.send(pairId,pending);event('ZAPISANO W BAZIE: '+type);status('Zapisano w bazie — oczekiwanie na potwierdzenie wyświetlacza.');await inspectPending();
  }finally{busy=false;controls();}
}
function run(action){action().catch(error=>{status('Operacja niedostępna: '+(error.code||'sprawdź internet i parowanie')+'. Zegar na iPhonie działa lokalnie.');controls();});}
$('claim').onclick=()=>run(claim);
$('start').onclick=()=>run(()=>send('START_PASSENGER'));
$('confirm').onclick=()=>run(()=>send('CONFIRM_BELTS'));
$('retry').onclick=()=>run(async()=>{await connect();await inspectPending();});
$('connect').onclick=()=>run(async()=>{await connect();if(pairId){view=(await link.read('pairs/'+pairId)).value;controls();}else status('Wklej jednorazowy link lub token z iPhone.');});
$('token').addEventListener('input',()=>{const value=$('token').value.trim();if(value.includes('#'))$('token').value=value.slice(value.lastIndexOf('#')+1);});
document.addEventListener('visibilitychange',()=>{if(document.hidden)link?.pause();else link?.resume();});
window.addEventListener('pagehide',()=>link?.pause());
controls();
