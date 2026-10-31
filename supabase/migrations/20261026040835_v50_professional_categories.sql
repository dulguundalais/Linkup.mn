-- V50: professional services taxonomy.
-- * 11 main categories replace the 9 creative ones; every existing service and
--   project request is moved to its new category (nothing is deleted).
-- * services gain subcategory, service_type (fixed/hourly/custom/monthly/mentoring) and tags.
-- * Sellers can suggest categories; suggestions stay private until an admin reviews them.
-- * Legal and wellbeing services can only be published by verified professionals.
begin;

-- 1. New category ids, with the old ones mapped onto them.
alter table public.services drop constraint services_category_check;
alter table public.project_requests drop constraint project_requests_category_check;

alter table public.services
  add column subcategory text not null default '' check (subcategory = '' or subcategory ~ '^[a-z0-9-]{2,40}$'),
  add column service_type text not null default 'fixed' check (service_type in ('fixed','hourly','custom','monthly','mentoring')),
  add column tags text[] not null default '{}' check (cardinality(tags) <= 8 and char_length(array_to_string(tags, ',')) <= 300);

update public.services set subcategory = case category
    when 'design' then 'brand-identity' when 'ui' then 'ui-ux' when 'video' then 'video-editing'
    when 'translation' then 'translation' when 'marketing' then 'digital-marketing' when 'web' then 'web'
    when 'interior' then 'interior' when 'ai' then 'integration' when 'proposals' then 'proposals' else subcategory end,
  category = case category
    when 'design' then 'creative' when 'ui' then 'tech' when 'video' then 'creative'
    when 'translation' then 'creative' when 'web' then 'tech' when 'interior' then 'creative'
    when 'proposals' then 'business' else category end;
update public.project_requests set category = case category
    when 'design' then 'creative' when 'ui' then 'tech' when 'video' then 'creative'
    when 'translation' then 'creative' when 'web' then 'tech' when 'interior' then 'creative'
    when 'proposals' then 'business' else category end;

alter table public.services add constraint services_category_check check (category in
  ('ai','business','marketing','tech','finance','legal','research','creative','commerce','education','wellbeing'));
alter table public.project_requests add constraint project_requests_category_check check (category in
  ('ai','business','marketing','tech','finance','legal','research','creative','commerce','education','wellbeing'));
create index services_subcategory_idx on public.services(category, subcategory) where status = 'published';

-- 2. Professional verification for regulated categories (set by admins only).
create table public.professional_verifications (
  seller_id uuid not null references public.profiles(id) on delete cascade,
  category text not null check (category in ('legal','wellbeing')),
  status text not null default 'verified' check (status in ('verified','revoked')),
  credential_note text not null default '' check (char_length(credential_note) <= 500),
  verified_by uuid references public.profiles(id),
  verified_at timestamptz not null default now(),
  primary key (seller_id, category)
);
create index professional_verifications_verifier_idx on public.professional_verifications(verified_by);
alter table public.professional_verifications enable row level security;
revoke all on public.professional_verifications from public, anon, authenticated;
grant select on public.professional_verifications to authenticated;
grant insert (seller_id, category, status, credential_note) on public.professional_verifications to authenticated;
grant update (status, credential_note) on public.professional_verifications to authenticated;
create policy professional_verifications_read on public.professional_verifications for select to authenticated
  using (seller_id = (select auth.uid()) or (select public.beta_role()) = 'admin');
create policy professional_verifications_admin_add on public.professional_verifications for insert to authenticated
  with check ((select public.beta_role()) = 'admin');
create policy professional_verifications_admin_change on public.professional_verifications for update to authenticated
  using ((select public.beta_role()) = 'admin') with check ((select public.beta_role()) = 'admin');

create function hustle_private.verification_stamp() returns trigger
language plpgsql security invoker set search_path = '' as $stamp$
begin
  if TG_OP = 'UPDATE' and (new.seller_id <> old.seller_id or new.category <> old.category) then
    raise exception 'Verification owner and category are immutable';
  end if;
  new.verified_by := auth.uid(); new.verified_at := now();
  return new;
end
$stamp$;
create trigger verification_stamp before insert or update on public.professional_verifications
  for each row execute function hustle_private.verification_stamp();
create trigger audit_professional_verifications after insert or update on public.professional_verifications
  for each row execute function hustle_private.audit_change();

-- Regulated services cannot be published without an active verification.
create function hustle_private.regulated_service_guard() returns trigger
language plpgsql security definer set search_path = '' as $guard$
begin
  if new.status = 'published' and new.category in ('legal','wellbeing') and not exists (
    select 1 from public.professional_verifications v
    where v.seller_id = new.seller_id and v.category = new.category and v.status = 'verified'
  ) then
    raise exception 'This category requires a verified professional' using hint = 'hx_verification_required';
  end if;
  return new;
