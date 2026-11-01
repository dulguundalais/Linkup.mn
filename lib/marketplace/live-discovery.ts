import {normalizeSearch,searchTokens,typoClose} from './smart-search';
import {legacyCategory,serviceSearchTerms} from './taxonomy';
import {matchesExtra,serviceStart,type ExtraFilters} from './explore-filters';

// Only published, opt-in marketplace_catalog RPC records are accepted here.
// Never mix editorial sample services into the buyer discovery index.
export type LiveService = {
 id:string;title:string;title_en:string;description:string;category:string;
 price:number;delivery_days:number;revisions:number;package_name:string;
 display_name:string;headline:string;slug:string;avatar_path?:string|null;
 packages?:{tier:string;price:number;delivery_days:number;revisions:number;summary?:string;includes:string[]}[];
 review_count?:number;average_rating?:number|null;completed_orders?:number;
 subcategory?:string|null;service_type?:string|null;tags?:string[]|null;
};
export type LiveSort = 'featured'|'low'|'high'|'fast';
export const isLiveSort=(v:unknown):v is LiveSort=>v==='featured'||v==='low'||v==='high'||v==='fast';
export type LiveFilters = {
 query:string;category:string;subcategory?:string;sort:LiveSort;onlySaved:boolean;saved:string[];
} & Partial<ExtraFilters>;

// Search the existing server-filtered, published marketplace_catalog records only.
// Never manufacture sellers or mix sample/demo listings into the real catalog.
const categoryAliases:Record<string,string[]> = {
 design:['logo','лого','logoo','brand','brend','брэнд','branding','brand identity','graphic design','график дизайн','dizain','дизайн','таних тэмдэг'],
 ui:['ui','ux','ui ux','ui/ux','интерфейс','interface','app design','апп дизайн','application design','прототип','prototype','figma'],
 video:['video','видео','reels','рилс','rils','монтаж','montaj','editing','evluuleg','эвлүүлэг','shorts','tiktok','бичлэг'],
 translation:['translation','orchuulga','орчуулга','translate','english','англи','copywriting','текст орчуулга','hel'],
 marketing:['marketing','маркетинг','smm','реклам','reklam','advertising','social media','сошиал','content marketing','зар сурталчилгаа'],
 web:['web','website','вэб','веб','сайт','sait','site','veb','developer','код','code','web development','вэб хөгжүүлэлт'],
 interior:['interior','интерьер','3d','дотоод засал','dotood zasal','house design','орон сууц'],
 ai:['ai','хиймэл оюун','artificial intelligence','prompt','промпт','ai зураг','automation','автоматжуулалт','chatbot'],
 proposals:['business plan','бизнес төлөвлөгөө','бизнес план','төсөл','tosol','төслийн санал','proposal','тендер','tender','pitch deck']
};

// Weight what the service actually offers above its category keywords,
// and category keywords above boilerplate in its description or seller bio.
function bestTermScore(term:string,field:string,weight:number):number {
 let best=0;
 for(const word of searchTokens(field)){
  const exact=term===word;
  const prefix=term.length>=2&&word.startsWith(term);
  const fuzzy=term.length>=4&&word.length>=4&&typoClose(term,word);
  const score=exact?weight:prefix?Math.round(weight*.8):fuzzy?Math.round(weight*.55):0;
  if(score>best)best=score;
 }
 return best;
}

export function liveSearchScore(service:LiveService,query:string):number {
 const terms=searchTokens(query);
 if(!terms.length)return 0;
 const title=[service.title,service.title_en].join(' ');
 // V50: main category and own subcategory terms plus the seller's tags (pre-V50 ids keep their aliases).
 const category=[service.category,...(categoryAliases[service.category]||[]),...serviceSearchTerms(service.category,service.subcategory),...(service.tags||[])].join(' ');
 const pkg=(service.packages||[]).flatMap(p=>[p.summary||'',...(p.includes||[])]).join(' ');
 const seller=[service.display_name,service.headline].join(' ');
 let score=0;
 for(const term of terms){
  const termScore=Math.max(
   bestTermScore(term,title,70),
   bestTermScore(term,category,42),
   bestTermScore(term,pkg,26),
   bestTermScore(term,service.description,20),
   bestTermScore(term,seller,14)
  );
  if(!termScore)return -1; // Multiple keywords must all match, no unrelated results.
  score+=termScore;
 }
 // Exact phrase in service title wins ties with broader category or typo matches.
 const phrase=normalizeSearch(query);
 if(phrase.length>=3&&normalizeSearch(title).includes(phrase))score+=35;
 return score;
}

export function liveServicePrice(service:LiveService):number {
 const prices=(service.packages||[]).map(p=>Number(p.price)).filter(p=>Number.isFinite(p)&&p>0);
 const base=Number(service.price);
 return prices.length?Math.min(...prices):Number.isFinite(base)&&base>0?base:0;
}
export function filterLiveServices<T extends LiveService>(items:T[],filters:LiveFilters):T[] {
 const hasQuery=searchTokens(filters.query).length>0;
 const scored=items
  // V52: rows saved under pre-V50 ids still match their new category and subcategory.
  .filter(s=>{const legacy=legacyCategory(s.category);const cat=legacy?.category||s.category;const sub=s.subcategory||legacy?.subcategory||'';return (filters.category==='all'||cat===filters.category||s.category===filters.category)&&(!filters.subcategory||sub===filters.subcategory)&&(!filters.onlySaved||filters.saved.includes(s.id))&&matchesExtra(s,filters)})
  .map((s,i)=>({s,i,score:hasQuery?liveSearchScore(s,filters.query):0}))
  .filter(row=>!hasQuery||row.score>=0);
 if(filters.sort==='featured'){
  if(hasQuery)scored.sort((a,b)=>b.score-a.score||a.i-b.i);
 }else{
  scored.sort((a,b)=>{
   // V69: fastest delivery first (the starting package), cheaper first on a tie.
   if(filters.sort==='fast'){const da=serviceStart(a.s).days||999,db=serviceStart(b.s).days||999;return (da-db)||(liveServicePrice(a.s)-liveServicePrice(b.s))||a.i-b.i}
   const priceDelta=liveServicePrice(a.s)-liveServicePrice(b.s);
   return (filters.sort==='low'?priceDelta:-priceDelta)||(b.score-a.score)||a.i-b.i;
  });
 }
 return scored.map(row=>row.s);
}
export function suggestLiveServices<T extends LiveService>(items:T[],query:string,limit=4):T[] {
 if(!searchTokens(query).length||limit<=0)return [];
 return filterLiveServices(items,{query,category:'all',sort:'featured',onlySaved:false,saved:[]})
  .slice(0,Math.min(limit,8));
}
