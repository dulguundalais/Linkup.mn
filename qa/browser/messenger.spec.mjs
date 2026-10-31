import {test,expect} from '@playwright/test';import {mockMessenger} from './messenger-fixture.mjs';
test.beforeEach(async({page})=>{await mockMessenger(page)});
for(const width of [390,768,1440]){
 test('authenticated Messenger UI, emoji, real metrics and order context '+width,async({page})=>{
  await page.setViewportSize({width,height:900});
  await page.goto('/buyer/');
  await page.locator('#hustle-auth-email').fill('buyer@example.test');
  await page.locator('#hustle-auth-password').fill('TestPasswordOnly123!');
  await page.locator('.hustle-auth-submit').click();
  await expect(page.locator('.workspace-main')).toBeVisible();
  await page.locator('.v49-nav button').filter({hasText:/Мессеж|Messages/}).click();
  await expect(page.locator('.v25-messenger')).toBeVisible();
  await page.getByRole('button',{name:/QA Seller/}).first().click();
  await expect(page.locator('.chat-thread-head')).toContainText('QA Seller');
  await expect(page.locator('.v25-order-context')).toContainText('Brand design QA');
  await expect(page.locator('.chat-thread-head')).toContainText('25');
  await page.getByRole('button',{name:/Эможи сонгох|Choose emoji/}).click();
  await expect(page.locator('.v25-emojis button')).toHaveCount(11);
  await page.locator('.v25-emojis button').first().click();
  await expect(page.locator('.v25-composer textarea')).toHaveValue('😀');
  const rect=await page.locator('.v25-messenger').boundingBox();
  expect(rect.x+rect.width).toBeLessThanOrEqual(width+5);
  await page.screenshot({path:'test-results/v25-messenger-'+width+'.png',fullPage:true});
 });
}
