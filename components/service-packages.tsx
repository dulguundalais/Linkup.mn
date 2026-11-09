'use client';
import {useState} from 'react';
import {ArrowLeft,Check,Clock3,RotateCcw} from 'lucide-react';
import type {Listing} from '../lib/marketplace/types';
import {serviceTypeById} from '../lib/marketplace/taxonomy';
import '../app/service-packages.css';

export type Tier='Basic'|'Standard'|'Premium';
export type ServicePackage={service_id?:string;tier:Tier;name:string;summary:string;price:number;delivery_days:number;revisions:number;includes:string[]};
export const tiers:Tier[]=['Basic','Standard','Premium'];
export function initialPackages(service:Listing|null,stored:ServicePackage[],en=true):ServicePackage[]{
 return tiers.map(tier=>{
  const found=stored.find(x=>x.tier===tier&&x.service_id===service?.id);
  if(found)return {...found};
  return {tier,name:tier,summary:'',price:tier==='Basic'?(service?.price??10000):0,
   delivery_days:tier==='Basic'?(service?.delivery_days??7):7,
   revisions:tier==='Basic'?(service?.revisions??2):2,
   includes:tier==='Basic'?[en?'Base service':'Үндсэн үйлчилгээ']:[]};
 });
}
export function tierLabel(tier:string,en:boolean):string{
 return en?tier:({Basic:'Суурь',Standard:'Стандарт',Premium:'Дээд'} as Record<string,string>)[tier]||tier;
}
function checkPackage(p:ServicePackage,en:boolean):string|null{
 const t=(mn:string,english:string)=>en?english:mn;
 if(!Number.isInteger(p.price)||p.price<1000||p.price>100000000)return t(tierLabel(p.tier,false)+': үнэ 1,000–100,000,000 ₮-ийн хооронд бүхэл тоо байна.',p.tier+': price must be 1,000–100,000,000 ₮.');
 if(!Number.isInteger(p.delivery_days)||p.delivery_days<1||p.delivery_days>365)return t(tierLabel(p.tier,false)+': гүйцэтгэх хугацаа 1–365 хоног байна.',p.tier+': delivery must be 1–365 days.');
 if(!p.includes.length||p.includes.length>12||p.includes.some(x=>!x.trim()||x.length>120))return t(tierLabel(p.tier,false)+': хийх 1–12 ажлыг бичнэ үү. Тус бүр 120 тэмдэгтээс ихгүй байна.',p.tier+': enter 1–12 included items (max 120 characters each).');
 if(!Number.isInteger(p.revisions)||p.revisions<0||p.revisions>20)return t(tierLabel(p.tier,false)+': засварын тоо 0–20 байна.',p.tier+': revisions must be 0–20.');
 if(p.name.trim().length<2||p.name.trim().length>60||p.summary.length>300)return t(tierLabel(p.tier,false)+': нэр 2–60, тайлбар 300 хүртэл тэмдэгттэй байна.',p.tier+': package name or summary is invalid.');
 return null;
}
export function checkPackages(items:ServicePackage[],en=true):string|null{
 const t=(mn:string,english:string)=>en?english:mn;
 if(items.length!==3||tiers.some(t=>items.filter(p=>p.tier===t).length!==1))return t('Суурь, Стандарт, Дээд гурван багцыг бүгдийг бөглөнө үү.','All three packages are required.');
 for(const p of items){const error=checkPackage(p,en);if(error)return error}
 if(items[0].price>items[1].price||items[1].price>items[2].price)return t('Суурь багцын үнэ Стандартаас, Стандартын үнэ Дээд багцаас их байж болохгүй.','Prices must follow Basic ≤ Standard ≤ Premium.');
 return null;
}
const money=(n:number)=>new Intl.NumberFormat('mn-MN').format(n)+' ₮';

