-- Reviewed candidate only: promote with Supabase CLI after history reconciliation.
-- CI applies this solely to its disposable database. Never auto-apply remotely.
-- Preserve all table/column CRUD grants and RLS; remove non-row operations only.
begin;
revoke truncate, references, trigger on all tables in schema public
 from public, anon, authenticated;
-- Covers future tables created by the migration owner; other creators must be
-- audited separately. Does not change privileges in auth/storage/private schemas.
alter default privileges in schema public revoke truncate, references, trigger
 on tables from public, anon, authenticated;
commit;
