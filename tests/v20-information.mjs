import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const routes=['about','faq','terms','privacy','cookies','contact','buyers','freelancers','referrals'];
test('nine complete information routes exist',()=>{
 for(const path of routes){const page=read('app/'+path+'/page.tsx');if(path==='referrals'){assert.match(page,/PartnerProgram/);continue;}assert.ok(page.includes('page="'+path+'"'));assert.ok(page.includes('InformationPage'))}
});
test('terms and privacy are labeled legal drafts and accurately describe beta',()=>{
 const s=read('lib/site-information.ts');
 assert.match(s,/informational beta draft|beta draft/i);
 assert.match(s,/not active|do not collect|does not collect/i);
 assert.match(s,/Singapore/i);
 assert.match(s,/10%/);
 assert.match(s,/Privacy Policy/);
 assert.match(s,/Supabase/);
});
test('FAQ is populated, searchable and explains email, escrow, pricing',()=>{
 const s=read('lib/site-information.ts'),ui=read('components/information-page.tsx');
 assert.match(s,/confirmation email/);
 assert.match(s,/Basic, Standard/);
 assert.match(s,/escrow/i);
 assert.match(ui,/type="search"/);
 assert.match(ui,/<details/);
 assert.match(ui,/<summary/);
});
test('footer has real knowledge links and does not invent official contact',()=>{
 const s=read('components/premium-footer.tsx');
 for(const route of routes.filter(x=>x!=='faq'||true)){if(route==='faq'||route==='about'||route==='terms'||route==='privacy'||route==='cookies'||route==='contact'||route==='buyers'||route==='freelancers'||route==='referrals')assert.ok(s.includes('/'+route+'/'),'Missing footer '+route)}
 assert.doesNotMatch(s,/@hustle\.mn|escrow-protected|12K\+|4\.9\/5/i);
 const main=read('components/premium-marketplace.tsx');assert.match(main,/<PremiumFooter en=\{en\}/);
});
test('privacy and terms are not misrepresented as final approved legal documents',()=>{
 const s=read('lib/site-information.ts');
 assert.ok((s.match(/"review": true/g)||[]).length>=3);
 const ui=read('components/information-page.tsx');assert.match(ui,/operator and Mongolian legal review/);
});
