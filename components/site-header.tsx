'use client';
import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import LinkupWordmark from './linkup-wordmark';
import type {User} from '@supabase/supabase-js';
import {ArrowUpRight,Globe,Menu,Moon,Sun,X} from 'lucide-react';
import AccountMenu,{type AccountMenuIdentity} from './account-menu';
import GlobalNotifications from './global-notifications';
import {marketplaceClient} from '../lib/marketplace/client';
import {signInWithReturn} from '../lib/marketplace/ux-flows';
import '../app/marketplace.css';
import '../app/account-menu.css';
import '../app/site-header.css';

export type SessionState='checking'|'signed-in'|'guest';
export type SiteSection='services'|'categories'|'solutions'|null;

/** Keeps a header in sync with the persisted Supabase session. The profile and beta
 *  role are presentation details only; auth never depends on them. */
export function useSiteAccount(){
 const [sessionState,setSessionState]=useState<SessionState>('checking');
 const [account,setAccount]=useState<AccountMenuIdentity|null>(null);
 const [signingOut,setSigningOut]=useState(false);
 useEffect(()=>{
  let active=true;let generation=0;let unsubscribe=()=>{};
  type Client=Awaited<ReturnType<typeof marketplaceClient>>;
  const showUser=async(db:Client,user:User|null,version:number)=>{
   if(!active||version!==generation)return;
   if(!user){setSessionState('guest');setAccount(null);return}
   const fallback=user.email?.split('@')[0]?.trim()||'Member';
   setSessionState('signed-in');
   setAccount(current=>current?.id===user.id?current:{id:user.id,name:fallback,isSeller:false});
   try{
    const [result,beta]=await Promise.all([db.from('profiles').select('id,display_name,is_seller').eq('id',user.id).limit(1),Promise.resolve(db.from('beta_allowlist').select('role').eq('email',(user.email||'').toLowerCase()).eq('enabled',true).maybeSingle()).catch(()=>({data:null}))]);
    if(!active||version!==generation||result.error)return;
    const profile=result.data?.[0];
    setAccount(current=>current?.id===user.id?{
     id:user.id,name:profile?.display_name?.trim()||fallback,isSeller:profile?.is_seller===true,isAdmin:(beta.data as {role?:string}|null)?.role==='admin'
    }:current);
   }catch{/* Keep the e-mail fallback. */}
  };
  const verify=async()=>{
   const version=++generation;
   try{
    const db=await marketplaceClient();
    const {data:{user},error}=await db.auth.getUser();
    if(active&&version===generation)void showUser(db,error?null:user,version);
   }catch{if(active&&version===generation){setSessionState('guest');setAccount(null)}}
  };
  void marketplaceClient().then(db=>{
   if(!active)return;
   const {data:{subscription}}=db.auth.onAuthStateChange((_event,session)=>{
    const version=++generation;
    // Read the profile outside the auth callback to avoid Supabase auth lock contention.
    void Promise.resolve().then(()=>showUser(db,session?.user||null,version));
   });
   unsubscribe=()=>subscription.unsubscribe();
   void verify();
  }).catch(()=>{if(active){setSessionState('guest');setAccount(null)}});
  const onFocus=()=>{void verify()};
  const onVisibility=()=>{if(document.visibilityState==='visible')void verify()};
  window.addEventListener('focus',onFocus);
  document.addEventListener('visibilitychange',onVisibility);
  return()=>{active=false;++generation;unsubscribe();window.removeEventListener('focus',onFocus);document.removeEventListener('visibilitychange',onVisibility)};
 },[]);
 async function signOut():Promise<boolean>{
  if(signingOut)return false;
  setSigningOut(true);
  try{
   const db=await marketplaceClient();
   const {error}=await db.auth.signOut();
   if(error)throw error;
   setSessionState('guest');setAccount(null);
   return true;
  }catch{return false}
  finally{setSigningOut(false)}
 }
 return {sessionState,account,signingOut,signOut};
}

type HeaderProps={
 en:boolean;onToggleLanguage:()=>void;
 dark?:boolean;onToggleTheme?:()=>void;
 active?:SiteSection;
 /** Dashboards route the bell to the inbox of the dashboard being viewed. */
 notificationsAsSeller?:boolean;
 session:ReturnType<typeof useSiteAccount>;
 onSignedOut?:(ok:boolean)=>void;
};

/** V50: the one header used on every public page. Logo, three destinations,
 *  then notifications + account (or sign in + become a freelancer) on the right. */
