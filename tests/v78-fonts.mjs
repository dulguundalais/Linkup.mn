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
test('reset page: one clear state at a time, title fits, logo smaller than the title',()=>{
 const r=read('components/reset-password.tsx'),css=read('app/v78-reset.css');
 assert.match(r,/const invalid=!loading&&!ready&&!notice;/);
 assert.match(r,/Холбоосын хугацаа дууссан/);
 assert.match(r,/className="hustle-auth-submit v78-reset-action" href="\/login\/\?reset=1"/);
 assert.doesNotMatch(r,/Сэргээх холбоос дутуу, хугацаа нь дууссан эсвэл/);
 assert.match(css,/\.v78-reset-intro h1\{font-size:clamp\(22px/);
 assert.match(css,/\.hustle-auth-brand \.linkup-wordmark\{height:22px\}/);
});
