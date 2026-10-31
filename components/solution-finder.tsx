'use client';
import {useEffect,useMemo,useRef,useState,type FormEvent} from 'react';
import Link from 'next/link';
import LinkupWordmark from './linkup-wordmark';
import {ArrowRight,ArrowUpRight,Send,Building2,Check,ClipboardCopy,Lightbulb,Search,Sparkles,UserRound,Workflow} from 'lucide-react';
import {marketplaceClient} from '../lib/marketplace/client';
import {buildProjectBrief,classifyNeed,matchingPublished,problemExamples,type Audience,type PublishedMatch} from '../lib/marketplace/solution-finder';
import '../app/solution-finder.css';

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
 const [copied,setCopied]=useState(false);
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
  setBudget((params.get('budget')||'').slice(0,80));
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
 const brief=useMemo(()=>buildProjectBrief(submitted,audience,en?'en':'mn',budget,timeline),[submitted,audience,en,budget,timeline]);
 const setType=(type:Audience)=>{setAudience(type);try{localStorage.setItem('hustle-buyer-audience',type)}catch{}};
 // Keep the search in the address bar so Back, refresh and sharing return to the same results.
 const remember=(need:string)=>{try{const url=new URL(location.href);url.searchParams.set('q',need);url.searchParams.set('audience',audience);history.replaceState(history.state,'',url)}catch{}};
 const run=(need:string)=>{setSubmitted(need);setCopied(false);setTooShort(false);remember(need);setReveal(r=>r+1)};
 const submit=(e:FormEvent<HTMLFormElement>)=>{e.preventDefault();const need=query.trim().slice(0,1200);if(need.length<5){setTooShort(true);needField.current?.focus();return}run(need)};
 const ask=(example:string)=>{setQuery(example);run(example)};
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
 const copy=async()=>{try{await navigator.clipboard.writeText(brief);setCopied(true)}catch{setCopied(false)}};
 return <section className={'solution-finder '+(compact?'finder-compact':'')} aria-labelledby="hustle-finder-title">
  <div className="solution-shell">
   {!compact&&!embedded&&<div className="solution-top"><Link href="/" className="solution-brand" aria-label="Linkup"><LinkupWordmark decorative/></Link><Link href="/explore/">{t('Бүх үйлчилгээг үзэх','Browse all services')} <ArrowUpRight size={16}/></Link></div>}
   <div className="finder-heading"><div className="finder-eyebrow"><Sparkles size={15}/>{t('LINKUP · Шийдэл хайх','LINKUP SMART FINDER · BETA')}</div>
    <h1 id="hustle-finder-title">{t('Ямар асуудал шийдэх хэрэгтэй байна?','What are you trying to solve?')}</h1>
    <p>{t('Үйлчилгээний нэрийг мэдэхгүй байсан ч болно. Хийлгэх ажлаа тайлбарлаарай. Бид боломжит шийдэл, тохирох үйлчилгээг санал болгоно.','No need to know the service name. Describe your challenge and explore possible solutions and real published services.')}</p>
   </div>
   <div className="finder-audience" role="group" aria-label={t('Төслийн төрөл','Project context')}>
    <button type="button" aria-pressed={audience==='business'} onClick={()=>setType('business')}><Building2 size={18}/>{t('Бизнес / байгууллага','Business / organization')}</button>
    <button type="button" aria-pressed={audience==='personal'} onClick={()=>setType('personal')}><UserRound size={18}/>{t('Хувийн төсөл','Personal project')}</button>
   </div>
   <form className="finder-form" onSubmit={submit} role="search" noValidate>
    <label htmlFor="hustle-need">{t('Хэрэгцээгээ тайлбарлана уу','Describe what you need')}</label>
    <textarea ref={needField} id="hustle-need" name="q" rows={compact?2:3} minLength={5} maxLength={1200} required aria-invalid={tooShort||undefined} aria-describedby={tooShort?'hustle-need-hint':undefined} value={query} onChange={e=>{setQuery(e.target.value);if(tooShort&&e.target.value.trim().length>=5)setTooShort(false)}} placeholder={t('Жишээ: Манай рестораны захиалгыг нэмэгдүүлэх хэрэгтэй. Хаанаас эхлэхээ мэдэхгүй байна.','Example: We want more restaurant bookings but do not know where to start.')}/>
    {tooShort&&<p className="finder-hint" id="hustle-need-hint" role="alert">{t('Дор хаяж 5 тэмдэгтээр хэрэгцээгээ бичнэ үү.','Describe your need in at least 5 characters.')}</p>}
    <div className="finder-form-foot"><span><Workflow size={15}/>{t('Кирилл · латин галиг · англи · нээлттэй туршилт','Mongolian · Latin · English · Free beta')}</span><button type="submit">{t('Шийдэл олох','Find solutions')} <ArrowRight size={18}/></button></div>
   </form>
   <div className="finder-prompts" aria-label={t('Түгээмэл асуудлын жишээ','Popular challenges')}>
    {problemExamples.map(item=><button type="button" key={item.key} onClick={()=>ask(en?item.exampleEn:item.exampleMn)}>{en?item.mn===item.en?item.en:item.en:item.mn} <ArrowUpRight size={14}/></button>)}
   </div>
   <p className="finder-sr-only" role="status">{submitted?t('Боломжит 3 чиглэл доор гарлаа.','3 possible directions are shown below.'):''}</p>
   {submitted&&<div className="finder-results" id="solution-results">
    <div className="finder-result-heading"><div><span className="finder-eyebrow"><Lightbulb size={15}/>{t('ТАНЫ БОЛОМЖИТ ЧИГЛЭЛ','POSSIBLE NEXT STEPS')}</span>
     <h2 ref={resultsTitle} tabIndex={-1}>{en?outcome.en:outcome.mn}</h2><p>{en?outcome.enWhy:outcome.mnWhy}</p></div><span className="finder-result-count">3 {t('шийдэл','approaches')}</span></div>
    <div className="finder-solution-grid">{outcome.solutions.map((idea,i)=>{
     const matches=matchingPublished(catalog,idea);
     return <article className="finder-solution-card" key={idea.id}>
      <span className="finder-number">0{i+1}</span><h3>{en?idea.en:idea.mn}</h3><p>{en?idea.whyEn:idea.whyMn}</p>
      {matches.length>0?<div className="finder-real-matches"><strong><Check size={15}/>{t('Нийтлэгдсэн үйлчилгээ','Published services')}</strong>{matches.map(service=><Link key={service.id} href={'/listing/?id='+encodeURIComponent(service.id)}>{en&&service.title_en?service.title_en:service.title}<ArrowUpRight size={15}/></Link>)}</div>
       :<div className="finder-no-match">{catalogState==='loading'?t('Бодит үйлчилгээг хайж байна…','Checking available services…'):catalogState==='error'?t('Одоогоор каталогт холбогдож чадсангүй.','Live catalog is temporarily unavailable.'):t('Одоогоор энэ чиглэлийн нийтлэгдсэн үйлчилгээ алга.','No published services in this area yet.')}</div>}
     </article>;
    })}</div>
    <div className="finder-brief">
     <div><span className="finder-eyebrow"><ClipboardCopy size={15}/>{t('ТӨСЛИЙН ХҮСЭЛТ','PROJECT BRIEF')}</span><h3>{t('Хийлгэх ажлаа тодорхойлоё','Turn your challenge into a clear brief')}</h3></div>
     <div className="finder-brief-fields"><label>{t('Төсөв (заавал биш)','Budget (optional)')}<input value={budget} onChange={e=>setBudget(e.target.value.slice(0,80))} maxLength={80} placeholder={t('Жишээ: 300,000–500,000 ₮','e.g., 300,000–500,000 MNT')}/></label><label>{t('Хугацаа (заавал биш)','Timeline (optional)')}<input value={timeline} onChange={e=>setTimeline(e.target.value.slice(0,80))} maxLength={80} placeholder={t('Жишээ: 2 долоо хоног','e.g., 2 weeks')}/></label></div>
     <pre className="finder-brief-preview">{brief}</pre>
     <div className="finder-brief-actions"><button type="button" onClick={()=>void copy()}><ClipboardCopy size={16}/>{copied?t('Хуулсан','Copied'):t('Хүсэлт хуулах','Copy project brief')}</button><Link href={'/explore/?q='+encodeURIComponent(submitted)}>{t('Мэргэжилтэн хайх','Browse freelancers')} <ArrowUpRight size={16}/></Link><Link className="finder-project-cta" href={'/project-requests/?'+new URLSearchParams({q:submitted,audience}).toString()}>{t('Асуудлаа мэргэжилтнүүдэд илгээх','Send a project to freelancers')} <Send size={16}/></Link></div>
     <p className="finder-disclosure">{t('Туршилтын хувилбар: түлхүүр үг, ангилалд тулгуурлан санал болгоно. AI зөвлөх хараахан ажиллахгүй. Санал болгосон шийдэл нь үр дүнгийн баталгаа биш.','This beta uses rule-based guidance, not a connected generative AI advisor. Suggestions do not guarantee a business outcome.')}</p>
    </div>
   </div>}
  </div>
 </section>;
}
