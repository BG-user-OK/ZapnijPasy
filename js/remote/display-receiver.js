// Zapnij Pasy vGPT_2.18.0 — Stage 1 development work.
// Serialize fresh, server-claimed commands; ACK only after the display effect completes.
import {validateCommand} from './protocol.js';
export class DisplayReceiver {
  constructor({link,pairId,protocol,apply}) {this.link=link;this.pairId=pairId;this.protocol=protocol;this.apply=apply;this.generation=null;this.epoch=0;this.busy=false;}
  activate(generation){this.generation=generation;++this.epoch;}
  suspend(){this.generation=null;++this.epoch;}
  view(){const s=this.protocol.snapshot();return {mode:s.mode,sessionId:s.sessionId,revision:s.revision,confirmedAt:s.confirmedAt,generation:this.generation,online:true,updatedAt:this.link.now()};}
  async receive(id) {
    if(this.busy || !this.generation)return {ignored:'NOT_READY'};
    this.busy=true;const epoch=this.epoch;const generation=this.generation;
    try {
      const {value:command}=await this.link.read('pairs/'+this.pairId+'/mailbox');
      if(epoch!==this.epoch || !command || command.id!==id || command.status!=='REQUESTED')return {ignored:'SUPERSEDED'};
      const state=this.protocol.snapshot();
      const invalid=validateCommand(command,{generation,now:this.link.now(),revision:state.revision,lastSequence:state.lastSequence});
      if(invalid)return {ignored:invalid};
      // This must be a fresh, server-committed claim, never a cached SDK event.
      const claimed=await this.link.claimCommand(this.pairId,id);
      if(epoch!==this.epoch)return {ignored:'SUSPENDED'};
      const accepted=this.protocol.accept(claimed,{generation,now:this.link.now()});
      if(!accepted.id){const receipt=this.protocol.rejectClaimed(claimed,accepted.result,this.link.now());await this.link.acknowledge(this.pairId,claimed,receipt,this.view());return receipt;}
      const applied=accepted.effect?await this.apply(accepted.effect,this.protocol.snapshot()):true;
      if(applied===false&&epoch===this.epoch){const receipt=this.protocol.reject(id,'SUPERSEDED');await this.link.acknowledge(this.pairId,claimed,receipt,this.view());return receipt;}
      if(epoch!==this.epoch)return {ignored:'SUSPENDED'};
      if(this.protocol.state.revision!==accepted.appliedRevision) {
        const receipt=this.protocol.reject(id,'SUPERSEDED');
        await this.link.acknowledge(this.pairId,claimed,receipt,this.view());
        return receipt;
      }
      const receipt=this.protocol.complete(id);
      await this.link.acknowledge(this.pairId,claimed,receipt,this.view());
      return receipt;
    } finally {this.busy=false;}
  }
}