export function PackageEditor({en,service,stored,onSave,onBack,disabled,serviceType}:{en:boolean;service:Listing|null;stored:ServicePackage[];onSave:(p:ServicePackage[],status:'draft'|'pending')=>void;onBack:()=>void;disabled:boolean;serviceType?:string|null}){
 const [items,setItems]=useState(()=>initialPackages(service,stored,en).map(p=>({...p,deliverables:p.includes.join('\n')})));
 const [tier,setTier]=useState<Tier>('Basic');
 const [message,setMessage]=useState('');
 const t=(mn:string,eng:string)=>en?eng:mn;
 // V52: labels follow how the service is sold (fixed, hourly, monthly, session or custom quote).
 const kind=serviceTypeById(serviceType||(service as {service_type?:string|null}|null)?.service_type);
 const quote=kind.id==='custom',unit=kind.id!=='fixed'&&!quote?(en?kind.priceEn:kind.priceMn):'';
 const priceLabel=quote?t('Жишиг эхлэх үнэ (₮)','Example starting price (MNT)'):unit?t('Үнэ (₮) ','Price (MNT) ')+unit:t('Үнэ (₮)','Price (MNT)');
 const packages=items.map(({deliverables,...p})=>({...p,name:p.name.trim()||p.tier,includes:deliverables.split('\n').map(v=>v.trim()).filter(Boolean)}));
 const p=items[tiers.indexOf(tier)];
 const set=(patch:Partial<typeof p>)=>{
  setItems(prev=>prev.map(item=>item.tier===tier?{...item,...patch}:item));
  setMessage('');
 };
 function submit(status:'draft'|'pending'){
  const error=checkPackages(packages,en);
  if(error){
   const invalid=packages.find(item=>checkPackage(item,en));
   if(invalid)setTier(invalid.tier);
   setMessage(error);
   return;
  }
  setMessage('');
  onSave(packages,status);
 }
 return <section className="package-editor" aria-label={t('Үйлчилгээний багцууд','Service packages')}>
  <div className="package-editor-header">
   <h3>{quote?t('Жишиг багцууд','Example packages'):t('Үйлчилгээний багцууд','Service packages')}</h3>
   <p>{quote?t('Багц бүрт эхлэх үнэ, ажлын хүрээг бичнэ. Эцсийн үнийг захиалагчтай тохирно.','Give each package a starting price and scope. Agree the final price with your client.'):t('Гурван багцаа нэг нэгээр нь тохируулна уу.','Set up your three packages one at a time.')}</p>
  </div>
  <div className="package-editor-switch" role="group" aria-label={t('Засах багц','Package to edit')}>
   {packages.map(item=>{
    const ready=!checkPackage(item,en);
    return <button key={item.tier} type="button" aria-pressed={tier===item.tier} disabled={disabled} onClick={()=>{setTier(item.tier);setMessage('')}}>
     <strong>{tierLabel(item.tier,en)}</strong><small>{ready?t('Бэлэн','Ready'):t('Бөглөх','To fill')}</small>
    </button>;
   })}
  </div>
  <fieldset className="package-edit-card" key={tier} disabled={disabled}>
   <legend className="sr-only">{tierLabel(tier,en)}</legend>
   <div className="package-mini-fields">
    <label>{priceLabel}<input type="number" min={1000} max={100000000} required value={p.price||''} onChange={e=>set({price:Number(e.target.value)})}/></label>
    <label>{t('Хугацаа (хоног)','Delivery (days)')}<input type="number" min={1} max={365} required value={p.delivery_days||''} onChange={e=>set({delivery_days:Number(e.target.value)})}/></label>
    <label>{t('Засварын тоо','Revisions')}<input type="number" min={0} max={20} value={p.revisions} onChange={e=>set({revisions:Number(e.target.value)})}/></label>
   </div>
   <label>{t('Багтах ажлууд','What’s included')}<textarea rows={3} required value={p.deliverables} onChange={e=>set({deliverables:e.target.value})} placeholder={t('Жишээ нь: 2 логоны хувилбар\nХэвлэхэд бэлэн файл','e.g. 2 logo concepts\nPrint-ready file')}/><small>{t('Ажил бүрийг тусдаа мөрөнд бичээрэй.','Put each deliverable on its own line.')}</small></label>
   <details className="v71-optional">
    <summary>{t('Багцын нэр ба тайлбар','Package name and description')} <small>{t('Алгасаж болно','Optional · can skip')}</small></summary>
    <div className="package-mini-fields">
     <label>{t('Багцын нэр','Package title')}<input value={p.name} maxLength={60} onChange={e=>set({name:e.target.value})}/></label>
     <label>{t('Товч тайлбар','Short description')}<textarea value={p.summary} maxLength={300} rows={2} onChange={e=>set({summary:e.target.value})}/></label>
    </div>
   </details>
  </fieldset>
  {message&&<p className="package-error" role="alert">{message}</p>}
  <div className="v50-step-nav package-editor-actions">
   <button type="button" className="button outline small" disabled={disabled} onClick={onBack}><ArrowLeft size={15} aria-hidden="true"/>{t('Өмнөх','Back')}</button>
   <div>
    <button type="button" className="button outline small" disabled={disabled} onClick={()=>submit('draft')}>{t('Ноорог хадгалах','Save draft')}</button>
    <button type="button" className="button small" disabled={disabled} onClick={()=>submit('pending')}>{t('Хянуулахаар илгээх','Submit for review')}</button>
   </div>
  </div>
 </section>;
}

export function PackagePicker({en,items,chosen,onChange}:{en:boolean;items:ServicePackage[];chosen:Tier;onChange:(tier:Tier)=>void}){
 const t=(mn:string,eng:string)=>en?eng:mn;const sorted=tiers.map(tier=>items.find(x=>x.tier===tier)).filter((x):x is ServicePackage=>!!x);
 return <div className="package-picker"><div className="package-picker-tabs" role="group" aria-label={t('Үнийн багц сонгох','Choose pricing package')}>{sorted.map(p=><button type="button" key={p.tier} aria-pressed={chosen===p.tier} className={chosen===p.tier?'active':''} onClick={()=>onChange(p.tier)}>{tierLabel(p.tier,en)}</button>)}</div>{sorted.filter(p=>p.tier===chosen).map(p=><div className="package-picker-body" key={p.tier}><div className="package-picker-head"><h3>{tierLabel(p.name,en)}</h3><strong>{money(p.price)}</strong></div>{p.summary&&<p>{p.summary}</p>}<div className="package-picker-metrics"><span><Clock3 size={16}/>{p.delivery_days} {t('хоног','days')}</span><span><RotateCcw size={16}/>{p.revisions} {t('засвар','revisions')}</span></div><h4>{t('Багтсан ажлууд','What’s included')}</h4><ul>{p.includes.map((line,i)=><li key={i}><Check size={16}/>{line}</li>)}</ul></div>)}</div>;
}
