import {test} from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import {readFileSync} from 'node:fs';
const read=(p)=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const taxUrl='data:text/javascript;base64,'+Buffer.from(ts.transpileModule(read('lib/marketplace/taxonomy.ts'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64');
const js=ts.transpileModule(read('lib/marketplace/solution-finder.ts').replace("from './taxonomy';","from '"+taxUrl+"';"),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {classifyNeed,matchingPublished,buildProjectBrief,problemExamples}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
test('restaurants with fewer orders are routed to growth and multiple approaches',()=>{
 const o=classifyNeed('Манай рестораны захиалга бага байна. Илүү олон үйлчлүүлэгчтэй болохыг хүсэж байна.');
 assert.equal(o.key,'growth');assert.deepEqual(o.solutions.map(s=>s.id),['ads','content','booking']);
});
test('Mongolian romanized and English automation map to automation',()=>{
 for(const q of ['Facebook zahialga automataar burtgeh','Манай ажлыг автоматжуулах','Automate CRM with n8n'])
  assert.equal(classifyNeed(q).key,'automation',q);
});
test('personal brand, site and content queries have appropriate pathways',()=>{
 for(const [q,key] of [['Лого дизайн хийлгэмээр байна','brand'],['I need a website','website'],['Reels контент бүтээх','content'],['Excel тайлан','analytics']])
  assert.equal(classifyNeed(q).key,key,q);
});
test('unknown query never fabricates claimed result or specific freelancer',()=>{
 const o=classifyNeed('xyz no match');assert.equal(o.key,'general');
 const match=matchingPublished([{id:'s1',category:'design',title:'Logo',description:'Logo',display_name:'Real seller',slug:'seller',price:100000}],o.solutions[0]);
 assert.deepEqual(match,[]);
});
test('real matching uses only provided service rows and category, never generates profiles',()=>{
 const list=[{id:'real-id',category:'marketing',title:'Real advertising',description:'Campaign',display_name:'Real seller',slug:'real-seller',price:200000}];
 const first=classifyNeed('борлуулалт').solutions[0];
 assert.deepEqual(matchingPublished(list,first).map(s=>s.id),['real-id']);
 assert.deepEqual(matchingPublished([],first),[]);
});
test('brief preserves user intent, buyer segment and no made-up fees',()=>{
 const brief=buildProjectBrief('Манай рестораны захиалга бага байна','business','mn','300,000 ₮','14 хоног');
 assert.match(brief,/Манай рестораны захиалга бага байна/);
 assert.match(brief,/Байгууллага/);
 assert.match(brief,/300,000 ₮/);
 assert.match(brief,/14 хоног/);
 assert.doesNotMatch(brief,/баталгаатай|100% ROI/);
});
test('UX integration includes real Hero route and optional signup context',()=>{
 assert.equal(problemExamples.length,4);
 assert.match(read('components/signature-home.tsx'),/action="\/solutions\/"/);
 assert.match(read('components/premium-marketplace.tsx'),/<BusinessSolutions en=\{en\}/);
 assert.match(read('components/premium-auth.tsx'),/hustle-buyer-context/);
 assert.match(read('components/solution-finder.tsx'),/rpc\('marketplace_catalog'\)/);
 assert.match(read('app/solutions/page.tsx'),/<PremiumMarketplace view="solutions"\/>/);assert.match(read('components/premium-marketplace.tsx'),/\{view==='solutions'&&<SolutionFinder en=\{en\} embedded\/>\}/);
});
test('Smart Finder reveals results on every search and explains a short query',()=>{
 const f=readFileSync(new URL('../components/solution-finder.tsx',import.meta.url),'utf8');
 assert.match(f,/scrollIntoView\(\{behavior:still\?'instant':'smooth',block:'start'\}\)/);
 assert.match(f,/heading\.focus\(\{preventScroll:true\}\)/);
 assert.match(f,/history\.replaceState/);
 assert.doesNotMatch(f,/disabled=\{query\.trim\(\)\.length<5\}/);
 assert.match(f,/id="hustle-need-hint" role="alert"/);
});
