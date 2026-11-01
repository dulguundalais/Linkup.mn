'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import {X} from 'lucide-react';
import {CATEGORIES,categoryById} from '../lib/marketplace/taxonomy';
import {filterLiveServices,type LiveService,type LiveSort} from '../lib/marketplace/live-discovery';
import {DAY_OPTIONS,EMPTY_EXTRA,priceCeiling,priceStep,skillOptions,type ExtraFilters} from '../lib/marketplace/explore-filters';
import '../app/v69-explore-filters.css';

export type FilterChoice={cat:string;sub:string;extra:ExtraFilters};
type Base={query:string;sort:LiveSort;onlySaved:boolean;saved:string[]};
const money=(n:number)=>new Intl.NumberFormat('mn-MN').format(n)+'₮';

/** V69: side panel (bottom sheet on phones) with category, price, delivery time and
 *  skills. Changes are a draft until «N үр дүн харах» applies them; the button
 *  always shows how many published services the draft would leave. */
export default function ExploreFilterDrawer({en,open,onClose,services,base,value,onApply}:{
 en:boolean;open:boolean;onClose:()=>void;services:LiveService[];base:Base;value:FilterChoice;onApply:(v:FilterChoice)=>void;
}){
 const t=(mn:string,eng:string)=>en?eng:mn;
 const [draft,setDraft]=useState<FilterChoice>(value);
 const panel=useRef<HTMLDivElement>(null);
 // Start from the applied filters each time the panel opens (not on every parent render).
 const wasOpen=useRef(false);
 useEffect(()=>{if(open&&!wasOpen.current)setDraft(value);wasOpen.current=open},[open,value]);
 // Esc closes, the page behind does not scroll, focus moves into the panel and back.
 useEffect(()=>{
  if(!open)return;
  const back=document.activeElement as HTMLElement|null;
  const html=document.documentElement;const prev=html.style.overflow;html.style.overflow='hidden';
  panel.current?.querySelector<HTMLElement>('button,select,input')?.focus();
  const key=(e:KeyboardEvent)=>{
   if(e.key==='Escape'){e.preventDefault();onClose();return}
   if(e.key!=='Tab'||!panel.current)return;
   const items=[...panel.current.querySelectorAll<HTMLElement>('button:not(:disabled),select,input')];
   if(!items.length)return;const first=items[0],last=items[items.length-1];
   if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
   else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
  };
  document.addEventListener('keydown',key);
  return()=>{document.removeEventListener('keydown',key);html.style.overflow=prev;back?.focus?.()};
 },[open,onClose]);

 const ceiling=useMemo(()=>priceCeiling(services),[services]);
 const step=priceStep(ceiling);
 const inCategory=useMemo(()=>filterLiveServices(services,{...base,query:'',category:draft.cat,subcategory:draft.sub}),[services,base,draft.cat,draft.sub]);
 const skills=useMemo(()=>skillOptions(inCategory),[inCategory]);
 const count=useMemo(()=>filterLiveServices(services,{...base,category:draft.cat,subcategory:draft.sub,...draft.extra}).length,[services,base,draft]);
 const countFor=(extra:Partial<ExtraFilters>)=>filterLiveServices(services,{...base,category:draft.cat,subcategory:draft.sub,...draft.extra,...extra}).length;
 const catCount=(id:string)=>filterLiveServices(services,{...base,query:'',category:id,subcategory:''}).length;
 if(!open)return null;

 const ex=draft.extra;
 const setExtra=(patch:Partial<ExtraFilters>)=>setDraft(d=>({...d,extra:{...d.extra,...patch}}));
 const lo=ex.priceMin??0,hi=ex.priceMax??ceiling;
 const setLo=(n:number)=>setExtra({priceMin:n<=0?null:Math.min(n,hi)});
 const setHi=(n:number)=>setExtra({priceMax:n>=ceiling?null:Math.max(n,lo)});
 const typed=(v:string)=>{const n=Number(v.replace(/\D/g,''));return Number.isFinite(n)?n:0};
 const subs=draft.cat!=='all'?categoryById(draft.cat)?.subcategories||[]:[];
 const chosen=new Set(ex.skills.map(s=>s.toLocaleLowerCase()));
 const reset=(label:string,on:boolean,fn:()=>void)=>on?<button type="button" className="v69-reset" onClick={fn} aria-label={t('Цэвэрлэх: ','Reset: ')+label}>{t('Цэвэрлэх','Reset')}</button>:null;

 return <div className="v69-filter-layer">
  <div className="v69-filter-scrim" onClick={onClose} aria-hidden="true"/>
  <div className="v69-filter-panel" ref={panel} role="dialog" aria-modal="true" aria-labelledby="v69-filter-title">
   <div className="v69-filter-head">
    <h2 id="v69-filter-title">{t('Шүүлтүүр','Filters')}</h2>
    <button type="button" className="v69-filter-close" onClick={onClose} aria-label={t('Хаах','Close')}><X size={20} aria-hidden="true"/></button>
   </div>
   <div className="v69-filter-body">
    <section className="v69-filter-group">
     <label className="v69-select"><span>{t('Ангилал','Category')}</span>
      <select value={draft.cat} onChange={e=>setDraft(d=>({...d,cat:e.target.value,sub:'',extra:{...d.extra,skills:[]}}))}>
       <option value="all">{t('Бүх ангилал','All categories')}</option>
       {CATEGORIES.map(c=>{const n=catCount(c.id);return <option key={c.id} value={c.id}>{(en?c.en:c.mn)+' ('+n+')'}</option>})}
      </select>
     </label>
     {subs.length>0&&<label className="v69-select"><span>{t('Дэд ангилал','Subcategory')}</span>
      <select value={draft.sub} onChange={e=>setDraft(d=>({...d,sub:e.target.value}))}>
       <option value="">{t('Бүгд','All')}</option>
       {subs.map(s=><option key={s.id} value={s.id}>{en?s.en:s.mn}</option>)}
      </select>
     </label>}
    </section>

    <section className="v69-filter-group" aria-labelledby="v69-price-title">
     <div className="v69-group-head"><h3 id="v69-price-title">{t('Үнэ','Price')}</h3>{reset(t('Үнэ','Price'),ex.priceMin!==null||ex.priceMax!==null,()=>setExtra({priceMin:null,priceMax:null}))}</div>
     <div className="v69-range" style={{'--lo':(lo/ceiling*100)+'%','--hi':(hi/ceiling*100)+'%'} as React.CSSProperties}>
      <input type="range" min={0} max={ceiling} step={step} value={lo} onChange={e=>setLo(Number(e.target.value))} aria-label={t('Доод үнэ','Minimum price')} aria-valuetext={money(lo)}/>
      <input type="range" min={0} max={ceiling} step={step} value={hi} onChange={e=>setHi(Number(e.target.value))} aria-label={t('Дээд үнэ','Maximum price')} aria-valuetext={money(hi)}/>
     </div>
     <div className="v69-price-inputs">
      <label><span>{t('Доод ₮','From ₮')}</span><input inputMode="numeric" value={ex.priceMin===null?'':String(ex.priceMin)} placeholder="0" onChange={e=>{const n=typed(e.target.value);setExtra({priceMin:e.target.value.trim()===''||n<=0?null:n})}}/></label>
      <label><span>{t('Дээд ₮','To ₮')}</span><input inputMode="numeric" value={ex.priceMax===null?'':String(ex.priceMax)} placeholder={new Intl.NumberFormat('mn-MN').format(ceiling)} onChange={e=>{const n=typed(e.target.value);setExtra({priceMax:e.target.value.trim()===''?null:n})}}/></label>
     </div>
    </section>

    <section className="v69-filter-group" aria-labelledby="v69-days-title">
     <div className="v69-group-head"><h3 id="v69-days-title">{t('Хүргэх хугацаа','Delivery time')}</h3>{reset(t('Хүргэх хугацаа','Delivery time'),ex.maxDays!==null,()=>setExtra({maxDays:null}))}</div>
     <div className="v69-chips" role="group" aria-labelledby="v69-days-title">
      {DAY_OPTIONS.map(d=>{const n=countFor({maxDays:d});const on=ex.maxDays===d;return <button type="button" key={d} aria-pressed={on} disabled={!on&&n===0} onClick={()=>setExtra({maxDays:on?null:d})}>{d+' '+t('хоногт','days')}<small>{n}</small></button>})}
      <button type="button" aria-pressed={ex.maxDays===null} onClick={()=>setExtra({maxDays:null})}>{t('Хамаагүй','Any time')}</button>
     </div>
    </section>

    {skills.length>0&&<section className="v69-filter-group" aria-labelledby="v69-skills-title">
     <div className="v69-group-head"><h3 id="v69-skills-title">{t('Ур чадвар','Skills')}</h3>{reset(t('Ур чадвар','Skills'),ex.skills.length>0,()=>setExtra({skills:[]}))}</div>
     <div className="v69-chips" role="group" aria-labelledby="v69-skills-title">
      {skills.map(s=>{const on=chosen.has(s.label.toLocaleLowerCase());return <button type="button" key={s.label} aria-pressed={on} onClick={()=>setExtra({skills:on?ex.skills.filter(x=>x.toLocaleLowerCase()!==s.label.toLocaleLowerCase()):[...ex.skills,s.label].slice(0,10)})}>{s.label}<small>{s.count}</small></button>})}
     </div>
    </section>}
   </div>
   <div className="v69-filter-foot">
    <button type="button" className="v69-apply" onClick={()=>{onApply(draft);onClose()}}>{count>0?t(count+' үр дүн харах','Show '+count+' results'):t('Тохирох үйлчилгээ алга','No matching services')}</button>
    <button type="button" className="v69-reset-all" onClick={()=>setDraft({cat:'all',sub:'',extra:EMPTY_EXTRA})}>{t('Бүгдийг цэвэрлэх','Reset all')}</button>
   </div>
  </div>
 </div>;
}
