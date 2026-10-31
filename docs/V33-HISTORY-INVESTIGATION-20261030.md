# V33 history and V50 one-off operation investigation

Scope: original Hustle.mn project pgrxsphkjudvfbpaudbd, read-only metadata on 2026-10-30 (Asia/Ulaanbaatar), compared with repository PR #73 head 3b48e14. This PR stacks on #73. It does not change application UI, migrations, original history or user data.

## What is now explicit

V33 has no matching row in original migration history, even though its application objects exist. The later V34 stored migration does not contain the V33 project_requests CREATE TABLE statement. This does not establish when or by whom V33 was applied; do not invent a history timestamp or rerun it.

The checked-in live evidence contains 133 scoped entries: 3 table RLS states, 29 columns (including profiles.accepting_projects), 26 constraints, 9 indexes, 3 policies, 4 triggers, 42 table privilege checks, 6 effective column-grant lists and 11 public/trigger routine definitions and execution/configuration flags. The snapshot contains no user rows or credentials. Column checks include SELECT/INSERT/UPDATE/REFERENCES so table-level absence is not mistaken for effective denial.

scripts/v33-schema-evidence.sql is the same read-only query used for both the captured original metadata and the disposable PostgreSQL replay. CI compares with scripts/compare-schema-evidence.mjs; there is no object/privilege exception allowlist. A mismatch blocks this job and must be investigated, not overwritten by a refreshed baseline.

The initial strict fingerprint check matched 126/127 entries and flagged create_project_request. Read-only inspection of its actual body established that live omits two explanatory matching comments present in the repo. Code tokens are identical. This is a representation difference, not evidence of a behavioral mismatch.

Raw whitespace-normalized pg_get_functiondef MD5 fingerprints remain in captured evidence. Routine bodies are also captured and compared as conservative SQL token streams: comments and spacing are ignored outside literals; quoted identifiers, strings and dollar-quoted string contents retain their exact bytes. Arguments/defaults, return type, language, volatility, parallel/strict/leakproof/kind/cost/rows/support attributes, SECURITY DEFINER, search_path/config and anon/authenticated EXECUTE are compared separately. Only an otherwise identical routine may be reported as representation-only; there is no fingerprint-pair bypass.

The original 127 metadata values remain unchanged; the base snapshot was expanded only with six effective column-grant lists. Separate routine-body evidence is accepted only when its exact function scope, raw capture fingerprints and every original routine attribute match that base, preventing a silent baseline refresh.

These fingerprints are not signatures, a formal proof of semantic equivalence, or a substitute for privileged-code review. Database ownership, all other application objects, Auth/Storage services and concurrency are outside this scoped comparison.

## Backup / restore history reviewed without reading backup rows

| Original version | Operation | Decision |
|---|---|---|
| 20261026034957 | Create private hustle_backup schema and five snapshots: services, project_requests, service_packages, function definitions and category constraints | Historical operational event; do not add this data-copy operation to fresh migrations or replay it |
| 20261026040943 | With session_replication_role=replica, restore only services.updated_at by matching backup IDs, then restore origin mode | Historical timestamp correction; do not run it on current data or reproduce trigger disabling in application code |

The first entry's recorded statement MD5 is 74ee16aa295504b323a7e31582553ea4. The second is 6fc68213bfaa59c14c0189e54dbee750. These identify the reviewed stored SQL; no data from those snapshots was exported.

Live effective checks confirmed anon and authenticated each lack schema USAGE, table SELECT and TRUNCATE for all five backup tables (10 role/table combinations). A literal hustle_backup reference was not found in SECURITY DEFINER routine bodies. This is limited metadata evidence, not a proof against every possible indirect access path.

## Functional verification added

The isolated database suite now includes:
- V33 buyer request -> eligible seller invitation -> proposal -> buyer award -> exactly one correctly priced order.
- Outsider read/submit/cancel/award/withdraw denial, unverified request denial, anonymous RPC denial and direct-table-write denial.
- Existing V34 recipient notification and V35 withdrawal/order-notification actor tests.
- Existing V47/V50/V52 actor suites after grant hardening.

The old V34/V35 "unapproved" fixture accounts used verified emails. Under current open-beta enrollment those users become members automatically. Those two fixture records now use NULL email_confirmed_at so they represent genuinely unverified users. No production access policy was weakened to make these tests pass.

Every SQL actor test uses synthetic example.test identities and rolls back. CI uses only a disposable PostgreSQL service, minimal Auth/Storage SQL contracts and read-only repository permissions.

## Safe target-specific history plan

1. Freeze the target release SHA and separately capture its actual history and scoped schema again. The checked-in evidence is a dated observation, not a live monitor.
2. Verify an independently restorable full backup and rehearse on a complete isolated Supabase copy.
3. If current scope still matches, propose V33 as an already-present schema/history discrepancy for human review. A metadata match does not authorize marking it applied.
4. Preserve the two one-off operational events in a separately reviewed target history manifest; do not replay them as schema migrations. A migration tool may report their remote-only versions and should stop until the operator chooses an explicit history strategy.
5. Rehearse any proposed history-only bookkeeping separately from schema/data changes. Review the exact target/version list and obtain deployment authorization before any repair.
6. Only after that rehearsal consider the staged non-row privilege migration, rerun advisors and actor/API/browser denial tests, and review rollback results.

No repair, mark-as-applied, deletion, schema push, backup-row access, staging subscription, main merge or production publish is performed by this PR. Existing V52 UI and payment/V53 boundaries remain unchanged.
