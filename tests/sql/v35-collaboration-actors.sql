-- V35 synthetic-only integration QA: no persistent writes or real account data.
begin;
insert into auth.users(id,email,email_confirmed_at) values
 ('10000000-0000-4000-8000-000000000451','v35-buyer@example.test',now()),
 ('10000000-0000-4000-8000-000000000452','v35-seller@example.test',now()),
 ('10000000-0000-4000-8000-000000000453','v35-outsider@example.test',now()),
 ('10000000-0000-4000-8000-000000000454','v35-pending@example.test',null);
insert into public.beta_allowlist(email,role,enabled) values
 ('v35-buyer@example.test','member',true),('v35-seller@example.test','member',true),
 ('v35-outsider@example.test','member',true) on conflict(email) do update set role=excluded.role,enabled=excluded.enabled;
insert into public.profiles(id,display_name,is_seller,public_profile,accepting_projects) values
 ('10000000-0000-4000-8000-000000000451','V35 Buyer',false,false,false),
 ('10000000-0000-4000-8000-000000000452','V35 Seller',true,true,true),
 ('10000000-0000-4000-8000-000000000453','V35 Outsider',false,false,false);
insert into public.services(id,seller_id,title,description,category,price,delivery_days,status) values
 ('20000000-0000-4000-8000-000000000451','10000000-0000-4000-8000-000000000452',
 'V35 demo collaboration service','Testing safe order workflow for beta users only','tech',120000,5,'published');
insert into public.service_packages(service_id,tier,name,price,delivery_days,revisions,includes) values
 ('20000000-0000-4000-8000-000000000451','Basic','V35 Basic',120000,5,2,array['V35 QA']);
insert into public.project_requests(id,buyer_id,title,brief,audience,category,status) values
 ('30000000-0000-4000-8000-000000000451','10000000-0000-4000-8000-000000000451',
 'V35 request QA','This is the synthetic project brief for verifying proposals.','business','tech','open');
insert into public.project_invitations(id,request_id,seller_id,status) values
 ('40000000-0000-4000-8000-000000000451','30000000-0000-4000-8000-000000000451','10000000-0000-4000-8000-000000000452','proposed');
insert into public.project_proposals(id,request_id,seller_id,service_id,tier,quoted_price,delivery_days,message,status) values
 ('50000000-0000-4000-8000-000000000451','30000000-0000-4000-8000-000000000451',
 '10000000-0000-4000-8000-000000000452','20000000-0000-4000-8000-000000000451',
 'Basic',120000,5,'V35 synthetic proposal for permission checks only','pending');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000451","email":"v35-buyer@example.test","role":"authenticated"}',true);
insert into public.orders(id,service_id,buyer_id,seller_id,service_title,quoted_price,brief,package_name)
values('60000000-0000-4000-8000-000000000451','20000000-0000-4000-8000-000000000451',
 '10000000-0000-4000-8000-000000000451','10000000-0000-4000-8000-000000000452',
 'V35 demo collaboration service',120000,'Synthetic buyer order with package for collaboration test','Basic');
do $v35$ declare n int;begin
 select count(*) into n from public.order_notifications where order_id='60000000-0000-4000-8000-000000000451';
 if n<>0 then raise exception 'V35 buyer must not see seller new-order notification';end if;
 begin
  perform public.withdraw_project_proposal('50000000-0000-4000-8000-000000000451');
  raise exception 'V35 unauthorized buyer withdrawal';
 exception when raise_exception then
  if sqlerrm='V35 unauthorized buyer withdrawal' then raise;end if;
 end;
end $v35$;
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000452","email":"v35-seller@example.test","role":"authenticated"}',true);
do $v35$ declare n int;begin
 select count(*) into n from public.order_notifications where order_id='60000000-0000-4000-8000-000000000451' and kind='requested';
 if n<>1 then raise exception 'V35 seller new order missing';end if;
end $v35$;
update public.orders set status='accepted' where id='60000000-0000-4000-8000-000000000451';
select public.withdraw_project_proposal('50000000-0000-4000-8000-000000000451');
do $v35$ begin
 if not exists(select 1 from public.project_proposals where id='50000000-0000-4000-8000-000000000451' and status='withdrawn') then raise exception 'V35 seller cannot withdraw own proposal';end if;
 if not exists(select 1 from public.project_invitations where id='40000000-0000-4000-8000-000000000451' and status='invited') then raise exception 'V35 invitation not reset';end if;
end $v35$;
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000451","email":"v35-buyer@example.test","role":"authenticated"}',true);
do $v35$ declare n int;begin
 select count(*) into n from public.order_notifications where order_id='60000000-0000-4000-8000-000000000451' and kind='accepted';
 if n<>1 then raise exception 'V35 buyer did not get acceptance notice';end if;
end $v35$;
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000453","email":"v35-outsider@example.test","role":"authenticated"}',true);
do $v35$ declare n int;begin
 select count(*) into n from public.order_notifications where order_id='60000000-0000-4000-8000-000000000451';
 if n<>0 then raise exception 'V35 outsider read participant order notifications';end if;
 update public.order_notifications set read_at=now() where order_id='60000000-0000-4000-8000-000000000451';
 get diagnostics n=row_count;
 if n<>0 then raise exception 'V35 outsider modified participant notice';end if;
end $v35$;
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000454","email":"v35-pending@example.test","role":"authenticated"}',true);
do $v35$ declare n int;begin
 select count(*) into n from public.order_notifications where order_id='60000000-0000-4000-8000-000000000451';
 if n<>0 then raise exception 'V35 nonapproved read participant notice';end if;
end $v35$;
rollback;
select 'PASS: V35 buyer/seller/outsider/unapproved RLS, withdraw and order notifications — synthetic fixtures rolled back' as verification;
