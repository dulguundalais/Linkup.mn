'use client';
import {useEffect,useRef,useState} from 'react';
import {Trash2} from 'lucide-react';
import {marketplaceClient} from '../lib/marketplace/client';
import '../app/v71-service-editor.css';

/** V71 (owner): a seller deletes their own service — published or draft. A service
 *  that is part of someone's order history is archived (hidden everywhere, kept for
 *  that history) instead of being erased.
 *  V72 (owner): the row keeps just «Засах» and «Устгах»; the question «Устгах уу?»
 *  opens in a small centred dialog, and any problem is shown inside it. */
export default function ServiceDeleteButton({en,serviceId,title,onDone}:{
 en:boolean;serviceId:string;title:string;onDone:(result:'deleted'|'archived')=>void;onError?:(e:unknown)=>void;
}){
 const t=(mn:string,eng:string)=>en?eng:mn;
 const [open,setOpen]=useState(false),[busy,setBusy]=useState(false),[problem,setProblem]=useState('');
 const opener=useRef<HTMLButtonElement>(null),cancel=useRef<HTMLButtonElement>(null);
 const close=()=>{if(busy)return;setOpen(false);setProblem('');opener.current?.focus()};
 useEffect(()=>{if(open)cancel.current?.focus()},[open]);
 useEffect(()=>{
  if(!open)return;
  const key=(e:KeyboardEvent)=>{if(e.key==='Escape')close()};
  document.addEventListener('keydown',key);return()=>document.removeEventListener('keydown',key);
 },[open,busy]);
 async function remove(){
  if(busy)return;setBusy(true);setProblem('');
  try{
   const db=await marketplaceClient();
   const r=await db.rpc('delete_own_service',{p_service:serviceId});
   if(r.error)throw r.error;
   setOpen(false);
   onDone(r.data==='archived'?'archived':'deleted');
  }catch(e){
   // V72: say what happened right here, where the person is looking.
   const m=String((e as {message?:string})?.message||'')+' '+String((e as {code?:string})?.code||'');
   setProblem(/delete_own_service|PGRST202|could not find the function/i.test(m)
    ?t('Устгах боломж одоохондоо идэвхжээгүй байна. Удахгүй ажиллана.','Deleting is not switched on yet. It will work soon.')
    :t('Устгаж чадсангүй. Дахин оролдоно уу.','Could not delete. Please try again.'));
  }finally{setBusy(false)}
 }
 return <>
  <button type="button" ref={opener} className="button outline small v71-delete" onClick={()=>setOpen(true)} aria-label={t('Устгах: ','Delete: ')+title}><Trash2 size={15} aria-hidden="true"/>{t('Устгах','Delete')}</button>
  {open&&<div className="v72-dialog-layer">
   <div className="v72-dialog-scrim" onClick={close} aria-hidden="true"/>
   <div className="v72-dialog" role="alertdialog" aria-modal="true" aria-labelledby={'v72-del-'+serviceId}>
    <h2 id={'v72-del-'+serviceId}>{t('«'+title+'»-г устгах уу?','Delete “'+title+'”?')}</h2>
    {problem&&<p className="v72-delete-problem" role="alert">{problem}</p>}
    <div className="v72-dialog-actions">
     <button type="button" ref={cancel} className="button outline" disabled={busy} onClick={close}>{t('Болих','Cancel')}</button>
     <button type="button" className="button v71-delete-yes" disabled={busy} onClick={()=>void remove()}>{busy?t('Устгаж байна…','Deleting…'):t('Устгах','Delete')}</button>
    </div>
   </div>
  </div>}
 </>;
}
