/**
 * Hustle Smart Finder v1: transparent, rule-based intent routing.
 * NO generative model is connected in this release. Recommendations are
 * solution templates, real matches only come from marketplace_catalog RPC.
 * This deliberately works if the optional live backend is temporarily down.
 */
import {legacyCategory} from './taxonomy';
export type Audience='personal'|'business';
export type OutcomeKey='growth'|'content'|'automation'|'website'|'brand'|'analytics'|'startup'|'finance'|'legal'|'learning'|'wellbeing'|'general';
export type Solution={
 id:string;mn:string;en:string;whyMn:string;whyEn:string;categories:string[];
};
export type Outcome={key:OutcomeKey;mn:string;en:string;mnWhy:string;enWhy:string;solutions:Solution[]};
export type PublishedMatch={id:string;category:string;title:string;title_en?:string;description:string;display_name:string;slug:string;price:number;packages?:{tier:string;price:number}[]};
const solutions:Record<OutcomeKey,Outcome>={
 growth:{key:'growth',mn:'Борлуулалт ба захиалга нэмэгдүүлэх',en:'Grow sales and bookings',mnWhy:'Харилцагч татах суваг, контент, захиалгын урсгалыг хамтад нь үнэлээрэй.',enWhy:'Consider customer acquisition, content and the booking journey together.',solutions:[
 {id:'ads',mn:'Meta Ads ба дижитал маркетинг',en:'Meta Ads & digital marketing',whyMn:'Танай зорилтот хэрэглэгчид хүрэх кампанит ажил.',whyEn:'Campaigns to reach likely customers.',categories:['marketing']},
 {id:'content',mn:'Фото, Reels ба контент үйлдвэрлэл',en:'Photo, Reels & content creation',whyMn:'Үйлчилгээгээ ойлгомжтой, сонирхол татахуйц харуулах.',whyEn:'Help customers see and understand what you offer.',categories:['creative','ai']},
 {id:'booking',mn:'Захиалгын систем ба автоматжуулалт',en:'Booking tools & automation',whyMn:'Хүсэлт алдахгүй хүлээн авч, үр дүнг хэмжих.',whyEn:'Capture inquiries and measure results.',categories:['tech','ai']}
 ]},
 content:{key:'content',mn:'Контент ба сурталчилгаа хөгжүүлэх',en:'Improve content and promotion',mnWhy:'Агуулгын зорилго, сувгаа эхэлж тодорхойлбол илүү үр дүнтэй.',enWhy:'Start with clear audiences and content goals.',solutions:[
 {id:'reels',mn:'Reels, видео үйлдвэрлэл',en:'Reels & video production',whyMn:'Тогтмол чанартай богино видео.',whyEn:'Consistent quality short-form video.',categories:['creative','ai']},
 {id:'social',mn:'Сошиал контентын төлөвлөгөө',en:'Social content plan',whyMn:'Нэг удаагийн пост биш, зорилготой цуврал контент.',whyEn:'An intentional series instead of one-off posts.',categories:['marketing','creative']},
 {id:'creative',mn:'AI ашиглан контент бүтээх',en:'AI-assisted creative assets',whyMn:'Хүний хяналттайгаар контентоо хурдан бэлдэх.',whyEn:'Speed production with human quality control.',categories:['ai','creative']}
 ]},
 automation:{key:'automation',mn:'Ажлын процессыг автоматжуулах',en:'Automate manual work',mnWhy:'Эхлээд давтагддаг ажлаа тодорхойлж, хэрэгсэл болон өгөгдлийн хамгаалалтаа сонгоорой.',enWhy:'Map the repetitive task, integrations and data safeguards first.',solutions:[
 {id:'workflow',mn:'Workflow automation (n8n / Make)',en:'Workflow automation (n8n / Make)',whyMn:'Гар ажиллагаатай давтагддаг алхмуудыг нэгтгэх.',whyEn:'Connect repetitive steps and systems.',categories:['ai','tech']},
 {id:'bot',mn:'AI chatbot ба CRM холболт',en:'AI chatbot & CRM integration',whyMn:'Хүсэлт хүлээн авах, ангилах, хариу өгөхөд туслах.',whyEn:'Support intake, categorization and replies.',categories:['ai','tech']},
 {id:'dashboard',mn:'Автомат тайлан ба аналитик',en:'Automated reports & analytics',whyMn:'Гүйцэтгэлийн мэдээллийг тогтмол нэгтгэх.',whyEn:'Bring performance data together on schedule.',categories:['tech','business']}
 ]},
 website:{key:'website',mn:'Цахим үйлчилгээ, вэб хөгжүүлэлт',en:'Build digital experiences',mnWhy:'Зорилго, хэрэгтэй боломжууд, цаашдын арчилгааг хамтад нь тодорхойлоорой.',enWhy:'Define goals, required features and ongoing maintenance.',solutions:[
 {id:'site',mn:'Бизнесийн вэбсайт, танилцуулга хуудас',en:'Business website / landing page',whyMn:'Үйлчилгээ, үнэ, холбогдох сувгийг ил тод болгох.',whyEn:'Show offerings, pricing and next steps.',categories:['tech']},
 {id:'ui',mn:'UI/UX дизайн ба хэрэглэгчийн урсгал',en:'UI/UX design & journeys',whyMn:'Хэрэглэгчийн үйлдлийг энгийн, ойлгомжтой болгох.',whyEn:'Make interactions clearer and easier.',categories:['tech']},
 {id:'maint',mn:'Вэб арчилгаа, системийн холболт',en:'Site care & integrations',whyMn:'Нийтлэсний дараа найдвартай ажиллуулах.',whyEn:'Keep things reliable after launch.',categories:['tech','ai']}
 ]},
 brand:{key:'brand',mn:'Брэнд ба харагдах байдал',en:'Improve brand identity',mnWhy:'Зорилтот хэрэглэгч болон брэндийн гол ялгарал дээрээ тулгуурлан бүтээ.',enWhy:'Anchor your creative work in your audience and positioning.',solutions:[
 {id:'identity',mn:'Лого ба брэндийн систем',en:'Logo & brand system',whyMn:'Брэндийн нэгдсэн өнгө төрх.',whyEn:'Create a consistent identity.',categories:['creative']},
 {id:'visual',mn:'Маркетингийн зураг, дүрслэл',en:'Marketing visuals',whyMn:'Брэндийн нэгдсэн загвараар контент бэлдэх.',whyEn:'Keep campaign visuals consistent.',categories:['creative']},
 {id:'brandweb',mn:'Брэндэд тохирсон веб хуудас',en:'Brand-led website',whyMn:'Онлайнаар итгэл төрүүлэх.',whyEn:'Build trust online.',categories:['tech']}
 ]},
 analytics:{key:'analytics',mn:'Өгөгдөл ба тайлангаа сайжруулах',en:'Make better use of data',mnWhy:'Хэмжих үзүүлэлтээ шийдэх асуудалтайгаа холбож сонго.',enWhy:'Choose metrics around the decisions you need to make.',solutions:[
 {id:'report',mn:'Борлуулалтын тайлангийн самбар',en:'Sales dashboard',whyMn:'Гүйцэтгэлийн гол үзүүлэлтүүдээ нэг дор харах.',whyEn:'Bring your most important KPIs together.',categories:['tech','business']},
 {id:'integrate',mn:'Өгөгдөл цэвэрлэх ба нэгтгэх',en:'Data cleanup & integrations',whyMn:'Тархай өгөгдлийг найдвартай болгох.',whyEn:'Make fragmented data reliable.',categories:['tech','ai']},
 {id:'insights',mn:'Бизнесийн шинжилгээ',en:'Business analysis',whyMn:'Үр дүнгээсээ дараагийн шийдвэрээ гаргах.',whyEn:'Turn performance into better decisions.',categories:['business','marketing']}
 ]},
 startup:{key:'startup',mn:'Бизнес, компани эхлүүлэх',en:'Start a business',mnWhy:'Төлөвлөгөө, бүртгэл, санхүү, брэндээ зэрэгцүүлж бэлдэх нь эрсдэлийг бууруулна.',enWhy:'Plan, register, set up finances and brand together to reduce risk.',solutions:[
 {id:'plan',mn:'Бизнес төлөвлөгөө ба стратеги',en:'Business plan & strategy',whyMn:'Зах зээл, санхүүгийн тооцоогоо эхэлж тодорхойлох.',whyEn:'Clarify the market and the numbers first.',categories:['business']},
 {id:'register',mn:'Компанийн бүртгэл, гэрээ',en:'Company registration & contracts',whyMn:'Баталгаажсан хуульчаар эрх зүйн суурийг тавих.',whyEn:'Set a sound legal footing with a verified lawyer.',categories:['legal']},
 {id:'books',mn:'Нягтлан бодох бүртгэл, татвар',en:'Accounting & tax setup',whyMn:'Эхний өдрөөс бүртгэл, татвараа зөв хөтлөх.',whyEn:'Keep books and taxes right from day one.',categories:['finance']},
 {id:'launch',mn:'Брэнд ба маркетинг',en:'Brand & launch marketing',whyMn:'Анхны хэрэглэгчдээ татах.',whyEn:'Reach your first customers.',categories:['creative','marketing']}
 ]},
 finance:{key:'finance',mn:'Санхүү, татвараа цэгцлэх',en:'Get finances and tax in order',mnWhy:'Бүртгэл, тайлан, мөнгөн урсгалаа нэг дор харж шийдвэр гаргах.',enWhy:'See books, reports and cash flow together before deciding.',solutions:[
 {id:'accounting',mn:'Нягтлан бодох бүртгэл',en:'Accounting & bookkeeping',whyMn:'Сар бүрийн бүртгэл, тайлан.',whyEn:'Monthly books and reports.',categories:['finance']},
 {id:'tax',mn:'Татварын зөвлөгөө',en:'Tax consulting',whyMn:'Татварын тайлан, хөнгөлөлтөө зөв ашиглах.',whyEn:'File correctly and use available reliefs.',categories:['finance']},
 {id:'model',mn:'Санхүүгийн загвар ба төсөв',en:'Financial model & budget',whyMn:'Өсөлт, хөрөнгө оруулалтаа тооцоолох.',whyEn:'Plan growth and investment.',categories:['finance','business']}
 ]},
 legal:{key:'legal',mn:'Хууль, гэрээний асуудал',en:'Legal and contract questions',mnWhy:'Зөвхөн баталгаажсан мэргэжилтнээс эрх зүйн зөвлөгөө аваарай.',enWhy:'Take legal advice only from verified professionals.',solutions:[
 {id:'contract',mn:'Гэрээ боловсруулах, хянах',en:'Contract drafting & review',whyMn:'Эрсдэлээ гэрээнд зөв тусгах.',whyEn:'Put the right protections in writing.',categories:['legal']},
 {id:'advice',mn:'Хуулийн зөвлөгөө',en:'Legal consultation',whyMn:'Нөхцөл байдалдаа тохирсон зөвлөгөө.',whyEn:'Advice for your situation.',categories:['legal']},
 {id:'compliance',mn:'Зөвшөөрөл ба нийцэл',en:'Permits & compliance',whyMn:'Тусгай зөвшөөрөл, шаардлагаа хангах.',whyEn:'Meet licensing and regulatory requirements.',categories:['legal','business']}
 ]},
 learning:{key:'learning',mn:'Сурах, ур чадвараа хөгжүүлэх',en:'Learn a new skill',mnWhy:'Зорилгодоо тохирсон багш, ментороо сонгоорой.',enWhy:'Choose a tutor or mentor who fits your goal.',solutions:[
 {id:'tutor',mn:'Ганцаарчилсан хичээл, хэлний сургалт',en:'Private lessons & language tutoring',whyMn:'Хурдацдаа тохирсон ганцаарчилсан хичээл.',whyEn:'One-to-one lessons at your pace.',categories:['education']},
 {id:'mentor',mn:'Ажил мэргэжлийн зөвлөх',en:'Career mentoring',whyMn:'Туршлагатай хүнээс зөвлөгөө авах.',whyEn:'Guidance from someone experienced.',categories:['education']},
 {id:'team',mn:'Байгууллагын сургалт',en:'Team training',whyMn:'Багийнхаа ур чадварыг нэг дор дээшлүүлэх.',whyEn:'Upskill the whole team.',categories:['education','business']}
 ]},
 wellbeing:{key:'wellbeing',mn:'Сэтгэл зүйн дэмжлэг',en:'Psychological support',mnWhy:'Нууцлалтай уулзалтыг зөвхөн баталгаажсан мэргэжилтэнтэй хийнэ. Амь насанд аюултай яаралтай үед 103 руу залгана уу.',enWhy:'Private sessions only with verified professionals. In a life-threatening emergency in Mongolia, call 103.',solutions:[
 {id:'consult',mn:'Сэтгэл зүйн зөвлөгөө',en:'Psychological consultation',whyMn:'Мэргэжлийн, нууцлалтай яриа.',whyEn:'A private, professional conversation.',categories:['wellbeing']},
 {id:'stress',mn:'Стресс удирдах',en:'Stress management',whyMn:'Өдөр тутмын ачааллаа зохицуулах арга.',whyEn:'Ways to handle everyday pressure.',categories:['wellbeing']},
 {id:'workplace',mn:'Ажлын байрны сэтгэл зүй',en:'Workplace wellbeing',whyMn:'Багийнхаа сэтгэл зүйн уур амьсгалыг сайжруулах.',whyEn:'Improve your team’s wellbeing.',categories:['wellbeing','education']}
 ]},
 general:{key:'general',mn:'Төслийн хэрэгцээг тодорхойлох',en:'Define the project',mnWhy:'Зорилго, одоогийн нөхцөл, хүсэж буй үр дүнгээ тайлбарлахад хангалттай.',enWhy:'Describe your goal, current situation and intended result.',solutions:[
 {id:'consult',mn:'Төслийн зөвлөгөө ба төлөвлөлт',en:'Project planning',whyMn:'Төслийн эхний шаардлагыг тодорхойлох.',whyEn:'Clarify project requirements.',categories:['business']},
 {id:'design',mn:'Дизайн ба дижитал шийдэл',en:'Design & digital delivery',whyMn:'Ямар төрлийн шийдэл хэрэгтэйг харьцуулах.',whyEn:'Explore possible delivery approaches.',categories:['creative','tech']},
 {id:'market',mn:'Маркетинг ба контент',en:'Marketing & content',whyMn:'Хэрэглэгчид хүрэх арга барилаа сонгох.',whyEn:'Choose ways to reach your audience.',categories:['marketing','creative']}
 ]}
};
export const HIDDEN_OUTCOMES:OutcomeKey[]=['learning','wellbeing'];
const keywords:Record<Exclude<OutcomeKey,'general'>,RegExp>={
 automation:/автомат|automati|automation|automat|n8n|make.com|zapier|chatbot|бот|bot|crm|integrat|давтаг|гараар|систем холб|ajil hɵngɵ|ajil hongol|ai agent/i,
 growth:/борлуул|захиалга.*(бага|нэм|олон)|захиалг.*өс|үйлчлүүлэгч|орлого нэм|sales|growth|revenue|customer|booking.*(more|increase)|zahialga|borluulalt|ads|хэрэглэгч.*тат/i,
 content:/reels|рийл|рилс|контент|content|видео|video|зураг.*пост|social|сошиал|пост|post|tiktok|instagram/i,
 website:/website|вэб|веб|web|сайт|site|ecommerce|онлайн дэлгүүр|landing|app|апп/i,
 brand:/лого|logo|брэнд|brand|танигдах|design|дизайн|identity/i,
 analytics:/тайлан|report|dashboard|аналитик|analyt|өгөгдөл|data|kpi|excel|sheet/i,
 startup:/компани байгуул|компани нээ|бизнес эхл|бизнес нээ|стартап|startup|start a (company|business)|хх(к|компани)|kompani baiguul|biznes ehl/i,
 finance:/татвар|нягтлан|санхүү|tax|accounting|bookkeep|tatvar|nyagtlan|sanhuu|cash ?flow|мөнгөн урсгал/i,
 legal:/хууль|гэрээ|хуульч|lawyer|legal|contract|huuli|geree|зөвшөөрөл|license/i,
 learning:/сурмаар|сурах|хичээл|багш|англи хэл|ielts|tutor|lesson|learn|course|ментор|mentor|surah|hicheel|bagsh/i,
 wellbeing:/стресс|сэтгэл|сэтгэл зүй|psycholog|stress|burnout|anxiety|setgel/i
};
export const problemExamples=[
 {key:'growth' as const,mn:'Борлуулалт, захиалгаа нэмэгдүүлэх',en:'Grow sales and bookings',exampleMn:'Манай рестораны захиалга бага байна',exampleEn:'We want more restaurant bookings'},
 {key:'automation' as const,mn:'Давтагддаг ажлаа автоматжуулах',en:'Automate routine work',exampleMn:'Facebook захиалгыг автоматаар бүртгэмээр байна',exampleEn:'Automate incoming Facebook orders'},
 {key:'content' as const,mn:'Контент ба сошиалаа хөгжүүлэх',en:'Improve social content',exampleMn:'Дэлгүүртээ Reels хийлгэмээр байна',exampleEn:'I need better Reels for my store'},
 {key:'website' as const,mn:'Вэбсайт, онлайн үйлчилгээ эхлүүлэх',en:'Launch a digital product',exampleMn:'Манай компанид вэбсайт хэрэгтэй',exampleEn:'Our company needs a website'}
];
export function classifyNeed(input:string):Outcome{
 const clean=input.trim().slice(0,1200);
 if(!clean)return solutions.general;
 // V71 (owner): learning and wellbeing services are not offered for now; those needs fall back to «general».
 const scores=Object.entries(keywords).filter(([key])=>!HIDDEN_OUTCOMES.includes(key as OutcomeKey)).map(([key,rx])=>({key:key as Exclude<OutcomeKey,'general'>,score:(clean.match(new RegExp(rx.source,'gi'))||[]).length}));
 scores.sort((a,b)=>b.score-a.score);
 return scores[0]?.score>0?solutions[scores[0].key]:solutions.general;
}
export function matchingPublished(services:PublishedMatch[],solution:Solution,limit=3):PublishedMatch[]{
 // The source list must be the published opt-in catalog returned by RPC.
 return services.filter(s=>solution.categories.includes(legacyCategory(s.category)?.category||s.category)).slice(0,limit);
}
export function buildProjectBrief(input:string,audience:Audience,language:'mn'|'en',budget?:string,timeline?:string):string{
 const goal=input.trim().replace(/\s+/g,' ').slice(0,1200);
 const outcome=classifyNeed(goal);
 const ideas=outcome.solutions.map(x=>language==='mn'?x.mn:x.en).join(', ');
 if(language==='en')return ['PROJECT BRIEF','Context: '+(audience==='business'?'Business':'Personal'),'Goal: '+(goal||'To be confirmed'),'Possible approaches (to discuss): '+ideas,'Budget: '+(budget?.trim()||'To be discussed'),'Timeline: '+(timeline?.trim()||'To be discussed'),'Deliverables, access permissions and success criteria: To be agreed with the freelancer.'].join('\n');
 return ['ТӨСЛИЙН ХҮСЭЛТ','Хэрэглэгч: '+(audience==='business'?'Байгууллага / бизнес':'Хувь хүн'),'Зорилго: '+(goal||'Тодруулах'),'Хэлэлцэх боломжит шийдлүүд: '+ideas,'Төсөв: '+(budget?.trim()||'Тохиролцоно'),'Хугацаа: '+(timeline?.trim()||'Тохиролцоно'),'Хүлээлгэн өгөх үр дүн, өгөгдөлд хандах эрх ба амжилтын хэмжүүрийг мэргэжилтэнтэй тохиролцоно.'].join('\n');
}
