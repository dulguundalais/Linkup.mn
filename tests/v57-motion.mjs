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
test('pages fade in with opacity only and motion stops for reduced-motion visitors',()=>{
 assert.match(css,/@keyframes v57-page-in\{from\{opacity:0\}to\{opacity:1\}\}/);
 assert.doesNotMatch(css.match(/@keyframes v57-page-in[^\n]*/)[0],/transform/);
 assert.match(css,/prefers-reduced-motion:reduce\)\{\s*html\{scroll-behavior:auto\}/);
 assert.match(css,/transition-duration:\.01ms!important/);
});
