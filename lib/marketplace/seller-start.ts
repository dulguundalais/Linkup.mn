// V84 (owner, 2026-11-03): a new freelancer always sees where they are on the way
// to their first published service — ① profile → ② service → ③ published.
export type StartState='done'|'current'|'waiting'|'todo';
export type StartStep={key:'profile'|'service'|'publish';state:StartState;mn:string;en:string;noteMn:string;noteEn:string;actionMn?:string;actionEn?:string};
export type StartInput={isSeller:boolean;name:string|null|undefined;headline:string|null|undefined;statuses:string[]};

export function sellerStartSteps(i:StartInput):StartStep[]{
 const profileDone=i.isSeller&&(i.name||'').trim().length>=2&&(i.headline||'').trim().length>=3;
 const live=i.statuses.filter(s=>s!=='archived');
 const has=(s:string)=>live.includes(s);
 const serviceDone=live.length>0;
 const profile:StartStep=profileDone
  ?{key:'profile',state:'done',mn:'Профайл',en:'Profile',noteMn:'Бэлэн',noteEn:'Ready'}
  :{key:'profile',state:'current',mn:'Профайл',en:'Profile',noteMn:'Нэр, мэргэжлээ бичнэ',noteEn:'Add your name and headline',actionMn:'Профайл бөглөх',actionEn:'Fill in profile'};
 const service:StartStep=serviceDone
  ?{key:'service',state:'done',mn:'Үйлчилгээ',en:'Service',noteMn:'Нэмэгдсэн',noteEn:'Added'}
  :{key:'service',state:profileDone?'current':'todo',mn:'Үйлчилгээ',en:'Service',noteMn:'Юу хийж өгөх, үнэ, хугацаа',noteEn:'What you do, price and time',...(profileDone?{actionMn:'Үйлчилгээ нэмэх',actionEn:'Add a service'}:{})};
 let publish:StartStep;
 if(has('published'))publish={key:'publish',state:'done',mn:'Нийтлэгдсэн',en:'Published',noteMn:'Захиалагчид харагдаж байна',noteEn:'Buyers can see it'};
 else if(has('rejected'))publish={key:'publish',state:'current',mn:'Нийтлэх',en:'Publish',noteMn:'Засвар шаардлагатай',noteEn:'Changes needed',actionMn:'Засах',actionEn:'Edit'};
 else if(has('pending'))publish={key:'publish',state:'waiting',mn:'Нийтлэх',en:'Publish',noteMn:'Админ шалгаж байна',noteEn:'Admin is reviewing'};
 else if(has('draft'))publish={key:'publish',state:'current',mn:'Нийтлэх',en:'Publish',noteMn:'Ноорог — хянуулахаар илгээнэ',noteEn:'Draft — send it for review',actionMn:'Илгээх',actionEn:'Send'};
 else publish={key:'publish',state:'todo',mn:'Нийтлэх',en:'Publish',noteMn:'Админ шалгаад нийтэлнэ',noteEn:'Goes live after a check'};
 return [profile,service,publish];
}
/** The tracker disappears once a service is live. */
export const sellerStartComplete=(steps:StartStep[])=>steps.every(s=>s.state==='done');
/** The service the publish step's action should open (rejected first, then a draft). */
export function serviceToFinish<T extends {status:string}>(services:T[]):T|undefined{
 return services.find(s=>s.status==='rejected')||services.find(s=>s.status==='draft');
}
