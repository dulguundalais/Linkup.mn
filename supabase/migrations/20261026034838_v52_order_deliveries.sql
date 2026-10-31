-- V52: order delivery history and private delivery files.
-- * order_events keeps every delivery and revision request (orders.delivery_note and
--   orders.revision_note only hold the latest one). Written only by a trigger.
-- * order_files are deliverables uploaded by the order's freelancer while the order is
--   in progress, stored in the private 'order-files' bucket. Only the buyer, the
--   seller and admins of that order can see them. No payments are involved.
-- Rollback (keeps orders untouched):
--   drop trigger if exists v52_order_event on public.orders;
--   drop function if exists hustle_private.v52_order_event();
--   drop table if exists public.order_files; drop table if exists public.order_events;
--   drop policy if exists order_file_upload on storage.objects; (and order_file_read, order_file_remove)
--   delete from storage.buckets where id='order-files';  -- only after removing its objects
begin;

create table if not exists public.order_events(
 id uuid primary key default gen_random_uuid(),
 order_id uuid not null references public.orders(id) on delete cascade,
 actor_id uuid not null references public.profiles(id),
 kind text not null check(kind in ('delivered','revision_requested')),
 round integer not null check(round between 0 and 50),
 note text not null default '' check(char_length(note)<=5000),
 created_at timestamptz not null default now()
);
create index if not exists order_events_order_idx on public.order_events(order_id,created_at);
alter table public.order_events enable row level security;
revoke all on public.order_events from anon,authenticated;
grant select on public.order_events to authenticated;
create policy order_events_read on public.order_events for select to authenticated using(
 (select public.beta_role()) is not null and exists(
  select 1 from public.orders o where o.id=order_id
  and (o.buyer_id=(select auth.uid()) or o.seller_id=(select auth.uid()) or (select public.beta_role())='admin')));

-- History is appended by the order itself, never by clients.
create or replace function hustle_private.v52_order_event() returns trigger
 language plpgsql security definer set search_path='' as $$
begin
 if new.status='delivered' and old.status is distinct from 'delivered' then
  insert into public.order_events(order_id,actor_id,kind,round,note)
  values(new.id,new.seller_id,'delivered',new.revisions_used,new.delivery_note);
 elsif old.status='delivered' and new.status='in_progress' then
  insert into public.order_events(order_id,actor_id,kind,round,note)
  values(new.id,new.buyer_id,'revision_requested',new.revisions_used,new.revision_note);
 end if;
 return new;
end $$;
revoke all on function hustle_private.v52_order_event() from public,anon,authenticated;
drop trigger if exists v52_order_event on public.orders;
create trigger v52_order_event after update of status on public.orders
 for each row execute function hustle_private.v52_order_event();

-- Keep what existing orders already contain as their first history entries.
insert into public.order_events(order_id,actor_id,kind,round,note,created_at)
select o.id,o.seller_id,'delivered',o.revisions_used,o.delivery_note,o.updated_at
from public.orders o where o.delivery_note<>''
 and not exists(select 1 from public.order_events e where e.order_id=o.id);
insert into public.order_events(order_id,actor_id,kind,round,note,created_at)
select o.id,o.buyer_id,'revision_requested',o.revisions_used,o.revision_note,o.updated_at
from public.orders o where o.revision_note<>''
 and not exists(select 1 from public.order_events e where e.order_id=o.id and e.kind='revision_requested');

-- Deliverable files ------------------------------------------------------------
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('order-files','order-files',false,26214400,array[
 'image/jpeg','image/png','image/webp','image/gif','application/pdf','application/zip','application/x-zip-compressed',
 'text/plain','video/mp4',
 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
 'application/vnd.openxmlformats-officedocument.presentationml.presentation'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

-- Objects live at <order_id>/<random>.<ext>. Only the order's freelancer may add or
-- remove them, and only while the work is in progress.
create policy order_file_upload on storage.objects for insert to authenticated with check(
 bucket_id='order-files' and public.beta_role() is not null and exists(
  select 1 from public.orders o where o.id::text=(storage.foldername(name))[1]
  and o.seller_id=auth.uid() and o.status='in_progress'));
create policy order_file_read on storage.objects for select to authenticated using(
 bucket_id='order-files' and public.beta_role() is not null and exists(
  select 1 from public.orders o where o.id::text=(storage.foldername(name))[1]
  and (o.buyer_id=auth.uid() or o.seller_id=auth.uid() or public.beta_role()='admin')));
create policy order_file_remove on storage.objects for delete to authenticated using(
 bucket_id='order-files' and owner_id=auth.uid()::text and exists(
  select 1 from public.orders o where o.id::text=(storage.foldername(name))[1]
  and o.seller_id=auth.uid() and o.status='in_progress'));

create table if not exists public.order_files(
 id uuid primary key default gen_random_uuid(),
 order_id uuid not null references public.orders(id) on delete cascade,
 uploader_id uuid not null references public.profiles(id),
 round integer not null default 0 check(round between 0 and 50),
 object_path text not null unique check(char_length(object_path) between 40 and 300),
 file_name text not null check(char_length(file_name) between 1 and 180),
 content_type text not null check(char_length(content_type) between 3 and 120),
 byte_size integer not null check(byte_size between 1 and 26214400),
 created_at timestamptz not null default now()
);
create index if not exists order_files_order_idx on public.order_files(order_id,round);
alter table public.order_files enable row level security;
revoke all on public.order_files from anon,authenticated;
grant select,insert,delete on public.order_files to authenticated;
create policy order_files_read on public.order_files for select to authenticated using(
 (select public.beta_role()) is not null and exists(
  select 1 from public.orders o where o.id=order_id
  and (o.buyer_id=(select auth.uid()) or o.seller_id=(select auth.uid()) or (select public.beta_role())='admin')));
create policy order_files_add on public.order_files for insert to authenticated with check(
 (select public.beta_role()) is not null and uploader_id=(select auth.uid()));
create policy order_files_remove on public.order_files for delete to authenticated using(
 uploader_id=(select auth.uid()) and exists(
  select 1 from public.orders o where o.id=order_id and o.seller_id=(select auth.uid()) and o.status='in_progress'
  and o.revisions_used=round));

-- The row must describe a file this freelancer really uploaded for this order, in the
-- current delivery round; the server fills the round and uploader itself.
create or replace function hustle_private.v52_order_file_guard() returns trigger
 language plpgsql security definer set search_path='' as $$
declare o public.orders;
begin
 if auth.uid() is null or public.beta_role() is null then raise exception 'Beta access required';end if;
 select * into o from public.orders where id=new.order_id;
 if not found or o.seller_id<>auth.uid() then raise exception 'Only seller may edit delivery';end if;
 if o.status<>'in_progress' then raise exception 'Files can be added only while work is in progress';end if;
 if split_part(new.object_path,'/',1)<>o.id::text then raise exception 'File is not part of this order';end if;
 if not exists(select 1 from storage.objects s where s.bucket_id='order-files' and s.name=new.object_path and s.owner_id=auth.uid()::text)
 then raise exception 'File is not part of this order';end if;
 if (select count(*) from public.order_files f where f.order_id=o.id and f.round=o.revisions_used)>=10
 then raise exception 'Up to 10 files per delivery';end if;
 new.uploader_id=auth.uid();new.round=o.revisions_used;new.created_at=now();
 return new;
end $$;
revoke all on function hustle_private.v52_order_file_guard() from public,anon,authenticated;
drop trigger if exists v52_order_file_guard on public.order_files;
create trigger v52_order_file_guard before insert on public.order_files
 for each row execute function hustle_private.v52_order_file_guard();

commit;
