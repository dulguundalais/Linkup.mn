'use client';
import {useEffect,useState,type FormEvent} from 'react';
import Link from 'next/link';
import {ArrowUpRight,ArrowRight,CheckCircle2,ShieldCheck,Copy,Share2,Users,ChartNoAxesCombined,HandHeart,Clock3,LockKeyhole,ChevronDown,LoaderCircle} from 'lucide-react';
import SiteHeader,{useSiteAccount} from './site-header';
import PremiumFooter from './premium-footer';
import {marketplaceClient} from '../lib/marketplace/client';
import {signInWithReturn} from '../lib/marketplace/ux-flows';
import '../app/marketplace.css';
import '../app/partner-program.css';
import '../app/v54-page-unification.css';

type Membership={user_id:string;display_name:string;partner_kind:'individual'|'business';promotion_channel:string;website:string;tier:'community'|'growth';status:'active'|'suspended';created_at:string};
type Referral={id:string;partner_id:string;status:string;created_at:string};
type Reward={id:string;estimated_amount:number;state:string;created_at:string};
type Rules={partner_percent:number;active_partner_percent:number;attribution_days:number};
const txt=(en:boolean,mn:string,eng:string)=>en?eng:mn;
export default function PartnerProgram(){
 const session=useSiteAccount();
 const [en,setEn]=useState(false),[dark,setDark]=useState(false);
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const [membership,setMembership]=useState<Membership|null>(null),[code,setCode]=useState('');
 const [referrals,setReferrals]=useState<Referral[]>([]),[rewards,setRewards]=useState<Reward[]>([]);
 const [rules,setRules]=useState<Rules>({partner_percent:1,active_partner_percent:2,attribution_days:30});
 const [name,setName]=useState(''),[kind,setKind]=useState<'individual'|'business'>('individual'),[channel,setChannel]=useState(''),[website,setWebsite]=useState(''),[accept,setAccept]=useState(false);
 const t=(mn:string,english:string)=>txt(en,mn,english);
 useEffect(()=>{try{setEn(localStorage.getItem('hustle-language')==='en');setDark(localStorage.getItem('hustle-theme')==='dark')}catch{}},[]);
 async function refresh(){
  setLoading(true);setError('');
  try{
   const db=await marketplaceClient();
   const [auth,settings]=await Promise.all([db.auth.getUser(),db.from('business_rules').select('partner_percent,active_partner_percent,attribution_days').eq('id',true).maybeSingle()]);
   if(settings.data)setRules(settings.data as Rules);
   const user=auth.data.user;
   if(!user){setMembership(null);setCode('');setReferrals([]);setRewards([]);return}
   const [m,c,rs,rw,profile]=await Promise.all([
    db.from('partner_memberships').select('user_id,display_name,partner_kind,promotion_channel,website,tier,status,created_at').eq('user_id',user.id).maybeSingle(),
    db.from('partner_codes').select('code').eq('partner_id',user.id).maybeSingle(),
    db.from('referrals').select('id,partner_id,status,created_at').eq('partner_id',user.id).order('created_at',{ascending:false}),
    db.from('partner_rewards').select('id,estimated_amount,state,created_at').eq('partner_id',user.id).order('created_at',{ascending:false}),
    db.from('profiles').select('display_name').eq('id',user.id).maybeSingle()
   ]);
   // Preview may deploy before the separately-reviewed V53 migration.
   if(m.error){if(/relation|schema cache|could not find the table/i.test(m.error.message))throw new Error(t('Түншийн бүртгэл одоогоор идэвхгүй байна. Тун удахгүй боломжтой болно.','Partner enrollment is not available in this preview yet.'));throw m.error}
   for(const r of [c,rs,rw])if(r.error)throw r.error;
   setMembership(m.data as Membership|null);setCode(c.data?.code||'');setReferrals((rs.data||[]) as Referral[]);setRewards((rw.data||[]) as Reward[]);
   setName(old=>old||m.data?.display_name||profile.data?.display_name||user.email?.split('@')[0]||'');
  }catch(e){setError(e instanceof Error?e.message:t('Мэдээлэл ачаалж чадсангүй.','Could not load partner information.'))}
  finally{setLoading(false)}
 }
 useEffect(()=>{void refresh()},[session.sessionState]);
 async function enroll(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(busy||!accept)return;
  setBusy(true);setError('');setNotice('');
  try{
   const db=await marketplaceClient();
   const result=await db.rpc('enroll_community_partner',{p_name:name.trim(),p_kind:kind,p_channel:channel.trim(),p_website:website.trim(),p_accept:accept});
   if(result.error)throw result.error;
   setNotice(t('Түншийн эрх идэвхжлээ. Таны хувийн холбоос бэлэн.','Your partner membership is active and your link is ready.'));
   await refresh();
  }catch(e){setError(e instanceof Error?e.message:t('Бүртгэл амжилтгүй.','Enrollment failed.'))}
  finally{setBusy(false)}
 }
 const link=typeof window!=='undefined'&&code?window.location.origin+'/?ref='+encodeURIComponent(code):'';
 async function copy(){try{await navigator.clipboard.writeText(link);setNotice(t('Холбоосыг хууллаа.','Link copied.'))}catch{setError(t('Холбоосыг хуулж чадсангүй.','Unable to copy link.'))}}
 async function share(){if(!link)return;try{if(navigator.share)await navigator.share({title:'Linkup',url:link});else await copy()}catch{/* User cancelled native share */}}
 const total=rewards.filter(x=>x.state==='simulated').reduce((a,b)=>a+Number(b.estimated_amount||0),0);
 const money=(n:number)=>new Intl.NumberFormat('mn-MN',{maximumFractionDigits:2}).format(n)+' ₮';
 const steps=[
  ['01',t('Нэгдэх','Join'),t('Нэг аккаунтаараа түнш болж, нөхцөлийг зөвшөөрнө.','Join with your existing account and accept the program terms.')],
  ['02',t('Холбоос авах','Get your link'),t('Таны давтагдашгүй урилгын холбоос автоматаар үүснэ.','Receive your personal referral link automatically.')],
  ['03',t('Хуваалцах','Share'),t('Холбоосоороо шинэ захиалагч, бизнесийг Linkup-д урь.','Introduce new clients and businesses to Linkup.')],
  ['04',t('Үр дүн хянах','Track'),t('Бүртгэл, баталгаажсан захиалга, туршилтын урамшууллаа хянана.','Track qualified signups, orders and simulated rewards.')]
 ];
 return <div className={'hustle-v5 partner-program '+(dark?'night':'')}>
  <SiteHeader en={en} onToggleLanguage={()=>{setEn(!en);try{localStorage.setItem('hustle-language',en?'mn':'en')}catch{}}} dark={dark} onToggleTheme={()=>{setDark(!dark);try{localStorage.setItem('hustle-theme',dark?'light':'dark')}catch{}}} session={session}/>
  <main id="main">
   <section className="pp-hero"><div className="shell pp-hero-grid">
    <div><span className="signature-section-eyebrow">{t('LINKUP · ТҮНШЛЭЛ','LINKUP · PARTNERS')}</span><h1>{t('Холбоогоо','Make your network')} <em>{t('боломж болго.','work for you.')}</em></h1><p>{t('Хэрэгтэй үйлчилгээ, чадварлаг хүмүүсийг шинэ захиалагчтай холбо. Үнэгүй түншлэлийн хөтөлбөрт нэгдээд урилгынхаа үр дүнг нэг дор хянаарай.','Connect great work with people who need it. Join for free, share a personal link and track your referrals in one place.')}</p><div className="pp-hero-actions"><a className="pp-primary" href="#partner-join">{membership?t('Миний самбар','My dashboard'):t('Түнш болох','Become a Partner')}<ArrowUpRight size={19}/></a><a className="pp-secondary" href="#how-partner">{t('Хэрхэн ажиллах вэ?','How it works')}<ArrowRight size={18}/></a></div><span className="pp-beta"><ShieldCheck size={16}/>{t('Нээлттэй бета · Урамшуулал зөвхөн туршилтын тооцоо','Open beta · Rewards are simulations, not payouts')}</span></div>
    <div className="pp-hero-aside" aria-hidden="true"><div className="pp-visual-label">LINKUP / PARTNERS</div><div className="pp-orbit"><HandHeart size={48}/></div><div className="pp-visual-line"><i/><span>GROW TOGETHER</span><i/></div><div className="pp-visual-metrics"><span>01<small>CONNECT</small></span><span>02<small>CREATE</small></span><span>03<small>GROW</small></span></div></div>
   </div></section>
   <section className="pp-section shell" id="how-partner"><div className="pp-heading"><span className="signature-section-eyebrow">{t('ХЭРХЭН АЖИЛЛАДАГ','HOW IT WORKS')}</span><h2>{t('Дөрвөн алхам. Нэг боломж.','Four steps. One opportunity.')}</h2></div><div className="pp-steps">{steps.map(([n,title,desc])=><article className="pp-step" key={n}><span className="pp-step-number">{n}</span><h3>{title}</h3><p>{desc}</p></article>)}</div></section>
   <section className="pp-section shell" id="benefits"><div className="pp-heading"><span className="signature-section-eyebrow">{t('УРАМШУУЛЛЫН НӨХЦӨЛ','PROGRAM REWARDS')}</span><h2>{t('Ил тод, ойлгомжтой нөхцөл','A clear, transparent program')}</h2><p>{t('Урамшууллын хувь нь баталгаажсан захиалгын үнийн дүнгээс тооцогдох саналчилсан нөхцөл юм. Бета шатанд мөнгөн төлбөр олгохгүй.','Percentages are based on an eligible completed order value. No cash payments are made during beta.')}</p></div><div className="pp-tiers"><article className="pp-tier"><span>{t('Нийтийн түнш','Community Partner')}</span><h3>{rules.partner_percent}%</h3><p>{t('Имэйлээ баталгаажуулсан хэрэглэгч шууд нэгдэнэ.','Join automatically with a verified account.')}</p><div className="pp-tier-foot"><CheckCircle2 size={18}/>{t('Үнэгүй · Автомат идэвхжил','Free · Instant enrollment')}</div></article><article className="pp-tier"><span>{t('Идэвхтэй түнш','Growth Partner')}</span><h3>{rules.active_partner_percent}%</h3><p>{t('Шалгуур хангасан түншид админ нэмэлт эрх олгоно.','An enhanced tier granted to qualifying partners.')}</p><div className="pp-tier-foot"><ShieldCheck size={18}/>{t('Тусгай эрх · Админ хяналт','Qualified · Admin managed')}</div></article><article className="pp-tier pp-window"><Clock3 size={24}/><h3>{rules.attribution_days} {t('хоног','days')}</h3><p>{t('Урилгын хамаарлыг бүртгэх хугацаа. Бодит мөнгөн төлбөр болон эскроу одоогоор байхгүй.','Signup attribution window. Live financial settlement and escrow are not enabled.')}</p></article></div></section>
   <section className="pp-section shell" id="partner-join"><div className="pp-heading"><span className="signature-section-eyebrow">{t('ТАНЫ ТҮНШЛЭЛ','YOUR PARTNERSHIP')}</span><h2>{membership?t('Миний түншийн самбар','Your partner dashboard'):t('Хамтдаа өсөцгөөе','Start growing together')}</h2><p>{membership?t('Бодит тоо, тодорхой төлөв, нэг холбоос.','Your real beta activity in one place.'):t('Нэг аккаунтаараа захиалагч, мэргэжилтэн, түнш байж болно.','One account can be a buyer, freelancer and partner.')}</p></div>
    {error&&<p className="pp-alert pp-error" role="alert">{error}</p>}{notice&&<p className="pp-alert pp-success" role="status">{notice}</p>}
    {loading||session.sessionState==='checking'?<div className="pp-state"><LoaderCircle className="pp-spin" size={24}/>{t('Мэдээлэл ачаалж байна…','Loading your account…')}</div>:session.sessionState!=='signed-in'?<div className="pp-join-card"><div><h3>{t('Эхлээд нэвтэрнэ үү','Sign in to join')}</h3><p>{t('Одоо байгаа Linkup аккаунтаараа нэвтрээд энэ хуудас руу буцаж ирнэ.','Sign in with your existing Linkup account and return here to activate your membership.')}</p></div><Link className="pp-primary" href={signInWithReturn('/referrals/?join=1','buyer')}>{t('Нэвтрэх / Бүртгүүлэх','Sign in / Sign up')}<ArrowUpRight size={18}/></Link></div>:membership?<div className="pp-dashboard">
     <div className="pp-member-top"><div><span className="pp-member-tier">{membership.tier==='growth'?t('Идэвхтэй түнш','Growth Partner'):t('Нийтийн түнш','Community Partner')}</span><h3>{membership.display_name}</h3></div><span className={'pp-status '+(membership.status==='active'?'pp-active':'pp-suspended')}>{membership.status==='active'?t('Идэвхтэй','Active'):t('Түр зогсоосон','Suspended')}</span></div>
     {membership.status==='suspended'&&<p className="pp-alert pp-error">{t('Таны түншийн эрх түр зогссон. Холбоосоо түгээхээсээ өмнө тусламж авна уу.','Your membership is suspended. Contact support before sharing referrals.')}</p>}
     <div className="pp-metrics"><div><small>{t('Урилгаар бүртгүүлсэн','Referred registrations')}</small><b>{referrals.length}</b></div><div><small>{t('Баталгаажсан урилга','Verified referrals')}</small><b>{referrals.filter(x=>x.status==='verified').length}</b></div><div><small>{t('Туршилтын урамшуулал','Simulated rewards')}</small><b>{money(total)}</b></div></div>
     {code?<div className="pp-link-box"><label>{t('Таны хувийн холбоос','Your personal referral link')}</label><div className="pp-link-controls"><input readOnly aria-label={t('Таны урилгын холбоос','Your referral URL')} value={link}/><button type="button" onClick={()=>void copy()}><Copy size={17}/>{t('Хуулах','Copy')}</button><button type="button" onClick={()=>void share()}><Share2 size={17}/>{t('Хуваалцах','Share')}</button></div><p>{t('Холбоосын эхлэл орчноосоо хамааран автоматаар өөрчлөгдөнө.','The link uses the current preview or production origin automatically.')}</p></div>:<div className="pp-alert pp-error">{t('Түншийн код олдсонгүй. Тусламж авна уу.','Your code could not be loaded. Please contact support.')}</div>}
     <h3 className="pp-table-title">{t('Сүүлийн урилгууд','Recent referrals')}</h3>
     {referrals.length?<div className="pp-table-wrap"><table><thead><tr><th>{t('Урилгын дугаар','Referral')}</th><th>{t('Огноо','Date')}</th><th>{t('Төлөв','Status')}</th></tr></thead><tbody>{referrals.map(r=><tr key={r.id}><td>#{r.id.slice(0,8)}</td><td>{new Date(r.created_at).toLocaleDateString(en?'en-US':'mn-MN')}</td><td>{r.status==='verified'?t('Баталгаажсан','Verified'):r.status==='rejected'?t('Татгалзсан','Rejected'):t('Хүлээгдэж буй','Pending')}</td></tr>)}</tbody></table></div>:<div className="pp-empty">{t('Одоогоор урилга бүртгэгдээгүй. Хувийн холбоосоо хуваалцаж эхлээрэй.','No referrals yet. Share your personal link to get started.')}</div>}
     <p className="pp-disclaimer">{t('Бүх урамшуулал бета туршилтын тооцоо бөгөөд бодит мөнгө олгохгүй.','All rewards are beta simulations; no payouts or monetary claims.')}</p>
    </div>:<form className="pp-form" onSubmit={e=>void enroll(e)}>
      <div className="pp-form-header"><h3>{t('Түншийн мэдээлэл','Partner information')}</h3><p>{t('Мэдээллээ бөглөж, нөхцөл зөвшөөрмөгц хувийн холбоос үүснэ.','Complete the form and accept the program terms to get your link.')}</p></div>
      <div className="pp-form-grid"><label>{t('Нэр / Байгууллагын нэр','Name / Organization')}<input required minLength={2} maxLength={100} value={name} onChange={e=>setName(e.target.value)}/></label><label>{t('Түншийн төрөл','Partner type')}<select value={kind} onChange={e=>setKind(e.target.value as 'individual'|'business')}><option value="individual">{t('Хувь хүн','Individual')}</option><option value="business">{t('Байгууллага','Business')}</option></select></label><label>{t('Танилцуулах үндсэн суваг','Promotion channel')}<input required minLength={2} maxLength={120} placeholder={t('Жишээ: Facebook, LinkedIn','e.g. Facebook, LinkedIn')} value={channel} onChange={e=>setChannel(e.target.value)}/></label><label>{t('Вэб / Сошиал холбоос (заавал биш)','Website / Social link (optional)')}<input type="url" maxLength={250} placeholder="https://" value={website} onChange={e=>setWebsite(e.target.value)}/></label></div>
      <label className="pp-consent"><input type="checkbox" required checked={accept} onChange={e=>setAccept(e.target.checked)}/><span>{t('Partner хөтөлбөрийн дүрэм, 30 хоногийн хамаарлын нөхцөл болон бета туршилтын үед мөнгөн урамшуулал олгохгүйг ойлгож зөвшөөрч байна.','I accept the program rules, attribution window and beta-only simulated rewards with no payouts.')} <Link href="/terms/">{t('Үйлчилгээний нөхцөл','Terms')}</Link></span></label>
      <button className="pp-primary" type="submit" disabled={busy||!accept}>{busy?t('Бүртгэж байна…','Activating…'):t('Түнш болж, холбоос авах','Activate and get my link')}<ArrowUpRight size={19}/></button>
    </form>}
   </section>
   <section className="pp-section shell pp-faq" id="partner-faq"><div className="pp-heading"><span className="signature-section-eyebrow">FAQ</span><h2>{t('Түгээмэл асуулт','Frequently asked questions')}</h2></div>
    {[
      [t('Түнш болохын тулд админ зөвшөөрөх үү?','Do I need approval?'),t('Нийтийн түншийн эрхийг имэйлээ баталгаажуулсан хэрэглэгч автоматаар авна. Өндөр түвшний эрхийг админ олгоно.','Verified members can join Community Partner automatically. Growth tier requires a review.')],
      [t('Зөвхөн холбоос дээр дарвал урамшуулал тооцох уу?','Do clicks earn rewards?'),t('Үгүй. Зөвхөн шаардлага хангасан, гүйцэтгэсэн захиалга туршилтын урамшуулалд тооцогдоно.','No. Only qualifying completed orders may generate simulated rewards.')],
      [t('Одоо бодит мөнгө авах уу?','Will I receive real money?'),t('Үгүй. Бета шатанд бүх урамшуулал туршилтын тооцоо бөгөөд шилжүүлэг хийхгүй.','No. All beta reward figures are simulated, with no payouts.')],
      [t('Би Seller эсвэл Buyer хэвээр байж болох уу?','Can I stay a buyer or seller?'),t('Тийм. Түншийн эрх нь таны захиалагч болон мэргэжилтний эрхийг өөрчлөхгүй.','Yes. Partner access does not replace buyer or seller access.')]
    ].map(([q,a])=><details key={q}><summary>{q}<ChevronDown size={18}/></summary><p>{a}</p></details>)}
   </section>
  </main><PremiumFooter en={en}/>
 </div>;
}