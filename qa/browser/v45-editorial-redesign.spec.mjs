import {test,expect} from '@playwright/test';
import {mock} from './support.mjs';

test.beforeEach(async ({page})=>{await mock(page)});

test('V45: editorial homepage keeps live search, guided path and category links',async({page})=>{
 await page.setViewportSize({width:1440,height:900});
 await page.goto('/');
 const hero=page.locator('.signature-hero');
 await expect(hero.getByRole('heading',{level:1})).toContainText('Асуудал бүрт');
 await expect(hero.locator('.signature-search input')).toBeVisible();
 await expect(hero.locator('.guided-entry-choice')).toHaveCount(2);
 await expect(page.locator('.business-solution-card')).toHaveCount(4);
 await expect(page.locator('.cat-showcase .cat-card')).toHaveCount(9); // V71: education and wellbeing hidden; V72: legal and finance are separate cards
 await expect(page.locator('.cat-showcase .cat-card').first()).toHaveAttribute('href','/categories/#ai');
 await expect(page.locator('.v39-catalog-home .v39-talent-card')).toBeVisible();
 await expect(page.locator('.v19-featured-intro')).toHaveCount(0);
 await page.screenshot({path:'test-results/v45-editorial-desktop.png',fullPage:true});
 await hero.locator('.signature-search input').fill('брэнд');
 await hero.locator('.signature-search button').click();
 await expect(page).toHaveURL(/\/solutions\/\?q=/);
});
for(const width of [360,390,768,1024]){
 test('V45: no horizontal overflow at '+width,async({page})=>{
  await page.setViewportSize({width,height:850});
  await page.goto('/');
  await expect(page.locator('.signature-hero h1')).toBeVisible();
  await expect(page.locator('.guided-entry-choices')).toBeVisible();
  await expect(page.locator('.cat-showcase .cat-card')).toHaveCount(9); // V71: education and wellbeing hidden; V72: legal and finance are separate cards
  await expect(page.locator('.v39-catalog-home .v39-talent-card')).toBeVisible();
  const dimensions=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,viewport:window.innerWidth}));
  expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.viewport+4);
  const category=page.locator('.cat-showcase .cat-card').first();
  const box=await category.boundingBox();
  expect(box).not.toBeNull();
  expect(box.x).toBeGreaterThanOrEqual(-2);
  expect(box.x+box.width).toBeLessThanOrEqual(width+2);
  await page.screenshot({path:'test-results/v45-mobile-'+width+'.png',fullPage:false});
 });
}
test('V45: English and dark mode preserve primary CTAs and real services',async({page})=>{
 await page.goto('/');
 await page.getByRole('button',{name:'Англи хэл сонгох'}).click();
 await expect(page.locator('.signature-hero h1')).toContainText('Every problem');
 await page.getByRole('button',{name:'Toggle color theme'}).click();
 await expect(page.locator('.hustle-v5.night')).toBeVisible();
 await expect(page.locator('.v39-catalog-home .v39-talent-card')).toBeVisible();
 await page.screenshot({path:'test-results/v45-dark-en.png',fullPage:true});
});
