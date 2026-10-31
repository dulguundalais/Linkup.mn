-- V34 synthetic actor test. ALL fixture writes are rolled back.
begin;
insert into auth.users(id,email,email_confirmed_at) values
 ('10000000-0000-4000-8000-000000000351','v34-buyer@example.test',now()),
 ('10000000-0000-4000-8000-000000000352','v34-seller@example.test',now()),
 ('10000000-0000-4000-8000-000000000353','v34-outsider@example.test',now()),
 ('10000000-0000-4000-8000-000000000354','v34-unapproved@example.test',null);
insert into public.beta_allowlist(email,role,enabled) values
 ('v34-buyer@example.test','member',true),
 ('v34-seller@example.test','member',true),
 ('v34-outsider@example.test','member',true) on conflict(email) do update set role=excluded.role,enabled=excluded.enabled;
insert into public.profiles(id,display_name,is_seller,public_profile,accepting_projects) values
 ('10000000-0000-4000-8000-000000000351','V34 Test Buyer',false,false,false),
 ('10000000-0000-4000-8000-000000000352','V34 Test Seller',true,true,true),
 ('10000000-0000-4000-8000-000000000353','V34 Test Outsider',false,false,false);
insert into public.services(id,seller_id,title,description,category,price,delivery_days,status)
values('20000000-0000-4000-8000-000000000351','10000000-0000-4000-8000-000000000352',
'V34 test published seller service','Synthetic published service for isolated V34 actor test','tech',150000,7,'published');
insert into public.project_requests(id,buyer_id,title,brief,audience,category,status)
values('30000000-0000-4000-8000-000000000351','10000000-0000-4000-8000-000000000351',
'V34 buyer test request','V34 synthetic request for safe recipient RLS testing only','business','tech','open');
insert into public.project_invitations(id,request_id,seller_id)
values('40000000-0000-4000-8000-000000000351','30000000-0000-4000-8000-000000000351','10000000-0000-4000-8000-000000000352');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000352","email":"v34-seller@example.test","role":"authenticated"}',true);
do $check$ declare n int; begin
 select count(*) into n from public.project_notifications where request_id='30000000-0000-4000-8000-000000000351';
 if n<>1 then raise exception 'V34 SELLER must see own invitation';end if;
 update public.project_notifications set read_at=now() where kind='invitation' and request_id='30000000-0000-4000-8000-000000000351';
 get diagnostics n=row_count;
 if n<>1 then raise exception 'V34 SELLER unable to mark notification read';end if;
 begin
  insert into public.project_notifications(recipient_id,request_id,kind,source_id)
  values('10000000-0000-4000-8000-000000000352','30000000-0000-4000-8000-000000000351','proposal',gen_random_uuid());
  raise exception 'V34 FAIL: client INSERT allowed';
 exception when insufficient_privilege then null;
 when raise_exception then if sqlerrm='V34 FAIL: client INSERT allowed' then raise;end if;
 end;
end $check$;
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000353","email":"v34-outsider@example.test","role":"authenticated"}',true);
do $check$ declare n int;begin
 select count(*) into n from public.project_notifications where request_id='30000000-0000-4000-8000-000000000351';
 if n<>0 then raise exception 'V34 OUTSIDER can view private notifications';end if;
 update public.project_notifications set read_at=now() where request_id='30000000-0000-4000-8000-000000000351';
 get diagnostics n=row_count;
 if n<>0 then raise exception 'V34 OUTSIDER changed read status';end if;
end $check$;
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000354","email":"v34-unapproved@example.test","role":"authenticated"}',true);
do $check$ declare n int;begin
 select count(*) into n from public.project_notifications where request_id='30000000-0000-4000-8000-000000000351';
 if n<>0 then raise exception 'V34 NONAPPROVED read private notification';end if;
end $check$;
reset role;
insert into public.project_proposals(id,request_id,seller_id,service_id,tier,quoted_price,delivery_days,message)
values('50000000-0000-4000-8000-000000000351','30000000-0000-4000-8000-000000000351','10000000-0000-4000-8000-000000000352','20000000-0000-4000-8000-000000000351','Basic',150000,7,'V34 synthetic qualified proposal testing');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000351","email":"v34-buyer@example.test","role":"authenticated"}',true);
do $check$ declare n int;begin
 select count(*) into n from public.project_notifications where request_id='30000000-0000-4000-8000-000000000351';
 if n<>1 then raise exception 'V34 BUYER must see only proposal notification';end if;
end $check$;
reset role;
update public.project_proposals set status='accepted' where id='50000000-0000-4000-8000-000000000351';
update public.project_requests set status='cancelled' where id='30000000-0000-4000-8000-000000000351';
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000352","email":"v34-seller@example.test","role":"authenticated"}',true);
do $check$ declare n int;begin
 select count(*) into n from public.project_notifications where request_id='30000000-0000-4000-8000-000000000351';
 if n<>3 then raise exception 'V34 SELLER must see invitation, award and cancellation';end if;
end $check$;
rollback;
select 'PASS: V34 buyer/seller/outsider/non-approved actor test; 4 events; all fixtures rolled back' as verification;
