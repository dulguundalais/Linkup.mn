import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const layout=readFileSync(new URL('../app/layout.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../app/v57-motion.css',import.meta.url),'utf8');
test('motion rules load once, after the global stylesheet',()=>{
 assert.match(layout,/import '\.\/globals\.css';\nimport '\.\/v57-motion\.css';/);
});
test('hover transitions name their properties instead of transition:all',()=>{
 assert.doesNotMatch(css,/transition:all/);
 assert.match(css,/button,a\{transition:color var\(--motion-fast\)/);
});
test('page content is never hidden behind an animation and motion stops for reduced-motion visitors',()=>{
 assert.doesNotMatch(css,/main\{animation/,'pages never start invisible');
 assert.match(css,/prefers-reduced-motion:reduce\)\{\s*html\{scroll-behavior:auto\}/);
 assert.match(css,/transition-duration:\.01ms!important/);
});
