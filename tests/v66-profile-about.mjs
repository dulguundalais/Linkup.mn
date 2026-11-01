import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const src=read('lib/marketplace/public-portfolio-render.ts').replace(/^import[^\n]*\n/,'const creativeToolFor=()=>null,brandLogoFor=()=>null;\n');
const m=await import('data:text/javascript;base64,'+Buffer.from(ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64'));
const long=['One.','Two '+'x'.repeat(300),'Three '+'y'.repeat(300),'- A\n- B'].join('\n\n');
test('a long bio shows its opening and folds the rest without any script',()=>{
 const html=m.renderBioFolded(long,'Дэлгэрэнгүй унших','Хураах');
 const [head,rest]=html.split('<details');
 assert.match(head,/<p>One\.<\/p><p>Two /);
 assert.ok(rest&&/Three/.test(rest)&&/portfolio-bio-list/.test(rest));
 assert.match(html,/<summary><span class="portfolio-bio-open">Дэлгэрэнгүй унших<\/span><span class="portfolio-bio-close">Хураах<\/span><\/summary>/);
 assert.doesNotMatch(html,/<script/);
});
test('a short bio is not folded; labels are escaped',()=>{
 assert.doesNotMatch(m.renderBioFolded('Short bio.','x','y'),/<details/);
 assert.match(m.renderBioFolded(long,'<b>','y'),/&lt;b&gt;/);
});
test('About keeps the contact button beside the bio, without repeating the hero numbers',()=>{
 const r=read('lib/marketplace/public-portfolio-render.ts');
 assert.doesNotMatch(r,/portfolio-about-facts/);
 assert.match(r,/class="portfolio-about-cta"/);
 const css=read('public/public-profile.css');
 assert.match(css,/\.portfolio-about-aside\{position:sticky/);
 assert.match(css,/\.portfolio-bio-list\{[^}]*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
});
test('hero follows the reference: role, name, portrait, real counts; services are rows',()=>{
 const r=read('lib/marketplace/public-portfolio-render.ts');
 assert.match(r,/<p class="v66-hero-role">/);
 assert.match(r,/<div class="v66-hero-portrait"><div class="portfolio-hero-avatar">/);
 assert.match(r,/heroStats=\[\[services\.length,[^\]]*\],\[photos\.length,[^\]]*\],\[tools\.length,/,'only real counts');
 assert.match(r,/<a class="v66-service-row" href="'\+link\+'">/);
 assert.doesNotMatch(r,/Сайн байна уу, би/);
});
