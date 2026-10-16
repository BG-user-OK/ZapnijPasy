// Zapnij Pasy vGPT_2.1.0 — optional display-side communication; the clock starts independently.
import {FirebaseLink} from './firebase-link.js';
import {PassengerProtocol} from './protocol.js';
import {DisplayReceiver} from './display-receiver.js';
export const PAIR_KEY='zapnij-pasy-remote-pair-v1';
const STATE_KEY='zapnij-pasy-remote-state-v1';
const read=key=>JSON.parse(localStorage.getItem(key)||'null');
const write=(key,value)=>localStorage.setItem(key,JSON.stringify(value));
export class RemoteDisplay {
  constructor({controller,config,preferLocal=false}) {
    this.controller=controller;this.config=config;this.link=null;this.receiver=null;
    this.connecting=null;this.arming=false;this.ready=false;this.hidden=document.hidden;
    this.pair=read(PAIR_KEY);this.invitation=null;this.status='Pilot nie jest sparowany.';
    this.protocol=new PassengerProtocol({store:{load:()=>read(STATE_KEY),save:value=>write(STATE_KEY,value)}});
    if(preferLocal||(!this.pair&&this.controller.state.kind==='PASSENGER'))this.adoptLocal();
    this.createPanel();
  }
  adoptLocal() {
    const s=this.protocol.snapshot(),kind=this.controller.state.kind;
    if(kind==='PASSENGER')this.protocol.persist({...s,mode:'PASSENGER',sessionId:this.protocol.newId(),confirmedAt:0,revision:s.revision+1});
    else if(kind==='PASSENGER_CONFIRMED_WAIT')this.protocol.persist({...s,mode:kind,sessionId:s.sessionId||this.protocol.newId(),confirmedAt:this.controller.state.deadline-10000,revision:s.revision+1});
    else this.protocol.restoreClock();
  }
  message(text){this.status=text;if(this.statusElement)this.statusElement.textContent=text;}
  button(label,action){const b=document.createElement('button');b.type='button';b.textContent=label;b.addEventListener('click',()=>this.run(action));return b;}
  async run(action){try{await action();}catch(error){this.message(this.errorText(error));}}
  errorText(error) {
    const code=error.code||error.message;
    if(code==='AUTHENTICATION_REQUIRED')return 'Brak logowania. Spróbuj ponownie online.';
    if(code==='STORAGE_UNAVAILABLE')return 'Brak zapisu lokalnego. Zegar działa; pilot jest wyłączony.';
    if(code==='PAIR_NOT_ACTIVE')return 'Parowanie nieaktywne. Odłącz i sparuj urządzenia ponownie.';
    return 'Pilot niedostępny lub brak potwierdzenia. Sprawdź internet i spróbuj ponownie. Zegar działa lokalnie.';
  }
  createPanel() {
    const panel=document.createElement('section');panel.className='pairing-panel';panel.hidden=true;
    panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label','Parowanie pilota');
    const title=document.createElement('h1');title.textContent='Zapnij Pasy — parowanie';
    this.statusElement=document.createElement('p');this.statusElement.setAttribute('role','status');this.statusElement.textContent=this.status;
    this.inviteText=document.createElement('textarea');this.inviteText.readOnly=true;this.inviteText.rows=2;this.inviteText.setAttribute('aria-label','Link parowania');this.inviteText.hidden=true;
    const help=document.createElement('p');help.className='pairing-help';help.textContent='Link jest jednorazowy i ważny 2 minuty. Otwórz go na telefonie kierowcy. Zatwierdź tylko zgłoszenie swojego telefonu.';
    this.approveButton=this.button('Zatwierdź ten telefon',()=>this.approve());this.approveButton.hidden=true;
    panel.append(title,this.statusElement,this.inviteText,
      this.button('Utwórz link parowania',()=>this.invite()),
      this.button('Kopiuj link',async()=>{if(this.inviteText.hidden)return;try{await navigator.clipboard.writeText(this.inviteText.value);this.message('Link skopiowany. Otwórz go na telefonie kierowcy.');}catch{this.inviteText.focus();this.inviteText.select();this.message('Zaznaczono link. Skopiuj go ręcznie.');}}),
      this.approveButton,this.button('Sprawdź połączenie',()=>this.connect()),
      this.button('Odłącz pilota',()=>this.unpair()),this.button('Wróć do zegara',()=>this.hide()),help);
    document.body.append(panel);this.panel=panel;
  }
  show(){this.panel.hidden=false;this.message(this.status);this.panel.querySelector('button')?.focus();}
  hide(){this.panel.hidden=true;document.querySelector('.mode-toggle')?.focus();}
  async initialize(){if(this.pair&&!this.hidden){this.recovering=true;try{await this.applySaved();}finally{this.recovering=false;}await this.run(()=>this.connect());}}
  async applySaved() {
    const state=this.protocol.snapshot();
    if(state.mode==='PASSENGER') {
      if(this.controller.state.kind!=='PASSENGER')await this.controller.startPassenger({animate:false});
    } else if(state.mode==='PASSENGER_CONFIRMED_WAIT') {
      const remaining=state.confirmedAt+10000-(this.link?.now()||Date.now());
      if(remaining<=0){this.protocol.restoreClock();await this.controller.restoreClock(false);}
      else if(this.controller.state.kind!=='PASSENGER_CONFIRMED_WAIT') {
        if(this.controller.state.kind!=='PASSENGER')await this.controller.startPassenger({animate:false});
        this.controller.confirmPassenger({deadline:Date.now()+Math.max(0,state.confirmedAt+10000-(this.link?.now()||Date.now()))});
      }
    }
  }
  async ensureLink() {
    if(this.link?.auth.currentUser)return this.link;
    if(this.connecting)return this.connecting;
    this.connecting=(async()=>{
      const link=new FirebaseLink({config:this.config,name:'zapnij-pasy-display'});this.link=link;
      try{await link.authenticate();}
      catch(error){await link.close();if(this.link===link)this.link=null;throw error;}
      link.watch('.info/connected',connected=>{
        if(!connected){this.ready=false;this.receiver?.suspend();if(this.pair)this.message('Połączenie przerwane. Zegar i dotyk działają lokalnie.');}
        else if(this.pair&&!this.hidden)this.run(()=>this.arm());
      });
      return link;
    })();
    try{return await this.connecting;}finally{this.connecting=null;}
  }
  async connect(){await this.ensureLink();if(this.pair&&!this.hidden)await this.arm();else if(!this.pair)this.message('Gotowe do parowania. Utwórz jednorazowy link.');}
  async arm() {
    if(this.storageFailed||this.arming||this.hidden||!this.pair||!this.link?.auth.currentUser)return;
    this.arming=true;this.ready=false;this.receiver?.suspend();
    try {
      const {value}=await this.link.read('pairs/'+this.pair.pairId);
      if(!value?.members.active||value.members.displayUid!==this.link.auth.currentUser.uid)throw new Error('PAIR_NOT_ACTIVE');
      const state=this.protocol.snapshot(),remote=value.display,sequence=value.mailbox?.sequence||0;
      if(remote&&remote.revision>state.revision) {
        this.protocol.persist({...state,mode:remote.mode,sessionId:remote.sessionId,confirmedAt:remote.confirmedAt,revision:remote.revision,lastSequence:Math.max(state.lastSequence,sequence)});
        await this.applySaved();
      } else if(sequence>state.lastSequence)this.protocol.persist({...state,lastSequence:sequence});
      if(this.hidden)return;
      const receiver=new DisplayReceiver({link:this.link,pairId:this.pair.pairId,protocol:this.protocol,apply:async(effect,state)=>{
        if(effect==='START_PASSENGER')await this.controller.startPassenger();
        else this.controller.confirmPassenger({deadline:Date.now()+Math.max(0,state.confirmedAt+10000-this.link.now())});
      }});
      this.receiver=receiver;
      const generation=await this.link.armPresence(this.pair.pairId,receiver.view());
      if(this.hidden){receiver.suspend();await this.link.patch('pairs/'+this.pair.pairId+'/display',{online:false});return;}
      receiver.activate(generation);this.ready=true;await this.link.put('pairs/'+this.pair.pairId+'/display',receiver.view());
      this.mailboxOff?.();this.mailboxOff=this.link.watch('pairs/'+this.pair.pairId+'/mailbox',command=>{
        if(command?.status==='REQUESTED'&&this.ready&&!this.hidden)this.run(()=>receiver.receive(command.id));
      });
      this.message('Pilot sparowany. Wyświetlacz jest gotowy.');
    } finally {this.arming=false;}
  }
  async invite() {
    if(this.pair)throw new Error('Unpair first');
    await this.ensureLink();this.adoptLocal();this.invitation=await this.link.invite();
    const url=new URL('./pilot-proof.html',location.href);url.hash=this.invitation.token;
    this.inviteText.value=url.href;this.inviteText.hidden=false;
    this.message('Otwórz link na telefonie kierowcy. Ważny przez 2 minuty.');
    this.invitationOff?.();this.invitationOff=this.link.watch('invitations/'+this.invitation.token,value=>{
      if(value?.candidateUid&&!value.approvedAt){this.approveButton.hidden=false;this.message('Telefon zgłasza parowanie. Identyfikator: '+value.candidateUid.slice(-8)+'. Porównaj go z telefonem kierowcy.');}
    });
  }
  async approve() {
    if(!this.invitation)throw new Error('No invitation');
    const pairId=await this.link.approve(this.invitation.token);
    this.protocol.persist({...this.protocol.snapshot(),lastSequence:0,receipts:[]});
    this.pair={pairId};write(PAIR_KEY,this.pair);this.approveButton.hidden=true;this.inviteText.hidden=true;
    this.inviteText.value='';this.invitationOff?.();this.invitation=null;await this.arm();
  }
  localTap() {
    if(!this.controller.tap())return false;
    try{this.protocol.localTap(this.link?.now()||Date.now());this.publish();}
    catch{this.storageFailed=true;this.ready=false;this.receiver?.suspend();this.link?.pause();this.message(this.errorText({code:'STORAGE_UNAVAILABLE'}));}
    return true;
  }
  clockRestored() {
    try{if(!this.recovering&&this.protocol.state.mode==='PASSENGER_CONFIRMED_WAIT'){this.protocol.restoreClock();this.publish();}}catch{this.storageFailed=true;this.ready=false;this.receiver?.suspend();this.link?.pause();}
  }
  publish() {
    if(this.ready&&this.receiver&&this.link&&!this.hidden)this.run(()=>this.link.put('pairs/'+this.pair.pairId+'/display',this.receiver.view()));
  }
  suspend(){this.hidden=true;this.ready=false;this.receiver?.suspend();this.link?.pause();}
  resume(){if(!this.hidden)return;this.hidden=false;if(this.link)this.link.resume();if(this.pair)this.run(async()=>{this.recovering=true;try{await this.applySaved();}finally{this.recovering=false;}await this.connect();});}
  async unpair() {
    if(this.pair){await this.ensureLink();await this.link.patch('pairs/'+this.pair.pairId+'/members',{active:false});}
    this.pair=null;localStorage.removeItem(PAIR_KEY);this.ready=false;this.receiver?.suspend();this.receiver=null;this.mailboxOff?.();this.invitationOff?.();
    if(this.link)await this.link.close();this.link=null;this.inviteText.hidden=true;this.inviteText.value='';this.approveButton.hidden=true;
    this.message('Pilot odłączony. Zegar i dotyk działają lokalnie.');
  }
}
