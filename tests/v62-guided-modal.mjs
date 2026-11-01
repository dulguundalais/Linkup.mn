import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const g=read('components/guided-entry.tsx'),css=read('app/v62-guided-modal.css');
test('the dialog asks one question, with no extra lines',()=>{
 assert.doesNotMatch(g,/GUIDED DISCOVERY|Хэрэгцээгээ тодорхойлох'|guided-step-meta|01 \/ 02|START WITH A GOAL|guided-selection-hint|SOLUTIONS TO CONSIDER/);
 assert.doesNotMatch(g,/Нэгийг сонгох эсвэл өөрийн үгээр|Чиглэлээ сонгоод тохирох/,'owner removed the line under the question');
});
test('audience can be switched inside the dialog and keeps the same names',()=>{
 assert.match(g,/className="guided-audience-switch" role="group"/);
 assert.match(g,/onClick=\{\(\)=>switchAudience\('personal'\)\}><UserRound[^>]*\/>\{t\('Хувь хүн','Personal'\)\}/);
 assert.match(g,/onClick=\{\(\)=>switchAudience\('business'\)\}><Building2[^>]*\/>\{t\('Байгууллага','Organization'\)\}/);
});
test('choices point forward, the own-words field is one more row, results keep their back step',()=>{
 assert.match(g,/<ChevronRight size=\{18\} className="guided-goal-next"/);
 assert.doesNotMatch(g,/<ArrowUpRight size=\{16\} className="guided-goal-next"/);
 assert.match(g,/className="guided-sr-only" htmlFor="guided-custom-problem"/);
 assert.match(g,/\{screen==='results'&&<>\s*<div className="guided-modal-footer">/);
 assert.match(css,/\.guided-goal\{min-height:60px/);
 assert.match(css,/\.guided-custom-row input\{min-height:56px/);
});
