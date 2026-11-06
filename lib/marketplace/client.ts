'use client';
import {createClient,type SupabaseClient} from '@supabase/supabase-js';
let instance:Promise<SupabaseClient>|undefined;
let config:Promise<{url:string;key:string}>|undefined;

function marketplaceConfig(){
 if(!config)config=fetch('/api/config').then(async r=>{
  if(!r.ok)throw new Error('Бета орчин тохируулагдаагүй / Beta environment not configured');
  const c=await r.json();
  if(!c.url||!c.key)throw new Error('Missing public configuration');
  return c;
 }).catch(e=>{config=undefined;throw e});
 return config;
}

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
 if(!instance)instance=marketplaceConfig().then(async ({url,key})=>{
  const client=createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  if(!isResetPage(location.pathname))await endAbandonedRecovery(client);
  return client;
 }).catch(e=>{instance=undefined;throw e});
 return instance;
}

const GOOGLE_OAUTH_KEY='hustle-google-oauth';
const GOOGLE_OAUTH_PENDING=GOOGLE_OAUTH_KEY+'-pending';
let googleClient:SupabaseClient|undefined;

export function readGoogleCallback(url:URL,pending=false){
 const query=url.searchParams;
 const fragment=new URLSearchParams(url.hash.slice(1));
 const code=query.get('code');
 const errorParams=query.has('error')||query.has('error_code')?query:fragment;
 const error=errorParams.get('error_code')||errorParams.get('error');
 if(!code&&!(pending&&error))return null;
 const description=errorParams.get('error_description')||'';
 const errorCode=error==='provider_disabled'||/provider is not enabled|unsupported provider/i.test(description)
  ?'provider_disabled'
  :errorParams.get('error')==='access_denied'||error==='access_denied'||/popup.closed/i.test(error||'')
   ?'google_oauth_cancelled':'google_oauth_failed';
 if(errorParams===fragment&&error)url.hash='';
 for(const key of ['code','error','error_code','error_description'])query.delete(key);
 if(error)return {error:{code:errorCode}};
 return code?{code}:null;
}

export function takeGoogleCallback(){
 const url=new URL(location.href);
 if(!/^\/login\/?$/.test(url.pathname))return null;
 let pending=false;
 try{pending=sessionStorage.getItem(GOOGLE_OAUTH_PENDING)==='1'}catch{}
 const callback=readGoogleCallback(url,pending);
 if(!callback)return null;
 try{sessionStorage.removeItem(GOOGLE_OAUTH_PENDING)}catch{}
 history.replaceState(history.state,'',url);
 return callback;
}

// Keep the OAuth verifier separate from email confirmation and password recovery.
function googleOAuthClient(url:string,key:string){
 return googleClient??=createClient(url,key,{auth:{
  flowType:'pkce',storageKey:GOOGLE_OAUTH_KEY,storage:sessionStorage,
  persistSession:true,autoRefreshToken:false,detectSessionInUrl:false,skipAutoInitialize:true
 }});
}

export async function startGoogleSignIn(){
 const {url,key}=await marketplaceConfig();
 // Supabase returns an error page at /authorize when the provider is disabled.
 const settings=await fetch(url.replace(/\/$/,'')+'/auth/v1/settings',{headers:{apikey:key}});
 if(!settings.ok)throw {code:'google_oauth_failed'};
 if((await settings.json()).external?.google===false)throw {code:'provider_disabled'};
 const supabase=googleOAuthClient(url,key);
 sessionStorage.setItem(GOOGLE_OAUTH_PENDING,'1');
 try{
  const {error}=await supabase.auth.signInWithOAuth({
   provider:'google',options:{redirectTo:`${location.origin}/login/`}
  });
  if(error)throw error;
 }catch(error){
  sessionStorage.removeItem(GOOGLE_OAUTH_PENDING);
  throw error;
 }
}

export async function exchangeGoogleCode(code:string){
 const {url,key}=await marketplaceConfig();
 const supabase=googleOAuthClient(url,key);
 try{
  const {data,error}=await supabase.auth.exchangeCodeForSession(code);
  if(error||!data.session)throw {code:'google_oauth_failed'};
  const db=await marketplaceClient();
  const result=await db.auth.setSession({
   access_token:data.session.access_token,refresh_token:data.session.refresh_token
  });
  if(result.error||!result.data.session)throw {code:'google_oauth_failed'};
 }finally{
  sessionStorage.removeItem(GOOGLE_OAUTH_KEY);
 }
}
