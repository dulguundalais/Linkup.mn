'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import Link from 'next/link';
import {ArrowRight,ArrowUpRight,Check,ChevronRight,Clapperboard,Code2,Globe2,Layers3,MessageCircle,MousePointer2,Search,ShieldCheck,Sparkles,Star,PenTool,BriefcaseBusiness,CheckCircle2} from 'lucide-react';
import {marketplaceClient} from '../lib/marketplace/client';
import {DEFAULT_PARTNER_TERMS,loadPartnerTerms} from '../lib/marketplace/partner-terms';
import {services} from '../lib/marketplace/catalog';
import {suggestLiveServices,type LiveService} from '../lib/marketplace/live-discovery';
import GuidedEntry from './guided-entry';
import '../app/signature-home.css';
import '../app/v50-hero.css';
import '../app/v56-search-hints.css';
import '../app/v59-hero-cleanup.css';
import '../app/v60-home-sections.css';
import '../app/v70-process-swoosh.css';

type T=(mn:string,en:string)=>string;
const topics=[
 {key:'design',mn:'Лого, брэнд',en:'Logo & brand',Icon:PenTool},
 {key:'web',mn:'Вэб хөгжүүлэлт',en:'Web development',Icon:Code2},
 {key:'video',mn:'Видео, Reels',en:'Video & reels',Icon:Clapperboard},
 {key:'ui',mn:'UI/UX дизайн',en:'UI/UX design',Icon:Layers3}
];

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
       {/* V59: owner cleanup — title, search, then Хувь хүн / Байгууллага; no eyebrow, intro or helper lines. */}
       <h1 id="signature-hero-title" className="hx-hero-title"><span>{t('Асуудал бүрт','Every problem')}</span> <span>{t('шийдэл бий.','has a solution.')}</span></h1>
       <div className="signature-search-shell hx-hero-search" onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node|null))setShowSuggestions(false)}}>
        <form action="/solutions/" method="get" className="signature-search hx-searchbar" role="search">
         <Search size={22} aria-hidden="true" className="hx-searchbar-icon"/>
         <span className={'hx-search-field'+(search?'':' has-hint')}>
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
         {/* V56: the same example, drawn over the empty field so each new one slides in. */}
         {!search&&<span className="hx-search-hint" aria-hidden="true"><span key={exampleIndex}>{examples[exampleIndex]}…</span></span>}
         </span>
         <button type="submit" className="hx-searchbar-go"><span>{t('Шийдэл олох','Find solutions')}</span><ArrowRight size={18} aria-hidden="true"/></button>
        </form>
        {showSuggestions&&search.trim().length>1&&publishedState==='ready'&&<div className="signature-search-suggestions hx-suggest" id="hero-search-suggestions" role="listbox" aria-label={t('Нийтлэгдсэн үйлчилгээний санал','Published service suggestions')}>
          {suggestions.map((item,i)=><Link id={'hero-search-option-'+i} role="option" aria-selected={activeSuggestion===i} className={activeSuggestion===i?'active':''} key={item.id} href={'/listing/?id='+encodeURIComponent(item.id)}><Search size={15} aria-hidden="true"/>{en&&item.title_en?item.title_en:item.title}<span>{t('Нийтлэгдсэн','Live')}</span></Link>)}
          {suggestions.length===0&&<p className="signature-search-no-match">{t('Энэ хайлтаар нийтлэгдсэн үйлчилгээ хараахан алга. "Шийдэл олох" дээр дарж асуудлаа тайлбарлаарай.','No published service matches yet. Press “Find solutions” to describe your goal.')}</p>}
          <Link className="signature-search-all" href={'/explore/?q='+encodeURIComponent(search)}>{t('Үйлчилгээ хайх','Search published services')}<ArrowRight size={15} aria-hidden="true"/></Link>
        </div>}
       </div>
       <div className="hx-hero-meta">
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
/* V60 homepage order (owner spec): Hero → How it works → Categories → Featured
   services → Business solutions → For freelancers → Partners → Footer. The three
   parts below are separate so premium-marketplace can place each one. */
