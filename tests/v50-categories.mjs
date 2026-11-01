import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const read=p=>readFileSync(p,'utf8');
const load=async(src,extra='')=>import('data:text/javascript;base64,'+Buffer.from(ts.transpileModule(src+extra,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64'));
const tax=await load(read('lib/marketplace/taxonomy.ts'));
const sql=read('supabase/migrations/20261026040835_v50_professional_categories.sql');

test('11 main categories with unique ids and subcategories; legal and wellbeing are regulated',()=>{
  assert.equal(tax.ALL_CATEGORIES.length,11);
  assert.equal(new Set(tax.ALL_CATEGORIES.map(c=>c.id)).size,11);
  for(const c of tax.ALL_CATEGORIES){
    assert.ok(c.subcategories.length>=6,c.id);
    assert.equal(new Set(c.subcategories.map(s=>s.id)).size,c.subcategories.length,c.id);
    for(const s of c.subcategories)assert.match(s.id,/^[a-z0-9-]{2,40}$/);
  }
  assert.deepEqual(tax.ALL_CATEGORIES.filter(c=>c.regulated).map(c=>c.id).sort(),['legal','wellbeing']);
  // V71 (owner, 2026-11-02): education and wellbeing are hidden for now, everywhere.
  assert.deepEqual(tax.HIDDEN_CATEGORIES,['education','wellbeing']);
  assert.equal(tax.CATEGORIES.length,9);
  for(const id of tax.HIDDEN_CATEGORIES){
    assert.ok(!tax.CATEGORY_IDS.includes(id),id);
    assert.equal(tax.categoryById(id),undefined,id);
    assert.equal(tax.normalizeCategory(id),'all',id);
    assert.ok(!tax.SHOWCASE.some(c=>c.categories.includes(id)),id);
  }
  assert.deepEqual(tax.REGULATED,['legal']);
});
test('database checks list exactly the taxonomy ids',()=>{
  const ids=[...sql.matchAll(/category in\s*\(\s*'ai'[^)]*\)/g)].map(m=>[...m[0].matchAll(/'([a-z]+)'/g)].map(x=>x[1]).sort().join(','));
  assert.ok(ids.length>=3);
  // The database keeps accepting every defined id, so hidden categories can return without a migration.
  for(const list of ids)assert.equal(list,tax.ALL_CATEGORIES.map(c=>c.id).sort().join(','));
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
test('showcase: featured cards first; every category reachable; legal and finance each have a card',()=>{
  assert.deepEqual(tax.SHOWCASE.slice(0,7).map(c=>c.key),['ai','business','marketing','tech','legal','finance','creative']);
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
  assert.deepEqual(tax.ALL_SERVICE_TYPES.map(s=>s.id),['fixed','hourly','custom','monthly','mentoring']);
  // V71 (owner): «Ментор ба сургалт» is not offered for now; an existing row still gets its label.
  assert.deepEqual(tax.SERVICE_TYPES.map(s=>s.id),['fixed','hourly','custom','monthly']);
  assert.equal(tax.serviceTypeById('mentoring').id,'mentoring');
});
