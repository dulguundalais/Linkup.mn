'use client';
import Link from 'next/link';
import {ArrowRight,Check,Clock3,RotateCcw,X} from 'lucide-react';
import {type LiveService} from '../lib/marketplace/live-discovery';
import {tierLabel,tiers,type Tier,type ServicePackage} from './service-packages';
import '../app/v37-compare.css';
import {categoryLabel} from '../lib/marketplace/taxonomy';
const money=(n:number)=>new Intl.NumberFormat('mn-MN').format(n)+' ₮';
export const compareLimit=3;
export function compareSelection(current:string[],id:string):string[]{
 if(!id)return current;
 if(current.includes(id))return current.filter(x=>x!==id);
 return current.length>=compareLimit?current:[...current,id];
}
export default function ServiceComparison({services,ids,onRemove,onClear,en}:{services:LiveService[];ids:string[];onRemove:(id:string)=>void;onClear:()=>void;en:boolean}){
 const t=(mn:string,english:string)=>en?english:mn;
 const selected=ids.map(id=>services.find(s=>s.id===id)).filter((s):s is LiveService=>Boolean(s));
 return <section className="v37-compare" aria-label={t('Үйлчилгээний харьцуулалт','Compare services')}>
  <div className="v37-compare-top">
   <div><span className="v37-kicker">{t('Үйлчилгээ харьцуулах','LINKUP / COMPARE')}</span><h2>{t('Үйлчилгээг зэрэгцүүлэн харьцуулах','Compare your shortlist')}</h2><p>{t('Үйлчилгээний багц, үнэ, хугацааг зэрэгцүүлэн харьцуулаарай.','Compare actual published services, packages, prices and timelines.')}</p></div>
   <button type="button" onClick={onClear} className="v37-clear">{t('Бүгдийг арилгах','Clear all')}</button>
  </div>
  <div className="v37-compare-scroll"><div className="v37-compare-grid">
   {selected.map(s=>{
    const available=tiers.map(tier=>s.packages?.find(p=>p.tier===tier)).filter((p):p is ServicePackage=>Boolean(p)&&Number(p?.price)>0);
    const options=available.length?available:[{tier:'Basic' as Tier,price:s.price,delivery_days:s.delivery_days,revisions:s.revisions,includes:[],summary:''}];
    return <article className="v37-compare-item" key={s.id}>
     <button className="v37-remove" type="button" aria-label={t('Харьцуулалтаас хасах: ','Remove from comparison: ')+s.title} onClick={()=>onRemove(s.id)}><X size={16}/></button>
     <span className="v37-category">{categoryLabel(s.category,en)}</span><h3>{en&&s.title_en?s.title_en:s.title}</h3>
     <p className="v37-seller">{s.display_name}</p>
     <table><thead><tr><th>{t('Багц','Package')}</th><th>{t('Үнэ','Price')}</th><th>{t('Хугацаа','Delivery')}</th></tr></thead>
     <tbody>{options.map(p=><tr key={tierLabel(p.tier,en)}><td>{tierLabel(p.tier,en)}</td><td>{money(p.price)}</td><td>{p.delivery_days} {t('хоног','days')}</td></tr>)}</tbody></table>
     <div className="v37-facts"><span><Clock3 size={15}/>{t('Хамгийн богино хугацаа','Fastest delivery')}: {Math.min(...options.map(p=>p.delivery_days))} {t('хоног','days')}</span><span><RotateCcw size={15}/>{t('Засвар','Revisions')}: {options.map(p=>p.revisions).join(' / ')}</span></div>
     <p className="v37-includes"><Check size={15}/>{options[0].summary||t('Үйлчилгээний дэлгэрэнгүй мэдээллийг үзэх','See listing for package details')}</p>
     <Link href={'/listing/?id='+encodeURIComponent(s.id)} className="v37-view">{t('Үйлчилгээ үзэх','View service')} <ArrowRight size={16}/></Link>
    </article>
   })}
  </div></div>
  <p className="v37-disclaimer">{t('Нээлттэй бета: харуулж буй үнэ нь мэдээллийн зориулалттай, бодит төлбөр авахгүй.','Open beta: shown prices are informational; no payments are collected.')}</p>
 </section>;
}