export default function SiteHeader({en,onToggleLanguage,dark,onToggleTheme,active=null,notificationsAsSeller,session,onSignedOut}:HeaderProps){
 useEffect(()=>{document.documentElement.lang=en?'en':'mn'},[en]);
 const [menu,setMenu]=useState(false);
 const [loginHref,setLoginHref]=useState('/login/?mode=buyer');
 const t=(mn:string,english:string)=>en?english:mn;
 useEffect(()=>{if(location.pathname!=='/')setLoginHref(signInWithReturn(location.pathname+location.search,'buyer'))},[]);
 // V52: the mobile menu closes on Escape and returns focus to its button.
 const burger=useRef<HTMLButtonElement>(null);
 useEffect(()=>{if(!menu)return;const esc=(e:KeyboardEvent)=>{if(e.key==='Escape'){setMenu(false);burger.current?.focus()}};document.addEventListener('keydown',esc);return()=>document.removeEventListener('keydown',esc)},[menu]);
 const {sessionState,account,signingOut,signOut}=session;
 const links:[Exclude<SiteSection,null>,string,string,string][]=[
  ['services','/explore/','Үйлчилгээ','Services'],
  ['categories','/categories/','Ангилал','Categories'],
  ['solutions','/solutions/','Шийдэл олох','Find a solution']
 ];
 return <header className={'hustle-v5 hx-header'+(dark?' hx-night':'')}>
  <div className="shell hx-header-inner">
   <Link className="hx-brand" href="/" aria-label="Linkup"><LinkupWordmark decorative/></Link>
   <nav id="hx-main-nav" className={'hx-nav'+(menu?' open':'')} aria-label={t('Үндсэн цэс','Main navigation')}>
    {links.map(([id,href,mn,english])=><Link key={id} href={href} aria-current={active===id?'page':undefined} onClick={()=>setMenu(false)}>{t(mn,english)}</Link>)}
    {sessionState==='signed-in'&&account&&<Link className="mobile-auth-nav" href={account.isSeller?'/seller-studio/':'/buyer/'} onClick={()=>setMenu(false)}>{t('Миний самбар','My dashboard')}</Link>}
    {sessionState==='guest'&&<div className="hx-nav-auth"><Link href={loginHref}>{t('Нэвтрэх','Log in')}</Link><Link href="/join/seller/" className="hx-nav-cta">{t('Үйлчилгээ үзүүлэх','Become a freelancer')}</Link></div>}
   </nav>
   <div className="hx-actions">
    <button type="button" className="hx-icon locale" onClick={onToggleLanguage} aria-label={t('Англи хэл сонгох','Switch to Mongolian')}><Globe size={16} aria-hidden="true"/>{en?'EN':'MN'}</button>
    {onToggleTheme&&<button type="button" className="hx-icon" onClick={onToggleTheme} aria-label={t('Өнгөний горим солих','Toggle color theme')}>{dark?<Sun size={18}/>:<Moon size={18}/>}</button>}
    {sessionState==='signed-in'&&account&&<GlobalNotifications key={account.id} userId={account.id} en={en} isSeller={notificationsAsSeller??account.isSeller}/>}
    {sessionState==='signed-in'&&account?<AccountMenu account={account} en={en} signingOut={signingOut} onSignOut={async()=>{const ok=await signOut();setMenu(false);onSignedOut?.(ok)}}/>
     :sessionState==='guest'?<><Link href={loginHref} className="hx-login">{t('Нэвтрэх','Log in')}</Link><Link href="/join/seller/" className="hx-cta">{t('Үйлчилгээ үзүүлэх','Become a freelancer')}<ArrowUpRight size={15} aria-hidden="true"/></Link></>
     :<span className="hx-checking" role="status" aria-label={t('Нэвтрэлтийн төлөв шалгаж байна','Checking sign-in status')}/>}
    <button type="button" ref={burger} className="hx-icon hx-burger" aria-controls="hx-main-nav" aria-expanded={menu} aria-label={t('Цэс','Menu')} onClick={()=>setMenu(v=>!v)}>{menu?<X size={20}/>:<Menu size={20}/>}</button>
   </div>
  </div>
 </header>;
}

/** Breadcrumb trail: Нүүр › Ангилал › Дэд ангилал › Үйлчилгээ. The last item is the current page. */
export function Breadcrumbs({items,en}:{items:{label:string;href?:string}[];en:boolean}){
 return <nav className="hx-crumbs" aria-label={en?'Breadcrumb':'Байршил'}><ol>
  {items.map((item,i)=><li key={i}>{item.href&&i<items.length-1?<Link href={item.href}>{item.label}</Link>:<span aria-current={i===items.length-1?'page':undefined}>{item.label}</span>}</li>)}
 </ol></nav>;
}
