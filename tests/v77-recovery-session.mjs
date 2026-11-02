import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const src=read('lib/marketplace/client.ts').replace(/^'use client';/,'').replace(/import \{createClient[^;]*;/,'const createClient=globalThis.__createClient;');
const js=ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const store=new Map();
globalThis.localStorage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const m=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const fakeClient=()=>{const c={signedOut:0,auth:{signOut:async o=>{c.signedOut++;c.scope=o?.scope}}};return c};
test('an abandoned password-reset sign-in is ended once, on this device only',async()=>{
 const c=fakeClient();
 await m.endAbandonedRecovery(c);assert.equal(c.signedOut,0,'nothing pending → nothing happens');
 m.markRecoveryPending();
 await m.endAbandonedRecovery(c);assert.equal(c.signedOut,1);assert.equal(c.scope,'local');
 await m.endAbandonedRecovery(c);assert.equal(c.signedOut,1,'only once');
 m.markRecoveryPending();m.clearRecoveryPending();
 await m.endAbandonedRecovery(c);assert.equal(c.signedOut,1,'a saved new password clears it');
});
test('the reset page itself keeps the session; every other page checks first',()=>{
 assert.ok(m.isResetPage('/auth/reset/'));assert.ok(m.isResetPage('/auth/reset'));
 assert.ok(!m.isResetPage('/'));assert.ok(!m.isResetPage('/auth/reset/x'));
 assert.match(read('lib/marketplace/client.ts'),/if\(!isResetPage\(location\.pathname\)\)await endAbandonedRecovery\(client\);\n  return client;/);
 const r=read('components/reset-password.tsx');
 assert.match(r,/event==='PASSWORD_RECOVERY'&&session\)\{markRecoveryPending\(\)/);
 assert.match(r,/if\(r\.error\)throw r\.error;\n     clearRecoveryPending\(\);/);
 assert.match(r,/void marketplaceClient\(\)\.then\(endAbandonedRecovery\)/);
});
