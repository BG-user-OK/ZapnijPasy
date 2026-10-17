// Zapnij Pasy vGPT_2.2.2 — Stage 1 development work.
// Firebase transport for the communication proof; SDK dependencies are bundled locally.
import {initializeApp,deleteApp} from 'firebase/app';
import {initializeAuth,indexedDBLocalPersistence,browserLocalPersistence,inMemoryPersistence,signInAnonymously,connectAuthEmulator} from 'firebase/auth';
import {getDatabase,connectDatabaseEmulator,ref,onValue,onDisconnect,goOffline,goOnline} from 'firebase/database';
import {createInvitation,randomToken} from './protocol.js';
export class LinkError extends Error {constructor(code){super(code);this.code=code;}}
export class FirebaseLink {
  constructor({config,name='zapnij-pasy-display',emulators=null,fetchImpl=globalThis.fetch,memory=false}) {
    if(emulators && (!config.projectId.startsWith('demo-') || !['127.0.0.1','localhost'].includes(emulators.host))) throw new LinkError('UNSAFE_EMULATOR_CONFIGURATION');
    if(!emulators && !/^https:\/\/[a-z0-9-]+\.europe-west1\.firebasedatabase\.app\/?$/.test(config.databaseURL)) throw new LinkError('EXPECTED_BELGIUM_DATABASE');
    this.config=config;this.emulators=emulators;this.fetch=fetchImpl.bind(globalThis);this.offset=0;this.online=false;this.unsubscribers=[];
    this.app=initializeApp(config,name);
    this.auth=initializeAuth(this.app,{persistence:memory?inMemoryPersistence:[indexedDBLocalPersistence,browserLocalPersistence]});
    if(emulators)connectAuthEmulator(this.auth,'http://'+emulators.host+':'+emulators.authPort,{disableWarnings:true});
    this.db=getDatabase(this.app);
    if(emulators)connectDatabaseEmulator(this.db,emulators.host,emulators.databasePort);
    this.watch('.info/serverTimeOffset',value=>{this.offset=Number(value)||0;});
    this.watch('.info/connected',value=>{this.online=value===true;});
  }
  async authenticate(){await this.auth.authStateReady();if(!this.auth.currentUser)await signInAnonymously(this.auth);return this.auth.currentUser.uid;}
  now(){return Date.now()+this.offset;}
  watch(path,callback,onError=()=>{}){const off=onValue(ref(this.db,path),snap=>callback(snap.val()),()=>onError(new LinkError('LISTENER_DENIED')));const remove=()=>{off();const index=this.unsubscribers.indexOf(remove);if(index>=0)this.unsubscribers.splice(index,1);};this.unsubscribers.push(remove);return remove;}
  async request(path,{method='GET',value,etag,timeoutMs=8000}={}) {
    if(!this.auth.currentUser)throw new LinkError('AUTHENTICATION_REQUIRED');
    const token=await this.auth.currentUser.getIdToken();
    const url=this.emulators?new URL('http://'+this.emulators.host+':'+this.emulators.databasePort+'/'+path+'.json'):new URL(path+'.json',this.config.databaseURL.replace(/\/?$/,'/'));
    if(this.emulators)url.searchParams.set('ns',new URL(this.config.databaseURL).hostname.split('.')[0]);
    url.searchParams.set('auth',token);
    const abort=new AbortController();const timer=setTimeout(()=>abort.abort(),timeoutMs);
    try {
      const headers={'Content-Type':'application/json'};
      if(method==='GET')headers['X-Firebase-ETag']='true';
      if(etag!==undefined)headers['If-Match']=etag;
      const response=await this.fetch(url.href,{method,headers,body:value===undefined?undefined:JSON.stringify(value),signal:abort.signal,cache:'no-store'});
      if(!response.ok)throw new LinkError(response.status===412?'CONCURRENT_CHANGE':response.status===401||response.status===403?'ACCESS_DENIED':'BACKEND_ERROR');
      return {value:await response.json(),etag:response.headers.get('etag')};
    } catch(error) {
      if(error instanceof LinkError)throw error;
      // A timeout can occur after a write committed. Never report it as proof of failure.
      throw new LinkError(method==='GET'?'READ_UNAVAILABLE':'COMMIT_UNKNOWN');
    } finally {clearTimeout(timer);}
  }
  async read(path){return this.request(path);}
  async put(path,value,etag){return this.request(path,{method:'PUT',value,etag});}
  async patch(path,value){return this.request(path,{method:'PATCH',value});}
  async invite(){const invite=createInvitation(this.auth.currentUser.uid,this.now());await this.put('invitations/'+invite.token,invite.value);return invite;}
  async claim(token){
    if(!/^[A-Za-z0-9_-]{43}$/.test(token))throw new LinkError('INVALID_INVITATION');
    const path='invitations/'+token;const current=await this.read(path);
    if(!current.value || current.value.expiresAt<=this.now() || current.value.candidateUid)throw new LinkError('INVITATION_UNAVAILABLE');
    const claim={...current.value,candidateUid:this.auth.currentUser.uid,claimedAt:this.now()};
    await this.put(path,claim,current.etag);return claim;
  }
  async approve(token){
    const {value}=await this.read('invitations/'+token);
    if(!value?.candidateUid || value.displayUid!==this.auth.currentUser.uid || value.expiresAt<=this.now())throw new LinkError('INVITATION_UNAVAILABLE');
    const members={displayUid:value.displayUid,controllerUid:value.candidateUid,invitationId:token,active:true};
    try {await this.put('pairs/'+value.pairId+'/members',members);}
    catch(error){if(error.code!=='CONCURRENT_CHANGE' && error.code!=='ACCESS_DENIED')throw error;const existing=await this.read('pairs/'+value.pairId+'/members');if(existing.value?.controllerUid!==value.candidateUid || !existing.value.active)throw error;}
    if(!value.approvedAt)await this.patch('invitations/'+token,{approvedAt:this.now()});
    return value.pairId;
  }
  async armPresence(pairId,view){
    const generation=randomToken(16);
    await this.put('pairs/'+pairId+'/display',{...view,generation,online:false,updatedAt:this.now()});
    const offline=onDisconnect(ref(this.db,'pairs/'+pairId+'/display/online'));
    await offline.set(false);
    await this.put('pairs/'+pairId+'/display',{...view,generation,online:true,updatedAt:this.now()});
    return generation;
  }
  async send(pairId,command){const current=await this.read('pairs/'+pairId+'/mailbox');if(current.value?.id===command.id)return {committed:true,value:current.value};await this.put('pairs/'+pairId+'/mailbox',command,current.etag);return {committed:true,value:command};}
  async claimCommand(pairId,id){const path='pairs/'+pairId+'/mailbox';const current=await this.read(path);if(current.value?.id!==id || current.value.status!=='REQUESTED')throw new LinkError('COMMAND_SUPERSEDED');const command={...current.value,status:'CLAIMED'};await this.put(path,command,current.etag);return command;}
  async acknowledge(pairId,command,receipt,view){
    const mailbox={...command,status:receipt.status,result:receipt.result,effectiveSessionId:receipt.sessionId,appliedRevision:view.revision,processedAt:this.now()};
    const stored={id:receipt.id,sessionId:receipt.sessionId,sequence:receipt.sequence,status:receipt.status,result:receipt.result,appliedRevision:view.revision,processedAt:mailbox.processedAt};
    await this.patch('pairs/'+pairId,{display:{...view,updatedAt:this.now()},mailbox,['receipts/'+(command.sequence%32)]:stored});
    return mailbox;
  }
  async waitForAck(pairId,id,{timeoutMs=8000}={}) {
    const path='pairs/'+pairId+'/mailbox';
    return new Promise((resolve,reject)=>{
      let off,done=false,reading=false,again=false;
      const finish=(error,value)=>{if(done)return;done=true;clearTimeout(timer);off?.();error?reject(error):resolve(value);};
      const timer=setTimeout(()=>finish(new LinkError('ACK_UNKNOWN')),timeoutMs);
      const inspect=async()=>{
        if(done)return;
        if(reading){again=true;return;}
        reading=true;
        try {
          do {
            again=false;
            try {
              const {value}=await this.read(path);
              if(value?.id===id&&['APPLIED','REJECTED'].includes(value.status))finish(null,value);
            } catch {}
          } while(again&&!done);
        } finally {reading=false;}
      };
      off=this.watch(path,inspect,()=>finish(new LinkError('ACK_UNKNOWN')));
      inspect();
    });
  }
  pause(){goOffline(this.db);}
  resume(){goOnline(this.db);}
  async close(){for(const off of [...this.unsubscribers])off();this.unsubscribers=[];goOffline(this.db);await deleteApp(this.app);}
}
