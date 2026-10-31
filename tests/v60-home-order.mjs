import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const home=read('components/premium-marketplace.tsx'),sig=read('components/signature-home.tsx'),cats=read('components/category-showcase.tsx'),biz=read('components/business-solutions.tsx'),css=read('app/v60-home-sections.css');
test('homepage sections follow the owner order',()=>{
 const order=["<SignatureHero en={en}/>","<SignatureProcess en={en}/>","<CategoryShowcase en={en}/>","&&<LiveCatalog","<BusinessSolutions en={en}/>","<SignatureSellerBand en={en}/>","<SignaturePartner en={en}/>","<PremiumFooter en={en}/>"].map(n=>home.indexOf(n));
 assert.ok(order.every(i=>i>0),JSON.stringify(order));
 for(let i=1;i<order.length;i++)assert.ok(order[i-1]<order[i],'section '+i+' out of order');
 assert.equal(home.match(/<BusinessSolutions /g).length,1,'each section once');
 assert.doesNotMatch(home+sig,/SignatureStory/);
});
test('how it works: three icon cards joined by a line, buyer/freelancer switch kept, beta note kept',()=>{
 assert.match(sig,/<ol className="v60-steps">/);
 assert.match(sig,/v60-step-icon/);
 assert.match(sig,/setMode\('seller'\)/);
 assert.match(sig,/No real payments or escrow during open beta/);
 assert.doesNotMatch(sig,/Гурван энгийн алхам/,'extra subtitle removed');
 assert.match(css,/\.v60-step:not\(:last-child\)::after/);
});
test('categories: compact grid of the same ten links',()=>{
 assert.match(cats,/SHOWCASE\.map/);
 assert.match(cats,/className="cat-card v60-cat"/);
 assert.match(cats,/Эрэлттэй ангиллууд/);
 assert.doesNotMatch(cats,/cat-track|className="cat-arrow|scrollBy/,'carousel removed');
 assert.match(css,/\.v60-cat-grid\{[^}]*repeat\(5,minmax\(0,1fr\)\)/);
});
test('business solutions: four short titles the owner named',()=>{
 for(const title of ["mn:'Маркетинг'","mn:'Автоматжуулалт'","mn:'Брэнд'","mn:'Онлайн үйлчилгээ'"])assert.ok(biz.includes(title),title);
});
