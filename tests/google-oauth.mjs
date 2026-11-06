import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

function load(path){
 const source=readFileSync(new URL('../'+path,import.meta.url),'utf8');
 const {outputText}=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS}});
 const exports={};
 new Function('exports','require',outputText)(exports,()=>({}));
 return exports;
}

const {readGoogleCallback}=load('lib/marketplace/client.ts');
const {friendlyError}=load('lib/marketplace/friendly-errors.ts');

test('Google callback reads the code once and preserves other login parameters',()=>{
 const url=new URL('https://linkup.test/login/?code=mock-code&next=%2Flisting%2F');
 assert.deepEqual(readGoogleCallback(url),{code:'mock-code'});
 assert.equal(url.pathname+url.search,'/login/?next=%2Flisting%2F');
 assert.equal(readGoogleCallback(url),null);
});

test('Google callback shows localized errors without provider details',()=>{
 const cancelled=new URL('https://linkup.test/login/#error=access_denied&error_description=private');
 const callback=readGoogleCallback(cancelled,true);
 assert.match(friendlyError(callback.error,true),/Google sign-in was cancelled/);
 assert.match(friendlyError(callback.error,false),/цуцаллаа/);
 assert.equal(cancelled.hash,'');

 const disabled=new URL('https://linkup.test/login/?error=invalid_request&error_description=Unsupported+provider');
 assert.match(friendlyError(readGoogleCallback(disabled,true).error,true),/currently unavailable/);
 assert.match(friendlyError({code:'provider_disabled'},false),/идэвхгүй/);
 assert.match(friendlyError(new Error('Popup closed'),true),/was cancelled/);
});

test('Google callback leaves implicit email confirmation tokens available to Supabase',()=>{
 const url=new URL('https://linkup.test/login/#access_token=mock&refresh_token=mock&type=signup');
 const before=url.href;
 assert.equal(readGoogleCallback(url),null);
 assert.equal(url.href,before);
 const expired=new URL('https://linkup.test/login/#error=access_denied&error_code=otp_expired');
 assert.equal(readGoogleCallback(expired),null);
});
