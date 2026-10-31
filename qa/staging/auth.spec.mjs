import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createClient} from '@supabase/supabase-js';
import {localAppURL} from './local-guard.mjs';

const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if(url!=='http://127.0.0.1:54321')throw new Error('Auth tests require loopback');
const fixture=JSON.parse(readFileSync(process.env.HUSTLE_LOCAL_FIXTURES,'utf8'));
const client=()=>createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
const ok=r=>{if(r.error)throw new Error(r.error.message);return r.data;};
async function signed(role){const db=client();ok(await db.auth.signInWithPassword({email:fixture.users[role].email,password:fixture.password}));return db;}
async function form(page,email,password){
 await page.locator('#hustle-auth-email').fill(email);
 await page.locator('#hustle-auth-password').fill(password);
 await page.locator('.hustle-auth-form button[type=submit]').click();
}
// Mailpit never relays mail outside the disposable runner. Keep email bodies,
// verification URLs and session tokens out of assertions, logs and artifacts.
async function emailLink(email,type,excluded=new Set()){
 let found;
 await expect.poll(async()=>{
  const inbox=await fetch('http://127.0.0.1:54324/api/v1/messages').then(r=>r.json());
  for(const message of inbox.messages||[]){
   if(excluded.has(message.ID)||!message.To?.some(to=>to.Address===email))continue;
   const body=await fetch('http://127.0.0.1:54324/api/v1/message/'+encodeURIComponent(message.ID)).then(r=>r.json());
   for(const match of (body.HTML||'').matchAll(/href="([^"]+)"/g)){
    const link=new URL(match[1].replaceAll('&amp;','&'));
    if(link.origin===url&&link.pathname==='/auth/v1/verify'&&link.searchParams.get('type')===type){found={id:message.ID,link};return true;}
   }
  }
  return false;
 },{message:'Expected isolated verification email',timeout:15000}).toBe(true);
 return found;
}
async function verifyLink(link,path,valid=true){
 const response=await fetch(link,{redirect:'manual'});
 const location=response.headers.get('location');
 if(!location)throw new Error('Verification did not redirect');
 const target=new URL(location);
 expect(target.origin).toBe(localAppURL);
 expect(target.pathname).toBe(path);
 const hash=new URLSearchParams(target.hash.slice(1));
 expect(hash.has('access_token')).toBe(valid);
 if(!valid)expect(hash.has('error')||target.searchParams.has('error')).toBe(true);
 return target.href;
}
async function openVerified(page,target){
 try{await page.goto(target);}catch{throw new Error('Could not open isolated verification redirect');}
}
test.beforeEach(async({page})=>{await page.addInitScript(()=>localStorage.setItem('hustle-language','en'));});

test('real signup, unconfirmed denial, resend, confirmation and member-only admission',async({page})=>{
 const email='hustle-auth-signup@example.test',db=client();
 await page.goto('/login/?next='+encodeURIComponent('/buyer/?tab=orders'));
 await page.locator('.hustle-auth-tabs').getByRole('button',{name:'Create account',exact:true}).click();
 await form(page,email,fixture.password);
 await expect(page.locator('.hustle-auth-feedback')).toContainText('Signup request accepted');
 const first=await emailLink(email,'signup');
 const unconfirmed=await db.auth.signInWithPassword({email,password:fixture.password});
 expect(unconfirmed.error?.code).toBe('email_not_confirmed');
 expect(unconfirmed.data.session).toBeNull();
 await page.locator('.hustle-auth-tabs').getByRole('button',{name:'Sign in',exact:true}).click();
 await form(page,email,fixture.password);
 await expect(page.locator('.hustle-auth-feedback')).toContainText('Your email is not confirmed');
 // Exercise real GoTrue resend; UI's 60-second cooldown is intentionally retained.
 await new Promise(resolve=>setTimeout(resolve,1100));
 ok(await db.auth.resend({type:'signup',email,options:{emailRedirectTo:localAppURL+'/login/'}}));
 const resent=await emailLink(email,'signup',new Set([first.id]));
 const destination=await verifyLink(resent.link,'/login/');
 await openVerified(page,destination);
 await expect.poll(()=>new URL(page.url()).pathname.replace(/\/$/,'')).toBe('/buyer');
 await expect(page.locator('.workspace-main')).toBeVisible();
 expect(new URL(page.url()).searchParams.get('tab')).toBe('orders');
 ok(await db.auth.signInWithPassword({email,password:fixture.password}));
 expect(ok(await db.rpc('beta_role'))).toBe('member');
 expect((await db.rpc('list_beta')).error).toBeTruthy();
 expect((await db.auth.signInWithPassword({email,password:'WrongPassword123!'})).error?.code).toBe('invalid_credentials');
 await page.goto('/admin/');
 // Admin is an auth entry: an ordinary member is routed to their buyer area.
 await expect.poll(()=>new URL(page.url()).pathname.replace(/\/$/,'')).toBe('/buyer');
 await expect(page.locator('.workspace-main')).toBeVisible();
 await expect(page.locator('.workspace-role-admin')).toHaveCount(0);
 await page.goto('/admin/?mode=admin');
 await expect(page.locator('.access-card')).toContainText('Admin access required');
 await verifyLink(resent.link,'/login/',false);
 await page.goto('/buyer/');
 await page.locator('.global-account-trigger').click();
 await page.locator('.global-account-signout').click();
 await expect.poll(()=>new URL(page.url()).pathname).toBe('/');
 await page.goto('/buyer/');
 await expect(page.locator('#hustle-auth-email')).toBeVisible();
 await page.reload();
 await expect(page.locator('#hustle-auth-email')).toBeVisible();
});