export function SignatureProcess({en}:{en:boolean}){
 const [mode,setMode]=useState<'buyer'|'seller'>('buyer');
 const t:T=(mn,english)=>en?english:mn;
 const steps=mode==='buyer'?buyerSteps:sellerSteps;
 // V70: a straight light streak sweeps under the title, lights up under its last
 // letter and fades away — once per page load, when the title first scrolls into
 // view. It is hidden at rest, so with reduced motion (or no script) it never shows.
 const swooshRef=useRef<HTMLSpanElement>(null);
 useEffect(()=>{
  const el=swooshRef.current;
  if(!el||typeof IntersectionObserver==='undefined'||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const io=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){el.classList.add('v70-play');io.disconnect()}},{threshold:.6});
  io.observe(el);
  return()=>io.disconnect();
 },[]);
 return <section id="how" className="signature-process v60-process" aria-labelledby="how-title">
    <div className="shell">
     <div className="signature-section-heading"><div><span className="signature-section-eyebrow">{t('Хэрхэн ажилладаг','How it works')}</span><h2 id="how-title"><span className="v70-swoosh-text" ref={swooshRef}>{t('Санаанаас бодит ажил хүртэл.','From idea to finished work.')}<span className="v70-swoosh" aria-hidden="true"><svg viewBox="0 0 100 20" preserveAspectRatio="none" focusable="false"><defs><linearGradient id="v70-swoosh-grad" gradientUnits="userSpaceOnUse" x1="0" x2="100" y1="10" y2="10"><stop offset="0" stopColor="#4a77ee" stopOpacity="0"/><stop offset=".55" stopColor="#4a77ee" stopOpacity=".75"/><stop offset=".9" stopColor="#4fd7ff"/><stop offset="1" stopColor="#d9f7ff"/></linearGradient></defs><path d="M0 10 L100 10" vectorEffect="non-scaling-stroke" stroke="url(#v70-swoosh-grad)"/></svg><i className="v70-swoosh-head"/></span></span></h2></div><div className="signature-process-switch" role="group" aria-label={t('Хэрэглэгчийн төрөл','How it works for')}><button aria-pressed={mode==='buyer'} className={mode==='buyer'?'active':''} onClick={()=>setMode('buyer')}>{t('Захиалагчдад','For buyers')}</button><button aria-pressed={mode==='seller'} className={mode==='seller'?'active':''} onClick={()=>setMode('seller')}>{t('Мэргэжилтнүүдэд','For freelancers')}</button></div></div>
     <ol className="v60-steps">{steps.map(({index,mn,en:eng,descMn,descEn,Icon})=><li key={mode+index} className="v60-step"><div className="v60-step-head"><span className="v60-step-icon" aria-hidden="true"><Icon size={26} strokeWidth={1.8}/></span><span className="v60-step-num">{index}</span></div><h3>{en?eng:mn}</h3><p>{en?descEn:descMn}</p></li>)}</ol>
     <p className="signature-process-note"><ShieldCheck size={15}/>{t('Туршилтын хугацаанд Linkup төлбөр хүлээн авахгүй, эскроу үйлчилгээ үзүүлэхгүй.','No real payments or escrow during open beta.')}</p>
    </div>
   </section>;
}
export function SignatureSellerBand({en}:{en:boolean}){
 const t:T=(mn,english)=>en?english:mn;
 return <section id="for-freelancers" className="signature-seller-band shell">
    <div className="signature-seller-text"><span className="signature-section-eyebrow">{t('Мэргэжилтнүүдэд','For freelancers')}</span><h2>{t('Ур чадвараараа','Your skills deserve')}<br/><em>{t('шинэ боломж нээгээрэй.','a bigger stage.')}</em></h2><p>{t('Профайлаа үүсгэж, үйлчилгээгээ багцлан, шинэ захиалагчтай хамтран ажиллаарай.','Build a storefront for your talent, create packages and connect with new clients.')}</p><Link href="/join/seller/" className="signature-cta-button">{t('Үйлчилгээгээ санал болгох','Become a freelancer')}<ArrowUpRight size={19}/></Link></div>
    <div className="signature-seller-art" aria-hidden="true"><div className="signature-art-window"><span className="signature-window-dots">● ● ●</span><div className="signature-art-line strong"/><div className="signature-art-line medium"/><div className="signature-art-row"><i/><i/><i/></div><div className="signature-art-badge"><Sparkles size={17}/> MADE TO CREATE</div></div><div className="signature-art-cube cube-one"/><div className="signature-art-cube cube-two"/></div>
   </section>;
}
export function SignaturePartner({en}:{en:boolean}){
 const t:T=(mn,english)=>en?english:mn;
 // V67: the numbers come from Business rules, so an admin change shows here at once.
 const [terms,setTerms]=useState(DEFAULT_PARTNER_TERMS);
 useEffect(()=>{let live=true;void loadPartnerTerms().then(v=>{if(live&&v)setTerms(v)});return()=>{live=false}},[]);
 return <section className="signature-partner shell">
    <div className="signature-partner-inner"><div className="signature-partner-copy"><span className="signature-section-eyebrow">{t('Түншлэл','Partners')}</span><h2>{t('Холбоогоо боломж болго.','Good connections make great things happen.')}</h2><p>{t('Мэргэжилтнүүдийг Linkup-д урьж, түншийн хөтөлбөрт оролцоорой. Туршилтын хугацаанд урамшууллыг зөвхөн тооцоолох бөгөөд мөнгө олгохгүй.', 'Introduce skilled freelancers to the marketplace. Referral rewards are simulated during beta, not paid out.')}</p><Link className="signature-partner-link" href="/referrals/">{t('Түншийн мэдээлэл үзэх','Explore referrals')}<ArrowUpRight size={16}/></Link></div><div className="signature-partner-stats"><div><strong>{terms.partner_percent}%</strong><span>{t('Түншийн урамшуулал','Partner reward')}</span></div><div><strong>{terms.attribution_days}</strong><span>{t('хоногийн урилгын хугацаа','day invite window')}</span></div><div><strong>{terms.reward_months}</strong><span>{t('сар урамшуулал тооцно','months of rewards')}</span></div></div></div>
   </section>;
}
