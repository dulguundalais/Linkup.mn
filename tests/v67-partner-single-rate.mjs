import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('partners see one 1% rate, the invite window and the reward period — not the platform commission',()=>{
 const home=read('components/signature-home.tsx'),pp=read('components/partner-program.tsx'),info=read('lib/site-information.ts');
 const band=home.slice(home.indexOf('signature-partner-stats'),home.indexOf('signature-partner-stats')+600);
 assert.match(band,/<strong>1%<\/strong>/);
 assert.doesNotMatch(band,/2%|10%|Платформын шимтгэл/);
 assert.doesNotMatch(pp,/active_partner_percent|Идэвхтэй түнш|Growth Partner/);
 assert.match(pp,/\{rules\.partner_percent\}%/);
 assert.match(pp,/\{rules\.reward_months\} \{t\('сар','months'\)\}/);
 assert.doesNotMatch(info,/идэвхтэй түншийнх 2%|1%, 2%/);
});
test('partner page labels are Mongolian',()=>{
 const pp=read('components/partner-program.tsx');
 assert.doesNotMatch(pp,/>LINKUP \/ PARTNERS<|<span>GROW TOGETHER<\/span>|<small>CONNECT<\/small>|Seller эсвэл Buyer/);
});
test('the rate change is documented as one audited business_rules update, not a migration',()=>{
 const doc=read('docs/PARTNER-SINGLE-RATE-20261101.md');
 assert.match(doc,/update public\.business_rules set active_partner_percent = partner_percent where id = true;/);
});
