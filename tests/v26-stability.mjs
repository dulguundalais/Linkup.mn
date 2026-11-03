import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('registration, confirmation resend, and reset use current origin',()=>{
 const login=read('components/workspace.tsx'),recovery=read('components/premium-auth.tsx');
 assert.match(login,/emailRedirectTo:location\.origin\+\(entry==='seller'\|\|entryMode==='seller'\?'\/login\/\?mode=seller':'\/login\/'\)/);
 assert.match(login,/db\.auth\.resend/);
 assert.match(recovery,/redirectTo:location.origin\+'\/auth\/reset\/'/);
 assert.doesNotMatch(login+recovery,/localhost:3000/);
});
test('legacy admin list stays protected while open beta has no manual approval queue',()=>{
 const migration=read('supabase/migrations/20261021141415_beta_pending_approvals.sql');
 assert.match(migration,/security definer/);
 assert.match(migration,/a\.enabled and a\.role='admin'/);
 assert.match(migration,/email_confirmed_at is not null/);
 assert.match(migration,/revoke all/);
 const app=read('components/workspace.tsx');
 assert.doesNotMatch(app,/pendingBeta\.map/);
 assert.match(app,/manage_beta/);
});
test('existing auth, messages and order workflow preserved',()=>{
 const code=read('components/workspace.tsx');
 for(const keyword of ['signInWithPassword','signOut()','submitReview','sendMessage','updateOrder','attachFile','send_chat_attachment','read_at','orders'])assert.ok(code.includes(keyword),keyword);
 assert.doesNotMatch(code,/read_at,read_at/);
});
test('V26 SQL checks actual third-party chat, storage and beta admin denial',()=>{
 const a=read('tests/sql/v26-cross-account-security.sql'),b=read('tests/sql/marketplace-rls.sql');
 for(const x of ['ROLLBACK','outsider read chat','outsider read private storage','sender impersonation','list_pending_beta_signups'])assert.ok((a.toLowerCase()).includes(x.toLowerCase()),x);
 assert.match(a,/rollback;/i);
 assert.match(b,/insert into public\.service_packages/);
});
test('latest preview smoke requires real V26 marker, never obsolete V12',()=>{
 const w=read('.github/workflows/preview-deployment-smoke.yml'),marker=JSON.parse(read('public/v26-release.json'));
 assert.equal(marker.version,'V26');assert.match(w,/v26-release\.json/);assert.match(w,/preview-build\.json/);assert.match(w,/EXPECTED_SHA/);assert.match(w,/\/api\/config/);assert.doesNotMatch(w,/v12-release\.json/);
});
