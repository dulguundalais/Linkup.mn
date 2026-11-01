import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('every page reads the saved theme before the browser paints',()=>{
 for(const f of ['lib/use-site-theme.ts','components/premium-marketplace.tsx','components/partner-program.tsx','components/workspace.tsx']){
  assert.match(read(f),/useLayoutEffect\(\(\)=>\{try\{setDark\(localStorage\.getItem\('hustle-theme'\)==='dark'\)\}catch\{\};endThemeLoading\(\)\},\[\]\);/,f);
 }
});
test('a fresh dark load keeps the light pre-built page hidden on the dark background until it turns dark',()=>{
 const layout=read('app/layout.tsx');
 // Inline in the root layout: present on every page before any stylesheet loads.
 assert.match(layout,/html\.v65-pre-dark\.v65-loading body>:is\(\.hustle-v5,\.v50-listing-page\):not\(\.night\)\{visibility:hidden\}/);
 assert.match(layout,/html\.v65-pre-dark,html\.v65-pre-dark body\{background:#050c22/);
 assert.match(layout,/<style dangerouslySetInnerHTML=\{\{__html:PRE_PAINT_CSS\}\}\/>/);
 // The guard always ends, even if the app never starts.
 assert.match(layout,/classList\.remove\('v65-loading'\)\},3000\)/);
 assert.doesNotMatch(layout,/opacity:0/);
});
