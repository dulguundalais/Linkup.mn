# Hustle V53 — Partner Backend Security Audit (2026-10-28)

**Scope:** PR #70, feature/partner-self-service-v53-20261028; enrollment, referral codes, attribution, 1%/2% beta commission, RLS and admin rights.

**Environment safety:** Only the GitHub feature branch changed. No original Hustle Supabase schema or data was changed, no merge to main, and the separate HUSTLE-COLLAB database was not used.

## Findings

| Severity | Finding | Remediation | Status |
|---|---|---|---|
| HIGH | Original Supabase authenticated grants on partner_codes, referrals and business_rules include TRUNCATE, DELETE and other excessive rights. TRUNCATE bypasses RLS. | Revoke all grants from PUBLIC, anon and authenticated, then grant only the needed operations. | Fixed in V53 SQL, NOT applied to live Supabase. |
| HIGH | Previous codes_read policy lets any beta member SELECT other partners' codes. | Replace with owner-or-admin RLS. | Fixed in staged migration. |
| HIGH | Legacy dashboard directly INSERTs code and referral rows. | Replace old Partner panel with navigation to secured self-service route. | Fixed in PR. |
| MEDIUM | Client-side referral fallback exposed email prefix in generated profile names. | Use generic Hustle member name. | Fixed in PR. |
| LOW | MNT simulations used fractional cents. | Round estimates to whole MNT. | Fixed in PR. |
| HIGH before payouts | Attribution accepts a browser-supplied known code without server proof of actual click. Public code is not a secret. | Require server-stamped attribution, anti-fraud controls and payment settlement evidence before any actual payouts. | OPEN; no real payouts. |
| MEDIUM | Referral code stored in localStorage before explicit Partner-tracking consent; privacy/cookie terms are draft. | Review consent, retention and user controls before launch. | OPEN. |
| MEDIUM | Enrollment and claim RPCs have no custom per-user throttling. | Add edge rate limits and abuse monitoring before broad launch. | OPEN. |
| HIGH outside V53 | Read-only metadata indicates excessive TRUNCATE rights on additional legacy tables such as orders and profiles. | Separate tested marketplace-wide grant hardening (avoid disrupting Buyer/Seller). | OPEN. |
| Existing warnings | Supabase advisor lists 9 authenticated-callable public SECURITY DEFINER routines and leaked-password protection disabled. | Audit argument authorization and Auth settings separately. | OPEN, pre-existing. |

## Isolated PostgreSQL 16 verification

CI workflow: .github/workflows/v53-partner-postgres.yml

1. tests/sql/v53-bootstrap.sql creates synthetic baseline roles, grant/RLS rules and dummy user data.
2. The exact V53 SQL migration is applied to disposable PostgreSQL, not Supabase.
3. tests/sql/v53-partner-integration.sql executes positive and negative assertions.

Tests cover excess TRUNCATE/DELETE/INSERT/UPDATE rights, anon and non-owner access, idempotent verified auto-enrollment, self-claim and duplicate blocking, expired/unverified signup, owner-only RLS visibility, real order-status trigger, 1% and 2% simulated calculations, tier escalation prevention, audited admin changes and suspension blocking.

An initial isolated PostgreSQL workflow run passed (GitHub Actions run 40627505279). Subsequent commit checks must be evaluated separately.

**Isolation caveat:** The fixtures reproduce relevant legacy grants and triggers but are not an exact clone of Supabase infrastructure. Migration compatibility with the full actual live schema remains a gate. Neither a full browser-based E2E nor a payment security audit is completed.

## Gates before original Supabase schema deployment

- [x] Inspect original Supabase grants/policies/functions using read-only SQL.
- [x] Remove excessive grants for Partner tables in proposed migration.
- [x] Add temporary PostgreSQL CI and positive/negative integration tests.
- [ ] Latest commit full quality gates and isolated PostgreSQL CI green.
- [ ] Test against a complete independently isolated schema with separate test accounts.
- [ ] Review/refactor click attribution, consent and abuse controls for launch.
- [ ] Verify Buyer/Seller/Partner/Admin browser E2E and database RLS.
- [ ] Obtain owner approval before applying migration to original Supabase.
- [ ] Run security advisors again after any deployment.
- [ ] Review visual regression and approve PR before merging to main.

No real-money commission obligation, escrow, QPay or bank settlement is activated by V53.
