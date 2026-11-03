'use client';
import Link from 'next/link';
import {Check,Clock} from 'lucide-react';
import type {StartStep} from '../lib/marketplace/seller-start';
import '../app/v84-seller-start.css';

/** V84: ① Профайл → ② Үйлчилгээ → ③ Нийтлэгдсэн. One button, on the step to do now. */
export default function SellerStartSteps({en,steps,onAction,hrefFor}:{
 en:boolean;steps:StartStep[];
 onAction?:(key:StartStep['key'])=>void;
 hrefFor?:(key:StartStep['key'])=>string|undefined;
}){
 const t=(mn:string,eng:string)=>en?eng:mn;
 const now=steps.find(s=>s.state==='current'||s.state==='waiting');
 return <section className="v84-start" aria-labelledby="v84-start-title">
  <h2 id="v84-start-title">{t('Анхны үйлчилгээгээ нийтлэх','Publish your first service')}</h2>
  <ol className="v84-steps">{steps.map((s,i)=>{
   const href=hrefFor?.(s.key);
   const label=en?s.actionEn:s.actionMn;
   return <li key={s.key} className={'v84-step is-'+s.state} aria-current={s===now?'step':undefined}>
    <span className="v84-dot" aria-hidden="true">{s.state==='done'?<Check size={15}/>:s.state==='waiting'?<Clock size={14}/>:i+1}</span>
    <span className="v84-text"><b>{en?s.en:s.mn}</b><small>{en?s.noteEn:s.noteMn}</small></span>
    {s.state==='current'&&label&&(href
     ?<Link className="button small v84-action" href={href}>{label}</Link>
     :onAction&&<button type="button" className="button small v84-action" onClick={()=>onAction(s.key)}>{label}</button>)}
   </li>})}</ol>
 </section>;
}
