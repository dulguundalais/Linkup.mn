// V69 (owner, 2026-11-01): Explore filter panel — price, delivery time and skills
// on top of the existing search, category and sort. Values live in the URL so a
// filtered list can be shared and survives refresh / Back.
import type {LiveService} from './live-discovery';

export type ExtraFilters={priceMin:number|null;priceMax:number|null;maxDays:number|null;skills:string[]};
export const EMPTY_EXTRA:ExtraFilters={priceMin:null,priceMax:null,maxDays:null,skills:[]};
export const DAY_OPTIONS=[3,7,14] as const;
const MAX_SKILLS=10;

const wholeNumber=(v:string|null):number|null=>{
 if(v===null||!/^\d{1,10}$/.test(v))return null;
 const n=Number(v);return Number.isSafeInteger(n)?n:null;
};
export const cleanSkill=(s:string)=>s.replace(/\s+/g,' ').trim().slice(0,40);
const skillKey=(s:string)=>cleanSkill(s).toLocaleLowerCase();

export function readExtra(params:URLSearchParams):ExtraFilters{
 let priceMin=wholeNumber(params.get('price_min')),priceMax=wholeNumber(params.get('price_max'));
 if(priceMin!==null&&priceMax!==null&&priceMin>priceMax)[priceMin,priceMax]=[priceMax,priceMin];
 const d=wholeNumber(params.get('days'));
 const maxDays=d!==null&&(DAY_OPTIONS as readonly number[]).includes(d)?d:null;
 const seen=new Set<string>();const skills:string[]=[];
 for(const raw of (params.get('skills')||'').split(',')){
  const s=cleanSkill(raw);const k=s.toLocaleLowerCase();
  if(s&&!seen.has(k)&&skills.length<MAX_SKILLS){seen.add(k);skills.push(s)}
 }
 return {priceMin,priceMax,maxDays,skills};
}

export function writeExtra(u:URL,f:ExtraFilters){
 const set=(k:string,v:string|null)=>{if(v)u.searchParams.set(k,v);else u.searchParams.delete(k)};
 set('price_min',f.priceMin!==null?String(f.priceMin):null);
 set('price_max',f.priceMax!==null?String(f.priceMax):null);
 set('days',f.maxDays!==null?String(f.maxDays):null);
 set('skills',f.skills.length?f.skills.join(','):null);
}

export function activeExtraCount(f:ExtraFilters):number{
 return (f.priceMin!==null||f.priceMax!==null?1:0)+(f.maxDays!==null?1:0)+f.skills.length;
}

/** Starting price and its delivery time — the same numbers the service card shows. */
export function serviceStart(s:LiveService):{price:number;days:number}{
 const least=(s.packages||[]).filter(p=>Number(p.price)>0).sort((a,b)=>a.price-b.price)[0];
 const base=Number(s.price);
 return {price:least?Number(least.price):Number.isFinite(base)&&base>0?base:0,days:Number(least?.delivery_days??s.delivery_days)||0};
}

export function matchesExtra(s:LiveService,f:Partial<ExtraFilters>):boolean{
 const {price,days}=serviceStart(s);
 if(f.priceMin!=null&&price<f.priceMin)return false;
 if(f.priceMax!=null&&price>f.priceMax)return false;
 if(f.maxDays!=null&&(!days||days>f.maxDays))return false;
 if(f.skills&&f.skills.length){
  // Any of the chosen skills (a buyer picking Figma and Photoshop wants either).
  const own=new Set((s.tags||[]).map(skillKey));
  if(!f.skills.some(k=>own.has(skillKey(k))))return false;
 }
 return true;
}

/** Skills sellers actually listed, most common first. Empty when nobody has tagged. */
export function skillOptions(items:LiveService[],limit=24):{label:string;count:number}[]{
 const map=new Map<string,{label:string;count:number}>();
 for(const s of items){
  const mine=new Set<string>();
  for(const raw of s.tags||[]){
   const label=cleanSkill(String(raw||''));const k=label.toLocaleLowerCase();
   if(!label||mine.has(k))continue;mine.add(k);
   const row=map.get(k);if(row)row.count++;else map.set(k,{label,count:1});
  }
 }
 return [...map.values()].sort((a,b)=>b.count-a.count||a.label.localeCompare(b.label)).slice(0,limit);
}

/** Slider range: 0 up to the highest starting price, rounded up to a tidy step. */
export function priceCeiling(items:LiveService[]):number{
 const top=Math.max(0,...items.map(s=>serviceStart(s).price));
 if(top<=0)return 1_000_000;
 const step=top>1_000_000?500_000:top>100_000?50_000:10_000;
 return Math.ceil(top/step)*step;
}
export const priceStep=(ceiling:number)=>ceiling>2_000_000?50_000:ceiling>200_000?10_000:1_000;
