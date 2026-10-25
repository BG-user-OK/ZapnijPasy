// Optional TBox-only music metadata. No Firebase credentials, playback controls or idle polling.
export const MUSIC_KEY='zapnij-pasy-music-v1';
export const MUSIC_DURATION=60000;
const BASE='http://127.0.0.1:48321';
const secret=value=>typeof value==='string'&&/^[A-Za-z0-9_-]{43}$/.test(value);
export function validMusic(value){return value?.protocol===1&&typeof value.playing==='boolean'&&typeof value.revision==='string'&&/^[A-Za-z0-9_-]{1,80}$/.test(value.revision)&&typeof value.title==='string'&&value.title.length<=300&&typeof value.artist==='string'&&value.artist.length<=300&&typeof value.art==='boolean';}
export class MusicSlide{
  constructor({document=globalThis.document,window=globalThis.window,storage,eligible=()=>true}={}){
    this.document=document;this.window=window;this.eligible=eligible;this.active=false;this.generation=0;this.inFlight=null;this.enabled=true;this.token='';this.invitation='';
    try{this.storage=storage===undefined?window.localStorage:storage;const saved=JSON.parse(this.storage?.getItem(MUSIC_KEY)||'{}');if(secret(saved.token))this.token=saved.token;this.enabled=typeof saved.enabled==='boolean'?saved.enabled:saved.interval!==0;}catch{/* Keep the clock usable if local storage is unavailable. */}
    // Only a single-use invitation enters a URL. Remove it before other app startup.
    const match=/^#music-invite=([A-Za-z0-9_-]{43})$/.exec(window.location.hash);
    if(match){this.invitation=match[1];window.history.replaceState(null,'',window.location.pathname+window.location.search);}
    this.createUI();
    document.addEventListener('zp-music-settings',()=>this.open());
    window.addEventListener('storage',e=>{if(e.key===MUSIC_KEY){this.cancel();try{const saved=JSON.parse(this.storage?.getItem(MUSIC_KEY)||'{}');this.token=secret(saved.token)?saved.token:'';this.enabled=typeof saved.enabled==='boolean'?saved.enabled:saved.interval!==0;this.renderSettings();}catch{this.token='';}}});
    document.addEventListener('visibilitychange',()=>{if(document.hidden)this.cancel();});
    if(this.invitation)this.open();
  }
  createUI(){
    const d=this.document;
    this.view=d.createElement('section');this.view.className='music-slide';this.view.hidden=true;this.view.setAttribute('aria-label','Aktualnie odtwarzana muzyka');
    this.image=d.createElement('img');this.image.alt='Okładka aktualnego utworu';this.title=d.createElement('p');this.title.className='music-title';this.artist=d.createElement('p');this.artist.className='music-artist';
    const text=d.createElement('div');text.className='music-text';text.append(this.title,this.artist);this.view.append(this.image,text);
    this.panel=d.createElement('section');this.panel.className='music-settings pairing-panel';this.panel.hidden=true;this.panel.setAttribute('role','dialog');this.panel.setAttribute('aria-modal','true');this.panel.setAttribute('aria-label','Muzyka TBox');
    const heading=d.createElement('h1');heading.textContent='Pokaz muzyki — TBox';
    this.status=d.createElement('p');this.status.setAttribute('role','status');
    const help=d.createElement('p');help.textContent='Tylko poziomo: okładka przez 60 sekund po kamerze i śwince. Jadę sam: 2 minuty zegara, 1 minuta okładki. Bez zmiany odtwarzania; pasy mają pierwszeństwo.';
    const label=d.createElement('label');label.textContent='Pokaz okładki: ';this.select=d.createElement('select');this.select.setAttribute('aria-label','Pokaz okładki');
    for(const [value,text] of [['1','Włączony'],['0','Wyłączony']]){const o=d.createElement('option');o.value=value;o.textContent=text;this.select.append(o);}label.append(this.select);
    const button=(text,fn)=>{const b=d.createElement('button');b.type='button';b.textContent=text;b.onclick=()=>this.action(fn);return b;};
    this.connect=button('POŁĄCZ LOKALNY POKAZ',()=>this.enroll());
    this.check=button('SPRAWDŹ POŁĄCZENIE',async()=>{const c=new AbortController();try{const value=await this.statusRequest(c.signal);this.status.textContent=value.playing&&value.title&&value.art?'Połączono. Muzyka i okładka dostępne.':'Połączono. Pokaz poczeka na odtwarzany utwór z okładką.';}finally{c.abort();}});
    const save=button('ZAPISZ I WRÓĆ',()=>{this.enabled=this.select.value==='1';this.save();this.close();});
    const forget=button('ODŁĄCZ POKAZ W TEJ PRZEGLĄDARCE',()=>{this.cancel();this.token='';this.save();this.renderSettings();});
    const close=button('WRÓĆ BEZ ZMIAN',()=>this.close());
    this.panel.append(heading,this.status,help,label,this.connect,this.check,save,forget,close);
    this.panel.addEventListener('pointerdown',e=>e.stopPropagation());this.panel.addEventListener('pointerup',e=>e.stopPropagation());
    d.querySelector('.stage').append(this.view);d.body.append(this.panel);this.renderSettings();
  }
  renderSettings(){this.select.value=this.enabled?'1':'0';this.connect.hidden=!this.invitation;this.check.disabled=!this.token;this.status.textContent=this.invitation?'Jednorazowe zaproszenie bez limitu czasu oczekiwania. Kliknij POŁĄCZ i osobiście zezwól w Chrome na połączenie lokalne.':this.token?'Pokaz połączony lokalnie. Okładki są wyświetlane tylko w układzie poziomym.':'Brak połączenia. Otwórz ZP — Media na TBoxie i wybierz POŁĄCZ POKAZ MUZYKI Z ZP.';}
  save(){this.storage?.setItem(MUSIC_KEY,JSON.stringify({token:this.token,enabled:this.enabled}));}
  open(){this.cancel();this.renderSettings();this.panel.hidden=false;this.select.focus();}
  close(){this.panel.hidden=true;}
  async action(fn){if(this.busy)return;this.busy=true;try{await fn();}catch{this.status.textContent='Brak połączenia lub zgody lokalnej. Sprawdź ZP — Media i uprawnienia witryny Chrome. Nieaktualne zaproszenie utwórz ponownie. Zegar i pasy działają niezależnie.';}finally{this.busy=false;}}
  async request(path,{signal,method='GET',body,timeout=4000}={}){
    const controller=new AbortController(),abort=()=>controller.abort();signal?.addEventListener('abort',abort,{once:true});if(signal?.aborted)controller.abort();const timer=this.window.setTimeout(abort,timeout);
    try{
      const response=await this.window.fetch(BASE+path,{method,body,signal:controller.signal,credentials:'omit',cache:'no-store',redirect:'error',referrerPolicy:'no-referrer',targetAddressSpace:'loopback',headers:body?{'Content-Type':'text/plain;charset=UTF-8'}:{Authorization:'Bearer '+this.token}});
      if(!response.ok)throw new Error('LOCAL_MUSIC_UNAVAILABLE');
      const max=path.startsWith('/v1/art?')?524288:8192;
      if(Number(response.headers.get('Content-Length'))>max)throw new Error('OVERSIZE');
      const bytes=await response.arrayBuffer();if(bytes.byteLength>max)throw new Error('OVERSIZE');
      if(path.startsWith('/v1/art?')){if(response.headers.get('Content-Type')!=='image/jpeg')throw new Error('INVALID_ART');return new this.window.Blob([bytes],{type:'image/jpeg'});}
      return JSON.parse(new TextDecoder().decode(bytes));
    }finally{this.window.clearTimeout(timer);signal?.removeEventListener('abort',abort);}
  }
  async enroll(){
    if(!secret(this.invitation))throw new Error('INVITATION_REQUIRED');
    const value=await this.request('/v1/claim',{method:'POST',body:JSON.stringify({invitation:this.invitation})});
    if(value.protocol!==1||!secret(value.token))throw new Error('INVALID_CLAIM');
    this.token=value.token;this.invitation='';this.save();this.renderSettings();
  }
  async statusRequest(signal,after=''){
    if(!secret(this.token))throw new Error('NOT_PAIRED');
    const value=await this.request('/v1/status'+(after?'?after='+after:''),{signal,timeout:after?22000:4000});if(!validMusic(value))throw new Error('INVALID_METADATA');return value;
  }
  async update(value,signal,generation){
    if(!value.playing||!value.title.trim()||!value.art)throw new Error('NOT_PLAYING');
    if(value.revision===this.revision)return;
    const blob=await this.request('/v1/art?revision='+value.revision,{signal});
    if(signal.aborted||generation!==this.generation)return;
    const url=this.window.URL.createObjectURL(blob);let loaded=false;
    try{await new Promise((resolve,reject)=>{const image=new this.window.Image();image.onload=()=>{loaded=true;resolve();};image.onerror=reject;image.src=url;signal.addEventListener('abort',()=>reject(new Error('CANCELED')),{once:true});});
      if(signal.aborted||generation!==this.generation)return;
      const previous=this.artUrl;this.artUrl=url;this.image.src=url;this.title.textContent=value.title;this.artist.textContent=value.artist;this.revision=value.revision;if(previous)this.window.URL.revokeObjectURL(previous);
    }finally{if(!loaded||signal.aborted||generation!==this.generation)this.window.URL.revokeObjectURL(url);}
  }
  async play({isCurrent=()=>true,duration=MUSIC_DURATION}={}){
    const eligible=()=>isCurrent()&&this.eligible()&&this.panel.hidden&&!this.document.hidden;
    if(!this.token||!this.enabled||!eligible())return false;
    this.cancel();const generation=this.generation;const abort=new AbortController();this.inFlight=abort;
    try{
      if((await this.window.navigator.permissions.query({name:'loopback-network'})).state!=='granted'||abort.signal.aborted||generation!==this.generation||!eligible())return false;
      const value=await this.statusRequest(abort.signal);await this.update(value,abort.signal,generation);
      if(abort.signal.aborted||!eligible()||generation!==this.generation)return false;
      this.active=true;this.view.hidden=false;
      await new Promise(resolve=>{this.finish=resolve;this.timer=this.window.setTimeout(resolve,Math.max(30000,Math.min(120000,typeof duration==='function'?duration():duration)));this.watch(value.revision,abort.signal,generation,isCurrent).catch(resolve);});
      return true;
    }catch{return false;}
    finally{if(generation===this.generation)this.cancel();}
  }
  async watch(revision,signal,generation,isCurrent){
    while(!signal.aborted&&generation===this.generation){
      const value=await this.statusRequest(signal,revision);
      if(!isCurrent()||!this.eligible())throw new Error('PRIORITY');
      await this.update(value,signal,generation);revision=value.revision;
    }
  }
  cancel(){
    ++this.generation;this.window.clearTimeout(this.timer);this.timer=null;this.inFlight?.abort();this.inFlight=null;this.finish?.();this.finish=null;
    this.active=false;this.view.hidden=true;this.revision='';if(this.artUrl)this.window.URL.revokeObjectURL(this.artUrl);this.artUrl=null;this.image.removeAttribute('src');
  }
}
