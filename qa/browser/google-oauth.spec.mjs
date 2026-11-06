import {createHash} from 'node:crypto';
import {expect,test} from '@playwright/test';
import {buyer,mockMessenger} from './messenger-fixture.mjs';

const supabase='https://mock-messenger.invalid';
const googleButton=/Google-ээр үргэлжлүүлэх|Continue with Google/;

test.beforeEach(async({page})=>mockMessenger(page));

test('Google signup exchanges a PKCE code, creates a buyer profile and resumes the request',async({page})=>{
 const destination='/project-requests/?q=branding';
 let challenge,exchange,profile;
 await page.route(supabase+'/auth/v1/settings',route=>route.fulfill({json:{external:{google:true}}}));
 await page.route(supabase+'/auth/v1/authorize?**',async route=>{
  const params=new URL(route.request().url()).searchParams;
  const redirect=params.get('redirect_to');
  expect(redirect).toBe(new URL('/login/',page.url()).href);
  expect(params.get('provider')).toBe('google');
  expect(params.get('code_challenge_method')).toBe('s256');
  challenge=params.get('code_challenge');
  await route.fulfill({status:302,headers:{location:redirect+'?code=mock-google-code'}});
 });
 await page.route(supabase+'/auth/v1/token?grant_type=pkce',async route=>{
  exchange=route.request().postDataJSON();
  await route.fallback();
 });
 await page.route(supabase+'/rest/v1/profiles**',async route=>{
  const req=route.request();
  const params=new URL(req.url()).searchParams;
  if(req.method()==='POST'){
   profile=req.postDataJSON();
   await route.fulfill({json:profile});
  }else if(!profile&&params.get('id')==='eq.'+buyer){
   await route.fulfill({json:[]});
  }else await route.fallback();
 });
 await page.goto('/login/?next='+encodeURIComponent(destination));
 await expect(page.getByRole('button',{name:'Google-ээр үргэлжлүүлэх'})).toBeVisible();
 await page.getByRole('button',{name:/Бүртгэл үүсгэх|Create account/}).first().click();
 await page.getByRole('button',{name:googleButton}).click();
 await expect(page).toHaveURL(url=>url.pathname+url.search===destination);
 expect(exchange.auth_code).toBe('mock-google-code');
 expect(createHash('sha256').update(exchange.code_verifier).digest('base64url')).toBe(challenge);
 expect(profile).toEqual({id:buyer,display_name:'Buyer',is_seller:false,public_profile:false});
 expect(await page.evaluate(()=>localStorage.getItem('hustle-return-intent'))).toBeNull();
});

test('login shows a friendly message when the Google provider is disabled',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('hustle-language','en'));
 await page.route(supabase+'/auth/v1/settings',route=>route.fulfill({json:{external:{google:false}}}));
 await page.goto('/login/');
 await page.getByRole('button',{name:'Continue with Google'}).click();
 await expect(page.getByRole('alert')).toContainText('Google sign-in is currently unavailable');
 await expect(page).toHaveURL(/\/login\/$/);
 await expect(page.getByRole('button',{name:'Continue with Google'})).toBeEnabled();
});

test('Google cancellation returns a localized, retryable login screen',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('hustle-language','en'));
 await page.route(supabase+'/auth/v1/settings',route=>route.fulfill({json:{external:{google:true}}}));
 await page.route(supabase+'/auth/v1/authorize?**',route=>{
  const redirect=new URL(route.request().url()).searchParams.get('redirect_to');
  return route.fulfill({status:302,headers:{location:redirect+'#error=access_denied'}});
 });
 await page.goto('/login/');
 await page.getByRole('button',{name:'Continue with Google'}).click();
 await expect(page.getByRole('alert')).toContainText('Google sign-in was cancelled');
 await expect(page).toHaveURL(/\/login\/$/);
 await expect(page.getByRole('button',{name:'Continue with Google'})).toBeEnabled();
});