end
$guard$;
revoke all on function hustle_private.regulated_service_guard() from public, anon, authenticated;
create trigger regulated_service_guard before insert or update of status, category on public.services
  for each row execute function hustle_private.regulated_service_guard();

-- 3. Category suggestions from sellers. Never public; admins approve, reject or merge.
create table public.category_suggestions (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles(id) on delete cascade,
  parent_category text check (parent_category is null or parent_category in
    ('ai','business','marketing','tech','finance','legal','research','creative','commerce','education','wellbeing')),
  name_mn text not null check (char_length(btrim(name_mn)) between 2 and 80),
  name_en text not null default '' check (char_length(name_en) <= 80),
  note text not null default '' check (char_length(note) <= 500),
  status text not null default 'pending' check (status in ('pending','approved','rejected','merged')),
  merged_into text not null default '' check (char_length(merged_into) <= 80),
  admin_note text not null default '' check (char_length(admin_note) <= 500),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id)
);
create index category_suggestions_queue_idx on public.category_suggestions(status, created_at desc);
create index category_suggestions_seller_idx on public.category_suggestions(seller_id, created_at desc);
create index category_suggestions_reviewer_idx on public.category_suggestions(reviewed_by);
alter table public.category_suggestions enable row level security;
revoke all on public.category_suggestions from public, anon, authenticated;
grant select on public.category_suggestions to authenticated;
grant insert (seller_id, parent_category, name_mn, name_en, note) on public.category_suggestions to authenticated;
grant update (status, merged_into, admin_note) on public.category_suggestions to authenticated;
create policy category_suggestions_read on public.category_suggestions for select to authenticated
  using ((select public.beta_role()) is not null
         and (seller_id = (select auth.uid()) or (select public.beta_role()) = 'admin'));
create policy category_suggestions_add on public.category_suggestions for insert to authenticated
  with check ((select public.beta_role()) is not null and seller_id = (select auth.uid()));
create policy category_suggestions_review on public.category_suggestions for update to authenticated
  using ((select public.beta_role()) = 'admin') with check ((select public.beta_role()) = 'admin');

create function hustle_private.category_suggestion_guard() returns trigger
language plpgsql security invoker set search_path = '' as $sg$
begin
  if TG_OP = 'INSERT' then
    if (select count(*) from public.category_suggestions s
        where s.seller_id = new.seller_id and s.created_at > now() - interval '24 hours') >= 5 then
      raise exception 'Suggestion limit reached. Please try again tomorrow.' using hint = 'hx_suggestion_limit';
    end if;
    new.status := 'pending'; new.merged_into := ''; new.admin_note := ''; new.created_at := now();
    new.reviewed_at := null; new.reviewed_by := null;
    new.name_mn := btrim(new.name_mn); new.name_en := btrim(new.name_en); new.note := btrim(new.note);
    return new;
  end if;
  if new.id <> old.id or new.seller_id <> old.seller_id or new.parent_category is distinct from old.parent_category
     or new.name_mn <> old.name_mn or new.name_en <> old.name_en or new.note <> old.note or new.created_at <> old.created_at then
    raise exception 'Suggestion details are immutable';
  end if;
  if new.status = 'merged' and btrim(new.merged_into) = '' then
    raise exception 'Choose the category this suggestion is merged into';
  end if;
  new.reviewed_at := now(); new.reviewed_by := auth.uid();
  return new;
end
$sg$;
create trigger category_suggestion_guard before insert or update on public.category_suggestions
  for each row execute function hustle_private.category_suggestion_guard();
create trigger audit_category_suggestions after update on public.category_suggestions
  for each row execute function hustle_private.audit_change();

-- 4. Saving a service also stores subcategory, service model and tags.
create or replace function public.save_service_with_packages(p_service_id uuid, p_details jsonb, p_packages jsonb)
 returns uuid
 language plpgsql
 set search_path to ''
as $function$
declare
 v_user uuid := auth.uid();
 v_role text := public.beta_role();
 v_service uuid;
 v_status text;
 v_tier text;
 v_pkg jsonb;
 v_basic jsonb;
 v_seen text[] := '{}'::text[];
 v_features text[];
 v_title text;
 v_sub text := coalesce(p_details->>'subcategory','');
 v_type text := coalesce(nullif(p_details->>'service_type',''),'fixed');
 v_tags text[] := '{}'::text[];
