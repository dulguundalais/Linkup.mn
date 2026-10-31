import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const read=p=>readFileSync(p,'utf8');
const load=path=>{
 const js=ts.transpileModule(read(path),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const mod={exports:{}};new Function('exports','module',js)(mod.exports,mod);return mod.exports;
};
const {friendlyError}=load('lib/marketplace/friendly-errors.ts');
const {combineNotices}=load('lib/marketplace/notification-center.ts');

test('friendly errors never leak database text and stay bilingual',()=>{
 const raw={code:'23514',message:'new row for relation "orders" violates check constraint "orders_brief_check"'};
 assert.equal(friendlyError(raw,false),'Оруулсан мэдээллээ шалгана уу.');
 assert.equal(friendlyError(raw,true),'Please check the details you entered.');
 assert.doesNotMatch(friendlyError({code:'XX000',message:'relation "public.orders" does not exist'},true),/relation|orders/);
 assert.equal(friendlyError({message:'Revision limit reached',code:'P0001'},true),'This package has no revisions left.');
 assert.match(friendlyError({message:'Email not confirmed',status:400},false),/баталгаажуулаагүй/);
 assert.match(friendlyError({code:'email_not_confirmed'},true),/not confirmed/);
 assert.match(friendlyError(new TypeError('Failed to fetch'),true),/Network problem/);
 assert.match(friendlyError({message:'JWT expired',code:'PGRST301'},true),/session has expired/);
 assert.equal(friendlyError(new Error('Брифээ 20+ тэмдэгтээр бичнэ үү.'),false),'Брифээ 20+ тэмдэгтээр бичнэ үү.','our own UI errors pass through');
 assert.equal(friendlyError(null,true),'Something went wrong. Please try again.');
});

test('notifications deep-link to the exact order, request and chat',()=>{
 const at='2026-10-26T09:00:00Z';
 const {items}=combineNotices(
  [{id:'p1',recipient_id:'u',request_id:'r-1',kind:'invited',created_at:at,read_at:null}],
  [{id:'o1',recipient_id:'u',order_id:'o-9',kind:'delivered',created_at:at,read_at:null}],
  []);
 for(const n of items){
  if(n.source==='order')assert.match(n.href,/[?&]order=o-9$/);
  if(n.source==='project')assert.match(n.href,/[?&]request=r-1$/);
 }
 assert.match(read('components/global-notifications.tsx'),/chatHref\+'&peer='\+encodeURIComponent\(item\.id\)/);
});

test('delivery history and files: private bucket, server-side guard, rollback documented',()=>{
 const m=read('supabase/migrations/20261026034838_v52_order_deliveries.sql');
 assert.match(m,/-- Rollback/);
 assert.match(m,/values\('order-files','order-files',false/,'bucket is private');
 assert.match(m,/revoke all on public\.order_events from anon,authenticated;\s*grant select on public\.order_events to authenticated;/,'clients cannot write history');
 assert.match(m,/create trigger v52_order_file_guard before insert on public\.order_files/);
 assert.match(m,/new\.uploader_id=auth\.uid\(\);new\.round=o\.revisions_used/,'server sets uploader and round');
 assert.doesNotMatch(m.replace(/--.*$/mg,''),/payment|escrow|commission/i,'no money movement in schema');
 const w=read('components/workspace.tsx');
 assert.match(w,/createSignedUrl\(/,'files are opened through short-lived signed URLs');
 assert.doesNotMatch(w,/getPublicUrl\([^)]*order-files/);
 assert.doesNotMatch(w,/service_role|SERVICE_ROLE/);
});

test('orders show the next step and messaging pages per conversation',()=>{
 const w=read('components/workspace.tsx');
 assert.match(w,/v52-next-step/);
 assert.match(w,/loadOlderMessages\(/);
 assert.match(w,/olderByPeer/);
 assert.match(w,/setError\(friendlyError\(e,en\)\)/);
 const d=read('components/live-listing-detail.tsx');
 assert.match(d,/isQuote=kind\?\.id==='custom'/,'custom pricing asks for a quote instead of a fixed order');
 assert.match(d,/'\/buyer\/\?tab=orders'\+\(orderId\?'&order='\+encodeURIComponent\(orderId\):''\)/);
});

test('package editor labels follow the pricing model the freelancer picked',()=>{
 const pk=read('components/service-packages.tsx');
 assert.match(pk,/serviceTypeById\(serviceType\|\|/);
 assert.match(pk,/t\('Жишиг эхлэх үнэ \(₮\)','Example starting price \(MNT\)'\)/);
 assert.match(pk,/<label>\{priceLabel\}<input type="number"/);
 assert.match(read('components/service-category-fields.tsx'),/useEffect\(\(\)=>\{onTypeChange\?\.\(type\)\},\[type\]\)/);
 const w=read('components/workspace.tsx');
 assert.match(w,/onTypeChange=\{setServiceKind\}/);
 assert.match(w,/serviceType=\{serviceKind\}/);
});

test('Explore keeps search, category, saved-only and sort in the URL; Back restores filters',()=>{
 const m=read('components/premium-marketplace.tsx');
 assert.match(m,/if\(onlySaved\)u\.searchParams\.set\('saved','1'\)/);
 assert.match(m,/if\(sort!=='featured'\)u\.searchParams\.set\('sort',sort\)/);
 assert.match(m,/if\(prevCat!==cat\)window\.history\.pushState/,'a new category is a history entry');
 assert.match(m,/else window\.history\.replaceState/,'typing does not flood history');
 assert.match(m,/window\.addEventListener\('popstate',pop\)/);
 assert.match(m,/\},\[ready,view,query,cat,sub,onlySaved,sort\]\);/);
});
