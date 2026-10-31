'use client';
import {useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import {ArrowRight,ArrowUpRight,Check,Clock3,Heart,Layers3,MessageCircle,Search,ShieldCheck,Star,X} from 'lucide-react';
import {marketplaceClient} from '../lib/marketplace/client';
import {filterLiveServices,liveServicePrice,type LiveService,type LiveSort} from '../lib/marketplace/live-discovery';
import {isValidSellerSlug} from '../lib/marketplace/seller-slug';
import {sellerContactHref} from '../lib/marketplace/contact-routing';
import ServiceComparison,{compareSelection,compareLimit} from './service-comparison';
import '../app/live-catalog.css';
import '../app/v39-creative-cards.css';
import '../app/v41-home-card-readability.css';
import '../app/v50-categories.css';
import {categoryLabel,legacyCategory,serviceTypeById,subcategoryLabel} from '../lib/marketplace/taxonomy';

// The marketplace_catalog RPC is the sole source: published services from real sellers only.
const START_COUNT=12;
const HOME_COUNT=6;
const money=(n:number)=>new Intl.NumberFormat('mn-MN').format(n)+' ₮';
export function contactSellerHref(slug:string,signedIn=false):string {
 return sellerContactHref(slug,signedIn);
}
export function visibleServices<T>(items:T[],homePreview:boolean,count=START_COUNT):T[]{
 return items.slice(0,homePreview?HOME_COUNT:Math.max(START_COUNT,count));
}
// V50: names come from the shared taxonomy (pre-V50 ids still resolve).
const coverClass=(category:string)=>legacyCategory(category)?.category||category;
type Props={en:boolean;signedIn?:boolean;query?:string;category?:string;subcategory?:string;sort?:LiveSort;onlySaved?:boolean;saved?:string[];
 onSave?:(id:string)=>void;canSave?:boolean;saveBusy?:string[];saveError?:string;onSignInSave?:(id?:string)=>void;homePreview?:boolean;
 /** V52: guest | checking | loading | ready | error — a signed-in person is never sent to login while their list loads. */
 saveState?:'checking'|'guest'|'loading'|'ready'|'error';onRetrySave?:()=>void};
export default function LiveCatalog({en,signedIn=false,query='',category='all',subcategory='',sort='featured',onlySaved=false,saved=[],onSave,canSave=false,saveBusy=[],saveError='',onSignInSave,homePreview=false,saveState,onRetrySave}:Props){
 const heartState=saveState||(canSave?'ready':'guest');
 const [services,setServices]=useState<LiveService[]>([]);
 const [state,setState]=useState<'loading'|'ready'|'error'>('loading');
 const [compared,setCompared]=useState<string[]>([]);
 const [showCompare,setShowCompare]=useState(false);
 const [visibleCount,setVisibleCount]=useState(START_COUNT);
 const t=(mn:string,english:string)=>en?english:mn;
 useEffect(()=>{
  let alive=true;
  void marketplaceClient().then(db=>db.rpc('marketplace_catalog')).then(result=>{
   if(!alive)return;
   if(result.error)throw result.error;
   setServices(Array.isArray(result.data)?result.data as LiveService[]:[]);
   setState('ready');
  }).catch(()=>{if(alive)setState('error')});
  return()=>{alive=false};
 },[]);
 useEffect(()=>{setVisibleCount(START_COUNT)},[query,category,subcategory,sort,onlySaved]);
 const filtered=useMemo(()=>filterLiveServices(services,{query,category,subcategory,sort,onlySaved,saved}),[services,query,category,subcategory,sort,onlySaved,saved]);
 const visible=visibleServices(filtered,homePreview,visibleCount);
 const compareReady=compared.length>=2;
 const toggleCompare=(id:string)=>setCompared(current=>compareSelection(current,id));
 return <section className={'shell live-catalog v39-catalog '+(homePreview?'v39-catalog-home':'v39-catalog-explore')} aria-labelledby={homePreview?'real-listings-title':undefined} aria-label={homePreview?undefined:t('Нийтлэгдсэн үйлчилгээ','Published services')}>
  {homePreview&&<div className="v39-section-head">
   <div><span className="v39-section-eyebrow"><span/>{homePreview?(en?'Services':'Үйлчилгээ'):(en?'Explore':'Бүх үйлчилгээ')}</span>
    <h2 id="real-listings-title">{homePreview?t('Төслөө хэрэгжүүлэх хүнээ олоорой.','Meet your next collaborator.'):t('Өөрт тохирох мэргэжилтнээ олоорой.','Find your kind of talent.')}</h2>
    <p>{homePreview?t('Үйлчилгээ, эхлэх үнийг нэг дороос.','Real services. Clear starting prices.'):t('Үйлчилгээ, үнэ, хугацааг харьцуулж, тохирох мэргэжилтэнтэй холбогдоорой.','Discover services, compare starting prices and connect with professionals.')}</p>
   </div>
   <Link className="v39-head-link" href="/explore/">{t('Бүгдийг үзэх','View all')} <ArrowUpRight size={16}/></Link>
  </div>}
  {state==='loading'&&<div className="v39-skeleton-grid" role="status" aria-label={t('Үйлчилгээ ачаалж байна','Loading services')}>{[0,1,2].map(i=><div className="v39-card-skeleton" key={i} aria-hidden="true"/>)}</div>}
  {state==='error'&&<div className="v39-empty" role="alert"><Search size={23}/><h3>{t('Үйлчилгээг ачаалж чадсангүй','Services could not be loaded')}</h3><p>{t('Холболтоо шалгаад хуудсаа шинэчлээрэй.','Check your connection and refresh this page.')}</p></div>}
  {state==='ready'&&filtered.length===0&&<div className="v39-empty"><Layers3 size={24}/>
   <h3>{services.length===0?t('Одоогоор нийтлэгдсэн үйлчилгээ алга','No published services yet'):onlySaved?t('Хадгалсан үйлчилгээ олдсонгүй','No saved services found'):t('Тохирох үйлчилгээ олдсонгүй','No services match your search')}</h3>
   <p>{services.length===0?t('Мэргэжилтнүүд үйлчилгээгээ нийтлэхэд энд харагдана.','Published freelancer services will appear here.'):t('Ангилал эсвэл хайлтаа өөрчлөөд үзээрэй.','Try another category or a different search.')}</p>
   {/* V52: no dead ends — offer the next useful step, never invented results. */}
   <div className="v52-empty-actions">
    {(query||category!=='all'||subcategory||onlySaved)&&<Link href="/explore/" className="v39-empty-link">{t('Шүүлтүүр арилгах','Clear filters')}</Link>}
    <Link href="/categories/" className="v39-empty-link">{t('Бүх ангилал','Browse all categories')} <ArrowUpRight size={16}/></Link>
    <Link href={'/solutions/'+(query?'?q='+encodeURIComponent(query):'')} className="v39-empty-link">{t('Асуудлаа тайлбарлах','Describe your problem')} <ArrowUpRight size={16}/></Link>
    <Link href={'/project-requests/'+(query?'?q='+encodeURIComponent(query):'')} className="v39-empty-link">{t('Төслийн хүсэлт илгээх','Post a project request')} <ArrowUpRight size={16}/></Link>
   </div>
  </div>}
  {state==='ready'&&filtered.length>0&&<>
   <div className="v39-results-bar">
    <span>{homePreview?t('ОНЦЛОХ ҮЙЛЧИЛГЭЭ','FEATURED SERVICES'):t('НИЙТЛЭГДСЭН ҮЙЛЧИЛГЭЭ','PUBLISHED SERVICES')}</span>
    <span>{homePreview?visible.length+' / '+filtered.length:filtered.length} {t('үйлчилгээ','services')}</span>
   </div>
   <div className="v39-card-grid">{visible.map(s=>{
    const reviewCount=Number(s.review_count)||0;
    const rating=Number(s.average_rating);
    const hasRating=reviewCount>0&&Number.isFinite(rating)&&rating>=1&&rating<=5;
    const minPrice=liveServicePrice(s);
    const packages=s.packages||[];
    const least=packages.filter(p=>p.price>0).sort((a,b)=>a.price-b.price)[0];
    const delivery=least?.delivery_days??s.delivery_days;
    const savedThis=saved.includes(s.id);
    const selected=compared.includes(s.id);
    const detailHref='/listing/?id='+encodeURIComponent(s.id);
    const title=en&&s.title_en?s.title_en:s.title;
    const categoryName=subcategoryLabel(s.category,s.subcategory,en)||categoryLabel(s.category,en);const priceSuffix=s.service_type&&s.service_type!=='fixed'?' '+(en?serviceTypeById(s.service_type).priceEn:serviceTypeById(s.service_type).priceMn):'';
    const avatar=(s.display_name.trim().charAt(0)||'H').toLocaleUpperCase();
    const avatarSrc=typeof s.avatar_path==='string'&&/^[a-f0-9-]{36}\/[a-f0-9-]{36}\.(jpg|png|webp)$/.test(s.avatar_path)?'/api/portfolio-image?path='+encodeURIComponent(s.avatar_path):null;
    const profileHref=isValidSellerSlug(s.slug||'')?'/p/'+encodeURIComponent(s.slug):null;
    const sellerIdentity=<><span className={'v39-person-avatar v39-avatar-'+coverClass(s.category)} aria-hidden="true">{avatarSrc?<img className="v41-card-avatar-img" src={avatarSrc} alt="" width={54} height={54} loading="lazy" decoding="async"/>:avatar}</span><div className="v39-person-name"><strong>{s.display_name}</strong><span>{s.headline||categoryName}</span></div></>;
    return <article key={s.id} className="v39-talent-card">
     <div className={'v39-card-cover v39-cover-'+coverClass(s.category)}>
      <span className="v39-cover-text" aria-hidden="true">linkup<span>.</span></span>
      <span className="v39-cover-accent" aria-hidden="true"/>
      {onSave&&<button className="v39-heart" type="button" aria-pressed={savedThis} aria-label={savedThis?t('Хадгалснаас хасах','Remove saved service'):t('Үйлчилгээ хадгалах','Save service')} disabled={saveBusy.includes(s.id)||heartState==='checking'||heartState==='loading'} aria-busy={heartState==='checking'||heartState==='loading'||saveBusy.includes(s.id)} onClick={()=>heartState==='ready'?onSave(s.id):heartState==='guest'?onSignInSave?.(s.id):heartState==='error'?onRetrySave?.():undefined}><Heart size={19} fill={savedThis?'currentColor':'none'}/></button>}
     </div>
     <div className="v39-card-body">
      <div className="v39-person-line">{profileHref?<Link className="v39-profile-link" href={profileHref} aria-label={t('Профайл үзэх: ','View seller profile: ')+s.display_name} title={t('Мэргэжилтний профайл үзэх','View seller profile')}>{sellerIdentity}</Link>:<span className="v39-profile-identity">{sellerIdentity}</span>}</div>
      <div className="v39-meta-line"><span className="v39-discipline">{categoryName}</span>{hasRating&&<span className="v39-rating"><Star size={13} fill="currentColor"/>{rating.toFixed(1)}<small>({reviewCount})</small></span>}</div>
      <h3><Link href={detailHref}>{title}</Link></h3>
      <p className="v39-description">{s.description}</p>
      <div className="v39-card-bottom">
       <div className="v39-price"><small>{t('Эхлэх үнэ','Starting at')}</small><strong>{money(minPrice)}{priceSuffix&&s.service_type!=='custom'&&<em className="v50-price-unit">{priceSuffix}</em>}</strong></div>
       <div className="v39-delivery"><Clock3 size={15}/>{delivery} {t('хоног','days')}</div>
      </div>
      <div className="v39-card-actions">
       <Link href={detailHref} className="v39-primary">{t('Үйлчилгээ үзэх','View service')}<ArrowUpRight size={17}/></Link>
       {homePreview&&<Link className="v39-contact" href={contactSellerHref(s.slug,signedIn)} aria-label={t('Мессеж бичих','Contact freelancer')}><MessageCircle size={17}/></Link>}
       {!homePreview&&<button type="button" className={'v39-compare-toggle '+(selected?'chosen':'')} aria-pressed={selected} disabled={!selected&&compared.length>=compareLimit} onClick={()=>toggleCompare(s.id)} aria-label={selected?t('Харьцуулалтаас хасах','Remove from comparison'):t('Харьцуулахад сонгох','Select for comparison')}>{selected?<Check size={17}/>:<Layers3 size={17}/>}</button>}
      </div>
     </div>
    </article>;
   })}</div>
   {homePreview?<div className="v39-all-services"><Link href="/explore/">{t('Бүх үйлчилгээг харах','Explore all services')}<ArrowRight size={17}/></Link></div>:
    <>
     {filtered.length>visibleCount&&<div className="v39-load-more"><span>{visible.length} / {filtered.length}</span><button type="button" onClick={()=>setVisibleCount(n=>n+START_COUNT)}>{t('Цааш үзэх','Load more')}<ArrowRight size={17}/></button></div>}
     {compared.length>0&&<div className="v39-compare-dock" role="region" aria-label={t('Харьцуулах сонголт','Compare selection')}>
      <div><span className="v39-compare-avatars"><Layers3 size={19}/></span><div><strong>{t('Харьцуулах жагсаалт','Compare shortlist')}</strong><small>{compared.length} / {compareLimit} {t('үйлчилгээ сонгосон','services selected')}</small></div></div>
      <div className="v39-compare-dock-actions">
       <button type="button" className="v39-compare-clear" onClick={()=>{setCompared([]);setShowCompare(false)}} aria-label={t('Сонголт арилгах','Clear selection')}><X size={17}/></button>
       <button type="button" className="v39-compare-open" disabled={!compareReady} onClick={()=>setShowCompare(p=>!p)} aria-expanded={compareReady&&showCompare}>{showCompare?t('Хаах','Close'):t('Харьцуулах','Compare')}<ArrowUpRight size={16}/></button>
      </div>
     </div>}
     {showCompare&&compareReady&&<ServiceComparison en={en} services={services} ids={compared} onRemove={id=>setCompared(p=>compareSelection(p,id))} onClear={()=>{setCompared([]);setShowCompare(false)}}/>}
    </>}
   {saveError&&<p className="v39-error" role="alert">{saveError}{heartState==='error'&&onRetrySave&&<> <button type="button" className="v39-retry" onClick={onRetrySave}>{t('Дахин оролдох','Try again')}</button></>}</p>}
   <p className="v39-market-note"><ShieldCheck size={16}/>{t('Нээлттэй туршилтын хувилбар. Имэйлээ баталгаажуулсан хэрэглэгч хүсэлт илгээх боломжтой.','Open beta, no payments. Email-verified users can request services.')}</p>
  </>}
 </section>;
}
