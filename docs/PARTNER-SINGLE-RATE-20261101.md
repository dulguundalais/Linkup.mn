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
