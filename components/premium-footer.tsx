import Link from 'next/link';
import LinkupWordmark from './linkup-wordmark';
import {ArrowUpRight,Compass,ShieldCheck} from 'lucide-react';
import '../app/v20-footer.css';
const columns=[
 {mn:'Marketplace',en:'Marketplace',links:[['/explore/','Үйлчилгээ хайх','Browse services'],['/categories/','Ангиллууд','Categories'],['/#how','Хэрхэн ажилладаг','How it works'],['/about/','Бидний тухай','About Linkup']]},
 {mn:'Захиалагчдад',en:'For buyers',links:[['/buyers/','Хэрхэн захиалах','How to buy'],['/explore/','Үнийн багцууд','Pricing packages'],['/buyer/','Миний захиалга','My orders'],['/faq/','Түгээмэл асуултууд','FAQ']]},
 {mn:'Мэргэжилтнүүдэд',en:'For freelancers',links:[['/join/seller/','Үйлчилгээ үзүүлэх','Start selling'],['/freelancers/','Мэргэжилтний гарын авлага','Seller guide'],['/seller-studio/','Seller Studio','Seller Studio'],['/referrals/','Түншлэлийн хөтөлбөр','Referral partners']]},
 {mn:'Мэдээлэл, тусламж',en:'Company & help',links:[['/about/','Бидний тухай','About us'],['/contact/','Тусламж авах','Contact & support'],['/terms/','Үйлчилгээний нөхцөл','Terms of use'],['/privacy/','Нууцлалын бодлого','Privacy policy'],['/cookies/','Cookie Policy','Cookie policy']]}
] as const;
export default function PremiumFooter({en}:{en:boolean}){
 const t=(mn:string,english:string)=>en?english:mn;
 return <footer className="hustle-premium-footer">
  <div className="footer-callout shell">
   <div><span className="footer-eyebrow">{t('Дараагийн төсөл','Your next project')}</span><h2>{t('Дараагийн санаагаа хэрэгжүүлээрэй.','Make your next move.')}</h2><p>{t('Чадвартай хүмүүс. Шинэ боломж.','Great people. Better possibilities.')}</p></div>
   <div className="footer-callout-actions"><Link href="/explore/" className="footer-main-cta">{t('Үйлчилгээ хайх','Explore services')}<ArrowUpRight size={18}/></Link><Link href="/join/seller/" className="footer-outline-cta">{t('Үйлчилгээ үзүүлэх','Become a freelancer')}</Link></div>
  </div>
  <div className="shell footer-columns">
   <div className="footer-brand"><Link href="/" className="footer-logo" aria-label="Linkup"><LinkupWordmark decorative/></Link><p>{t('Мэргэжилтэн, захиалагчийг холбох Монгол платформ.','A creative marketplace for Mongolia.')}</p><div className="footer-status"><ShieldCheck size={16}/>{t('Нээлттэй туршилт · төлбөр авахгүй','Open beta · No real payments')}</div></div>
   {columns.map(col=><nav key={col.en} aria-label={en?col.en:col.mn}><h3>{en?col.en:col.mn}</h3>{col.links.map(([href,mn,english])=><Link href={href} key={href+english}>{en?english:mn}</Link>)}</nav>)}
  </div>
  <div className="shell footer-bottom"><span>© 2026 Linkup. {t('Бүх эрх хуулиар хамгаалагдсан.','All rights reserved.')}</span><span className="footer-bottom-note"><Compass size={15}/>{t('Монголд хөгжүүлж буй нээлттэй бета платформ','An open beta marketplace built for Mongolia')}</span><nav aria-label={t('Хууль эрх зүйн холбоосууд','Legal links')}><Link href="/privacy/">{t('Нууцлал','Privacy')}</Link><Link href="/terms/">{t('Үйлчилгээний нөхцөл','Terms')}</Link><Link href="/cookies/">{t('Күүки','Cookies')}</Link></nav></div>
 </footer>;
}
