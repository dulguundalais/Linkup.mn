import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import ts from 'typescript';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('"Become a freelancer" opens the sign-up form, not sign-in',()=>{
 assert.match(read('components/workspace.tsx'),/\[register,setRegister\]=useState\(login&&entry==='seller'\)/);
 assert.match(read('app/join/seller/page.tsx'),/<Workspace login entry="seller"\/>/);
});
test('browser tab titles are Mongolian',()=>{
 for(const p of ['about','buyers','contact','cookies','faq','freelancers','privacy','terms','buyer','project-requests','seller-requests','admin','auth/reset']){
  const title=read('app/'+p+'/page.tsx').match(/title:'([^']*)'/)[1];
  assert.match(title,/[А-Яа-яӨөҮүЁё]/,p+': '+title);
 }
});
test('a Mongolian 404 page with ways forward',()=>{
 assert.ok(existsSync(new URL('../app/not-found.tsx',import.meta.url)));
 const page=read('components/not-found-page.tsx');
 assert.match(page,/Энэ хуудас олдсонгүй/);
 for(const href of ['href="/"','href="/explore/"','href="/solutions/"'])assert.ok(page.includes(href),href);
});
test('service pages name the tab; Explore has a page heading; info pages speak Mongolian',()=>{
 assert.match(read('components/live-listing-detail.tsx'),/document\.title=title\+' — Linkup'/);
 assert.match(read('components/premium-marketplace.tsx'),/<h1 className="v63-explore-title">/);
 const info=read('components/information-page.tsx');
 assert.doesNotMatch(info,/LINKUP \/ \{page\.toUpperCase\(\)\}|Үйлчилгээ рүү буцах/);
 assert.match(info,/Нүүр хуудас руу буцах/);
});
test('public profile: short hero, bio rendered once with safe bold and lists',async()=>{
 const src=read('lib/marketplace/public-portfolio-render.ts').replace(/^import[^\n]*\n/,'const creativeToolFor=()=>null,brandLogoFor=()=>null;\n');
 const js=ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;
 const m=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
 const bio='First line of my story.\n\n**My core areas:**\n\n- Strategy\n- <b>Research</b>';
 const html=m.renderBio(bio);
 assert.match(html,/<strong>My core areas:<\/strong>/);
 assert.match(html,/<ul><li>Strategy<\/li><li>&lt;b&gt;Research&lt;\/b&gt;<\/li><\/ul>/,'list items stay escaped');
 assert.doesNotMatch(html,/\*\*/);
 assert.equal(m.bioLead(bio),'First line of my story.');
 assert.ok(m.bioLead('x'.repeat(400)).length<=220);
 const r=read('lib/marketplace/public-portfolio-render.ts');
 assert.match(r,/e\(bioLead\(heroBio\)\|\|/);
 assert.match(r,/heroBio\?renderBio\(heroBio\)/);
 assert.doesNotMatch(r,/>PROJECT '/);
});
