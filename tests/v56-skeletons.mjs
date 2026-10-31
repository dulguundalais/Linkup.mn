import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const catalog=read('components/live-catalog.tsx'),detail=read('components/live-listing-detail.tsx'),css=read('app/v56-skeletons.css');
test('service cards load as card-shaped skeletons',()=>{
 assert.match(catalog,/import '\.\.\/app\/v56-skeletons\.css'/);
 assert.match(catalog,/role="status" aria-label=\{t\('Үйлчилгээ ачаалж байна'/,'screen readers still hear the loading state');
 for(const part of ['v56-sk-cover','v56-sk-avatar','v56-sk-chip','v56-sk-title','v56-sk-foot','v56-sk-button'])assert.ok(catalog.includes(part),part);
});
test('the service page loads as a skeleton of its two columns, not a line of text',()=>{
 assert.match(detail,/import '\.\.\/app\/v56-skeletons\.css'/);
 assert.match(detail,/v28-detail-grid v56-sk-detail" role="status"/);
 assert.doesNotMatch(detail,/role="status">\{t\('Үйлчилгээ ачаалж байна…'/);
 assert.match(detail,/v56-sk-offer/);
});
test('skeleton styles match the cards, follow night mode and respect reduced motion',()=>{
 assert.match(css,/\.v56-sk-card \.v56-sk-cover\{height:150px/);
 assert.match(css,/repeat\(3,minmax\(0,1fr\)\)/);
 assert.match(css,/\.night\{--v56-sk-base:/);
 assert.match(css,/prefers-reduced-motion:reduce\)\{\.v56-sk\{animation:none\}/);
});
