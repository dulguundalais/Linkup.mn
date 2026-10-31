'use client';
import {useEffect,useRef,useState,type KeyboardEvent} from 'react';
import {createPortal} from 'react-dom';
import Link from 'next/link';
import LinkupWordmark from './linkup-wordmark';
import {ArrowLeft,ArrowRight,ArrowUpRight,Building2,Check,ChevronDown,ClipboardCopy,Compass,LoaderCircle,Search,Sparkles,UserRound,X,Workflow,TrendingUp,Monitor,Clapperboard,Palette,ChartNoAxesCombined,Ellipsis} from 'lucide-react';
import {marketplaceClient} from '../lib/marketplace/client';
import {buildProjectBrief,classifyNeed,matchingPublished,type Audience,type PublishedMatch} from '../lib/marketplace/solution-finder';
import {guidedGoals,guidedProblem,type GuidedGoal,type GuidedGoalKey} from '../lib/marketplace/guided-entry';
import '../app/guided-entry.css';

const icons={growth:TrendingUp,automation:Workflow,web:Monitor,content:Clapperboard,brand:Palette,analytics:ChartNoAxesCombined,design:Palette,skills:Sparkles,'personal-it':Monitor,video:Clapperboard,writing:Compass,other:Ellipsis};
type Screen='choose'|'results';
type CatalogStatus='loading'|'ready'|'unavailable';

