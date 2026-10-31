-- V53: self-service partner enrollment on the original Hustle.mn database.
-- STAGED MIGRATION: review and apply separately; this PR must not modify live data.
-- No monetary payouts. Rewards are simulated when beta orders are completed.
begin;

create table public.partner_memberships(
 user_id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null check(char_length(display_name) between 2 and 100),
 contact_email text not null check(char_length(contact_email) between 5 and 254),
 partner_kind text not null check(partner_kind in ('individual','business')),
 promotion_channel text not null check(char_length(promotion_channel) between 2 and 120),
 website text not null default '' check(char_length(website)<=250),
 tier text not null default 'community' check(tier in ('community','growth')),
 status text not null default 'active' check(status in ('active','suspended')),
 terms_version text not null default 'beta-2026-10',
 accepted_at timestamptz not null default now(),
 created_at timestamptz not null default now()
);
create index partner_memberships_status_idx on public.partner_memberships(status,tier);
alter table public.partner_memberships enable row level security;
revoke all on public.partner_memberships from public,anon,authenticated;
grant select on public.partner_memberships to authenticated;
create policy partner_memberships_own on public.partner_memberships for select to authenticated
 using(user_id=(select auth.uid()) or (select public.beta_role())='admin');

-- SECURITY AUDIT V53: Supabase default grants on legacy tables included
-- DELETE/TRUNCATE/REFERENCES/TRIGGER. TRUNCATE bypasses RLS. Narrow *both*
-- PUBLIC and authenticated grants; row policies alone are not enough.
revoke all on public.partner_codes,public.referrals,public.business_rules from public,anon,authenticated;
grant select on public.partner_codes to authenticated;
grant select,update on public.referrals to authenticated;
grant select,update on public.business_rules to authenticated;
-- Close legacy client-side code creation. A private transactional function owns this operation.
drop policy if exists codes_create on public.partner_codes;
drop policy if exists codes_read on public.partner_codes;
create policy codes_read_own on public.partner_codes for select to authenticated
 using(partner_id=(select auth.uid()) or (select public.beta_role())='admin');

-- Referral identity cannot be freely asserted by arbitrary clients.
drop policy if exists referrals_add on public.referrals;

create table public.partner_rewards(
 id uuid primary key default gen_random_uuid(),
 partner_id uuid not null references public.partner_memberships(user_id),
 referral_id uuid not null references public.referrals(id),
 order_id uuid not null unique references public.orders(id),
 basis_amount integer not null check(basis_amount>0),
 partner_percent numeric(5,2) not null check(partner_percent>=0 and partner_percent<=100),
 estimated_amount numeric(15,2) not null check(estimated_amount>=0),
 state text not null default 'simulated' check(state in ('simulated','reversed')),
 created_at timestamptz not null default now()
);
create index partner_rewards_owner_idx on public.partner_rewards(partner_id,created_at desc);
alter table public.partner_rewards enable row level security;
revoke all on public.partner_rewards from public,anon,authenticated;
grant select on public.partner_rewards to authenticated;
create policy partner_rewards_own on public.partner_rewards for select to authenticated
 using(partner_id=(select auth.uid()) or (select public.beta_role())='admin');

