'use client';
import {useEffect,useMemo,useState} from 'react';
import {Atom,BarChart3,BookOpen,Bot,Box,Camera,Check,Code2,Database,FileSpreadsheet,FileText,Figma,Image,Layers3,Music2,Palette,PenTool,Plus,Search,Settings2,Video,Wrench,X,type LucideIcon} from 'lucide-react';
import {marketplaceClient} from '../lib/marketplace/client';
import {CREATIVE_TOOLS,CREATIVE_TOOL_MAX,CATEGORY_LABELS,creativeToolFor,brandLogoFor,type CreativeTool} from '../lib/marketplace/creative-tools';
import '../app/v40-seller-portfolio.css';

type Choice={tool_key:string;icon_key:string};
const icons:Record<CreativeTool['icon'],LucideIcon>={figma:Figma,image:Image,pen:PenTool,video:Video,palette:Palette,box:Box,code:Code2,react:Atom,database:Database,table:FileSpreadsheet,chart:BarChart3,bot:Bot,notebook:BookOpen,audio:Music2,camera:Camera,layers:Layers3,file:FileText};
const iconChoices=[
 {key:'auto',mn:'Програмын лого',en:'Brand logo',Icon:Settings2},
 {key:'palette',mn:'Дизайн',en:'Design',Icon:Palette},
 {key:'code',mn:'Код',en:'Code',Icon:Code2},
 {key:'layers',mn:'Давхарга',en:'Layers',Icon:Layers3},
 {key:'video',mn:'Видео',en:'Video',Icon:Video},
 {key:'sparkles',mn:'AI / Бүтээл',en:'AI / Creative',Icon:Atom},
 {key:'chart',mn:'Шинжилгээ',en:'Analytics',Icon:BarChart3},
 {key:'camera',mn:'Зураг',en:'Photo',Icon:Camera},
 {key:'file',mn:'Баримт бичиг',en:'Documents',Icon:FileText},
 {key:'wrench',mn:'Хэрэгсэл',en:'Tools',Icon:Wrench}
] as const;

