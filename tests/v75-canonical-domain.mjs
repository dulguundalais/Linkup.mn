import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const src=readFileSync(new URL('../functions/_middleware.ts',import.meta.url),'utf8');
const js=ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const m=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const req=(u,method='GET')=>new Request(u,{method});
test('the old project address and www go to the same page on linkup.mn',()=>{
 const r=m.canonicalRedirect(req('https://hustle-mn-preview.pages.dev/explore/?category=tech&days=7'));
 assert.equal(r.status,301);
 assert.equal(r.headers.get('location'),'https://linkup.mn/explore/?category=tech&days=7');
 assert.equal(m.canonicalRedirect(req('https://www.linkup.mn/p/anna/')).headers.get('location'),'https://linkup.mn/p/anna/');
 assert.equal(m.canonicalRedirect(req('https://hustle-mn-preview.pages.dev/api/x','POST')).status,308,'non-GET keeps its method');
});
test('linkup.mn itself and preview deployments are served normally',async()=>{
 assert.equal(m.canonicalRedirect(req('https://linkup.mn/')),null);
 assert.equal(m.canonicalRedirect(req('https://a19737c7.hustle-mn-preview.pages.dev/')),null);
 const res=await m.onRequest({request:req('https://linkup.mn/'),next:async()=>new Response('ok')});
 assert.equal(await res.text(),'ok');
});
