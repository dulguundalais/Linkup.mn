-- Verify effective per-column privileges, not just table-level GRANT.
-- Functional RLS assertions also run in the V47/V50/V52 actor fixtures.
begin;
do $test$
declare t record;
begin
 for t in select * from (values
  ('message_reports','reporter_id','INSERT'),
  ('message_reports','reported_id','INSERT'),
  ('message_reports','message_id','INSERT'),
  ('message_reports','reason','INSERT'),
  ('message_reports','details','INSERT'),
  ('message_reports','status','UPDATE'),
  ('message_reports','admin_note','UPDATE'),
  ('category_suggestions','seller_id','INSERT'),
  ('category_suggestions','parent_category','INSERT'),
  ('category_suggestions','name_mn','INSERT'),
  ('category_suggestions','name_en','INSERT'),
  ('category_suggestions','note','INSERT'),
  ('category_suggestions','status','UPDATE'),
  ('category_suggestions','merged_into','UPDATE'),
  ('category_suggestions','admin_note','UPDATE'),
  ('professional_verifications','seller_id','INSERT'),
  ('professional_verifications','category','INSERT'),
  ('professional_verifications','status','INSERT'),
  ('professional_verifications','credential_note','INSERT'),
  ('professional_verifications','status','UPDATE'),
  ('professional_verifications','credential_note','UPDATE')
 ) x(tbl,col,priv) loop
  if not has_column_privilege('authenticated','public.'||t.tbl,t.col,t.priv)
  then raise exception 'Missing allowed column privilege: %.% %',t.tbl,t.col,t.priv; end if;
 end loop;
 for t in select * from (values
  ('message_reports','reporter_id'),('message_reports','reported_id'),
  ('message_reports','reviewed_by'),('category_suggestions','seller_id'),
  ('category_suggestions','reviewed_by'),('professional_verifications','verified_by')
 ) x(tbl,col) loop
  if has_column_privilege('authenticated','public.'||t.tbl,t.col,'UPDATE')
  then raise exception 'Protected column writable: %.%',t.tbl,t.col; end if;
 end loop;
end $test$;
select 'column privilege boundaries: PASS';
rollback;
