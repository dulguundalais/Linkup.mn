'use client';
import {useState} from 'react';
import {Trash2} from 'lucide-react';
import {marketplaceClient} from '../lib/marketplace/client';
import '../app/v71-service-editor.css';

/** V71 (owner): a seller deletes their own service — published or draft — after one
 *  confirmation. A service that is part of someone's order history is archived
 *  (hidden everywhere, kept for that history) instead of being erased. */
export default function ServiceDeleteButton({en,serviceId,title,onDone,onError}:{
 en:boolean;serviceId:string;title:string;onDone:(result:'deleted'|'archived')=>void;onError:(e:unknown)=>void;
}){
 const t=(mn:string,eng:string)=>en?eng:mn;
 const [asking,setAsking]=useState(false),[busy,setBusy]=useState(false),[problem,setProblem]=useState('');
 async function remove(){
  if(busy)return;setBusy(true);
  try{
   const db=await marketplaceClient();
   const r=await db.rpc('delete_own_service',{p_service:serviceId});
   if(r.error)throw r.error;
   onDone(r.data==='archived'?'archived':'deleted');
  }catch(e){
   // V72: say what happened right here, next to the button the person pressed.
   const m=String((e as {message?:string;code?:string})?.message||'')+' '+String((e as {code?:string})?.code||'');
   setProblem(/delete_own_service|PGRST202|could not find the function/i.test(m)
    ?t('Устгах боломж одоохондоо идэвхжээгүй байна. Удахгүй ажиллана.','Deleting is not switched on yet. It will work soon.')
    :t('Устгаж чадсангүй. Дахин оролдоно уу.','Could not delete. Please try again.'));
   setAsking(false);onError(e);
  }finally{setBusy(false)}
 }
 if(!asking)return <>
  <button type="button" className="button outline small v71-delete" onClick={()=>{setProblem('');setAsking(true)}} aria-label={t('Устгах: ','Delete: ')+title}><Trash2 size={15} aria-hidden="true"/>{t('Устгах','Delete')}</button>
  {problem&&<p className="v72-delete-problem" role="alert">{problem}</p>}
 </>;
 return <div className="v71-delete-confirm" role="group" aria-label={t('Устгахыг баталгаажуулах','Confirm delete')}>
  <span>{t('Устгах уу?','Delete?')}</span>
  <button type="button" className="button small v71-delete-yes" disabled={busy} onClick={()=>void remove()}>{busy?t('Устгаж байна…','Deleting…'):t('Тийм, устгах','Yes, delete')}</button>
  <button type="button" className="button outline small" disabled={busy} onClick={()=>setAsking(false)} autoFocus>{t('Болих','Cancel')}</button>
 </div>;
}
