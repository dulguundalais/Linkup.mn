import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(p,'utf8');
const m=read('supabase/migrations/20261025020453_open_beta_verified_signup.sql');
const w=read('components/workspace.tsx');
test('only a verified, non-anonymous, non-banned user can be auto-enrolled',()=>{
  assert.match(m,/new\.email_confirmed_at is null/);
  assert.match(m,/new\.is_anonymous/);
  assert.match(m,/new\.banned_until/);
  assert.match(m,/after insert or update of email,email_confirmed_at on auth\.users/i);
  assert.match(m,/insert into public\.beta_allowlist/);
  assert.match(m,/values\(lower\(btrim\(new\.email\)\),true,'member'\)/);
});
test('auto-enrollment never reactivates blocked users or elevates partner/admin',()=>{
  assert.match(m,/on conflict\(email\) do nothing/i);
  assert.doesNotMatch(m,/on conflict[^;]+do update/i);
  assert.doesNotMatch(m,/\bgrant\s+execute\b/i);
  assert.match(m,/revoke all on function hustle_private\.enroll_confirmed_open_beta_member\(\) from public,anon,authenticated/);
  assert.match(read('supabase/migrations/20261014101004_marketplace_closed_beta.sql'),/role in \('member','partner','admin'\)/);
});
test('open beta does not bypass RLS or remove listing moderation',()=>{
  const base=read('supabase/migrations/20261014101004_marketplace_closed_beta.sql');
  assert.match(base,/create policy orders_read/);
  assert.match(base,/create policy services_insert/);
  assert.match(base,/status in \('draft','pending'\)/);
  assert.match(w,/db\.from\('beta_allowlist'\)/);
  assert.match(w,/entry==='admin'&&role!=='admin'/);
  assert.doesNotMatch(w,/pendingBeta\.map/);
});
test('public UX explains email verification, no manual approval and no real payments',()=>{
  const footer=read('components/premium-footer.tsx');
  const info=read('lib/site-information.ts');
  assert.match(w,/Туршилтын хугацаанд төлбөр Linkup-аар дамжихгүй/);
  assert.match(w,/no admin approval needed/i);
  assert.match(footer,/Open beta · No real payments/);
  assert.match(info,/Verified new accounts receive standard member access automatically/);
  assert.match(info,/Published services remain subject to moderation|published services remain subject to moderation/i);
  assert.doesNotMatch(info,/Creating and verifying an account is not enough/);
});
