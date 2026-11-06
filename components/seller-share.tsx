'use client';

import {useState} from 'react';
import {Facebook,MessageCircle,Share2} from 'lucide-react';
import '../app/seller-share.css';

export default function SellerShare({path,title,en,label}:{path:string;title:string;en:boolean;label:string}){
 const [fallback,setFallback]=useState<'copied'|'manual'|null>(null);
 const url=new URL(path,'https://linkup.mn').href;
 const facebook='https://www.facebook.com/sharer/sharer.php?'+new URLSearchParams({u:url});
 const t=(mn:string,english:string)=>en?english:mn;

 async function shareToMessenger(){
  if(navigator.share){
   try{
    await navigator.share({title,url});
    return;
   }catch(error){
    if(error instanceof Error&&error.name==='AbortError')return;
   }
  }
  try{
   await navigator.clipboard.writeText(url);
   setFallback('copied');
  }catch{
   setFallback('manual');
  }
 }

 return <details className="hustle-seller-share" onToggle={e=>{if(!e.currentTarget.open)setFallback(null)}}>
  <summary><Share2 size={15} aria-hidden="true"/>{label}</summary>
  <div className="hustle-seller-share-options">
   <a href={facebook} target="_blank" rel="noopener noreferrer"><Facebook size={15} aria-hidden="true"/>Facebook</a>
   <button type="button" onClick={shareToMessenger}><MessageCircle size={15} aria-hidden="true"/>Messenger</button>
  </div>
  {fallback&&<div className="hustle-seller-share-fallback">
   <p role="status">{fallback==='copied'?t('Холбоос хууллаа. Messenger чатдаа буулгана уу.','Link copied. Paste it into your Messenger chat.'):t('Холбоосыг хуулж Messenger чатдаа буулгана уу.','Copy this link and paste it into your Messenger chat.')}</p>
   {fallback==='manual'&&<input readOnly value={url} aria-label={t('Хуваалцах холбоос','Share link')} onFocus={e=>e.currentTarget.select()}/>}
   <a href="https://www.facebook.com/messages/" target="_blank" rel="noopener noreferrer">{t('Messenger нээх','Open Messenger')}</a>
  </div>}
 </details>;
}