-- Identity and code are created atomically; self-service never upgrades a beta role.
create function hustle_private.v53_enroll_partner(
 p_name text,p_kind text,p_channel text,p_website text,p_accept boolean
) returns jsonb language plpgsql security definer set search_path='' as $$
declare v_uid uuid:=auth.uid(); v_email text;v_status text;v_tier text;v_code text;
begin
 if v_uid is null or not coalesce(p_accept,false) then
  raise exception 'Authentication and terms acceptance required';
 end if;
 if p_kind not in ('individual','business')
  or char_length(btrim(coalesce(p_name,''))) not between 2 and 100
  or char_length(btrim(coalesce(p_channel,''))) not between 2 and 120
  or char_length(coalesce(p_website,''))>250
  or (coalesce(p_website,'')<>'' and p_website !~* '^https?://[^[:space:]]+$')
 then raise exception 'Invalid partner registration information';end if;
 select lower(u.email) into v_email from auth.users u
 where u.id=v_uid and u.email_confirmed_at is not null and not coalesce(u.is_anonymous,false)
  and (u.banned_until is null or u.banned_until<now());
 if v_email is null or not exists(
   select 1 from public.beta_allowlist a where a.email=v_email and a.enabled
 ) then raise exception 'Verified beta account required';end if;
 -- A Partner can remain a buyer/seller; a valid profile is required by legacy codes.
 insert into public.profiles(id,display_name)
 values(v_uid,left(btrim(p_name),80))
 on conflict(id) do nothing;
 insert into public.partner_memberships(user_id,display_name,contact_email,partner_kind,promotion_channel,website)
 values(v_uid,btrim(p_name),v_email,p_kind,btrim(p_channel),coalesce(btrim(p_website),''))
 on conflict(user_id) do nothing;
 select status,tier into v_status,v_tier from public.partner_memberships where user_id=v_uid;
 if v_status<>'active' then raise exception 'Partner membership suspended';end if;
 insert into public.partner_codes(partner_id) values(v_uid) on conflict(partner_id) do nothing;
 select code into v_code from public.partner_codes where partner_id=v_uid;
 return jsonb_build_object('code',v_code,'status',v_status,'tier',v_tier);
end $$;
revoke all on function hustle_private.v53_enroll_partner(text,text,text,text,boolean) from public,anon;
grant execute on function hustle_private.v53_enroll_partner(text,text,text,text,boolean) to authenticated;
create function public.enroll_community_partner(
 p_name text,p_kind text,p_channel text,p_website text,p_accept boolean
) returns jsonb language sql security invoker set search_path='' as $$
 select hustle_private.v53_enroll_partner(p_name,p_kind,p_channel,p_website,p_accept)
$$;
revoke all on function public.enroll_community_partner(text,text,text,text,boolean) from public,anon;
grant execute on function public.enroll_community_partner(text,text,text,text,boolean) to authenticated;

-- First-touch attribution from URL is claimed only after verified signup,
-- and only for new accounts within the configured signup window.
-- IMPORTANT: browser-stored referral source is not cryptographic proof of
-- a server-observed click. Do not use this mechanism for real-money payouts.
create function hustle_private.v53_claim_referral(p_code text)
 returns boolean language plpgsql security definer set search_path='' as $$
declare v_uid uuid:=auth.uid();v_partner uuid;v_created timestamptz;v_email text;v_days integer;
begin
 if v_uid is null or p_code is null or p_code !~ '^[0-9a-f]{32}$' then return false;end if;
 select lower(u.email),u.created_at into v_email,v_created from auth.users u
 where u.id=v_uid and u.email_confirmed_at is not null
  and not coalesce(u.is_anonymous,false)
  and (u.banned_until is null or u.banned_until<now());
 if v_email is null or not exists(select 1 from public.beta_allowlist
    where email=v_email and enabled) then return false;end if;
 select attribution_days into v_days from public.business_rules where id=true;
 if v_days is null or now()>v_created+make_interval(days=>v_days) then return false;end if;
 select c.partner_id into v_partner from public.partner_codes c
 join public.partner_memberships m on m.user_id=c.partner_id and m.status='active'
 where c.code=p_code;
 if v_partner is null or v_partner=v_uid then return false;end if;
 if exists(select 1 from public.referrals where referred_id=v_uid) then return false;end if;
 -- Profiles must exist for referral foreign keys. Never modify an existing seller profile.
 insert into public.profiles(id,display_name)
 values(v_uid,'Linkup member')
 on conflict(id) do nothing;
 insert into public.referrals(partner_id,referred_id,eligible_until)
 values(v_partner,v_uid,now())
 on conflict(referred_id) do nothing;
 return found;
