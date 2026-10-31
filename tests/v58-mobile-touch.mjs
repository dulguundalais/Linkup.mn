import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const css=read('app/v58-mobile-touch.css'),header=read('components/site-header.tsx'),layout=read('app/layout.tsx');
test('touch-target rules load globally after the motion rules',()=>{
 assert.match(layout,/import '\.\/v57-motion\.css';\nimport '\.\/v58-mobile-touch\.css';/);
});
test('phone controls are at least 44px tall',()=>{
 assert.match(css,/\.hx-icon\{min-height:44px;min-width:44px\}/);
 assert.match(css,/\.hx-nav>a\{min-height:48px/);
 assert.match(css,/\.v39-heart::before\{content:'';position:absolute;inset:-4px/,'36px heart gets a 44px tap area');
 assert.match(css,/\.footer-columns nav a\{display:inline-flex;align-items:center;min-height:44px\}/);
 assert.match(css,/\.signature-process-switch button\{min-height:44px\}/);
});
test('the phone menu closes on an outside tap as well as Escape',()=>{
 assert.match(header,/addEventListener\('pointerdown',outside\)/);
 assert.match(header,/!header\.contains\(e\.target as Node\)\)setMenu\(false\)/);
 assert.match(header,/e\.key==='Escape'/);
});
