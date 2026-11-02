import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import ts from 'typescript';
const read=p=>readFileSync(p,'utf8');
const load=path=>{
 const js=ts.transpileModule(read(path),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const mod={exports:{}};new Function('exports','module',js)(mod.exports,mod);return mod.exports;
};
const ui=[...readdirSync('components').filter(f=>f.endsWith('.tsx')).map(f=>'components/'+f),'lib/marketplace/public-portfolio-render.ts'];

test('beta wording is consistent and never exposes migration jargon to people',()=>{
 for(const f of ui){
  const s=read(f);
  const strings=[...s.matchAll(/t\('([^']*)','([^']*)'\)/g)].flatMap(m=>[m[1],m[2]]);
  for(const x of strings){
   assert.doesNotMatch(x,/migration|V\d\d beta|шинэчлэлт хүлээгдэж/i,f+': '+x);
   assert.doesNotMatch(x,/closed beta|хаалттай бета|approved account|зөвшөөрөгдсөн аккаунт/i,f+': '+x);
  }
 }
});

test('support channel comes only from owner configuration, never invented',()=>{
 const {parseSupportChannel}=load('lib/marketplace/support-channel.ts');
 assert.deepEqual(parseSupportChannel({}),{email:null,url:null});
 assert.deepEqual(parseSupportChannel({HUSTLE_SUPPORT_EMAIL:' Help@Example.MN ',HUSTLE_SUPPORT_URL:'https://example.mn/help'}),{email:'help@example.mn',url:'https://example.mn/help'});
 assert.equal(parseSupportChannel({HUSTLE_SUPPORT_EMAIL:'not an email'}).email,null);
 for(const bad of ['http://example.mn','javascript:alert(1)','https://user:pw@example.mn/'])assert.equal(parseSupportChannel({HUSTLE_SUPPORT_URL:bad}).url,null,bad);
 assert.match(read('functions/api/config.ts'),/parseSupportChannel\(env\)/);
 const page=read('components/information-page.tsx');
 assert.match(page,/support-channel-pending/,'honest message when nothing is configured');
 for(const f of ui)assert.doesNotMatch(read(f).replace(/example\.(com|test|mn)/g,''),/(support|help|info|contact)@[a-z0-9.-]*hustle/i,f+' must not hard-code a support mailbox');
});

test('password reset screen follows the site language and links back to recovery',()=>{
 const r=read('components/reset-password.tsx');
 assert.match(r,/t\('Нэвтрэх хуудас руу буцах','Back to sign in'\)/);
 assert.match(r,/t\('Шинэ нууц үгээ сонгоно уу','Choose a new password'\)/); // V78: shorter title, no period (owner)
 assert.match(r,/href="\/login\/\?reset=1"/);
 assert.match(read('components/premium-auth.tsx'),/get\('reset'\)==='1'\)setResetMode\(true\)/);
 assert.doesNotMatch(r,/e instanceof Error\?e\.message/,'raw auth errors are not shown');
});
