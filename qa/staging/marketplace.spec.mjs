import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {createClient} from '@supabase/supabase-js';
import {localAppURL} from './local-guard.mjs';

// Only public local credentials enter the browser suite. No service-role client,
// intercepted responses, route mocks or prebuilt session state are used here.
const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if(url!=='http://127.0.0.1:54321') throw new Error('Refusing non-local API');
const fixture=JSON.parse(readFileSync(process.env.HUSTLE_LOCAL_FIXTURES,'utf8'));
const brief='Browser acceptance: a complete synthetic brand identity and guidelines.';
const bytes=Buffer.from('Synthetic private brand guidelines for isolated CI only.');
async function api(role){
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const result=await db.auth.signInWithPassword({email:fixture.users[role].email,password:fixture.password});
 if(result.error)throw new Error('Local '+role+' sign-in failed: '+result.error.message);
 return db;
}
const data=result=>{if(result.error)throw new Error(result.error.message);return result.data;};
async function signIn(page,role,path){
 await page.goto(path);
 await page.locator('#hustle-auth-email').fill(fixture.users[role].email);
 await page.locator('#hustle-auth-password').fill(fixture.password);
 await page.locator('.hustle-auth-submit').click();
 await expect(page.locator('.workspace-main')).toBeVisible();
}
async function showOrders(page,seller=false){
 await page.getByRole('button',{name:seller?/Ирсэн захиалга|Incoming orders/:/Миний захиалга|My orders/}).first().click();
 return page.locator('.order-card').filter({hasText:brief});
}

test('real HTTP RLS rejects unrelated reads, writes, review forgery and role escalation',async()=>{
 const buyer=await api('buyer'),outsider=await api('outsider'),admin=await api('admin');
 for(const table of ['orders','order_events','order_files']) {
  const column=table==='orders'?'id':'order_id';
  expect(data(await outsider.from(table).select('*').eq(column,fixture.rehearsalOrderId))).toEqual([]);
 }
 const change=await outsider.from('orders').update({status:'cancelled'}).eq('id',fixture.rehearsalOrderId).select('id');
 expect(change.error || change.data?.length===0).toBeTruthy();
 const forged=await buyer.from('orders').update({quoted_price:1}).eq('id',fixture.rehearsalOrderId);
 expect(forged.error).toBeTruthy();
 expect(data(await buyer.from('orders').select('quoted_price,status').eq('id',fixture.rehearsalOrderId).single())).toMatchObject({quoted_price:50000,status:'requested'});
 expect((await outsider.from('reviews').insert({order_id:fixture.rehearsalOrderId,buyer_id:fixture.users.outsider.id,seller_id:fixture.users.seller.id,service_id:fixture.serviceId,rating:5,body:'An unrelated forged review must never be accepted.'})).error).toBeTruthy();
 data(await outsider.auth.updateUser({data:{role:'admin'}}));
 expect(data(await outsider.rpc('beta_role'))).toBe('member');
 expect((await outsider.rpc('list_beta')).error).toBeTruthy();
 expect(data(await admin.rpc('beta_role'))).toBe('admin');
 expect(data(await admin.from('orders').select('id').eq('id',fixture.rehearsalOrderId))).toHaveLength(1);
});

