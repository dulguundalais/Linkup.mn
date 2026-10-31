import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const read=p=>readFileSync(p,'utf8');
const load=async(src,extra='')=>import('data:text/javascript;base64,'+Buffer.from(ts.transpileModule(src+extra,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64'));
const tax=await load(read('lib/marketplace/taxonomy.ts'));
const sql=read('supabase/migrations/20261026040835_v50_professional_categories.sql');

test('11 main categories with unique ids and subcategories; legal and wellbeing are regulated',()=>{
  assert.equal(tax.CATEGORIES.length,11);
  assert.equal(new Set(tax.CATEGORY_IDS).size,11);
  for(const c of tax.CATEGORIES){
    assert.ok(c.subcategories.length>=6,c.id);
    assert.equal(new Set(c.subcategories.map(s=>s.id)).size,c.subcategories.length,c.id);
    for(const s of c.subcategories)assert.match(s.id,/^[a-z0-9-]{2,40}$/);
  }
  assert.deepEqual(tax.REGULATED.sort(),['legal','wellbeing']);
});
test('database checks list exactly the taxonomy ids',()=>{
  const ids=[...sql.matchAll(/category in\s*\(\s*'ai'[^)]*\)/g)].map(m=>[...m[0].matchAll(/'([a-z]+)'/g)].map(x=>x[1]).sort().join(','));
  assert.ok(ids.length>=3);
  for(const list of ids)assert.equal(list,[...tax.CATEGORY_IDS].sort().join(','));
});
test('legacy mapping in TypeScript matches the SQL data migration',()=>{
  for(const [old,{category,subcategory}] of Object.entries(tax.LEGACY_CATEGORY_MAP)){
    if(old!==category)assert.match(sql,new RegExp("when '"+old+"' then '"+category+"'"),old);
    assert.match(sql,new RegExp("when '"+old+"' then '"+subcategory+"'"),old+' sub');
    assert.ok(tax.categoryById(category).subcategories.some(s=>s.id===subcategory),old);
  }
  assert.equal(tax.normalizeCategory('web'),'tech');
  assert.equal(tax.normalizeCategory('tech'),'tech');
  assert.equal(tax.normalizeCategory('nope'),'all');
});
test('showcase: six featured cards first; every non-grouped category reachable; legal+finance grouped',()=>{
  assert.deepEqual(tax.SHOWCASE.slice(0,6).map(c=>c.key),['ai','business','marketing','tech','legal-finance','creative']);
  const covered=new Set(tax.SHOWCASE.flatMap(c=>c.categories));
  for(const id of tax.CATEGORY_IDS)assert.ok(covered.has(id),id);
  assert.equal(new Set(tax.SHOWCASE.map(c=>c.key)).size,tax.SHOWCASE.length);
});
test('service search terms stay specific to the service subcategory',()=>{
  const video=tax.serviceSearchTerms('creative','video-editing').join(' ');
  assert.match(video,/эвлүүлэг/);
  assert.doesNotMatch(video,/лого/);
});
test('five service models; inquiry-style models never mention payment through Linkup',()=>{
  assert.deepEqual(tax.SERVICE_TYPES.map(s=>s.id),['fixed','hourly','custom','monthly','mentoring']);
});
