// Zapnij Pasy vGPT_2.9.0 — Stage 1 development work.
// Stage 1: transport-independent, durable and idempotent passenger commands.
// Local time display is deliberately outside this module.
import {CONFIRMATION_DURATION} from '../confirmation-animation.js';
const TYPES = new Set(['START_PASSENGER','CONFIRM_BELTS']);
const ID = /^[A-Za-z0-9_-]{22}$/;
export const COMMAND_TTL_MS = 15000;
export const INVITATION_TTL_MS = 120000;
export function randomToken(bytes = 32, cryptoSource = globalThis.crypto) {
  if (!cryptoSource?.getRandomValues) throw new Error('Secure randomness unavailable');
  const raw = cryptoSource.getRandomValues(new Uint8Array(bytes));
  let text = '';
  for (const value of raw) text += String.fromCharCode(value);
  return btoa(text).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
export function createInvitation(displayUid, now, cryptoSource) {
  return {token:randomToken(32,cryptoSource),value:{displayUid,pairId:randomToken(16,cryptoSource),createdAt:now,expiresAt:now+INVITATION_TTL_MS}};
}
export function createCommand({type,sessionId,generation,expectedRevision,sequence,now,id=randomToken(16)}) {
  const value={id,sessionId,type,sequence,createdAt:now,expiresAt:now+COMMAND_TTL_MS,generation,expectedRevision,status:'REQUESTED'};
  const failure=validateCommand(value,{generation,now,revision:expectedRevision,lastSequence:sequence-1});
  if(failure) throw new Error(failure);
  return value;
}
export function validateCommand(command,{generation,now,revision,lastSequence}) {
  if (!command || !TYPES.has(command.type) || !ID.test(command.id) || !ID.test(command.sessionId) || !ID.test(command.generation)) return 'INVALID_COMMAND';
  for(const field of ['sequence','createdAt','expiresAt','expectedRevision']) if(!Number.isSafeInteger(command[field]) || command[field]<0) return 'INVALID_COMMAND';
  if(command.expiresAt<=now || command.expiresAt<=command.createdAt || command.expiresAt-command.createdAt>COMMAND_TTL_MS || command.createdAt>now+1000) return 'EXPIRED_COMMAND';
  if(command.generation!==generation) return 'OLD_CONNECTION';
  if(command.sequence<=lastSequence) return 'OLD_SEQUENCE';
  if(command.expectedRevision!==revision) return 'STALE_REVISION';
  return null;
}
function fingerprint(command) {
  return JSON.stringify(['id','sessionId','type','sequence','createdAt','expiresAt','generation','expectedRevision'].map(field=>command[field]));
}
function initial() {return {mode:'CLOCK',sessionId:'',revision:0,confirmedAt:0,lastSequence:0,receipts:[]};}
function copy(value) {return JSON.parse(JSON.stringify(value));}
export class PassengerProtocol {
  constructor({store,now=()=>Date.now(),newId=()=>randomToken(16)}={}) {
    this.store=store; this.now=now; this.newId=newId;
    const saved=store?.load();
    if(saved && (!['CLOCK','PASSENGER','PASSENGER_CONFIRMED_WAIT'].includes(saved.mode) || !Number.isSafeInteger(saved.revision) || !Number.isSafeInteger(saved.lastSequence) || !Array.isArray(saved.receipts) || saved.receipts.length>32)) throw new Error('Invalid saved remote state');
    this.state=saved?copy(saved):initial();
  }
  persist(next) {
    // Persist before exposing a state change. A failed save must not pretend success.
    this.store?.save(copy(next));
    this.state=next;
  }
  snapshot() {return copy(this.state);}
  accept(command,{generation,now=this.now()}={}) {
    const previous=this.state.receipts.find(receipt=>receipt.id===command?.id);
    if(previous) {
      if(previous.fingerprint!==fingerprint(command)) return {status:'REJECTED',result:'ID_COLLISION',effect:null};
      return {...copy(previous),duplicate:true,effect:null};
    }
    const invalid=validateCommand(command,{generation,now,revision:this.state.revision,lastSequence:this.state.lastSequence});
    if(invalid) return {status:'REJECTED',result:invalid,effect:null};
    const next=copy(this.state); let result; let effect=null;
    if(command.type==='START_PASSENGER') {
      if(next.mode==='PASSENGER') result='ALREADY_ACTIVE';
      else {next.mode='PASSENGER';next.sessionId=command.sessionId;next.confirmedAt=0;++next.revision;result='STARTED';effect='START_PASSENGER';}
    } else if(!next.sessionId || next.mode==='CLOCK') result='NO_ACTIVE_SESSION';
    else if(next.sessionId!==command.sessionId) result='SESSION_MISMATCH';
    else if(next.mode==='PASSENGER_CONFIRMED_WAIT') result='ALREADY_CONFIRMED';
    else {next.mode='PASSENGER_CONFIRMED_WAIT';next.confirmedAt=now;++next.revision;result='CONFIRMED';effect='CONFIRM_BELTS';}
    next.lastSequence=command.sequence;
    const receipt={id:command.id,sequence:command.sequence,sessionId:next.sessionId,status:['NO_ACTIVE_SESSION','SESSION_MISMATCH'].includes(result)?'REJECTED':'ACCEPTED',result,appliedRevision:next.revision,processedAt:now,fingerprint:fingerprint(command)};
    next.receipts=[...next.receipts,receipt].slice(-32);
    this.persist(next);
    return {...copy(receipt),effect};
  }
  rejectClaimed(command,result,now=this.now()) {
    const next=copy(this.state);
    const receipt={id:command.id,sequence:command.sequence,sessionId:next.sessionId,status:'REJECTED',result,appliedRevision:next.revision,processedAt:now,fingerprint:fingerprint(command)};
    next.lastSequence=Math.max(next.lastSequence,command.sequence);
    next.receipts=[...next.receipts.filter(item=>item.id!==command.id),receipt].slice(-32);
    this.persist(next);return copy(receipt);
  }
  complete(id) {
    const next=copy(this.state);const receipt=next.receipts.find(item=>item.id===id);
    if(!receipt) throw new Error('Unknown accepted command');
    if(receipt.status==='ACCEPTED') receipt.status='APPLIED';
    this.persist(next);return copy(receipt);
  }
  reject(id,result) {
    const next=copy(this.state);const receipt=next.receipts.find(item=>item.id===id);
    if(!receipt)throw new Error('Unknown accepted command');
    if(receipt.status==='ACCEPTED'){receipt.status='REJECTED';receipt.result=result;}
    this.persist(next);return copy(receipt);
  }
  localTap(now=this.now()) {
    const next=copy(this.state); ++next.revision;
    if(next.mode==='PASSENGER') {next.mode='PASSENGER_CONFIRMED_WAIT';next.confirmedAt=now;}
    else {next.mode='PASSENGER';next.sessionId=this.newId();next.confirmedAt=0;}
    this.persist(next);return this.snapshot();
  }
  restoreClock() {
    if(this.state.mode==='CLOCK') return this.snapshot();
    const next={...copy(this.state),mode:'CLOCK',sessionId:'',confirmedAt:0,revision:this.state.revision+1};
    this.persist(next);return this.snapshot();
  }
  confirmationDeadline() {return this.state.mode==='PASSENGER_CONFIRMED_WAIT'?this.state.confirmedAt+CONFIRMATION_DURATION:null;}
}
