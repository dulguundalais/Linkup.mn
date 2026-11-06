'use client';
import {useEffect,useId,useRef,useState,type FormEvent} from 'react';
import {friendlyError} from '../lib/marketplace/friendly-errors';
import Link from 'next/link';
import LinkupWordmark from './linkup-wordmark';
import {ArrowLeft,ArrowRight,BadgeCheck,Building2,Check,CheckCircle2,Eye,EyeOff,Inbox,Info,LoaderCircle,LockKeyhole,Mail,MessageCircle,Package,ShieldCheck,UserRound} from 'lucide-react';
import {marketplaceClient} from '../lib/marketplace/client';
import '../app/premium-auth.css';
import '../app/v54-page-unification.css';
import '../app/v65-small-fixes.css';
import {signInReason,type SignInReason} from '../lib/marketplace/ux-flows';
import {emailFormatProblem,suggestEmail,domainMail,passwordChecks,passwordStrength,inboxUrl} from '../lib/marketplace/signup-checks';
import '../app/v85-signup.css';

function GoogleLogo(){
 const id=useId();
 // Google Identity branding assets, cropped to the G from the light web button.
 return <svg width="20" height="20" viewBox="10 10 20 20" aria-hidden="true" focusable="false">
  <defs>
   <clipPath id={id}><path d="M29.3987 18.1814H19.9849V22.0445H25.3598C25.1286 23.294 24.4294 24.3596 23.3676 25.0712C22.4746 25.6716 21.3266 26.0211 19.9849 26.0211C17.3864 26.0211 15.1823 24.2666 14.3947 21.9004C14.1952 21.2989 14.0853 20.6599 14.0853 19.9983C14.0853 19.3367 14.1952 18.6966 14.3947 18.0962C15.1823 15.7311 17.3864 13.9755 19.9849 13.9755C21.4524 13.9755 22.767 14.4816 23.8039 15.4713L26.6653 12.6057C24.936 10.9908 22.6786 10 19.9849 10C16.0832 10 12.705 12.2414 11.0618 15.5076C10.383 16.8592 10 18.3834 10 19.9994C10 21.6155 10.383 23.1396 11.0618 24.4913C12.705 27.7597 16.0832 30 19.9849 30C22.6797 30 24.9485 29.1137 26.6018 27.5861C28.4887 25.8452 29.5732 23.2702 29.5732 20.2275C29.5732 19.5182 29.5131 18.835 29.3987 18.1825Z"/></clipPath>
   <filter id={id+'-blur'} x="5" y="5" width="40" height="35" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feGaussianBlur stdDeviation="1"/></filter>
  </defs>
  <g clipPath={`url(#${id})`}>
   <foreignObject x="3" y="3" width="34" height="34" filter={`url(#${id}-blur)`}>
    <div className="hustle-auth-google-mark"/>
   </foreignObject>
   <g filter={`url(#${id}-blur)`}>
    <ellipse cx="20.0496" cy="20.2413" rx="5.39634" ry="2.83537" transform="rotate(24.4473 20.0496 20.2413)" fill="#3186FF"/>
    <ellipse cx="33.3538" cy="18.2155" rx="7.43918" ry="3.09357" fill="#3186FF"/>
    <ellipse cx="25.2744" cy="16.2195" rx="7.40854" ry="2.37805" fill="#FF4641"/>
    <ellipse cx="29.5427" cy="12.9268" rx="7.40854" ry="2.37805" fill="#FF5B8B"/>
    <ellipse cx="24.4817" cy="19.878" rx="8.5061" ry="3.10976" fill="#3186FF"/>
    <ellipse cx="25.1842" cy="14.0197" rx="4.53882" ry="2.37805" transform="rotate(-28.6599 25.1842 14.0197)" fill="#FF4641"/>
   </g>
  </g>
 </svg>;
}

type Entry='buyer'|'seller'|'admin';
type Props={
  en:boolean;entry:Entry;entryMode:Entry;register:boolean;onRegisterChange:(value:boolean)=>void;
  email:string;onEmailChange:(value:string)=>void;
  password:string;onPasswordChange:(value:string)=>void;
  busy:boolean;emailCooldown:number;onSubmit:(event:FormEvent<HTMLFormElement>)=>void;
  onGoogleSignIn:()=>void;googleBusy:boolean;
  onResend:()=>void;notice:string;error:string;onDismiss:()=>void;
  sentTo?:string;onChangeEmail?:()=>void;
};

