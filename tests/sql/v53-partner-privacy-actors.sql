-- Partner code privacy and referral claims on the full migration chain (V53).
-- Carries over the audit B04 checks (draft PR #80) to the V53 API that replaces it:
-- enroll_community_partner() issues codes, claim_partner_referral() redeems them.
-- Synthetic example.test identities only; the whole transaction rolls back.
begin;
insert into auth.users(id,email,email_confirmed_at) values
 ('10000000-0000-4000-8000-000000000c01','v53p-partner@example.test',now()),
 ('10000000-0000-4000-8000-000000000c02','v53p-member@example.test',now()),
 ('10000000-0000-4000-8000-000000000c03','v53p-late@example.test',now()),
 ('10000000-0000-4000-8000-000000000c04','v53p-suspended@example.test',now()),
 ('10000000-0000-4000-8000-000000000c05','v53p-admin@example.test',now()),
 ('10000000-0000-4000-8000-000000000c06','v53p-unverified@example.test',null),
 ('10000000-0000-4000-8000-000000000c07','v53p-other@example.test',now());
insert into public.beta_allowlist(email,role,enabled) values
 ('v53p-partner@example.test','member',true),('v53p-member@example.test','member',true),
 ('v53p-late@example.test','member',true),('v53p-suspended@example.test','member',true),
 ('v53p-admin@example.test','admin',true),('v53p-other@example.test','member',true)
 on conflict(email) do update set role=excluded.role,enabled=excluded.enabled;

-- An account older than the attribution window.
update auth.users set created_at=now()-interval '400 days' where id='10000000-0000-4000-8000-000000000c03';

set local role authenticated;

-- Self-service enrollment issues one private code per partner.
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000c01","email":"v53p-partner@example.test","role":"authenticated"}',true);
create temp table v53p(k text primary key,code text) on commit drop;
grant select,insert on v53p to authenticated;
insert into v53p select 'partner',public.enroll_community_partner('V53 Partner','individual','Instagram','',true)->>'code';
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000c04","email":"v53p-suspended@example.test","role":"authenticated"}',true);
insert into v53p select 'suspended',public.enroll_community_partner('V53 Suspended','business','Website','https://example.test',true)->>'code';
reset role;
update public.partner_memberships set status='suspended' where user_id='10000000-0000-4000-8000-000000000c04';
set local role authenticated;

-- A partner sees only its own code and cannot refer itself; direct writes are closed.
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000c01","email":"v53p-partner@example.test","role":"authenticated"}',true);
do $t$ begin
 if (select count(*) from public.partner_codes)<>1 then raise exception 'TEST FAIL: partner must see exactly its own code';end if;
 if public.claim_partner_referral((select code from v53p where k='partner')) then raise exception 'TEST FAIL: self referral accepted';end if;
 begin insert into public.partner_codes(partner_id,code) values(auth.uid(),'directwrite');raise exception 'TEST FAIL: direct code write';
 exception when insufficient_privilege then null;end;
end $t$;

-- A member cannot list codes; unknown, malformed and suspended codes fail; one claim only.
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000c02","email":"v53p-member@example.test","role":"authenticated"}',true);
do $t$ declare r public.referrals; begin
 if exists(select 1 from public.partner_codes) then raise exception 'TEST FAIL: member can read partner codes';end if;
 if public.claim_partner_referral(repeat('0',32)) then raise exception 'TEST FAIL: unknown code accepted';end if;
 if public.claim_partner_referral('not-a-code') then raise exception 'TEST FAIL: malformed code accepted';end if;
 if public.claim_partner_referral(null) then raise exception 'TEST FAIL: null code accepted';end if;
 if public.claim_partner_referral((select code from v53p where k='suspended')) then raise exception 'TEST FAIL: suspended partner code accepted';end if;
 if not public.claim_partner_referral((select code from v53p where k='partner')) then raise exception 'TEST FAIL: valid claim refused';end if;
 select * into r from public.referrals where referred_id=auth.uid();
 if r.partner_id<>'10000000-0000-4000-8000-000000000c01' or r.status<>'pending' or r.eligible_until<=now()+interval '1 month'
 then raise exception 'TEST FAIL: server-owned referral attributes';end if;
 if public.claim_partner_referral((select code from v53p where k='partner')) then raise exception 'TEST FAIL: duplicate claim accepted';end if;
 begin insert into public.referrals(partner_id,referred_id,eligible_until) values('10000000-0000-4000-8000-000000000c01',auth.uid(),now());raise exception 'TEST FAIL: direct referral write';
 exception when insufficient_privilege then null;end;
 update public.referrals set status='verified' where referred_id=auth.uid();
 if exists(select 1 from public.referrals where status='verified') then raise exception 'TEST FAIL: member reviewed own referral';end if;
end $t$;

-- An unrelated member sees no partner data.
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000c07","email":"v53p-other@example.test","role":"authenticated"}',true);
do $t$ begin
 if exists(select 1 from public.partner_codes) or exists(select 1 from public.referrals) or exists(select 1 from public.partner_memberships)
 then raise exception 'TEST FAIL: unrelated member sees partner data';end if;
end $t$;

-- Attribution window, unverified accounts and the anonymous role.
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000c03","email":"v53p-late@example.test","role":"authenticated"}',true);
do $t$ begin
 if public.claim_partner_referral((select code from v53p where k='partner')) then raise exception 'TEST FAIL: expired attribution accepted';end if;
end $t$;
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000c06","email":"v53p-unverified@example.test","role":"authenticated"}',true);
do $t$ begin
 if public.claim_partner_referral((select code from v53p where k='partner')) then raise exception 'TEST FAIL: unverified claim accepted';end if;
end $t$;
reset role;
set local role anon;
do $t$ begin
 begin perform public.claim_partner_referral(repeat('0',32));raise exception 'TEST FAIL: anon executed claim';
 exception when insufficient_privilege then null;end;
end $t$;
reset role;

-- The partner sees its referral; an administrator sees every code.
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000c01","email":"v53p-partner@example.test","role":"authenticated"}',true);
do $t$ begin
 if (select count(*) from public.referrals)<>1 then raise exception 'TEST FAIL: partner cannot see its referral';end if;
end $t$;
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000c05","email":"v53p-admin@example.test","role":"authenticated"}',true);
do $t$ begin
 if (select count(*) from public.partner_codes)<>2 then raise exception 'TEST FAIL: admin must see all codes';end if;
end $t$;
reset role;
select 'PASS: V53 private partner codes, server-side single claim, window and actor denials on the full chain; fixtures rolled back' as verification;
rollback;
