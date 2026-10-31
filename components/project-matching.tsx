'use client';
import {friendlyError} from '../lib/marketplace/friendly-errors';
import {projectStatusLabel} from '../lib/marketplace/ui-labels';
import {tierLabel} from './service-packages';
import {useEffect,useMemo,useRef,useState,type FormEvent} from 'react';
import Link from 'next/link';
import {ArrowLeft,ArrowRight,BriefcaseBusiness,CheckCircle2,Clock3,FileText,LoaderCircle,RefreshCw,Send,ShieldCheck,Sparkles,UserRound,Users,XCircle} from 'lucide-react';
import {marketplaceClient} from '../lib/marketplace/client';
import {categoryLabel,CATEGORIES,normalizeCategory} from '../lib/marketplace/taxonomy';
import {projectDraftKey,proposalDraftKey,signInWithReturn} from '../lib/marketplace/ux-flows';
import {classifyNeed,type Audience} from '../lib/marketplace/solution-finder';
import type {Profile,Listing} from '../lib/marketplace/types';
import SiteHeader,{useSiteAccount} from './site-header';
import {ensureBuyerProfile} from '../lib/marketplace/buyer-profile';
import '../app/project-matching.css';

type RequestRow={id:string;buyer_id:string;title:string;brief:string;audience:Audience;category:string;budget_max:number|null;preferred_days:number|null;status:'open'|'awarded'|'cancelled';order_id:string|null;created_at:string};
type Invite={id:string;request_id:string;seller_id:string;status:string};
type Inbox={id:string;request_id:string;title:string;brief:string;category:string;audience:Audience;budget_max:number|null;preferred_days:number|null;created_at:string;invite_status:string};
type Proposal={id:string;request_id:string;seller_id:string;service_id:string;tier:string;quoted_price:number;delivery_days:number;message:string;status:string;created_at:string};
type Package={service_id:string;tier:string;price:number;delivery_days:number};
type SendResult={id:string;invited:number;status:string};
type ProjectNotice={id:string;recipient_id:string;request_id:string;kind:'invitation'|'proposal'|'awarded'|'cancelled';source_id:string;created_at:string;read_at:string|null};
// V50: the professional taxonomy (bilingual labels).
const categoryOptions=CATEGORIES.map(c=>[c.id,c.mn,c.en] as const);
const outcomeCategory:Record<string,string>={automation:'ai',growth:'marketing',content:'video',website:'web',brand:'design',analytics:'web',general:'ai'};
const currency=(value:number)=>new Intl.NumberFormat('mn-MN').format(value)+' ₮';

