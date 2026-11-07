import {test,expect} from '@playwright/test';
import {makeOrderState,mockOrderFlow,sellerId} from './order-flow-fixture.mjs';

async function openEditor(page,{language='en',theme='light'}={}){
 await mockOrderFlow(page,makeOrderState(),'seller');
 const profile={id:sellerId,display_name:'QA Seller',headline:'Brand designer',bio:'I design visual identities for small businesses.',skills:'Branding',is_seller:true,slug:null,public_profile:false};
 const state={profile,updates:[],failNextSave:false};
 await page.route('https://qa-order.invalid/rest/v1/profiles?*',async route=>{
  const request=route.request();
  if(request.method()==='GET')return route.fulfill({json:[profile]});
  const update=request.postDataJSON();
  state.updates.push(update);
  if(state.failNextSave){
   state.failNextSave=false;
   return route.fulfill({status:500,json:{message:'Simulated save failure'}});
  }
  Object.assign(profile,update);
  return route.fulfill({json:profile});
 });
 await page.addInitScript(({language,theme})=>{
  localStorage.setItem('hustle-language',language);
  localStorage.setItem('hustle-theme',theme);
 },{language,theme});
 await page.goto('/login/?mode=seller');
 await page.locator('#hustle-auth-email').fill('seller@example.test');
 await page.locator('#hustle-auth-password').fill('QaOnlyPassword123!');
 await page.locator('.hustle-auth-submit').click();
 await expect(page).not.toHaveURL(/\/login\//);
 await page.goto('/my-profile/');
 await expect(page.getByRole('heading',{name:/^About you$|^Танилцуулга$/})).toBeVisible();
 return state;
}

test('saves an edited step before advancing and keeps the text on failure',async({page})=>{
 const state=await openEditor(page);
 const footer=page.locator('.sp-step-footer');
 await expect(footer).toContainText('Next section · Photo & cover');
 await expect(footer.getByRole('button',{name:'Continue',exact:true})).toBeVisible();
 await page.getByRole('textbox',{name:'Headline'}).fill('Product designer');
 state.failNextSave=true;
 const saveAndContinue=footer.getByRole('button',{name:'Save and continue'});
 await saveAndContinue.click();
 await expect(page.locator('.sp-editor').getByRole('alert')).toHaveText('Unable to save. Please try again.');
 await expect(page.getByRole('textbox',{name:'Headline'})).toHaveValue('Product designer');
 await saveAndContinue.click();
 await expect(page.getByRole('heading',{name:'Photo & cover'})).toBeVisible();
 expect(state.profile.headline).toBe('Product designer');
 await footer.getByRole('button',{name:'Continue',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Skills & tools'})).toBeVisible();
 expect(state.updates).toHaveLength(2);
 await footer.getByRole('button',{name:'Back',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Photo & cover'})).toBeVisible();
});

test('saves a typed skill while leaving visibility changes for the last step',async({page})=>{
 const state=await openEditor(page);
 const footer=page.locator('.sp-step-footer');
 const sections=page.locator('.sp-nav');
 await sections.getByRole('button',{name:'URL & visibility'}).click();
 await page.getByText('Make my profile public',{exact:true}).click();
 await expect(page.getByRole('switch',{name:/Make my profile public/})).toBeChecked();
 await footer.getByRole('button',{name:'Publish profile'}).click();
 await expect(page.locator('.sp-editor').getByRole('alert')).toContainText('Choose your profile URL');
 expect(state.updates).toHaveLength(0);
 await page.getByRole('textbox',{name:/Profile URL/}).fill('qa-seller');
 await sections.getByRole('button',{name:'Skills & tools'}).click();
 await page.getByRole('textbox',{name:'Add a skill'}).fill('Figma');
 await footer.getByRole('button',{name:'Save and continue'}).click();
 await expect(page.getByRole('heading',{name:'Portfolio'})).toBeVisible();
 expect(state.updates[0]).toMatchObject({skills:'Branding, Figma'});
 expect(state.updates[0]).not.toHaveProperty('public_profile');
 expect(state.updates[0]).not.toHaveProperty('slug');
 expect(state.profile.public_profile).toBe(false);
 await sections.getByRole('button',{name:'URL & visibility'}).click();
 await expect(page.getByRole('textbox',{name:/Profile URL/})).toHaveValue('qa-seller');
 await footer.getByRole('button',{name:'Publish profile'}).click();
 await expect(page.getByRole('link',{name:'Open public page'})).toHaveAttribute('href','/p/qa-seller/');
 expect(state.profile.public_profile).toBe(true);
});

test('keeps the editor and preview separate on desktop and a small phone',async({page})=>{
 await page.setViewportSize({width:1266,height:830});
 await openEditor(page,{language:'mn',theme:'dark'});
 await page.getByRole('textbox',{name:/Мэргэжил/}).fill('Бүтээгдэхүүний дизайнер');
 const edit=page.getByRole('button',{name:'Профайл засах',exact:true});
 const preview=page.getByRole('button',{name:'Урьдчилан харах',exact:true});
 for(const width of [1266,320]){
  await page.setViewportSize({width,height:830});
  await expect(page.locator('.sp-preview')).toHaveCount(0);
  const rail=await page.locator('.sp-rail').boundingBox();
  const editor=await page.locator('.sp-editor').boundingBox();
  expect(rail.x+rail.width<=editor.x||rail.y+rail.height<=editor.y).toBe(true);
  await preview.click();
  await expect(page.locator('.sp-editor')).toBeHidden();
  await expect(page.locator('.sp-rail')).toBeHidden();
  await expect(page.locator('.sp-preview article')).toHaveCount(1);
  await expect(page.locator('.sp-preview')).toContainText('Бүтээгдэхүүний дизайнер');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  await edit.click();
  await expect(page.getByRole('textbox',{name:/Мэргэжил/})).toHaveValue('Бүтээгдэхүүний дизайнер');
 }
 await preview.click();
 await page.getByRole('button',{name:'Нүүр зураг нэмэх',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Зураг ба нүүр зураг'})).toBeVisible();
 await expect(page.locator('.sp-preview')).toHaveCount(0);
});
