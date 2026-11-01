import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const js=ts.transpileModule(read('lib/marketplace/explore-filters.ts'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const F=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const svc=(id,price,days,tags=[],pkgs)=>({id,price,delivery_days:days,tags,packages:pkgs||[]});

test('URL values are validated: numbers only, known day options, unique skills',()=>{
 const f=F.readExtra(new URLSearchParams('price_min=500000&price_max=100000&days=5&skills=Figma,figma, Photoshop ,,'+'x'.repeat(60)));
 assert.deepEqual([f.priceMin,f.priceMax],[100000,500000],'swapped when reversed');
 assert.equal(f.maxDays,null,'only 3/7/14');
 assert.deepEqual(f.skills,['Figma','Photoshop','x'.repeat(40)]);
 assert.equal(F.readExtra(new URLSearchParams('price_min=-5&price_max=1e9&days=7')).priceMin,null);
 const u=new URL('https://x.test/explore/?q=a');F.writeExtra(u,{priceMin:1000,priceMax:null,maxDays:7,skills:['Figma','UX']});
 assert.equal(u.search,'?q=a&price_min=1000&days=7&skills=Figma%2CUX');
 F.writeExtra(u,F.EMPTY_EXTRA);assert.equal(u.search,'?q=a');
});
test('price and delivery use the starting package, the same numbers the card shows',()=>{
 const s=svc('1',900000,20,[],[{price:300000,delivery_days:5},{price:600000,delivery_days:3}]);
 assert.deepEqual(F.serviceStart(s),{price:300000,days:5});
 assert.ok(F.matchesExtra(s,{priceMax:300000,maxDays:7}));
 assert.ok(!F.matchesExtra(s,{priceMin:300001}));
 assert.ok(!F.matchesExtra(s,{maxDays:3}));
});
test('skills match any chosen skill, ignoring case; options come only from real tags',()=>{
 const a=svc('a',1,1,['Figma','UX']),b=svc('b',1,1,['figma ']),c=svc('c',1,1,null);
 assert.ok(F.matchesExtra(a,{skills:['figma','React']}));
 assert.ok(!F.matchesExtra(c,{skills:['Figma']}));
 assert.deepEqual(F.skillOptions([a,b,c]),[{label:'Figma',count:2},{label:'UX',count:1}]);
 assert.deepEqual(F.skillOptions([c]),[],'no tags → no skills section');
 assert.equal(F.activeExtraCount({priceMin:1,priceMax:2,maxDays:3,skills:['x','y']}),4);
});
test('the panel is wired into Explore and the catalog',()=>{
 const m=read('components/premium-marketplace.tsx'),d=read('components/explore-filter-drawer.tsx'),c=read('components/live-catalog.tsx'),l=read('lib/marketplace/live-discovery.ts');
 assert.match(m,/className="v69-filter-button" onClick=\{\(\)=>setFiltersOpen\(true\)\} aria-haspopup="dialog"/);
 assert.match(m,/<ExploreFilterDrawer /);
 assert.match(m,/extra=\{view==='explore'\?extra:EMPTY_EXTRA\}/,'home preview is never filtered');
 assert.match(m,/<option value="fast">/);
 assert.match(c,/filterLiveServices\(services,\{query,category,subcategory,sort,onlySaved,saved,\.\.\.extra\}\)/);
 assert.match(l,/&&matchesExtra\(s,filters\)\}\)/);
 assert.match(d,/role="dialog" aria-modal="true"/);
 assert.match(d,/e\.key==='Escape'/);
 assert.match(d,/\{skills\.length>0&&<section/,'skills only when sellers have tagged');
 assert.doesNotMatch(d,/Full-time|Years experience|Upgrade|\bPro\b/);
});
test('"Clear filters" on an empty result resets in place instead of linking to the same page',()=>{
 const m=read('components/premium-marketplace.tsx'),c=read('components/live-catalog.tsx');
 assert.match(m,/onClearFilters=\{view==='explore'\?\(\)=>\{setQuery\(''\);setCat\('all'\);setSub\(''\);setOnlySaved\(false\);setExtra\(EMPTY_EXTRA\)\}:undefined\}/);
 assert.match(c,/onClearFilters\?<button type="button" className="v39-empty-link" onClick=\{onClearFilters\}>/);
});
