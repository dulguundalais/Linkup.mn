import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const read=p=>readFileSync(p,'utf8');
const load=path=>{
 const js=ts.transpileModule(read(path),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const mod={exports:{}};new Function('exports','module',js)(mod.exports,mod);return mod.exports;
};
const flows=load('lib/marketplace/ux-flows.ts');
const buyer=load('lib/marketplace/buyer-profile.ts');
const memory=()=>{const m=new Map();return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),m}};

test('buyer display name comes from the e-mail, never empty or too short',()=>{
 assert.equal(buyer.defaultDisplayName('dulguun.s@gmail.com'),'Dulguun S');
 assert.equal(buyer.defaultDisplayName('anu_bat-2024@x.mn'),'Anu Bat');
 assert.equal(buyer.defaultDisplayName('a@x.mn'),'Linkup хэрэглэгч');
 assert.equal(buyer.defaultDisplayName(''),'Linkup хэрэглэгч');
 assert.ok(buyer.defaultDisplayName('x'.repeat(200)+'@x.mn').length<=80);
});

test('ensureBuyerProfile keeps an existing (seller) profile and only creates when missing',async()=>{
 const calls=[];
 const fake=rows=>({from:table=>{const b={select:()=>b,eq:()=>b,single:()=>b,
  insert:row=>{calls.push(['insert',table,row]);rows.push({id:row.id,display_name:row.display_name,is_seller:false});return b},
  then:(res,rej)=>Promise.resolve(calls.length&&calls.at(-1)[0]==='insert'?{data:rows.at(-1),error:null}:{data:rows,error:null}).then(res,rej)};return b}});
 const seller=[{id:'u1',display_name:'Seller',is_seller:true}];
 const kept=await buyer.ensureBuyerProfile(fake(seller),{id:'u1',email:'s@x.mn'});
 assert.equal(kept.is_seller,true);
 assert.equal(calls.length,0,'never overwrites an existing profile');
 const made=await buyer.ensureBuyerProfile(fake([]),{id:'u2',email:'new.buyer@x.mn'});
 assert.equal(made.display_name,'New Buyer');
 const [,table,row]=calls[0];
 assert.equal(table,'profiles');
 assert.deepEqual(Object.keys(row).sort(),['display_name','id','is_seller','public_profile']);
 assert.equal(row.is_seller,false);assert.equal(row.public_profile,false);
});

test('login intent: next wins, otherwise service/tier or seller/ctx are rebuilt safely',()=>{
 const p=s=>new URLSearchParams(s);
 assert.equal(flows.intentFromLoginParams(p('mode=buyer&next=%2Flisting%2F%3Fid%3Dabc%26order%3D1')),'/listing/?id=abc&order=1');
 assert.equal(flows.intentFromLoginParams(p('service=20000000-0000-4000-8000-000000000001&tier=Premium')),'/buyer/?service=20000000-0000-4000-8000-000000000001&tier=Premium');
 assert.equal(flows.intentFromLoginParams(p('service=20000000-0000-4000-8000-000000000001&tier=Gold')),'/buyer/?service=20000000-0000-4000-8000-000000000001');
 assert.equal(flows.intentFromLoginParams(p('seller=qa-seller&ctx=20000000-0000-4000-8000-000000000001')),'/buyer/?seller=qa-seller&ctx=20000000-0000-4000-8000-000000000001');
 for(const bad of ['next=https%3A%2F%2Fevil.example','next=%2F%2Fevil.example','next=%2Fadmin%2F','seller=Evil%20Seller','service=1;drop'])
  assert.equal(flows.intentFromLoginParams(p(bad)),null,bad);
});

test('stored intent survives the confirmation round trip once, expires and rejects unsafe paths',()=>{
 const s=memory();const now=1_000_000;
 flows.rememberReturnIntent('/listing/?id=abc&tier=Basic&order=1',now,s);
 assert.equal(flows.takeReturnIntent(now+60_000,s),'/listing/?id=abc&tier=Basic&order=1');
 assert.equal(flows.takeReturnIntent(now+60_000,s),null,'consumed once');
 flows.rememberReturnIntent('/listing/?id=abc',now,s);
 assert.equal(flows.takeReturnIntent(now+3*24*3600_000,s),null,'expired after two days');
 flows.rememberReturnIntent('https://evil.example/',now,s);
 assert.equal(s.m.size,0,'unsafe paths are never stored');
 s.setItem(flows.RETURN_INTENT_KEY,JSON.stringify({path:'//evil.example',at:now}));
 assert.equal(flows.takeReturnIntent(now,s),null,'tampered storage is validated again');
});

test('workspace, order drawer and project requests provision buyers instead of a freelancer form',()=>{
 const w=read('components/workspace.tsx'),d=read('components/live-listing-detail.tsx'),pm=read('components/project-matching.tsx');
 assert.match(w,/if\(entry!=='seller'\)\{try\{await ensureBuyerProfile\(db,user\)\}/);
 assert.match(w,/className="v52-buyer-profile"/);
 assert.match(w,/\(profile\?\.is_seller\|\|entryMode==='seller'\|\|becomeSeller\)\?/);
 assert.match(w,/rememberReturnIntent\(intentFromLoginParams\(p\)\)/);
 assert.match(w,/takeReturnIntent\(\)/);
 assert.match(d,/await ensureBuyerProfile\(db,user\)/);
 assert.doesNotMatch(d,/Create your profile before sending an order/);
 assert.match(pm,/ensureBuyerProfile\(db,current\)/);
 const cb=read('app/auth/callback/route.ts');
 assert.doesNotMatch(cb,/new URL\('\/beta'/);
 assert.match(cb,/safePostLoginPath\(url\.searchParams\.get\('next'\)\)/);
});

test('saved services: guest heart remembers the service, signed-in loading never redirects to login',()=>{
 const src=read('lib/marketplace/use-saved-services.ts');
 const stubbed="const marketplaceClient=null,ensureBuyerProfile=null,useCallback=f=>f,useEffect=()=>{},useRef=()=>({}),useState=v=>[v,()=>{}];\n"+src.replace(/^import .*$/mg,'').replace("'use client';",'');
 const js=ts.transpileModule(stubbed,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const mod={exports:{}};new Function('exports','module',js)(mod.exports,mod);
 const id='20000000-0000-4000-8000-000000000001',now=5_000_000;
 assert.equal(mod.exports.readPendingSave(JSON.stringify({id,at:now}),now+1000),id);
 assert.equal(mod.exports.readPendingSave(JSON.stringify({id,at:now}),now+25*3600_000),null,'expires after a day');
 assert.equal(mod.exports.readPendingSave(JSON.stringify({id:'not-a-uuid',at:now}),now),null);
 assert.equal(mod.exports.readPendingSave('{bad json',now),null);
 assert.match(src,/if\(wanted&&!list\.includes\(wanted\)\)/,'no duplicate insert');
 assert.match(src,/code==='23505'/,'a duplicate row counts as saved');
 const catalog=read('components/live-catalog.tsx');
 assert.match(catalog,/heartState==='ready'\?onSave\(s\.id\):heartState==='guest'\?onSignInSave\?\.\(s\.id\)/);
 assert.match(catalog,/disabled=\{saveBusy\.includes\(s\.id\)\|\|heartState==='checking'\|\|heartState==='loading'\}/);
 const page=read('components/premium-marketplace.tsx');
 assert.match(page,/rememberPendingSave\(id\)/);
 assert.match(page,/saveState=\{favorites\.status\}/);
 assert.match(page,/favorites\.justSaved/);
});
