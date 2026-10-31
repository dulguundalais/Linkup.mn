'use client';
import {useEffect,useState} from 'react';
import {Lightbulb,ShieldCheck,X} from 'lucide-react';
import {marketplaceClient} from '../lib/marketplace/client';
import {CATEGORIES,SERVICE_TYPES,categoryById,normalizeCategory,legacyCategory,type ServiceType} from '../lib/marketplace/taxonomy';

type Editing={category?:string;subcategory?:string|null;service_type?:string|null;tags?:string[]|null}|null;

/* V50: sellers choose from the fixed taxonomy (main category → subcategory),
   pick how the service is sold, add a few tags, and can suggest a missing
   category for admin review. Suggestions never become public on their own. */
export default function ServiceCategoryFields({en,uid,editing,onError,onNotice,onTypeChange}:{
 en:boolean;uid:string;editing:Editing;onError:(e:unknown)=>void;onNotice:(m:string)=>void;onTypeChange?:(type:ServiceType)=>void
}){
 const t=(mn:string,eng:string)=>en?eng:mn;
 const legacy=editing?.category?legacyCategory(editing.category):undefined;
 const startCategory=normalizeCategory(editing?.category)==='all'?'':normalizeCategory(editing?.category) as string;
 const [category,setCategory]=useState<string>(startCategory);
 const [subcategory,setSubcategory]=useState<string>(editing?.subcategory||legacy?.subcategory||'');
 const [type,setType]=useState<ServiceType>((SERVICE_TYPES.find(x=>x.id===editing?.service_type)?.id)||'fixed');
 // V52: the package editor relabels its fields for the chosen pricing model.
 useEffect(()=>{onTypeChange?.(type)},[type]);
 const [suggesting,setSuggesting]=useState(false);
 const [suggestion,setSuggestion]=useState({name:'',nameEn:'',note:''});
 const [sending,setSending]=useState(false);
 const current=categoryById(category);
 async function sendSuggestion(){
  if(sending)return;
  if(suggestion.name.trim().length<2){onError(new Error(t('Ангиллын нэрээ бичнэ үү.','Enter a category name.')));return}
  setSending(true);
  try{
   const db=await marketplaceClient();
   const r=await db.from('category_suggestions').insert({seller_id:uid,parent_category:category||null,name_mn:suggestion.name.trim(),name_en:suggestion.nameEn.trim(),note:suggestion.note.trim()});
   if(r.error)throw r.error;
   setSuggestion({name:'',nameEn:'',note:''});setSuggesting(false);
   onNotice(t('Саналыг хүлээн авлаа. Админ хянаад шийдвэрлэнэ. Одоохондоо хамгийн ойр ангиллаа сонгоно уу.','Suggestion received. An admin will review it. For now, choose the closest category.'));
  }catch(e){onError(e)}finally{setSending(false)}
 }
 return <div className="v50-fields">
  <div className="form-grid">
   <label>{t('Үндсэн ангилал','Main category')}
    <select name="category" required value={category} onChange={e=>{setCategory(e.target.value);setSubcategory('')}}>
     <option value="" disabled>{t('Сонгох','Choose')}</option>
     {CATEGORIES.map(c=><option key={c.id} value={c.id}>{en?c.en:c.mn}</option>)}
    </select>
   </label>
   <label>{t('Дэд ангилал','Subcategory')}
    <select name="subcategory" required value={subcategory} onChange={e=>setSubcategory(e.target.value)} disabled={!current}>
     <option value="" disabled>{current?t('Сонгох','Choose'):t('Эхлээд үндсэн ангиллаа сонгоно уу','Choose a main category first')}</option>
     {current?.subcategories.map(s=><option key={s.id} value={s.id}>{en?s.en:s.mn}</option>)}
    </select>
   </label>
  </div>
  {current?.regulated&&<p className="v50-regulated" role="note"><ShieldCheck size={17} aria-hidden="true"/>{t('Энэ ангиллын үйлчилгээг мэргэжлийн үнэмлэх, зөвшөөрлийг тань админ баталгаажуулсны дараа л нийтэлнэ. Тайлбартаа мэргэжлийн мэдээллээ оруулна уу.','Services in this category are published only after an admin verifies your professional licence. Include your credentials in the description.')}</p>}
  <button type="button" className="v50-suggest-link" onClick={()=>setSuggesting(v=>!v)} aria-expanded={suggesting}><Lightbulb size={15} aria-hidden="true"/>{t('Тохирох ангилал олдсонгүй юу? Шинэ ангилал санал болгох','Can’t find the right category? Suggest a new one')}</button>
  {suggesting&&<div className="v50-suggest" role="group" aria-label={t('Шинэ ангиллын санал','Category suggestion')}>
   <div className="row-between"><b>{t('Шинэ ангилал санал болгох','Suggest a new category')}</b><button type="button" className="icon-button" onClick={()=>setSuggesting(false)} aria-label={t('Хаах','Close')}><X size={16}/></button></div>
   <p>{t('Санал шууд нийтлэгдэхгүй. Админ хянаад шинээр нэмэх, татгалзах эсвэл одоо байгаа ангилалд нэгтгэнэ.','Suggestions are not published automatically. An admin will add, decline or merge them into an existing category.')}</p>
   <div className="form-grid">
    <label>{t('Ангиллын нэр','Category name')}<input value={suggestion.name} maxLength={80} onChange={e=>setSuggestion(s=>({...s,name:e.target.value}))} placeholder={t('Жишээ нь: Тендерийн бичиг баримт','e.g. Tender documents')}/></label>
    <label>{t('Англи нэр (заавал биш)','English name (optional)')}<input value={suggestion.nameEn} maxLength={80} onChange={e=>setSuggestion(s=>({...s,nameEn:e.target.value}))}/></label>
   </div>
   <label>{t('Яагаад хэрэгтэй вэ?','Why is it needed?')}<textarea value={suggestion.note} maxLength={500} onChange={e=>setSuggestion(s=>({...s,note:e.target.value}))}/></label>
   <button type="button" className="button small" disabled={sending} onClick={()=>void sendSuggestion()}>{sending?t('Илгээж байна…','Sending…'):t('Санал илгээх','Send suggestion')}</button>
  </div>}
  <fieldset className="v50-types">
   <legend>{t('Үйлчилгээний хэлбэр','How you sell this service')}</legend>
   <div>{SERVICE_TYPES.map(s=><label key={s.id} className={type===s.id?'selected':''}>
    <input type="radio" name="service_type" value={s.id} checked={type===s.id} onChange={()=>setType(s.id)}/>
    <b>{en?s.en:s.mn}</b><small>{en?s.hintEn:s.hintMn}</small>
   </label>)}</div>
   {type!=='fixed'&&<p className="v50-type-note">{t('Суурь багцын үнэ нь ','The Basic package price is shown as ')}<b>{en?'price '+serviceTypeSuffix(type,true):'үнэ '+serviceTypeSuffix(type,false)}</b>{t(' гэж харагдана. Төлбөр Linkup-аар дамжихгүй.',' . Payments do not go through Linkup.')}</p>}
  </fieldset>
  <label>{t('Ур чадвар, түлхүүр үг (таслалаар, 8 хүртэл)','Skills and tags (comma separated, up to 8)')}
   <input name="tags" defaultValue={(editing?.tags||[]).join(', ')} maxLength={240} placeholder={t('Жишээ нь: n8n, Messenger, CRM','e.g. n8n, Messenger, CRM')}/>
  </label>
 </div>;
}
function serviceTypeSuffix(type:ServiceType,en:boolean){const s=SERVICE_TYPES.find(x=>x.id===type)!;return en?s.priceEn:s.priceMn}
export function parseTags(value:string):string[]{
 return [...new Set(value.split(',').map(x=>x.trim()).filter(x=>x.length>=1&&x.length<=30))].slice(0,8);
}
