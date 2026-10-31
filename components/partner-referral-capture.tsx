'use client';
import {useEffect} from 'react';
import {marketplaceClient} from '../lib/marketplace/client';

// First valid referral landing is retained for a maximum of 30 days.
// This stores only a referral code and timestamp, never identity, credentials or a fingerprint.
// Database RLS/RPC, not this untrusted browser value, determines final attribution.
const KEY='hustle:partner:first-touch';
const TTL=30*24*60*60*1000;
const VALID=/^[0-9a-f]{32}$/;
type Touch={code:string;at:number};
export function referralCodeFromUrl(search:string){
 const raw=new URLSearchParams(search).get('ref');
 return raw&&VALID.test(raw)?raw:null;
}
export function rememberReferral(search:string,storage:Storage,now=Date.now()):Touch|null{
 const current=referralCodeFromUrl(search);
 let previous:Touch|null=null;
 try{const raw=storage.getItem(KEY);if(raw){const parsed=JSON.parse(raw) as Touch;if(VALID.test(parsed.code)&&Number.isFinite(parsed.at)&&now>=parsed.at&&now-parsed.at<=TTL)previous=parsed}}
 catch{}
 if(previous)return previous;
 // Never leave expired or malformed codes persisted between sessions.
 try{storage.removeItem(KEY)}catch{}
 if(!current)return null;
 const touch={code:current,at:now};
 try{storage.setItem(KEY,JSON.stringify(touch))}catch{}
 return touch;
}
export default function PartnerReferralCapture(){
 useEffect(()=>{
  let alive=true,active=false,unsubscribe=()=>{};
  const stored=()=>{try{return rememberReferral(location.search,localStorage)}catch{return null}};
  const claim=async()=>{
   if(!alive||active)return;
   const touch=stored();if(!touch)return;
   active=true;
   try{
    const db=await marketplaceClient();
    const {data:{user},error}=await db.auth.getUser();
    if(error||!user||!alive)return;
    const result=await db.rpc('claim_partner_referral',{input_code:touch.code});
    // A false response means attribution was NOT recorded (for example the
    // account is awaiting email confirmation). Retain the bounded first touch
    // so confirmation/sign-in can retry without losing the Partner link.
    // Only a confirmed database claim may consume it.
    if(!result.error&&result.data===true){
     try{localStorage.removeItem(KEY)}catch{}
    }
   }catch{/* Auth may be initializing or migration may not yet be active. */}
   finally{active=false}
  };
  // Store the code before redirecting to signup.
  stored();
  void marketplaceClient().then(db=>{
   if(!alive)return;
   const {data:{subscription}}=db.auth.onAuthStateChange(()=>{
    void Promise.resolve().then(claim);
   });
   unsubscribe=()=>subscription.unsubscribe();
   void claim();
  }).catch(()=>{});
  return()=>{alive=false;unsubscribe()};
 },[]);
 return null;
}
