'use client';
import {useEffect,useRef,useState} from 'react';
import {ImagePlus,MoveVertical,Trash2} from 'lucide-react';
import {marketplaceClient} from '../lib/marketplace/client';
import '../app/v42-profile-owner.css';

const MAX_COVER_BYTES=5*1024*1024;
const extensions:Record<string,string>={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'};
const looksLikeImage=async(file:File)=>{
 const b=new Uint8Array(await file.slice(0,16).arrayBuffer());
 return file.type==='image/jpeg'?b[0]===0xff&&b[1]===0xd8&&b[2]===0xff:
 file.type==='image/png'?[137,80,78,71,13,10,26,10].every((v,i)=>b[i]===v):
 file.type==='image/webp'?String.fromCharCode(...b.slice(0,4))==='RIFF'&&String.fromCharCode(...b.slice(8,12))==='WEBP':false;
};
type Props={sellerId:string;coverPath:string|null|undefined;focusY:number|null|undefined;en:boolean;onChange:(path:string|null,y:number)=>void;onUpdated?:()=>void};
export default function SellerCoverEditor({sellerId,coverPath,focusY=50,en,onChange,onUpdated}:Props){
 const input=useRef<HTMLInputElement>(null);
 const [url,setUrl]=useState<string|null>(null);
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState('');
 const [focus,setFocus]=useState(Math.min(100,Math.max(0,Number.isFinite(Number(focusY))?Number(focusY):50)));
 const t=(mn:string,english:string)=>en?english:mn;
 useEffect(()=>setFocus(Math.min(100,Math.max(0,Number.isFinite(Number(focusY))?Number(focusY):50))),[focusY]);
 useEffect(()=>{
  let alive=true;setUrl(null);
  if(!coverPath)return()=>{alive=false};
  void marketplaceClient().then(db=>db.storage.from('portfolio').createSignedUrl(coverPath,600))
   .then(({data,error})=>{if(alive&&!error&&data?.signedUrl)setUrl(data.signedUrl)})
   .catch(()=>{});
  return()=>{alive=false};
 },[coverPath,sellerId]);
 const own=async()=>{
  const db=await marketplaceClient();
  const {data:{user},error}=await db.auth.getUser();
  if(error||user?.id!==sellerId)throw Error('Session changed');
  return db;
 };
 const upload=async(file:File|undefined)=>{
  if(!file||busy)return;
  setMessage('');
  if(!extensions[file.type]||file.size<=0||file.size>MAX_COVER_BYTES||!(await looksLikeImage(file))){
   setMessage(t('Зөвхөн 5 MB хүртэл JPEG, PNG, WebP зураг оруулна уу.','Choose a genuine JPEG, PNG or WebP file under 5 MB.'));return;
  }
  try{
   const bitmap=await createImageBitmap(file);
   const valid=bitmap.width>=1000&&bitmap.height>=300&&bitmap.width/bitmap.height>=1.7;
   bitmap.close();
   if(!valid){setMessage(t('Хэвтээ зураг сонгоно уу (хамгийн багадаа 1000 × 300 px).','Use a landscape image of at least 1000 × 300 px.'));return}
  }catch{setMessage(t('Зургийг уншиж чадсангүй.','Unable to decode this image.'));return}
  setBusy(true);
  let nextPath='';
  try{
   const db=await own();
   nextPath=sellerId+'/'+crypto.randomUUID()+'.'+extensions[file.type];
   const uploaded=await db.storage.from('portfolio').upload(nextPath,file,{contentType:file.type,cacheControl:'3600',upsert:false});
   if(uploaded.error)throw uploaded.error;
   const update=await db.from('profiles').update({cover_path:nextPath,cover_focus_y:focus}).eq('id',sellerId).eq('is_seller',true).select('cover_path,cover_focus_y').single();
   if(update.error||update.data?.cover_path!==nextPath)throw update.error||new Error('Cover was not saved');
   const committed=nextPath;nextPath='';
   const previous=coverPath;
   onChange(committed,focus);
   onUpdated?.();
   if(previous&&previous!==committed&&previous.startsWith(sellerId+'/'))void db.storage.from('portfolio').remove([previous]);
   try{const signed=await db.storage.from('portfolio').createSignedUrl(committed,600);if(signed.data?.signedUrl)setUrl(signed.data.signedUrl)}catch{}
  }catch{
   if(nextPath){try{(await marketplaceClient()).storage.from('portfolio').remove([nextPath])}catch{}}
   setMessage(t('Нүүр зураг хадгалж чадсангүй. Дахин оролдоно уу.','Could not save your cover. Please try again.'));
  }finally{setBusy(false);if(input.current)input.current.value=''}
 };
 const saveFocus=async()=>{
  if(busy||!coverPath)return;
  setBusy(true);setMessage('');
  try{
   const db=await own();
   const result=await db.from('profiles').update({cover_focus_y:focus}).eq('id',sellerId).eq('is_seller',true).select('cover_focus_y').single();
   if(result.error||result.data?.cover_focus_y!==focus)throw result.error||new Error('Focus was not saved');
   onChange(coverPath,focus);onUpdated?.();
  }catch{setMessage(t('Зургийн байрлал хадгалагдсангүй.','Could not save the photo position.'))}
  finally{setBusy(false)}
 };
 const remove=async()=>{
  if(!coverPath||busy)return;
  setBusy(true);setMessage('');
  try{
   const db=await own();
   const updated=await db.from('profiles').update({cover_path:null,cover_focus_y:50}).eq('id',sellerId).eq('is_seller',true).select('cover_path').single();
   if(updated.error||updated.data?.cover_path!==null)throw updated.error||new Error('Delete failed');
   const previous=coverPath;onChange(null,50);onUpdated?.();setUrl(null);setFocus(50);
   if(previous.startsWith(sellerId+'/'))void db.storage.from('portfolio').remove([previous]);
  }catch{setMessage(t('Нүүр зураг устгаж чадсангүй.','Could not remove this cover.'))}
  finally{setBusy(false)}
 };
 return <section className="v42-cover-editor" aria-label={t('Профайлын нүүр зураг','Profile cover photo')}>
  <div className="v42-cover-stage">
   {url?<img src={url} alt={t('Миний нүүр зураг','My cover photo')} style={{objectPosition:'center '+focus+'%'}}/>:<div className="v42-cover-default"><span aria-hidden="true">linkup.</span></div>}
   <span className="v42-cover-note">{t('НҮҮР ЗУРАГ / 1600 × 500','COVER / 1600 × 500')}</span>
  </div>
  <div className="v42-cover-control">
   <div><strong>{t('Нүүр зураг','Cover photo')}</strong><p>{t('Өргөн зураг сонгоорой. Зөвхөн нийтэд нээсэн профайл дээр харагдана.','Use a landscape photo. It is public only when you publish your profile.')}</p></div>
   <input ref={input} className="v42-hidden-file" aria-label={t('Нүүр зураг сонгох','Choose cover photo')} type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={e=>{void upload(e.currentTarget.files?.[0])}}/>
   <div className="v42-cover-buttons"><button type="button" disabled={busy} onClick={()=>input.current?.click()}><ImagePlus size={17}/>{url?t('Зураг солих','Replace cover'):t('Зураг оруулах','Upload cover')}</button>
   {coverPath&&<button type="button" disabled={busy} onClick={()=>{void remove()}}><Trash2 size={17}/>{t('Устгах','Remove')}</button>}</div>
  </div>
  {url&&<div className="v42-cover-position"><label htmlFor="v42-focus-y"><MoveVertical size={16}/>{t('Зургийн босоо байрлал','Vertical crop position')}</label><input id="v42-focus-y" type="range" min="0" max="100" step="1" value={focus} onChange={e=>setFocus(Number(e.currentTarget.value))}/><button type="button" onClick={()=>{void saveFocus()}} disabled={busy||focus===Number(focusY??50)}>{t('Байрлал хадгалах','Save position')}</button></div>}
  {message&&<p className="v42-cover-error" role="alert">{message}</p>}
 </section>;
}
