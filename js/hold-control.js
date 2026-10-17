// Zapnij Pasy vGPT_2.2.1 — one invisible control, two distinct gestures.
export function bindHoldControl(element,{onTap,onHold,holdMs=3000,schedule=setTimeout,cancel=clearTimeout}) {
  let timer=null,origin=null,consume=false;
  const clear=()=>{if(timer!==null)cancel(timer);timer=null;};
  const down=event=>{
    if(event.button!==undefined&&event.button!==0)return;
    clear();consume=false;origin={x:event.clientX,y:event.clientY,id:event.pointerId};
    timer=schedule(()=>{timer=null;consume=true;onHold();},holdMs);
  };
  const move=event=>{if(origin&&Math.hypot(event.clientX-origin.x,event.clientY-origin.y)>12){clear();consume=true;}};
  const up=()=>{clear();origin=null;};
  const aborted=()=>{if(origin){clear();origin=null;consume=true;}};
  const click=event=>{if(consume){event.preventDefault();consume=false;return;}onTap();};
  const context=event=>event.preventDefault();
  element.addEventListener('pointerdown',down);
  element.addEventListener('pointermove',move);
  element.addEventListener('pointerup',up);
  element.addEventListener('pointercancel',aborted);
  element.addEventListener('pointerleave',aborted);
  element.addEventListener('click',click);
  element.addEventListener('contextmenu',context);
  return ()=>{clear();for(const [type,handler] of [['pointerdown',down],['pointermove',move],['pointerup',up],['pointercancel',aborted],['pointerleave',aborted],['click',click],['contextmenu',context]])element.removeEventListener(type,handler);};
}
