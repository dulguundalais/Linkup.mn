import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const src=readFileSync('lib/marketplace/workspace-route.ts','utf8');
const js=ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
const mod={exports:{}};new Function('module','exports',js)(mod,mod.exports);
const {chooseWorkspace,rememberableWorkspace}=mod.exports;
const base={entry:'buyer',login:true,asked:'buyer',buyerIntent:false,role:'member',isSeller:false,last:null};
const go=o=>chooseWorkspace({...base,...o});

test('specific dashboard pages are explicit choices',()=>{
  assert.equal(go({login:false,entry:'buyer',role:'admin',isSeller:true,last:'admin'}),'buyer');
  assert.equal(go({login:false,entry:'seller'}),'seller');
  assert.equal(go({login:false,entry:'admin',role:'member'}),'admin');
  assert.equal(go({login:false,entry:'buyer',asked:'seller'}),'seller');
});
test('the /login/ door: buyer intent and explicit modes win',()=>{
  assert.equal(go({buyerIntent:true,role:'admin',isSeller:true,last:'seller'}),'buyer');
  assert.equal(go({asked:'seller'}),'seller');
  assert.equal(go({asked:'admin',role:'admin'}),'admin');
});
test('the /login/ door: last dashboard, then role, then buyer',()=>{
  assert.equal(go({role:'admin'}),'admin');
  assert.equal(go({role:'admin',last:'buyer'}),'buyer');
  assert.equal(go({isSeller:true}),'seller');
  assert.equal(go({isSeller:true,last:'buyer'}),'buyer');
  assert.equal(go({last:'admin'}),'buyer');
  assert.equal(go({last:'seller'}),'buyer');
  assert.equal(go({asked:null}),'buyer');
});
test('only allowed dashboards are remembered',()=>{
  assert.equal(rememberableWorkspace('admin','member',true),null);
  assert.equal(rememberableWorkspace('admin','admin',false),'admin');
  assert.equal(rememberableWorkspace('seller','member',false),null);
  assert.equal(rememberableWorkspace('seller','member',true),'seller');
  assert.equal(rememberableWorkspace('buyer','member',false),'buyer');
});
test('workspace routes sign-in through one function and navigates between dashboards',()=>{
  const w=readFileSync('components/workspace.tsx','utf8');
  assert.match(w,/await load\(\);\r?\n await routeSignedIn\(\);/);
  assert.match(w,/load\(\)\.then\(\(\)=>login\?routeSignedIn\(\):undefined\)/);
  assert.match(w,/const mode=chooseWorkspace\(\{entry,login,asked:current\.get\('mode'\)/);
  assert.match(w,/if\(mode!==entry\)\{window\.location\.replace\(target\);return\}/);
  assert.match(w,/localStorage\.setItem\(WORKSPACE_KEY,w\)/);
});

test('admin console views are reachable from the rail and by ?view=',()=>{
  const w=readFileSync('components/workspace.tsx','utf8');
  for(const v of ['overview','members','services','orders','settings'])assert.match(w,new RegExp("\\{adminView==='"+v+"'&&"));
  assert.match(w,/if\(view==='members'\|\|view==='services'\|\|view==='orders'\|\|view==='settings'\)setAdminView\(view\)/);
  assert.match(w,/onClick=\{\(\)=>\{setTab\('admin'\);setAdminView\(key\)\}\}/);
});
