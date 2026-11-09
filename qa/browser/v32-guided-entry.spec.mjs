import {test,expect} from '@playwright/test';
import {mock} from './support.mjs';
test.beforeEach(async({page})=>mock(page));

test('business buyer sees inline solutions immediately after one goal click',async({page})=>{
 await page.goto('/');
 await expect(page.locator('.guided-entry-choice')).toHaveCount(2);
 await page.locator('.guided-entry-business').click();
 const d=page.getByRole('dialog');
 await expect(d.locator('.guided-goal')).toHaveCount(6);
 await d.locator('.guided-goal').filter({hasText:'AI & процесс автоматжуулах'}).click();
 await expect(d.locator('.guided-result-card')).toHaveCount(3);
 await expect(d.locator('.guided-modal-body h2')).toContainText('автоматжуулах');
 await expect(d.locator('.guided-match-status')).toContainText('Одоогоор тохирох үйлчилгээ алга');
 await d.locator('.guided-optional-toggle').click();
 await expect(d.locator('.guided-optional-content')).toBeVisible();
 await d.locator('.guided-optional-content input').first().fill('500000');
 await expect(d.locator('.guided-optional-content input').first()).toHaveValue('500,000');
 await d.locator('.guided-optional-content input').nth(1).fill('2 долоо хоног');
 await expect(d.locator('.guided-brief-preview')).toContainText('500,000 ₮');
 await d.locator('a.guided-next').click();
 await expect(page).toHaveURL(/\/solutions\/\?/);
 await expect(page.locator('.finder-brief-preview')).toContainText('2 долоо хоног');
});

test('personal goal shows real published freelancer on the SAME results screen',async({page})=>{
 await page.goto('/');
 const trigger=page.locator('.guided-entry-choice').first();
 await trigger.click();
 const d=page.getByRole('dialog');
 await d.locator('.guided-goal').first().click();
 await expect(d.locator('.guided-result-card')).toHaveCount(3);
 await expect(d.locator('.guided-published-list a').first()).toHaveAttribute('href',/\/listing\/\?id=20000000/);
 await d.locator('.guided-published-list a').first().click();
 await expect(page).toHaveURL(/\/listing\/\?id=20000000/);
});

test('the user can type a custom problem with no mandatory budget or industry',async({page})=>{
 await page.goto('/');
 await page.locator('.guided-entry-business').click();
 const d=page.getByRole('dialog');
 await d.locator('#guided-custom-problem').fill('Манай рестораны захиалга бага байна');
 await d.locator('.guided-custom-row button').click();
 await expect(d.locator('.guided-result-card')).toHaveCount(3);
 await expect(d.locator('.guided-modal-body h2')).toContainText('Борлуулалт');
 await d.locator('.guided-back').click();
 await expect(d.locator('.guided-goal')).toHaveCount(6);
 await page.keyboard.press('Escape');
 await expect(d).toHaveCount(0);
 await expect(page.locator('.guided-entry-business')).toBeFocused();
});

test('English mode offers direct two-step navigation',async({page})=>{
 await page.goto('/');
 await page.getByRole('button',{name:'Англи хэл сонгох'}).click();
 await page.locator('.guided-entry-business').click();
 const d=page.getByRole('dialog');
 await expect(d.getByRole('heading',{name:'What would you like to improve?'})).toBeVisible();
 await d.locator('.guided-goal').first().click();
 await expect(d.locator('.guided-result-card')).toHaveCount(3);
 await expect(d.getByRole('heading',{name:'Grow sales and bookings'})).toBeVisible();
});

for(const width of [360,390,768,1280]){
 test('premium two-path entry fits viewport '+width,async({page})=>{
  await page.setViewportSize({width,height:850});
  await page.goto('/');
  await expect(page.locator('.guided-entry-choices')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width+4);
  await page.locator('.guided-entry-business').click();
  const d=page.getByRole('dialog');
  await expect(d.locator('.guided-goal')).toHaveCount(6);
  expect(await d.evaluate(n=>n.getBoundingClientRect().width)).toBeLessThanOrEqual(width+2);
  await d.locator('.guided-goal').first().click();
  await expect(d.locator('.guided-result-card')).toHaveCount(3);
  await page.screenshot({path:'test-results/v321-simple-'+width+'.png',fullPage:false});
 });
}
