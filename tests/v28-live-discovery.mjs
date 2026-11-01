import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const norm=read('lib/marketplace/smart-search.ts').replace("import type {Service} from './catalog';",'');
const normJs=ts.transpileModule(norm,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const normUrl='data:text/javascript;base64,'+Buffer.from(normJs).toString('base64');
const taxJs=ts.transpileModule(read('lib/marketplace/taxonomy.ts'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const taxUrl='data:text/javascript;base64,'+Buffer.from(taxJs).toString('base64');
// V69: live-discovery uses the Explore filter helpers.
const filtersJs=ts.transpileModule(read('lib/marketplace/explore-filters.ts'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const filtersUrl='data:text/javascript;base64,'+Buffer.from(filtersJs).toString('base64');
const moduleText=read('lib/marketplace/live-discovery.ts').replace("from './explore-filters';","from '"+filtersUrl+"';").replace("import {normalizeSearch,searchTokens,typoClose} from './smart-search';","import {normalizeSearch,searchTokens,typoClose} from '"+normUrl+"';").replace("from './taxonomy';","from '"+taxUrl+"';");
const js=ts.transpileModule(moduleText,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {filterLiveServices,suggestLiveServices,liveServicePrice}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const service=(id,title,category,price,pkg=[])=>({id,title,title_en:title,description:title,category,price,delivery_days:5,revisions:1,package_name:'Basic',display_name:'QA Seller',headline:'Expert',slug:'qa-seller',packages:pkg});
const items=[service('1','Брэнд лого дизайн','design',180000,[{tier:'Basic',price:150000,includes:['Logo'],delivery_days:4,revisions:1}]),service('2','Вэб сайт хөгжүүлэлт','web',800000,[{tier:'Basic',price:600000,includes:['Responsive website'],delivery_days:7,revisions:2}]),service('3','Видео монтаж','video',100000)];
const filters={query:'',category:'all',sort:'featured',onlySaved:false,saved:[]};
test('published matches use mixed Cyrillic, latin and English aliases',()=>{
 for(const term of ['лого','logo','brend'])assert.deepEqual(filterLiveServices(items,{...filters,query:term}).map(s=>s.id),['1']);
 for(const term of ['сайт','web','website'])assert.deepEqual(filterLiveServices(items,{...filters,query:term}).map(s=>s.id),['2']);
});
test('price sort takes authored minimum package pricing and saved controls',()=>{
 assert.equal(liveServicePrice(items[0]),150000);
 assert.deepEqual(filterLiveServices(items,{...filters,sort:'low'}).map(s=>s.id),['3','1','2']);
 assert.deepEqual(filterLiveServices(items,{...filters,sort:'high'}).map(s=>s.id),['2','1','3']);
 assert.deepEqual(filterLiveServices(items,{...filters,onlySaved:true,saved:['2']}).map(s=>s.id),['2']);
 assert.deepEqual(filterLiveServices(items,{...filters,category:'design'}).map(s=>s.id),['1']);
});
test('live suggestions never invent data from demo catalog',()=>{
 assert.deepEqual(suggestLiveServices(items,'logo').map(s=>s.id),['1']);
 assert.deepEqual(suggestLiveServices(items,'zzzzzz'),[]);
 assert.deepEqual(suggestLiveServices(items,' '),[]);
});
test('Explore filters use live results and homepage autocomplete is live',()=>{
 const ui=read('components/premium-marketplace.tsx');
 const catalog=read('components/live-catalog.tsx');
 const hero=read('components/signature-home.tsx');
 assert.match(ui,/onSave=\{save\}/);
 assert.match(ui,/onlySaved=\{onlySaved\}/);
 assert.match(catalog,/filterLiveServices\(services/);
 assert.match(hero,/suggestLiveServices\(published,search,4\)/);
});
