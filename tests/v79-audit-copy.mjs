import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('F04: partner numbers are not painted from a default and then swapped',()=>{
 const terms=read('lib/marketplace/partner-terms.ts');
 assert.match(terms,/termValue=\(terms:PartnerTerms\|null,key:keyof PartnerTerms\)=>terms\?String\(terms\[key\]\):'–'/);
 const home=read('components/signature-home.tsx'),pp=read('components/partner-program.tsx');
 assert.match(home,/useState<PartnerTerms\|null>\(null\)/,'home starts with no numbers');
 assert.match(pp,/useState<Rules\|null>\(null\)/,'partner page starts with no numbers');
 for(const f of [home,pp])assert.doesNotMatch(f,/\{(terms|rules)\.(partner_percent|attribution_days|reward_months)\}/,'every number goes through termValue');
 assert.match(pp,/setRules\(r=>r\|\|DEFAULT_PARTNER_TERMS\)/,'a failed load still ends in numbers, not dashes');
});

test('F03: partner copy matches the backend — rewards come from invited buyers',()=>{
 const home=read('components/signature-home.tsx'),info=read('lib/site-information.ts');
 assert.doesNotMatch(home,/Мэргэжилтнүүдийг Linkup-д урьж|Introduce skilled freelancers/);
 assert.match(home,/Шинэ захиалагч, бизнесийг Linkup-д урьж/);
 assert.doesNotMatch(info,/Мэргэжилтнүүдийг Linkup-д урьж|Мэргэжилтнүүдийг танилцуулах түншлэл/);
 const sql=read('supabase/migrations/20261028090000_v53_partner_self_service.sql');
 assert.match(sql,/r\.referred_id=new\.buyer_id/,'reward basis is the referred buyer');
});

test('F01: info@linkup.mn is published on contact, FAQ and privacy',()=>{
 const sc=read('lib/marketplace/support-channel.ts'),page=read('components/information-page.tsx'),info=read('lib/site-information.ts');
 assert.match(sc,/OFFICIAL_SUPPORT:SupportChannel=\{email:'info@linkup\.mn',url:null\}/);
 assert.match(page,/useState<SupportChannel\|null>\(OFFICIAL_SUPPORT\)/);
 assert.doesNotMatch(info,/хараахан нийтлэгдээгүй|will not invent an unverified support email|existing trusted channel/);
 assert.ok((info.match(/info@linkup\.mn/g)||[]).length>=4);
});

test('O02–O04: small copy fixes',()=>{
 const info=read('lib/site-information.ts');
 assert.doesNotMatch(info,/"2\. Профайл ба Бүтээлийн"/);
 assert.match(info,/"2\. Профайл ба бүтээлийн жишээ"/);
 assert.doesNotMatch(read('app/categories/page.tsx'),/боловсрол|сэтгэл зүй/);
 assert.doesNotMatch(read('components/category-art.tsx'),/\+\d+%/,'no invented figures in decorative art');
});
