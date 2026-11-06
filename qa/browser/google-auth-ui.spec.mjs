import {expect,test} from '@playwright/test';
import {mockMessenger} from './messenger-fixture.mjs';

const supabase='https://mock-messenger.invalid';

for(const theme of ['light','dark']){
 test(`Google controls fit both auth tabs at 360px in ${theme} mode`,async({page})=>{
  await page.setViewportSize({width:360,height:800});
  await mockMessenger(page);
  await page.addInitScript(theme=>{
   localStorage.setItem('hustle-theme',theme);
   localStorage.setItem('hustle-language','en');
  },theme);
  await page.goto('/login/');
  const panel=page.locator('.hustle-auth-panel');
  const google=panel.getByRole('button',{name:'Continue with Google'});
  await expect(google).toBeVisible();
  expect(await page.locator('.workspace').evaluate(el=>el.classList.contains('night'))).toBe(theme==='dark');
  const email=panel.getByLabel('Email address');
  const divider=panel.getByText('or with email',{exact:true});
  for(const register of [false,true]){
   if(register){
    await panel.getByRole('group',{name:'Authentication mode'}).getByRole('button',{name:'Create account'}).click();
    await expect(panel.getByText('Sign up in a minute.')).toBeVisible();
    const audience=await panel.getByRole('button',{name:/Organization/}).boundingBox();
    expect(audience.y+audience.height).toBeLessThan((await google.boundingBox()).y);
   }
   await expect(google).toHaveCSS('background-color','rgb(255, 255, 255)');
   await expect(google).toHaveCSS('color','rgb(31, 31, 31)');
   await expect(google).toHaveCSS('border-top-width','1px');
   await expect(google.locator('svg')).toBeVisible();
   const button=await google.boundingBox();
   const separator=await divider.boundingBox();
   expect(button.y+button.height).toBeLessThan(separator.y);
   expect(separator.y+separator.height).toBeLessThan((await email.boundingBox()).y);
   expect(button.height).toBe((await panel.locator('button[type=submit]').boundingBox()).height);
   expect(button.x+button.width).toBeLessThanOrEqual(360);
   expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(360);
   await expect(panel.getByRole('link',{name:'Terms of Service'})).toHaveAttribute('href','/terms/');
   await expect(panel.getByRole('link',{name:'Privacy Policy'})).toHaveAttribute('href','/privacy/');
  }
 });
}

test('Google signup saves the selected account type before redirecting',async({page})=>{
 await mockMessenger(page);
 await page.addInitScript(()=>localStorage.setItem('hustle-language','en'));
 let release;
 const settingsGate=new Promise(resolve=>{release=resolve});
 await page.route(supabase+'/auth/v1/settings',async route=>{
  await settingsGate;
  await route.fulfill({json:{external:{google:true}}});
 });
 await page.route(supabase+'/auth/v1/authorize?**',route=>{
  const redirect=new URL(route.request().url()).searchParams.get('redirect_to');
  return route.fulfill({status:302,headers:{location:redirect+'?code=mock-google-code'}});
 });
 await page.goto('/login/?audience=business&next=%2Fproject-requests%2F');
 const panel=page.locator('.hustle-auth-panel');
 await panel.getByRole('group',{name:'Authentication mode'}).getByRole('button',{name:'Create account'}).click();
 await expect(panel.getByRole('button',{name:/Organization/})).toHaveAttribute('aria-pressed','true');
 const readAudience=()=>page.evaluate(()=>localStorage.getItem('hustle-buyer-audience'));
 expect(await readAudience()).toBeNull();
 try{
  await panel.getByRole('button',{name:'Continue with Google'}).click();
  const pending=panel.getByRole('button',{name:'Redirecting to Google…'});
  await expect(pending).toBeDisabled();
  await expect(pending.locator('svg')).toHaveClass(/hustle-auth-google-spinner/);
  expect(await readAudience()).toBe('business');
 }finally{release()}
 await expect(page).toHaveURL(/\/project-requests\/$/);
 expect(await readAudience()).toBe('business');
});