begin
 if v_user is null or v_role is null then raise exception 'Beta access required';end if;
 if not exists(select 1 from public.profiles p where p.id=v_user and p.is_seller) then
  raise exception 'Seller profile required';
 end if;
 if jsonb_typeof(p_details)<>'object' or jsonb_typeof(p_packages)<>'array'
    or jsonb_array_length(p_packages)<>3 then
  raise exception 'Basic, Standard, Premium are all required';
 end if;
 v_status:=p_details->>'status';
 if v_status not in ('draft','pending') or v_status is null then
  raise exception 'Service must be draft or pending review';
 end if;
 if jsonb_typeof(p_details->'tags')='array' then
  v_tags:=array(select distinct btrim(t) from jsonb_array_elements_text(p_details->'tags') t where char_length(btrim(t)) between 1 and 30);
 end if;
 for v_pkg in select value from jsonb_array_elements(p_packages) loop
  v_tier:=v_pkg->>'tier';
  if v_tier is null or v_tier not in ('Basic','Standard','Premium')
     or v_tier=any(v_seen) then
   raise exception 'Exactly one of each package tier is required';
  end if;
  v_seen:=array_append(v_seen,v_tier);
  v_features:=array(select jsonb_array_elements_text(v_pkg->'includes'));
  if cardinality(v_features) not between 1 and 12
     or exists(select 1 from unnest(v_features) f where length(trim(f)) not between 1 and 120) then
   raise exception 'Each tier requires 1–12 clear inclusions, max 120 characters each';
  end if;
  if char_length(trim(coalesce(v_pkg->>'name',''))) not between 2 and 60
     or char_length(coalesce(v_pkg->>'summary',''))>300 then
   raise exception 'Package name or summary is invalid';
  end if;
  if (v_pkg->>'price')::integer not between 1000 and 100000000
     or (v_pkg->>'delivery_days')::integer not between 1 and 365
     or (v_pkg->>'revisions')::integer not between 0 and 20 then
   raise exception 'Invalid package price, delivery or revision count';
  end if;
  if v_tier='Basic' then v_basic:=v_pkg;end if;
 end loop;
 if not ('Basic'=any(v_seen) and 'Standard'=any(v_seen) and 'Premium'=any(v_seen)) then
  raise exception 'Basic, Standard and Premium are all required';
 end if;
 if (select (pkg->>'price')::integer from jsonb_array_elements(p_packages) pkg where pkg->>'tier'='Basic') >
    (select (pkg->>'price')::integer from jsonb_array_elements(p_packages) pkg where pkg->>'tier'='Standard')
 or (select (pkg->>'price')::integer from jsonb_array_elements(p_packages) pkg where pkg->>'tier'='Standard') >
    (select (pkg->>'price')::integer from jsonb_array_elements(p_packages) pkg where pkg->>'tier'='Premium')
 then raise exception 'Prices must follow Basic ≤ Standard ≤ Premium';end if;
 if p_service_id is null then
  insert into public.services(seller_id,title,title_en,description,category,subcategory,service_type,tags,
     price,delivery_days,revisions,package_name,status)
   values(v_user,p_details->>'title',coalesce(p_details->>'title_en',''),
     p_details->>'description',p_details->>'category',v_sub,v_type,v_tags,
     (v_basic->>'price')::integer,(v_basic->>'delivery_days')::integer,
     (v_basic->>'revisions')::integer,'Basic',v_status)
   returning id into v_service;
 else
  if not exists(select 1 from public.services s where s.id=p_service_id
      and s.seller_id=v_user) then raise exception 'Service not owned by this seller';end if;
  update public.services
   set title=p_details->>'title',title_en=coalesce(p_details->>'title_en',''),
     description=p_details->>'description',category=p_details->>'category',
     subcategory=v_sub,service_type=v_type,tags=v_tags,
     price=(v_basic->>'price')::integer,delivery_days=(v_basic->>'delivery_days')::integer,
     revisions=(v_basic->>'revisions')::integer,package_name='Basic',status=v_status
   where id=p_service_id returning id into v_service;
  if v_service is null then raise exception 'Service update blocked';end if;
  delete from public.service_packages where service_id=v_service;
 end if;
 for v_pkg in select value from jsonb_array_elements(p_packages) loop
  v_features:=array(select jsonb_array_elements_text(v_pkg->'includes'));
  insert into public.service_packages(service_id,tier,name,summary,price,
      delivery_days,revisions,includes)
  values(v_service,v_pkg->>'tier',trim(v_pkg->>'name'),coalesce(v_pkg->>'summary',''),
    (v_pkg->>'price')::integer,(v_pkg->>'delivery_days')::integer,
    (v_pkg->>'revisions')::integer,v_features);
 end loop;
 return v_service;
