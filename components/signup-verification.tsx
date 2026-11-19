'use client';
import {useEffect,useRef,useState,type FormEvent} from 'react';
import {ArrowRight,Check,ExternalLink,LoaderCircle,Mail,ShieldCheck} from 'lucide-react';
import {inboxUrl} from '../lib/marketplace/signup-checks';
import {normalizeSignupCode,validSignupCode} from '../lib/marketplace/signup-verification';
import '../app/signup-verification.css';

type Props={en:boolean;email:string;busy:boolean;cooldown:number;error:string;notice:string;onVerify:(code:string)=>Promise<void>;onResend:()=>void;onChangeEmail:()=>void;onSignIn:()=>void};
export default function SignupVerification({en,email,busy,cooldown,error,notice,onVerify,onResend,onChangeEmail,onSignIn}:Props){
 const [code,setCode]=useState(''),[localError,setLocalError]=useState('');
 const input=useRef<HTMLInputElement>(null);
 const t=(mn:string,english:string)=>en?english:mn;
 const issue=localError||error;
 const inbox=inboxUrl(email);
 useEffect(()=>{input.current?.focus()},[]);
 useEffect(()=>{if(error){input.current?.focus();input.current?.select()}},[error]);
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(busy)return;
  if(!validSignupCode(code)){setLocalError(t('Имэйлд ирсэн тоон кодоо бүтнээр нь оруулна уу.','Enter the complete numeric code from your email.'));input.current?.focus();return}
  setLocalError('');await onVerify(normalizeSignupCode(code));
 }
 return <div className="v85-sent hustle-signup-verification">
  <ol className="hustle-verification-steps" aria-label={t('Бүртгэлийн алхам','Registration progress')}>
   <li><span aria-hidden="true"><Check size={13}/></span>{t('Бүртгэл','Account details')}</li>
   <li aria-current="step"><span aria-hidden="true">2</span>{t('Баталгаажуулах','Verify email')}</li>
  </ol>
  <span className="hustle-verification-icon" aria-hidden="true"><Mail size={28}/><i><ShieldCheck size={15}/></i></span>
  <div className="hustle-verification-address"><p>{t('Баталгаажуулах кодыг дараах хаяг руу илгээх хүсэлт явууллаа:','A verification code has been requested for:')}</p><b>{email}</b><button type="button" disabled={busy} onClick={onChangeEmail}>{t('Имэйл буруу байна уу? Засах','Wrong email? Change it')}</button></div>
  <form className="hustle-auth-form hustle-verification-form" onSubmit={e=>void submit(e)} noValidate aria-busy={busy}>
   <label htmlFor="hustle-signup-code">{t('Баталгаажуулах код','Verification code')}</label>
   <input ref={input} id="hustle-signup-code" name="verification-code" type="text" inputMode="numeric" autoComplete="one-time-code" spellCheck={false} autoCapitalize="none" maxLength={20} value={code} readOnly={busy} aria-invalid={Boolean(issue)} aria-describedby={issue?'hustle-code-error hustle-code-hint':'hustle-code-hint'} onChange={e=>{setCode(normalizeSignupCode(e.target.value));setLocalError('')}} placeholder="······"/>
   <p id="hustle-code-hint">{t('Кодоо бүтнээр нь хуулж оруулж болно. Баталгаажуулсны дараа шууд үргэлжлүүлнэ — админы зөвшөөрөл хэрэггүй.','You can paste the whole code. Continue after verification — no admin approval needed.')}</p>
   {issue&&<p id="hustle-code-error" className="hustle-code-error" role="alert">{issue}</p>}
   <button className="hustle-auth-submit" type="submit" disabled={busy||!code.trim()}>{busy?<><LoaderCircle size={18} className="hustle-auth-google-spinner" aria-hidden="true"/>{t('Түр хүлээнэ үү…','Please wait…')}</>:<>{t('Баталгаажуулаад үргэлжлүүлэх','Verify and continue')}<ArrowRight size={18} aria-hidden="true"/></>}</button>
  </form>
  {notice&&<p className="hustle-code-notice" role="status">{notice}</p>}
  <div className="hustle-verification-help"><p>{t('Код ирээгүй юу? Спам хавтсаа шалгаарай.','No code yet? Check your spam folder.')}</p><button type="button" disabled={busy||cooldown>0} onClick={()=>{setLocalError('');onResend()}}>{cooldown>0?t(`${cooldown} сек дараа дахин илгээх`,`Resend in ${cooldown}s`):t('Код дахин илгээх','Resend code')}</button>{inbox&&<a href={inbox} target="_blank" rel="noopener noreferrer">{t('Имэйлээ нээх','Open email')}<ExternalLink size={13} aria-hidden="true"/></a>}<button type="button" disabled={busy} onClick={onSignIn}>{t('Өмнө бүртгүүлсэн үү? Нэвтрэх','Already have an account? Sign in')}</button></div>
 </div>;
}
