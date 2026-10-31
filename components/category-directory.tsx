'use client';
import {useMemo,useState} from 'react';
import Link from 'next/link';
import {ArrowUpRight,Search,ShieldCheck,X} from 'lucide-react';
import {Breadcrumbs} from './site-header';
import CategoryArt from './category-art';
import {CATEGORIES,SERVICE_TYPES,type Category} from '../lib/marketplace/taxonomy';
import {normalizeSearch} from '../lib/marketplace/smart-search';
import '../app/v50-categories.css';

/* V50 /categories/ — every main category with its subcategories, a filter box,
   problem-first entry points and the five service models. */
const ORDER=['ai','business','marketing','tech','legal','finance','research','creative','commerce','education','wellbeing'];
const problems=[
 {mn:'Рестораны маань үйлчлүүлэгч цөөн байна',en:'My restaurant needs more customers'},
 {mn:'Бизнесээ автоматжуулмаар байна',en:'I want to automate my business'},
 {mn:'Компани байгуулах гэж байна',en:'I want to start a company'},
 {mn:'Татварын тайлангаа зөв гаргамаар байна',en:'I need help with my tax filing'}
];

export default function CategoryDirectory({en}:{en:boolean}){
 const t=(mn:string,eng:string)=>en?eng:mn;
 const [q,setQ]=useState('');
 const term=normalizeSearch(q);
 const visible=useMemo(()=>{
  const list=ORDER.map(id=>CATEGORIES.find(c=>c.id===id)!).filter(Boolean);
  if(!term)return list.map(c=>({c,subs:c.subcategories,hit:true}));
  const has=(x:string)=>normalizeSearch(x).includes(term);
  return list.map(c=>{
   const catHit=[c.mn,c.en,...c.keywords].some(has);
   const subs=c.subcategories.filter(s=>[s.mn,s.en,...(s.keywords||[])].some(has));
   return {c,subs:catHit?c.subcategories:subs,hit:catHit||subs.length>0};
  }).filter(x=>x.hit);
 },[term]);
 const block=({c,subs}:{c:Category;subs:Category['subcategories']})=><article key={c.id} id={c.id} className="cdir-block">
  <Link href={'/explore/?category='+c.id} className="cdir-art" aria-hidden="true" tabIndex={-1}><CategoryArt art={c.id} label=""/></Link>
  <div className="cdir-body">
   <div className="cdir-head">
    <h2><Link href={'/explore/?category='+c.id}>{en?c.en:c.mn}</Link></h2>
    {c.regulated&&<span className="cdir-verified"><ShieldCheck size={14} aria-hidden="true"/>{t('Зөвхөн баталгаажсан мэргэжилтэн','Verified professionals only')}</span>}
   </div>
   <p>{en?c.leadEn:c.leadMn}</p>
   <ul className="cdir-subs">{subs.map(s=><li key={s.id}><Link href={'/explore/?category='+c.id+'&sub='+s.id}>{en?s.en:s.mn}</Link></li>)}</ul>
   <Link className="cdir-all" href={'/explore/?category='+c.id}>{t('Бүх үйлчилгээг үзэх','See all services')}<ArrowUpRight size={15} aria-hidden="true"/></Link>
  </div>
 </article>;
 const legalFinance=visible.filter(x=>x.c.id==='legal'||x.c.id==='finance');
 return <section className="cdir shell" aria-labelledby="cdir-title">
  <Breadcrumbs en={en} items={[{label:t('Нүүр','Home'),href:'/'},{label:t('Ангилал','Categories')}]}/>
  <header className="cdir-intro">
   <h1 id="cdir-title">{t('Бүх ангилал','All categories')}</h1>
   <p>{t('Зөвлөх, технологи, санхүү, бүтээлч ажил — бизнес болон хувь хүнд хэрэгтэй мэргэжлийн үйлчилгээг нэг дороос.','Consulting, technology, finance and creative work — professional services for businesses and individuals in one place.')}</p>
   <label className="cdir-search"><Search size={19} aria-hidden="true"/><span className="sr-only">{t('Ангилал хайх','Filter categories')}</span>
    <input value={q} onChange={e=>setQ(e.target.value)} placeholder={t('Жишээ нь: татвар, вэбсайт, IELTS, чатбот','e.g. tax, website, IELTS, chatbot')}/>
    {q&&<button type="button" onClick={()=>setQ('')} aria-label={t('Арилгах','Clear')}><X size={16}/></button>}
   </label>
   <div className="cdir-problems"><span>{t('Ямар мэргэжилтэн хэрэгтэйгээ мэдэхгүй байна уу?','Not sure who you need?')}</span>
    {problems.map(p=><Link key={p.mn} href={'/solutions/?q='+encodeURIComponent(en?p.en:p.mn)}>{en?p.en:p.mn}</Link>)}
   </div>
  </header>
  {visible.length===0?<div className="cdir-empty"><p>{t('Тохирох ангилал олдсонгүй.','No matching category.')}</p><Link className="cdir-all" href={'/solutions/?q='+encodeURIComponent(q)}>{t('Хэрэгцээгээрээ хайх','Search by your problem')}<ArrowUpRight size={15}/></Link></div>:
  <div className="cdir-grid">
   {visible.filter(x=>x.c.id!=='legal'&&x.c.id!=='finance').slice(0,4).map(block)}
   {legalFinance.length>0&&<div id="legal-finance" className="cdir-pair">{legalFinance.map(block)}</div>}
   {visible.filter(x=>x.c.id!=='legal'&&x.c.id!=='finance').slice(4).map(block)}
  </div>}
  <aside className="cdir-models" aria-labelledby="cdir-models-title">
   <h2 id="cdir-models-title">{t('Ажиллах хэлбэрүүд','Ways to work together')}</h2>
   <ul>{SERVICE_TYPES.map(s=><li key={s.id}><b>{en?s.en:s.mn}</b><span>{en?s.hintEn:s.hintMn}</span></li>)}</ul>
   <p>{t('Бета хугацаанд төлбөр Linkup-аар дамжихгүй. Захиалга, үнийн саналыг мэргэжилтэнтэй шууд тохиролцоно.','During the beta no payments go through Linkup. Agree orders and quotes directly with the professional.')}</p>
  </aside>
 </section>;
}
