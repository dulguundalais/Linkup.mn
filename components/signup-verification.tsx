'use client';
import {useEffect,useRef,useState,type FormEvent} from 'react';
import {ExternalLink,LoaderCircle} from 'lucide-react';
import {inboxUrl} from '../lib/marketplace/signup-checks';
import {normalizeSignupCode,validSignupCode} from '../lib/marketplace/signup-verification';
import '../app/signup-verification.css';

type Props={en:boolean;email:string;busy:boolean;cooldown:number;error:string;notice:string;onVerify:(code:string)=>Promise<void>;onResend:()=>void;onChangeEmail:()=>void};
export default function SignupVerification({en,email,busy,cooldown,error,notice,onVerify,onResend,onChangeEmail}:Props){
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
  <div className="hustle-verification-address">
   <div>
    <p>{t('Код илгээсэн хаяг','Code sent to')}</p>
    <b>{email}</b>
   </div>
   <button type="button" disabled={busy} onClick={onChangeEmail}>
    {t('Имэйл засах','Edit email')}
   </button>
  </div>
  <form className="hustle-auth-form hustle-verification-form" onSubmit={e=>void submit(e)} noValidate aria-busy={busy}>
   <label htmlFor="hustle-signup-code">{t('Баталгаажуулах код','Verification code')}</label>
   <input ref={input} id="hustle-signup-code" name="verification-code" type="text" inputMode="numeric" autoComplete="one-time-code" spellCheck={false} autoCapitalize="none" maxLength={20} value={code} readOnly={busy} aria-invalid={Boolean(issue)} aria-describedby={issue?'hustle-code-error':undefined} onChange={e=>{setCode(normalizeSignupCode(e.target.value));setLocalError('')}} placeholder="······"/>
   {issue&&<p id="hustle-code-error" className="hustle-code-error" role="alert">{issue}</p>}
   <button className="hustle-auth-submit" type="submit" disabled={busy||!code.trim()}>
    {busy?<><LoaderCircle size={18} className="hustle-auth-google-spinner" aria-hidden="true"/>{t('Түр хүлээнэ үү…','Please wait…')}</>:t('Баталгаажуулах','Verify')}
   </button>
  </form>
  {notice&&<p className="hustle-code-notice" role="status">{notice}</p>}
  <div className="hustle-verification-help">
   {inbox&&<a href={inbox} target="_blank" rel="noopener noreferrer">{t('Имэйл нээх','Open inbox')}<ExternalLink size={13} aria-hidden="true"/></a>}
   <button type="button" disabled={busy||cooldown>0} onClick={()=>{setLocalError('');onResend()}}>
    {cooldown>0?t(`Дахин илгээх · ${cooldown} сек`,`Resend in ${cooldown}s`):t('Код дахин илгээх','Resend code')}
   </button>
  </div>
 </div>;
}
