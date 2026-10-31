import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const hero=read('components/signature-home.tsx'),guided=read('components/guided-entry.tsx'),css=read('app/v59-hero-cleanup.css');
const heroBlock=hero.slice(hero.indexOf('export function SignatureHero'),hero.indexOf('const buyerSteps'));
test('hero shows only the title, the search and the two audience choices',()=>{
 for(const gone of ['hx-hero-eyebrow','Шийдэл хайх','Хэрэгцээгээ бичээд шийдлээ олоорой','hx-hero-sub"','Хийлгэх ажил байгаа ч','Кирилл, латин галиг','hx-hero-subline'])assert.ok(!heroBlock.includes(gone),gone);
 const order=['hx-hero-title','hx-hero-search','<GuidedEntry'].map(x=>heroBlock.indexOf(x));
 assert.ok(order.every(i=>i>0)&&order[0]<order[1]&&order[1]<order[2],'title → search → choices');
 assert.match(heroBlock,/action="\/solutions\/" method="get"/,'search still submits to the finder');
 assert.match(heroBlock,/suggestLiveServices/,'live suggestions kept');
 assert.doesNotMatch(heroBlock,/chip/i,'no suggestion chips under the search');
});
test('choices read Хувь хүн / Байгууллага, keep their behaviour and drop the visible heading',()=>{
 assert.match(guided,/<strong>\{t\('Байгууллага','Organization'\)\}<\/strong>/);
 assert.doesNotMatch(guided,/Бизнес \/ байгууллага|Эсвэл хэрэгцээнээсээ эхлээрэй/);
 assert.match(guided,/role="group" aria-label=\{t\('Хэрэгцээнээсээ эхлэх'/);
 assert.match(guided,/onClick=\{\(\)=>start\('personal'\)\}/);
 assert.match(guided,/onClick=\{\(\)=>start\('business'\)\}/);
});
test('hero is shorter and centred on every width',()=>{
 assert.match(hero,/import '\.\.\/app\/v59-hero-cleanup\.css'/);
 assert.match(css,/\.hx-hero-frame\{min-height:clamp\(480px,68svh,640px\)\}/);
 assert.match(css,/\.hx-hero-guided\{display:flex;justify-content:center\}/);
});
