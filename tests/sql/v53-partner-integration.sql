-- V53 isolated integration assertions; run ONLY against temporary CI PostgreSQL.
\set ON_ERROR_STOP on
do $$
begin
 if has_table_privilege('authenticated','public.partner_codes','TRUNCATE') then raise exception 'Partner codes TRUNCATE leaked';end if;
 if has_table_privilege('authenticated','public.referrals','TRUNCATE') then raise exception 'Referrals TRUNCATE leaked';end if;
 if has_table_privilege('authenticated','public.business_rules','TRUNCATE') then raise exception 'Business rules TRUNCATE leaked';end if;
 if has_table_privilege('authenticated','public.referrals','DELETE') then raise exception 'Referrals DELETE leaked';end if;
 if has_table_privilege('authenticated','public.partner_codes','INSERT') then raise exception 'Partner codes direct INSERT leaked';end if;
 if has_table_privilege('authenticated','public.referrals','INSERT') then raise exception 'Referrals direct INSERT leaked';end if;
 if has_table_privilege('authenticated','public.partner_memberships','INSERT') then raise exception 'Membership direct INSERT leaked';end if;
 if has_table_privilege('authenticated','public.partner_rewards','INSERT') then raise exception 'Reward direct INSERT leaked';end if;
 if has_table_privilege('authenticated','public.partner_rewards','UPDATE') then raise exception 'Reward direct UPDATE leaked';end if;
 if has_table_privilege('authenticated','public.partner_memberships','TRUNCATE') then raise exception 'Membership TRUNCATE leaked';end if;
 if has_table_privilege('anon','public.partner_memberships','SELECT') then raise exception 'Anonymous can select member records';end if;
 if has_table_privilege('anon','public.partner_rewards','TRUNCATE') then raise exception 'Anonymous reward TRUNCATE leaked';end if;
 if has_table_privilege('authenticated','public.partner_rewards','TRUNCATE') then raise exception 'Reward TRUNCATE leaked';end if;
 if has_function_privilege('anon','public.enroll_community_partner(text,text,text,text,boolean)','EXECUTE')
  then raise exception 'Anon can enroll without signing in';end if;
 if has_function_privilege('anon','public.manage_partner_membership(uuid,text,text)','EXECUTE')
  then raise exception 'Anon can grant Growth rights';end if;
 if not has_table_privilege('authenticated','public.business_rules','UPDATE') then raise exception 'Admin settings privilege removed';end if;
 if not has_table_privilege('authenticated','public.referrals','UPDATE') then raise exception 'Admin referral-review privilege removed';end if;
end $$;

-- Verified Community partner enrolls automatically without changing member role.
set role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
select set_config('request.jwt.claims','{"email":"partner-a@example.test"}',false);
do $$
declare a jsonb;b jsonb;
begin
 a:=public.enroll_community_partner('Test Partner','individual','LinkedIn','',true);
 b:=public.enroll_community_partner('Test Partner','individual','LinkedIn','',true);
 if a->>'code' is null or a->>'code'<>b->>'code' then raise exception 'Non-idempotent partner code';end if;
 if (select count(*) from public.partner_memberships)<>1 then raise exception 'Membership not visible';end if;
 if (select public.beta_role())<>'member' then raise exception 'Beta role altered during enrollment';end if;
 if public.claim_partner_referral(a->>'code') then raise exception 'Self-referral accepted';end if;
end $$;
reset role;

do $$
begin
 if (select count(*) from public.partner_memberships where user_id='11111111-1111-4111-8111-111111111111')<>1 then raise exception 'Wrong partner count';end if;
 if (select count(*) from public.partner_codes where partner_id='11111111-1111-4111-8111-111111111111')<>1 then raise exception 'Wrong code count';end if;
end $$;
select set_config('audit.partner_code',(select code from public.partner_codes where partner_id='11111111-1111-4111-8111-111111111111'),false);

-- Buyer B can claim a valid partner once; cannot see other memberships or codes.
set role authenticated;
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',false);
select set_config('request.jwt.claims','{"email":"buyer-b@example.test"}',false);
do $$
begin
 if not public.claim_partner_referral(current_setting('audit.partner_code')) then raise exception 'Valid referral not accepted';end if;
 if public.claim_partner_referral(current_setting('audit.partner_code')) then raise exception 'Duplicate referral accepted';end if;
 if (select count(*) from public.partner_memberships)<>0 then raise exception 'Other user partner membership visible';end if;
 if (select count(*) from public.partner_codes)<>0 then raise exception 'Other user code leaked';end if;
 if (select count(*) from public.partner_rewards)<>0 then raise exception 'Other user reward leaked';end if;
 if (select display_name from public.profiles where id=auth.uid())<>'Linkup member' then raise exception 'Referral exposed personal email prefix';end if;
