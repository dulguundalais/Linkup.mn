'use client';
import {useEffect,useState,type FormEvent} from 'react';
import Link from 'next/link';
import LinkupWordmark from './linkup-wordmark';
import {ArrowLeft,ArrowRight,Eye,EyeOff,LockKeyhole,ShieldCheck} from 'lucide-react';
import {marketplaceClient} from '../lib/marketplace/client';
import {friendlyError} from '../lib/marketplace/friendly-errors';
import '../app/premium-auth.css';
import '../app/v54-page-unification.css';

export default function ResetPassword(){
 const [password,setPassword]=useState(''),[repeat,setRepeat]=useState('');
 const [visible,setVisible]=useState(false),[loading,setLoading]=useState(true);
 const [ready,setReady]=useState(false),[busy,setBusy]=useState(false),[notice,setNotice]=useState(''),[error,setError]=useState('');
 // V52: the page follows the site language like every other screen.
 const [en,setEn]=useState(false);
 const t=(mn:string,english:string)=>en?english:mn;
 useEffect(()=>{document.documentElement.lang=en?'en':'mn'},[en]);
 useEffect(()=>{try{setEn(localStorage.getItem('hustle-language')==='en')}catch{}},[]);
 useEffect(()=>{
   let active=true;
   let cleanup=()=>{};
   void marketplaceClient().then(async db=>{
     const {data:{subscription}}=db.auth.onAuthStateChange((event,session)=>{
       if(!active)return;
       if(event==='PASSWORD_RECOVERY'&&session){setReady(true);setLoading(false)}
     });
     cleanup=()=>subscription.unsubscribe();
     // Initializing the client verifies URL tokens and emits PASSWORD_RECOVERY.
     // A saved session plus a caller-controlled ?type=recovery is not evidence
     // of a recovery link and could change the wrong signed-in account.
     await db.auth.getSession();
     if(!active)return;
     setLoading(false);
   }).catch(()=>{if(active){setError(localStorage.getItem('hustle-language')==='en'?'Unable to verify the recovery link.':'Сэргээх холбоосыг шалгаж чадсангүй.');setLoading(false)}});
   return()=>{active=false;cleanup()};
 },[]);
 async function save(e:FormEvent<HTMLFormElement>){
   e.preventDefault();if(!ready||busy)return;
   if(password.length<8||password!==repeat){setError(t('Нууц үгээ хоёр талбарт ижил оруулна уу. Дор хаяж 8 тэмдэгттэй байна.','Passwords must match and contain at least 8 characters.'));return}
   setBusy(true);setError('');
   try{
     const db=await marketplaceClient();
     const r=await db.auth.updateUser({password});
     if(r.error)throw r.error;
     setNotice(t('Нууц үг шинэчлэгдлээ. Одоо шинэ нууц үгээрээ нэвтэрнэ үү.','Your password has been updated. You can now sign in.'));
     setPassword('');setRepeat('');setReady(false);
     await db.auth.signOut();
   }catch(e){setError(friendlyError(e,en))}
   finally{setBusy(false)}
 }
 return <div className="hustle-v5"><main className="hustle-auth-scene"><section className="hustle-auth-panel">
   <div className="hustle-auth-brand"><LinkupWordmark/></div>
   <div className="hustle-auth-intro"><span className="hustle-auth-eyebrow">{t('НУУЦ ҮГ СЭРГЭЭХ','ACCOUNT RECOVERY')}</span><h1>{t('Шинэ нууц үгээ сонгоно уу.','Choose a new password.')}</h1><p>{t('Linkup бүртгэлээ дор хаяж 8 тэмдэгттэй нууц үгээр хамгаална уу.','Secure your Linkup account with a password of at least 8 characters.')}</p></div>
   {loading?<p role="status">{t('Сэргээх холбоосыг шалгаж байна…','Checking recovery link…')}</p>:ready?<form className="hustle-auth-form" onSubmit={save}>
     <label htmlFor="reset-pass">{t('Шинэ нууц үг','New password')}</label><div className="hustle-auth-input"><LockKeyhole size={18}/><input id="reset-pass" type={visible?'text':'password'} autoComplete="new-password" minLength={8} required value={password} onChange={e=>setPassword(e.target.value)}/><button type="button" className="hustle-auth-visibility" onClick={()=>setVisible(v=>!v)} aria-label={visible?t('Нууц үг нуух','Hide password'):t('Нууц үг харах','Show password')}>{visible?<EyeOff size={18}/>:<Eye size={18}/>}</button></div>
     <label htmlFor="reset-repeat">{t('Шинэ нууц үгээ давтах','Confirm new password')}</label><div className="hustle-auth-input"><ShieldCheck size={18}/><input id="reset-repeat" type={visible?'text':'password'} autoComplete="new-password" minLength={8} required value={repeat} onChange={e=>setRepeat(e.target.value)}/></div>
     <button className="hustle-auth-submit" disabled={busy}>{busy?t('Хадгалж байна…','Saving…'):t('Нууц үг шинэчлэх','Update password')}<ArrowRight size={18}/></button>
   </form>:!notice?<div className="hustle-auth-feedback" role="status">{t('Сэргээх холбоос дутуу, хугацаа нь дууссан эсвэл аль хэдийн ашиглагдсан байна. Нэвтрэх хуудаснаас шинэ холбоос хүснэ үү.','Your password reset link is missing, expired, or already used. Request a new link from the sign-in page.')} <Link href="/login/?reset=1">{t('Шинэ холбоос хүсэх','Request a new link')}</Link></div>:null}
   {error&&<div className="hustle-auth-feedback is-error" role="alert">{error}</div>}
   {notice&&<div className="hustle-auth-feedback is-success" role="status">{notice}</div>}
   <div className="hustle-auth-footer"><Link href="/login/"><ArrowLeft size={16}/>{t('Нэвтрэх хуудас руу буцах','Back to sign in')}</Link></div>
 </section></main></div>
}
