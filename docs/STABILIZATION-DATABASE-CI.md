# V52 isolated database verification

This first stabilization increment replays every committed migration, in filename order, against a disposable PostgreSQL 17 service in GitHub Actions. It then executes column-privilege assertions and existing V47/V50/V52 actor tests. No Supabase token, production URL or remote database secret is used.

The bootstrap only supplies minimal Auth/Storage SQL contracts. It is not a Supabase migration, a complete Supabase clone, a paid staging project, or evidence of email delivery, Storage HTTP downloads, realtime events or authenticated browser E2E.

## Audit corrections

The initial audit confused table-level privilege absence with absent effective write access. Live column_privileges confirms the three moderation tables grant only specific INSERT/UPDATE columns. Do not fix this by granting table-wide writes. The new SQL check verifies allowed fields and denies protected fields.

Live hustle_private.referral_guard already sets eligibility/status and rejects attribution rewrites. The frontend payload does not establish a server-ownership vulnerability. Overbroad Partner code visibility and legacy TRUNCATE privileges remain separate open findings.

## Migration reconciliation status

PR #73 aligns the V50/V52 filenames with captured live versions without changing their SQL bytes. PR #75 compares 133 scoped V33 schema entries and reviews the stored one-off backup/restore SQL without exporting backup rows. Original V33 history bookkeeping remains unresolved. See [migration reconciliation](MIGRATION-RECONCILIATION-20261030.md), [V33 investigation](V33-HISTORY-INVESTIGATION-20261030.md) and [integration rehearsal](INTEGRATION-REHEARSAL.md). Fresh replay does not authorize any remote history repair or push.

## Acceptance

- Replay succeeds on an empty disposable database.
- Effective column grants and existing actor fixtures pass.
- Changes remain independent of V53 PR #70 and preserve V52 UI.
- Production and original Supabase remain unchanged.
- Hosted isolated preview/backend, cross-account HTTP tests and marketplace-wide grant hardening remain the next increments.

## Tested grant-hardening candidate

supabase/proposals/revoke-legacy-table-privileges.sql removes only TRUNCATE, REFERENCES and TRIGGER privileges across public tables and the current migration owner's future-table defaults. It preserves all CRUD/column grants and RLS.

CI first injects the observed legacy privileges, applies the exact candidate twice, verifies effective denial (without issuing TRUNCATE), then reruns the column privilege and actor suites. This checks both removal and preservation of existing flows.

The CLI-generated migration `20261030115938_revoke_legacy_nonrow_privileges.sql` is now authoritative for CI; the proposal is historical. It has not been applied to original Supabase. Default privileges belonging to other object creators, unexpected DML rights and Partner code visibility need separate review.
