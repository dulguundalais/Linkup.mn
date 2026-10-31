import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(path,'utf8');
const home=read('components/premium-marketplace.tsx')+read('components/site-header.tsx');
const hero=read('components/signature-home.tsx');
const discover=read('components/v19-discovery.tsx');
const catalog=read('components/live-catalog.tsx');
const guided=read('components/guided-entry.tsx');
const css=read('app/v45-art-direction.css');

test('V45 replaces redundant copy with concise bilingual value proposition',()=>{
 // V50: the hero headline is now the HUSTLE-COLLAB one chosen by the owner.
 assert.match(hero,/Асуудал бүрт/);
 assert.match(hero,/шийдэл бий\./);
 assert.match(hero,/Every problem/);
 assert.doesNotMatch(hero,/Бизнесээ хөгжүүлэх, ажлаа автоматжуулах, санаагаа хэрэгжүүлэхэд/);
 assert.doesNotMatch(hero,/signature-problem-prompts/);
 assert.doesNotMatch(hero,/Кирилл, латин галиг, англиар хайх/,'V59: helper line removed by the owner');
 assert.match(discover,/Ур чадвараар хай/);
 assert.doesNotMatch(home,/<V19FeaturedIntro en=\{en\}\/>/);
 assert.doesNotMatch(home,/Доорх бодит үйлчилгээнүүд, багц болон үнийг шүүнэ/);
});
test('V45 retains authenticated marketplace behavior and working guided discovery',()=>{
 assert.match(hero,/<GuidedEntry en=\{en\}\/>/);
 assert.match(hero,/action="\/solutions\/"/);
 assert.match(hero,/marketplace_catalog/);
 assert.match(hero,/signature-search-suggestions/);
 assert.match(guided,/className="guided-entry-choice/);
 assert.match(catalog,/const HOME_COUNT=6/);
 assert.match(catalog,/contactSellerHref\(s.slug,signedIn\)/);
 assert.match(catalog,/marketplace_catalog/);
 assert.match(home,/GlobalNotifications/);
 assert.match(home,/AccountMenu account=\{account\}/);
});
test('V45 visual scope stays in public storefront and respects mobile and reduced motion',()=>{
 assert.match(home,/import '\.\.\/app\/v45-art-direction.css'/);
 assert.match(css,/\.hustle-v5:not\(\.workspace\)/);
 assert.match(css,/@media\(max-width:480px\)/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(css,/\.v19-category-card:first-child/);
 assert.match(css,/\.signature-search:focus-within/);
 assert.match(css,/\.v39-catalog-home \.v39-description\{display:none\}/);
 assert.doesNotMatch(css,/\.workspace-layout|\.chat-thread|\.order-card/);
});
