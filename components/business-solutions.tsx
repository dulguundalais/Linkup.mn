'use client';
import Link from 'next/link';
import {ArrowUpRight,Bot,ChartNoAxesCombined,Clapperboard,Clock4,Workflow,BriefcaseBusiness,Sparkles} from 'lucide-react';
import '../app/business-solutions.css';
export default function BusinessSolutions({en}:{en:boolean}){
 const t=(mn:string,english:string)=>en?english:mn;
 // V60: short titles the owner named (Маркетинг, Автоматжуулалт, Брэнд, Онлайн үйлчилгээ); the outcome moves to the line below.
 const cards=[
  {id:'grow',mn:'Маркетинг',eng:'Marketing',descMn:'Илүү олон хэрэглэгчтэй болох',descEn:'Win more customers',need:'Манай бизнесийн борлуулалт, захиалга бага байна',englishNeed:'We need more sales and bookings',Icon:ChartNoAxesCombined},
  {id:'automate',mn:'Автоматжуулалт',eng:'Automation',descMn:'Гар ажиллагааг багасгаж, цаг хэмнэх',descEn:'Automate repetitive work',need:'Манай бизнесийн давтагддаг ажлыг автоматжуулах хэрэгтэй байна',englishNeed:'I need to automate our repetitive business processes',Icon:Workflow},
  {id:'content',mn:'Брэнд',eng:'Brand',descMn:'Брэнд, контентоо хөгжүүлэх',descEn:'Build content and brand',need:'Манай бизнесийн контент, Reels болон брэндийг сайжруулах хэрэгтэй',englishNeed:'We need better brand identity and social content',Icon:Clapperboard},
  {id:'launch',mn:'Онлайн үйлчилгээ',eng:'Online services',descMn:'Вэбсайт, онлайн захиалгаа эхлүүлэх',descEn:'Launch a website and online booking',need:'Манай бизнест вэбсайт болон онлайн захиалгын систем хэрэгтэй байна',englishNeed:'Our business needs a website and online booking',Icon:BriefcaseBusiness}
 ];
 return <section className="business-solutions-section" aria-labelledby="business-solutions-heading">
  <div className="shell business-solutions-inner">
   <div className="business-intro"><div><span className="business-overline">{t('Бизнесийн шийдэл','Business solutions')}</span><h2 id="business-solutions-heading">{t('Бизнесээ','Make business')}<br/><em>{t('урагшлуул.','move forward.')}</em></h2><p>{t('Зорилгодоо хүрэхэд туслах мэргэжилтнээ олоорой.','Find expertise for your next move.')}</p></div>
   <Link className="business-solution-main-cta" href="/solutions/?audience=business">{t('Шийдлээ олох','Find a solution')}<ArrowUpRight size={17}/></Link></div>
   <div className="business-solution-grid">{cards.map(({id,mn,eng,descMn,descEn,need,englishNeed,Icon},i)=><Link className="business-solution-card" href={'/solutions/?audience=business&q='+encodeURIComponent(en?englishNeed:need)} key={id}>
    <div className="business-card-top"><span className="business-solution-icon"><Icon size={25} strokeWidth={1.7}/></span><small>0{i+1}</small></div>
    <h3>{en?eng:mn}</h3><p>{en?descEn:descMn}</p>
    <span className="business-card-action">{t('Боломжуудыг харах','Explore solutions')} <ArrowUpRight size={16}/></span>
   </Link>)}</div>

  </div>
 </section>;
}