export default function ProjectMatching({mode}:{mode:'buyer'|'seller'}){
 const [en,setEn]=useState(false),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false);
 const siteSession=useSiteAccount();
 const [user,setUser]=useState(''),[profile,setProfile]=useState<Profile|null>(null),[allowed,setAllowed]=useState(false);
 const [error,setError]=useState(''),[notice,setNotice]=useState('');
 const [requests,setRequests]=useState<RequestRow[]>([]),[invites,setInvites]=useState<Invite[]>([]),[inbox,setInbox]=useState<Inbox[]>([]);
 const [proposals,setProposals]=useState<Proposal[]>([]),[services,setServices]=useState<Listing[]>([]),[packages,setPackages]=useState<Package[]>([]);
 const [people,setPeople]=useState<Profile[]>([]);
 const [title,setTitle]=useState(''),[brief,setBrief]=useState(''),[audience,setAudience]=useState<Audience>('business'),[category,setCategory]=useState('ai'),[budget,setBudget]=useState(''),[days,setDays]=useState('');
 const [targetInvite,setTargetInvite]=useState<Inbox|null>(null),[serviceId,setServiceId]=useState(''),[tier,setTier]=useState('Basic'),[message,setMessage]=useState('');
 const [sent,setSent]=useState<SendResult|null>(null);
 const [notifications,setNotifications]=useState<ProjectNotice[]>([]),[notificationsReady,setNotificationsReady]=useState(true);
 const [statusFilter,setStatusFilter]=useState('all'),[offerSort,setOfferSort]=useState('newest');
 const [draftReadyFor,setDraftReadyFor]=useState(''),[signInHref,setSignInHref]=useState('/login/?mode=buyer');
 const draftOwner=useRef('');
 // V52: a notification link (?request=) scrolls to and highlights that request.
 const [focusRequest,setFocusRequest]=useState('');
 useEffect(()=>{const id=new URLSearchParams(location.search).get('request');if(id&&/^[0-9a-f-]{36}$/i.test(id))setFocusRequest(id)},[]);
 useEffect(()=>{if(!focusRequest||loading)return;const tm=window.setTimeout(()=>document.getElementById('request-'+focusRequest)?.scrollIntoView({behavior:'smooth',block:'start'}),200);return()=>window.clearTimeout(tm)},[focusRequest,loading]);
 const t=(mn:string,eng:string)=>en?eng:mn;
 const reportError=(err:unknown)=>friendlyError(err,en);
 const refresh=async()=>{
  const db=await marketplaceClient();
  const {data:{user:current},error:authError}=await db.auth.getUser();
  if(authError||!current){setUser('');setAllowed(false);setLoading(false);return}
  setUser(current.id);
  const [beta,pr]=await Promise.all([
   db.from('beta_allowlist').select('role').eq('email',(current.email||'').toLowerCase()).eq('enabled',true).maybeSingle(),
   db.from('profiles').select('*').eq('id',current.id).maybeSingle()
  ]);
  if(beta.error)throw beta.error;if(pr.error)throw pr.error;
  const approved=Boolean(beta.data);setAllowed(approved);
  let own=pr.data as Profile|null;
  // V52: a buyer posting a project gets the same minimal private profile as an order would.
  if(approved&&!own&&mode==='buyer'){const made=await ensureBuyerProfile(db,current);if(made){const again=await db.from('profiles').select('*').eq('id',current.id).maybeSingle();own=(again.data as Profile|null)||({...made,headline:'',bio:'',slug:null,public_profile:false} as unknown as Profile)}}
  setProfile(own);
  if(!approved){setLoading(false);return}
  const notify=await db.from('project_notifications').select('id,recipient_id,request_id,kind,source_id,created_at,read_at').eq('recipient_id',current.id).order('created_at',{ascending:false}).limit(60);
  if(notify.error){if(['42P01','PGRST205','PGRST116'].includes(notify.error.code||'')){setNotificationsReady(false);setNotifications([])}else throw notify.error}
  else{setNotificationsReady(true);setNotifications(notify.data as ProjectNotice[])}
  if(mode==='buyer'){
   const [r,i,p,peopleQuery]=await Promise.all([
    db.from('project_requests').select('*').order('created_at',{ascending:false}).limit(100),
    db.from('project_invitations').select('id,request_id,seller_id,status'),
    db.from('project_proposals').select('*').order('created_at',{ascending:false}),
    db.from('profiles').select('id,display_name,headline,bio,is_seller,slug,public_profile')
   ]);
   for(const x of [r,i,p,peopleQuery])if(x.error)throw x.error;
   setRequests(r.data as RequestRow[]);setInvites(i.data as Invite[]);setProposals(p.data as Proposal[]);
   setPeople(peopleQuery.data as Profile[]);
  }else{
   const [i,s,p,pro,peopleQuery]=await Promise.all([
    db.rpc('seller_project_inbox'),
    db.from('services').select('*').eq('seller_id',current.id).eq('status','published'),
    db.from('service_packages').select('service_id,tier,price,delivery_days'),
    db.from('project_proposals').select('*').eq('seller_id',current.id),
    db.from('profiles').select('id,display_name,headline,bio,is_seller,slug,public_profile')
   ]);
   for(const x of [i,s,p,pro,peopleQuery])if(x.error)throw x.error;
   setInbox(i.data as Inbox[]);setServices(s.data as Listing[]);setPackages(p.data as Package[]);
   setProposals(pro.data as Proposal[]);setPeople(peopleQuery.data as Profile[]);
  }
  setLoading(false);
 };
 useEffect(()=>{
  try{setEn(localStorage.getItem('hustle-language')==='en');const a=localStorage.getItem('hustle-buyer-audience');if(a==='personal')setAudience('personal')}catch{}
  const q=new URLSearchParams(window.location.search);
  setSignInHref(signInWithReturn(location.pathname+location.search,mode));
  const prompt=(q.get('q')||'').slice(0,2000);
  if(prompt){setBrief(prompt);setTitle(prompt.slice(0,100));setCategory(outcomeCategory[classifyNeed(prompt).key]||'ai')}
  const askedCategory=normalizeCategory(q.get('category'));if(askedCategory!=='all')setCategory(askedCategory);
  const suggested=q.get('audience');if(suggested==='personal'||suggested==='business')setAudience(suggested);
  const budgetValue=Number((q.get('budget')||'').replace(/[^0-9]/g,''));if(budgetValue>=1000&&budgetValue<=100000000)setBudget(String(budgetValue));
  void refresh().catch(err=>{setError(reportError(err));setLoading(false)});
  const focus=()=>{void refresh().catch(()=>{})};
  window.addEventListener('focus',focus);
  return()=>window.removeEventListener('focus',focus);
 },[mode]);
 // Tab-scoped drafts are keyed to the signed-in account; drafts never go to the server.
 useEffect(()=>{
  if(mode!=='buyer'||!user){setDraftReadyFor('');return}
  if(draftOwner.current===user)return;
  // Never carry the previous signed-in account's unsaved form into a new account.
  if(draftOwner.current&&draftOwner.current!==user){setTitle('');setBrief('');setBudget('');setDays('');setAudience('business');setCategory('ai')}
  draftOwner.current=user;setDraftReadyFor('');
  try{
   const stored=sessionStorage.getItem(projectDraftKey(user));
   if(stored&&!new URLSearchParams(location.search).has('q')){
    const saved=JSON.parse(stored) as {title?:string;brief?:string;category?:string;audience?:Audience;budget?:string;days?:string};
    if(typeof saved.title==='string')setTitle(saved.title.slice(0,120));
    if(typeof saved.brief==='string')setBrief(saved.brief.slice(0,2000));
    if(normalizeCategory(saved.category)!=='all')setCategory(normalizeCategory(saved.category));
    if(saved.audience==='business'||saved.audience==='personal')setAudience(saved.audience);
    if(typeof saved.budget==='string'&&/^(|[0-9]{1,9})$/.test(saved.budget))setBudget(saved.budget);
    if(typeof saved.days==='string'&&/^(|[0-9]{1,3})$/.test(saved.days))setDays(saved.days);
   }
  }catch{}
  setDraftReadyFor(user);
 },[mode,user]);
 useEffect(()=>{
  if(mode!=='buyer'||!user||draftReadyFor!==user)return;
  try{
   const key=projectDraftKey(user);
   if(title.trim()||brief.trim()||budget||days)sessionStorage.setItem(key,JSON.stringify({title,brief,audience,category,budget,days}));
   else sessionStorage.removeItem(key);
  }catch{}
 },[mode,user,draftReadyFor,title,brief,audience,category,budget,days]);
 useEffect(()=>{
  if(mode!=='seller'||!user||!targetInvite)return;
  try{
   const key=proposalDraftKey(user,targetInvite.id);
   if(message.trim())sessionStorage.setItem(key,JSON.stringify({serviceId,tier,message}));
   else sessionStorage.removeItem(key);
  }catch{}
 },[mode,user,targetInvite?.id,serviceId,tier,message]);
 const clearRequestDraft=()=>{
  try{if(user)sessionStorage.removeItem(projectDraftKey(user))}catch{}
  setTitle('');setBrief('');setBudget('');setDays('');
 };
 const action=async(work:()=>Promise<void>,success:string)=>{
  if(busy)return;setBusy(true);setError('');setNotice('');
  try{await work();setNotice(success);await refresh()}
  catch(err){setError(reportError(err))}finally{setBusy(false)}
 };
 const submitRequest=(event:FormEvent)=>{
  event.preventDefault();
  void action(async()=>{
   const db=await marketplaceClient();
   const result=await db.rpc('create_project_request',{p_title:title.trim(),p_brief:brief.trim(),p_category:category,
    p_audience:audience,p_budget_max:budget?Number(budget):null,p_preferred_days:days?Number(days):null});
   if(result.error)throw result.error;
   setSent(result.data as SendResult);try{if(user)sessionStorage.removeItem(projectDraftKey(user))}catch{}setTitle('');setBrief('');setBudget('');setDays('');
  },t('Төслийн хүсэлт үүслээ.','Your project request was sent.'));
 };
 const openProposal=(invitation:Inbox,existing?:Proposal)=>{
  setTargetInvite(invitation);
  const first=services.find(s=>s.category===invitation.category);
  let saved:{serviceId?:string;tier?:string;message?:string}|null=null;
  try{if(user){const stored=sessionStorage.getItem(proposalDraftKey(user,invitation.id));if(stored)saved=JSON.parse(stored)}}catch{}
  const candidate=saved?.serviceId||existing?.service_id;
  const chosen=services.find(s=>s.id===candidate&&s.category===invitation.category);
  const nextService=chosen?.id||first?.id||'';
  const chosenTier=saved?.tier||existing?.tier||'Basic';
  const nextTier=packages.some(p=>p.service_id===nextService&&p.tier===chosenTier)?chosenTier:'Basic';
  setServiceId(nextService);setTier(nextTier);setMessage(typeof saved?.message==='string'?saved.message.slice(0,1500):existing?.message||'');
 };
 const selectedService=services.find(s=>s.id===serviceId);
 const selectedPackage=packages.find(p=>p.service_id===serviceId&&p.tier===tier);
 const submitProposal=(event:FormEvent)=>{
  event.preventDefault();if(!targetInvite)return;
  void action(async()=>{
   const db=await marketplaceClient();
   const r=await db.rpc('submit_project_proposal',{p_invitation_id:targetInvite.id,p_service_id:serviceId,p_tier:tier,p_message:message.trim()});
   if(r.error)throw r.error;
   try{if(user)sessionStorage.removeItem(proposalDraftKey(user,targetInvite.id))}catch{}
   setTargetInvite(null);
  },t('Таны саналыг захиалагчид илгээлээ.','Your proposal was sent to the buyer.'));
 };
 const withdrawProposal=(proposal:Proposal)=>{
  if(proposal.status!=='pending')return;
  if(!window.confirm(t('Энэ үнийн саналыг буцаан татах уу?','Withdraw this proposal?')))return;
  void action(async()=>{const db=await marketplaceClient();const r=await db.rpc('withdraw_project_proposal',{p_proposal_id:proposal.id});if(r.error)throw r.error},t('Үнийн саналыг буцаан татлаа.','Proposal withdrawn.'));
 };
 const updateAvailability=()=>{
  if(!profile)return;
  void action(async()=>{
   const db=await marketplaceClient();
   const r=await db.from('profiles').update({accepting_projects:!(profile as Profile&{accepting_projects?:boolean}).accepting_projects}).eq('id',profile.id);
   if(r.error)throw r.error;
  },t('Шинэ төсөл авах тохиргоо шинэчлэгдлээ.','Availability updated.'));
 };
 const canAccept=(profile as Profile&{accepting_projects?:boolean}|null)?.accepting_projects===true;
 const unreadCount=notifications.filter(n=>!n.read_at).length;
 const notificationLabel=(kind:ProjectNotice['kind'])=>({invitation:t('Шинэ төслийн урилга','New project invitation'),proposal:t('Шинэ үнийн санал','New proposal'),awarded:t('Таны санал сонгогдлоо','Your proposal was selected'),cancelled:t('Төслийн хүсэлт цуцлагдсан','Project request cancelled')})[kind];
 const markNotice=async(id:string)=>{if(busy||!user)return;setBusy(true);setError('');try{const db=await marketplaceClient();const result=await db.from('project_notifications').update({read_at:new Date().toISOString()}).eq('id',id).eq('recipient_id',user).is('read_at',null);if(result.error)throw result.error;setNotifications(items=>items.map(n=>n.id===id?{...n,read_at:new Date().toISOString()}:n))}catch(err){setError(reportError(err))}finally{setBusy(false)}};
 const visibleRequests=requests.filter(r=>statusFilter==='all'||r.status===statusFilter);
 const sortedOffers=(offers:Proposal[])=>[...offers].sort((a,b)=>offerSort==='price'?a.quoted_price-b.quoted_price:offerSort==='delivery'?a.delivery_days-b.delivery_days:b.created_at.localeCompare(a.created_at));
 return <><SiteHeader en={en} onToggleLanguage={()=>{const next=!en;setEn(next);try{localStorage.setItem('hustle-language',next?'en':'mn')}catch{}}} active="solutions" session={siteSession}/><main className="project-marketplace">
  <div className="project-layout">
   <header className="project-header"><div><Link href={mode==='seller'?'/seller-studio/':'/buyer/'} className="project-back"><ArrowLeft size={16}/>{t('Самбар руу буцах','Back to dashboard')}</Link>
     <span className="project-eyebrow"><Sparkles size={14}/> {t('LINKUP · Төслийн хүсэлт','LINKUP / PROJECT MATCHING · BETA')}</span>
     <h1>{mode==='seller'?t('Шинэ төслийн саналууд','Project opportunities'):t('Хэрэгцээгээ бичээд мэргэжилтнээ олоорой.','Describe it. Find the right freelancer.')}</h1>
     <p>{mode==='seller'?t('Таны мэргэжил, нийтлэгдсэн үйлчилгээтэй тохирох төслүүдийг эндээс хүлээн авна.','Receive projects that match your published services and availability.'):t('Мэргэжилтнийг өөрөө сонгох эсвэл асуудлаа илгээж тохирох мэргэжилтнүүдээс санал авах хоёр боломжтой.','Browse and hire directly, or send your challenge to matching specialists for proposals.')}</p>
    </div><Link href="/explore/" className="project-outline"><BriefcaseBusiness size={17}/>{t('Үйлчилгээ үзэх','Browse services')}</Link>
   </header>
   {error&&<div className="project-alert" role="alert"><span>{error}</span><button type="button" onClick={()=>setError('')} aria-label={t('Алдааны мэдэгдэл хаах','Dismiss error')}><XCircle size={17}/></button></div>}
   {notice&&<div className="project-ok" role="status"><CheckCircle2 size={18}/><span>{notice}</span><button type="button" onClick={()=>setNotice('')} aria-label={t('Мэдэгдэл хаах','Dismiss message')}><XCircle size={17}/></button></div>}
   {loading?<p className="project-placeholder"><LoaderCircle size={19}/>{t('Мэдээлэл ачаалж байна…','Loading…')}</p>:
   !user?<div className="project-panel"><h2>{t('Нэвтрэх шаардлагатай','Please sign in')}</h2><p>{t('Хүсэлт илгээх эсвэл санал өгөхийн тулд имэйлээ баталгаажуулсан бүртгэлээрээ нэвтэрнэ үү.','Sign in with your email-verified account to post or respond to projects.')}</p><Link className="project-primary" href={signInHref}>{t('Нэвтрэх','Sign in')}<ArrowRight size={16}/></Link></div>:
   !allowed?<div className="project-panel"><h2>{t('Бүртгэлийн хандалт идэвхгүй','Account access unavailable')}</h2><p>{t('Имэйлээ баталгаажуулсан ч нэвтрэх боломжгүй байвал бүртгэлийн хязгаарлалтыг админаас лавлана уу.','If your verified account still cannot access projects, contact an administrator about possible restrictions.')}</p></div>:
   !profile?<div className="project-panel"><h2>{t('Эхлээд профайл үүсгэнэ үү','Create your profile first')}</h2><p>{t('Төслийн хүсэлт болон саналууд баталгаатай бүртгэлтай холбогдоно.','Project requests and proposals require a completed profile.')}</p><Link className="project-primary" href={mode==='seller'?'/seller-studio/':'/buyer/'}>{t('Профайл үүсгэх','Open profile')}</Link></div>:
   <>
    <section className="project-panel project-notifications" aria-label={t('Төслийн мэдэгдлүүд','Project notifications')}>
     <div className="project-inbox-heading"><div><span className="project-step">{t('Төслийн мэдэгдэл','PROJECT / NOTIFICATIONS')}</span><h2>{t('Мэдэгдлүүд','Notifications')}{unreadCount>0&&<span className="project-notification-count">{unreadCount}</span>}</h2></div></div>
     {!notificationsReady?<p className="project-muted">{t('Төслийн хүсэлт түр ачаалагдсангүй. Хэсэг хугацааны дараа дахин оролдоно уу.','Project requests are not available right now. Please try again later.')}</p>:
      notifications.length===0?<p className="project-muted">{t('Одоогоор мэдэгдэл алга.','No notifications yet.')}</p>:
      <div className="project-notification-list">{notifications.map(n=><div className={'project-notification '+(!n.read_at?'unread':'')} key={n.id}><div><strong>{notificationLabel(n.kind)}</strong><small>{new Date(n.created_at).toLocaleString(en?'en-US':'mn-MN')}</small></div>{!n.read_at&&<button type="button" disabled={busy} onClick={()=>void markNotice(n.id)}>{t('Уншсан','Mark read')}</button>}</div>)}</div>}
    </section>
    {mode==='buyer'?<>
    <div className="project-buyer-grid">
     <section className="project-panel project-request-form">
      <div className="project-step"><FileText size={18}/> {t('01 / ТӨСЛИЙН ХҮСЭЛТ','01 / YOUR CHALLENGE')}</div>
      <h2>{t('Ямар асуудал шийдэх хэрэгтэй вэ?','What problem are you solving?')}</h2>
      <p>{t('Таны хүсэлтийг тохирох, шинэ төсөл авах тохиргоогоо идэвхжүүлсэн 5 хүртэлх мэргэжилтэнд илгээнэ.','On your confirmation, your request goes to up to five matching opt-in freelancers.')}</p>
      <form onSubmit={submitRequest} className="project-form">
        {draftReadyFor===user&&Boolean(title.trim()||brief.trim()||budget||days)&&<div className="project-draft-status" role="status"><span>{t('Ноорог энэ хөтчийн табд түр хадгалагдана.','Draft saved in this tab.')}</span><button type="button" disabled={busy} onClick={clearRequestDraft}>{t('Арилгах','Clear draft')}</button></div>}
       <label>{t('Төслийн нэр','Project title')}<input value={title} onChange={e=>setTitle(e.target.value)} minLength={8} maxLength={120} required placeholder={t('Жишээ: Facebook захиалгын автоматжуулалт','e.g., Facebook order automation')}/></label>
       <label>{t('Тайлбар / хийх ажил','Describe the challenge')}<textarea value={brief} onChange={e=>setBrief(e.target.value)} rows={5} minLength={20} maxLength={2000} required placeholder={t('Одоогийн асуудал, хүсэж буй үр дүнгээ бичнэ үү…','Describe the current problem and desired outcome…')}/></label>
       <div className="project-field-row"><label>{t('Чиглэл','Category')}<select value={category} onChange={e=>setCategory(e.target.value)}>{categoryOptions.map(([value,mn,english])=><option key={value} value={value}>{en?english:mn}</option>)}</select></label><label>{t('Хэрэглээ','Project context')}<select value={audience} onChange={e=>setAudience(e.target.value as Audience)}><option value="business">{t('Бизнес','Business')}</option><option value="personal">{t('Хувь хүн','Personal')}</option></select></label></div>
       <div className="project-field-row"><label>{t('Төсвийн дээд хэмжээ (₮, заавал биш)','Maximum budget (MNT, optional)')}<input type="number" min={1000} max={100000000} value={budget} onChange={e=>setBudget(e.target.value)} placeholder={t('Тохиролцоно','Negotiable')}/></label><label>{t('Хүсэж буй хугацаа (хоног)','Preferred days (optional)')}<input type="number" min={1} max={365} value={days} onChange={e=>setDays(e.target.value)}/></label></div>
       <p className="project-consent"><ShieldCheck size={17}/>{t('Илгээснээр та төслийн дэлгэрэнгүйг тохирох 5 хүртэлх мэргэжилтэнд харуулахыг зөвшөөрнө. Зөвхөн шинэ төсөл авах тохиргоогоо идэвхжүүлсэн мэргэжилтнүүдэд очно. Төлбөр авахгүй.','By sending, you agree to show this brief to up to five eligible opt-in sellers. No payment is taken.')}</p>
       <button className="project-primary" disabled={busy} type="submit"><Send size={17}/>{busy?t('Илгээж байна…','Sending…'):t('Төслийн хүсэлт илгээх','Send project request')}</button>
      </form>
     </section>
     <aside className="project-how"><div className="project-panel"><span className="project-step">{t('Тохирох мэргэжилтэн олох','LINKUP / SMART MATCHING')}</span><h3>{t('Хэрхэн ажиллах вэ?','How it works')}</h3><p>01 — {t('Та асуудлаа тайлбарлана.','Describe your challenge.')}</p><p>02 — {t('Хүсэлт тохирох мэргэжилтнүүдэд очно.','Eligible sellers receive the request.')}</p><p>03 — {t('Мэргэжилтнүүд үнэ, хугацаагаа санал болгоно.','Compare packages and proposals.')}</p><p>04 — {t('Та зөвшөөрвөл захиалга үүснэ.','Choose one to create an order.')}</p></div>
      <div className="project-panel"><h3>{t('Өөрөө сонгохыг хүсвэл','Prefer to choose yourself?')}</h3><p>{t('Мэргэжилтний бүтээлүүд, үнэ, үйлчилгээний багцуудыг шууд харьцуулж болно.','Compare portfolios, packages and prices directly.')}</p><Link href="/explore/" className="project-outline">{t('Мэргэжилтэн хайх','Explore freelancers')}<ArrowRight size={16}/></Link></div>
     </aside>
    </div>
    {sent&&<div className="project-ok" role="status"><CheckCircle2 size={20}/><span>{sent.invited>0?t('Хүсэлт '+sent.invited+' мэргэжилтэнд хүрлээ.','Request sent to '+sent.invited+' freelancers.'):t('Хүсэлт хадгалагдлаа. Одоогоор тохирох, төсөл авахыг зөвшөөрсөн мэргэжилтэн байхгүй.','Request saved, but no opted-in matching sellers are currently available.')}</span></div>}
    <section className="project-panel project-list"><div className="project-inbox-heading"><h2>{t('Миний төслийн хүсэлтүүд','My project requests')}</h2><div className="project-filters"><label>{t('Төлөв','Status')} <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}><option value="all">{t('Бүгд','All')}</option><option value="open">{t('Нээлттэй','Open')}</option><option value="awarded">{t('Захиалга үүссэн','Awarded')}</option><option value="cancelled">{t('Цуцлагдсан','Cancelled')}</option></select></label><label>{t('Саналыг эрэмбэлэх','Sort proposals')} <select value={offerSort} onChange={e=>setOfferSort(e.target.value)}><option value="newest">{t('Шинэ нь эхэнд','Newest')}</option><option value="price">{t('Үнэ: багаас их рүү','Lowest price')}</option><option value="delivery">{t('Хугацаа: богиноос урт руу','Fastest delivery')}</option></select></label></div></div>
     {visibleRequests.length===0?<p className="project-muted">{t('Одоогоор хүсэлт алга.','No requests yet.')}</p>:visibleRequests.map(req=>{
      const offers=proposals.filter(p=>p.request_id===req.id);
      const sentCount=invites.filter(i=>i.request_id===req.id).length;
      return <article className={'project-item'+(focusRequest===req.id?' is-focus':'')} key={req.id} id={'request-'+req.id}>
       <div className="project-item-heading"><div><span className="project-chip">{categoryLabel(req.category,en)} · {req.audience==='business'?t('Бизнес','business'):t('Хувь хүн','personal')}</span><h3>{req.title}</h3></div><span className="project-chip">{projectStatusLabel(req.status,en)}</span></div>
       <p>{req.brief}</p><small>{t('Хүргэсэн','Invited')}: {sentCount} · {t('Ирсэн санал','Proposals')}: {offers.length}</small>
       {sortedOffers(offers).map(offer=>{
        const freelancer=people.find(p=>p.id===offer.seller_id);
        return <div key={offer.id} className="project-offer"><div><strong>{freelancer?.display_name||t('Мэргэжилтэн','Freelancer')}</strong><p>{offer.message}</p><small>{tierLabel(offer.tier,en)} · {currency(offer.quoted_price)} · {offer.delivery_days} {t('хоног','days')}</small>{freelancer?.public_profile&&freelancer.slug&&offer.status==='pending'&&<Link className="project-outline project-proposal-chat" href={'/buyer/?seller='+encodeURIComponent(freelancer.slug)+'&mode=buyer'}><UserRound size={14}/>{t('Саналын талаар чатлах','Discuss proposal in chat')}</Link>}</div>{req.status==='open'&&offer.status==='pending'?<button disabled={busy} onClick={()=>void action(async()=>{const db=await marketplaceClient();const response=await db.rpc('award_project_proposal',{p_proposal_id:offer.id});if(response.error)throw response.error},t('Саналыг зөвшөөрлөө. Захиалга үүслээ.','Proposal accepted; an order was created.'))}>{t('Сонгож захиалах','Accept & order')}</button>:<span className="project-chip">{projectStatusLabel(offer.status,en)}</span>}</div>;
       })}
       {req.order_id&&<Link className="project-outline" href="/buyer/">{t('Захиалгаа харах','View your order')}<ArrowRight size={15}/></Link>}
       {req.status==='open'&&<button className="project-quiet" disabled={busy} onClick={()=>{if(!window.confirm(t('Энэ хүсэлтийг цуцлах уу?','Cancel this project request?')))return;void action(async()=>{const db=await marketplaceClient();const r=await db.rpc('cancel_project_request',{p_request_id:req.id});if(r.error)throw r.error},t('Хүсэлт цуцлагдлаа.','Project request cancelled.'))}}><XCircle size={15}/>{t('Хүсэлт цуцлах','Cancel request')}</button>}
      </article>;
     })}
    </section>
   </>:<>
    <section className="project-panel project-seller-control"><div><span className="project-step"><Users size={17}/> {t('Шинэ төсөл авах тохиргоо','SELLER / AVAILABILITY')}</span><h2>{t('Төсөл авах боломжтой юу?','Accept new project invitations?')}</h2><p>{t('Таны нийтлэгдсэн үйлчилгээний ангилалд тохирох төслүүд ирнэ. Энэ тохиргоог хүссэн үедээ унтрааж болно.','Invitations match your published services. You can opt out anytime.')}</p></div>
     <button className={'project-toggle '+(canAccept?'enabled':'')} type="button" aria-pressed={canAccept} disabled={busy||!profile.is_seller} onClick={updateAvailability}>{canAccept?t('Төсөл авч байна','Accepting projects'):t('Төсөл авахыг идэвхжүүлэх','Enable invitations')}</button>
    </section>
    {!profile.is_seller&&<div className="project-alert">{t('Эхлээд мэргэжилтний профайлаа идэвхжүүлнэ үү.','Enable your seller profile first.')}</div>}
    <section className="project-panel project-list"><div className="project-inbox-heading"><div><span className="project-step">{t('Ирсэн төслүүд','SELLER / INBOX')}</span><h2>{t('Надад тохирсон төслүүд','Matching project requests')}</h2></div><button type="button" className="project-outline" disabled={busy} onClick={()=>void refresh().catch(err=>setError(reportError(err)))}><RefreshCw size={16}/>{t('Шинэчлэх','Refresh')}</button></div>
     {inbox.length===0?<div className="project-empty"><p>{t('Одоогоор төслийн хүсэлт алга. Нийтлэгдсэн үйлчилгээтэй, төсөл авах горим асаалттай үед тохирох хүсэлт ирнэ.','No invitations yet. Publish your services and enable availability to receive matching requests.')}</p><Link className="project-outline" href="/seller-studio/">{t('Үйлчилгээ удирдах','Manage services')}<ArrowRight size={16}/></Link></div>:
     inbox.map(inv=>{
      const offered=proposals.find(p=>p.request_id===inv.request_id);
      return <article key={inv.id} id={'request-'+inv.request_id} className={'project-item'+(focusRequest===inv.request_id?' is-focus':'')}><div className="project-item-heading"><div><span className="project-chip">{categoryLabel(inv.category,en)} · {inv.audience==='business'?t('Бизнес','business'):t('Хувь хүн','personal')}</span><h3>{inv.title}</h3></div><span className="project-chip">{projectStatusLabel(inv.invite_status,en)}</span></div>
       <p>{inv.brief}</p><small>{inv.budget_max?currency(inv.budget_max):t('Төсөв тохиролцоно','Budget negotiable')} · {inv.preferred_days?inv.preferred_days+' '+t('хоног','days'):t('Хугацаа тохиролцоно','Timeline negotiable')}</small>
       {inv.invite_status==='declined'?<p className="project-muted">{t('Та урилгаас татгалзсан.','You declined this invitation.')}</p>:offered?.status==='pending'?<div className="project-proposal-management"><p className="project-ok"><CheckCircle2 size={16}/>{t('Санал илгээгдсэн','Proposal submitted')} — {currency(offered.quoted_price)}</p><div className="project-actions"><button type="button" disabled={busy} onClick={()=>openProposal(inv,offered)}>{t('Санал засах','Edit proposal')}</button><button type="button" className="project-quiet" disabled={busy} onClick={()=>withdrawProposal(offered)}><XCircle size={15}/>{t('Саналаа буцаан татах','Withdraw')}</button></div></div>:offered?.status==='withdrawn'?<div className="project-proposal-management"><p className="project-muted">{t('Энэ саналаа татсан. Хүсэлт нээлттэй байгаа үед дахин санал өгч болно.','Proposal withdrawn. You may submit again while the project is open.')}</p><button type="button" className="project-outline" disabled={busy} onClick={()=>openProposal(inv,offered)}>{t('Дахин санал илгээх','Send again')}</button></div>:offered?<p className="project-ok">{t('Саналын төлөв','Proposal status')}: {projectStatusLabel(offered.status,en)}</p>:<div className="project-actions"><button disabled={busy} type="button" onClick={()=>openProposal(inv)}>{t('Санал илгээх','Send a proposal')}</button><button className="project-quiet" disabled={busy} onClick={()=>void action(async()=>{const db=await marketplaceClient();const r=await db.rpc('decline_project_invitation',{p_invitation_id:inv.id});if(r.error)throw r.error},t('Хүсэлтээс татгалзлаа.','Invitation declined.'))}>{t('Татгалзах','Decline')}</button></div>}
      </article>;
     })}
    </section>
    {targetInvite&&<section className="project-panel project-proposal"><div className="project-inbox-heading"><h2>{t('Үнийн санал илгээх','Send a proposal')}</h2><button type="button" onClick={()=>setTargetInvite(null)} className="project-quiet"><XCircle size={18}/>{t('Хаах','Close')}</button></div><p>{targetInvite.title}</p>
     <form className="project-form" onSubmit={submitProposal}>{Boolean(message.trim())&&<p className="project-draft-status">{t('Саналын ноорог энэ хөтчийн табд түр хадгалагдана.','Proposal draft saved in this tab.')}</p>}
      <label>{t('Өөрийн нийтлэгдсэн үйлчилгээ','Your published service')}<select value={serviceId} required onChange={e=>{setServiceId(e.target.value);setTier('Basic')}}>
       <option value="">{t('Үйлчилгээ сонгох','Select a service')}</option>{services.filter(s=>s.category===targetInvite.category).map(service=><option key={service.id} value={service.id}>{service.title}</option>)}</select></label>
      <label>{t('Багц','Package')}<select value={tier} onChange={e=>setTier(e.target.value)}>{['Basic','Standard','Premium'].filter(k=>packages.some(pkg=>pkg.service_id===serviceId&&pkg.tier===k)).map(k=><option key={k} value={k}>{tierLabel(k,en)}</option>)}</select></label>
      {selectedService&&selectedPackage&&<div className="project-package-preview"><strong>{currency(selectedPackage.price)}</strong><span>{selectedPackage.delivery_days} {t('хоног','days')} · {tierLabel(tier,en)}</span></div>}
      <label>{t('Хийх ажил, хүлээлгэн өгөх зүйлс','Scope and deliverables')}<textarea required minLength={20} maxLength={1500} rows={4} value={message} onChange={e=>setMessage(e.target.value)} placeholder={t('Юу хийх, хэрхэн хүлээлгэн өгөхийг тодорхой бичээрэй…','Explain what you will deliver and how…')}/></label>
      <p className="project-consent">{t('Үнэ, хугацаа нь таны сонгосон нийтлэгдсэн багцын нөхцөлөөр баталгаажна. Төлбөр авахгүй.','The price and timeline are verified from your published package on the server. No payment is processed.')}</p>
      <button disabled={busy||!selectedPackage} className="project-primary" type="submit"><Send size={17}/>{t('Санал илгээх','Submit proposal')}</button>
     </form>
    </section>}
   </>}
   </>}
  </div>
 </main></>;
}
