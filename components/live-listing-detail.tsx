'use client';
import {tierLabel} from './service-packages';
import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {Check,CheckCircle2,Clock,LoaderCircle,MessageCircle,RefreshCw,Send,ShieldCheck,X} from 'lucide-react';
import {marketplaceClient} from '../lib/marketplace/client';
import type {LiveService} from '../lib/marketplace/live-discovery';
import {sellerContactHref} from '../lib/marketplace/contact-routing';
import {signInWithReturn} from '../lib/marketplace/ux-flows';
import {ensureBuyerProfile} from '../lib/marketplace/buyer-profile';
import {trapTab} from '../lib/marketplace/focus-trap';
import {friendlyError} from '../lib/marketplace/friendly-errors';
import {categoryLabel,legacyCategory,normalizeCategory,serviceTypeById,subcategoryLabel} from '../lib/marketplace/taxonomy';
import SiteHeader,{Breadcrumbs,useSiteAccount} from './site-header';
import '../app/live-listing.css';
import '../app/v39-service-detail.css';
import '../app/v50-order-flow.css';

const money=(n:number)=>new Intl.NumberFormat('mn-MN').format(n)+' ₮';
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const BRIEF_MIN=20;
type Tier='Basic'|'Standard'|'Premium';
const isTier=(x:unknown):x is Tier=>x==='Basic'||x==='Standard'||x==='Premium';
type DrawerState='closed'|'form'|'sending'|'sent';