test('real buyer/seller order, chat, private delivery, revision, review and admin oversight',async({browser,request})=>{
 test.setTimeout(180000);
 const buyerCtx=await browser.newContext(),sellerCtx=await browser.newContext(),adminCtx=await browser.newContext(),outsiderCtx=await browser.newContext();
 const buyer=await buyerCtx.newPage(),seller=await sellerCtx.newPage(),admin=await adminCtx.newPage(),outsider=await outsiderCtx.newPage();
 try {
  const config=await request.get(localAppURL+'/api/config');
  expect(config.ok()).toBeTruthy();
  expect((await config.json()).url).toBe(url);
  await buyer.goto('/listing/?id='+fixture.serviceId);
  await expect(buyer.getByRole('heading',{name:'Isolated brand identity'})).toBeVisible();
  await buyer.locator('.v28-detail-primary').click();
  await buyer.locator('#hustle-auth-email').fill(fixture.users.buyer.email);
  await buyer.locator('#hustle-auth-password').fill(fixture.password);
  await buyer.locator('.hustle-auth-submit').click();
  const drawer=buyer.getByRole('dialog');
  await expect(drawer).toBeVisible();
  await drawer.locator('textarea[name="brief"]').fill(brief);
  await drawer.getByRole('button',{name:/Захиалга илгээх|Send order/}).click();
  await expect(drawer.locator('.v50-sent')).toBeVisible();
  await drawer.getByRole('link',{name:/Захиалгаа харах|View my order/}).click();
  const buyerDb=await api('buyer'),sellerDb=await api('seller'),outsiderDb=await api('outsider'),adminDb=await api('admin');
  const order=data(await buyerDb.from('orders').select('*').eq('brief',brief).single());
  expect(order).toMatchObject({buyer_id:fixture.users.buyer.id,seller_id:fixture.users.seller.id,quoted_price:50000,package_name:'Basic',revision_limit:1,status:'requested'});
  await signIn(seller,'seller','/seller-studio/');
  let card=await showOrders(seller,true);
  await card.getByRole('button',{name:/Зөвшөөрөх|Accept/}).click();
  await expect(card.locator('.status-accepted')).toBeVisible();
  await card.getByRole('button',{name:/Ажил эхлүүлэх|Start work/}).click();
  await expect(card.locator('.status-in_progress')).toBeVisible();
  await card.getByRole('button',{name:/Чатлах|Message/}).click();
  await expect(seller.locator('.chat-thread-head')).toBeVisible();
  const buyerCard=buyer.locator('.order-card').filter({hasText:brief});
  await buyerCard.getByRole('button',{name:/Чатлах|Message/}).click();
  await expect(buyer.locator('.chat-thread-head')).toContainText(/Шууд шинэчлэгдэж байна|Live updates/);
  const message='Real isolated message delivered without reloading the recipient.';
  await seller.locator('.v25-composer textarea').fill(message);
  await seller.locator('.chat-compose button').click();
  await expect(buyer.locator('.chat-bubble p').filter({hasText:message})).toBeVisible({timeout:15000});
  expect(data(await outsiderDb.from('messages').select('id').eq('body',message))).toEqual([]);
  card=await showOrders(seller,true);
  await card.locator('.v52-upload input[type=file]').setInputFiles({name:'private-guide.txt',mimeType:'text/plain',buffer:bytes});
  await expect(card.locator('.v52-files')).toContainText('private-guide.txt');
  await card.locator('textarea[name="note"]').fill('First private guide attached for the synthetic brand identity.');
  await card.getByRole('button',{name:/Хүлээлгэн өгөх|Deliver work/}).click();
  await expect(card.locator('.status-delivered')).toBeVisible();
  const file=data(await sellerDb.from('order_files').select('*').eq('order_id',order.id).single());
  expect(file).toMatchObject({uploader_id:fixture.users.seller.id,round:0,byte_size:bytes.length});
  const signed=data(await buyerDb.storage.from('order-files').createSignedUrl(file.object_path,60));
  const download=await request.get(signed.signedUrl);
  expect(download.ok()).toBeTruthy();expect(await download.body()).toEqual(bytes);
  expect((await outsiderDb.storage.from('order-files').createSignedUrl(file.object_path,60)).error).toBeTruthy();
  const anon=createClient(url,key,{auth:{persistSession:false}});
  expect((await anon.storage.from('order-files').download(file.object_path)).error).toBeTruthy();
  const denied=await outsiderDb.storage.from('order-files').upload(order.id+'/outsider.txt',bytes,{contentType:'text/plain'});
  expect(denied.error).toBeTruthy();
  expect((await buyerDb.storage.from('order-files').upload(order.id+'/buyer.txt',bytes,{contentType:'text/plain'})).error).toBeTruthy();
  expect(data(await adminDb.storage.from('order-files').createSignedUrl(file.object_path,60)).signedUrl).toBeTruthy();
  await buyer.goto('/buyer/');let received=await showOrders(buyer);
  await expect(received.locator('.status-delivered')).toBeVisible();
  await received.locator('textarea[name="revision_note"]').fill('Please use darker blue in the synthetic logo design.');
  await received.getByRole('button',{name:/Засвар хүсэх|Request a revision/}).click();
  await expect(received.locator('.status-in_progress')).toBeVisible();
  await seller.goto('/seller-studio/');card=await showOrders(seller,true);
  await card.locator('textarea[name="note"]').fill('Second version with the darker blue has been delivered.');
  await card.getByRole('button',{name:/Хүлээлгэн өгөх|Deliver work/}).click();
  await expect(card.locator('.status-delivered')).toBeVisible();
  expect((await buyerDb.from('orders').update({status:'in_progress',revision_note:'A second revision beyond the package allowance.'}).eq('id',order.id)).error).toBeTruthy();
  await buyer.goto('/buyer/');received=await showOrders(buyer);
  await received.getByRole('button',{name:/Ажлыг хүлээн авах|Accept delivery/}).click();
  await expect(received.locator('.status-completed')).toBeVisible();
  await received.locator('.review-composer textarea').fill('Excellent synthetic brand identity and clear communication.');
  await received.getByRole('button',{name:/Үнэлгээ нийтлэх|Publish review/}).click();
  await expect(received.locator('.review-existing')).toBeVisible();
  expect(data(await buyerDb.from('reviews').select('order_id').eq('order_id',order.id))).toHaveLength(1);
  expect(data(await buyerDb.from('order_events').select('kind,round').eq('order_id',order.id).order('created_at')).map(x=>x.kind)).toEqual(['delivered','revision_requested','delivered']);
  await signIn(admin,'admin','/admin/?view=orders');
  await expect(admin.locator('.order-card').filter({hasText:brief}).locator('.status-completed')).toBeVisible();
  await signIn(outsider,'outsider','/buyer/');
  await showOrders(outsider);
  await expect(outsider.locator('.order-card')).toHaveCount(0);
  await buyer.screenshot({path:'test-results-staging/buyer-completed.png',fullPage:true});
  await admin.screenshot({path:'test-results-staging/admin-oversight.png',fullPage:true});
 } finally {await Promise.all([buyerCtx.close(),sellerCtx.close(),adminCtx.close(),outsiderCtx.close()]);}
});
