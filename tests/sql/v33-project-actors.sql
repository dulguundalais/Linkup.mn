-- Synthetic V33 request -> invitation -> proposal -> award, with actor denials.
-- Run only in disposable CI. All fixtures are rolled back.
begin;
insert into auth.users(id,email,email_confirmed_at) values
 ('10000000-0000-4000-8000-000000000801','v33-buyer@example.test',now()),
 ('10000000-0000-4000-8000-000000000802','v33-seller@example.test',now()),
 ('10000000-0000-4000-8000-000000000803','v33-outsider@example.test',now()),
 ('10000000-0000-4000-8000-000000000804','v33-unverified@example.test',null);
insert into public.profiles(id,display_name,is_seller,public_profile,accepting_projects) values
 ('10000000-0000-4000-8000-000000000801','V33 Buyer',false,false,false),
 ('10000000-0000-4000-8000-000000000802','V33 Seller',true,true,true),
 ('10000000-0000-4000-8000-000000000803','V33 Outsider',false,false,false);
insert into public.services(id,seller_id,title,description,category,price,delivery_days,status) values
 ('20000000-0000-4000-8000-000000000801','10000000-0000-4000-8000-000000000802',
 'V33 technology service','A synthetic service for isolated project request verification.','tech',120000,5,'published');
insert into public.service_packages(service_id,tier,name,price,delivery_days,revisions,includes) values
 ('20000000-0000-4000-8000-000000000801','Basic','V33 Basic',120000,5,2,array['Test deliverable']);
create temp table v33_ids(k text primary key,id uuid) on commit drop;
grant select,insert on v33_ids to authenticated;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000801","email":"v33-buyer@example.test","role":"authenticated"}',true);
do $t$ declare result jsonb; begin
 result:=public.create_project_request('Technology setup request','Please implement a complete technology setup for our project.','tech','business',150000,7);
 if (result->>'invited')::integer<>1 then raise exception 'TEST FAIL: exactly one eligible seller';end if;
 insert into v33_ids values('request',(result->>'id')::uuid);
 insert into v33_ids select 'invitation',id from public.project_invitations;
 begin
  insert into public.project_requests(buyer_id,title,brief,audience,category) values(auth.uid(),'Direct request blocked','This direct write must be refused by table grants.','business','tech');
  raise exception 'TEST FAIL: direct request write bypassed RPC';
 exception when insufficient_privilege then null;end;
end $t$;
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000803","email":"v33-outsider@example.test","role":"authenticated"}',true);
do $t$ begin
 if exists(select 1 from public.project_requests) or exists(select 1 from public.project_invitations)
 or exists(select 1 from public.project_proposals) or exists(select 1 from public.seller_project_inbox())
 then raise exception 'TEST FAIL: outsider can read project data';end if;
 begin
  perform public.submit_project_proposal((select id from v33_ids where k='invitation'),'20000000-0000-4000-8000-000000000801','Basic','Outsider must not submit this proposal.');
  raise exception 'TEST FAIL: outsider submitted proposal';
 exception when raise_exception then if SQLERRM like 'TEST FAIL%' then raise;end if;end;
 begin
  perform public.cancel_project_request((select id from v33_ids where k='request'));
  raise exception 'TEST FAIL: outsider cancelled request';
 exception when raise_exception then if SQLERRM like 'TEST FAIL%' then raise;end if;end;
end $t$;
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000802","email":"v33-seller@example.test","role":"authenticated"}',true);
do $t$ declare proposal uuid;begin
 if (select count(*) from public.seller_project_inbox())<>1 then raise exception 'TEST FAIL: invited seller inbox';end if;
 proposal:=public.submit_project_proposal((select id from v33_ids where k='invitation'),'20000000-0000-4000-8000-000000000801','Basic','I will deliver the requested technology setup.');
 insert into v33_ids values('proposal',proposal);
end $t$;
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000803","email":"v33-outsider@example.test","role":"authenticated"}',true);
do $t$ begin
 begin
  perform public.award_project_proposal((select id from v33_ids where k='proposal'));
  raise exception 'TEST FAIL: outsider awarded proposal';
 exception when raise_exception then if SQLERRM like 'TEST FAIL%' then raise;end if;end;
 begin
  perform public.withdraw_project_proposal((select id from v33_ids where k='proposal'));
  raise exception 'TEST FAIL: outsider withdrew proposal';
 exception when raise_exception then if SQLERRM like 'TEST FAIL%' then raise;end if;end;
end $t$;
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000804","email":"v33-unverified@example.test","role":"authenticated"}',true);
do $t$ begin
 begin
  perform public.create_project_request('Unverified request','An unverified user must not dispatch this request.','tech','business',null,null);
  raise exception 'TEST FAIL: unverified dispatched request';
 exception when raise_exception then if SQLERRM like 'TEST FAIL%' then raise;end if;end;
end $t$;
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000801","email":"v33-buyer@example.test","role":"authenticated"}',true);
do $t$ declare v_order uuid;begin
 v_order:=public.award_project_proposal((select id from v33_ids where k='proposal'));
 if not exists(select 1 from public.orders where id=v_order and buyer_id=auth.uid()
  and seller_id='10000000-0000-4000-8000-000000000802' and quoted_price=120000 and package_name='Basic' and status='requested')
 then raise exception 'TEST FAIL: award order snapshot';end if;
 if not exists(select 1 from public.project_requests where id=(select id from v33_ids where k='request')
  and status='awarded' and public.project_requests.order_id=v_order)
 then raise exception 'TEST FAIL: awarded request linkage';end if;
 begin
  perform public.award_project_proposal((select id from v33_ids where k='proposal'));
  raise exception 'TEST FAIL: duplicate award accepted';
 exception when raise_exception then if SQLERRM like 'TEST FAIL%' then raise;end if;end;
 if (select count(*) from public.orders)<>1 then raise exception 'TEST FAIL: duplicate order';end if;
end $t$;
set local role anon;
do $t$ begin
 begin
  perform public.seller_project_inbox();
  raise exception 'TEST FAIL: anonymous RPC execution';
 exception when insufficient_privilege then null;end;
end $t$;
rollback;
select 'PASS: V33 request/proposal/award and actor denials, fixtures rolled back' as verification;
