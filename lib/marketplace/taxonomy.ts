// V50 — Hustle.mn professional services taxonomy. One source of truth for the
// 11 main categories, their subcategories, service models, regulated categories,
// legacy category mapping and problem-first suggestions. Category ids are the
// values stored in services.category and project_requests.category.

export type CategoryId=
 'ai'|'business'|'marketing'|'tech'|'finance'|'legal'|'research'|'creative'|'commerce'|'education'|'wellbeing';
export type Subcategory={id:string;mn:string;en:string;keywords?:string[]};
export type Category={
 id:CategoryId;mn:string;en:string;
 /** Short, plain-language promise shown on cards and in the directory. */
 leadMn:string;leadEn:string;
 /** Regulated professions: public only after professional verification. */
 regulated?:boolean;
 keywords:string[];
 subcategories:Subcategory[];
};

const sub=(id:string,mn:string,en:string,keywords:string[]=[]):Subcategory=>({id,mn,en,keywords});

export const ALL_CATEGORIES:Category[]=[
 {id:'ai',mn:'AI ба автоматжуулалт',en:'AI & Automation',
  leadMn:'Давтагддаг ажлаа автоматжуулах шийдлүүд',leadEn:'Turn repetitive work into smart systems',
  keywords:['ai','хиймэл оюун','hiimel oyun','artificial intelligence','automation','автоматжуулалт','avtomatjuulalt','n8n','make','zapier','gpt','chatgpt','бот','bot'],
  subcategories:[
   sub('chatbots','AI чатбот','AI chatbots',['chatbot','чатбот','messenger bot','мессенжер бот']),
   sub('agents','AI агент','AI agents',['agent','агент','ai agent']),
   sub('workflow','Ажлын урсгал автоматжуулах','Workflow automation',['workflow','n8n','make','zapier','процесс автоматжуулах']),
   sub('crm-automation','CRM автоматжуулалт','CRM automation',['crm','хэрэглэгчийн бүртгэл']),
   sub('integration','AI интеграц','AI integration',['integration','интеграц','api','openai']),
   sub('ai-consulting','AI зөвлөх үйлчилгээ','AI consulting',['ai strategy','ai зөвлөгөө']),
   sub('reporting','Автомат тайлан','Automated reporting',['report','тайлан','dashboard'])
 ]},
 {id:'business',mn:'Бизнес ба стратеги',en:'Business & Strategy',
  leadMn:'Төлөвлөгөө, стратеги, өсөлтийн зөвлөгөө',leadEn:'Plans, strategy and growth advice',
  keywords:['business','бизнес','biznes','strategy','стратеги','strategi','consulting','зөвлөх','zovloh','startup','стартап'],
  subcategories:[
   sub('business-plan','Бизнес төлөвлөгөө','Business plans',['business plan','бизнес план','biznes tolovlogoo']),
   sub('strategy','Бизнесийн стратеги','Business strategy',['strategy','стратеги']),
   sub('market-entry','Зах зээлд нэвтрэх','Market entry',['market entry','экспорт','шинэ зах зээл']),
   sub('startup','Стартап зөвлөгөө','Startup consulting',['startup','стартап','компани байгуулах']),
   sub('management','Менежментийн зөвлөгөө','Management consulting',['management','менежмент','удирдлага']),
   sub('business-model','Бизнес загвар','Business model design',['business model','бизнес загвар']),
   sub('franchise','Франчайз зөвлөгөө','Franchise consulting',['franchise','франчайз']),
   sub('pitch-deck','Хөрөнгө оруулагчдад зориулсан танилцуулга','Investor pitch decks',['pitch deck','хөрөнгө оруулалт','investor']),
   sub('proposals','Төсөл, тендерийн баримт бичиг','Proposals & tenders',['proposal','төсөл','tosol','tender','тендер','грант','grant'])
 ]},
 {id:'marketing',mn:'Маркетинг ба борлуулалт',en:'Marketing & Sales',
  leadMn:'Хэрэглэгч татаж, борлуулалтаа өсгөнө',leadEn:'Reach customers and grow sales',
  keywords:['marketing','маркетинг','marketing','sales','борлуулалт','borluulalt','smm','реклам','reklam','growth'],
  subcategories:[
   sub('marketing-strategy','Маркетингийн стратеги','Marketing strategy',['marketing plan','маркетингийн төлөвлөгөө']),
   sub('digital-marketing','Дижитал маркетинг','Digital marketing',['digital','дижитал']),
   sub('social-media','Сошиал медиа','Social media',['social','сошиал','facebook','instagram','tiktok','smm']),
   sub('seo','SEO','SEO',['seo','google хайлт','search engine']),
   sub('advertising','Зар сурталчилгаа','Advertising',['ads','meta ads','google ads','реклам','зар']),
   sub('lead-generation','Хэрэглэгч татах','Lead generation',['lead','лийд','хэрэглэгч татах']),
   sub('sales-crm','Борлуулалтын процесс ба CRM','Sales process & CRM',['sales','борлуулалт','crm','sales consulting']),
   sub('brand-strategy','Брэндийн стратеги','Brand strategy',['brand strategy','брэнд стратеги','positioning']),
   sub('growth','Өсөлтийн маркетинг','Growth marketing',['growth','өсөлт','performance'])
 ]},
 {id:'tech',mn:'Технологи ба дижитал бүтээгдэхүүн',en:'Technology & Digital Products',
  leadMn:'Вэб, апп, програм хангамж',leadEn:'Websites, apps and software',
  keywords:['web','website','веб','вэб','сайт','sait','app','апп','software','програм','program','developer','хөгжүүлэлт','hogjuulelt','it'],
  subcategories:[
   sub('web','Вэбсайт хөгжүүлэлт','Website development',['website','вэбсайт','landing page','сайт хийх','sait hiih']),
   sub('mobile','Мобайл апп','Mobile apps',['mobile','app','апп','ios','android']),
   sub('ui-ux','UI/UX дизайн','UI/UX design',['ui','ux','figma','интерфейс','prototype']),
   sub('ecommerce-dev','Онлайн дэлгүүр хөгжүүлэлт','Ecommerce development',['shopify','woocommerce','онлайн дэлгүүр хийх']),
   sub('software','Програм хангамж','Software development',['software','систем','erp','програм']),
   sub('api','API ба интеграц','API & integrations',['api','integration','интеграц','qpay']),
   sub('cybersecurity','Кибер аюулгүй байдал','Cybersecurity',['security','аюулгүй байдал','pentest']),
   sub('qa','Тест ба чанарын хяналт','QA & testing',['qa','test','тест']),
   sub('tech-consulting','Технологийн зөвлөгөө','Technical consulting',['cto','architecture','технологийн зөвлөгөө'])
 ]},
 {id:'finance',mn:'Санхүү, татвар, нягтлан',en:'Finance, Tax & Accounting',
  leadMn:'Нягтлан, татвар, санхүүгийн төлөвлөлт',leadEn:'Accounting, tax and financial planning',
  keywords:['finance','санхүү','sanhuu','accounting','нягтлан','nyagtlan','tax','татвар','tatvar','cfo','budget','төсөв'],
  subcategories:[
   sub('accounting','Нягтлан бодох бүртгэл','Accounting & bookkeeping',['accounting','bookkeeping','нягтлан','бүртгэл']),
   sub('tax','Татварын зөвлөгөө','Tax consulting',['tax','татвар','НӨАТ','vat']),
   sub('financial-model','Санхүүгийн загварчлал','Financial modelling',['financial model','санхүүгийн загвар','valuation','үнэлгээ']),
   sub('budget-forecast','Төсөвлөлт ба таамаглал','Budgeting & forecasting',['budget','төсөв','forecast']),
   sub('cash-flow','Мөнгөн гүйлгээний удирдлага','Cash flow management',['cash flow','мөнгөн урсгал']),
   sub('reporting','Санхүүгийн тайлан','Financial reporting',['financial report','санхүүгийн тайлан','ifrs']),
   sub('fractional-cfo','Цагийн санхүүгийн захирал (CFO)','Fractional CFO',['cfo','санхүүгийн захирал'])
 ]},
 {id:'legal',mn:'Хууль, эрх зүй',en:'Legal',regulated:true,
  leadMn:'Баталгаажсан хуульчдын зөвлөгөө',leadEn:'Advice from verified lawyers',
  keywords:['legal','хууль','huuli','lawyer','хуульч','huulich','contract','гэрээ','geree','compliance'],
  subcategories:[
   sub('consultation','Хуулийн зөвлөгөө','Legal consultation',['legal advice','хуулийн зөвлөгөө']),
   sub('contract-review','Гэрээ хянах','Contract review',['contract review','гэрээ хянах']),
   sub('contract-drafting','Гэрээ боловсруулах','Contract drafting',['contract','гэрээ бичих']),
   sub('corporate','Компанийн эрх зүй','Corporate legal services',['corporate','компанийн хууль']),
   sub('registration','Компани бүртгүүлэх','Business registration',['registration','улсын бүртгэл','компани байгуулах']),
   sub('employment','Хөдөлмөрийн эрх зүй','Employment law',['employment','хөдөлмөрийн гэрээ']),
   sub('compliance','Зохицуулалтын нийцэл','Regulatory compliance',['compliance','зөвшөөрөл','license','тусгай зөвшөөрөл'])
 ]},
 {id:'research',mn:'Судалгаа ба өгөгдөл',en:'Research & Data',
  leadMn:'Баримт, өгөгдөлд тулгуурлан шийдвэр гаргаарай',leadEn:'Decisions grounded in evidence and data',
  keywords:['research','судалгаа','sudalgaa','data','өгөгдөл','ogogdol','analytics','аналитик','excel','power bi'],
  subcategories:[
   sub('market-research','Зах зээлийн судалгаа','Market research',['market research','зах зээлийн судалгаа']),
   sub('competitor','Өрсөлдөгчийн шинжилгээ','Competitor analysis',['competitor','өрсөлдөгч']),
   sub('customer-research','Хэрэглэгчийн судалгаа','Customer research',['customer research','ux research','ярилцлага']),
   sub('surveys','Санал асуулга','Surveys',['survey','санал асуулга']),
   sub('analytics','Өгөгдлийн шинжилгээ','Data analytics',['analytics','шинжилгээ','python','sql']),
   sub('power-bi','Power BI dashboard','Power BI dashboards',['power bi','dashboard','powerbi']),
   sub('excel','Excel тайлан ба загвар','Excel reporting',['excel','spreadsheet','хүснэгт']),
   sub('bi','Бизнесийн өгөгдлийн шинжилгээ (BI)','Business intelligence',['bi','business intelligence','kpi'])
 ]},
 {id:'creative',mn:'Дизайн, бүтээлч үйлчилгээ',en:'Design & Creative',
  leadMn:'Брэнд, дизайн, видео, орчуулга',leadEn:'Brand, design, video and language',
  keywords:['design','дизайн','dizain','creative','бүтээлч'],
  subcategories:[
   sub('brand-identity','Брэндийн өнгө төрх','Brand identity',['brand identity','брэнд','brend','branding']),
   sub('logo','Лого дизайн','Logo design',['logo','лого','logo hiih']),
   sub('graphic-design','График дизайн','Graphic design',['graphic design','график','poster','постер']),
   sub('video-production','Видео бүтээх','Video production',['video production','зураг авалт','commercial']),
   sub('video-editing','Видео эвлүүлэг','Video editing',['video editing','эвлүүлэг','evluuleg','reels','рилс','montaj','монтаж']),
   sub('animation','Анимэйшн, хөдөлгөөнт график','Animation & motion',['animation','анимэйшн','motion']),
   sub('photography','Гэрэл зураг','Photography',['photo','фото','гэрэл зураг']),
   sub('presentations','Танилцуулгын дизайн','Presentation design',['presentation','powerpoint','слайд']),
   sub('translation','Орчуулга, нутагшуулалт','Translation & localization',['translation','орчуулга','orchuulga','english','англи','localization']),
   sub('interior','Интерьер дизайн','Interior design',['interior','интерьер','дотоод засал','3d'])
 ]},
 {id:'commerce',mn:'Цахим худалдаа ба үйл ажиллагаа',en:'Ecommerce & Operations',
  leadMn:'Онлайн дэлгүүр, нөөц, процесс',leadEn:'Online stores, inventory and processes',
  keywords:['ecommerce','цахим худалдаа','онлайн дэлгүүр','online store','operations','үйл ажиллагаа','inventory','агуулах'],
  subcategories:[
   sub('online-store','Онлайн дэлгүүр нээх','Online store setup',['online store','онлайн дэлгүүр','shop']),
   sub('marketplace','Цахим худалдааны платформын удирдлага','Marketplace management',['marketplace','shoppy','emart','amazon']),
   sub('operations','Цахим худалдааны үйл ажиллагаа','Ecommerce operations',['fulfilment','хүргэлт','захиалгын урсгал']),
   sub('product','Бүтээгдэхүүний менежмент','Product management',['product','бүтээгдэхүүн','catalog']),
   sub('inventory','Нөөц, агуулахын систем','Inventory systems',['inventory','агуулах','нөөц']),
   sub('process','Бизнес процесс сайжруулах','Process optimisation',['process','процесс','lean']),
   sub('ops-consulting','Үйл ажиллагааны зөвлөгөө','Operations consulting',['operations','үйл ажиллагаа'])
 ]},
 {id:'education',mn:'Боловсрол ба коучинг',en:'Education & Coaching',
  leadMn:'Хичээл, ментор, сургалт',leadEn:'Lessons, mentoring and training',
  keywords:['education','боловсрол','bolovsrol','tutor','багш','bagsh','coaching','коуч','mentor','ментор','training','сургалт','surgalt','хичээл'],
  subcategories:[
   sub('language','Хэлний хичээл','Language tutoring',['english','англи хэл','ielts','toefl','хятад хэл','солонгос хэл']),
   sub('business-coaching','Бизнес коучинг','Business coaching',['business coach','бизнес коуч']),
   sub('professional-training','Мэргэжлийн сургалт','Professional training',['training','сургалт']),
   sub('career','Ажил мэргэжлийн зөвлөх','Career mentoring',['career','карьер','cv','ярилцлага']),
   sub('software-training','Програм хангамжийн сургалт','Software training',['excel training','figma','программ сурах']),
   sub('private-lessons','Ганцаарчилсан хичээл','Private lessons',['private lesson','хувийн хичээл','math','математик']),
   sub('corporate-training','Байгууллагын сургалт','Corporate training',['corporate training','байгууллагын сургалт'])
 ]},
 {id:'wellbeing',mn:'Сэтгэл зүй, хувь хүний хөгжил',en:'Psychology & Wellbeing',regulated:true,
  leadMn:'Баталгаажсан мэргэжилтнүүдтэй нууцлалтай уулзалт',leadEn:'Private sessions with verified professionals',
  keywords:['psychology','сэтгэл зүй','setgel zui','psychologist','сэтгэл зүйч','wellbeing','stress','стресс','counselling','зөвлөгөө'],
  subcategories:[
   sub('consultation','Сэтгэл зүйн зөвлөгөө','Psychological consultation',['psychologist','сэтгэл зүйч']),
   sub('stress','Стрессээ зохицуулах','Stress management',['stress','стресс','burnout']),
   sub('relationships','Харилцааны зөвлөгөө','Relationship counselling',['relationship','харилцаа','гэр бүл']),
   sub('personal-development','Хувь хүний хөгжил','Personal development',['personal development','хувь хүний хөгжил']),
   sub('workplace','Ажлын байрны сэтгэл зүй','Workplace wellbeing',['workplace','ажлын байр','team wellbeing']),
   sub('emotional-skills','Сэтгэл хөдлөлийн ур чадвар','Emotional skills training',['emotional','сэтгэл хөдлөл'])
 ]}
];

