import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const js=ts.transpileModule(read('lib/marketplace/signup-checks.ts'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const m=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));

test('malformed addresses are named before sign-up',()=>{
 assert.equal(m.emailFormatProblem('bold @gmail.com'),'space');
 assert.equal(m.emailFormatProblem('boldgmail.com'),'at');
 assert.equal(m.emailFormatProblem('bold@gmail'),'domain');
 assert.equal(m.emailFormatProblem('.bold@gmail.com'),'local');
 assert.equal(m.emailFormatProblem('bold@num.edu.mn'),null);
});

test('common domain typos get a «did you mean»',()=>{
 for(const [typed,fix] of [['b@gmial.com','b@gmail.com'],['b@gmail.con','b@gmail.com'],['b@gmai.com','b@gmail.com'],['b@yaho.com','b@yahoo.com'],['b@hotmial.com','b@hotmail.com'],['b@mail.nm','b@mail.mn']])assert.equal(m.suggestEmail(typed),fix,typed);
 for(const ok of ['b@gmail.com','b@mail.ru','b@company.mn','b@num.edu.mn'])assert.equal(m.suggestEmail(ok),null,ok);
});

test('a domain that does not exist or takes no mail is caught; failures never block',async()=>{
 const reply=body=>async()=>({ok:true,json:async()=>body});
 assert.equal(await m.domainMail('b@gmail.con',reply({Status:3})),'missing');
 assert.equal(await m.domainMail('b@site.mn',reply({Status:0,Answer:[]})),'no-mail');
 assert.equal(await m.domainMail('b@gmail.com',reply({Status:0,Answer:[{type:15}]})),'ok');
 assert.equal(await m.domainMail('b@x.mn',async()=>{throw new Error('offline')}),'unknown');
 assert.equal(await m.domainMail('qa@example.test',reply({Status:3})),'unknown','reserved test names are never checked');
});

test('password strength and ticks; only 8+ characters is required',()=>{
 assert.deepEqual(m.passwordChecks('Abcdef1!'),{length:true,upper:true,number:true,symbol:true});
 assert.equal(m.passwordStrength(''),0);
 assert.equal(m.passwordStrength('Ab1!'),1,'short is weak whatever it contains');
 assert.equal(m.passwordStrength('abcdefgh'),1);
 assert.equal(m.passwordStrength('Abcdefgh'),2);
 assert.equal(m.passwordStrength('Abcdefg1'),3);
 assert.equal(m.passwordStrength('Abcdef1!'),4);
 assert.equal(m.passwordChecks('Нууцүг12').upper,true,'Cyrillic capitals count');
});

test('after sign-up: «check your e-mail» with the address, open inbox, change e-mail, resend',()=>{
 const c=read('components/premium-auth.tsx'),w=read('components/workspace.tsx');
 assert.match(w,/if\(register&&!response\.data\.session\)\{setSentTo\(email\.trim\(\)\.toLowerCase\(\)\);setEmailCooldown\(60\)\}/);
 assert.match(c,/sentTo&&register&&!isAdmin\?renderSent\(\)/);
 assert.match(c,/<b>\{sentTo\}<\/b>/);
 assert.match(c,/Имэйл буруу байна уу\? Засах/);
 assert.match(c,/inboxUrl\(sentTo\)/);
 assert.equal(m.inboxUrl('b@gmail.com').startsWith('https://mail.google.com/'),true);
 assert.equal(m.inboxUrl('b@company.mn'),null);
});
