-- V67 (owner, 2026-11-01): the partner terms an admin saves in Business rules are
-- shown everywhere at once, also to visitors who are not signed in.
-- Exposes only the three public partner numbers; the table itself stays closed
-- (no anon grant, admin-only update policy unchanged).
create function public.partner_terms()
 returns table(partner_percent numeric, attribution_days integer, reward_months integer)
 language sql stable security definer set search_path='' as $$
 select r.partner_percent, r.attribution_days, r.reward_months
 from public.business_rules r where r.id=true
$$;
revoke all on function public.partner_terms() from public;
grant execute on function public.partner_terms() to anon, authenticated;