end $$;
reset role;

-- Unverified and old accounts cannot self-enroll/retroactively claim.
set role authenticated;
select set_config('request.jwt.claim.sub','44444444-4444-4444-8444-444444444444',false);
select set_config('request.jwt.claims','{"email":"buyer-old@example.test"}',false);
do $$
begin
 if public.claim_partner_referral(current_setting('audit.partner_code')) then raise exception 'Old account attributed';end if;
end $$;
reset role;
set role authenticated;
select set_config('request.jwt.claim.sub','55555555-5555-4555-8555-555555555555',false);
select set_config('request.jwt.claims','{"email":"unverified@example.test"}',false);
do $$
begin
 begin
  perform public.enroll_community_partner('Unverified User','individual','Website','',true);
  raise exception 'Unverified enrollment accepted';
 exception when others then
  if SQLERRM='Unverified enrollment accepted' then raise;end if;
 end;
end $$;
reset role;

-- Reward from authoritative completed order only, at 1% and rounded to MNT.
insert into public.orders(id,buyer_id,quoted_price,status)
 values('88888888-8888-4888-8888-888888888881','22222222-2222-4222-8222-222222222222',100000,'requested');
do $$
begin
 if (select count(*) from public.partner_rewards)<>0 then raise exception 'Reward before completion';end if;
end $$;
update public.orders set status='completed' where id='88888888-8888-4888-8888-888888888881';
do $$
begin
 if (select estimated_amount from public.partner_rewards where order_id='88888888-8888-4888-8888-888888888881')<>1000 then raise exception '1 percent commission failed';end if;
 if (select status from public.referrals where referred_id='22222222-2222-4222-8222-222222222222')<>'verified' then raise exception 'Referral not verified on completion';end if;
end $$;

-- Ordinary buyer cannot grant a 2% tier; owner Admin can.
set role authenticated;
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',false);
select set_config('request.jwt.claims','{"email":"buyer-b@example.test"}',false);
do $$
begin
 begin
  perform public.manage_partner_membership('11111111-1111-4111-8111-111111111111','active','growth');
  raise exception 'Member escalated Growth tier';
 exception when others then
  if SQLERRM='Member escalated Growth tier' then raise;end if;
 end;
end $$;
reset role;
set role authenticated;
select set_config('request.jwt.claim.sub','66666666-6666-4666-8666-666666666666',false);
select set_config('request.jwt.claims','{"email":"admin@example.test"}',false);
select public.manage_partner_membership('11111111-1111-4111-8111-111111111111','active','growth');
reset role;
insert into public.orders(id,buyer_id,quoted_price,status)
 values('88888888-8888-4888-8888-888888888882','22222222-2222-4222-8222-222222222222',100000,'requested');
update public.orders set status='completed' where id='88888888-8888-4888-8888-888888888882';
do $$
begin
 if (select estimated_amount from public.partner_rewards where order_id='88888888-8888-4888-8888-888888888882')<>2000 then raise exception '2 percent Growth commission failed';end if;
 if (select count(*) from public.audit_events where entity='partner_memberships')<>1 then raise exception 'Admin action not audited';end if;
end $$;

-- Suspension blocks new claims and new rewards, without changing buyer/seller role.
set role authenticated;
select set_config('request.jwt.claim.sub','66666666-6666-4666-8666-666666666666',false);
select set_config('request.jwt.claims','{"email":"admin@example.test"}',false);
select public.manage_partner_membership('11111111-1111-4111-8111-111111111111','suspended','growth');
reset role;
set role authenticated;
select set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333333',false);
select set_config('request.jwt.claims','{"email":"buyer-c@example.test"}',false);
do $$
begin
 if public.claim_partner_referral(current_setting('audit.partner_code')) then raise exception 'Suspended code accepted';end if;
end $$;
reset role;
insert into public.orders(id,buyer_id,quoted_price,status)
 values('88888888-8888-4888-8888-888888888883','22222222-2222-4222-8222-222222222222',100000,'requested');
update public.orders set status='completed' where id='88888888-8888-4888-8888-888888888883';
do $$
begin
 if (select count(*) from public.partner_rewards)<>2 then raise exception 'Suspended partner earned new reward';end if;
 if (select role from public.beta_allowlist where email='partner-a@example.test')<>'member'
 then raise exception 'Partner manipulated beta role';end if;
end $$;
select 'V53 isolated PostgreSQL security, RLS and commissions: PASS' as result;
