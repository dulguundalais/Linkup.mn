-- Generated with Supabase CLI 2.122.0. Review-only; no remote push/apply.
-- Public API roles need row-level CRUD, never whole-table operations.
-- Preserve existing table/column CRUD grants, policies and private schemas.
begin;
revoke truncate, references, trigger on all tables in schema public
 from public, anon, authenticated;
-- Future tables owned by this migration's executor. Other creators' defaults
-- must be reviewed separately before deployment. No credentials are required.
alter default privileges in schema public revoke truncate, references, trigger
 on tables from public, anon, authenticated;
commit;