test('real recovery email changes password, logs out, rejects replay and does not enumerate accounts',async({page,browser})=>{
 const email='hustle-auth-recovery@example.test',newPassword='HustleChangedLocal456!',setup=client();
 ok(await setup.auth.signUp({email,password:fixture.password,options:{emailRedirectTo:localAppURL+'/login/'}}));
 const confirmation=await emailLink(email,'signup');
 await verifyLink(confirmation.link,'/login/');
 await page.goto('/login/?reset=1');
 await page.locator('#hustle-recovery-email').fill(email);
 await page.locator('.hustle-auth-submit').click();
 await expect(page.locator('.hustle-auth-feedback')).toContainText('If an account exists');
 const message=await emailLink(email,'recovery');
 await openVerified(page,await verifyLink(message.link,'/auth/reset/'));
 await expect(page.locator('#reset-pass')).toBeVisible();
 await page.locator('#reset-pass').fill(newPassword);
 await page.locator('#reset-repeat').fill('DifferentLocal123!');
 await page.locator('.hustle-auth-submit').click();
 await expect(page.locator('.hustle-auth-feedback[role=alert]')).toContainText('Passwords must match');
 await page.locator('#reset-repeat').fill(newPassword);
 await page.locator('.hustle-auth-submit').click();
 await expect(page.locator('.is-success')).toContainText('Your password has been updated');
 await page.goto('/buyer/');
 await expect(page.locator('#hustle-auth-email')).toBeVisible();
 const db=client();
 expect((await db.auth.signInWithPassword({email,password:fixture.password})).error?.code).toBe('invalid_credentials');
 ok(await db.auth.signInWithPassword({email,password:newPassword}));
 await db.auth.signOut();
 const replay=await verifyLink(message.link,'/auth/reset/',false);
 const clean=await browser.newContext(),replayPage=await clean.newPage();
 try{
  await openVerified(replayPage,replay);
  await expect(replayPage.locator('.hustle-auth-feedback')).toContainText(/missing, expired|хугацаа нь дууссан/);
  await expect(replayPage.locator('#reset-pass')).toHaveCount(0);
 }finally{await clean.close();}
 await page.goto('/login/?reset=1');
 await page.locator('#hustle-recovery-email').fill('hustle-auth-nonexistent@example.test');
 await page.locator('.hustle-auth-submit').click();
 await expect(page.locator('.hustle-auth-feedback')).toContainText('If an account exists');
});

test('a signed-in member cannot turn a plain query parameter into a recovery link',async({page})=>{
 await page.goto('/buyer/');await form(page,fixture.users.buyer.email,fixture.password);
 await expect(page.locator('.workspace-main')).toBeVisible();
 await page.goto('/auth/reset/?type=recovery');
 await expect(page.locator('.hustle-auth-feedback')).toContainText('missing, expired');
 await expect(page.locator('#reset-pass')).toHaveCount(0);
});

test('logout revokes refresh credentials and an expired saved session returns to sign-in',async({page})=>{
 await page.goto('/buyer/');await form(page,fixture.users.buyer.email,fixture.password);
 await expect(page.locator('.workspace-main')).toBeVisible();
 const db=await signed('buyer'),session=ok(await db.auth.getSession()).session;
 ok(await db.auth.signOut());
 expect((await db.auth.refreshSession({refresh_token:session.refresh_token})).error).toBeTruthy();
 // Simulate expiry of the browser's saved session after global logout. Leave
 // its authentic access/refresh tokens untouched; real GoTrue rejects refresh.
 const changed=await page.evaluate(()=>{
  for(const storageKey of Object.keys(localStorage)){
   if(!/^sb-.+-auth-token$/.test(storageKey))continue;
   const saved=JSON.parse(localStorage.getItem(storageKey));
   if(saved?.access_token&&saved?.refresh_token){saved.expires_at=1;localStorage.setItem(storageKey,JSON.stringify(saved));return true;}
  }
  return false;
 });
 expect(changed).toBe(true);
 await page.reload();
 await expect(page.locator('#hustle-auth-email')).toBeVisible();
 await expect(page.locator('.workspace-main')).toHaveCount(0);
});

