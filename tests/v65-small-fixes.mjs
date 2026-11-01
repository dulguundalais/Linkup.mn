import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const flows=await import('data:text/javascript;base64,'+Buffer.from(ts.transpileModule(read('lib/marketplace/ux-flows.ts'),{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64'));
test('guests sent to sign in are told why',()=>{
 const save=new URL(flows.signInWithReturn('/explore/','buyer','save'),'https://x.test');
 assert.equal(save.searchParams.get('why'),'save');
 assert.equal(new URL(flows.signInWithReturn('/explore/'),'https://x.test').searchParams.has('why'),false,'plain sign-in has no reason');
 const r=q=>flows.signInReason(new URLSearchParams(q));
 assert.equal(r('why=save&next=%2Fexplore%2F'),'save');
 assert.equal(r('mode=buyer&seller=studio'),'message');
 assert.equal(r('mode=buyer&next=%2Flisting%2F%3Fid%3Dx'),'order');
 assert.equal(r('mode=buyer&next=%2Fproject-requests%2F'),'request');
 assert.equal(r('mode=buyer&next=%2Fexplore%2F'),null);
 assert.equal(r('why=evil'),null);
 const auth=read('components/premium-auth.tsx');
 assert.match(auth,/className="hustle-auth-reason" role="note"/);
 assert.match(auth,/reason\?t\('Нэвтэрч үргэлжлүүлнэ үү','Sign in to continue'\):t\('Эргэн тавтай морил','Welcome back'\)/);
 assert.match(read('components/premium-marketplace.tsx'),/signInWithReturn\(location\.pathname\+location\.search,'buyer','save'\)/);
});
test('the saved theme reaches info pages, service pages and 404',()=>{
 for(const f of ['components/information-page.tsx','components/live-listing-detail.tsx','components/not-found-page.tsx']){
  const s=read(f);
  assert.match(s,/useSiteTheme\(\)/,f);
  assert.match(s,/dark=\{dark\} onToggleTheme=\{toggleTheme\}/,f);
  assert.match(s,/\(dark\?" night":""\)/,f);
 }
 const css=read('app/v65-small-fixes.css');
 for(const sel of ['.hustle-info.night{','.v50-listing-page.night{','.v65-plain-page.night{'])assert.ok(css.includes(sel),sel);
 // V68: the pre-paint dark background moved inline into the root layout (applies on every page).
 assert.ok(read('app/layout.tsx').includes('html.v65-pre-dark,html.v65-pre-dark body{background:#050c22'));
 assert.match(read('lib/use-site-theme.ts'),/localStorage\.setItem\('hustle-theme',next\?'dark':'light'\)/);
});
test('the service page remembers a language switch',()=>{
 assert.match(read('components/live-listing-detail.tsx'),/localStorage\.setItem\('hustle-language',next\?'en':'mn'\)/);
});
test('saved list explains how to save; footer has no duplicate pricing link',()=>{
 const c=read('components/live-catalog.tsx');
 assert.match(c,/onlySaved\?t\('Таалагдсан үйлчилгээн дээрх ♡-г дарж хадгалаарай\. Энд харагдана\.'/);
 assert.doesNotMatch(read('components/premium-footer.tsx'),/Үнийн багцууд/);
});
