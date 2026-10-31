'use client';
import {trapTab} from '../lib/marketplace/focus-trap';
import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import Link from 'next/link';
import {ArrowUpRight,BriefcaseBusiness,Check,CheckCircle2,Eye,EyeOff,FileImage,Globe2,Layers3,LoaderCircle,Maximize2,Minimize2,Monitor,Pencil,Plus,RotateCcw,Save,Smartphone,Trash2,UploadCloud,UserRound,Wrench,X} from 'lucide-react';
import {marketplaceClient} from '../lib/marketplace/client';
import {normalizeSellerSlug,isValidSellerSlug} from '../lib/marketplace/seller-slug';
import type {Profile} from '../lib/marketplace/types';
import SellerAvatarEditor from './seller-avatar-editor';
import SellerCoverEditor from './seller-cover-editor';
import SellerToolEditor from './seller-tool-editor';
import SellerProfilePreview,{splitSkills,type PreviewSection,type PreviewService} from './seller-profile-preview';
import SiteHeader,{Breadcrumbs,useSiteAccount} from './site-header';
import '../app/v42-profile-owner.css';
import '../app/v50-profile-studio.css';

type Tab=PreviewSection;
type Item={id:string;title:string;object_path:string;url?:string};
type ProfileDraft={display_name:string;headline:string;bio:string;skills:string;slug:string;public_profile:boolean};
const fileExt:Record<string,string>={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'};
const emptyDraft:ProfileDraft={display_name:'',headline:'',bio:'',skills:'',slug:'',public_profile:false};
const BIO_MIN=80;
const toDraft=(p:Profile):ProfileDraft=>({display_name:p.display_name||'',headline:p.headline||'',bio:p.bio||'',skills:p.skills||'',slug:p.slug||'',public_profile:!!p.public_profile});
const sameDraft=(a:ProfileDraft,b:ProfileDraft)=>(Object.keys(a) as (keyof ProfileDraft)[]).every(k=>a[k]===b[k]);

export default function SellerProfileManager(){
 const [uid,setUid]=useState('');
 const [profile,setProfile]=useState<Profile|null>(null);
 const [draft,setDraft]=useState<ProfileDraft>(emptyDraft);
 const [items,setItems]=useState<Item[]>([]);
 const [tools,setTools]=useState<string[]>([]);
 const [services,setServices]=useState<PreviewService[]>([]);
 const [photoUrls,setPhotoUrls]=useState<{avatar:string|null;cover:string|null}>({avatar:null,cover:null});
 const [status,setStatus]=useState<'loading'|'ready'|'error'|'guest'|'not-seller'>('loading');
 const [tab,setTab]=useState<Tab>('about');
 const [buyerView,setBuyerView]=useState(false);
 const [mobilePane,setMobilePane]=useState<'edit'|'preview'>('edit');
 const [device,setDevice]=useState<'desktop'|'mobile'>('desktop');
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState('');
 const [error,setError]=useState('');
 const [en,setEn]=useState(false);
 const [skillInput,setSkillInput]=useState('');
 const [projectTitle,setProjectTitle]=useState('');
 const [projectFile,setProjectFile]=useState<File|null>(null);
 const [projectPreview,setProjectPreview]=useState<string|null>(null);
 const [dragging,setDragging]=useState(false);
 const [confirmRemove,setConfirmRemove]=useState('');
 const [signRound,setSignRound]=useState(0);
 const [leaveTo,setLeaveTo]=useState<string|null>(null);
 const leaveRef=useRef<HTMLDivElement>(null);
 const leaving=useRef(false);
 const portfolioFile=useRef<HTMLInputElement>(null);
 const editorTop=useRef<HTMLDivElement>(null);
 const session=useSiteAccount();
 const t=(mn:string,english:string)=>en?english:mn;
 const syncProfile=(p:Profile)=>{setProfile(p);setDraft(toDraft(p))};
 const loadItems=async(id:string)=>{
  const db=await marketplaceClient();
  const res=await db.from('portfolio_items').select('id,title,object_path').eq('seller_id',id).order('created_at',{ascending:false});
  if(res.error)throw res.error;
  const rows=(res.data||[]) as Item[];
  const signed=await Promise.all(rows.map(async item=>{
   const s=await db.storage.from('portfolio').createSignedUrl(item.object_path,600);
   return {...item,url:s.data?.signedUrl};
  }));
  setItems(signed);
 };
 const loadTools=useCallback(async(id:string)=>{
  const db=await marketplaceClient();
  const r=await db.from('seller_tools').select('tool_key').eq('seller_id',id).order('created_at',{ascending:true});
  if(!r.error)setTools(((r.data||[]) as {tool_key:string}[]).map(x=>x.tool_key));
 },[]);
 const loadServices=async(id:string)=>{
  const db=await marketplaceClient();
  const r=await db.from('services').select('id,title,title_en,category,price,status').eq('seller_id',id).order('created_at',{ascending:false});
  if(!r.error)setServices((r.data||[]) as PreviewService[]);
 };
 useEffect(()=>{
  let alive=true;setStatus('loading');
  try{setEn(localStorage.getItem('hustle-language')==='en')}catch{}
  void (async()=>{
   const db=await marketplaceClient();
   const {data:{user},error:authError}=await db.auth.getUser();
   if(authError||!user){if(alive)setStatus('guest');return}
   const res=await db.from('profiles').select('*').eq('id',user.id).maybeSingle();
   if(res.error)throw res.error;
   if(!alive)return;
   const own=res.data as Profile|null;
   setUid(user.id);
   if(!own||!own.is_seller){setStatus('not-seller');return}
   syncProfile(own);
   await Promise.all([loadItems(user.id),loadTools(user.id),loadServices(user.id)]);
   if(alive)setStatus('ready');
  })().catch(()=>{if(alive)setStatus('error')});
  return()=>{alive=false};
 },[loadTools]);
 // Signed URLs for the live preview follow the saved photo paths.
 useEffect(()=>{
  if(!profile)return;
  let alive=true;
  void (async()=>{
   const db=await marketplaceClient();
   const sign=async(path?:string|null)=>{if(!path)return null;try{const s=await db.storage.from('portfolio').createSignedUrl(path,600);return s.data?.signedUrl||null}catch{return null}};
   const [avatar,cover]=await Promise.all([sign(profile.avatar_path),sign(profile.cover_path)]);
   if(alive)setPhotoUrls({avatar,cover});
  })();
  return()=>{alive=false};
 },[profile?.avatar_path,profile?.cover_path,signRound]);
 // V52: private images use 10-minute signed URLs; re-sign them before they expire in long sessions.
 useEffect(()=>{
  if(status!=='ready'||!uid)return;
  const id=window.setInterval(()=>{setSignRound(n=>n+1);void loadItems(uid).catch(()=>{})},8*60*1000);
  return()=>window.clearInterval(id);
 },[status,uid]);
 useEffect(()=>{try{localStorage.setItem('hustle-language',en?'en':'mn');document.documentElement.lang=en?'en':'mn'}catch{}},[en]);
 // Object URL for the project the seller is about to upload.
 useEffect(()=>{
  if(!projectFile){setProjectPreview(null);return}
  const u=URL.createObjectURL(projectFile);setProjectPreview(u);
  return()=>URL.revokeObjectURL(u);
 },[projectFile]);
 const saved=useMemo(()=>profile?toDraft(profile):emptyDraft,[profile]);
 const dirty=status==='ready'&&!sameDraft(draft,saved);
 // Warn before leaving with unsaved text.
 useEffect(()=>{
  if(!dirty)return;
  const warn=(e:BeforeUnloadEvent)=>{if(leaving.current)return;e.preventDefault();e.returnValue=''};
  window.addEventListener('beforeunload',warn);
  return()=>window.removeEventListener('beforeunload',warn);
 },[dirty]);
 // V52: in-app links (header, breadcrumbs) skip beforeunload, so ask before leaving with unsaved text.
 useEffect(()=>{
  if(!dirty)return;
  const onClick=(e:MouseEvent)=>{
   if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
   const a=(e.target as Element|null)?.closest?.('a[href]') as HTMLAnchorElement|null;
   if(!a||a.target==='_blank'||a.hasAttribute('download'))return;
   const url=new URL(a.href,location.href);
   if(url.origin!==location.origin||(url.pathname===location.pathname&&url.search===location.search))return;
   e.preventDefault();e.stopPropagation();setLeaveTo(url.pathname+url.search+url.hash);
  };
  document.addEventListener('click',onClick,true);
  return()=>document.removeEventListener('click',onClick,true);
 },[dirty]);
 const validSlug=isValidSellerSlug(draft.slug);
 // V52: a private draft may be saved without a URL; the URL is required only to go public.
 const slugOk=draft.slug===''?!draft.public_profile:validSlug;
 const publicSlug=profile?.slug&&isValidSellerSlug(profile.slug)?profile.slug:null;
 const isPublic=Boolean(profile?.public_profile&&publicSlug);
 const url=publicSlug?'/p/'+encodeURIComponent(publicSlug)+'/':'';
 const skills=splitSkills(draft.skills);
 const published=services.filter(s=>s.status==='published').length;
 const checks:{id:string;section:Tab;mn:string;en:string;done:boolean}[]=[
  {id:'photo',section:'photos',mn:'Профайл зураг',en:'Profile photo',done:Boolean(profile?.avatar_path)},
  {id:'name',section:'about',mn:'Нэр ба мэргэжил',en:'Name and headline',done:draft.display_name.trim().length>=2&&draft.headline.trim().length>=3},
  {id:'bio',section:'about',mn:'Танилцуулга ('+BIO_MIN+'+ тэмдэгт)',en:'About you ('+BIO_MIN+'+ characters)',done:draft.bio.trim().length>=BIO_MIN},
  {id:'skills',section:'skills',mn:'3+ ур чадвар',en:'3+ skills',done:skills.length>=3},
  {id:'portfolio',section:'projects',mn:'3+ бүтээл',en:'3+ portfolio projects',done:items.length>=3},
  {id:'cover',section:'photos',mn:'Нүүр зураг',en:'Cover photo',done:Boolean(profile?.cover_path)},
  {id:'service',section:'services',mn:'Нийтлэгдсэн үйлчилгээ',en:'A published service',done:published>0},
  {id:'public',section:'publish',mn:'Профайлаа нийтэд нээх',en:'Profile set to public',done:isPublic}
 ];
 const doneCount=checks.filter(c=>c.done).length;
 const percent=Math.round(doneCount/checks.length*100);
 const nextCheck=checks.find(c=>!c.done);
 const sectionDone=(s:Tab)=>checks.filter(c=>c.section===s).every(c=>c.done);
 const nav:[Tab,string,string,typeof UserRound][]=[
  ['about','Танилцуулга','About',UserRound],
  ['photos','Зураг ба нүүр зураг','Photo & cover',FileImage],
  ['skills','Ур чадвар ба програм','Skills & tools',Wrench],
  ['projects','Бүтээлүүд','Portfolio',Layers3],
  ['services','Үйлчилгээ','Services',BriefcaseBusiness],
  ['publish','Хаяг ба нийтлэх','URL & visibility',Globe2]
 ];
 const go=(s:Tab)=>{
  setTab(s);setBuyerView(false);setMobilePane('edit');setError('');setMessage('');setConfirmRemove('');
  requestAnimationFrame(()=>editorTop.current?.scrollIntoView({block:'nearest',behavior:'smooth'}));
 };
 const saveProfile=async(e?:React.FormEvent):Promise<boolean>=>{
  e?.preventDefault();if(busy||!uid)return false;
  setError('');setMessage('');
  if(draft.display_name.trim().length<2){setError(t('Нэрээ дор хаяж 2 тэмдэгтээр бичнэ үү.','Your name needs at least 2 characters.'));go('about');return false}
  if(!slugOk){setError(draft.slug===''?t('Профайлаа нийтэд нээхийн тулд хаягаа сонгоно уу.','Choose your profile URL before making the profile public.'):t('Профайлын хаяг 3-60 тэмдэгт, жижиг латин үсэг, тоо, зураас байна.','Your profile URL must be 3–60 lowercase letters, numbers or dashes.'));go('publish');return false}
  setBusy(true);
  try{
   const db=await marketplaceClient();
   const {data:{user}}=await db.auth.getUser();
   if(user?.id!==uid)throw Error('Account changed');
   const payload={display_name:draft.display_name.trim().slice(0,80),headline:draft.headline.trim().slice(0,150),bio:draft.bio.trim().slice(0,3000),skills:draft.skills.trim().slice(0,400),slug:draft.slug||null,public_profile:draft.public_profile};
   const response=await db.from('profiles').update(payload).eq('id',uid).eq('is_seller',true).select('*').single();
   if(response.error||!response.data)throw response.error||Error('No profile response');
   syncProfile(response.data as Profile);
   setMessage(t('Өөрчлөлт хадгалагдлаа.','Changes saved.'));
   return true;
  }catch{setError(t('Хадгалж чадсангүй. Профайлын хаяг өөр хүнд бүртгэгдсэн эсэхийг шалгаарай.','Unable to save. That profile URL may already be taken.'))}
  finally{setBusy(false)}
  return false;
 };
 const updatePhotos=(path:string|null,kind:'avatar'|'cover',focusY=50)=>{
  setProfile(prev=>prev?{...prev,...(kind==='avatar'?{avatar_path:path}:{cover_path:path,cover_focus_y:focusY})}:prev);
 };
 const addSkill=(raw:string)=>{
  const next=raw.split(',').map(s=>s.trim().slice(0,40)).filter(Boolean);
  if(!next.length)return;
  const merged=[...skills];
  for(const s of next)if(!merged.some(x=>x.toLocaleLowerCase()===s.toLocaleLowerCase()))merged.push(s);
  setDraft(v=>({...v,skills:merged.join(', ').slice(0,400)}));setSkillInput('');
 };
 const removeSkill=(s:string)=>setDraft(v=>({...v,skills:splitSkills(v.skills).filter(x=>x!==s).join(', ')}));
 const pickProject=(file?:File|null)=>{
  setError('');
  if(!file)return;
  if(!fileExt[file.type]||file.size===0||file.size>5*1024*1024){setError(t('5 MB хүртэл JPEG, PNG, WebP зураг сонгоно уу.','Choose a JPEG, PNG or WebP image under 5 MB.'));return}
  setProjectFile(file);
  if(!projectTitle)setProjectTitle(file.name.replace(/\.[^.]+$/,'').replace(/[-_]+/g,' ').slice(0,140));
 };
 const clearProject=()=>{setProjectFile(null);setProjectTitle('');if(portfolioFile.current)portfolioFile.current.value=''};
 const addProject=async(e:React.FormEvent)=>{
  e.preventDefault();if(!projectFile||busy||!uid)return;
  setMessage('');setError('');
  const file=projectFile,title=projectTitle.trim();
  if(!title||title.length>140||!fileExt[file.type]||file.size===0||file.size>5*1024*1024){
   setError(t('Бүтээлийн нэр болон 5 MB хүртэл JPEG, PNG, WebP файлыг шалгана уу.','Provide a title and a JPEG, PNG or WebP file under 5 MB.'));return;
  }
  const b=new Uint8Array(await file.slice(0,12).arrayBuffer());
  const valid=file.type==='image/jpeg'?b[0]===255&&b[1]===216&&b[2]===255:file.type==='image/png'?[137,80,78,71,13,10,26,10].every((v,i)=>b[i]===v):String.fromCharCode(...b.slice(0,4))==='RIFF'&&String.fromCharCode(...b.slice(8,12))==='WEBP';
  if(!valid){setError(t('Зургийн файл буруу форматтай байна.','This file is not a valid image.'));return}
  setBusy(true);
  let path='';
  try{
   const db=await marketplaceClient();
   const {data:{user}}=await db.auth.getUser();
   if(user?.id!==uid)throw Error('Account changed');
   path=uid+'/'+crypto.randomUUID()+'.'+fileExt[file.type];
   const upload=await db.storage.from('portfolio').upload(path,file,{contentType:file.type,upsert:false});
   if(upload.error)throw upload.error;
   const insert=await db.from('portfolio_items').insert({seller_id:uid,title,object_path:path}).select('id,title,object_path').single();
   if(insert.error||!insert.data)throw insert.error||Error('Failed to save project');
   path='';clearProject();
   await loadItems(uid);
   setMessage(t('Бүтээл нэмэгдлээ.','Project added.'));
  }catch{
   if(path){try{await (await marketplaceClient()).storage.from('portfolio').remove([path])}catch{}}
   setError(t('Бүтээл оруулахад алдаа гарлаа.','Could not upload this project.'));
  }finally{setBusy(false)}
 };
 const removeProject=async(item:Item)=>{
  if(busy||!uid)return;
  setBusy(true);setError('');setConfirmRemove('');
  try{
   const db=await marketplaceClient();
   const {data:{user}}=await db.auth.getUser();
   if(user?.id!==uid)throw Error('Account changed');
   const result=await db.from('portfolio_items').delete().eq('id',item.id).eq('seller_id',uid);
   if(result.error)throw result.error;
   setItems(list=>list.filter(x=>x.id!==item.id));
   if(item.object_path.startsWith(uid+'/'))void db.storage.from('portfolio').remove([item.object_path]);
  }catch{setError(t('Бүтээл устгаж чадсангүй.','Could not remove the project.'))}
  finally{setBusy(false)}
 };
 const header=<SiteHeader en={en} onToggleLanguage={()=>setEn(v=>!v)} session={session}/>;
 const shell=(body:React.ReactNode)=><div className="sp-page">{header}{body}</div>;
 if(status==='loading')return shell(<main className="v42-owner-empty" role="status"><LoaderCircle className="spin" size={25}/>{t('Профайл ачаалж байна…','Loading your profile…')}</main>);
 if(status==='guest')return shell(<main className="v42-owner-empty"><h1>{t('Профайл руу нэвтрэх','Sign in to your profile')}</h1><Link href="/login/?mode=seller">{t('Нэвтрэх','Sign in')} →</Link></main>);
 if(status==='not-seller')return shell(<main className="v42-owner-empty"><h1>{t('Мэргэжилтэн профайл шаардлагатай','Freelancer profile required')}</h1><p>{t('Эхлээд Мэргэжилтэн болж профайлаа үүсгээрэй.','Become a freelancer first to create your profile.')}</p><Link href="/join/seller/">{t('Үйлчилгээ үзүүлэх','Become a freelancer')} →</Link></main>);
 if(status==='error'||!profile)return shell(<main className="v42-owner-empty"><h1>{t('Профайл ачаалж чадсангүй','Cannot load profile')}</h1><Link href="/seller-studio/">{t('Мэргэжилтэн самбар руу буцах','Back to the freelancer dashboard')}</Link></main>);
 const statusChip=<span className={'sp-chip '+(isPublic?'is-public':'is-private')}>{isPublic?<Eye size={14} aria-hidden="true"/>:<EyeOff size={14} aria-hidden="true"/>}{isPublic?t('Нийтэд харагдаж байна','Public'):t('Хувийн горим','Private')}</span>;
 const ring=<div className="sp-ring" style={{'--p':percent} as React.CSSProperties} role="img" aria-label={t('Профайл '+percent+'% бүрдсэн','Profile '+percent+'% complete')}><span>{percent}<small>%</small></span></div>;
 return shell(<main className={'sp v42-owner'+(dirty?' has-savebar':'')}>
  <div className="sp-head">
   <Breadcrumbs en={en} items={[{label:t('Нүүр','Home'),href:'/'},{label:t('Мэргэжилтэн самбар','Freelancer dashboard'),href:'/seller-studio/'},{label:t('Миний профайл','My profile')}]}/>
   <div className="sp-title">
    <div><h1>{t('Миний профайл','My profile')}</h1>{statusChip}</div>
    <div className="sp-title-actions">
     {isPublic&&<a className="sp-link" target="_blank" rel="noopener noreferrer" href={url}>{t('Нийтийн хуудсыг нээх','Open public page')}<ArrowUpRight size={15} aria-hidden="true"/></a>}
    </div>
   </div>
  </div>
  <div className="sp-mobile-switch" role="tablist" aria-label={t('Харагдац','View')}>
   <button type="button" role="tab" aria-selected={mobilePane==='edit'} onClick={()=>setMobilePane('edit')}><Pencil size={15} aria-hidden="true"/>{t('Засах','Edit')}</button>
   <button type="button" role="tab" aria-selected={mobilePane==='preview'} onClick={()=>setMobilePane('preview')}><Eye size={15} aria-hidden="true"/>{t('Урьдчилан харах','Preview')}</button>
  </div>
  <div className={'sp-grid'+(buyerView?' is-full':'')+' pane-'+mobilePane}>
   {!buyerView&&<aside className="sp-rail" aria-label={t('Профайлын хэсгүүд','Profile sections')}>
    <div className="sp-progress">
     {ring}
     <div><b>{percent===100?t('Профайл бүрэн боллоо','Your profile is complete'):t('Профайлаа бүрдүүлэх','Complete your profile')}</b>
      <small>{t(doneCount+'/'+checks.length+' алхам','Step '+doneCount+' of '+checks.length)}</small>
      {nextCheck&&<button type="button" className="sp-next" onClick={()=>go(nextCheck.section)}>{t('Дараагийн алхам: ','Next: ')}{en?nextCheck.en:nextCheck.mn}</button>}
     </div>
    </div>
    <nav className="sp-nav">{nav.map(([id,mn,english,Icon])=><button key={id} type="button" className={tab===id?'selected':''} aria-current={tab===id?'step':undefined} onClick={()=>go(id)}>
     <Icon size={17} aria-hidden="true"/><span>{t(mn,english)}</span>{sectionDone(id)?<Check className="sp-done" size={15} aria-label={t('Бүрэн','Done')}/>:<i className="sp-todo" aria-hidden="true"/>}
    </button>)}</nav>
    <details className="sp-checklist">
     <summary>{t('Шалгах жагсаалт','Checklist')}</summary>
     <ul>{checks.map(c=><li key={c.id} className={c.done?'done':''}><button type="button" onClick={()=>go(c.section)}>{c.done?<CheckCircle2 size={15} aria-hidden="true"/>:<i aria-hidden="true"/>}{en?c.en:c.mn}</button></li>)}</ul>
    </details>
   </aside>}
   {!buyerView&&<section className="sp-editor" aria-labelledby="sp-editor-title">
    <div ref={editorTop} className="sp-editor-scroll"/>
    {tab==='about'&&<form className="sp-card v42-edit-fields" onSubmit={e=>{void saveProfile(e)}}>
     <header><h2 id="sp-editor-title">{t('Танилцуулга','About you')}</h2><p>{t('Ямар ажил хийдэг, захиалагчид хэрхэн туслахаа товч, тодорхой бичээрэй.','Buyers should understand who you are and how you help within five seconds.')}</p></header>
     <label>{t('Нэр','Display name')}<input required minLength={2} maxLength={80} value={draft.display_name} onChange={e=>setDraft(v=>({...v,display_name:e.target.value}))} placeholder={t('Жишээ: Б. Анударь','e.g. Anudari B.')}/></label>
     <label>{t('Мэргэжил','Headline')}<input maxLength={150} value={draft.headline} onChange={e=>setDraft(v=>({...v,headline:e.target.value}))} placeholder={t('Жишээ: Брэнд дизайнер · 6 жил туршлагатай','e.g. Brand designer · 6 years of experience')}/><small className="sp-count">{draft.headline.length}/150</small></label>
     <label>{t('Миний тухай','About')}<textarea rows={7} maxLength={3000} value={draft.bio} onChange={e=>setDraft(v=>({...v,bio:e.target.value}))} placeholder={t('Юу хийдэг, хэнтэй ажилладаг, ямар үр дүн гаргадаг вэ?','What you do, who you work with and the results you deliver.')}/>
      <small className={'sp-count'+(draft.bio.trim().length>=BIO_MIN?' ok':'')}>{draft.bio.trim().length<BIO_MIN?t('Дор хаяж '+BIO_MIN+' тэмдэгт · '+draft.bio.trim().length+'/'+BIO_MIN,'At least '+BIO_MIN+' characters · '+draft.bio.trim().length+'/'+BIO_MIN):draft.bio.length+'/3000'}</small></label>
    </form>}
    {tab==='photos'&&<div className="sp-card v42-photo-panel hustle-v5 sp-v5">
     <header><h2 id="sp-editor-title">{t('Зураг ба нүүр зураг','Photo & cover')}</h2><p>{t('Нүүр тань тод харагдах зураг сонгоорой. Нүүр зурагтаа ажлынхаа онцлогийг харуулж болно.','A clear face builds trust. A cover that shows your kind of work helps buyers decide.')}</p></header>
     <div className="sp-subsection"><div className="v42-avatar-panel"><SellerAvatarEditor sellerId={uid} name={profile.display_name} avatarPath={profile.avatar_path} en={en} onChange={path=>updatePhotos(path,'avatar')}/></div></div>
     <div className="sp-subsection"><h3>{t('Нүүр зураг','Cover photo')}</h3><SellerCoverEditor sellerId={uid} coverPath={profile.cover_path} focusY={profile.cover_focus_y} en={en} onChange={(path,y)=>updatePhotos(path,'cover',y)}/></div>
    </div>}
    {tab==='skills'&&<div className="sp-card">
     <header><h2 id="sp-editor-title">{t('Ур чадвар ба програм','Skills & tools')}</h2><p>{t('Ур чадвараа бичээд Enter эсвэл таслал дарж нэмээрэй.','Buyers find you by these words. Press Enter or a comma to add one.')}</p></header>
     <div className="sp-skills">
      <ul>{skills.map(s=><li key={s}>{s}<button type="button" onClick={()=>removeSkill(s)} aria-label={t('Хасах: ','Remove: ')+s}><X size={13}/></button></li>)}</ul>
      <input value={skillInput} maxLength={80} aria-label={t('Ур чадвар нэмэх','Add a skill')} placeholder={skills.length?t('Дахин нэмэх…','Add another…'):t('Жишээ: Брэндинг, Figma, SMM','e.g. Branding, Figma, SMM')}
       onChange={e=>{const v=e.target.value;if(v.includes(','))addSkill(v);else setSkillInput(v)}}
       onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();addSkill(skillInput)}else if(e.key==='Backspace'&&!skillInput&&skills.length)removeSkill(skills[skills.length-1])}}
       onBlur={()=>addSkill(skillInput)}/>
     </div>
     <small className={'sp-count'+(skills.length>=3?' ok':'')}>{t(skills.length+' ур чадвар · хийж чаддаг ажлаа тодорхой бичээрэй','{n} skills · 3 or more helps you show up in search').replace('{n}',String(skills.length))}</small>
     <div className="sp-subsection v42-owner-tools"><h3>{t('Ашигладаг програм','Tools you use')}</h3><div className="hustle-v5 sp-v5 sp-tools"><SellerToolEditor sellerId={uid} en={en} onUpdated={()=>{void loadTools(uid)}}/></div></div>
    </div>}
    {tab==='projects'&&<section className="sp-card v42-project-editor">
     <header><h2 id="sp-editor-title">{t('Бүтээлүүд','Portfolio')}</h2><p>{t('Хамгийн сайн 3–6 ажлаа оруулаарай. Эхний зураг захиалагчид хамгийн түрүүнд харагдана.','Add your best 3–6 pieces. The first one is what buyers see first.')}</p></header>
     <form className="sp-upload" onSubmit={e=>{void addProject(e)}}>
      <label className={'sp-drop'+(dragging?' is-drag':'')+(projectPreview?' has-file':'')}
       onDragOver={e=>{e.preventDefault();setDragging(true)}} onDragLeave={()=>setDragging(false)}
       onDrop={e=>{e.preventDefault();setDragging(false);pickProject(e.dataTransfer.files?.[0])}}>
       <input ref={portfolioFile} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>pickProject(e.target.files?.[0])}/>
       {projectPreview?<img src={projectPreview} alt=""/>:<><UploadCloud size={26} aria-hidden="true"/><b>{t('Зураг чирж оруулах эсвэл сонгох','Drop an image or browse')}</b><small>JPEG, PNG, WebP · 5 MB</small></>}
      </label>
      {projectFile&&<div className="sp-upload-meta">
       <label>{t('Бүтээлийн нэр','Project title')}<input required maxLength={140} value={projectTitle} onChange={e=>setProjectTitle(e.target.value)}/></label>
       <div className="sp-row"><button className="v42-save" disabled={busy||!projectTitle.trim()} type="submit"><Plus size={16} aria-hidden="true"/>{busy?t('Оруулж байна…','Uploading…'):t('Бүтээл нэмэх','Add project')}</button><button type="button" className="sp-ghost-btn" onClick={clearProject}>{t('Болих','Cancel')}</button></div>
      </div>}
     </form>
     <ul className="sp-work">{items.map((item,i)=><li key={item.id}>
      <div className="sp-work-img">{item.url?<img src={item.url} alt=""/>:<FileImage size={22} aria-hidden="true"/>}{i===0&&<span>{t('Нүүр','Cover')}</span>}</div>
      <strong>{item.title}</strong>
      {confirmRemove===item.id?<span className="sp-confirm"><button type="button" className="danger" disabled={busy} onClick={()=>{void removeProject(item)}}>{t('Устгах','Delete')}</button><button type="button" onClick={()=>setConfirmRemove('')}>{t('Болих','Keep')}</button></span>
       :<button type="button" className="sp-icon-btn" disabled={busy} aria-label={t('Устгах: ','Remove: ')+item.title} onClick={()=>setConfirmRemove(item.id)}><Trash2 size={16}/></button>}
     </li>)}</ul>
     {!items.length&&!projectFile&&<p className="sp-empty">{t('Одоогоор бүтээл алга. Эхний ажлаа дээрээс нэмээрэй.','No projects yet. Add your first one above.')}</p>}
    </section>}
    {tab==='services'&&<div className="sp-card">
     <header><h2 id="sp-editor-title">{t('Үйлчилгээ','Services')}</h2><p>{t('Нийтлэгдсэн үйлчилгээ профайл дээр харагдана. Шинэ үйлчилгээ админ хянасны дараа нийтлэгдэнэ.','Published services appear on your profile. New services go live after an admin review.')}</p></header>
     {services.length?<ul className="sp-services">{services.map(s=><li key={s.id}><b>{en&&s.title_en?s.title_en:s.title}</b><span className={'sp-status st-'+s.status}>{s.status==='published'?t('Нийтлэгдсэн','Published'):s.status==='pending'?t('Хянагдаж байна','In review'):s.status==='rejected'?t('Засвар шаардлагатай','Needs changes'):s.status==='draft'?t('Ноорог','Draft'):t('Түр зогссон','Paused')}</span></li>)}</ul>:<p className="sp-empty">{t('Одоогоор үйлчилгээ алга.','No services yet.')}</p>}
     <Link className="v42-save" href="/seller-studio/?tab=seller"><Plus size={16} aria-hidden="true"/>{t('Үйлчилгээ нэмэх, засах','Add or edit services')}</Link>
    </div>}
    {tab==='publish'&&<form className="sp-card v42-edit-fields" onSubmit={e=>{void saveProfile(e)}}>
     <header><h2 id="sp-editor-title">{t('Хаяг ба нийтлэх','URL & visibility')}</h2><p>{t('Профайлын холбоосоо бусадтай хуваалцах, намтартаа оруулахад ашиглаарай.','Pick your address once and share it on social media or your CV.')}</p></header>
     <label>{t('Профайлын хаяг','Profile URL')}<span className="sp-slug"><span>linkup.mn/p/</span><input value={draft.slug} onChange={e=>setDraft(v=>({...v,slug:normalizeSellerSlug(e.target.value)}))} minLength={3} maxLength={60} required={draft.public_profile} pattern="[a-z0-9][a-z0-9-]{2,59}" aria-invalid={!slugOk}/></span>
      <small className={draft.slug===''?'sp-count':validSlug?'sp-count ok':'sp-count bad'}>{draft.slug===''?t('Заавал биш — нийтэд нээхэд л хэрэгтэй','Optional — only needed to go public'):validSlug?t('Зөв хаяг','Looks good'):t('3-60 тэмдэгт: жижиг латин үсэг, тоо, зураас','3–60 characters: lowercase letters, numbers, dashes')}</small></label>
     <label className="sp-switch"><input type="checkbox" role="switch" checked={draft.public_profile} onChange={e=>setDraft(v=>({...v,public_profile:e.target.checked}))}/><span className="sp-switch-ui" aria-hidden="true"/><span><b>{t('Профайлаа нийтэд нээх','Make my profile public')}</b><small>{t('Унтраасан үед зөвхөн та харна.','When off, only you can see it.')}</small></span></label>
    </form>}
    {error&&<p className="v42-error sp-alert" role="alert">{error}</p>}
    {message&&!dirty&&<p className="v42-success sp-alert" role="status"><CheckCircle2 size={16}/>{message}</p>}
   </section>}
   <section className="sp-preview" aria-label={t('Захиалагчийн харах профайл','Buyer-facing profile preview')}>
    <div className="sp-preview-bar">
     <div><span className="v42-live-dot" aria-hidden="true"/><strong>{t('Шууд харагдац','Live preview')}</strong><small>{dirty?t('Хадгалаагүй өөрчлөлт харагдаж байна','Showing unsaved changes'):t('Захиалагчид харагдах загвар','Exactly what buyers see')}</small></div>
     <div className="sp-preview-tools">
      <div className="sp-device" role="group" aria-label={t('Төхөөрөмж','Device')}>
       <button type="button" aria-pressed={device==='desktop'} onClick={()=>setDevice('desktop')} aria-label={t('Компьютер','Desktop')}><Monitor size={15}/></button>
       <button type="button" aria-pressed={device==='mobile'} onClick={()=>setDevice('mobile')} aria-label={t('Утас','Phone')}><Smartphone size={15}/></button>
      </div>
      <button type="button" className="sp-full" aria-pressed={buyerView} onClick={()=>setBuyerView(v=>!v)}>{buyerView?<Minimize2 size={15} aria-hidden="true"/>:<Maximize2 size={15} aria-hidden="true"/>}<span>{buyerView?t('Засах горим','Back to editing'):t('Томоор харах','Expand')}</span></button>
     </div>
    </div>
    <div className="sp-stage">
     <SellerProfilePreview draft={draft} avatarUrl={photoUrls.avatar} coverUrl={photoUrls.cover} coverFocusY={Math.max(0,Math.min(100,Number(profile.cover_focus_y??50)))} items={items} tools={tools} services={services} en={en} device={device} onJump={go}/>
    </div>
   </section>
  </div>
  {dirty&&<div className="sp-savebar" role="region" aria-label={t('Хадгалаагүй өөрчлөлт','Unsaved changes')}>
   <span><i aria-hidden="true"/>{t('Хадгалаагүй өөрчлөлт байна','You have unsaved changes')}</span>
   <div><button type="button" className="sp-ghost-btn" disabled={busy} onClick={()=>{setDraft(saved);setError('')}}><RotateCcw size={15} aria-hidden="true"/>{t('Өөрчлөлтийг буцаах','Discard')}</button>
    <button type="button" className="v42-save" disabled={busy} onClick={()=>{void saveProfile()}}>{busy?<LoaderCircle className="spin" size={16}/>:<Save size={16} aria-hidden="true"/>}{busy?t('Хадгалж байна…','Saving…'):t('Хадгалах','Save changes')}</button></div>
  </div>}
  {leaveTo&&<div className="sp-leave-backdrop" onPointerDown={e=>{if(e.target===e.currentTarget)setLeaveTo(null)}}>
   <div ref={leaveRef} className="sp-leave" role="alertdialog" aria-modal="true" aria-labelledby="sp-leave-title" aria-describedby="sp-leave-text"
    onKeyDown={e=>{if(e.key==='Escape')setLeaveTo(null);trapTab(e,leaveRef.current)}}>
    <h2 id="sp-leave-title">{t('Хадгалаагүй өөрчлөлт байна','You have unsaved changes')}</h2>
    <p id="sp-leave-text">{t('Гарвал хадгалаагүй өөрчлөлтүүд устна.','If you leave now, changes since your last save will be lost.')}</p>
    <div className="sp-leave-actions">
     <button type="button" autoFocus className="v42-save" disabled={busy} onClick={async()=>{const to=leaveTo;if(await saveProfile()&&to){leaving.current=true;window.location.assign(to)}else setLeaveTo(null)}}>{t('Хадгалаад гарах','Save and leave')}</button>
     <button type="button" className="sp-ghost-btn" onClick={()=>{const to=leaveTo;leaving.current=true;setLeaveTo(null);if(to)window.location.assign(to)}}>{t('Хадгалахгүй гарах','Leave without saving')}</button>
     <button type="button" className="sp-ghost-btn" onClick={()=>setLeaveTo(null)}>{t('Энд үлдэх','Stay')}</button>
    </div>
   </div>
  </div>}
 </main>);
}