test('expired confirmation/recovery links fail and confirmation never re-enables a disabled account',async()=>{
 const email='hustle-auth-expiry@example.test',db=client(),admin=await signed('admin');
 const manage=enabled=>admin.rpc('manage_beta',{target_email:email,target_role:'member',target_enabled:enabled});
 ok(await db.auth.signUp({email,password:fixture.password,options:{emailRedirectTo:localAppURL+'/login/'}}));
 const confirmation=await emailLink(email,'signup');
 execFileSync(process.execPath,['scripts/expire-local-auth-link.mjs','signup',email],{stdio:['ignore','pipe','pipe']});
 await verifyLink(confirmation.link,'/login/',false);
 ok(await manage(false));
 await new Promise(resolve=>setTimeout(resolve,1100));
 ok(await db.auth.resend({type:'signup',email,options:{emailRedirectTo:localAppURL+'/login/'}}));
 const fresh=await emailLink(email,'signup',new Set([confirmation.id]));
 await verifyLink(fresh.link,'/login/');
 ok(await db.auth.signInWithPassword({email,password:fixture.password}));
 expect(ok(await db.rpc('beta_role'))).toBeNull();
 ok(await manage(true));expect(ok(await db.rpc('beta_role'))).toBe('member');
 ok(await db.auth.resetPasswordForEmail(email,{redirectTo:localAppURL+'/auth/reset/'}));
 const recovery=await emailLink(email,'recovery');
 execFileSync(process.execPath,['scripts/expire-local-auth-link.mjs','recovery',email],{stdio:['ignore','pipe','pipe']});
 await verifyLink(recovery.link,'/auth/reset/',false);
 await Promise.all([db.auth.signOut(),admin.auth.signOut()]);
});

test('existing JWT obeys disable, re-enable, partner and administrator revocation immediately',async()=>{
 const admin=await signed('admin'),actor=await signed('outsider'),buyer=await signed('buyer');
 const email=fixture.users.outsider.email;
 const manage=(role,enabled)=>admin.rpc('manage_beta',{target_email:email,target_role:role,target_enabled:enabled});
 const roles=()=>actor.rpc('beta_role');
 try{
  expect((await actor.rpc('manage_beta',{target_email:fixture.users.buyer.email,target_role:'admin',target_enabled:true})).error).toBeTruthy();
  expect((await actor.from('beta_allowlist').update({role:'admin'}).eq('email',email)).error).toBeTruthy();
  expect((await actor.from('partner_codes').insert({partner_id:fixture.users.outsider.id,code:'AUTHLOCAL79'})).error).toBeTruthy();
  ok(await manage('partner',true));expect(ok(await roles())).toBe('partner');
  // V53: codes are issued only by self-service enrollment; direct writes stay closed for every role.
  expect((await actor.from('partner_codes').insert({partner_id:fixture.users.outsider.id,code:'AUTHLOCAL79'})).error).toBeTruthy();
  const enrolled=ok(await actor.rpc('enroll_community_partner',{p_name:'Local Partner',p_kind:'individual',p_channel:'Instagram',p_website:'',p_accept:true}));
  expect(enrolled.code).toMatch(/^[0-9a-f]{32}$/);
  expect(ok(await buyer.from('partner_codes').select('code'))).toEqual([]);
  ok(await manage('member',false));expect(ok(await roles())).toBeNull();
  expect(ok(await actor.from('orders').select('id'))).toEqual([]);
  expect((await actor.from('messages').insert({sender_id:fixture.users.outsider.id,recipient_id:fixture.users.buyer.id,body:'A disabled account must never send this message.'})).error).toBeTruthy();
  ok(await actor.auth.refreshSession());expect(ok(await roles())).toBeNull();
  ok(await manage('member',true));expect(ok(await roles())).toBe('member');
  expect((await actor.from('partner_codes').insert({partner_id:fixture.users.outsider.id,code:'AUTHLOCAL80'})).error).toBeTruthy();
  ok(await manage('admin',true));expect(ok(await actor.rpc('list_beta')).length).toBeGreaterThan(0);
  ok(await manage('member',true));
  expect((await actor.rpc('list_beta')).error).toBeTruthy();
  expect((await actor.rpc('list_pending_beta_signups')).error).toBeTruthy();
  expect((await actor.rpc('manage_beta',{target_email:fixture.users.buyer.email,target_role:'admin',target_enabled:true})).error).toBeTruthy();
  expect(ok(await buyer.rpc('beta_role'))).toBe('member');
 }finally{ok(await manage('member',true));await Promise.all([admin.auth.signOut(),actor.auth.signOut(),buyer.auth.signOut()]);}
});