/** V71 (owner, 2026-11-02): not offered for now. Their definitions stay so they can
 *  be switched back on by removing them from this list. */
export const HIDDEN_CATEGORIES:CategoryId[]=['education','wellbeing'];
/** Categories shown to buyers and sellers. */
export const CATEGORIES:Category[]=ALL_CATEGORIES.filter(c=>!HIDDEN_CATEGORIES.includes(c.id));
export const CATEGORY_IDS=CATEGORIES.map(c=>c.id);
export const REGULATED=CATEGORIES.filter(c=>c.regulated).map(c=>c.id);
export const categoryById=(id:string)=>CATEGORIES.find(c=>c.id===id);
export const categoryLabel=(id:string,en:boolean)=>{const c=categoryById(id)||categoryById(legacyCategory(id)?.category||'');return c?(en?c.en:c.mn):id};
export const subcategoryLabel=(category:string,subId:string|null|undefined,en:boolean)=>{
 const s=categoryById(category)?.subcategories.find(x=>x.id===subId);return s?(en?s.en:s.mn):'';
};

/** Homepage carousel: one card per category, featured ones first. */
export type ShowcaseCard={key:string;mn:string;en:string;href:string;categories:CategoryId[];art:string};
/** V61: card names come from CATEGORIES, so the homepage and the categories page
 *  always say the same thing. */
