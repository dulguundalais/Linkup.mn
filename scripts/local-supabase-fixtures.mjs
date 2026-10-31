import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,appendFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createClient} from '@supabase/supabase-js';
import {localStatus} from '../qa/staging/local-guard.mjs';

const status = localStatus(JSON.parse(readFileSync(process.env.HUSTLE_LOCAL_STATUS, 'utf8')));
const fixturePath = process.env.HUSTLE_LOCAL_FIXTURES;
if (!fixturePath) throw new Error('Missing private synthetic fixture path');
const db = new URL(status.DB_URL);
function sql(query) {
 return execFileSync('psql',['-X','-q','-A','-t','-v','ON_ERROR_STOP=1','-c',query],{
  env:{...process.env,PGHOST:'127.0.0.1',PGPORT:'54322',PGUSER:'postgres',PGDATABASE:'postgres',PGPASSWORD:decodeURIComponent(db.password)},encoding:'utf8',stdio:['ignore','pipe','pipe']
 }).trim();
}
const client = key => createClient(status.API_URL,key,{auth:{persistSession:false,autoRefreshToken:false}});
const ok = result => {if(result.error) throw new Error(result.error.message);return result.data;};
const action = process.argv[2];
if(action === 'env') {
 // Keys belong only to this disposable runner. Mask them before exporting any.
 for(const [key,value] of Object.entries(status)) if(/KEY|SECRET|PASSWORD/.test(key)) console.log('::add-mask::'+value);
 appendFileSync(process.env.GITHUB_ENV,`NEXT_PUBLIC_SUPABASE_URL=${status.API_URL}\nNEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${status.ANON_KEY}\n`);
} else if(action === 'seed') {
 const root = client(status.SERVICE_ROLE_KEY);
 const fixture = {password:'HustleLocalOnly123!',serviceId:'20000000-0000-4000-8000-000000000076',users:{}};
 for(const role of ['buyer','seller','admin','outsider']) {
  const email=`hustle-local-${role}@example.test`;
  const data=ok(await root.auth.admin.createUser({email,password:fixture.password,email_confirm:true}));
  assert.match(data.user.id,/^[0-9a-f-]{36}$/);
  fixture.users[role]={id:data.user.id,email};
  sql(`insert into public.profiles(id,display_name,is_seller,slug,public_profile) values ('${data.user.id}','Local ${role}',${role==='seller'},'hustle-local-${role}',${role==='seller'});`);
 }
 sql("update public.beta_allowlist set role='admin' where email='hustle-local-admin@example.test';");
 sql(`insert into public.services(id,seller_id,title,title_en,description,category,price,delivery_days,status) values ('${fixture.serviceId}','${fixture.users.seller.id}','Isolated brand identity','Isolated brand identity','Synthetic private CI service for verifying marketplace stabilization.','creative',50000,5,'published');
 insert into public.service_packages(service_id,tier,name,summary,price,delivery_days,revisions,includes) values ('${fixture.serviceId}','Basic','Basic','Local test package',50000,5,1,array['Logo']);`);
 const buyer=client(status.ANON_KEY),seller=client(status.ANON_KEY);
 ok(await buyer.auth.signInWithPassword({email:fixture.users.buyer.email,password:fixture.password}));
 ok(await seller.auth.signInWithPassword({email:fixture.users.seller.email,password:fixture.password}));
 const order=ok(await buyer.from('orders').insert({service_id:fixture.serviceId,buyer_id:fixture.users.buyer.id,seller_id:fixture.users.seller.id,service_title:'ignored client title',quoted_price:1,brief:'Existing synthetic order retained across the grant upgrade.',package_name:'Basic'}).select().single());
 fixture.rehearsalOrderId=order.id;
 ok(await buyer.from('messages').insert({sender_id:fixture.users.buyer.id,recipient_id:fixture.users.seller.id,body:'Existing synthetic message retained across the grant upgrade.'}));
 fixture.before = snapshot();
 writeFileSync(fixturePath,JSON.stringify(fixture),{mode:0o600});
 console.log('Synthetic confirmed Auth accounts and existing marketplace rows seeded on loopback only.');
} else if(action === 'verify') {
 const fixture=JSON.parse(readFileSync(fixturePath,'utf8'));
 assert.deepEqual(snapshot(),fixture.before,'Upgrade changed existing synthetic rows');
 assert.equal(sql("select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace cross join (values ('anon'),('authenticated')) r(role_name) cross join (values ('TRUNCATE'),('REFERENCES'),('TRIGGER')) p(privilege_name) where n.nspname='public' and c.relkind in ('r','p') and has_table_privilege(r.role_name,c.oid,p.privilege_name);"),'0');
 assert.equal(sql("select count(*) from supabase_migrations.schema_migrations where version='20261030115938';"),'1');
 console.log('Upgrade PASS: existing profiles/services/packages/orders/messages preserved; legacy non-row grants denied.');
} else throw new Error('Expected env, seed or verify');

function snapshot() {
 return Object.fromEntries(['profiles','services','service_packages','orders','messages'].map(table=>[table,JSON.parse(sql(`select coalesce(jsonb_agg(to_jsonb(t) order by to_jsonb(t)::text),'[]'::jsonb) from public.${table} t;`))]));
}