export default function GuidedEntry({en}:{en:boolean}){
 const [open,setOpen]=useState(false);
 // V51: remember which path the visitor last chose so the hero selector shows it as current.
 const [remembered,setRemembered]=useState<Audience|null>(null);
 useEffect(()=>{try{const a=localStorage.getItem('hustle-buyer-audience');if(a==='personal'||a==='business')setRemembered(a)}catch{}},[]);
 const [audience,setAudience]=useState<Audience>('business');
 const [screen,setScreen]=useState<Screen>('choose');
 const [goal,setGoal]=useState<GuidedGoal>(guidedGoals.business[0]);
 const [notes,setNotes]=useState(''),[budget,setBudget]=useState(''),[timeline,setTimeline]=useState('');
 const [detailsOpen,setDetailsOpen]=useState(false),[copied,setCopied]=useState(false);
 const [catalog,setCatalog]=useState<PublishedMatch[]>([]);
 const [catalogStatus,setCatalogStatus]=useState<CatalogStatus>('loading');
 const modalRef=useRef<HTMLDivElement>(null),triggerRef=useRef<HTMLElement|null>(null);
 const t=(mn:string,english:string)=>en?english:mn;
 const problem=guidedProblem(goal,notes,en);
 const outcome=classifyNeed(problem);
 const brief=buildProjectBrief(problem,audience,en?'en':'mn',budget,timeline);
 const allMatches=outcome.solutions.flatMap(solution=>matchingPublished(catalog,solution,2));
 const countUnique=new Set(allMatches.map(m=>m.id)).size;
 const close=()=>setOpen(false);
 const start=(kind:Audience)=>{
  triggerRef.current=document.activeElement instanceof HTMLElement?document.activeElement:null;
  setAudience(kind);setGoal(guidedGoals[kind][0]);setScreen('choose');
  setNotes('');setBudget('');setTimeline('');setDetailsOpen(false);setCopied(false);
  setOpen(true);
  setRemembered(kind);
  try{localStorage.setItem('hustle-buyer-audience',kind)}catch{}
 };
 const choose=(item:GuidedGoal)=>{
  setGoal(item);setNotes('');setDetailsOpen(false);setScreen('results');
 };
 const copy=async()=>{try{await navigator.clipboard.writeText(brief);setCopied(true)}catch{setCopied(false)}};
 useEffect(()=>{
  if(!open)return;
  let active=true;
  setCatalogStatus('loading');
  void marketplaceClient().then(db=>db.rpc('marketplace_catalog')).then(result=>{
   if(!active)return;
   if(result.error)throw result.error;
   setCatalog(Array.isArray(result.data)?result.data as PublishedMatch[]:[]);
   setCatalogStatus('ready');
  }).catch(()=>{if(active){setCatalog([]);setCatalogStatus('unavailable')}});
  return()=>{active=false};
 },[open]);
 useEffect(()=>{
  if(!open)return;
  const priorOverflow=document.body.style.overflow;
  document.body.style.overflow='hidden';
  const nextFrame=requestAnimationFrame(()=>modalRef.current?.querySelector<HTMLElement>('.guided-modal-close')?.focus());
  const onKey=(event:globalThis.KeyboardEvent)=>{
   if(event.key==='Escape'){event.preventDefault();close();return}
   if(event.key!=='Tab'||!modalRef.current)return;
   const list=[...modalRef.current.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input:not([disabled]),textarea:not([disabled]),[tabindex="0"]')].filter(el=>el.getClientRects().length>0);
   if(!list.length)return;
   if(event.shiftKey&&document.activeElement===list[0]){event.preventDefault();list[list.length-1].focus()}
   else if(!event.shiftKey&&document.activeElement===list[list.length-1]){event.preventDefault();list[0].focus()}
  };
  document.addEventListener('keydown',onKey);
  return()=>{cancelAnimationFrame(nextFrame);document.removeEventListener('keydown',onKey);document.body.style.overflow=priorOverflow;triggerRef.current?.focus()};
 },[open]);
 useEffect(()=>{
  if(!open)return;
  const id=requestAnimationFrame(()=>modalRef.current?.querySelector<HTMLElement>('.guided-modal-close')?.focus());
  return()=>cancelAnimationFrame(id);
 },[screen,open]);
 return <>
  <div className="guided-entry-intro" aria-labelledby="guided-entry-title">
   <h2 id="guided-entry-title">{t('Эсвэл хэрэгцээнээсээ эхлээрэй','Or start with a goal')}</h2>
   <div className="guided-entry-choices">
    <button type="button" className={'guided-entry-choice'+(remembered==='personal'?' is-current':'')} onClick={()=>start('personal')} aria-haspopup="dialog">
     <span className="guided-entry-symbol"><UserRound size={24} strokeWidth={1.8}/></span><span className="guided-entry-choice-copy"><strong>{t('Хувь хүн','Personal')}</strong><small>{t('Хувийн ажил','Personal work')}</small></span><ArrowUpRight size={19}/>
    </button>
    <button type="button" className={'guided-entry-choice guided-entry-business'+(remembered==='business'?' is-current':'')} onClick={()=>start('business')} aria-haspopup="dialog">
     <span className="guided-entry-symbol"><Building2 size={24} strokeWidth={1.8}/></span><span className="guided-entry-choice-copy"><strong>{t('Бизнес / байгууллага','Business')}</strong><small>{t('Бизнесийн хэрэгцээ','Business needs')}</small></span><ArrowUpRight size={19}/>
    </button>
   </div>
  </div>
  {open&&typeof document!=='undefined'&&createPortal(<div className="guided-modal-backdrop" onPointerDown={e=>{if(e.target===e.currentTarget)close()}}>
   <div ref={modalRef} className="guided-modal guided-simplified" role="dialog" aria-modal="true" aria-labelledby="guided-dialog-title" aria-describedby="guided-dialog-description">
    <div className="guided-modal-header">
     <div className="guided-modal-mark"><LinkupWordmark decorative className="guided-modal-wordmark"/><small>{t('LINKUP · Хэрэгцээгээ тодорхойлох','LINKUP / GUIDED DISCOVERY')}</small></div>
     <button type="button" className="guided-modal-close" aria-label={t('Хаах','Close')} onClick={close}><X size={19}/></button>
    </div>
    <div className="guided-modal-body">
     <div className="guided-step-meta"><span>{audience==='business'?<Building2 size={15}/>:<UserRound size={15}/>} {audience==='business'?t('Бизнесийн хэрэгцээ','For business'):t('Хувийн хэрэгцээ','For personal projects')}</span><span>{screen==='choose'?'01 / 02':'02 / 02'}</span></div>
     {screen==='choose'?<>
      <span className="guided-step-eyebrow">{t('Хэрэгцээгээ тодорхойлоё','START WITH A GOAL')}</span>
      <h2 id="guided-dialog-title">{audience==='business'?t('Юуг сайжруулахыг хүсэж байна?','What would you like to improve?'):t('Ямар ажилд тусламж хэрэгтэй вэ?','What can we help you with?')}</h2>
      <p id="guided-dialog-description">{t('Чиглэлээ сонгоод тохирох шийдлүүдийг хараарай.','Pick a goal to see relevant solutions immediately.')}</p>
      <div className="guided-goals">{guidedGoals[audience].map(item=>{
       const Icon=icons[item.key as GuidedGoalKey];
       return <button className="guided-goal" type="button" key={item.key} onClick={()=>choose(item)}>
        <span className="guided-goal-icon"><Icon size={20}/></span><span>{en?item.en:item.mn}</span><ArrowUpRight size={16} className="guided-goal-next"/>
       </button>;
      })}</div>
      <div className="guided-custom-need">
       <label className="guided-label" htmlFor="guided-custom-problem">{t('Эсвэл асуудлаа өөрийн үгээр бич','Or describe it in your own words')}</label>
       <div className="guided-custom-row"><input id="guided-custom-problem" value={notes} maxLength={1200} onChange={event=>setNotes(event.target.value)} placeholder={t('Хэрэгцээгээ өөрийн үгээр бичээрэй','e.g. Our restaurant needs more bookings…')}/><button type="button" disabled={notes.trim().length<5} onClick={()=>setScreen('results')} aria-label={t('Тохирох шийдэл харах','Find solutions for my challenge')}><Search size={18}/><ArrowRight size={15}/></button></div>
      </div>
     </>:<>
      <span className="guided-step-eyebrow"><Sparkles size={14}/>{t('ТАНД ТОХИРОХ ШИЙДЛҮҮД','SOLUTIONS TO CONSIDER')}</span>
      <h2 id="guided-dialog-title">{en?outcome.en:outcome.mn}</h2>
      <p id="guided-dialog-description">{en?outcome.enWhy:outcome.mnWhy}</p>
      <div className="guided-result-list">
       {outcome.solutions.map((solution,index)=>{
        const matches=matchingPublished(catalog,solution,2);
        return <article key={solution.id} className="guided-result-card">
         <span className="guided-rec-index">0{index+1}</span>
         <div className="guided-result-content"><h3>{en?solution.en:solution.mn}</h3><p>{en?solution.whyEn:solution.whyMn}</p>
          {matches.length>0&&<div className="guided-published-list"><span>{t('Нийтлэгдсэн үйлчилгээ','PUBLISHED SERVICE')}</span>{matches.map(item=><Link key={item.id} href={'/listing/?id='+encodeURIComponent(item.id)} onClick={close}>{en&&item.title_en?item.title_en:item.title}<ArrowUpRight size={15}/></Link>)}</div>}
         </div>
        </article>;
       })}</div>
      {catalogStatus==='loading'?<div className="guided-match-status"><LoaderCircle size={15}/>{t('Нийтлэгдсэн үйлчилгээнүүдийг хайж байна…','Loading published services…')}</div>
       :catalogStatus==='unavailable'?<div className="guided-match-status">{t('Үйлчилгээг ачаалж чадсангүй. Үйлчилгээний жагсаалтаас дахин хайж үзээрэй.','Live catalog is temporarily unavailable. You can still browse services.')}</div>
       :countUnique===0?<div className="guided-match-status">{t('Одоогоор тохирох үйлчилгээ алга. Та төслийн хүсэлт бэлдэж болно.','No exact published match yet. You can still prepare a project brief.')}</div>:null}
      <div className="guided-optional">
       <button type="button" className="guided-optional-toggle" aria-expanded={detailsOpen} onClick={()=>setDetailsOpen(v=>!v)}><ClipboardCopy size={16}/>{t('Төслийн хүсэлт бэлдэх (заавал биш)','Prepare a project brief (optional)')}<ChevronDown size={17}/></button>
       {detailsOpen&&<div className="guided-optional-content">
        <div className="guided-field-grid"><label className="guided-label">{t('Төсөв','Budget')}<input value={budget} onChange={e=>setBudget(e.target.value.slice(0,80))} placeholder={t('Жишээ: 500,000 ₮','e.g. 500,000 MNT')}/></label><label className="guided-label">{t('Хугацаа','Timeline')}<input value={timeline} onChange={e=>setTimeline(e.target.value.slice(0,80))} placeholder={t('Жишээ: 2 долоо хоног','e.g. 2 weeks')}/></label></div>
        <pre className="guided-brief-preview">{brief}</pre>
        <button className="guided-copy" type="button" onClick={()=>void copy()}><ClipboardCopy size={15}/>{copied?t('Хуулсан ✓','Copied ✓'):t('Хүсэлт хуулах','Copy brief')}</button>
       </div>}
      </div>
     </>}
    </div>
    <div className="guided-modal-footer">
     <button className="guided-back" type="button" onClick={()=>{if(screen==='results'){setScreen('choose');setDetailsOpen(false)}else close()}}><ArrowLeft size={16}/>{screen==='results'?t('Өөр чиглэл сонгох','Change goal'):t('Болих','Cancel')}</button>
     <div className="guided-modal-footer-actions">
      {screen==='results'?<>
       <Link className="guided-secondary-link" href="/explore/" onClick={close}>{t('Бүх үйлчилгээ','All services')}</Link><Link className="guided-request-cta" href={'/project-requests/?'+new URLSearchParams({q:problem,audience}).toString()} onClick={close}>{t('Төслийн хүсэлт илгээх','Post a project')}</Link>
       <Link className="guided-next" href={'/solutions/?'+new URLSearchParams({audience,q:problem,...(budget.trim()?{budget:budget.trim()}:{}),...(timeline.trim()?{timeline:timeline.trim()}:{})}).toString()} onClick={close}>{t('Илүү дэлгэрэнгүй','Explore more')}<ArrowUpRight size={17}/></Link>
      </>:<span className="guided-selection-hint">{t('Нэг чиглэл сонгоход л хангалттай','Select a goal above')}</span>}
     </div>
    </div>
    <div className="guided-modal-bottomline">{t('Туршилтын хувилбар: түлхүүр үг, ангилалд тулгуурлан санал болгоно. AI зөвлөх хараахан ажиллахгүй.','Smart Finder beta uses transparent rule-based guidance, not a connected AI model.')}</div>
   </div>
  </div>,document.body)}
 </>;
}
