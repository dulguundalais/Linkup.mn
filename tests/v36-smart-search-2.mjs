import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

const read=p=>readFileSync(p,'utf8');
const smartSource=read('lib/marketplace/smart-search.ts');
const taxonomySource=read('lib/marketplace/taxonomy.ts');
const liveSource=read('lib/marketplace/live-discovery.ts').replace("import {normalizeSearch,searchTokens,typoClose} from './smart-search';",'').replace(/import \{[^}]*\} from '\.\/taxonomy';/,'').replace(/import \{[^}]*\} from '\.\/explore-filters';/,'');
// V69: live-discovery uses the Explore filter helpers; bundle them the same way.
const filtersSource=read('lib/marketplace/explore-filters.ts').replace(/import type \{[^}]*\} from '\.\/live-discovery';/,'');
const js=[smartSource,taxonomySource,filtersSource,liveSource].map(source=>ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).join('\n');
const {normalizeSearch,searchTokens,typoClose,liveSearchScore,filterLiveServices,suggestLiveServices}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));

function listing(id,category,title,en,price=50000,extra={}){
 return {id,category,title,title_en:en,description:'Professional services for real businesses',display_name:'Beta Seller',headline:'Independent expert',price,delivery_days:4,revisions:2,package_name:'Basic',slug:'beta-seller',
 packages:[{tier:'Basic',price,delivery_days:4,revisions:2,summary:'Full delivery',includes:['Editable files']}],...extra};
}
const actual=[
 listing('real-design','design','Брэнд дизайн, лого','Custom logo and branding',60000),
 listing('real-web','web','Вэбсайт хөгжүүлэх','Website development',100000),
 listing('real-video','video','Видео эвлүүлэг','Social media video editing',85000),
 listing('real-translate','translation','Орчуулга','Mongolian translation',25000),
 listing('real-ui','ui','Мобайл апп интерфейс','Mobile app interface design',110000)
];
const search=(query,items=actual)=>filterLiveServices(items,{query,category:'all',sort:'featured',onlySaved:false,saved:[]});

test('normalization supports Cyrillic, Latin romanization and stop words',()=>{
 assert.equal(normalizeSearch('ЛОГО!'),'logo');
 assert.equal(normalizeSearch('Вэб сайт'),'veb sait');
 assert.equal(searchTokens('logo hiilgeh').join(' '),'logo');
 assert.equal(searchTokens('Лого хийлгэх').includes('logo'),true);
});
test('bilingual and romanized synonyms find the correct published category',()=>{
 for(const term of ['logo','лого','brend','брэнд','logoo'])assert.equal(search(term)[0]?.id,'real-design',term);
 for(const term of ['web','veb','вэб','веб сайт','website','сайт'])assert.equal(search(term)[0]?.id,'real-web',term);
 for(const term of ['reels','rilс','видео','montaj','эвлүүлэг'])assert.ok(search(term).some(s=>s.id==='real-video'),term);
 for(const term of ['translation','орчуулга','orchuulga'])assert.equal(search(term)[0]?.id,'real-translate',term);
});
test('a single typo and adjacent transposed characters are tolerated without widening to irrelevant categories',()=>{
 assert.equal(typoClose('website','websiet'),true);
 assert.equal(typoClose('logo','logp'),true);
 assert.equal(typoClose('logo','pizza'),false);
 assert.equal(search('websiet')[0]?.id,'real-web');
 assert.equal(search('logp')[0]?.id,'real-design');
 assert.deepEqual(search('zzzzzzzz'),[]);
});
test('all meaningful search terms are required, with original title relevance above category-only fallback',()=>{
 const items=[
  listing('category-match','design','Брэнд үйлчилгээ','General branding'),
  listing('title-match','design','Лого','Logo')
 ];
 assert.equal(search('logo',items)[0]?.id,'title-match');
 assert.ok(liveSearchScore(items[1],'logo')>liveSearchScore(items[0],'logo'));
 assert.deepEqual(search('logo video'),[]);
});
test('package contents and seller names remain searchable and category/saved filters stay constrained',()=>{
 const items=[
  listing('pack','web','Онлайн систем','Online system',60000,{packages:[{tier:'Basic',price:60000,delivery_days:3,revisions:1,summary:'Stripe integration',includes:['Stripe integration']}]}),
  listing('other','design','Лого','Logo',35000)
 ];
 assert.equal(search('stripe',items)[0]?.id,'pack');
 assert.deepEqual(filterLiveServices(items,{query:'logo',category:'web',sort:'featured',onlySaved:false,saved:[]}),[]);
 assert.deepEqual(filterLiveServices(items,{query:'logo',category:'all',sort:'featured',onlySaved:true,saved:['pack']}),[]);
});
test('price sort stays numerical and suggestions contain only passed-in real results',()=>{
 const items=[
  listing('high','design','Лого иж бүрэн','Logo full',95000),
  listing('low','design','Лого энгийн','Logo basic',20000)
 ];
 assert.deepEqual(filterLiveServices(items,{query:'logo',category:'all',sort:'low',onlySaved:false,saved:[]}).map(s=>s.id),['low','high']);
 assert.deepEqual(filterLiveServices(items,{query:'logo',category:'all',sort:'high',onlySaved:false,saved:[]}).map(s=>s.id),['high','low']);
 assert.deepEqual(suggestLiveServices(items,'logo',1).map(s=>s.id),['high']);
 assert.deepEqual(suggestLiveServices(items,'',4),[]);
 assert.deepEqual(suggestLiveServices([], 'logo',4),[]);
});
test('homepage and Explore preserve real-data-only typeahead and existing notifications',()=>{
 const home=read('components/signature-home.tsx');
 const page=read('components/premium-marketplace.tsx')+read('components/site-header.tsx');
 const real=read('components/live-catalog.tsx');
 assert.match(home,/suggestLiveServices\(published,search,4\)/);
 assert.match(home,/role="combobox"/);
 assert.match(home,/aria-activedescendant/);
 assert.match(home,/role="listbox"/);
 assert.match(home,/href=\{'\/listing\/\?id='\+encodeURIComponent\(item.id\)\}/);
 assert.match(page,/suggestLiveServices\(exploreListings,query,5\)/);
 assert.match(page,/window\.history\.replaceState/);
 assert.match(page,/role="combobox"/);
 assert.match(page,/GlobalNotifications/);
 assert.ok(page.indexOf("{view==='explore'&&<section")<page.indexOf("{(view==='home'||view==='explore')&&<LiveCatalog"));
 assert.match(real,/rpc\('marketplace_catalog'\)/);
 assert.doesNotMatch(liveSource,/from ['"]\.\/catalog['"]/);
});
