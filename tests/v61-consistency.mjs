import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const ui=['components/solution-finder.tsx','components/guided-entry.tsx','components/premium-auth.tsx','components/project-matching.tsx'].map(read).join('\n');
test('audiences are called Хувь хүн and Байгууллага everywhere',()=>{
 assert.doesNotMatch(ui,/Бизнес \/ байгууллага|t\('Бизнес','|Хувийн төсөл','Personal project|Бизнесийн хэрэгцээ/);
 assert.match(read('components/solution-finder.tsx'),/t\('Хувь хүн','Personal'\)[\s\S]*t\('Байгууллага','Organization'\)/,'Хувь хүн first, as on the homepage');
});
test('homepage category cards use the category names from the taxonomy',async()=>{
 const src=read('lib/marketplace/taxonomy.ts');
 const js=ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;
 const tax=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
 for(const card of tax.SHOWCASE){
  const c=tax.categoryById(card.key);
  assert.equal(card.mn,c.mn,card.key);assert.equal(card.en,c.en,card.key);
 }
 // V72 (owner): no «Хууль ба санхүү» group anywhere; the legal category is «Хууль, эрх зүй».
 assert.equal(tax.categoryById('legal').mn,'Хууль, эрх зүй');
 assert.ok(!tax.SHOWCASE.some(c=>c.mn==='Хууль ба санхүү'));
 assert.doesNotMatch(read('components/category-directory.tsx'),/LEGAL_FINANCE_GROUP|cdir-pair/);
});
test('finder page: one purpose, no extra copy, clear result and new search',()=>{
 const f=read('components/solution-finder.tsx');
 assert.doesNotMatch(f,/Үйлчилгээний нэрийг мэдэхгүй байсан ч болно|Кирилл · латин галиг|finder-prompts|LINKUP · Шийдэл хайх/);
 assert.match(f,/<Breadcrumbs en=\{en\} items=\{\[\{label:t\('Нүүр','Home'\),href:'\/'\}/);
 assert.match(f,/className="finder-searched">\{t\('Таны хайлт:'/);
 assert.match(f,/className="finder-new-search" onClick=\{newSearch\}/);
});
test('Mongolian labels in the footer, a neutral heading for the service cards',()=>{
 const footer=read('components/premium-footer.tsx');
 assert.doesNotMatch(footer,/mn:'Marketplace'|'Seller Studio','Seller Studio'|'Cookie Policy'|'Ангиллууд'/);
 assert.equal(footer.match(/'\/about\/'/g).length,1,'About appears once');
 assert.doesNotMatch(read('components/live-catalog.tsx'),/Шилдэг мэргэжилтнүүд/);
});
