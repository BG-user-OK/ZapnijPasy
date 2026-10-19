// Zapnij Pasy vGPT_2.7.2 — explicit display sequence; all durations use timestamp deadlines.
import { CONFIRMATION_STEPS } from './confirmation-animation.js?v=vGPT_2.7.2';
import { EXTRAS_DURATION } from './extras-animation.js?v=vGPT_2.7.2';
export class DisplayController {
  constructor({ effects, now = () => Date.now(), schedule = (fn, ms) => setTimeout(fn, ms), cancel = id => clearTimeout(id) }) {
    this.effects = effects;
    this.now = now;
    this.schedule = schedule;
    this.cancel = cancel;
    this.state = { kind:'STOPPED' };
    this.nextPair = 0;
    this.token = 0;
    this.timer = null;
    this.suspended = false;
    this.lastTap = null;
  }
  invalidate() {
    ++this.token;
    if (this.timer !== null) this.cancel(this.timer);
    this.timer = null;
  }
  enter(state) { this.invalidate(); this.state = state; return this.token; }
  valid(token) { return token === this.token && !this.suspended; }
  waitUntil(deadline, action, token = this.token) {
    this.state.deadline = deadline;
    const tick = () => {
      this.timer = null;
      if (!this.valid(token)) return;
      const remaining = deadline - this.now();
      if (remaining <= 0) action();
      else this.timer = this.schedule(tick, Math.min(remaining, 1000));
    };
    tick();
  }
  async reveal(view, token, animate = true) {
    await this.effects.show(view, { animate });
    return this.valid(token);
  }
  start({ nextPair = 0 } = {}) {
    this.nextPair = nextPair === 1 ? 1 : 0;
    this.suspended = false;
    return this.restoreClock(false);
  }
  async restoreClock(animate = true) {
    const token = this.enter({kind:'CLOCK', phase:'transition'});
    if (!await this.reveal('clock', token, animate)) return;
    this.state = {kind:'CLOCK_WAITING_FOR_MINUTE', minute:Math.floor(this.now()/60000)};
    this.effects.idle?.();
  }
  onClockMinute(time, { natural = false, completed = Promise.resolve() } = {}) {
    if (this.suspended || this.state.kind !== 'CLOCK_WAITING_FOR_MINUTE') return;
    if (!natural) { this.state.minute = time.minute; return; }
    if (time.minute <= this.state.minute) return;
    const token = this.enter({kind:'CLOCK_POST_MINUTE_WAIT', phase:'digits', minute:time.minute});
    Promise.resolve(completed).then(() => {
      if (!this.valid(token)) return;
      this.state.phase = 'delay';
      this.waitUntil(this.now()+10000, () => this.showPair(this.nextPair), token);
    });
  }
  async showPair(pair) {
    const token = this.enter({kind:'GRAPHIC_PAIR_VISIBLE', phase:'transition', pair});
    if (!await this.reveal(pair === 0 ? 'rules' : 'extras', token)) return;
    this.nextPair = pair === 0 ? 1 : 0;
    if(pair===1){
      this.state.phase='sequence';this.state.startedAt=this.now();this.state.deadline=this.now()+EXTRAS_DURATION;
      return this.runExtras(token);
    }
    this.state.phase = 'hold';
    this.waitUntil(this.now()+60000, () => this.restoreClock(), token);
  }
  async runExtras(token) {
    const elapsed=Math.max(0,this.now()-this.state.startedAt);
    const completed=await this.effects.extras({elapsed});
    if(this.valid(token)&&completed!==false)return this.restoreClock();
  }
  tap() {
    if (this.suspended) return false;
    const time = this.now();
    if (this.lastTap !== null && time >= this.lastTap && time-this.lastTap < 400) return false;
    this.lastTap = time;
    if (this.state.kind === 'PASSENGER') this.confirmPassenger();
    else this.startPassenger();
    return true;
  }
  startPassenger({animate = true} = {}) {
    this.enter({kind:'PASSENGER', phase:'interrupt'});
    this.nextPair = 0;
    this.effects.cancel();
    return this.passengerOne(animate);
  }
  async passengerOne(animate = true) {
    const token = this.enter({kind:'PASSENGER', phase:'one-transition'});
    if (!await this.reveal('belts', token, animate)) return;
    this.passengerOpen(token);
  }
  passengerOpen(token) {
    if(!this.valid(token))return;
    this.effects.resetInsertion?.();
    this.state.phase = 'one-hold';
    this.waitUntil(this.now()+1000, () => this.passengerTwo(), token);
  }
  async passengerTwo() {
    const token = this.enter({kind:'PASSENGER', phase:'inserting'});
    await this.effects.insert();
    if (!this.valid(token)) return;
    this.state.phase = 'fastened-hold';
    this.waitUntil(this.now()+1000, () => this.passengerRelease(), token);
  }
  async passengerRelease() {
    const token=this.enter({kind:'PASSENGER',phase:'retracting'});
    await this.effects.retract();
    if(this.valid(token))this.passengerOpen(token);
  }
  confirmPassenger({startedAt=this.now(),recover=false} = {}) {
    if(this.state.kind==='PASSENGER_CONFIRMED_WAIT')return;
    const token=this.enter({kind:'PASSENGER_CONFIRMED_WAIT',confirmedAt:startedAt});
    this.effects.freeze();
    let index=0,phaseStartedAt=startedAt;
    if(recover) {
      while(index<CONFIRMATION_STEPS.length && phaseStartedAt+CONFIRMATION_STEPS[index].duration<=this.now())phaseStartedAt+=CONFIRMATION_STEPS[index++].duration;
      if(index===CONFIRMATION_STEPS.length){this.restoreClock(false);return;}
    }
    // Initialization is synchronous: remote ACK confirms this applied state, not the entire celebration.
    this.confirmationStep(index,token,phaseStartedAt);
  }
  confirmationStep(index,token,phaseStartedAt=this.now()) {
    if(!this.valid(token))return;
    if(index>=CONFIRMATION_STEPS.length)return this.restoreClock();
    const step=CONFIRMATION_STEPS[index];
    Object.assign(this.state,{phase:step.name,stepIndex:index,phaseStartedAt,deadline:phaseStartedAt+step.duration});
    const completed=this.effects.confirmation(step.name,{elapsed:Math.max(0,this.now()-phaseStartedAt),duration:step.duration});
    if(!step.animation) {
      this.waitUntil(phaseStartedAt+step.duration,()=>this.confirmationStep(index+1,token),token);
    } else {
      return Promise.resolve(completed).then(()=>{if(this.valid(token))return this.confirmationStep(index+1,token);});
    }
  }
  suspend() {
    if (this.suspended) return;
    this.suspended = true;
    this.invalidate();
    this.effects.cancel();
  }
  async resume() {
    if (!this.suspended) return;
    this.suspended = false;
    const saved = {...this.state};
    if (saved.kind === 'PASSENGER') return this.startPassenger({animate:false});
    if (saved.kind === 'PASSENGER_CONFIRMED_WAIT') {
      let index=saved.stepIndex,phaseStartedAt=saved.phaseStartedAt;
      while(index<CONFIRMATION_STEPS.length && phaseStartedAt+CONFIRMATION_STEPS[index].duration<=this.now())phaseStartedAt+=CONFIRMATION_STEPS[index++].duration;
      if(index===CONFIRMATION_STEPS.length)return this.restoreClock(false);
      const token=this.enter(saved);
      this.effects.freeze();
      return this.confirmationStep(index,token,phaseStartedAt);
    }
    if(saved.kind==='GRAPHIC_PAIR_VISIBLE'&&saved.phase==='sequence'&&saved.deadline>this.now()){
      const token=this.enter(saved);
      if(!await this.reveal('extras',token,false))return;
      return this.runExtras(token);
    }
    if (saved.kind === 'GRAPHIC_PAIR_VISIBLE' && saved.phase === 'hold' && saved.deadline > this.now()) {
      const token = this.enter(saved);
      if (!await this.reveal(saved.pair === 0 ? 'rules' : 'extras', token, false)) return;
      this.waitUntil(saved.deadline, () => this.restoreClock(), token);
      return;
    }
    if (saved.kind === 'CLOCK_POST_MINUTE_WAIT' && saved.phase === 'delay' && saved.deadline > this.now()) {
      const token = this.enter(saved);
      if (!await this.reveal('clock', token, false)) return;
      this.waitUntil(saved.deadline, () => this.showPair(this.nextPair), token);
      return;
    }
    return this.restoreClock(false);
  }
  snapshot() { return {nextPair:this.nextPair}; }
  get safeToReload() { return !this.suspended && this.state.kind === 'CLOCK_WAITING_FOR_MINUTE'; }
}