export default function PremiumAuth({
 en,entry,entryMode,register,onRegisterChange,email,onEmailChange,password,onPasswordChange,
 busy,emailCooldown,onSubmit,onGoogleSignIn,googleBusy,onResend,notice,error,onDismiss,sentTo='',onChangeEmail
}:Props){
 // V85: catch a mistyped e-mail before sign-up; show password strength as it is typed.
 const [emailIssue,setEmailIssue]=useState<string>('');
 const [suggestion,setSuggestion]=useState<string|null>(null);
 const [insisted,setInsisted]=useState('');
 const [checking,setChecking]=useState(false);
 const [pwShort,setPwShort]=useState(false);
 const [showPassword,setShowPassword]=useState(false);
 const [buyerAudience,setBuyerAudience]=useState<'personal'|'business'>('personal');
 useEffect(()=>{const selected=new URLSearchParams(location.search).get('audience')||localStorage.getItem('hustle-buyer-audience');if(selected==='personal'||selected==='business')setBuyerAudience(selected);if(new URLSearchParams(location.search).get('reset')==='1')setResetMode(true)},[]);
 const saveBuyerAudience=(value:'personal'|'business')=>{try{localStorage.setItem('hustle-buyer-audience',value)}catch{}};
 const chooseBuyerAudience=(next:'personal'|'business')=>{setBuyerAudience(next);saveBuyerAudience(next)};
 const [resetMode,setResetMode]=useState(false);
 // V65: a guest sent here by ♡, an order or a message is told why.
 const [reason,setReason]=useState<SignInReason|null>(null);
 useEffect(()=>{try{setReason(signInReason(new URLSearchParams(location.search)))}catch{}},[]);
 const [resetBusy,setResetBusy]=useState(false);
 const [resetMessage,setResetMessage]=useState('');
 const [resetError,setResetError]=useState('');
 const t=(mn:string,english:string)=>en?english:mn;
 const feedbackRef=useRef<HTMLDivElement>(null);
 const feedback=error||resetError||notice||resetMessage;
 // On small screens the result can land below the fold; bring it into view.
 useEffect(()=>{if(feedback)feedbackRef.current?.scrollIntoView({block:'nearest',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'})},[feedback]);
 const changeMode=(next:boolean)=>{
   if(sentTo)onChangeEmail?.();
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
 const reasonText:Record<SignInReason,string>={save:t('Үйлчилгээг хадгалахын тулд нэвтэрнэ үү.','Sign in to save this service.'),order:t('Захиалга илгээхийн тулд нэвтэрнэ үү.','Sign in to send your order.'),message:t('Мэргэжилтэнд мессеж бичихийн тулд нэвтэрнэ үү.','Sign in to message this freelancer.'),request:t('Төслийн хүсэлт илгээхийн тулд нэвтэрнэ үү.','Sign in to post a project request.')};
 const forSeller=entryMode==='seller';
 const title=isAdmin?t('Админ нэвтрэлт','Admin sign in'):
  resetMode?t('Нууц үг сэргээх','Reset your password'):
  register?forSeller?t('Мэргэжилтнээр бүртгүүлэх','Join as a freelancer'):t('Linkup-д нэгдэх','Create your account'):
  reason?t('Нэвтэрч үргэлжлүүлнэ үү','Sign in to continue'):t('Эргэн тавтай морил','Welcome back');
 const lead=resetMode?t('Имэйлээ оруулаад нууц үг сэргээх холбоос хүсээрэй.','Enter your email to request a password reset link.'):
  isAdmin?t('Зөвхөн эрх бүхий админ нэвтэрнэ.','For authorized administrators only.'):
  register?forSeller?t('Үйлчилгээгээ багц болгон нийтэлж, захиалга аваарай.','Publish your services as packages and start taking orders.'):t('1 минутад бүртгүүлээд эхэл.','Sign up in a minute.'):
  reason?'':t('Төсөл, захиалга, мессежээ үргэлжлүүлээрэй.','Pick up your projects, orders and messages.');
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
 const pw=passwordChecks(password),strength=passwordStrength(password);
 const strengthLabel=[ '',t('Сул','Weak'),t('Дунд зэрэг','Fair'),t('Сайн','Good'),t('Хүчтэй','Strong')][strength];
 const issueText=(code:string,domain:string)=>({
  space:t('Имэйл хаягт зай байж болохгүй.','An e-mail address cannot contain spaces.'),
  at:t('Имэйл хаяг «нэр@домэйн» хэлбэртэй байна. Жишээ: bold@gmail.com','Use the form name@domain, e.g. bold@gmail.com'),
  local:t('@-ийн өмнөх хэсэг буруу байна.','The part before @ is not valid.'),
  domain:t('@-ийн дараах хэсэг буруу байна. Жишээ: gmail.com','The part after @ is not valid, e.g. gmail.com'),
  missing:t('«'+domain+'» гэсэн домэйн байхгүй байна. Имэйлээ шалгана уу.','“'+domain+'” does not exist. Please check your e-mail.'),
  'no-mail':t('«'+domain+'» имэйл хүлээн авдаггүй бололтой. Зөв бол дахин дарна уу.','“'+domain+'” does not seem to receive e-mail. If it is right, press again.')
 } as Record<string,string>)[code]||'';
 const checkEmailNow=()=>{if(!register)return;const v=email.trim();if(!v){setEmailIssue('');setSuggestion(null);return}const f=emailFormatProblem(v);setEmailIssue(f&&f!=='empty'?issueText(f,''):'');setSuggestion(f?null:suggestEmail(v))};
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(busy||checking)return;
  if(!register||isAdmin){onSubmit(event);return}
  const v=email.trim().toLowerCase();
  const f=emailFormatProblem(v);
  if(f){setEmailIssue(issueText(f==='empty'?'at':f,''));document.getElementById('hustle-auth-email')?.focus();return}
  if(password.length<8){setPwShort(true);document.getElementById('hustle-auth-password')?.focus();return}
  const s=suggestEmail(v);
  if(s&&insisted!==v){setSuggestion(s);setInsisted(v);return}
  setChecking(true);
  const mail=await domainMail(v);
  setChecking(false);
  const domain=v.split('@')[1];
  if(mail==='missing'){setEmailIssue(issueText('missing',domain));return}
  if(mail==='no-mail'&&insisted!==v+'#mx'){setEmailIssue(issueText('no-mail',domain));setInsisted(v+'#mx');return}
  setEmailIssue('');setSuggestion(null);
  if(!forSeller)saveBuyerAudience(buyerAudience);
  onSubmit(event);
 }
 const useSuggestion=()=>{if(suggestion){onEmailChange(suggestion);setSuggestion(null);setEmailIssue('');setInsisted('')}};
 function renderSent(){
  const inbox=inboxUrl(sentTo);
  return <div className="v85-sent" role="status">
   <span className="v85-sent-icon" aria-hidden="true"><Inbox size={28}/></span>
   <h2>{t('Имэйлээ шалгана уу','Check your e-mail')}</h2>
   <p>{t('Баталгаажуулах холбоосыг ','We sent a confirmation link to ')}<b>{sentTo}</b>{t(' хаяг руу илгээлээ. Холбоос дээр дарснаар бүртгэл тань шууд идэвхжинэ — админы зөвшөөрөл хэрэггүй.','. Open it to activate your account — no admin approval needed.')}</p>
   {inbox&&<a className="hustle-auth-submit v85-open-inbox" href={inbox} target="_blank" rel="noopener noreferrer">{t('Имэйл нээх','Open e-mail')}<ArrowRight size={18} aria-hidden="true"/></a>}
   <ul className="v85-sent-tips">
    <li>{t('Ирэхгүй бол Спам, Promotions хавтсаа шалгаарай.','Not there? Check Spam and Promotions.')}</li>
    <li>{t('Өмнө нь энэ имэйлээр бүртгүүлсэн бол шууд «Нэвтрэх»-ээр орно уу.','Already registered with this e-mail? Just sign in.')}</li>
   </ul>
   <div className="v85-sent-actions">
    <button type="button" className="v85-link" onClick={()=>onChangeEmail?.()}>{t('Имэйл буруу байна уу? Засах','Wrong e-mail? Change it')}</button>
    <button type="button" className="v85-link" disabled={busy||emailCooldown>0} onClick={onResend}>{emailCooldown>0?t('Дахин илгээх','Resend')+' · '+cooldown:t('Дахин илгээх','Resend')}</button>
   </div>
  </div>;
 }
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
   <div className="hustle-auth-intro"><h1 id="hustle-auth-title">{title}</h1>{lead&&<p>{lead}</p>}</div>
   {reason&&!resetMode&&!isAdmin&&<p className="hustle-auth-reason" role="note"><Info size={16} aria-hidden="true"/><span>{reasonText[reason]}{!register&&t(' Бүртгэлгүй бол «Бүртгэл үүсгэх»-ийг сонгоорой — нэг минут болно.',' New here? Choose “Create account” — it takes a minute.')}</span></p>}
   {!resetMode&&!isAdmin&&<div className="hustle-auth-tabs" role="group" aria-label={t('Бүртгэлийн горим','Authentication mode')}>
     <button type="button" className={!register?'active':''} aria-pressed={!register} onClick={()=>changeMode(false)}>{t('Нэвтрэх','Sign in')}</button>
     <button type="button" className={register?'active':''} aria-pressed={register} onClick={()=>changeMode(true)}>{t('Бүртгэл үүсгэх','Create account')}</button>
   </div>}
   {resetMode?<form className="hustle-auth-form" onSubmit={recoverPassword}>
     <label htmlFor="hustle-recovery-email">{t('Имэйл хаяг','Email address')}</label>
     <div className="hustle-auth-input"><Mail size={18} aria-hidden="true"/><input id="hustle-recovery-email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required value={email} onChange={e=>onEmailChange(e.target.value)}/></div>
     <button className="hustle-auth-submit" disabled={resetBusy||busy} type="submit">{resetBusy?t('Илгээж байна…','Requesting…'):t('Сэргээх холбоос хүсэх','Request reset link')}</button>
   </form>:sentTo&&register&&!isAdmin?renderSent():<form className="hustle-auth-form" onSubmit={e=>void submit(e)} noValidate={register&&!isAdmin}>
     {register&&!forSeller&&!isAdmin&&<fieldset className="hustle-buyer-context"><legend>{t('Linkup-ыг юунд ашиглах вэ?','What will you use Linkup for?')}</legend>
      <div role="group" aria-label={t('Хэрэглээний чиглэл','Buyer experience')}>
       <button type="button" aria-pressed={buyerAudience==='personal'} onClick={()=>chooseBuyerAudience('personal')}><span className="hustle-choice-icon"><UserRound size={18} aria-hidden="true"/></span><span className="hustle-choice-text"><b>{t('Хувь хүн','Personal')}</b><small>{t('Өөртөө зориулсан ажил','Work for yourself')}</small></span></button>
       <button type="button" aria-pressed={buyerAudience==='business'} onClick={()=>chooseBuyerAudience('business')}><span className="hustle-choice-icon"><Building2 size={18} aria-hidden="true"/></span><span className="hustle-choice-text"><b>{t('Байгууллага','Organization')}</b><small>{t('Компани, байгууллагын ажил','For a company or team')}</small></span></button>
      </div>
      <p>{t('Дараа нь хүссэн үедээ сольж болно.','You can change this any time.')}</p>
     </fieldset>}
     {!isAdmin&&<>
      <button className="hustle-auth-google" disabled={busy||checking} aria-busy={googleBusy} type="button" onClick={()=>{
       if(register&&!forSeller)saveBuyerAudience(buyerAudience);
       onGoogleSignIn();
      }}>
       {googleBusy?<LoaderCircle size={18} className="hustle-auth-google-spinner" aria-hidden="true"/>:<GoogleLogo/>}
       <span>{googleBusy?t('Google руу шилжиж байна…','Redirecting to Google…'):t('Google-ээр үргэлжлүүлэх','Continue with Google')}</span>
      </button>
      <div className="hustle-auth-divider">{t('эсвэл имэйлээр','or with email')}</div>
     </>}
     <label htmlFor="hustle-auth-email">{t('Имэйл хаяг','Email address')}</label>
     <div className="hustle-auth-input"><Mail size={18} aria-hidden="true"/><input id="hustle-auth-email" name="email" type="email" autoComplete="email" inputMode="email" placeholder="you@example.com" required value={email} onChange={e=>{onEmailChange(e.target.value);if(emailIssue)setEmailIssue('');if(suggestion)setSuggestion(null)}} onBlur={checkEmailNow} aria-invalid={Boolean(emailIssue)||undefined} aria-describedby={emailIssue||suggestion?'v85-email-help':undefined}/></div>
     {register&&(emailIssue||suggestion)&&<p id="v85-email-help" className={'v85-email-help'+(emailIssue?' is-error':'')} role={emailIssue?'alert':'status'}>{emailIssue||<>{t('Та ','Did you mean ')}<b>{suggestion}</b>{t(' гэж бичих гэсэн үү?','?')} <button type="button" onClick={useSuggestion}>{t('Тийм, засах','Yes, fix it')}</button></>}</p>}
     <div className="hustle-auth-label-row"><label htmlFor="hustle-auth-password">{t('Нууц үг','Password')}</label>{!register&&<button className="hustle-auth-link" type="button" onClick={openRecovery}>{t('Нууц үгээ мартсан уу?','Forgot password?')}</button>}</div>
     <div className="hustle-auth-input"><LockKeyhole size={18} aria-hidden="true"/><input id="hustle-auth-password" name="password" type={showPassword?'text':'password'} autoComplete={register?'new-password':'current-password'} minLength={8} required aria-describedby={register?'hustle-auth-password-hint':undefined} value={password} onChange={e=>{onPasswordChange(e.target.value);setPwShort(false)}}/><button type="button" className="hustle-auth-visibility" onClick={()=>setShowPassword(v=>!v)} aria-label={showPassword?t('Нууц үгийг нуух','Hide password'):t('Нууц үгийг харах','Show password')} aria-pressed={showPassword}>{showPassword?<EyeOff size={18}/>:<Eye size={18}/>}</button></div>
     {register&&<div id="hustle-auth-password-hint" className="v85-password">
      {password&&<div className={'v85-meter s'+strength}><span aria-hidden="true"><i/><i/><i/><i/></span><b aria-live="polite">{strengthLabel}</b></div>}
      <ul>
       <li className={pw.length?'is-met':pwShort?'is-missing':''}><Check size={13} aria-hidden="true"/>{t('Дор хаяж 8 тэмдэгт','At least 8 characters')}<em>{t(' (заавал)',' (required)')}</em></li>
       <li className={pw.upper?'is-met':''}><Check size={13} aria-hidden="true"/>{t('Том үсэг','A capital letter')}</li>
       <li className={pw.number?'is-met':''}><Check size={13} aria-hidden="true"/>{t('Тоо','A number')}</li>
       <li className={pw.symbol?'is-met':''}><Check size={13} aria-hidden="true"/>{t('Тусгай тэмдэгт (!@#…)','A symbol (!@#…)')}</li>
      </ul>
     </div>}
     <button className="hustle-auth-submit" disabled={busy||checking||(register&&emailCooldown>0)} type="submit">{busy||checking?t('Шалгаж байна…','Please wait…'):register?t('Бүртгэл үүсгэх','Create account'):t('Нэвтрэх','Sign in')}<ArrowRight size={18} aria-hidden="true"/></button>
   </form>}
   {feedback&&<div ref={feedbackRef} className={'hustle-auth-feedback '+(error||resetError?'is-error':'is-success')} role={error||resetError?'alert':'status'}>
     {error||resetError?<Info size={18} aria-hidden="true"/>:<CheckCircle2 size={18} aria-hidden="true"/>}
     <div><p>{resetError||error||resetMessage||notice}</p>{error&&!resetMode&&!isAdmin&&<div className="hustle-auth-feedback-actions">{register&&<button type="button" onClick={()=>changeMode(false)}>{t('Нэвтрэх','Sign in')}</button>}<button type="button" onClick={openRecovery}>{t('Нууц үг сэргээх','Reset password')}</button></div>}</div>
   </div>}
   {resetMode?<div className="hustle-auth-support"><button type="button" onClick={()=>{setResetMode(false);setResetError('');setResetMessage('')}}><ArrowLeft size={15} aria-hidden="true"/>{t('Нэвтрэх рүү буцах','Back to sign in')}</button></div>:
    !isAdmin?<div className="hustle-auth-support">
      {register&&!sentTo&&<p>{t('Баталгаажуулах имэйл ирээгүй юу?','Didn’t get the confirmation email?')} <button type="button" className="hustle-auth-resend" disabled={busy||emailCooldown>0} onClick={onResend}>{emailCooldown>0?t('Дахин илгээх','Resend')+' · '+cooldown:t('Дахин илгээх','Resend')}</button></p>}
      <p className="hustle-auth-legal">{register&&t('Бүртгүүлснээр та ','By creating an account you agree to the ')}<Link href="/terms/">{t('Үйлчилгээний нөхцөл','Terms of Service')}</Link>{register?t(' болон ',' and '):' · '}<Link href="/privacy/">{t(register?'Нууцлалын бодлогыг':'Нууцлалын бодлого','Privacy Policy')}</Link>{register&&t(' зөвшөөрч байна.','.')}</p>
    </div>:null}
   </section>
  </div>
  <Link className="hustle-auth-back" href="/explore/"><ArrowLeft size={16} aria-hidden="true"/>{t('Үйлчилгээ үзэх','Explore the marketplace')}</Link>
 </main>;
}
