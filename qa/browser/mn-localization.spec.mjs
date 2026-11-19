import {test,expect} from '@playwright/test';
import {mock,listing} from './support.mjs';
import {mockOrderFlow,makeOrderState} from './order-flow-fixture.mjs';

async function noOverflow(page){
 const size=await page.evaluate(()=>({width:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,overflow:[...document.querySelectorAll('main *')].filter(el=>el.getBoundingClientRect().right>innerWidth+1).slice(0,12).map(el=>el.className)}));
 expect(size.scroll,JSON.stringify(size)).toBeLessThanOrEqual(size.width+1);
}
for(const lang of ['mn','en'])test(`localization ${lang}: dark mobile with a long author name`,async({page})=>{
 await page.setViewportSize({width:320,height:844});await mock(page);
 const name='Мэргэжилтэн'.repeat(12);
 await page.route('https://qa-supabase.invalid/rest/v1/rpc/marketplace_catalog*',route=>route.fulfill({json:[{...listing,display_name:name}]}));
 await page.addInitScript(lang=>{localStorage.setItem('hustle-language',lang);localStorage.setItem('hustle-theme','dark')},lang);
 await page.goto('/');await expect(page.locator('.hustle-v5.night').first()).toBeVisible();await noOverflow(page);
 await page.screenshot({path:`test-results/localization-dark-${lang}-320.png`,fullPage:true});
 await page.goto('/listing/?id='+listing.id);
 await expect(page.locator('.v28-detail-tiers')).toBeVisible();await noOverflow(page);
 await page.screenshot({path:`test-results/localization-long-name-${lang}-320.png`,fullPage:true});
});
for(const lang of ['mn','en'])for(const width of [320,390,768,1440]){
 test(`localization ${lang} ${width}px: navigation, homepage, listing, errors and footer`,async({page})=>{
  await page.setViewportSize({width,height:900});await mock(page);
  await page.addInitScript(lang=>{localStorage.setItem('hustle-language',lang);localStorage.setItem('hustle-theme','light')},lang);
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang',lang);
  await expect(page.locator('h1')).toContainText(lang==='mn'?'Асуудал бүрт':'Every problem');
  await noOverflow(page);
  if(width<900){await page.locator('.hx-burger').click();await expect(page.locator('.hx-nav')).toBeVisible();await noOverflow(page);await page.keyboard.press('Escape');}
  await page.screenshot({path:`test-results/localization-home-${lang}-${width}.png`,fullPage:true});
  await page.goto('/listing/?id='+listing.id);
  await expect(page.locator('.v28-detail-tiers')).toContainText(lang==='mn'?'Суурь':'Basic');
  await page.locator('.v28-detail-tiers button').last().click();
  await expect(page.locator('.v28-detail-price')).toContainText('350,000');
  await noOverflow(page);
  await page.goto('/login/');
  await page.locator('#hustle-auth-email').fill('qa@example.test');await page.locator('#hustle-auth-password').fill('TestPassword123!');await page.locator('.hustle-auth-submit').click();
  await expect(page.locator('.hustle-signup-verification').getByRole('status')).toContainText(lang==='mn'?'Имэйлээ баталгаажуулаагүй байна':'Your email is not confirmed');await noOverflow(page);
  await page.goto('/faq/');await expect(page.locator('html')).toHaveAttribute('lang',lang);await noOverflow(page);
  await expect(page.locator('.info-footer, footer').last()).toContainText(lang==='mn'?'Нууцлал':'Privacy');
 });
}

for(const role of ['buyer','seller'])test(`localization: ${role} dashboard, orders and chat preserve MN/EN`,async({page})=>{
 await page.setViewportSize({width:390,height:844});const state=makeOrderState();await mockOrderFlow(page,state,role);
 await page.goto(role==='buyer'?'/buyer/':'/seller-studio/');
 await page.locator('#hustle-auth-email').fill(role+'@example.test');await page.locator('#hustle-auth-password').fill('QaOnlyPassword123!');await page.locator('.hustle-auth-submit').click();
 await expect(page.locator('.workspace-main')).toBeVisible();await noOverflow(page);
 await page.screenshot({path:`test-results/localization-${role}-mn-390.png`,fullPage:true});
 await page.locator('.hx-icon.locale').click();await expect(page.locator('html')).toHaveAttribute('lang','en');await noOverflow(page);
 await page.locator('.hx-icon.locale').click();await expect(page.locator('html')).toHaveAttribute('lang','mn');
 await page.getByRole('button',{name:'Мессеж',exact:true}).first().click();await noOverflow(page);
});
