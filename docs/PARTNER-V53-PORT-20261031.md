# V53 Partner Program on the Linkup branch (2026-10-31)

Ports draft PR #70 (`feature/partner-self-service-v53-20261028`, 36f0019, based on old `main`) onto the Linkup brand branch (#82, which includes the #72–#79 stabilization work). The partner pages, enrollment, referral capture, simulated rewards and admin management are unchanged in behaviour.

## Reconciled
- `app/layout.tsx`, `app/referrals/page.tsx`: Linkup titles kept; Partner referral capture and Partner page added.
- Dropped the V53 script that forced dark mode only on the old `feature-partner-self-service` preview hostname; visitors keep their own theme. Its test now checks that the layout leaves the theme alone.
- Partner copy and the default name for referred accounts: Hustle → Linkup (`Linkup member`). The V53 migration is still staged and unapplied, so editing it is safe.
- `tests/v53-claude-design-preservation.mjs`: hashes for signature-home, site-header and premium-footer re-pinned to the owner-approved Linkup rebrand.
- `qa/staging/auth.spec.mjs`: V53 closes direct `partner_codes` writes for every role, so the real-service test now enrolls through `enroll_community_partner` and checks a buyer still cannot list codes.

## Supersedes draft PR #80 (audit B04)
V53 already makes codes owner/admin-only (`codes_read_own`), removes direct referral inserts and claims through a server function. `tests/sql/v53-partner-privacy-actors.sql` carries #80's checks over to the V53 API on the full migration chain (added to `stabilization-postgres.yml`): owner/admin visibility, member and unrelated denial, unknown/malformed/null/suspended codes, self-referral, single claim, server-owned attributes, attribution window, unverified and anonymous denial, closed direct writes.

Local evidence (PostgreSQL 16; CI uses 17.6): full replay of all migrations, the nine stabilization SQL suites and the new V53 privacy suite pass; V33 comparison MATCH (133). V53's own isolated suite passes. Unit tests pass.

## Not done
The V53 migration is not applied to any hosted database. Apply only with the target-specific migration plan after review.
