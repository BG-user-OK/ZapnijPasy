// Owner-approved pairing for the TBox's separate, restricted status identity.
const TOKEN=/^[A-Za-z0-9_-]{43}$/;
export async function enrollSupervisor(link,pairId,token){
  if(!TOKEN.test(token)||!/^[A-Za-z0-9_-]{22}$/.test(pairId))throw new Error('INVALID_SUPERVISOR_INVITATION');
  const path='supervisorInvitations/'+token;
  const current=await link.read(path),invite=current.value;
  if(!invite||invite.expiresAt<=link.now()||invite.pairId)throw new Error('INVITATION_UNAVAILABLE');
  await link.put(path,{...invite,pairId,claimedAt:link.now()},current.etag);
  const member={uid:invite.uid,invitationId:token,active:true};
  await link.put('supervisors/'+pairId+'/member',member);
  return member;
}
export async function revokeSupervisor(link,pairId){
  const path='supervisors/'+pairId+'/member',current=await link.read(path);
  if(current.value?.active)await link.put(path,{...current.value,active:false},current.etag);
}
