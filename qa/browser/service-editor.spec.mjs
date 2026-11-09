import {test,expect} from '@playwright/test';
import {makeOrderState,mockOrderFlow,sellerId,serviceId} from './order-flow-fixture.mjs';

async function signInAsSeller(page,theme='light'){
 await mockOrderFlow(page,makeOrderState(),'seller');
 await page.addInitScript(theme=>{
  localStorage.setItem('hustle-language','en');
  localStorage.setItem('hustle-theme',theme);
 },theme);
 const writes=[];
 await page.route('https://qa-order.invalid/rest/v1/rpc/save_service_with_packages',route=>{
  writes.push(route.request().postDataJSON());
  return route.fulfill({json:serviceId});
 });
 await page.goto('/login/?mode=seller');
 await page.locator('#hustle-auth-email').fill('seller@example.test');
 await page.locator('#hustle-auth-password').fill('QaOnlyPassword123!');
 await page.locator('.hustle-auth-submit').click();
 await expect(page).not.toHaveURL(/\/login\//);
 return writes;
}

test('creates a draft with optional service details skipped and three real packages',async({page})=>{
 await page.setViewportSize({width:1266,height:830});
 const writes=await signInAsSeller(page);
 await page.goto('/seller-studio/?add=service');
 const editor=page.locator('.v71-service-editor');
 const steps=editor.getByRole('list',{name:'Service steps'});
 const toDetails=editor.getByRole('button',{name:'Continue to service details'});
 await expect(steps.locator('[aria-current=step]')).toContainText('Category');
 await expect(steps.getByRole('button')).toHaveCount(0);
 await expect(toDetails).toBeInViewport();
 await toDetails.click();
 await expect(steps.locator('[aria-current=step]')).toContainText('Category');
 const category=editor.getByLabel('Main category');
 const firstCategory=await category.locator('option').nth(1).getAttribute('value');
 await category.selectOption(firstCategory);
 await expect(editor.getByLabel('Subcategory (optional)')).toHaveValue('');
 await toDetails.click();
 await expect(steps.locator('[aria-current=step]')).toContainText('About the service');
 await expect(editor.getByLabel('English title')).toBeHidden();
 await expect(editor.getByLabel('Keywords')).toBeHidden();
 await editor.getByLabel('Service name').fill('Logo design for small businesses');
 await editor.getByRole('textbox',{name:'Short description'}).fill('I deliver a custom logo and print-ready files.');
 await editor.getByRole('button',{name:'Back',exact:true}).click();
 await expect(category).toHaveValue(firstCategory);
 await toDetails.click();
 await expect(editor.getByLabel('Service name')).toHaveValue('Logo design for small businesses');
 await editor.getByRole('button',{name:'Continue to pricing'}).click();
 await expect(steps.locator('[aria-current=step]')).toContainText('Pricing');
 await expect(editor.getByRole('textbox',{name:'Price (MNT)',exact:true})).toHaveCount(1);
 await editor.getByRole('button',{name:'Save draft'}).click();
 await expect(editor.getByRole('alert')).toContainText('Standard: price');
 expect(writes).toHaveLength(0);
 const price=editor.getByRole('textbox',{name:'Price (MNT)',exact:true});
 await price.pressSequentially('1000000');
 await expect(price).toHaveValue('1,000,000');
 // editing in the middle keeps the caret after the same digit
 await price.evaluate(el=>el.setSelectionRange(1,1));
 await price.press('2');
 await expect(price).toHaveValue('12,000,000');
 await price.press('5');
 await expect(price).toHaveValue('125,000,000');
 await price.fill('20000');
 await expect(price).toHaveValue('20,000');
 const inclusions=editor.getByLabel('What’s included');
 await inclusions.pressSequentially('Source file');
 await inclusions.press('Enter');
 await inclusions.pressSequentially('Two concepts');
 await expect(inclusions).toHaveValue('Source file\nTwo concepts');
 await editor.getByRole('button',{name:/^Premium/}).click();
 await editor.getByRole('textbox',{name:'Price (MNT)',exact:true}).fill('30000');
 await inclusions.fill('Brand guidelines');
 await editor.getByRole('button',{name:'Save draft'}).click();
 await expect.poll(()=>writes.length).toBe(1);
 expect(writes[0].p_service_id).toBeNull();
 expect(writes[0].p_details).toMatchObject({category:firstCategory,subcategory:'',title_en:'',tags:[],service_type:'fixed',status:'draft'});
 expect(writes[0].p_packages.map(p=>p.tier)).toEqual(['Basic','Standard','Premium']);
 expect(writes[0].p_packages[1].includes).toEqual(['Source file','Two concepts']);
});

test('keeps existing details and pricing editable on a small screen',async({page})=>{
 await page.setViewportSize({width:390,height:840});
 const writes=await signInAsSeller(page,'dark');
 await page.route('https://qa-order.invalid/rest/v1/services?*',route=>route.fulfill({json:[{
  id:serviceId,seller_id:sellerId,title:'Professional brand identity',title_en:'Brand identity in English',description:'I create a custom visual identity for your business.',category:'design',service_type:'hourly',tags:['Figma'],price:100000,delivery_days:5,revisions:1,package_name:'Basic',status:'draft'
 }]}));
 await page.goto('/seller-studio/');
 await page.locator('.service-list').getByRole('button',{name:'Edit',exact:true}).click();
 const editor=page.locator('.v71-service-editor');
 await editor.getByRole('button',{name:'Continue to service details'}).click();
 await editor.getByText('Extra details').click();
 await expect(editor.getByLabel('English title')).toHaveValue('Brand identity in English');
 await expect(editor.getByLabel('Keywords')).toHaveValue('Figma');
 await editor.getByText('Extra details').click();
 await editor.getByRole('button',{name:'Continue to pricing'}).click();
 await expect(editor.locator('summary').filter({hasText:'Pricing model'})).toContainText('Hourly consultation');
 await editor.locator('summary').filter({hasText:'Pricing model'}).click();
 await expect(editor.getByRole('radio',{name:'Hourly consultation'})).toBeChecked();
 await editor.locator('summary').filter({hasText:'Pricing model'}).click();
 await expect(editor.getByRole('textbox',{name:/Price \(MNT\).*hour/})).toHaveValue('100,000');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
 await editor.getByRole('button',{name:'Submit for review'}).click();
 await expect.poll(()=>writes.length).toBe(1);
 expect(writes[0].p_service_id).toBe(serviceId);
 expect(writes[0].p_details).toMatchObject({title_en:'Brand identity in English',tags:['Figma'],service_type:'hourly',status:'pending'});
 expect(writes[0].p_packages.map(p=>p.price)).toEqual([100000,220000,350000]);
});
