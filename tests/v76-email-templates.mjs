import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../supabase/templates/'+p,import.meta.url),'utf8');
test('Mongolian auth emails: one confirmation link, safe fonts for ү/ө, no Arial-first stack',()=>{
 for(const f of ['confirm-signup.html','reset-password.html','change-email.html','magic-link.html']){
  const h=read(f);
  assert.match(h,/<html lang="mn">/,f);
  assert.match(h,/href="\{\{ \.ConfirmationURL \}\}"/,f);
  assert.match(h,/font-family:Manrope,-apple-system,BlinkMacSystemFont,&#39;Segoe UI&#39;,Roboto/,f);
  assert.doesNotMatch(h,/font-family:Arial/,f);
  assert.doesNotMatch(h,/<script/i,f);
 }
 assert.match(read('change-email.html'),/\{\{ \.NewEmail \}\}/);
});