export default function SellerToolEditor({sellerId,en,onUpdated}:{sellerId:string;en:boolean;onUpdated?:()=>void}){
 const [saved,setSaved]=useState<Choice[]>([]);
 const [status,setStatus]=useState<'loading'|'ready'|'error'>('loading');
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState('');
 const [search,setSearch]=useState('');
 const [editingIcon,setEditingIcon]=useState<string|null>(null);
 const t=(mn:string,eng:string)=>en?eng:mn;
 useEffect(()=>{
  let alive=true;
  setSaved([]);setStatus('loading');setMessage('');
  if(!sellerId){setStatus('error');return()=>{alive=false};}
  void marketplaceClient().then(async db=>{
   const user=await db.auth.getUser();
   if(user.error||user.data.user?.id!==sellerId)throw Error('Not signed in');
   return db.from('seller_tools').select('tool_key,icon_key').eq('seller_id',sellerId).order('created_at',{ascending:true});
  }).then(({data,error})=>{
   if(!alive)return;
   if(error)throw error;
   setSaved(((data||[]) as Choice[]).filter(v=>Boolean(creativeToolFor(v.tool_key))));
   setStatus('ready');
  }).catch(()=>{if(alive){setStatus('error');setMessage(t('Хэрэгслийн жагсаалт түр ачаалагдсангүй. Дахин оролдоно уу.','Could not load your tools right now. Please try again.'))}});
  return()=>{alive=false};
 },[sellerId,en]);
 const filtered=useMemo(()=>CREATIVE_TOOLS.filter(tool=>tool.name.toLowerCase().includes(search.trim().toLowerCase())),[search]);
 async function changeTool(key:string){
  if(status!=='ready'||busy||!creativeToolFor(key))return;
  const existing=saved.find(x=>x.tool_key===key);
  if(!existing&&saved.length>=CREATIVE_TOOL_MAX){setMessage(t('Хамгийн ихдээ 16 хэрэгсэл сонгоно.','Choose up to 16 tools.'));return;}
  setBusy(true);setMessage('');
  try{
   const db=await marketplaceClient();
   const {data:{user},error:authError}=await db.auth.getUser();
   if(authError||user?.id!==sellerId)throw Error('Session changed');
   const result=existing
    ?await db.from('seller_tools').delete().eq('seller_id',sellerId).eq('tool_key',key)
    :await db.from('seller_tools').insert({seller_id:sellerId,tool_key:key,icon_key:'auto'});
   if(result.error)throw result.error;
   setSaved(prev=>existing?prev.filter(x=>x.tool_key!==key):[...prev,{tool_key:key,icon_key:'auto'}]);
   onUpdated?.();
   if(existing&&editingIcon===key)setEditingIcon(null);
  }catch{setMessage(t('Хадгалах үед алдаа гарлаа. Дахин оролдоно уу.','Could not save this tool. Please retry.'))}
  finally{setBusy(false)}
 }
 async function changeIcon(key:string,icon:string){
  if(busy||status!=='ready'||!iconChoices.some(x=>x.key===icon)||!saved.some(v=>v.tool_key===key))return;
  setBusy(true);setMessage('');
  try{
   const db=await marketplaceClient();
   const {data:{user},error:authError}=await db.auth.getUser();
   if(authError||user?.id!==sellerId)throw Error('Session changed');
   const result=await db.from('seller_tools').update({icon_key:icon}).eq('seller_id',sellerId).eq('tool_key',key);
   if(result.error)throw result.error;
   setSaved(prev=>prev.map(v=>v.tool_key===key?{...v,icon_key:icon}:v));
   onUpdated?.();
   setEditingIcon(null);
  }catch{setMessage(t('Дүрс хадгалж чадсангүй.','Could not save the icon.'))}
  finally{setBusy(false)}
 }
 return <section className="v40-tools-editor" aria-label={t('Ашигладаг програмууд','My software and tools')}>
  <div className="v40-tools-heading">
   <div><span className="v40-eyebrow">{t('Ашигладаг програмууд','LINKUP / CREATIVE TOOLKIT')}</span><h2>{t('Ашигладаг програмууд','Tools I work with')}</h2>
   <p>{t('Ашигладаг програмаа сонгоорой. Хүсвэл дүрсийг нь өөрчилж болно. Сонголт таны нийтэд нээлттэй профайлд харагдана.','Choose the software you use and customize its icon. Only your selected tools appear on your public profile.')}</p></div>
   <span className="v40-tools-counter">{saved.length}/{CREATIVE_TOOL_MAX}</span>
  </div>
  {status==='loading'&&<p role="status" className="v40-tools-status">{t('Хэрэгслүүдийг шалгаж байна…','Loading tools…')}</p>}
  {status==='error'&&<p role="alert" className="v40-tools-error">{message}</p>}
  {status==='ready'&&<>
   <div className="v40-selected-tools">
    <div className="v40-selected-header"><strong>{t('Сонгосон програмууд','Your selected tools')}</strong><small>{t('Шууд хадгалагдана','Saved automatically')}</small></div>
    {!saved.length&&<p className="v40-tools-empty">{t('Одоогоор програм сонгоогүй байна. Доорх жагсаалтаас сонгоорой.','No tools selected yet. Choose tools from below.')}</p>}
    <div className="v40-selected-grid">{saved.map(choice=>{
     const tool=creativeToolFor(choice.tool_key);
     if(!tool)return null;
     const DefaultIcon=icons[tool.icon];
     const CustomIcon=iconChoices.find(o=>o.key===choice.icon_key)?.Icon;
     const Icon=choice.icon_key==='auto'||!CustomIcon?DefaultIcon:CustomIcon;
     const brandSrc=brandLogoFor(tool.key);
     return <div className="v40-selected-item" key={tool.key}>
      <div className="v40-selected-main"><span className="v40-tool-icon v40-brand-icon">{brandSrc?<img src={brandSrc} width={28} height={28} alt="" loading="lazy" decoding="async"/>:<Icon size={20}/>}</span><span>{tool.name}</span>{choice.icon_key!=='auto'&&<span className="v40-custom-indicator" title={t('Өөрчилсөн дүрс','Custom icon')}><Icon size={13}/></span>}</div>
      <div className="v40-selected-actions">
       <button type="button" disabled={busy} aria-expanded={editingIcon===tool.key} aria-label={t('Дүрс сонгох: ','Choose icon: ')+tool.name} onClick={()=>setEditingIcon(v=>v===tool.key?null:tool.key)} title={t('Дүрс өөрчлөх','Change icon')}><Settings2 size={17}/></button>
       <button type="button" disabled={busy} aria-label={t('Жагсаалтаас хасах: ','Remove: ')+tool.name} onClick={()=>{void changeTool(tool.key)}}><X size={17}/></button>
      </div>
      {editingIcon===tool.key&&<div className="v40-icon-picker" aria-label={t('Дүрсний төрөл','Icon style')}>{iconChoices.map(option=><button type="button" className={choice.icon_key===option.key?'active':''} key={option.key} aria-pressed={choice.icon_key===option.key} title={en?option.en:option.mn} aria-label={en?option.en:option.mn} disabled={busy} onClick={()=>{void changeIcon(tool.key,option.key)}}><option.Icon size={18}/></button>)}</div>}
     </div>
    })}</div>
   </div>
   <label className="v40-tool-search"><Search size={18}/><input aria-label={t('Програм хайх','Search tools')} value={search} onChange={e=>setSearch(e.target.value)} placeholder={t('Figma, Canva, Excel...','Search Figma, Canva, Excel...')}/></label>
   {(['design','development','media','productivity'] as const).map(cat=>{
    const matches=filtered.filter(tool=>tool.category===cat);
    if(!matches.length)return null;
    return <div key={cat} className="v40-tool-section"><h3>{CATEGORY_LABELS[cat][en?1:0]}</h3><div className="v40-tool-grid">{matches.map(tool=>{
     const Icon=icons[tool.icon];const chosen=saved.some(c=>c.tool_key===tool.key);
     return <button type="button" key={tool.key} aria-pressed={chosen} disabled={busy||(!chosen&&saved.length>=CREATIVE_TOOL_MAX)} onClick={()=>{void changeTool(tool.key)}} className={'v40-tool-choice '+(chosen?'chosen':'')}><span className="v40-tool-icon v40-brand-icon">{brandLogoFor(tool.key)?<img src={brandLogoFor(tool.key)} width={28} height={28} alt="" loading="lazy" decoding="async"/>:<Icon size={20}/>}</span><span>{tool.name}</span><span className="v40-tool-choice-end">{chosen?<Check size={17}/>:<Plus size={17}/>}</span></button>
    })}</div></div>;
   })}
   {message&&<p role="alert" className="v40-tools-error">{message}</p>}
  </>}
 </section>;
}
