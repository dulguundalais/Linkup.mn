'use client';
import MoneyInput,{groupMoney} from './money-input';
import {useEffect,useMemo,useRef,useState,type FormEvent} from 'react';
import Link from 'next/link';
import LinkupWordmark from './linkup-wordmark';
import {ArrowRight,ArrowUpRight,Building2,Check,ClipboardCopy,FileText,Lightbulb,Search,UserRound} from 'lucide-react';
import {Breadcrumbs} from './site-header';
import {marketplaceClient} from '../lib/marketplace/client';
import {buildProjectBrief,classifyNeed,matchingPublished,type Audience,type PublishedMatch} from '../lib/marketplace/solution-finder';
import '../app/solution-finder.css';
import '../app/v61-consistency.css';

export default function SolutionFinder({compact=false,embedded=false,en:language=false}:{compact?:boolean;embedded?:boolean;en?:boolean}){
 // Embedded in the shared site shell, language comes from the site header.
 const [ownEn,setEn]=useState(language);
 const en=embedded?language:ownEn;
 const [audience,setAudience]=useState<Audience>('business');
 const [query,setQuery]=useState('');
 const [submitted,setSubmitted]=useState('');
 const [budget,setBudget]=useState(''),[timeline,setTimeline]=useState('');
 const [catalog,setCatalog]=useState<PublishedMatch[]>([]);
 const [catalogState,setCatalogState]=useState<'loading'|'ready'|'error'>('loading');
 const [copyStatus,setCopyStatus]=useState<'idle'|'copied'|'error'>('idle');
 // Each search (typed, example chip or arriving with ?q=) asks for the results to be revealed.
 const [reveal,setReveal]=useState(0);
 const [tooShort,setTooShort]=useState(false);
 const [arrival,setArrival]=useState(false);
 const [instant,setInstant]=useState(false);
 const resultsTitle=useRef<HTMLHeadingElement>(null);
 const needField=useRef<HTMLTextAreaElement>(null);
 const t=(mn:string,english:string)=>en?english:mn;
 useEffect(()=>{
  let active=true;
  setEn(localStorage.getItem('hustle-language')==='en'||language);
  try{const saved=localStorage.getItem('hustle-buyer-audience');if(saved==='personal'||saved==='business')setAudience(saved)}catch{}
  const params=new URLSearchParams(location.search);
  setBudget(groupMoney((params.get('budget')||'').slice(0,80)));
  setTimeline((params.get('timeline')||'').slice(0,80));
  if(params.get('audience')==='business'||params.get('audience')==='personal')setAudience(params.get('audience') as Audience);
  const need=params.get('q')||'';
  if(need.trim()){setQuery(need.slice(0,1200));setSubmitted(need.slice(0,1200));setArrival(true)}
  void marketplaceClient().then(db=>db.rpc('marketplace_catalog')).then(res=>{
   if(!active)return;
   if(res.error)throw res.error;
   setCatalog(Array.isArray(res.data)?res.data as PublishedMatch[]:[]);
   setCatalogState('ready');
  }).catch(()=>{if(active)setCatalogState('error')});
  return()=>{active=false};
 },[language]);
 const outcome=useMemo(()=>classifyNeed(submitted),[submitted]);
 const matchesByIdea=useMemo(()=>outcome.solutions.map(idea=>matchingPublished(catalog,idea)),[catalog,outcome]);
 const hasMatches=matchesByIdea.some(matches=>matches.length>0);
 const brief=useMemo(()=>buildProjectBrief(submitted,audience,en?'en':'mn',budget?budget+' ₮':'',timeline),[submitted,audience,en,budget,timeline]);
 const requestParams=new URLSearchParams({q:submitted,audience});
 if(budget.trim())requestParams.set('budget',budget.trim());
 if(timeline.trim())requestParams.set('timeline',timeline.trim());
 const setType=(type:Audience)=>{setAudience(type);try{localStorage.setItem('hustle-buyer-audience',type)}catch{}};
 // Keep the search in the address bar so Back, refresh and sharing return to the same results.
 const remember=(need:string)=>{try{const url=new URL(location.href);url.searchParams.set('q',need);url.searchParams.set('audience',audience);history.replaceState(history.state,'',url)}catch{}};
 const run=(need:string)=>{setSubmitted(need);setCopyStatus('idle');setTooShort(false);remember(need);setReveal(r=>r+1)};
 // V61: back to an empty field at the top of the page, ready to type.
 const newSearch=()=>{setQuery('');needField.current?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'center'});needField.current?.focus({preventScroll:true})};
 const submit=(e:FormEvent<HTMLFormElement>)=>{e.preventDefault();const need=query.trim().slice(0,1200);if(need.length<5){setTooShort(true);needField.current?.focus();return}run(need)};
 // Arriving with ?q= (e.g. from the homepage search): reveal once the matches have
 // loaded, so the page no longer shifts underneath the scroll.
 // Wait for the page load event as well: the browser settles its own scroll
 // position on load and would otherwise undo an earlier jump.
 useEffect(()=>{
  if(!arrival||catalogState==='loading')return;
  const go=()=>{setArrival(false);setInstant(true);setReveal(r=>r+1)};
  if(document.readyState==='complete'){const id=window.setTimeout(go,0);return()=>window.clearTimeout(id)}
  window.addEventListener('load',go,{once:true});return()=>window.removeEventListener('load',go);
 },[arrival,catalogState]);
 // Results render below the form; bring them into view and move focus to their heading.
 useEffect(()=>{
  if(!reveal)return;
  const frame=requestAnimationFrame(()=>{
   const heading=resultsTitle.current;if(!heading)return;
   const still=instant||window.matchMedia('(prefers-reduced-motion: reduce)').matches;setInstant(false);
   // 'auto' would inherit the site's CSS smooth scrolling, which page-load layout cancels.
   heading.closest('.finder-results')?.scrollIntoView({behavior:still?'instant':'smooth',block:'start'});
   heading.focus({preventScroll:true});
  });
  return()=>cancelAnimationFrame(frame);
 },[reveal]);
 const copy=async()=>{try{await navigator.clipboard.writeText(brief);setCopyStatus('copied')}catch{setCopyStatus('error')}};
 return <section className={'solution-finder '+(compact?'finder-compact':'')} aria-labelledby="hustle-finder-title">
  <div className="solution-shell">
   {!compact&&!embedded&&<div className="solution-top"><Link href="/" className="solution-brand" aria-label="Linkup"><LinkupWordmark decorative/></Link><Link href="/explore/">{t('Бүх үйлчилгээг үзэх','Browse all services')} <ArrowUpRight size={16}/></Link></div>}
   {/* V61: one clear purpose, like the homepage search — a title, the two audiences, the field. */}
   {embedded&&<Breadcrumbs en={en} items={[{label:t('Нүүр','Home'),href:'/'},{label:t('Шийдэл олох','Find a solution')}]}/>}
   <div className="finder-heading"><h1 id="hustle-finder-title">{t('Ямар асуудал шийдэх хэрэгтэй байна?','What are you trying to solve?')}</h1></div>
   <div className="finder-audience" role="group" aria-label={t('Төслийн төрөл','Project context')}>
    <button type="button" aria-pressed={audience==='personal'} onClick={()=>setType('personal')}><UserRound size={18}/>{t('Хувь хүн','Personal')}</button>
    <button type="button" aria-pressed={audience==='business'} onClick={()=>setType('business')}><Building2 size={18}/>{t('Байгууллага','Organization')}</button>
   </div>
   <form className="finder-form" onSubmit={submit} role="search" noValidate>
    <label htmlFor="hustle-need">{t('Хэрэгцээгээ тайлбарлана уу','Describe what you need')}</label>
    <textarea ref={needField} id="hustle-need" name="q" rows={compact?2:3} minLength={5} maxLength={1200} required aria-invalid={tooShort||undefined} aria-describedby={tooShort?'hustle-need-hint':undefined} value={query} onChange={e=>{setQuery(e.target.value);if(tooShort&&e.target.value.trim().length>=5)setTooShort(false)}} placeholder={t('Жишээ: Манай рестораны захиалгыг нэмэгдүүлэх хэрэгтэй. Хаанаас эхлэхээ мэдэхгүй байна.','Example: We want more restaurant bookings but do not know where to start.')}/>
    {tooShort&&<p className="finder-hint" id="hustle-need-hint" role="alert">{t('Дор хаяж 5 тэмдэгтээр хэрэгцээгээ бичнэ үү.','Describe your need in at least 5 characters.')}</p>}
    <div className="finder-form-foot"><button type="submit">{t('Шийдэл олох','Find solutions')} <ArrowRight size={18}/></button></div>
   </form>
   <p className="finder-sr-only" role="status">{submitted?t('Боломжит 3 чиглэл доор гарлаа.','3 possible directions are shown below.'):''}</p>
   {submitted&&<div className="finder-results" id="solution-results">
    <div className="finder-result-heading"><div><span className="finder-eyebrow"><Lightbulb size={15}/>{t('ТАНЫ БОЛОМЖИТ ЧИГЛЭЛ','POSSIBLE NEXT STEPS')}</span><p className="finder-searched">{t('Таны хайлт:','You searched:')} <q>{submitted}</q></p>
     <h2 ref={resultsTitle} tabIndex={-1}>{en?outcome.en:outcome.mn}</h2><p>{en?outcome.enWhy:outcome.mnWhy}</p></div><button type="button" className="finder-new-search" onClick={newSearch}><Search size={16} aria-hidden="true"/>{t('Шинээр хайх','New search')}</button></div>
    <div className="finder-solution-grid">{outcome.solutions.map((idea,i)=>{
     const matches=matchesByIdea[i];
     return <article className="finder-solution-card" key={idea.id}>
      <span className="finder-number">0{i+1}</span><h3>{en?idea.en:idea.mn}</h3><p>{en?idea.whyEn:idea.whyMn}</p>
      {matches.length>0?<div className="finder-real-matches"><strong><Check size={15}/>{t('Нийтлэгдсэн үйлчилгээ','Published services')}</strong>{matches.map(service=><Link key={service.id} href={'/listing/?id='+encodeURIComponent(service.id)}>{en&&service.title_en?service.title_en:service.title}<ArrowUpRight size={15}/></Link>)}</div>
       :hasMatches&&<div className="finder-no-match">{t('Энэ чиглэлд тохирох үйлчилгээ алга.','No matching services for this approach.')}</div>}
     </article>;
    })}</div>
    <div className="finder-brief">
     <div>
      <span className="finder-eyebrow"><FileText size={15} aria-hidden="true"/>{t('ДАРААГИЙН АЛХАМ','NEXT STEP')}</span>
      <h3>{t('Төслийн хүсэлтээ бэлдэх','Prepare your project request')}</h3>
      <p className="finder-brief-intro">{t('Төсөв, хугацаагаа мэдэж байвал нэмээрэй. Илгээхийн өмнө хүсэлтээ засаж болно.','Add a budget and timeline if you know them. You can edit your request before sending it.')}</p>
     </div>
     <p className="finder-catalog-status" role="status">{catalogState==='loading'
      ?t('Тохирох үйлчилгээг шалгаж байна…','Checking for matching services…')
      :catalogState==='error'
       ?t('Үйлчилгээний жагсаалтыг ачаалж чадсангүй. Та хүсэлтээ үргэлжлүүлэн бэлдэж болно.','We could not load the service catalog. You can still prepare a request.')
       :!hasMatches&&t('Одоогоор тохирох үйлчилгээ алга. Хүсэлт илгээж, мэргэжилтнүүдээс санал авах боломжтой.','No matching services yet. You can post a request to get proposals from freelancers.')}</p>
     <div className="finder-brief-fields">
      <label>{t('Төсвийн дээд хэмжээ (₮, заавал биш)','Maximum budget (MNT, optional)')}<MoneyInput value={budget} onChange={d=>{setBudget(groupMoney(d));setCopyStatus('idle')}} placeholder={t('Жишээ: 500,000','e.g. 500,000')}/></label>
      <label>{t('Хугацаа (заавал биш)','Timeline (optional)')}<input value={timeline} onChange={e=>{setTimeline(e.target.value);setCopyStatus('idle')}} maxLength={80} placeholder={t('Жишээ: 2 долоо хоног','e.g. 2 weeks')}/></label>
     </div>
     <details className="finder-brief-details">
      <summary>{t('Хүсэлтийн ноорог харах','Preview your brief')}</summary>
      <p className="finder-brief-preview">{brief}</p>
      <div className="finder-brief-actions"><button type="button" onClick={()=>void copy()}><ClipboardCopy size={16} aria-hidden="true"/>{t('Ноорог хуулах','Copy brief')}</button></div>
      <p className="finder-copy-status" role="status">{copyStatus==='copied'?t('Ноорог хууллаа.','Brief copied.'):copyStatus==='error'?t('Хуулж чадсангүй. Нооргийн бичвэрийг сонгож хуулна уу.','Could not copy. Select the brief text to copy it manually.'):''}</p>
     </details>
     <div className="finder-brief-footer">
      <div className="finder-brief-actions">
       <Link className="finder-project-cta" href={'/project-requests/?'+requestParams.toString()}>{t('Хүсэлтээ үргэлжлүүлэх','Continue to project request')} <ArrowRight size={18} aria-hidden="true"/></Link>
       {hasMatches&&<Link href="/explore/">{t('Бүх үйлчилгээг үзэх','Browse all services')} <ArrowUpRight size={16} aria-hidden="true"/></Link>}
      </div>
      <p className="finder-sign-in-note">{t('Хүсэлт илгээхэд бүртгэлээрээ нэвтэрсэн байх шаардлагатай.','You’ll need to be signed in to send a request.')}</p>
     </div>
    </div>
    <p className="finder-disclosure">{t('Чиглэлүүдийг таны бичсэн түлхүүр үг, үйлчилгээний ангилалд тулгуурлан санал болгов.','These approaches are suggested using keywords and service categories.')}</p>
   </div>}
  </div>
 </section>;
}
