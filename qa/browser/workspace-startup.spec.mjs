import {test,expect} from '@playwright/test';
import {mockMessenger} from './messenger-fixture.mjs';

function deferred(){
 let resolve;
 const promise=new Promise(done=>{resolve=done});
 return {promise,resolve};
}
async function signIn(page){
 await page.goto('/buyer/');
 await page.locator('#hustle-auth-email').fill('buyer@example.test');
 await page.locator('#hustle-auth-password').fill('TestPasswordOnly123!');
 await page.locator('.hustle-auth-submit').click();
}
async function openConversation(page){
 await expect(page.locator('.workspace-main')).toBeVisible();
 await page.locator('.workspace-sidebar').getByRole('button',{name:/Мессеж|Messages/}).click();
 await page.locator('.v25-messenger').getByRole('button',{name:/QA Seller/}).first().click();
 await expect(page.locator('.chat-thread-head')).toContainText('QA Seller');
 await expect(page).toHaveURL(/peer=10000000-0000-4000-8000-000000000002/);
 await page.reload();
 await expect(page.locator('.chat-thread-head')).toContainText('QA Seller');
}
test.beforeEach(async({page})=>{await mockMessenger(page)});
test('refresh after successful startup preserves the open conversation',async({page})=>{
 await signIn(page);
 await openConversation(page);
 const entered=deferred(),release=deferred();
 await page.route('https://mock-messenger.invalid/rest/v1/business_rules**',async route=>{
  entered.resolve();await release.promise;await route.fallback();
 });
 try{
  await page.locator('.v49-refresh').click();
  await entered.promise;
  await expect(page.locator('.chat-thread-head')).toContainText('QA Seller');
  await expect(page.locator('.workspace-loading')).toHaveCount(0);
 }finally{release.resolve()}
 await expect(page.locator('.v49-refresh')).toBeEnabled();
 await expect(page.locator('.chat-thread-head')).toContainText('QA Seller');
});
for(const width of [390,768,1440]){
 test('startup waits for data at '+width,async({page})=>{
  await page.setViewportSize({width,height:900});
  const entered=deferred(),release=deferred();
  await page.route('https://mock-messenger.invalid/rest/v1/order_events**',async route=>{
   entered.resolve();
   await release.promise;
   await route.fulfill({status:200,contentType:'application/json',body:'[]'});
  });
  try{
   await signIn(page);
   await entered.promise;
   // The signed-in role is already known, but the initial route is not ready.
   await expect(page.locator('.workspace-loading')).toBeVisible();
   await expect(page.locator('.workspace-main')).toHaveCount(0);
  }finally{release.resolve()}
  await openConversation(page);
 });
}
test('startup also waits for the post-login route decision',async({page})=>{
 await page.setViewportSize({width:768,height:900});
 const entered=deferred(),release=deferred();
 await page.route('https://mock-messenger.invalid/rest/v1/profiles**',async route=>{
  if(new URL(route.request().url()).searchParams.get('select')!=='is_seller'){
   await route.fallback();return;
  }
  entered.resolve();
  await release.promise;
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({is_seller:false})});
 });
 try{
  await signIn(page);
  await entered.promise;
  await expect(page.locator('.workspace-loading')).toBeVisible();
  await expect(page.locator('.workspace-main')).toHaveCount(0);
 }finally{release.resolve()}
 await openConversation(page);
});
for(const recovery of ['refresh','focus']){
test('failed startup releases the loading state and can recover via '+recovery,async({page})=>{
 let failing=true;
 const entered=deferred(),release=deferred();
 const routeEntered=deferred(),routeRelease=deferred();
 await page.route('https://mock-messenger.invalid/rest/v1/profiles**',async route=>{
  if(new URL(route.request().url()).searchParams.get('select')!=='is_seller'){
   await route.fallback();return;
  }
  routeEntered.resolve();await routeRelease.promise;
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({is_seller:false})});
 });
 await page.route('https://mock-messenger.invalid/rest/v1/business_rules**',async route=>{
  if(!failing){entered.resolve();await release.promise;await route.fallback();return;}
  await route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({code:'XX000',message:'Synthetic startup failure'})});
 });
 await signIn(page);
 await expect(page.locator('.workspace-message.error')).toBeVisible();
 await expect(page.locator('.workspace-loading')).toHaveCount(0);
 try{
  failing=false;
  if(recovery==='refresh')await page.locator('.v49-refresh').click();
  else await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
  await entered.promise;
  await expect(page.locator('.workspace-loading')).toBeVisible();
  await expect(page.locator('.workspace-main')).toHaveCount(0);
  release.resolve();
  await routeEntered.promise;
  await expect(page.locator('.workspace-loading')).toBeVisible();
  await expect(page.locator('.workspace-main')).toHaveCount(0);
 }finally{release.resolve();routeRelease.resolve()}
 await expect(page.locator('.workspace-message.error')).toHaveCount(0);
 await openConversation(page);
});
}
