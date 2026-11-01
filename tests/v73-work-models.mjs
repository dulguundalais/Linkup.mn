import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('work models: one card per model fills the row, each with an icon',()=>{
 const d=read('components/category-directory.tsx'),css=read('app/v73-work-models.css');
 assert.match(d,/<span className="cdir-model-icon" aria-hidden="true"><Icon size=\{22\}/);
 assert.match(d,/MODEL_ICONS:Record<string,typeof Package>=\{fixed:Package,hourly:Clock3,custom:FileText,monthly:Repeat\}/);
 assert.match(css,/\.cdir-models ul\{grid-template-columns:repeat\(var\(--models,4\),minmax\(0,1fr\)\)/,'one column per model');
 assert.match(d,/'--models':SERVICE_TYPES\.length/);
 assert.match(d,/import '\.\.\/app\/v73-work-models\.css';/);
});
