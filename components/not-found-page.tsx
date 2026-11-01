'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {ArrowRight,Search} from 'lucide-react';
import SiteHeader,{useSiteAccount} from './site-header';
import PremiumFooter from './premium-footer';
import '../app/v54-page-unification.css';
import '../app/v63-ux-fixes.css';

/** V63: a Mongolian 404 with the three ways forward, instead of the framework's
 *  English "This page could not be found." */
export default function NotFoundPage(){
 const [en,setEn]=useState(false);
 const session=useSiteAccount();
 useEffect(()=>{try{setEn(localStorage.getItem('hustle-language')==='en')}catch{}},[]);
 const t=(mn:string,english:string)=>en?english:mn;
 return <div className="hustle-v5">
  <SiteHeader en={en} session={session} onToggleLanguage={()=>{const next=!en;setEn(next);try{localStorage.setItem('hustle-language',next?'en':'mn')}catch{}}}/>
  <main className="v63-not-found shell">
   <p className="v63-code">404</p>
   <h1>{t('Энэ хуудас олдсонгүй','This page could not be found')}</h1>
   <p>{t('Холбоос буруу, эсвэл хуудас устсан байж болно.','The link may be wrong or the page may have moved.')}</p>
   <div className="v63-actions">
    <Link className="v63-primary" href="/">{t('Нүүр хуудас','Home')}<ArrowRight size={17} aria-hidden="true"/></Link>
    <Link href="/explore/"><Search size={16} aria-hidden="true"/>{t('Үйлчилгээ хайх','Browse services')}</Link>
    <Link href="/solutions/">{t('Шийдэл олох','Find a solution')}</Link>
   </div>
  </main>
  <PremiumFooter en={en}/>
 </div>;
}
