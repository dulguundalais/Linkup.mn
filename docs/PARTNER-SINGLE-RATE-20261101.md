# One partner rate (owner decision, 2026-11-01)

- Every qualifying partner gets the same **1%** simulated reward. The 2% "active partner" tier is paused.
- Partners are not shown the platform commission (10%); it stays in the Terms for buyers and sellers.
- Attribution window **30 days** and reward eligibility **12 months** are unchanged.

## How it is applied

The rates live in `public.business_rules` (one row, admin-editable, every change audited by the `audit_rules` trigger). The V53 reward trigger reads `partner_percent` for community partners and `active_partner_percent` for the paused growth tier, so the owner's decision is applied as a single audited data change on the hosted project — no migration file, which keeps the CI migration order intact:

```sql
update public.business_rules set active_partner_percent = partner_percent where id = true;
```

Restoring a separate active-partner rate later is the same one-row update by an admin.

## UI

- Homepage partner band: 1% · 30-day invite window · 12 months (no 10%).
- `/referrals/`: one reward card (1%), the 30-day window and the 12-month period; the member badge reads "Түнш".
- Information page and FAQ copy updated to the single rate.

## Admin changes show everywhere (owner, 2026-11-01)

The owner wants an admin change in **Админ → Тохиргоо → Бизнесийн дүрэм** to show
across the site at once (e.g. reward period 12 → 6 months).

- New migration `20261029090000_v67_public_partner_terms.sql`: a read-only
  `public.partner_terms()` function that returns only `partner_percent`,
  `attribution_days` and `reward_months`. Visitors who are not signed in can read
  these three numbers; the `business_rules` table itself stays closed and
  admin-only for updates. Its timestamp sits before the held revoke migration
  so the stabilization workflow order is unchanged.
- The homepage partner band and the partner page read the numbers through
  `lib/marketplace/partner-terms.ts`; the info page no longer hard-codes them.
- A changed reward period applies to new referrals; existing referrals keep the
  end date they were given (the `eligible_until` column is immutable by design).
