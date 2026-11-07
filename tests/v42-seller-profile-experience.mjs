import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const read=p=>readFileSync(p,'utf8');
const toUrl=s=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64');
const toolsUrl=toUrl(read('lib/marketplace/creative-tools.ts'));
const renderer=read('lib/marketplace/public-portfolio-render.ts').replace("from './creative-tools';","from '"+toolsUrl+"';");
const {renderPublicSellerPage}=await import(toUrl(renderer));
const seller={display_name:'Test Seller',headline:'Consultant',bio:'A private real biography',skills:'Figma,Branding',slug:'test-seller',avatar_path:null,portfolio:[],services:[],tools:[]};
const options={en:false,url:'https://example.test/p/test-seller',origin:'https://example.test',title:'Seller',description:'Portfolio'};
const cover='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb.jpg';
const html=p=>renderPublicSellerPage(p,options);

test('cover photo shows only validated storage images; absence preserves navy gradient',()=>{
 const a=html({...seller,cover_path:cover,cover_focus_y:22});
 assert.match(a,/class="v42-hero-cover-image"/);
 assert.ok(a.includes('/api/portfolio-image?path='));
 assert.ok(a.includes('object-position:center 22%'));
 assert.ok(a.includes(encodeURIComponent(cover)));
 const none=html(seller);
 assert.doesNotMatch(none,/class="v42-hero-cover-image"/);
 const invalid=html({...seller,cover_path:'../../private.svg'});
 assert.doesNotMatch(invalid,/class="v42-hero-cover-image"/);
});
test('public portfolio clamps numeric crop position to a safe bounded value',()=>{
 for(const [focus,expected] of [[-500,'0%'],[500,'100%'],[42,'42%']]){
  const out=html({...seller,cover_path:cover,cover_focus_y:focus});
  assert.ok(out.includes('object-position:center '+expected));
 }
 const malicious=html({...seller,cover_path:cover,cover_focus_y:'<img onerror=alert(1)>'});
 assert.ok(malicious.includes('object-position:center 50%'));
 assert.doesNotMatch(malicious,/<img onerror=/);
});
test('account menu names Profile and chooses protected owner UI for sellers',()=>{
 const menu=read('components/account-menu.tsx');
 assert.match(menu,/account.isSeller\?'\/my-profile\/'/);
 assert.match(menu,/t\('Профайл','Profile'\)/);
 assert.doesNotMatch(menu,/t\('Профайл засах','Edit profile'\)/);
 const route=read('app/my-profile/page.tsx');
 assert.match(route,/SellerProfileManager/);
 const editor=read('components/seller-profile-manager.tsx');
 assert.match(editor,/db.auth.getUser\(\)/);
 assert.match(editor,/db.from\('profiles'\).select\('\*'\).eq\('id',user.id\)/);
 assert.match(editor,/isSeller|is_seller/);
 assert.match(editor,/status==='guest'/);
 assert.match(editor,/status==='not-seller'/);
});
test('profile owner studio previews the live draft, not a stale iframe',()=>{
 const editor=read('components/seller-profile-manager.tsx');
 const preview=read('components/seller-profile-preview.tsx');
 assert.doesNotMatch(editor,/<iframe/);
 assert.match(editor,/<SellerProfilePreview draft=\{draft\}/);
 assert.match(editor,/profile\?\.public_profile&&publicSlug/);
 assert.match(editor,/onClick=\{\(\)=>setBuyerView/);
 assert.match(editor,/onChange=\{e=>setDraft/);
 assert.match(editor,/db.from\('profiles'\).update\(payload\).eq\('id',uid\).eq\('is_seller',true\)/);
 assert.match(editor,/<SellerToolEditor/);
 assert.match(editor,/<SellerAvatarEditor/);
 assert.match(editor,/<SellerCoverEditor/);
 assert.match(editor,/db.from\('portfolio_items'\).insert/);
 assert.match(editor,/db.from\('portfolio_items'\).delete/);
 // The editor keeps its checklist, draft protection, and a separate preview mode.
 assert.match(editor,/const checks:/);
 assert.match(editor,/className="sp-step-footer"/);
 assert.match(editor,/beforeunload/);
 assert.match(editor,/sp-view-switch/);
 // Only published services are shown to buyers in the preview.
 assert.match(preview,/services.filter\(s=>s.status==='published'\)/);
 assert.doesNotMatch(preview,/dangerouslySetInnerHTML/);
});
test('cover is owner-managed, 5MB capped and can be repositioned without public bucket',()=>{
 const editor=read('components/seller-cover-editor.tsx');
 const sql=read('supabase/migrations/20261024115239_v42_seller_cover.sql');
 for(const token of ['MAX_COVER_BYTES=5*1024*1024','createImageBitmap(file)','crypto.randomUUID()',"storage.from('portfolio').upload","db.from('profiles').update({cover_path:nextPath,cover_focus_y:focus})","update({cover_path:null,cover_focus_y:50})","update({cover_focus_y:focus})","db.auth.getUser()"])assert.ok(editor.includes(token),token);
 assert.match(sql,/add column if not exists cover_path text/);
 assert.match(sql,/add column if not exists cover_focus_y smallint/);
 assert.match(sql,/profiles_cover_owner_path/);
 assert.match(sql,/profiles_cover_focus_range/);
 assert.match(sql,/p.avatar_path=object_name or p.cover_path=object_name/);
 assert.match(sql,/p.public_profile and p.is_seller and a.enabled/);
 assert.match(sql,/'tools'/);
 assert.match(sql,/'portfolio'/);
 assert.match(sql,/'services'/);
 assert.doesNotMatch(sql,/update storage.buckets set public|grant all on storage.objects/i);
});
test('responsive design keeps public cover independently of owner app CSS',()=>{
 const owner=read('app/v42-profile-owner.css');
 const publicCss=read('public/public-profile.css');
 assert.match(owner,/\.v42-editor-layout/);
 assert.match(owner,/@media\(max-width:760px\)/);
 assert.match(owner,/@media\(max-width:445px\)/);
 assert.match(publicCss,/\.v42-hero-cover-image/);
 assert.match(publicCss,/portfolio-hero-inner/);
 assert.match(read('components/seller-tool-editor.tsx'),/onUpdated\?\.\(\)/);
});
