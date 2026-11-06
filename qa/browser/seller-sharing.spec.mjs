import {expect,test} from '@playwright/test';
import {buyer,mockMessenger} from './messenger-fixture.mjs';

const backend='https://mock-messenger.invalid';
const serviceId='20000000-0000-4000-8000-000000000010';
const service={id:serviceId,seller_id:buyer,title:'Public design',category:'design',price:100000,delivery_days:7,status:'published'};

test('seller can share published services and the saved public profile',async({page})=>{
 await mockMessenger(page);
 let isPublic=true;
 await page.route(backend+'/rest/v1/profiles**',route=>route.fulfill({json:[{
  id:buyer,display_name:'QA Seller',headline:'Designer',bio:'My portfolio',is_seller:true,
  slug:'qa-seller',public_profile:isPublic
 }]}));
 await page.route(backend+'/rest/v1/services**',route=>route.fulfill({json:[
  service,{...service,id:'20000000-0000-4000-8000-000000000011',title:'Private draft',status:'draft'}
 ]}));
 await page.addInitScript(()=>{
  localStorage.setItem('hustle-language','en');
  Object.defineProperty(navigator,'share',{configurable:true,value:undefined});
  Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async url=>{window.copiedShareUrl=url}}});
 });
 await page.goto('/seller-studio/');
 await page.locator('#hustle-auth-email').fill('buyer@example.test');
 await page.locator('#hustle-auth-password').fill('TestPasswordOnly123!');
 await page.locator('.hustle-auth-submit').click();
 const share=page.getByText('Share service',{exact:true});
 await expect(share).toHaveCount(1);
 await expect(page.getByRole('heading',{name:'Private draft'})).toBeVisible();
 await share.click();
 const serviceFacebook=await page.getByRole('link',{name:'Facebook',exact:true}).getAttribute('href');
 expect(new URL(serviceFacebook).searchParams.get('u')).toBe('https://linkup.mn/listing/?id='+serviceId);
 await page.evaluate(()=>{
  Object.defineProperty(navigator,'share',{configurable:true,value:async data=>{window.nativeShareData=data}});
 });
 await page.getByRole('button',{name:'Messenger',exact:true}).click();
 expect(await page.evaluate(()=>window.nativeShareData)).toEqual({title:'Public design',url:'https://linkup.mn/listing/?id='+serviceId});

 await page.goto('/my-profile/');
 await page.getByText('Share profile',{exact:true}).click();
 const profileFacebook=await page.getByRole('link',{name:'Facebook',exact:true}).getAttribute('href');
 expect(new URL(profileFacebook).searchParams.get('u')).toBe('https://linkup.mn/p/qa-seller/');
 await page.getByRole('button',{name:'Messenger',exact:true}).click();
 await expect(page.getByText('Link copied. Paste it into your Messenger chat.')).toBeVisible();
 expect(await page.evaluate(()=>window.copiedShareUrl)).toBe('https://linkup.mn/p/qa-seller/');
 await expect(page.getByRole('link',{name:'Open Messenger'})).toHaveAttribute('href','https://www.facebook.com/messages/');

 isPublic=false;
 await page.reload();
 await expect(page.getByRole('heading',{name:'My profile',exact:true})).toBeVisible();
 await expect(page.getByText('Share profile',{exact:true})).toHaveCount(0);
});
