import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const home=readFileSync(new URL('../components/signature-home.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../app/v56-search-hints.css',import.meta.url),'utf8');
test('homepage finder animates its rotating example searches',()=>{
 assert.match(home,/import '\.\.\/app\/v56-search-hints\.css'/);
 assert.match(home,/placeholder=\{examples\[exampleIndex\]\+'…'\}/,'real placeholder stays for assistive tech');
 assert.match(home,/className="hx-search-hint" aria-hidden="true"><span key=\{exampleIndex\}>/,'overlay re-mounts per example so it animates');
 assert.match(home,/!search&&<span className="hx-search-hint"/,'overlay disappears once the visitor types');
 assert.match(home,/prefers-reduced-motion: reduce/,'rotation still stops for reduced motion');
 assert.match(css,/has-hint input::placeholder\{color:transparent\}/);
 assert.match(css,/pointer-events:none/);
 assert.match(css,/@keyframes hx-hint-in/);
 assert.match(css,/prefers-reduced-motion:reduce\)\{[^}]*animation:none/);
});