end $$;
revoke all on function hustle_private.v53_claim_referral(text) from public,anon;
grant execute on function hustle_private.v53_claim_referral(text) to authenticated;
create function public.claim_partner_referral(input_code text)
 returns boolean language sql security invoker set search_path='' as $$
 select hustle_private.v53_claim_referral(input_code)
$$;
revoke all on function public.claim_partner_referral(text) from public,anon;
grant execute on function public.claim_partner_referral(text) to authenticated;

-- Order status is authoritative; no partner may invent reward rows from the browser.
-- Completed beta orders yield simulated figures only, never payable balances.
create function hustle_private.v53_simulate_reward()
 returns trigger language plpgsql security definer set search_path='' as $$
declare v_ref public.referrals;v_tier text;v_percent numeric(5,2);v_rules public.business_rules;
begin
 if new.status<>'completed' or old.status='completed' then return new;end if;
 select r.* into v_ref from public.referrals r
 join public.partner_memberships m on m.user_id=r.partner_id and m.status='active'
 where r.referred_id=new.buyer_id and r.status in ('pending','verified')
  and r.created_at<=now() and r.eligible_until>=now() limit 1;
 if not found then return new;end if;
 select tier into v_tier from public.partner_memberships where user_id=v_ref.partner_id;
 select * into v_rules from public.business_rules where id=true;
 if v_tier is null or v_rules.id is null or new.quoted_price<=0 then return new;end if;
 v_percent:=case when v_tier='growth' then v_rules.active_partner_percent else v_rules.partner_percent end;
 insert into public.partner_rewards(partner_id,referral_id,order_id,basis_amount,partner_percent,estimated_amount)
 values(v_ref.partner_id,v_ref.id,new.id,new.quoted_price,v_percent,round(new.quoted_price*v_percent/100,0))
 on conflict(order_id) do nothing;
 -- "verified" here means eligible completed beta order; NOT financial settlement.
 if v_ref.status='pending' then
  update public.referrals set status='verified' where id=v_ref.id and status='pending';
 end if;
 return new;
end $$;
revoke all on function hustle_private.v53_simulate_reward() from public,anon,authenticated;
create trigger v53_simulated_reward after update of status on public.orders
 for each row execute function hustle_private.v53_simulate_reward();

-- Only owner admins may suspend or change the Growth tier.
create function hustle_private.v53_manage_partner(p_user uuid,p_status text,p_tier text)
 returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not exists(select 1 from public.beta_allowlist
  where email=lower(auth.jwt()->>'email') and role='admin' and enabled)
 then raise exception 'Admin only';end if;
 if p_status not in ('active','suspended') or p_tier not in ('community','growth')
 then raise exception 'Invalid partner state';end if;
 update public.partner_memberships set status=p_status,tier=p_tier where user_id=p_user;
 if not found then raise exception 'Partner not found';end if;
 insert into public.audit_events(actor_id,entity,record_id,action)
 values(auth.uid(),'partner_memberships',p_user::text,'SET_'||upper(p_status)||'_'||upper(p_tier));
end $$;
revoke all on function hustle_private.v53_manage_partner(uuid,text,text) from public,anon;
grant execute on function hustle_private.v53_manage_partner(uuid,text,text) to authenticated;
create function public.manage_partner_membership(p_user uuid,p_status text,p_tier text)
 returns void language sql security invoker set search_path='' as $$
 select hustle_private.v53_manage_partner(p_user,p_status,p_tier)
$$;
revoke all on function public.manage_partner_membership(uuid,text,text) from public,anon;
grant execute on function public.manage_partner_membership(uuid,text,text) to authenticated;

-- Existing profile/order tables have separate legacy grants; their remediation
-- requires a broader migration after verifying all Buyer/Seller workflows.
comment on table public.partner_rewards is
 'V53 beta-only simulated reward ledger. No payment obligation or payouts.';
commit;
