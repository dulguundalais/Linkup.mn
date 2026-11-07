import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const read=p=>readFileSync(p,'utf8');
const js=ts.transpileModule(read('lib/marketplace/focus-trap.ts'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const mod={exports:{}};new Function('exports','module',js)(mod.exports,mod);const {trapTab}=mod.exports;

const el=name=>{const e={name,focused:0,getClientRects:()=>[1],closest:()=>null,focus(){e.focused++}};return e};
const root=items=>({querySelectorAll:()=>items,contains:x=>items.includes(x)});
const key=(shiftKey=false)=>{const e={key:'Tab',shiftKey,prevented:false,preventDefault(){e.prevented=true}};return e};

test('Tab wraps from the last to the first control and Shift+Tab the other way',()=>{
 const [a,b,c]=['close','brief','send'].map(el);const r=root([a,b,c]);
 let e=key();assert.equal(trapTab(e,r,c),true);assert.ok(e.prevented);assert.equal(a.focused,1);
 e=key(true);assert.equal(trapTab(e,r,a),true);assert.equal(c.focused,1);
 e=key();assert.equal(trapTab(e,r,b),false,'normal Tab inside the dialog is left alone');assert.equal(e.prevented,false);
 e=key();assert.equal(trapTab(e,r,{outside:true}),true,'focus that escaped is pulled back');assert.equal(a.focused,2);
 assert.equal(trapTab({key:'Enter',shiftKey:false,preventDefault(){}},r,a),false);
});

test('dialogs trap focus, close on Escape and return focus to what opened them',()=>{
 const d=read('components/live-listing-detail.tsx');
 assert.match(d,/if\(e\.key==='Escape'\)closeDrawer\(\);else trapTab\(e,drawerRef\.current\)/);
 assert.match(d,/requestAnimationFrame\(\(\)=>opener\.current\?\.focus\(\)\)/);
 assert.match(d,/<section ref=\{drawerRef\} className="v50-drawer" role="dialog" aria-modal="true" aria-labelledby=/);
 assert.match(read('components/seller-profile-manager.tsx'),/trapTab\(e,leaveRef\.current\)/);
 const h=read('components/site-header.tsx');
 assert.match(h,/aria-controls="hx-main-nav" aria-expanded=\{menu\}/);
 assert.match(h,/setMenu\(false\);burger\.current\?\.focus\(\)/);
 assert.match(read('components/guided-entry.tsx'),/event\.key==='Escape'/);
});

test('signed-in header fits small phones and touch targets stay usable',()=>{
 const h=read('app/site-header.css');
 assert.match(h,/@media\(max-width:400px\)\{\.hustle-v5\.hx-header \.hx-header-inner\{gap:8px\}/);
 assert.match(h,/\.hx-crumbs a\{display:inline-flex;align-items:center;min-height:28px\}/);
 assert.match(read('app/v51-home-system.css'),/\.hustle-premium-footer nav a\{display:inline-flex;align-items:center;min-height:32px\}/);
 assert.match(read('app/v50-profile-studio.css'),/\.sp-step-forward \.v42-save\{[^}]*min-height:46px/);
});