const showcaseCard=(id:CategoryId,art:string=id):ShowcaseCard=>{const c=CATEGORIES.find(x=>x.id===id)!;return {key:id,mn:c.mn,en:c.en,href:'/categories/#'+id,categories:[id],art}};
export const SHOWCASE:ShowcaseCard[]=[
 showcaseCard('ai'),
 showcaseCard('business'),
 showcaseCard('marketing'),
 showcaseCard('tech'),
 // V72 (owner): «Хууль, эрх зүй» is its own card; finance has its own card next to it.
 showcaseCard('legal'),
 showcaseCard('finance'),
 showcaseCard('creative'),
 showcaseCard('research'),
 showcaseCard('commerce')
];

/** Category artwork available as raster images in public/categories/<art>.webp.
 *  Arts not listed here use the built-in SVG composition. */
export const CATEGORY_IMAGES:string[]=[];

/** How a service is sold. Inquiry-based models never take payment on Hustle. */
export type ServiceType='fixed'|'hourly'|'custom'|'monthly'|'mentoring';
export const ALL_SERVICE_TYPES:{id:ServiceType;mn:string;en:string;hintMn:string;hintEn:string;priceMn:string;priceEn:string}[]=[
 {id:'fixed',mn:'Тогтмол үнэтэй багц',en:'Fixed-price package',hintMn:'Суурь, Стандарт, Дээд багцаас ажлын хүрээгээ сонгоно.',hintEn:'Clear deliverables in Basic, Standard and Premium packages.',priceMn:'-аас эхэлнэ',priceEn:'starting price'},
 {id:'hourly',mn:'Цагийн зөвлөгөө',en:'Hourly consultation',hintMn:'Мэргэжилтэнтэй цагаар уулзаж зөвлөгөө авна.',hintEn:'Book an expert by the hour.',priceMn:'/ цаг',priceEn:'/ hour'},
 {id:'custom',mn:'Захиалгат төсөл',en:'Custom project',hintMn:'Хэрэгцээгээ тайлбарлаад үнийн санал авна.',hintEn:'Describe your needs and receive a quote.',priceMn:'-аас эхэлнэ',priceEn:'from'},
 {id:'monthly',mn:'Сарын үйлчилгээ',en:'Monthly retainer',hintMn:'Тогтмол дэмжлэг, зөвлөгөө сар бүр.',hintEn:'Ongoing support every month.',priceMn:'/ сар',priceEn:'/ month'},
 {id:'mentoring',mn:'Ментор ба сургалт',en:'Mentoring & training',hintMn:'Ганцаарчилсан ментор, коучинг, хичээл.',hintEn:'One-to-one mentoring, coaching or lessons.',priceMn:'/ уулзалт',priceEn:'/ session'}
];
/** V71 (owner): «Ментор ба сургалт» is not offered for now; existing rows still get their label. */
export const SERVICE_TYPES=ALL_SERVICE_TYPES.filter(t=>t.id!=='mentoring');
export const serviceTypeById=(id:string|null|undefined)=>ALL_SERVICE_TYPES.find(t=>t.id===id)||ALL_SERVICE_TYPES[0];

