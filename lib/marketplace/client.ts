'use client';
import {createClient,type SupabaseClient} from '@supabase/supabase-js';
let instance:Promise<SupabaseClient>|undefined;

/** V77 (owner, 2026-11-02): a password-reset link signs the person in only so they
 *  can choose a new password. If they leave the reset page without saving one,
 *  that temporary sign-in must not carry on into the rest of the site. */
export const RECOVERY_PENDING_KEY='linkup-recovery-pending';
export const isResetPage=(path:string)=>/^\/auth\/reset\/?$/.test(path);
export function markRecoveryPending(){try{localStorage.setItem(RECOVERY_PENDING_KEY,'1')}catch{}}
export function clearRecoveryPending(){try{localStorage.removeItem(RECOVERY_PENDING_KEY)}catch{}}
function recoveryPending(){try{return localStorage.getItem(RECOVERY_PENDING_KEY)==='1'}catch{return false}}
/** Ends an abandoned password-reset sign-in on this device. */
export async function endAbandonedRecovery(client:SupabaseClient){
 if(!recoveryPending())return;
 clearRecoveryPending();
 try{await client.auth.signOut({scope:'local'})}catch{}
}

export function marketplaceClient(){
 if(!instance)instance=fetch('/api/config').then(async r=>{
  if(!r.ok)throw new Error('Бета орчин тохируулагдаагүй / Beta environment not configured');
  const c=await r.json();if(!c.url||!c.key)throw new Error('Missing public configuration');
  const client=createClient(c.url,c.key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  if(!isResetPage(location.pathname))await endAbandonedRecovery(client);
  return client;
 }).catch(e=>{instance=undefined;throw e});
 return instance;
}
