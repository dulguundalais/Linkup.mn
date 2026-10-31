-- Read-only application schema evidence. No user rows, secrets, or history writes.
-- Scope: V33 objects as they exist after the V34/V35/V50 follow-up migrations.
with targets as (
 select c.oid,c.relname,c.relrowsecurity,c.relforcerowsecurity
 from pg_class c join pg_namespace n on n.oid=c.relnamespace
 where n.nspname='public' and c.relkind='r'
 and c.relname in ('project_requests','project_invitations','project_proposals')
), entries as (
 select 'table:'||relname key,
 jsonb_build_object('rls',relrowsecurity,'force_rls',relforcerowsecurity) value from targets
 union all
 select 'column:'||c.relname||'.'||a.attname,
 jsonb_build_object('type',format_type(a.atttypid,a.atttypmod),'not_null',a.attnotnull,
 'default',pg_get_expr(d.adbin,d.adrelid),'identity',a.attidentity,'generated',a.attgenerated)
 from pg_attribute a join pg_class c on c.oid=a.attrelid
 join pg_namespace n on n.oid=c.relnamespace
 left join pg_attrdef d on d.adrelid=a.attrelid and d.adnum=a.attnum
 where n.nspname='public' and a.attnum>0 and not a.attisdropped
 and (c.oid in(select oid from targets) or (c.relname='profiles' and a.attname='accepting_projects'))
 union all
 select 'constraint:'||t.relname||'.'||c.conname,
 jsonb_build_object('definition',pg_get_constraintdef(c.oid,true),'validated',c.convalidated)
 from pg_constraint c join targets t on t.oid=c.conrelid
 union all
 select 'index:'||t.relname||'.'||ci.relname,
 jsonb_build_object('definition',pg_get_indexdef(i.indexrelid),'valid',i.indisvalid,'ready',i.indisready)
 from pg_index i join targets t on t.oid=i.indrelid join pg_class ci on ci.oid=i.indexrelid
 union all
 select 'policy:'||p.tablename||'.'||p.policyname,
 jsonb_build_object('roles',p.roles,'command',p.cmd,'permissive',p.permissive,'using',p.qual,'check',p.with_check)
 from pg_policies p where p.schemaname='public' and p.tablename in(select relname from targets)
 union all
 select 'trigger:'||t.relname||'.'||g.tgname,
 jsonb_build_object('definition',pg_get_triggerdef(g.oid,true),'enabled',g.tgenabled)
 from pg_trigger g join targets t on t.oid=g.tgrelid where not g.tgisinternal
 union all
 select 'grant:'||t.relname||'.'||r.role_name||'.'||p.priv,
 to_jsonb(has_table_privilege(r.role_name,t.oid,p.priv))
 from targets t cross join (values('anon'),('authenticated')) r(role_name)
 cross join (values('SELECT'),('INSERT'),('UPDATE'),('DELETE'),('TRUNCATE'),('REFERENCES'),('TRIGGER')) p(priv)
 union all
 select 'column-grants:'||t.relname||'.'||r.role_name,
 jsonb_build_object(
 'select',coalesce((select jsonb_agg(a.attname order by a.attnum) from pg_attribute a where a.attrelid=t.oid and a.attnum>0 and not a.attisdropped and has_column_privilege(r.role_name,t.oid,a.attnum,'SELECT')),'[]'::jsonb),
 'insert',coalesce((select jsonb_agg(a.attname order by a.attnum) from pg_attribute a where a.attrelid=t.oid and a.attnum>0 and not a.attisdropped and has_column_privilege(r.role_name,t.oid,a.attnum,'INSERT')),'[]'::jsonb),
 'update',coalesce((select jsonb_agg(a.attname order by a.attnum) from pg_attribute a where a.attrelid=t.oid and a.attnum>0 and not a.attisdropped and has_column_privilege(r.role_name,t.oid,a.attnum,'UPDATE')),'[]'::jsonb),
 'references',coalesce((select jsonb_agg(a.attname order by a.attnum) from pg_attribute a where a.attrelid=t.oid and a.attnum>0 and not a.attisdropped and has_column_privilege(r.role_name,t.oid,a.attnum,'REFERENCES')),'[]'::jsonb))
 from targets t cross join (values('anon'),('authenticated'))r(role_name)
 union all
 select 'function:'||n.nspname||'.'||p.proname||'('||pg_get_function_identity_arguments(p.oid)||')',
 jsonb_build_object(
 'definition_md5',md5(regexp_replace(pg_get_functiondef(p.oid),E'\\s+',' ','g')),
 'body',p.prosrc,'arguments',pg_get_function_arguments(p.oid),'returns',pg_get_function_result(p.oid),
 'language',l.lanname,'volatility',p.provolatile,'parallel',p.proparallel,
 'strict',p.proisstrict,'leakproof',p.proleakproof,'kind',p.prokind,
 'cost',p.procost,'rows',p.prorows,'support',p.prosupport::regproc::text,
 'security_definer',p.prosecdef,'config',p.proconfig,
 'anon_execute',has_function_privilege('anon',p.oid,'EXECUTE'),
 'authenticated_execute',has_function_privilege('authenticated',p.oid,'EXECUTE'))
 from pg_proc p join pg_namespace n on n.oid=p.pronamespace join pg_language l on l.oid=p.prolang
 where (n.nspname='public' and p.proname in (
 'create_project_request','seller_project_inbox','submit_project_proposal',
 'decline_project_invitation','award_project_proposal','cancel_project_request','withdraw_project_proposal'))
 or p.oid in (select g.tgfoid from pg_trigger g join targets t on t.oid=g.tgrelid where not g.tgisinternal)
)
select jsonb_object_agg(key,value order by key) as schema_evidence from entries;
