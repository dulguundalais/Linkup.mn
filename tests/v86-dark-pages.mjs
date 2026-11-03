import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('every page with the site header offers and follows the light/dark choice',()=>{
 for(const f of readdirSync(new URL('../components/',import.meta.url)).filter(f=>f.endsWith('.tsx'))){
  const s=read('components/'+f);
  for(const tag of s.match(/<SiteHeader\b[\s\S]*?\/>/g)||[]){
   assert.match(tag,/\bdark=\{/,f+': header gets the theme');
   assert.match(tag,/onToggleTheme=\{/,f+': header shows the theme button');
  }
 }
});

test('project requests, password reset and the profile studio turn dark',()=>{
 const pm=read('components/project-matching.tsx'),rp=read('components/reset-password.tsx'),sp=read('components/seller-profile-manager.tsx');
 for(const s of [pm,rp,sp])assert.match(s,/useSiteTheme\(\)/);
 assert.match(pm,/<div className=\{'v86-page'\+\(dark\?' night':''\)\}>/);
 assert.match(rp,/<div className=\{'hustle-v5'\+\(dark\?' night':''\)\}><main className="hustle-auth-scene">/);
 assert.match(sp,/<div className=\{'sp-page'\+\(dark\?' night':''\)\}>/);
 const css=read('app/v86-dark-pages.css');
 assert.match(css,/\.night \.project-marketplace\{background:#050c22/);
 assert.match(css,/\.night \.project-form input,\.night \.project-form textarea,\.night \.project-form select\{background:#0f1d45/);
 assert.match(css,/\.sp-page\.night\{background:#050c22/);
 assert.match(css,/\.sp-page\.night \.v42-owner\.sp\{--ink:#eef3ff/);
});
