import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync,statSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const IDS=['ai','business','marketing','tech','legal','finance','creative','research','commerce'];

test('the nine categories carry the owner names, in carousel order',()=>{
 const tax=read('lib/marketplace/taxonomy.ts');
 const names={ai:'AI шийдэл',business:'Бизнес & Стратеги',marketing:'Маркетинг & Борлуулалт',tech:'Дижитал бүтээгдэхүүн',legal:'Хууль, эрх зүй',finance:'Санхүү & Татвар',creative:'Дизайн & Брэнд',research:'Өгөгдөл & Аналитик',commerce:'Цахим худалдаа'};
 for(const [id,mn] of Object.entries(names))assert.match(tax,new RegExp("\\{id:'"+id+"',mn:'"+mn.replace(/[&]/g,'\\&')+"'"),id);
 const order=[...tax.slice(tax.indexOf('export const SHOWCASE')).matchAll(/showcaseCard\('(\w+)'\)/g)].map(m=>m[1]);
 assert.deepEqual(order,IDS);
});

test('every category has its webp artwork and both pages use it',()=>{
 const tax=read('lib/marketplace/taxonomy.ts');
 assert.match(tax,/CATEGORY_IMAGES:string\[\]=\['ai','business','marketing','tech','legal','finance','creative','research','commerce'\]/);
 for(const id of IDS){
  const f=new URL('../public/categories/'+id+'.webp',import.meta.url);
  assert.ok(existsSync(f),id);
  const s=statSync(f).size;assert.ok(s>5000&&s<120000,id+' size '+s);
 }
 assert.match(read('components/category-showcase.tsx'),/has-image/);
 assert.match(read('components/category-directory.tsx'),/CATEGORY_IMAGES\.includes\(c\.id\)\?<img/);
 const css=read('app/v81-category-art.css');
 assert.match(css,/aspect-ratio:506\/270/,'landscape art is not cropped to a square');
});
