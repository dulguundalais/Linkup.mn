'use client';
import {useEffect,useRef,useState,type FormEvent} from 'react';
import {friendlyError} from '../lib/marketplace/friendly-errors';
import Link from 'next/link';
import LinkupWordmark from './linkup-wordmark';
import {ArrowLeft,ArrowRight,BadgeCheck,Building2,Check,CheckCircle2,Eye,EyeOff,Inbox,Info,LockKeyhole,Mail,MessageCircle,Package,ShieldCheck,UserRound} from 'lucide-react';
import {marketplaceClient} from '../lib/marketplace/client';
import '../app/premium-auth.css';
import '../app/v54-page-unification.css';

type Entry='buyer'|'seller'|'admin';
type Props={
  en:boolean;entry:Entry;entryMode:Entry;register:boolean;onRegisterChange:(value:boolean)=>void;
  email:string;onEmailChange:(value:string)=>void;
  password:string;onPasswordChange:(value:string)=>void;
  busy:boolean;emailCooldown:number;onSubmit:(event:FormEvent<HTMLFormElement>)=>void;
  onResend:()=>void;notice:string;error:string;onDismiss:()=>void;
};

export default function PremiumAuth({
 en,entry,entryMode,register,onRegisterChange,email,onEmailChange,password,onPasswordChange,
 busy,emailCooldown,onSubmit,onResend,notice,error,onDismiss
}:Props){
 const [showPassword,setShowPassword]=useState(false);
 const [buyerAudience,setBuyerAudience]=useState<'personal'|'business'>('personal');
 useEffect(()=>{const selected=new URLSearchParams(location.search).get('audience')||localStorage.getItem('hustle-buyer-audience');if(selected==='personal'||selected==='business')setBuyerAudience(selected);if(new URLSearchParams(location.search).get('reset')==='1')setResetMode(true)},[]);
 const chooseBuyerAudience=(next:'personal'|'business')=>{setBuyerAudience(next);try{localStorage.setItem('hustle-buyer-audience',next)}catch{}};
 const [resetMode,setResetMode]=useState(false);
 const [resetBusy,setResetBusy]=useState(false);
 const [resetMessage,setResetMessage]=useState('');
 const [resetError,setResetError]=useState('');
 const t=(mn:string,english:string)=>en?english:mn;
 const feedbackRef=useRef<HTMLDivElement>(null);
 const feedback=error||resetError||notice||resetMessage;
 // On small screens the result can land below the fold; bring it into view.
 useEffect(()=>{if(feedback)feedbackRef.current?.scrollIntoView({block:'nearest',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'})},[feedback]);
 const changeMode=(next:boolean)=>{
   onRegisterChange(next);setResetMode(false);setShowPassword(false);onDismiss();
 };
 const openRecovery=()=>{setResetMode(true);setResetMessage('');setResetError('');onDismiss()};
 async function recoverPassword(event:FormEvent<HTMLFormElement>){
   event.preventDefault();if(resetBusy||busy)return;
   setResetBusy(true);setResetMessage('');setResetError('');
   try{
     const db=await marketplaceClient();
     const result=await db.auth.resetPasswordForEmail(email.trim().toLowerCase(),{
       redirectTo:location.origin+'/auth/reset/'
     });
     if(result.error)throw result.error;
     setResetMessage(t('Хэрэв энэ имэйлээр бүртгэлтэй бол нууц үг сэргээх холбоос ирнэ. Ирсэн имэйл болон Спам хавтсаа шалгаарай.','If an account exists and email delivery is configured, a recovery link has been requested. Delivery is not guaranteed.'));
   }catch(error){setResetError(friendlyError(error,en))}
   finally{setResetBusy(false)}
 }
 const isAdmin=entry==='admin';
 const forSeller=entryMode==='seller';
 const title=isAdmin?t('Админ нэвтрэлт','Admin sign in'):
  resetMode?t('Нууц үг сэргээх','Reset your password'):
  register?forSeller?t('Мэргэжилтнээр бүртгүүлэх','Join as a freelancer'):t('Linkup-д нэгдэх','Create your account'):
  t('Эргэн тавтай морил','Welcome back');
 const lead=resetMode?t('Имэйлээ оруулаад нууц үг сэргээх холбоос хүсээрэй.','Enter your email to request a password reset link.'):
  isAdmin?t('Зөвхөн эрх бүхий админ нэвтэрнэ.','For authorized administrators only.'):
  register?forSeller?t('Үйлчилгээгээ багц болгон нийтэлж, захиалга аваарай.','Publish your services as packages and start taking orders.'):t('Имэйлээ баталгаажуулмагц шууд ашиглаж эхэлнэ.','Confirm your email and you are ready to go.'):
  t('Төсөл, захиалга, мессежээ үргэлжлүүлээрэй.','Pick up your projects, orders and messages.');
 const benefits:[typeof Package,string,string][]=forSeller?[
   [Package,t('Багцын нөхцөлөө өөрөө сонгоно','Set your own packages'),t('Үнэ, хугацаа, засварын тоогоо гурван түвшинд тохируулна.','Choose price, delivery time and revisions across three tiers.')],
   [Inbox,t('Захиалга, мессеж нэг дор','Orders and messages together'),t('Ирсэн захиалга, яриагаа нэг самбараас удирдана.','Handle incoming orders and conversations from one dashboard.')],
   [BadgeCheck,t('Бодит үнэлгээ','Reviews that count'),t('Дууссан захиалгын үнэлгээ таны профайлд харагдана.','Every completed order can leave a review on your profile.')]
 ]:[
   [Package,t('Үнэ нь тодорхой багц','Clear package pricing'),t('Үнэ, хугацаа, засварын тоог захиалахаас өмнө харна.','See price, delivery time and revisions before you order.')],
   [BadgeCheck,t('Захиалгаар баталгаажсан үнэлгээ','Verified reviews'),t('Зөвхөн ажлаа дуусгасан захиалагч үнэлгээ үлдээнэ.','Only clients with a completed order can leave a review.')],
   [MessageCircle,t('Мэргэжилтэнтэй шууд харилцах','Talk to the expert directly'),t('Чатлаж, файлаа нэг дор солилцоно.','Chat and share files in one place.')]
 ];
 const cooldown=emailCooldown>59?Math.ceil(emailCooldown/60)+t(' мин',' min'):emailCooldown+t(' сек','s');
 const passwordReady=password.length>=8;
 return <main className="hustle-auth-scene">
  <div className={'hustle-auth-card'+(isAdmin?' is-solo':'')}>
   {!isAdmin&&<aside className="hustle-auth-aside">
     <Link href="/" className="hustle-auth-wordmark" aria-label="Linkup"><LinkupWordmark decorative/></Link>
     <div className="hustle-auth-aside-body">
       <h2>{forSeller?t('Ур чадвараа орлого болго','Turn your skills into income'):t('Төслөө зөв хүнд даатга','Find the right person for the job')}</h2>
       <ul>{benefits.map(([Icon,head,body])=><li key={head}><span className="hustle-auth-aside-icon"><Icon size={18} aria-hidden="true"/></span><div><b>{head}</b><p>{body}</p></div></li>)}</ul>
     </div>
     <p className="hustle-auth-aside-note"><ShieldCheck size={16} aria-hidden="true"/>{t('Туршилтын хугацаанд төлбөр Linkup-аар дамжихгүй.','During the beta, no payments go through Linkup.')}</p>
   </aside>}
   <section className="hustle-auth-panel" aria-labelledby="hustle-auth-title">
   {isAdmin&&<Link href="/" className="hustle-auth-wordmark" aria-label="Linkup"><LinkupWordmark decorative/></Link>}
   <div className="hustle-auth-intro"><h1 id="hustle-auth-title">{title}</h1><p>{lead}</p></div>
   {!resetMode&&!isAdmin&&<div className="hustle-auth-tabs" role="group" aria-label={t('Бүртгэлийн горим','Authentication mode')}>
     <button type="button" className={!register?'active':''} aria-pressed={!register} onClick={()=>changeMode(false)}>{t('Нэвтрэх','Sign in')}</button>
     <button type="button" className={register?'active':''} aria-pressed={register} onClick={()=>changeMode(true)}>{t('Бүртгэл үүсгэх','Create account')}</button>
   </div>}
   {resetMode?<form className="hustle-auth-form" onSubmit={recoverPassword}>
     <label htmlFor="hustle-recovery-email">{t('Имэйл хаяг','Email address')}</label>
     <div className="hustle-auth-input"><Mail size={18} aria-hidden="true"/><input id="hustle-recovery-email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required value={email} onChange={e=>onEmailChange(e.target.value)}/></div>
     <button className="hustle-auth-submit" disabled={resetBusy||busy} type="submit">{resetBusy?t('Илгээж байна…','Requesting…'):t('Сэргээх холбоос хүсэх','Request reset link')}</button>
   </form>:<form className="hustle-auth-form" onSubmit={onSubmit}>
     {register&&!forSeller&&!isAdmin&&<fieldset className="hustle-buyer-context"><legend>{t('Linkup-ыг юунд ашиглах вэ?','What will you use Linkup for?')}</legend>
      <div role="group" aria-label={t('Хэрэглээний чиглэл','Buyer experience')}>
       <button type="button" aria-pressed={buyerAudience==='personal'} onClick={()=>chooseBuyerAudience('personal')}><span className="hustle-choice-icon"><UserRound size={18} aria-hidden="true"/></span><span className="hustle-choice-text"><b>{t('Хувийн төсөл','Personal project')}</b><small>{t('Өөртөө зориулсан ажил','Work for yourself')}</small></span></button>
       <button type="button" aria-pressed={buyerAudience==='business'} onClick={()=>chooseBuyerAudience('business')}><span className="hustle-choice-icon"><Building2 size={18} aria-hidden="true"/></span><span className="hustle-choice-text"><b>{t('Бизнес','Business')}</b><small>{t('Компани, байгууллагын ажил','For a company or team')}</small></span></button>
      </div>
      <p>{t('Дараа нь хүссэн үедээ сольж болно.','You can change this any time.')}</p>
     </fieldset>}
     <label htmlFor="hustle-auth-email">{t('Имэйл хаяг','Email address')}</label>
     <div className="hustle-auth-input"><Mail size={18} aria-hidden="true"/><input id="hustle-auth-email" name="email" type="email" autoComplete="email" inputMode="email" placeholder="you@example.com" required value={email} onChange={e=>onEmailChange(e.target.value)}/></div>
     <div className="hustle-auth-label-row"><label htmlFor="hustle-auth-password">{t('Нууц үг','Password')}</label>{!register&&<button className="hustle-auth-link" type="button" onClick={openRecovery}>{t('Нууц үгээ мартсан уу?','Forgot password?')}</button>}</div>
     <div className="hustle-auth-input"><LockKeyhole size={18} aria-hidden="true"/><input id="hustle-auth-password" name="password" type={showPassword?'text':'password'} autoComplete={register?'new-password':'current-password'} minLength={8} required aria-describedby={register?'hustle-auth-password-hint':undefined} value={password} onChange={e=>onPasswordChange(e.target.value)}/><button type="button" className="hustle-auth-visibility" onClick={()=>setShowPassword(v=>!v)} aria-label={showPassword?t('Нууц үгийг нуух','Hide password'):t('Нууц үгийг харах','Show password')} aria-pressed={showPassword}>{showPassword?<EyeOff size={18}/>:<Eye size={18}/>}</button></div>
     {register&&<p id="hustle-auth-password-hint" className={'hustle-auth-hint'+(passwordReady?' is-met':'')}><Check size={14} aria-hidden="true"/>{t('Дор хаяж 8 тэмдэгт','At least 8 characters')}</p>}
     <button className="hustle-auth-submit" disabled={busy||(register&&emailCooldown>0)} type="submit">{busy?t('Шалгаж байна…','Please wait…'):register?t('Бүртгэл үүсгэх','Create account'):t('Нэвтрэх','Sign in')}<ArrowRight size={18} aria-hidden="true"/></button>
   </form>}
   {feedback&&<div ref={feedbackRef} className={'hustle-auth-feedback '+(error||resetError?'is-error':'is-success')} role={error||resetError?'alert':'status'}>
     {error||resetError?<Info size={18} aria-hidden="true"/>:<CheckCircle2 size={18} aria-hidden="true"/>}
     <div><p>{resetError||error||resetMessage||notice}</p>{error&&!resetMode&&!isAdmin&&<div className="hustle-auth-feedback-actions">{register&&<button type="button" onClick={()=>changeMode(false)}>{t('Нэвтрэх','Sign in')}</button>}<button type="button" onClick={openRecovery}>{t('Нууц үг сэргээх','Reset password')}</button></div>}</div>
   </div>}
   {resetMode?<div className="hustle-auth-support"><button type="button" onClick={()=>{setResetMode(false);setResetError('');setResetMessage('')}}><ArrowLeft size={15} aria-hidden="true"/>{t('Нэвтрэх рүү буцах','Back to sign in')}</button></div>:
    register&&!isAdmin?<div className="hustle-auth-support">
      <p>{t('Баталгаажуулах имэйл ирээгүй юу?','Didn’t get the confirmation email?')} <button type="button" className="hustle-auth-resend" disabled={busy||emailCooldown>0} onClick={onResend}>{emailCooldown>0?t('Дахин илгээх','Resend')+' · '+cooldown:t('Дахин илгээх','Resend')}</button></p>
      <p className="hustle-auth-legal">{t('Бүртгүүлснээр та ','By creating an account you agree to the ')}<Link href="/terms/">{t('Үйлчилгээний нөхцөл','Terms of Service')}</Link>{t(' болон ',' and ')}<Link href="/privacy/">{t('Нууцлалын бодлогыг','Privacy Policy')}</Link>{t(' зөвшөөрч байна.','.')}</p>
    </div>:null}
   </section>
  </div>
  <Link className="hustle-auth-back" href="/explore/"><ArrowLeft size={16} aria-hidden="true"/>{t('Үйлчилгээ үзэх','Explore the marketplace')}</Link>
 </main>;
}