/** Pre-V50 category ids and where their services now live. */
export const LEGACY_CATEGORY_MAP:Record<string,{category:CategoryId;subcategory:string}>={
 design:{category:'creative',subcategory:'brand-identity'},
 ui:{category:'tech',subcategory:'ui-ux'},
 video:{category:'creative',subcategory:'video-editing'},
 translation:{category:'creative',subcategory:'translation'},
 marketing:{category:'marketing',subcategory:'digital-marketing'},
 web:{category:'tech',subcategory:'web'},
 interior:{category:'creative',subcategory:'interior'},
 ai:{category:'ai',subcategory:'integration'},
 proposals:{category:'business',subcategory:'proposals'}
};
export const legacyCategory=(id:string)=>LEGACY_CATEGORY_MAP[id];
/** Accept both new and pre-V50 ids, e.g. from old links like /explore/?category=web. */
export const normalizeCategory=(id:string|null|undefined):CategoryId|'all'=>{
 if(!id||id==='all')return 'all';
 if((CATEGORY_IDS as string[]).includes(id))return id as CategoryId;
 return legacyCategory(id)?.category||'all';
};

/** Every word that should lead a search to this category (all subcategories included). */
export function categorySearchTerms(id:string):string[]{
 const c=categoryById(id);if(!c)return [];
 return [c.mn,c.en,...c.keywords,...c.subcategories.flatMap(s=>[s.mn,s.en,...(s.keywords||[])])];
}

/** Search terms for one service: its main category plus only its own subcategory,
    so a video service does not match "logo" just because both are Design & Creative. */
export function serviceSearchTerms(category:string,subId:string|null|undefined):string[]{
 const c=categoryById(category);if(!c)return [];
 const s=c.subcategories.find(x=>x.id===subId);
 return [c.mn,c.en,...c.keywords,...(s?[s.mn,s.en,...(s.keywords||[])]:[])];
}
