import {test,expect} from '@playwright/test';
import {mock} from './support.mjs';
test.beforeEach(async({page})=>mock(page));
test('problem-first home hero submits a problem to the finder, without account',async({page})=>{
 await page.goto('/');
 await expect(page.getByRole('heading',{name:/Асуудал бүрт/})).toBeVisible();
 await page.locator('.signature-search input[name=q]').fill('Манай рестораны захиалга бага байна');
 await page.locator('.signature-search button[type=submit]').click();
 await expect(page).toHaveURL(/\/solutions\/\?q=/);
 await expect(page.getByRole('heading',{name:/Борлуулалт ба захиалга нэмэгдүүлэх/})).toBeVisible();
 await expect(page.locator('.finder-solution-card')).toHaveCount(3);
 await expect(page.locator('.finder-no-match').first()).toBeVisible();
});
test('buyer can find a real published logo service, not invented matches',async({page})=>{
 await page.goto('/solutions/?audience=personal&q='+encodeURIComponent('Лого дизайн хийлгэх хэрэгтэй'));
 await expect(page.getByRole('heading',{name:/Брэнд ба харагдах байдал/})).toBeVisible();
 await expect(page.locator('.finder-real-matches a').first()).toHaveAttribute('href',/\/listing\/\?id=20000000/);
 await expect(page.locator('.finder-solution-card')).toHaveCount(3);
 await page.locator('.finder-real-matches a').first().click();
 await expect(page).toHaveURL(/\/listing\/\?id=/);
});
test('project brief adapts to business, budget and optional timeline',async({page})=>{
 await page.goto('/solutions/?audience=business&q='+encodeURIComponent('We need a website'));
 await expect(page.locator('.finder-audience button[aria-pressed=true]')).toContainText('Бизнес');
 await page.locator('.finder-brief-fields input').nth(0).fill('500,000 MNT');
 await page.locator('.finder-brief-fields input').nth(1).fill('2 weeks');
 await expect(page.locator('.finder-brief-preview')).toContainText('500,000 MNT');
 await expect(page.locator('.finder-brief-preview')).toContainText('2 weeks');
 await page.locator('.finder-audience button').filter({hasText:'Хувийн'}).click();
 await expect(page.locator('.finder-brief-preview')).toContainText('Хувь хүн');
});
test('buyer registration offers personal/business preference without separate accounts',async({page})=>{
 await page.goto('/login/?mode=buyer&audience=business');
 await page.getByRole('button',{name:/Бүртгэл үүсгэх|Create account/}).first().click();
 await expect(page.locator('.hustle-buyer-context')).toBeVisible();
 await expect(page.locator('.hustle-buyer-context button[aria-pressed=true]')).toContainText('Бизнес');
 await page.locator('.hustle-buyer-context button').filter({hasText:'Хувийн'}).click();
 await expect(page.locator('.hustle-buyer-context button[aria-pressed=true]')).toContainText('Хувийн');
});
for(const width of [390,768]){
 test('responsive smart finder '+width,async({page})=>{
  await page.setViewportSize({width,height:850});
  await page.goto('/solutions/?q='+encodeURIComponent('Автоматжуулалт хэрэгтэй'));
  await expect(page.locator('.finder-solution-card')).toHaveCount(3);
  const actual=await page.evaluate(()=>document.documentElement.scrollWidth);
  expect(actual).toBeLessThanOrEqual(width+4);
  await page.screenshot({path:'test-results/v31-finder-'+width+'.png',fullPage:true});
 });
}
test('submitting a need reveals the results instead of rendering them off-screen',async({page})=>{
 await page.setViewportSize({width:1280,height:720});
 await page.goto('/solutions/');
 await page.locator('.finder-form button[type=submit]').click();
 await expect(page.locator('#hustle-need-hint')).toBeVisible();
 await expect(page.locator('#hustle-need')).toBeFocused();
 await page.locator('#hustle-need').fill('Лого дизайн хийлгэх хэрэгтэй');
 await expect(page.locator('#hustle-need-hint')).toHaveCount(0);
 await page.locator('.finder-form button[type=submit]').click();
 const heading=page.locator('.finder-result-heading h2');
 await expect(heading).toBeInViewport();
 await expect(heading).toBeFocused();
 await expect(page).toHaveURL(/\/solutions\/\?q=/);
});
test('arriving with a search from the homepage shows its results',async({page})=>{
 await page.setViewportSize({width:1280,height:720});
 await page.goto('/solutions/?q='+encodeURIComponent('Манай рестораны захиалга бага байна'));
 await expect(page.locator('.finder-result-heading h2')).toBeInViewport();
});
