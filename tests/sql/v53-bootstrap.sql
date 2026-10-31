-- V53 isolated PostgreSQL fixture (GitHub Actions only; never run on user Supabase).
-- Mimics the dependencies of the existing Hustle beta migration.
create role anon nologin;
create role authenticated nologin;
create schema auth;
create schema hustle_private;
grant usage on schema public, auth, hustle_private to authenticated;
grant usage on schema public, auth to anon;
create function auth.uid() returns uuid language sql stable as
$$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
create function auth.jwt() returns jsonb language sql stable as
$$ select nullif(current_setting('request.jwt.claims',true),'')::jsonb $$;
grant execute on function auth.uid() to authenticated;
grant execute on function auth.jwt() to authenticated;

create table auth.users(
 id uuid primary key,
 email text not null unique,
 created_at timestamptz not null default now(),
 email_confirmed_at timestamptz,
 banned_until timestamptz,
 is_anonymous boolean not null default false
);
create table public.beta_allowlist(
 email text primary key,
 enabled boolean not null default true,
 role text not null default 'member' check(role in ('member','partner','admin'))
);
grant select on public.beta_allowlist to authenticated;
alter table public.beta_allowlist enable row level security;
create policy beta_self on public.beta_allowlist for select to authenticated
 using(email=lower((select auth.jwt()->>'email')));
create function public.beta_role() returns text language sql stable security invoker
 set search_path='' as $$
 select role from public.beta_allowlist where email=lower(auth.jwt()->>'email') and enabled
$$;
revoke all on function public.beta_role() from public,anon;
grant execute on function public.beta_role() to authenticated;

create table public.profiles(
 id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null check(char_length(display_name) between 2 and 80),
 headline text not null default '',
 created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
grant select,insert,update on public.profiles to authenticated;
create policy profiles_read on public.profiles for select to authenticated
 using((select public.beta_role()) is not null);
create policy profiles_insert on public.profiles for insert to authenticated
 with check(id=(select auth.uid()) and (select public.beta_role()) is not null);

create table public.business_rules(
 id boolean primary key default true,
 commission_percent numeric(5,2) not null default 10,
 partner_percent numeric(5,2) not null default 1,
 active_partner_percent numeric(5,2) not null default 2,
 attribution_days integer not null default 30,
 reward_months integer not null default 12
);
insert into public.business_rules(id) values(true);
alter table public.business_rules enable row level security;
grant all on public.business_rules to authenticated;
create policy rules_read on public.business_rules for select to authenticated
 using((select public.beta_role()) is not null);
create policy rules_admin on public.business_rules for update to authenticated
 using((select public.beta_role())='admin')
 with check((select public.beta_role())='admin');

create table public.partner_codes(
 partner_id uuid primary key references public.profiles(id),
 code text not null unique default replace(gen_random_uuid()::text,'-',''),
 created_at timestamptz not null default now()
);
alter table public.partner_codes enable row level security;
grant all on public.partner_codes to authenticated;
create policy codes_read on public.partner_codes for select to authenticated
 using((select public.beta_role()) is not null);
create policy codes_create on public.partner_codes for insert to authenticated
 with check(partner_id=auth.uid() and (select public.beta_role()) in ('partner','admin'));

create table public.referrals(
 id uuid primary key default gen_random_uuid(),
 partner_id uuid not null references public.partner_codes(partner_id),
 referred_id uuid not null unique references public.profiles(id),
 status text not null default 'pending' check(status in ('pending','verified','rejected')),
 created_at timestamptz not null default now(),
 eligible_until timestamptz not null,
 reviewed_at timestamptz,
 check(partner_id<>referred_id)
);
alter table public.referrals enable row level security;
grant all on public.referrals to authenticated;
create policy referrals_read on public.referrals for select to authenticated
 using((select public.beta_role()) is not null and
 (partner_id=auth.uid() or referred_id=auth.uid() or (select public.beta_role())='admin'));
create policy referrals_add on public.referrals for insert to authenticated
 with check((select public.beta_role()) is not null and referred_id=auth.uid()
 and partner_id<>auth.uid() and status='pending');
create policy referrals_admin on public.referrals for update to authenticated
 using((select public.beta_role())='admin')
 with check((select public.beta_role())='admin');

-- Keep the existing referral_guard semantics: immutable owner and server-set window.
create function hustle_private.referral_guard() returns trigger
 language plpgsql security invoker set search_path='' as $$
declare r public.business_rules;joined timestamptz;
begin
 if TG_OP='INSERT' then
  select * into r from public.business_rules where id=true;
  select created_at into joined from public.profiles where id=auth.uid();
  if joined is null or now()>joined+make_interval(days=>r.attribution_days)
   then raise exception 'Attribution window expired';end if;
  new.created_at=now();
  new.eligible_until=now()+make_interval(months=>r.reward_months);
  new.reviewed_at=null;new.status='pending';
 else
  if new.id<>old.id or new.partner_id<>old.partner_id
   or new.referred_id<>old.referred_id or new.created_at<>old.created_at
   or new.eligible_until<>old.eligible_until
   then raise exception 'Immutable referral attribution';end if;
  if old.status<>'pending' or new.status not in ('verified','rejected')
   then raise exception 'Referral already reviewed';end if;
  new.reviewed_at=now();
 end if;
 return new;
end $$;
create trigger referral_guard before insert or update on public.referrals
 for each row execute function hustle_private.referral_guard();

create table public.orders(
 id uuid primary key default gen_random_uuid(),
 buyer_id uuid not null references public.profiles(id),
 quoted_price integer not null check(quoted_price>0),
 status text not null default 'requested'
);
create table public.audit_events(
 id bigint generated always as identity primary key,
 actor_id uuid,
 entity text not null,
 record_id text,
 action text not null,
 created_at timestamptz not null default now()
);
-- Test identities: A partner, B referred buyer, C additional buyer, D aged-out,
-- E unverified, F admin. No actual email addresses or production records.
insert into auth.users(id,email,created_at,email_confirmed_at) values
 ('11111111-1111-4111-8111-111111111111','partner-a@example.test',now()-interval '1 day',now()-interval '1 day'),
 ('22222222-2222-4222-8222-222222222222','buyer-b@example.test',now()-interval '1 day',now()-interval '1 day'),
 ('33333333-3333-4333-8333-333333333333','buyer-c@example.test',now()-interval '1 day',now()-interval '1 day'),
 ('44444444-4444-4444-8444-444444444444','buyer-old@example.test',now()-interval '40 days',now()-interval '39 days'),
 ('55555555-5555-4555-8555-555555555555','unverified@example.test',now(),null),
 ('66666666-6666-4666-8666-666666666666','admin@example.test',now()-interval '1 day',now()-interval '1 day');
insert into public.beta_allowlist(email,role) values
 ('partner-a@example.test','member'),('buyer-b@example.test','member'),
 ('buyer-c@example.test','member'),('buyer-old@example.test','member'),
 ('unverified@example.test','member'),('admin@example.test','admin');
insert into public.profiles(id,display_name) values
 ('66666666-6666-4666-8666-666666666666','Test Admin');
