import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('V55: homepage service section is titled for the experts and shows a count',()=>{
 const c=read('components/live-catalog.tsx');
 assert.match(c,/Мэргэжилтнүүд ба тэдний үйлчилгээ/);
 assert.match(c,/className="v55-count"/);
 assert.doesNotMatch(c,/Төслөө хэрэгжүүлэх хүнээ олоорой/);
 assert.match(c,/import '\.\.\/app\/v55-service-cards\.css';/);
 assert.match(c,/<small>\{t\('Хугацаа','Delivery'\)\}<\/small>/);
});

test('V55: compact three-column cards with a white primary button',()=>{
 const css=read('app/v55-service-cards.css');
 assert.match(css,/grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
 assert.match(css,/\.v39-card-cover\{height:150px;flex:0 0 150px\}/);
 assert.match(css,/\.v39-primary\{min-height:44px;border-radius:12px;background:#fff/);
});
