'use client';
import {useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import {ArrowRight,ArrowUpRight,Check,ChevronRight,Clapperboard,Code2,Globe2,Layers3,MessageCircle,MousePointer2,Search,ShieldCheck,Sparkles,Star,PenTool,BriefcaseBusiness,CheckCircle2} from 'lucide-react';
import {marketplaceClient} from '../lib/marketplace/client';
import {orderRecommended} from '../lib/marketplace/recommendations';
import {services} from '../lib/marketplace/catalog';
import {suggestLiveServices,type LiveService} from '../lib/marketplace/live-discovery';
import GuidedEntry from './guided-entry';
import '../app/signature-home.css';
import '../app/v50-hero.css';

type T=(mn:string,en:string)=>string;
const topics=[
 {key:'design',mn:'Лого, брэнд',en:'Logo & brand',Icon:PenTool},
 {key:'web',mn:'Вэб хөгжүүлэлт',en:'Web development',Icon:Code2},
 {key:'video',mn:'Видео, Reels',en:'Video & reels',Icon:Clapperboard},
 {key:'ui',mn:'UI/UX дизайн',en:'UI/UX design',Icon:Layers3}
];
type Spotlight={id:string;title:string;title_en?:string;category:string;price:number;display_name:string;headline:string;slug:string;review_count:number;average_rating:number|null;completed_orders:number};
const formatPrice=(amount:number)=>new Intl.NumberFormat('mn-MN').format(amount)+' ₮';

export function SignatureHero({en}:{en:boolean}){
 // V50: the HUSTLE-COLLAB hero — centred, on a soft navy light field. Describe a need
 // in your own words; live suggestions come only from published marketplace services.
 const [search,setSearch]=useState('');
 const [showSuggestions,setShowSuggestions]=useState(false);
 const [activeSuggestion,setActiveSuggestion]=useState(-1);
 const [publishedState,setPublishedState]=useState<'loading'|'ready'|'error'>('loading');
 const [published,setPublished]=useState<LiveService[]>([]);
 const [exampleIndex,setExampleIndex]=useState(0);
 useEffect(()=>{let active=true;marketplaceClient().then(db=>db.rpc('marketplace_catalog')).then(r=>{if(!active)return;if(r.error)throw r.error;setPublished(Array.isArray(r.data)?r.data as LiveService[]:[]);setPublishedState('ready')}).catch(()=>{if(active)setPublishedState('error')});return()=>{active=false}},[]);
 const suggestions=useMemo(()=>suggestLiveServices(published,search,4),[published,search]);
 const t:T=(mn,english)=>en?english:mn;
 const examples=en?['My restaurant needs more customers','Automate our Facebook orders','We need a company website','Help with our tax filing']:['Манай ресторанд үйлчлүүлэгч цөөн байна','Facebook захиалгаа автоматжуулмаар байна','Компанидаа вэбсайт хийлгэмээр байна','Татварын тайлангаа зөв гаргамаар байна'];
 // Rotate the placeholder through real example problems until the visitor types.
 useEffect(()=>{if(search||showSuggestions)return;if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;const id=window.setInterval(()=>setExampleIndex(i=>(i+1)%4),4000);return()=>window.clearInterval(id)},[search,showSuggestions]);
 return <section className="signature-hero hx-hero" aria-labelledby="signature-hero-title">
   <div className="hx-hero-frame">
    <span className="hx-hero-light" aria-hidden="true"/>
    <span className="hx-hero-grain" aria-hidden="true"/>
    <div className="shell signature-hero-inner hx-hero-inner">
       <p className="hx-hero-eyebrow"><span className="hx-eyebrow-name">{t('Шийдэл хайх','Smart Finder')}</span><span className="hx-eyebrow-rule" aria-hidden="true"/><span>{t('Хэрэгцээгээ бичээд шийдлээ олоорой','Describe a problem, get a solution')}</span></p>
       <h1 id="signature-hero-title" className="hx-hero-title"><span>{t('Асуудал бүрт','Every problem')}</span> <span>{t('шийдэл бий.','has a solution.')}</span></h1>
       <p className="hx-hero-sub">{t('Хийлгэх ажил байгаа ч хэнд хандахаа мэдэхгүй байна уу? Асуудлаа өөрийн үгээр бичээрэй — Linkup тохирох шийдэл, мэргэжилтнийг санал болгоно.','Have work to get done but not sure who to ask? Describe it in your own words — Linkup suggests the right solution and the professionals for it.')}</p>
       <div className="signature-search-shell hx-hero-search" onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node|null))setShowSuggestions(false)}}>
        <form action="/solutions/" method="get" className="signature-search hx-searchbar" role="search">
         <Search size={22} aria-hidden="true" className="hx-searchbar-icon"/>
         <input name="q" role="combobox" aria-label={t('Асуудлаа тайлбарлах','Describe your challenge')}
          aria-autocomplete="list" aria-haspopup="listbox" aria-expanded={showSuggestions&&search.trim().length>1&&publishedState==='ready'}
          aria-controls="hero-search-suggestions" aria-activedescendant={activeSuggestion>=0&&showSuggestions&&suggestions[activeSuggestion]?'hero-search-option-'+activeSuggestion:undefined}
          value={search} maxLength={300} autoComplete="off" onChange={e=>{setSearch(e.target.value);setShowSuggestions(true);setActiveSuggestion(-1)}}
          onFocus={()=>setShowSuggestions(true)}
          onKeyDown={e=>{
           if(e.key==='Escape'){setShowSuggestions(false);setActiveSuggestion(-1)}
           else if(e.key==='ArrowDown'&&suggestions.length){e.preventDefault();setShowSuggestions(true);setActiveSuggestion(i=>(i+1)%suggestions.length)}
           else if(e.key==='ArrowUp'&&suggestions.length){e.preventDefault();setShowSuggestions(true);setActiveSuggestion(i=>i<0?suggestions.length-1:(i-1+suggestions.length)%suggestions.length)}
           else if(e.key==='Enter'&&showSuggestions&&activeSuggestion>=0&&suggestions[activeSuggestion]){e.preventDefault();window.location.assign('/listing/?id='+encodeURIComponent(suggestions[activeSuggestion].id))}
          }}
          placeholder={examples[exampleIndex]+'…'}/>
         <button type="submit" className="hx-searchbar-go"><span>{t('Шийдэл олох','Find solutions')}</span><ArrowRight size={18} aria-hidden="true"/></button>
        </form>
        {showSuggestions&&search.trim().length>1&&publishedState==='ready'&&<div className="signature-search-suggestions hx-suggest" id="hero-search-suggestions" role="listbox" aria-label={t('Нийтлэгдсэн үйлчилгээний санал','Published service suggestions')}>
          {suggestions.map((item,i)=><Link id={'hero-search-option-'+i} role="option" aria-selected={activeSuggestion===i} className={activeSuggestion===i?'active':''} key={item.id} href={'/listing/?id='+encodeURIComponent(item.id)}><Search size={15} aria-hidden="true"/>{en&&item.title_en?item.title_en:item.title}<span>{t('Нийтлэгдсэн','Live')}</span></Link>)}
          {suggestions.length===0&&<p className="signature-search-no-match">{t('Энэ хайлтаар нийтлэгдсэн үйлчилгээ хараахан алга. "Шийдэл олох" дээр дарж асуудлаа тайлбарлаарай.','No published service matches yet. Press “Find solutions” to describe your goal.')}</p>}
          <Link className="signature-search-all" href={'/explore/?q='+encodeURIComponent(search)}>{t('Үйлчилгээ хайх','Search published services')}<ArrowRight size={15} aria-hidden="true"/></Link>
        </div>}
       </div>
       <div className="hx-hero-meta">
        <div className="signature-search-subline hx-hero-subline"><Sparkles size={14} aria-hidden="true"/>{t('Кирилл, латин галиг, англиар хайх','Search in Mongolian, Latin or English')}</div>
        <div className="hx-hero-guided"><GuidedEntry en={en}/></div>
       </div>
    </div>
   </div>
 </section>;
}

