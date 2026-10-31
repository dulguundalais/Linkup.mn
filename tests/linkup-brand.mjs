import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync,statSync} from 'node:fs';
import {join} from 'node:path';

const root=new URL('..',import.meta.url).pathname;
const read=p=>readFileSync(join(root,p),'utf8');
function sources(dir){
 return readdirSync(join(root,dir)).flatMap(name=>{
  const path=join(dir,name);
  if(statSync(join(root,path)).isDirectory())return sources(path);
  return /\.(tsx?|mjs)$/.test(name)?[path]:[];
 });
}

test('no user-visible Hustle brand text remains in application source',()=>{
 const leftovers=[];
 for(const file of ['app','components','lib','functions'].flatMap(sources)){
  if(file==='app/legacy-home.tsx')continue; // retired V1 preview, not routed
  read(file).split('\n').forEach((line,i)=>{
   const code=line.trim();
   if(/^(\/\/|\/\*|\*)/.test(code))return; // comments are not shown to users
   const visible=line.replace(/X-Hustle-Storage-(Step|Status)/g,'').replace(/HustleLocalOnly/g,'').replace(/HUSTLE_SUPPORT_(EMAIL|URL)/g,'');
   if(/Hustle|HUSTLE|hustle\.mn|hustle✳|hustle<span>✳/.test(visible))leftovers.push(file+':'+(i+1));
  });
 }
 assert.deepEqual(leftovers,[]);
});

test('the Linkup wordmark replaces every text logo and follows the theme colour',()=>{
 const mark=read('components/linkup-wordmark.tsx');
 assert.match(mark,/fill="currentColor"/);
 assert.match(mark,/aria-label=\{decorative\?undefined:'Linkup'\}/);
 for(const file of ['components/site-header.tsx','components/premium-footer.tsx','components/premium-auth.tsx','components/reset-password.tsx','components/solution-finder.tsx','components/guided-entry.tsx'])
  assert.match(read(file),/<LinkupWordmark/,file);
 assert.match(read('components/site-header.tsx'),/className="hx-brand" href="\/" aria-label="Linkup"/);
});

test('favicon and share card use the Linkup brand',()=>{
 assert.match(read('app/icon.svg'),/^<svg[^>]+viewBox="0 0 512 512"/);
 assert.ok(statSync(join(root,'public/og/linkup.png')).size>10000);
 assert.match(read('lib/marketplace/public-portfolio-render.ts'),/\/og\/linkup\.png/);
 assert.match(read('app/layout.tsx'),/title: 'Linkup — /);
});
