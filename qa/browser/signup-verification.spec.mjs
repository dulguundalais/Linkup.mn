import {test,expect} from '@playwright/test';
import {buyer,mockMessenger} from './messenger-fixture.mjs';
const host='https://mock-messenger.invalid';
async function setup(page,{language='en',theme='light'}={}){
 await mockMessenger(page);
 await page.addInitScript(({language,theme})=>{localStorage.setItem('hustle-language',language);localStorage.setItem('hustle-theme',theme)},{language,theme});
 await page.route(host+'/auth/v1/signup**',r=>r.fulfill({json:{user:{id:buyer,email:'buyer@example.test'},session:null}}));
}
async function signup(page,path='/login/'){
 await page.goto(path);
 if(!path.includes('/join/seller'))await page.getByRole('group',{name:/Authentication mode|Нэвтрэлтийн горим/}).getByRole('button',{name:/Create account|Бүртгэл үүсгэх/}).click();
 await page.locator('#hustle-auth-email').fill('buyer@example.test');
 await page.locator('#hustle-auth-password').fill('TestOnly12345!');
 await page.locator('.hustle-auth-form button[type=submit]').click();
 await expect(page.locator('#hustle-signup-code')).toBeVisible();
}
function verifiedSession(){
 const user={id:buyer,email:'buyer@example.test',aud:'authenticated',role:'authenticated',app_metadata:{provider:'email'},user_metadata:{},identities:[],created_at:'2026-11-19T00:00:00Z'};
 const token=['eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',Buffer.from(JSON.stringify({sub:buyer,role:'authenticated',email:user.email,exp:1950000000})).toString('base64url'),'test-signature'].join('.');
 return {access_token:token,token_type:'bearer',expires_in:3600,refresh_token:'test-refresh',user};
}
test('email code creates a session and resumes the original request with its draft',async({page})=>{
 await setup(page);
 const destination='/project-requests/?q=branding';let verification,created;
 await page.route(host+'/auth/v1/verify',async r=>{verification=r.request().postDataJSON();await r.fulfill({json:verifiedSession()})});
 await page.route(host+'/rest/v1/profiles**',async r=>{
  if(r.request().method()==='POST'){created=r.request().postDataJSON();await r.fulfill({json:created})}
  else if(!created&&new URL(r.request().url()).searchParams.get('id')==='eq.'+buyer)await r.fulfill({json:[]});
  else await r.fallback();
 });
 await signup(page,'/login/?next='+encodeURIComponent(destination));
 await expect(page.locator('#hustle-signup-code')).toBeFocused();
 await expect(page.getByRole('group',{name:'Authentication mode'})).toHaveCount(0);
 await page.locator('#hustle-signup-code').fill('123 456');
 await page.getByRole('button',{name:'Verify and continue'}).click();
 await expect(page).toHaveURL(u=>u.pathname+u.search===destination);
 expect(verification).toMatchObject({email:'buyer@example.test',token:'123456',type:'email'});
 expect(created).toMatchObject({id:buyer,is_seller:false,public_profile:false});
 await expect(page.getByLabel('Describe the challenge')).toHaveValue('branding');
 expect(await page.evaluate(()=>sessionStorage.getItem('hustle-signup-pending'))).toBeNull();
});
test('invalid input stays local; expired codes show an inline retryable error',async({page})=>{
 await setup(page);let requests=0;
 await page.route(host+'/auth/v1/verify',r=>{requests++;return r.fulfill({status:403,json:{code:'otp_expired',msg:'Token has expired or is invalid'}})});
 await signup(page);
 const input=page.locator('#hustle-signup-code');
 await input.fill('123');await input.press('Enter');
 await expect(page.getByRole('alert')).toContainText('complete numeric code');expect(requests).toBe(0);
 await input.fill('123456');await input.press('Enter');
 await expect(page.getByRole('alert')).toContainText('incorrect or has expired');
 await expect(input).toBeFocused();expect(requests).toBe(1);
 await expect(page).toHaveURL(/\/login\/$/);
});
test('reload restores the code step and resend cooldown without storing a password or code',async({page})=>{
 await setup(page);await signup(page);await page.locator('#hustle-signup-code').fill('123456');
 await page.reload();await expect(page.locator('#hustle-signup-code')).toBeVisible();
 await expect(page.locator('#hustle-signup-code')).toHaveValue('');
 await expect(page.getByRole('button',{name:/Resend in/})).toBeDisabled();
 const pending=await page.evaluate(()=>JSON.parse(sessionStorage.getItem('hustle-signup-pending')));
 expect(Object.keys(pending).sort()).toEqual(['at','email','seller']);
 await page.getByRole('button',{name:'Wrong email? Change it'}).click();
 await expect(page.locator('#hustle-auth-email')).toHaveValue('buyer@example.test');
 await expect(page.locator('#hustle-auth-password')).toHaveValue('');
 expect(await page.evaluate(()=>sessionStorage.getItem('hustle-signup-pending'))).toBeNull();
});
test('resend targets the pending address and starts a new cooldown',async({page})=>{
 await setup(page);let payload;
 await page.route(host+'/auth/v1/resend',r=>{payload=r.request().postDataJSON();return r.fulfill({json:{}})});
 await page.addInitScript(()=>sessionStorage.setItem('hustle-signup-pending',JSON.stringify({email:'buyer@example.test',seller:false,at:Date.now()-61000})));
 await page.goto('/login/');await page.getByRole('button',{name:'Resend code',exact:true}).click();
 await expect(page.getByRole('status')).toContainText('new code has been requested');
 expect(payload).toMatchObject({email:'buyer@example.test',type:'signup'});
 await expect(page.getByRole('button',{name:/Resend in/})).toBeDisabled();
});
for(const theme of ['light','dark'])for(const width of [320,1440])test(`verification fits ${width}px in ${theme} mode`,async({page})=>{
 await page.setViewportSize({width,height:900});await setup(page,{language:'mn',theme});await signup(page);
 await expect(page.getByRole('heading',{name:'Имэйлээ баталгаажуулна уу'})).toBeVisible();
 await expect(page.locator('#hustle-signup-code')).toHaveAttribute('inputmode','numeric');
 await expect(page.locator('#hustle-signup-code')).toHaveAttribute('autocomplete','one-time-code');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(width);
 await page.screenshot({path:`test-results/signup-${theme}-${width}.png`,fullPage:true});
});
test('seller signup keeps the seller destination after verification',async({page})=>{
 await setup(page);await page.route(host+'/auth/v1/verify',r=>r.fulfill({json:verifiedSession()}));
 await signup(page,'/join/seller/');await page.locator('#hustle-signup-code').fill('12345678');
 await page.getByRole('button',{name:'Verify and continue'}).click();
 await expect(page).toHaveURL(/\/seller-studio\//);
});
