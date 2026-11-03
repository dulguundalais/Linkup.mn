import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('partner program is hidden by one switch, nothing deleted',()=>{
 assert.match(read('lib/features.ts'),/export const PARTNER_PROGRAM_PUBLIC=false;/);
 assert.match(read('components/premium-marketplace.tsx'),/view==='home'&&PARTNER_PROGRAM_PUBLIC&&<SignaturePartner en=\{en\}\/>/);
 assert.match(read('components/premium-footer.tsx'),/PARTNER_PROGRAM_PUBLIC\|\|href!=='\/referrals\/'/);
 const ws=read('components/workspace.tsx');
 assert.match(ws,/role==='partner'&&PARTNER_PROGRAM_PUBLIC&&<button/);
 assert.match(ws,/tab==='partner'&&PARTNER_PROGRAM_PUBLIC&&<section/);
 assert.match(ws,/AdminPartnerManagement/,'admin keeps the partner tools');
 // Code and data stay for the official launch
 for(const f of ['components/partner-program.tsx','components/signature-home.tsx','lib/marketplace/partner-terms.ts'])assert.ok(read(f).length>0);
});

test('/referrals/ goes home temporarily and is not indexed',()=>{
 const r=read('public/_redirects');
 assert.match(r,/^\/referrals \/ 302$/m);
 assert.match(r,/^\/referrals\/ \/ 302$/m);
 assert.match(read('app/referrals/page.tsx'),/robots:\{index:false,follow:false\}/);
});

test('public copy no longer promises referral rewards',()=>{
 const info=read('lib/site-information.ts');
 assert.doesNotMatch(info,/Түншийн урамшууллыг мөнгөөр олгох уу|Referrals & support|урилгын урамшуулал нь туршилтын/);
});
