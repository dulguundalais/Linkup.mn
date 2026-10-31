import {test,expect} from '@playwright/test';
import {mock} from './support.mjs';

test.beforeEach(async({page})=>{await mock(page)});

for(const width of [390,768,1440]){
 test('V53 Partner page preserves Claude style and fits '+width,async({page})=>{
  await page.setViewportSize({width,height:900});
  await page.goto('/referrals/');
  await expect(page.locator('.partner-program .pp-hero')).toBeVisible();
  await expect(page.locator('.pp-steps .pp-step')).toHaveCount(4);
  await expect(page.locator('.pp-tiers .pp-tier')).toHaveCount(3);
  await expect(page.locator('.pp-join-card')).toBeVisible();
  await expect(page.locator('.hustle-premium-footer')).toBeVisible();
  const w=await page.evaluate(()=>({document:document.documentElement.scrollWidth,viewport:window.innerWidth}));
  expect(w.document).toBeLessThanOrEqual(w.viewport+3);
  const style=await page.locator('.partner-program .pp-hero').evaluate(el=>getComputedStyle(el).backgroundColor);
  expect(style).not.toBe('rgba(0, 0, 0, 0)');
  await page.screenshot({path:'test-results/v53-partner-guest-'+width+'.png',fullPage:true});
 });
}

test('V53 Partner route never changes the original homepage hero-derived colors',async({page})=>{
 await page.setViewportSize({width:1440,height:900});
 const probe=async()=>page.evaluate(()=>{
  const selectors=['.signature-process','.signature-seller-band','.signature-partner','.signature-spotlight'];
  return Object.fromEntries(selectors.map(selector=>{
   const el=document.querySelector(selector);
   if(!el)throw new Error('Missing Claude section '+selector);
   const s=getComputedStyle(el);
   return [selector,{background:s.backgroundColor,color:s.color,font:s.fontFamily,border:s.borderColor}];
  }));
 });
 await page.goto('/');
 await expect(page.locator('.signature-process')).toBeVisible();
 const before=await probe();
 await page.goto('/referrals/');
 await expect(page.locator('.pp-hero')).toBeVisible();
 await page.goto('/');
 await expect(page.locator('.signature-process')).toBeVisible();
 const after=await probe();
 expect(after).toEqual(before);
});

test('V53 signup requires authentication, not a hidden dummy Partner account',async({page})=>{
 await page.goto('/referrals/');
 await expect(page.locator('.pp-join-card')).toBeVisible();
 await expect(page.locator('.pp-form')).toHaveCount(0);
 await expect(page.locator('.pp-dashboard')).toHaveCount(0);
 const link=page.locator('.pp-join-card a').first();
 await expect(link).toHaveAttribute('href',/\/login\//);
});


test('V53 keeps the original Claude V51 night palette, not the older teal V45 palette',async({page})=>{
 await page.setViewportSize({width:1440,height:900});
 await page.goto('/');
 const toggle=page.getByRole('button',{name:/Өнгөний горим солих|Toggle color theme/});
 await toggle.click();
 await expect(page.locator('.hustle-v5.night')).toBeVisible();
 const colors=await page.evaluate(()=>{
  const home=document.querySelector('.hustle-v5.night');
  const section=document.querySelector('.business-solutions-section');
  const card=document.querySelector('.business-solution-card');
  if(!home||!section||!card)throw new Error('Claude V51 sections missing');
  return {
   paper:getComputedStyle(home).getPropertyValue('--paper').trim(),
   card:getComputedStyle(card).backgroundColor,
   section:getComputedStyle(section).backgroundImage
  };
 });
 expect(colors.paper).toBe('#050c22');
 expect(colors.card).toBe('rgb(11, 22, 54)');
 expect(colors.section).toContain('linear-gradient');
});
