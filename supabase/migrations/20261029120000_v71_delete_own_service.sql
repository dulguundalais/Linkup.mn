-- V71 (owner, 2026-11-02): a seller can delete their own service — published,
-- pending, draft or rejected.
-- A service with no orders, reviews or project proposals is removed for good
-- (its packages and saves go with it). One that is part of someone's order
-- history is archived instead: hidden from the catalogue and from the seller's
-- list, but kept so past orders and reviews stay intact.
create function hustle_private.v71_delete_own_service(p_service uuid)
 returns text language plpgsql security definer set search_path='' as $$
declare v_uid uuid:=auth.uid();v_owner uuid;
begin
 if v_uid is null then raise exception 'Authentication required';end if;
 select seller_id into v_owner from public.services where id=p_service for update;
 if v_owner is null or v_owner<>v_uid then raise exception 'Service not found';end if;
 if exists(select 1 from public.orders where service_id=p_service)
  or exists(select 1 from public.reviews where service_id=p_service)
  or exists(select 1 from public.project_proposals where service_id=p_service) then
  update public.services set status='archived',updated_at=now() where id=p_service;
  insert into public.audit_events(actor_id,entity,record_id,action) values(v_uid,'services',p_service::text,'ARCHIVE_BY_SELLER');
  return 'archived';
 end if;
 delete from public.services where id=p_service;
 insert into public.audit_events(actor_id,entity,record_id,action) values(v_uid,'services',p_service::text,'DELETE_BY_SELLER');
 return 'deleted';
end $$;
revoke all on function hustle_private.v71_delete_own_service(uuid) from public,anon;
grant execute on function hustle_private.v71_delete_own_service(uuid) to authenticated;
create function public.delete_own_service(p_service uuid)
 returns text language sql security invoker set search_path='' as $$
 select hustle_private.v71_delete_own_service(p_service)
$$;
revoke all on function public.delete_own_service(uuid) from public,anon;
grant execute on function public.delete_own_service(uuid) to authenticated;
