import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('every page loads Manrope and falls back to fonts that have ү and ө',()=>{
 const layout=read('app/layout.tsx'),css=read('app/v78-fonts.css');
 assert.match(layout,/href="https:\/\/fonts\.googleapis\.com\/css2\?family=Manrope:wght@400;500;600;700;800&display=swap"/);
 assert.match(layout,/import '\.\/v78-fonts\.css';/);
 assert.match(css,/html body,html body \.hustle-v5\{font-family:Manrope,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif\}/);
});
