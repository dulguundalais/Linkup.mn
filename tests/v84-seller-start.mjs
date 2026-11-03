import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const js=ts.transpileModule(read('lib/marketplace/seller-start.ts'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const m=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const states=i=>m.sellerStartSteps(i).map(s=>s.state).join(' ');
const base={isSeller:true,name:'Болд',headline:'Дизайнер',statuses:[]};

test('① profile → ② service → ③ published, one current step at a time',()=>{
 assert.equal(states({...base,isSeller:false}),'current todo todo','new sign-up starts at the profile');
 assert.equal(states({...base,headline:''}),'current todo todo','a headline is part of the profile');
 assert.equal(states(base),'done current todo');
 assert.equal(states({...base,statuses:['draft']}),'done done current');
 assert.equal(states({...base,statuses:['pending']}),'done done waiting');
 assert.equal(states({...base,statuses:['rejected']}),'done done current');
 assert.equal(states({...base,statuses:['published','draft']}),'done done done');
 assert.equal(states({...base,statuses:['archived']}),'done current todo','a deleted service does not count');
});

test('only the step to do now has a button, and it says what to do',()=>{
 const pick=i=>m.sellerStartSteps(i).filter(s=>s.actionMn).map(s=>s.key+':'+s.actionMn);
 assert.deepEqual(pick({...base,isSeller:false}),['profile:Профайл бөглөх']);
 assert.deepEqual(pick(base),['service:Үйлчилгээ нэмэх']);
 assert.deepEqual(pick({...base,statuses:['pending']}),[],'nothing to do while the admin reviews');
 assert.deepEqual(pick({...base,statuses:['rejected']}),['publish:Засах']);
 assert.equal(m.sellerStartComplete(m.sellerStartSteps({...base,statuses:['published']})),true,'tracker hides once live');
 assert.equal(m.serviceToFinish([{status:'draft',id:1},{status:'rejected',id:2}]).id,2,'rejected first');
});

test('the tracker is shown on the seller studio, the sign-up profile tab and /my-profile/',()=>{
 const ws=read('components/workspace.tsx'),pm=read('components/seller-profile-manager.tsx');
 assert.match(ws,/tab==='seller'&&<>\{!profile\?\.is_seller\?renderStart\(\):/,'no dead end before becoming a seller');
 assert.match(ws,/tab==='profile'&&!profile\?\.is_seller&&\(entryMode==='seller'\|\|becomeSeller\)&&renderStart\(\)/);
 assert.match(ws,/params\.get\('add'\)==='service'/,'/seller-studio/?add=service opens the form');
 assert.match(pm,/hrefFor=\{key=>key==='service'\?'\/seller-studio\/\?add=service'/);
 assert.match(read('app/v84-seller-start.css'),/@media \(max-width:900px\)\{\.v84-steps\{grid-template-columns:1fr\}\}/);
});
