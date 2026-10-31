'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {ArrowUpRight,ChevronLeft,ChevronRight} from 'lucide-react';
import CategoryArt from './category-art';
import {SHOWCASE,CATEGORY_IMAGES} from '../lib/marketplace/taxonomy';
import '../app/v50-categories.css';

/* V50 homepage category carousel: Fiverr-style cards (name on top, artwork below)
   in a horizontal row. Native scroll-snap gives touch swipe; arrows page by view. */
export default function CategoryShowcase({en}:{en:boolean}){
 const t=(mn:string,eng:string)=>en?eng:mn;
 const track=useRef<HTMLDivElement>(null);
 const [edge,setEdge]=useState({start:true,end:false});
 const [progress,setProgress]=useState(0);
 const measure=useCallback(()=>{
  const el=track.current;if(!el)return;
  const max=el.scrollWidth-el.clientWidth;
  setEdge({start:el.scrollLeft<=4,end:el.scrollLeft>=max-4});
  setProgress(el.scrollWidth>0?Math.min(1,(el.scrollLeft+el.clientWidth)/el.scrollWidth):1);
 },[]);
 useEffect(()=>{
  measure();const el=track.current;if(!el)return;
  el.addEventListener('scroll',measure,{passive:true});window.addEventListener('resize',measure);
  return()=>{el.removeEventListener('scroll',measure);window.removeEventListener('resize',measure)};
 },[measure]);
 const page=(dir:1|-1)=>{
  const el=track.current;if(!el)return;
  const card=el.querySelector<HTMLElement>('.cat-card');
  const step=card?card.offsetWidth+parseFloat(getComputedStyle(el).columnGap||'16'):el.clientWidth;
  const perView=Math.max(1,Math.floor((el.clientWidth+8)/step));
  const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  el.scrollBy({left:dir*step*perView,behavior:reduce?'auto':'smooth'});
 };
 return <section className="cat-showcase shell" aria-labelledby="cat-showcase-title">
  <div className="cat-showcase-head">
   <div>
    <span className="hx-eyebrow">{t('Ангилал','Categories')}</span>
    <h2 id="cat-showcase-title">{t('Мэргэжлийн үйлчилгээ','Professional services')}</h2>
    <p>{t('Бизнес болон хувь хүнд зориулсан туршлагатай мэргэжилтнүүд.','Experienced professionals for businesses and individuals.')}</p>
   </div>
   <div className="cat-showcase-tools">
    <Link className="cat-showcase-all" href="/categories/">{t('Бүх ангиллыг үзэх','Explore all categories')}<ArrowUpRight size={17} aria-hidden="true"/></Link>
    <div className="cat-arrows">
     <button type="button" className="cat-arrow" onClick={()=>page(-1)} disabled={edge.start} aria-label={t('Өмнөх ангиллууд','Previous categories')}><ChevronLeft size={20} aria-hidden="true"/></button>
     <button type="button" className="cat-arrow" onClick={()=>page(1)} disabled={edge.end} aria-label={t('Дараагийн ангиллууд','More categories')}><ChevronRight size={20} aria-hidden="true"/></button>
    </div>
   </div>
  </div>
  <div className="cat-rail">
   <div className="cat-track" ref={track} role="list" aria-label={t('Үйлчилгээний ангиллууд','Service categories')} tabIndex={-1}>
    {SHOWCASE.map(card=><div role="listitem" key={card.key} className="cat-slot">
     <Link href={card.href} className={'cat-card cat-card-'+card.art}>
      <span className="cat-card-title">{en?card.en:card.mn}</span>
      <span className="cat-card-art">{CATEGORY_IMAGES.includes(card.art)?<img src={'/categories/'+card.art+'.webp'} alt="" loading="lazy" decoding="async"/>:<CategoryArt art={card.art} label=""/>}</span>
     </Link>
    </div>)}
   </div>
  </div>
  <div className="cat-progress" aria-hidden="true"><i style={{width:Math.round(progress*100)+'%'}}/></div>
 </section>;
}