end
$function$;

-- 5. Project requests accept the new category ids.
create or replace function public.create_project_request(p_title text, p_brief text, p_category text, p_audience text, p_budget_max integer default null::integer, p_preferred_days integer default null::integer)
 returns jsonb
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
 v_buyer uuid:=auth.uid();
 v_id uuid;
 v_count integer:=0;
begin
 if v_buyer is null or public.beta_role() is null
    or not exists(select 1 from public.profiles where id=v_buyer) then
  raise exception 'Approved beta buyer profile required';
 end if;
 if char_length(btrim(coalesce(p_title,''))) not between 8 and 120
    or char_length(btrim(coalesce(p_brief,''))) not between 20 and 2000
    or p_category not in ('ai','business','marketing','tech','finance','legal','research','creative','commerce','education','wellbeing')
    or p_audience not in ('personal','business')
    or (p_budget_max is not null and p_budget_max not between 1000 and 100000000)
    or (p_preferred_days is not null and p_preferred_days not between 1 and 365) then
  raise exception 'Invalid project details';
 end if;
 if (select count(*) from public.project_requests
     where buyer_id=v_buyer and created_at>now()-interval '24 hours')>=5 then
  raise exception 'Daily project request limit reached';
 end if;
 insert into public.project_requests(buyer_id,title,brief,category,audience,budget_max,preferred_days)
 values(v_buyer,btrim(p_title),btrim(p_brief),p_category,p_audience,p_budget_max,p_preferred_days)
 returning id into v_id;

 -- Up to five eligible opt-in, beta-approved real sellers with published work in
 -- the requested category. Do not expose other users' private signup details.
 with eligible as (
  select s.seller_id, max(s.updated_at) as latest
  from public.services s
  join public.profiles p on p.id=s.seller_id
  join auth.users u on u.id=p.id
  join public.beta_allowlist b on b.email=lower(u.email) and b.enabled=true
  where s.status='published'
    and s.category=p_category and s.seller_id<>v_buyer
    and p.is_seller=true and p.public_profile=true
    and p.accepting_projects=true
  group by s.seller_id
  order by latest desc,s.seller_id
  limit 5
 ), inserted as (
  insert into public.project_invitations(request_id,seller_id)
  select v_id,seller_id from eligible
  returning id
 )
 select count(*) into v_count from inserted;
 return jsonb_build_object('id',v_id,'invited',v_count,'status','open');
end;
$function$;

-- 6. The public catalog carries the new fields and hides regulated services
--    whose professional verification has been revoked.
create or replace function hustle_private.marketplace_catalog()
 returns jsonb
 language sql
 stable security definer
 set search_path to ''
as $function$
 select coalesce(jsonb_agg(row),'[]'::jsonb) from (
  select s.id,s.title,s.title_en,s.description,s.category,s.subcategory,s.service_type,s.tags,s.price,s.delivery_days,
   s.revisions,s.package_name,p.display_name,p.headline,p.slug,p.avatar_path,
   (select coalesce(jsonb_agg(jsonb_build_object(
       'tier',k.tier,'name',k.name,'summary',k.summary,'price',k.price,
       'delivery_days',k.delivery_days,'revisions',k.revisions,'includes',k.includes)
       order by case k.tier when 'Basic' then 1 when 'Standard' then 2 else 3 end),'[]'::jsonb)
    from public.service_packages k where k.service_id=s.id) as packages,
   (select i.object_path from public.portfolio_items i where i.seller_id=p.id order by i.created_at desc limit 1) as image_path,
   (select count(*)::integer from public.reviews r join public.orders o on o.id=r.order_id
     where r.seller_id=p.id and o.status='completed') as review_count,
   (select round(avg(r.rating)::numeric,2) from public.reviews r join public.orders o on o.id=r.order_id
     where r.seller_id=p.id and o.status='completed') as average_rating,
   (select count(*)::integer from public.orders o where o.seller_id=p.id and o.status='completed') as completed_orders
  from public.services s
   join public.profiles p on p.id=s.seller_id
   join auth.users u on u.id=p.id
   join public.beta_allowlist a on a.email=lower(u.email)
  where s.status='published' and p.is_seller and p.public_profile
   and p.slug is not null and a.enabled
   and (s.category not in ('legal','wellbeing') or exists (
     select 1 from public.professional_verifications v
     where v.seller_id=s.seller_id and v.category=s.category and v.status='verified'))
  order by s.created_at desc limit 200
 ) row
$function$;

commit;
