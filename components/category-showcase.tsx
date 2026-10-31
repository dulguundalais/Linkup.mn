'use client';
import Link from 'next/link';
import {ArrowUpRight,Bot,BriefcaseBusiness,ChartNoAxesCombined,Code2,GraduationCap,HeartHandshake,Megaphone,Palette,Scale,ShoppingBag,type LucideIcon} from 'lucide-react';
import {SHOWCASE} from '../lib/marketplace/taxonomy';
import '../app/v50-categories.css';

/* V60 homepage categories (owner spec): every main category at a glance as a
   compact grid of tiles — icon, name, arrow — instead of a sideways carousel.
   Links and order come from SHOWCASE, as before. */
const ICONS:Record<string,LucideIcon>={
 ai:Bot,business:BriefcaseBusiness,marketing:Megaphone,tech:Code2,'legal-finance':Scale,
 creative:Palette,research:ChartNoAxesCombined,commerce:ShoppingBag,education:GraduationCap,wellbeing:HeartHandshake
};
export default function CategoryShowcase({en}:{en:boolean}){
 const t=(mn:string,eng:string)=>en?eng:mn;
 return <section className="cat-showcase v60-categories shell" aria-labelledby="cat-showcase-title">
  <div className="cat-showcase-head">
   <div>
    <span className="hx-eyebrow">{t('Ангилал','Categories')}</span>
    <h2 id="cat-showcase-title">{t('Эрэлттэй ангиллууд','Popular categories')}</h2>
   </div>
   <Link className="cat-showcase-all" href="/categories/">{t('Бүх ангиллыг үзэх','Explore all categories')}<ArrowUpRight size={17} aria-hidden="true"/></Link>
  </div>
  <ul className="v60-cat-grid" aria-label={t('Үйлчилгээний ангиллууд','Service categories')}>
   {SHOWCASE.map(card=>{const Icon=ICONS[card.key]??BriefcaseBusiness;return <li key={card.key}>
    <Link href={card.href} className="cat-card v60-cat">
     <span className="v60-cat-icon" aria-hidden="true"><Icon size={22} strokeWidth={1.8}/></span>
     <span className="v60-cat-name">{en?card.en:card.mn}</span>
     <ArrowUpRight className="v60-cat-arrow" size={16} aria-hidden="true"/>
    </Link>
   </li>})}
  </ul>
 </section>;
}