export default function LiveListingDetail(){
 const [listing,setListing]=useState<LiveService|null>(null);
 const [status,setStatus]=useState<'loading'|'ready'|'missing'|'error'>('loading');
 const [tier,setTier]=useState<Tier>('Basic');
 const [en,setEn]=useState(false);
 const [signedIn,setSignedIn]=useState(false);
 const [drawer,setDrawer]=useState<DrawerState>('closed');
 const [brief,setBrief]=useState('');
 const [orderError,setOrderError]=useState<{text:string;href?:string;link?:string}|null>(null);
 const [orderId,setOrderId]=useState('');
 const [reopen,setReopen]=useState(false);
 const [sentKind,setSentKind]=useState<'order'|'quote'>('order');
 const briefRef=useRef<HTMLTextAreaElement>(null);
 const opener=useRef<HTMLButtonElement>(null);
 const drawerRef=useRef<HTMLElement>(null);
 const session=useSiteAccount();
 const t=(mn:string,english:string)=>en?english:mn;
 useEffect(()=>{
  let active=true;let unsubscribe=()=>{};
  void marketplaceClient().then(async db=>{
   if(!active)return;
   const {data:{subscription}}=db.auth.onAuthStateChange((_event,session)=>{if(active)setSignedIn(Boolean(session?.user))});
   unsubscribe=()=>subscription.unsubscribe();
   const {data:{user},error}=await db.auth.getUser();
   if(active)setSignedIn(!error&&Boolean(user));
  }).catch(()=>{});
  return()=>{active=false;unsubscribe()};
 },[]);
 useEffect(()=>{
   let active=true;
   try{setEn(localStorage.getItem('hustle-language')==='en')}catch{}
   const params=new URLSearchParams(location.search);
   const id=params.get('id')||'';
   const asked=params.get('tier');
   // A guest who pressed "Send order" comes back here after sign-in with ?order=1.
   setReopen(params.get('order')==='1');
   if(!uuid.test(id)){setStatus('missing');return()=>{active=false};}
   void marketplaceClient().then(db=>db.rpc('marketplace_catalog')).then(result=>{
     if(!active)return;
     if(result.error)throw result.error;
     const match=(Array.isArray(result.data)?result.data as LiveService[]:[]).find(s=>s.id===id);
     setListing(match||null);setStatus(match?'ready':'missing');
     const priced=(match?.packages||[]).filter(p=>p.price>0);
     const first=priced.find(p=>p.tier==='Basic')?.tier||priced[0]?.tier;
     const preferred=isTier(asked)&&priced.some(p=>p.tier===asked)?asked:first;
     if(isTier(preferred))setTier(preferred);
   }).catch(()=>{if(active)setStatus('error')});
   return()=>{active=false};
 },[]);
 useEffect(()=>{try{localStorage.setItem('hustle-language',en?'en':'mn');document.documentElement.lang=en?'en':'mn'}catch{}},[en]);
 // Re-open the drawer once the returning buyer's session is confirmed.
 useEffect(()=>{
  if(!reopen||status!=='ready'||!signedIn)return;
  setReopen(false);setDrawer('form');
  const u=new URL(window.location.href);u.searchParams.delete('order');
  window.history.replaceState(window.history.state,'',u.pathname+u.search);
 },[reopen,status,signedIn]);
 // Dialog behaviour: focus the brief, close on Escape, keep the page from scrolling.
 useEffect(()=>{
  if(drawer==='closed')return;
  const prev=document.body.style.overflow;document.body.style.overflow='hidden';
  // V52: Tab and Shift+Tab stay inside the drawer while it is open.
  const esc=(e:KeyboardEvent)=>{if(e.key==='Escape')closeDrawer();else trapTab(e,drawerRef.current)};
  document.addEventListener('keydown',esc);
  if(drawer==='form')requestAnimationFrame(()=>briefRef.current?.focus());
  else if(drawer!=='sending')requestAnimationFrame(()=>{const d=drawerRef.current;if(d&&!d.contains(document.activeElement))d.querySelector<HTMLElement>('.v50-drawer-body a[href],.v50-drawer-body button,.v50-drawer-close')?.focus()});
  return()=>{document.body.style.overflow=prev;document.removeEventListener('keydown',esc)};
 },[drawer]);
 const options=(listing?.packages||[]).filter(p=>p.price>0);
 const chosen=options.find(p=>p.tier===tier)||options[0];
 const price=chosen?.price??listing?.price??0;
 const valid=Boolean(listing&&uuid.test(listing.id)&&price>0);
 const avatarSrc=listing?.avatar_path&&/^[a-f0-9-]{36}\/[a-f0-9-]{36}\.(jpg|png|webp)$/.test(listing.avatar_path)?'/api/portfolio-image?path='+encodeURIComponent(listing.avatar_path):null;
 const returnPath=listing?'/listing/?id='+encodeURIComponent(listing.id)+'&tier='+encodeURIComponent(chosen?.tier||'Basic')+'&order=1':'/explore/';
 const guestOrderHref=signInWithReturn(returnPath,'buyer');
 const contactBase=listing?.slug?sellerContactHref(listing.slug,signedIn):'/explore/';
 const contactHref=listing&&contactBase.includes('seller=')?contactBase+'&ctx='+encodeURIComponent(listing.id):contactBase;
 function closeDrawer(){
  setDrawer(d=>d==='sending'?d:'closed');
  setOrderError(null);
  requestAnimationFrame(()=>opener.current?.focus());
 }
 // V52: how the service is sold decides the call to action. Custom projects ask for a quote in chat;
 // hourly, monthly and mentoring keep packages but show their unit.
 const kind=listing?serviceTypeById(listing.service_type):null;
 const isQuote=kind?.id==='custom';
 const unit=kind&&kind.id!=='fixed'&&kind.id!=='custom'?(en?kind.priceEn:kind.priceMn):'';
 async function sendOrder(e:React.FormEvent){
  e.preventDefault();
  if(!listing||!chosen||drawer==='sending')return;
  const text=brief.trim();
  if(text.length<BRIEF_MIN){setOrderError({text:t('Ажлаа дор хаяж '+BRIEF_MIN+' тэмдэгтээр тайлбарлана уу.','Describe the work in at least '+BRIEF_MIN+' characters.')});briefRef.current?.focus();return}
  setOrderError(null);setDrawer('sending');
  try{
   const db=await marketplaceClient();
   const {data:{user}}=await db.auth.getUser();
   if(!user){setOrderError({text:t('Нэвтрэлтийн хугацаа дууссан байна. Дахин нэвтэрсний дараа энэ хуудас руу буцна.','Your session has expired. After signing in again you will return here.'),href:guestOrderHref,link:t('Нэвтрэх','Sign in')});setDrawer('form');return}
   const [svc,own]=await Promise.all([
    db.from('services').select('id,seller_id,title,status').eq('id',listing.id),
    db.from('profiles').select('id').eq('id',user.id)
   ]);
   if(svc.error)throw svc.error;
   const service=((svc.data||[]) as {id:string;seller_id:string;title:string;status:string}[]).find(s=>s.id===listing.id);
   if(!service||service.status!=='published'){setOrderError({text:t('Энэ үйлчилгээ одоогоор захиалга авахгүй байна.','This service is not taking orders right now.')});setDrawer('form');return}
   if(service.seller_id===user.id){setOrderError({text:t('Энэ таны өөрийн үйлчилгээ тул захиалах боломжгүй.','This is your own service, so you cannot order it.')});setDrawer('form');return}
   // V52: a first-time buyer gets a minimal private profile instead of a profile form.
   if(!((own.data||[]) as {id:string}[]).some(p=>p.id===user.id)&&!(await ensureBuyerProfile(db,user))){setOrderError({text:t('Таны бүртгэлийг бэлдэж чадсангүй. Дахин оролдоно уу.','We could not prepare your account. Please try again.')});setDrawer('form');return}
   if(isQuote){
    const m=await db.from('messages').insert({sender_id:user.id,recipient_id:service.seller_id,body:t('Үнийн санал хүсье','Quote request')+': '+service.title+'\n\n'+text});
    if(m.error)throw m.error;
    setSentKind('quote');setBrief('');setDrawer('sent');return;
   }
   const r=await db.from('orders').insert({service_id:service.id,buyer_id:user.id,seller_id:service.seller_id,service_title:service.title,quoted_price:chosen.price,package_name:chosen.tier,brief:text}).select('id').single();
   if(r.error)throw r.error;
   setSentKind('order');setOrderId(String((r.data as {id?:string}|null)?.id||''));
   setBrief('');setDrawer('sent');
  }catch(err){
   setOrderError({text:friendlyError(err,en)});setDrawer('form');
  }
 }
 const catId=listing?(legacyCategory(listing.category)?.category||listing.category):'';
 const subId=listing?(listing.subcategory||legacyCategory(listing.category)?.subcategory||''):'';
 const subLabel=listing?subcategoryLabel(catId,subId,en):'';
 const title=listing?(en&&listing.title_en?listing.title_en:listing.title):'';
 const crumbs=[{label:t('Нүүр','Home'),href:'/'},
  ...(listing&&normalizeCategory(catId)!=='all'?[{label:categoryLabel(catId,en),href:'/explore/?category='+catId}]:[{label:t('Үйлчилгээ','Services'),href:'/explore/'}]),
  ...(listing&&subLabel?[{label:subLabel,href:'/explore/?category='+catId+'&sub='+encodeURIComponent(subId)}]:[]),
  {label:title||t('Үйлчилгээ','Service')}];
 return <div className="v50-listing-page">
 <SiteHeader en={en} onToggleLanguage={()=>setEn(v=>!v)} active="services" session={session}/>
 <main className="v28-detail-page v39-detail-page">
  {status==='loading'&&<section className="v28-detail-shell" role="status">{t('Үйлчилгээ ачаалж байна…','Loading service…')}</section>}
  {status==='error'&&<section className="v28-detail-shell" role="alert">{t('Үйлчилгээ ачаалж чадсангүй.','Unable to load service.')} <button type="button" className="v50-retry" onClick={()=>window.location.reload()}><RefreshCw size={14}/>{t('Дахин оролдох','Retry')}</button></section>}
  {status==='missing'&&<section className="v28-detail-shell"><h1>{t('Үйлчилгээ олдсонгүй','Service not found')}</h1><p>{t('Энэ зар нийтлэгдээгүй эсвэл устгагдсан байж болно.','This listing may be unpublished or removed.')}</p><Link href="/explore/">{t('Үйлчилгээ хайх','Browse listings')}</Link></section>}
  {status==='ready'&&listing&&<>
   <div className="v28-detail-shell v50-crumbs-row"><Breadcrumbs en={en} items={crumbs}/></div>
   <div className="v28-detail-shell v28-detail-grid">
    <article><div className={'v39-detail-cover v39-detail-cover-'+catId}><span aria-hidden="true">linkup.</span></div><div className="v28-detail-kicker">{categoryLabel(catId,en)}{subLabel?' · '+subLabel:''}</div>
      <h1>{title}</h1>
      <div className="v28-detail-seller"><span className="v39-detail-avatar" aria-hidden="true">{avatarSrc?<img src={avatarSrc} alt="" width={52} height={52}/>: (listing.display_name.trim().charAt(0)||'H').toLocaleUpperCase()}</span><strong>{listing.display_name}</strong>{listing.headline&&<span>{listing.headline}</span>}</div>
      {Number(listing.review_count)>0&&Number.isFinite(Number(listing.average_rating))&&Number(listing.average_rating)>0&&<p className="v39-detail-reviews">★ {Number(listing.average_rating).toFixed(1)} · {listing.review_count} {t('баталгаажсан үнэлгээ','verified reviews')}</p>}
      <h2 className="v39-detail-about-heading">{t('Үйлчилгээний тухай','About this service')}</h2><p className="v28-detail-description">{listing.description}</p>
      {listing.tags&&listing.tags.length>0&&<ul className="v50-detail-tags">{listing.tags.map(x=><li key={x}>{x}</li>)}</ul>}
      <a className="v50-profile-link" href={'/p/'+encodeURIComponent(listing.slug)+'/'}>{t('Мэргэжилтний профайл үзэх','View the freelancer’s profile')} ↗</a>
    </article>
    <aside className="v28-detail-offer"><p>{isQuote?t('Жишиг багцууд — эцсийн үнийг тохиролцоно','Example packages — the final price is agreed with you'):t('Багцаа сонгоно уу','Choose a package')}</p>
      {options.length>0&&<div className="v28-detail-tiers">{(['Basic','Standard','Premium'] as const).map(option=><button key={option} type="button" aria-pressed={tier===option} disabled={!options.some(p=>p.tier===option)} onClick={()=>setTier(option)}>{tierLabel(option,en)}</button>)}</div>}
      <div className="v28-detail-price">{isQuote&&<small className="v50-price-from">{t('Эхлэх үнэ','From')}</small>}{money(price)}{unit&&<small className="v50-price-unit">{unit}</small>}</div>
      <div className="v28-detail-spec"><span>{chosen?.delivery_days??listing.delivery_days} {t('хоног','days')}</span><span>{chosen?.revisions??listing.revisions} {t('засвар','revisions')}</span></div>
      {chosen?.summary&&<p>{chosen.summary}</p>}
      {chosen?.includes?.length>0&&<ul>{chosen.includes.map((item,i)=><li key={i}>✓ {item}</li>)}</ul>}
      {valid&&(signedIn
       ?<button ref={opener} type="button" className="v28-detail-primary" onClick={()=>{setOrderError(null);setDrawer('form')}}><Send size={16} aria-hidden="true"/>{isQuote?t('Үнийн санал хүсэх','Request a quote'):t('Захиалга илгээх','Send an order')}</button>
       :<Link className="v28-detail-primary" href={guestOrderHref}><Send size={16} aria-hidden="true"/>{isQuote?t('Үнийн санал хүсэх','Request a quote'):t('Захиалга илгээх','Send an order')}</Link>)}
      {listing.slug&&<Link className="v28-detail-secondary" href={contactHref}><MessageCircle size={16} aria-hidden="true"/>{t('Мессеж бичих','Message')}</Link>}
      <p className="v50-offer-note"><ShieldCheck size={15} aria-hidden="true"/>{t('Туршилтын хувилбар: мэргэжилтэн таны хүсэлтийг хянана. Төлбөр Linkup-аар дамжихгүй.','Beta: an order is a request. No payment goes through Linkup.')}</p>
    </aside>
   </div>
  </>}
 </main>
 {drawer!=='closed'&&listing&&chosen&&<div className="v50-drawer-root">
  <button type="button" className="v50-drawer-backdrop" aria-label={t('Хаах','Close')} tabIndex={-1} onClick={closeDrawer}/>
  <section ref={drawerRef} className="v50-drawer" role="dialog" aria-modal="true" aria-labelledby="v50-drawer-title">
   <header className="v50-drawer-head">
    <h2 id="v50-drawer-title">{drawer==='sent'?(sentKind==='quote'?t('Хүсэлт илгээгдлээ','Request sent'):t('Захиалга илгээгдлээ','Order sent')):isQuote?t('Үнийн санал хүсэх','Request a quote'):t('Захиалга илгээх','Send an order')}</h2>
    <button type="button" className="v50-drawer-close" onClick={closeDrawer} aria-label={t('Хаах','Close')} disabled={drawer==='sending'}><X size={20}/></button>
   </header>
   {drawer==='sent'&&sentKind==='quote'?<div className="v50-drawer-body v50-sent" role="status">
     <span className="v50-sent-icon" aria-hidden="true"><CheckCircle2 size={34}/></span>
     <p className="v50-sent-lead">{t('Үнийн санал хүссэн мессежийг илгээлээ. Хүлээн авагч: '+listing.display_name+'.','Your quote request reached '+listing.display_name+'.')}</p>
     <ol className="v50-next"><li><MessageCircle size={15} aria-hidden="true"/>{t('Мэргэжилтэн чатаар асууж, үнийн санал илгээнэ.','The freelancer will reply in chat with questions and a price.')}</li><li><Clock size={15} aria-hidden="true"/>{t('Үнээ тохиролцсоны дараа ажил эхэлнэ. Төлбөр Linkup-аар дамжихгүй.','Work starts once you agree on the price. No payment goes through Linkup.')}</li></ol>
     <div className="v50-drawer-actions"><Link className="v50-btn primary" href={contactHref}>{t('Чат руу очих','Open the chat')}</Link><button type="button" className="v50-btn" onClick={closeDrawer}>{t('Үйлчилгээ рүү буцах','Back to the service')}</button></div>
    </div>
   :drawer==='sent'?<div className="v50-drawer-body v50-sent" role="status">
     <span className="v50-sent-icon" aria-hidden="true"><CheckCircle2 size={34}/></span>
     <p className="v50-sent-lead">{t('Хүсэлтийг илгээлээ. Хүлээн авагч: '+listing.display_name+'.','Your request has reached '+listing.display_name+'.')}</p>
     <dl className="v50-summary"><div><dt>{t('Үйлчилгээ','Service')}</dt><dd>{title}</dd></div><div><dt>{t('Мэргэжилтэн','Freelancer')}</dt><dd>{listing.display_name}</dd></div><div><dt>{t('Төлөв','Status')}</dt><dd>{t('Шинэ хүсэлт — мэргэжилтний хариуг хүлээж байна','Requested — waiting for the freelancer')}</dd></div><div><dt>{t('Багц','Package')}</dt><dd>{tierLabel(chosen.tier,en)} · {money(chosen.price)}{unit?' '+unit:''}</dd></div><div><dt>{t('Хугацаа','Delivery')}</dt><dd>{chosen.delivery_days} {t('хоног','days')}</dd></div>{orderId&&<div><dt>{t('Дугаар','Reference')}</dt><dd>#{orderId.slice(0,8)}</dd></div>}</dl>
     <ol className="v50-next"><li><Clock size={15} aria-hidden="true"/>{t('Мэргэжилтэн хүсэлтийг зөвшөөрсний дараа ажил эхэлнэ.','Work starts once the freelancer accepts.')}</li><li><MessageCircle size={15} aria-hidden="true"/>{t('Нарийн мэдээллээ чатаар тохиролцоорой.','Agree on the details in chat.')}</li></ol>
     <div className="v50-drawer-actions"><Link className="v50-btn primary" href={'/buyer/?tab=orders'+(orderId?'&order='+encodeURIComponent(orderId):'')}>{t('Захиалгаа харах','View my order')}</Link><Link className="v50-btn" href={contactHref}>{t('Мессеж бичих','Message')}</Link></div>
    </div>
   :<form className="v50-drawer-body" onSubmit={e=>{void sendOrder(e)}} noValidate>
     <div className="v50-order-service"><b>{title}</b><span>{listing.display_name}</span></div>
     {!isQuote&&<fieldset className="v50-tier-pick"><legend>{t('Багц','Package')}</legend>
      {options.map(p=><label key={p.tier} className={tier===p.tier?'selected':''}><input type="radio" name="tier" value={p.tier} checked={tier===p.tier} onChange={()=>isTier(p.tier)&&setTier(p.tier)}/>
       <span><b>{tierLabel(p.tier,en)}</b><small>{p.delivery_days} {t('хоног','days')} · {p.revisions} {t('засвар','revisions')}</small></span><em>{money(p.price)}{unit&&<small className="v50-unit"> {unit}</small>}</em>{tier===p.tier&&<Check size={16} aria-hidden="true"/>}</label>)}
     </fieldset>}
     <label className="v50-brief">{isQuote?t('Төслөө тайлбарлана уу','Describe your project'):t('Юу хийлгэх вэ?','What do you need?')}
      <textarea ref={briefRef} name="brief" rows={6} maxLength={3000} value={brief} onChange={e=>setBrief(e.target.value)} aria-invalid={Boolean(orderError)&&brief.trim().length<BRIEF_MIN} aria-describedby="v50-brief-hint"
       placeholder={t('Жишээ: Кофе шопдоо лого, брэндийн өнгө, үсгийн хэв хийлгэмээр байна. Өмнөх материал байхгүй. Хоёр долоо хоногийн дотор хэрэгтэй.','e.g. We need a logo, colours and fonts for our coffee shop. No existing brand assets. Needed within two weeks.')}/>
      <small id="v50-brief-hint" className={brief.trim().length>=BRIEF_MIN?'ok':''}>{brief.trim().length<BRIEF_MIN?t('Дор хаяж '+BRIEF_MIN+' тэмдэгт · ','At least '+BRIEF_MIN+' characters · ')+brief.trim().length+'/'+BRIEF_MIN:t('Зорилго, хугацаа, жишээ материалаа нэмж бичвэл ажлыг тань ойлгоход тустай.','Good — goals, deadline and examples help even more.')}</small>
     </label>
     {orderError&&<p className="v50-order-error" role="alert">{orderError.text}{orderError.href&&<> <Link href={orderError.href}>{orderError.link}</Link></>}</p>}
     <div className="v50-drawer-foot">
      <div className="v50-total"><span>{isQuote?t('Жишиг эхлэх үнэ','Example starting price'):t('Нийт','Total')}</span><b>{money(chosen.price)}{unit&&<small className="v50-unit"> {unit}</small>}</b><small>{t('Туршилтын хувилбар · төлбөр авахгүй','No payment taken — beta')}</small></div>
      <button type="submit" className="v50-btn primary" disabled={drawer==='sending'}>{drawer==='sending'?<LoaderCircle className="spin" size={16}/>:<Send size={16} aria-hidden="true"/>}{drawer==='sending'?t('Илгээж байна…','Sending…'):isQuote?t('Хүсэлт илгээх','Send request'):t('Захиалга илгээх','Send order')}</button>
     </div>
    </form>}
  </section>
 </div>}
 </div>;
}
