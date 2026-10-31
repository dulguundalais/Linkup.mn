-- Disposable PostgreSQL only. Not a Supabase migration.
-- Minimal Auth/Storage SQL contracts, not their HTTP services or production data.
do $$ begin
 if exists(select 1 from pg_namespace where nspname in ('auth','storage','hustle_private'))
 then raise exception 'Refusing bootstrap: database is not empty'; end if;
end $$;
create role anon nologin;
create role authenticated nologin;
create schema auth;
create schema storage;
grant usage on schema public,auth,storage to anon,authenticated;
create function auth.jwt() returns jsonb language sql stable as
$$ select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
create function auth.uid() returns uuid language sql stable as
$$ select nullif(auth.jwt()->>'sub','')::uuid $$;
create table auth.users(
 id uuid primary key, email text unique, created_at timestamptz not null default now(),
 email_confirmed_at timestamptz, banned_until timestamptz,
 is_anonymous boolean not null default false
);
create table storage.buckets(
 id text primary key, name text not null, public boolean not null default false,
 file_size_limit bigint, allowed_mime_types text[]
);
create table storage.objects(
 id uuid primary key default gen_random_uuid(),
 bucket_id text references storage.buckets(id), name text not null,
 owner_id text, metadata jsonb, created_at timestamptz default now(),
 unique(bucket_id,name)
);
alter table storage.objects enable row level security;
grant select,insert,update,delete on storage.objects to authenticated;
grant select on storage.objects to anon;
create function storage.foldername(name text) returns text[] language sql immutable as
$$ select (string_to_array(name,'/'))[1:array_length(string_to_array(name,'/'),1)-1] $$;
