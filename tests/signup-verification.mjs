import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const source=readFileSync(new URL('../lib/marketplace/signup-verification.ts',import.meta.url),'utf8');
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const m=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const store=()=>{const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)}};
test('signup accepts configured OTP lengths and pasted separators without silently dropping letters',()=>{
 for(const code of ['123456','12345678','1234567890','123 456','123-456'])assert.equal(m.validSignupCode(code),true);
 for(const code of ['','12345','12345678901','12a3456','１２３４５６','<script>'])assert.equal(m.validSignupCode(code),false);
 assert.equal(m.normalizeSignupCode(' 123-456 '),'123456');
});
test('reload restores only the pending email, entry and timestamp in this tab',()=>{
 const s=store();m.savePendingSignup(' Buyer@Example.test ',true,100,s);
 assert.deepEqual(m.readPendingSignup(200,s),{email:'buyer@example.test',seller:true,at:100});
 assert.deepEqual(Object.keys(JSON.parse(s.getItem(m.SIGNUP_PENDING_KEY))).sort(),['at','email','seller']);
 m.clearPendingSignup(s);assert.equal(m.readPendingSignup(200,s),null);
});
test('expired, corrupted and future pending signups are cleared',()=>{
 const s=store();
 for(const raw of ['oops','{}',JSON.stringify({email:'bad',seller:false,at:100}),JSON.stringify({email:'b@example.test',seller:false,at:300})]){s.setItem(m.SIGNUP_PENDING_KEY,raw);assert.equal(m.readPendingSignup(200,s),null);assert.equal(s.getItem(m.SIGNUP_PENDING_KEY),null)}
 m.savePendingSignup('b@example.test',false,100,s);assert.equal(m.readPendingSignup(100+30*60*1000,s),null);
 assert.doesNotThrow(()=>m.savePendingSignup('b@example.test',false,100,{setItem(){throw Error('blocked')}}));
});
test('confirmation email includes the server-generated code and legacy fallback',()=>{
 const html=readFileSync(new URL('../supabase/templates/confirm-signup.html',import.meta.url),'utf8');
 assert.match(html,/\{\{ \.Token \}\}/);assert.match(html,/\{\{ \.ConfirmationURL \}\}/);
 assert.match(html,/Кодыг бусдад бүү дамжуулаарай/);
});
