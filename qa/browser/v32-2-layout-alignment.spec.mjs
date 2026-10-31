import {test,expect} from '@playwright/test';
import {mock} from './support.mjs';
test.beforeEach(async({page})=>mock(page));

// Computed content x-axis, not just each background edge: section blocks
// use different full-bleed backgrounds, but text must share the same grid.
async function positions(page){
 return page.evaluate(()=>{
  const selectors={
   header:'.hx-header .hx-header-inner.shell',
   hero:'.signature-hero-inner.shell',
   business:'.business-solutions-inner.shell',
   process:'.signature-process > .shell',
   partner:'.signature-partner.shell',
   footer:'.hustle-premium-footer .footer-columns.shell'
  };
  return Object.fromEntries(Object.entries(selectors).map(([name,selector])=>{
   const node=document.querySelector(selector);
   if(!node)throw Error('Missing layout section: '+selector);
   const rect=node.getBoundingClientRect();
   const style=getComputedStyle(node);
   return [name,{
    left:rect.left+parseFloat(style.paddingLeft),
    right:rect.right-parseFloat(style.paddingRight),
    outerWidth:rect.width,
    maxWidth:parseFloat(style.maxWidth),
    gutter:parseFloat(style.paddingLeft)
   }];
  }));
 });
}
for(const width of [390,768,1024,1297,1366,1440,1536,1728,1920]){
 test('one consistent page column at viewport '+width,async({page})=>{
  await page.setViewportSize({width,height:900});
  await page.goto('/');
  await expect(page.locator('.signature-hero-inner')).toBeVisible();
  await expect(page.locator('.business-solutions-inner')).toBeVisible();
  const p=await positions(page);
  // V50: the hero is a centred, full-bleed stage, so the shared page column is
  // defined by the header. Cards and sections align to it; the hero is centred on it.
  const cardEdges=await page.evaluate(()=>{
   const seller=document.querySelector('.signature-seller-band.shell');
   const partner=document.querySelector('.signature-partner-inner');
   const business=document.querySelector('.business-solution-grid');
   if(!seller||!partner||!business)throw Error('Missing alignment surfaces');
   return Object.fromEntries([['seller',seller],['partner',partner],['businessCards',business]].map(([name,el])=>{
    const b=el.getBoundingClientRect();
    return [name,{left:b.left,right:b.right}];
   }));
  });
  const main=p.header;
  const heroMid=(p.hero.left+p.hero.right)/2,mainMid=(main.left+main.right)/2;
  expect(Math.abs(heroMid-mainMid),'hero centred on the page column').toBeLessThanOrEqual(1.5);
  for(const [name,edge] of Object.entries(cardEdges)){
   expect(Math.abs(edge.left-main.left),name+' card left').toBeLessThanOrEqual(1.5);
   expect(Math.abs(edge.right-main.right),name+' card right').toBeLessThanOrEqual(1.5);
  }
  for(const [name,item] of Object.entries(p)){
   if(name==='hero')continue;
   expect(Math.abs(item.left-main.left),name+' left mismatch').toBeLessThanOrEqual(1.5);
   expect(Math.abs(item.right-main.right),name+' right mismatch').toBeLessThanOrEqual(1.5);
  }
  expect(main.maxWidth).toBe(1400);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width+2);
  const expectedColumns=width<=700?1:width<=1080?2:4;
  const columns=await page.locator('.business-solution-grid').evaluate(node=>getComputedStyle(node).gridTemplateColumns.split(' ').filter(Boolean).length);
  expect(columns).toBe(expectedColumns);
  if([390,1366,1536,1728].includes(width)){
   await page.screenshot({path:'test-results/v322-alignment-'+width+'.png',fullPage:true});
  }
 });
}
test('Explore and footer reuse the same grid, without narrowing after navigation',async({page})=>{
 await page.setViewportSize({width:1297,height:900});
 await page.goto('/');
 const home=await positions(page);
 await page.goto('/explore/');
 const result=await page.evaluate(()=>{
  const el=document.querySelector('.shell.discovery');
  if(!el)throw Error('Explore container missing');
  const rect=el.getBoundingClientRect(),style=getComputedStyle(el);
  return {left:rect.left+parseFloat(style.paddingLeft),right:rect.right-parseFloat(style.paddingRight)};
 });
 expect(Math.abs(result.left-home.header.left)).toBeLessThanOrEqual(1.5);
 expect(Math.abs(result.right-home.header.right)).toBeLessThanOrEqual(1.5);
});