const buyerSteps=[
 {index:'01',mn:'Мэргэжилтнээ олох',en:'Discover the right expert',descMn:'Ур чадвар, багц, үнийг харьцуулаарай.',descEn:'Compare services, packages and prices.',Icon:Search},
 {index:'02',mn:'Ярилцаж, захиалах',en:'Connect and request',descMn:'Мэргэжилтэнтэйгээ ажлын нөхцөлөө тохиролцоорой.',descEn:'Message a freelancer and agree on scope.',Icon:MessageCircle},
 {index:'03',mn:'Ажлаа хүлээн авах',en:'Review and receive',descMn:'Явцаа хянаж, бэлэн болсон ажлыг шалгаж аваарай.',descEn:'Track progress, review and receive the work.',Icon:CheckCircle2}
];
const sellerSteps=[
 {index:'01',mn:'Профайлаа үүсгэх',en:'Create your studio',descMn:'Ур чадвар, туршлага, хийсэн ажлаа танилцуулаарай.',descEn:'Showcase your profile, portfolio and the work you do best.',Icon:BriefcaseBusiness},
 {index:'02',mn:'Гурван багцаа бэлдэх',en:'Define your packages',descMn:'Суурь, Стандарт, Дээд багцын үнэ, хугацаа, багтах ажлыг тодорхойлоорой.',descEn:'Price Basic, Standard and Premium with clear deliverables.',Icon:Layers3},
 {index:'03',mn:'Ажлаа хүлээлгэн өгөх',en:'Connect and deliver',descMn:'Захиалгаа авч, чатаар харилцан, бэлэн болсон ажлаа илгээгээрэй.',descEn:'Respond to requests, collaborate and deliver your work.',Icon:CheckCircle2}
];
export function SignatureStory({en}:{en:boolean}){
 const [mode,setMode]=useState<'buyer'|'seller'>('buyer');
 const [spotlights,setSpotlights]=useState<Spotlight[]>([]);
 const [state,setState]=useState<'loading'|'ready'|'error'>('loading');
 const t:T=(mn,english)=>en?english:mn;
 useEffect(()=>{
  let active=true;
  marketplaceClient().then(db=>db.rpc('marketplace_catalog')).then(res=>{
   if(!active)return;
   if(res.error)throw res.error;
   const records=Array.isArray(res.data)?res.data as Spotlight[]:[];
   const unique=new Map<string,Spotlight>();
   for(const record of records){if(typeof record.slug==='string'&&/^[a-z0-9][a-z0-9-]{2,59}$/.test(record.slug)&&!unique.has(record.slug))unique.set(record.slug,record);}
   setSpotlights(orderRecommended([...unique.values()].map(p=>({...p,review_count:Number(p.review_count)||0,average_rating:p.average_rating===null?null:Number(p.average_rating),completed_orders:Number(p.completed_orders)||0}))).slice(0,3));setState('ready');
  }).catch(()=>{if(active)setState('error')});
  return()=>{active=false};
 },[]);
 const steps=mode==='buyer'?buyerSteps:sellerSteps;
 const skills=useMemo(()=>topics.slice(0,4),[]);
 return <>
   <section id="how" className="signature-process">
    <div className="shell">
     <div className="signature-section-heading"><div><span className="signature-section-eyebrow">{t('Хэрхэн ажилладаг','How it works')}</span><h2>{t('Санаанаас бодит ажил хүртэл.','A simpler way to create together.')}</h2><p>{t('Гурван энгийн алхам.', 'Three steps. One clear path.')}</p></div><div className="signature-process-switch" role="group" aria-label={t('Хэрэглэгчийн төрөл','How it works for')}><button aria-pressed={mode==='buyer'} className={mode==='buyer'?'active':''} onClick={()=>setMode('buyer')}>{t('Захиалагчдад','For buyers')}</button><button aria-pressed={mode==='seller'} className={mode==='seller'?'active':''} onClick={()=>setMode('seller')}>{t('Мэргэжилтнүүдэд','For freelancers')}</button></div></div>
     <div className="signature-step-grid">{steps.map(({index,mn,en:eng,descMn,descEn,Icon})=><article key={index} className="signature-step"><div className="signature-step-top"><span className="signature-step-icon"><Icon size={24}/></span><strong>{index}</strong></div><h3>{en?eng:mn}</h3><p>{en?descEn:descMn}</p><div className="signature-step-line"/></article>)}</div>
     <p className="signature-process-note"><ShieldCheck size={15}/>{t('Туршилтын хугацаанд Linkup төлбөр хүлээн авахгүй, эскроу үйлчилгээ үзүүлэхгүй.','No real payments or escrow during open beta.')}</p>
    </div>
   </section>
   <section className="signature-spotlight shell" id="talent">
    <div className="signature-section-heading"><div><span className="signature-section-eyebrow">{t('Мэргэжилтнүүд','The people')}</span><h2>{t('Бүтээлч хүмүүс. Бодит ур чадвар.','Meet the minds behind the work.')}</h2><p>{t('Мэргэжилтнүүдийн бодит профайлаас сонгоорой.','Explore profiles from real creatives on Linkup.')}</p></div><Link href="/explore/" className="signature-text-link">{t('Бүх үйлчилгээг үзэх','Explore services')}<ArrowUpRight size={18}/></Link></div>
    {state==='loading'&&<div className="signature-spotlight-empty" role="status">{t('Бодит профайлуудыг ачаалж байна…','Loading live freelancer profiles…')}</div>}
    {state==='error'&&<div className="signature-spotlight-empty" role="status">{t('Одоогоор профайл ачаалж чадсангүй.','Live profiles are temporarily unavailable.')}</div>}
    {state==='ready'&&!spotlights.length&&<div className="signature-spotlight-empty">{t('Мэргэжилтнүүдийн нийтэд нээлттэй профайл энд харагдана.','Published freelancer profiles will appear here.')} <Link href="/join/seller/">{t('Эхэлж нэгдэх','Join as a freelancer')}<ArrowRight size={15}/></Link></div>}
    {state==='ready'&&spotlights.length>0&&<div className="signature-people-grid">{spotlights.map((p,i)=><Link className="signature-person" key={p.slug} href={'/p/'+encodeURIComponent(p.slug)+'/'}><div className={'signature-person-avatar avatar-tone-'+(i%4)}><span>{p.display_name?.trim().slice(0,1).toLocaleUpperCase()||'H'}</span><i/></div><div className="signature-person-caption"><span>{p.category}</span><h3>{p.display_name}</h3><p>{p.headline||p.title}</p>{p.review_count>0&&p.average_rating!==null&&<div className="signature-review-score"><Star size={15} fill="currentColor"/><strong>{p.average_rating.toFixed(1)}</strong><small>({p.review_count} {t('баталгаажсан үнэлгээ','verified reviews')})</small></div>}<small>{t('Үйлчилгээний эхлэх үнэ','Services from')} <b>{formatPrice(p.price)}</b></small></div><span className="signature-person-arrow"><ArrowUpRight size={18}/></span></Link>)}</div>}
   </section>
   <section id="for-freelancers" className="signature-seller-band shell">
    <div className="signature-seller-text"><span className="signature-section-eyebrow">{t('Мэргэжилтнүүдэд','For freelancers')}</span><h2>{t('Ур чадвараараа','Your skills deserve')}<br/><em>{t('шинэ боломж нээгээрэй.','a bigger stage.')}</em></h2><p>{t('Профайлаа үүсгэж, үйлчилгээгээ багцлан, шинэ захиалагчтай хамтран ажиллаарай.','Build a storefront for your talent, create packages and connect with new clients.')}</p><Link href="/join/seller/" className="signature-cta-button">{t('Үйлчилгээгээ санал болгох','Become a freelancer')}<ArrowUpRight size={19}/></Link></div>
    <div className="signature-seller-art" aria-hidden="true"><div className="signature-art-window"><span className="signature-window-dots">● ● ●</span><div className="signature-art-line strong"/><div className="signature-art-line medium"/><div className="signature-art-row"><i/><i/><i/></div><div className="signature-art-badge"><Sparkles size={17}/> MADE TO CREATE</div></div><div className="signature-art-cube cube-one"/><div className="signature-art-cube cube-two"/></div>
   </section>
   <section className="signature-partner shell">
    <div className="signature-partner-inner"><div className="signature-partner-copy"><span className="signature-section-eyebrow">{t('Түншлэл','Partners')}</span><h2>{t('Холбоогоо боломж болго.','Good connections make great things happen.')}</h2><p>{t('Мэргэжилтнүүдийг Linkup-д урьж, түншийн хөтөлбөрт оролцоорой. Туршилтын хугацаанд урамшууллыг зөвхөн тооцоолох бөгөөд мөнгө олгохгүй.', 'Introduce skilled freelancers to the marketplace. Referral rewards are simulated during beta, not paid out.')}</p><Link className="signature-partner-link" href="/referrals/">{t('Түншийн мэдээлэл үзэх','Explore referrals')}<ArrowUpRight size={16}/></Link></div><div className="signature-partner-stats"><div><strong>1%</strong><span>{t('Үндсэн түнш','Standard partner')}</span></div><div><strong>2%</strong><span>{t('Идэвхтэй түнш','Active partner')}</span></div><div><strong>10%</strong><span>{t('Платформын шимтгэл','Platform commission')}</span></div></div></div>
   </section>
 </>;
}
