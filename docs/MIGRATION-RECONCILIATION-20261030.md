# V52 migration reconciliation — read-only evidence

Source baseline: PR #72 head 6e5537cf21a8941b74b3086f1b9956a685ff6d5c. This PR stacks on #72; do not merge it before its dependency. No original Supabase writes, history repair, schema push or production publish occurred.

## Verified aliases

Original project pgrxsphkjudvfbpaudbd was queried using SELECT on supabase_migrations.schema_migrations. Each selected entry stores one SQL statement string. Its SQL body matches the repository after removing comments, normalizing whitespace and removing the repository's outer BEGIN/COMMIT wrapper. This is a textual comparison, not a complete live-schema equivalence proof.

| Migration | Previous repository version | Observed live version | Live stored-statement MD5 |
|---|---|---|---|
| v52_order_deliveries | 20261026090000 | 20261026034838 | e38d57456e2ee29ff400c56d5acfdc93 |
| v50_professional_categories | 20261025090000 | 20261026040835 | 076365eb51c76402308ed460caba0c7e |

Only these two filenames change. Their SQL bytes remain unchanged. The resulting order now matches live: V52, then V50. Both ordering and behavior are verified by fresh PostgreSQL replay and the V47/V50/V52 actor suites. Existing source tests now reference the reconciled paths.

## New hardening migration

Supabase CLI 2.122.0 generated 20261030115938_revoke_legacy_nonrow_privileges.sql locally. It removes TRUNCATE, REFERENCES and TRIGGER privileges from PUBLIC, anon and authenticated on public tables, plus the executor's future-table defaults. It leaves CRUD, column grants, RLS, Auth and Storage schemas intact.

CI applies this versioned file during fresh replay. It then deliberately reintroduces legacy table and default privileges, applies this exact file twice, verifies denial for both API roles and all three privileges, and reruns column and actor tests. The prior proposal remains historical; tests use the versioned migration as the authoritative SQL.

## Unresolved history — deployment remains blocked

- Repo 20261023050000_v33_project_requests has no matching original history entry. Live V33 routines/tables exist; the stored V34 migration does not contain the CREATE TABLE public.project_requests statement. Do not rerun V33 or mark it applied without separately comparing all affected definitions, policies, triggers, grants and indexes.
- Live 20261026034957_backup_before_v50_20261026 contains CREATE TABLE, and 20261026040943_post_v50_restore_service_timestamps contains UPDATE public.services. Their metadata was inspected without exporting row data. They are not blindly added to fresh-install migrations or executed again.
- The live database's full schema/default grants and all possible object creators are not proven identical to the replay fixture. The new default privilege change covers the migration executor only.
- Any environment that already applied the old repository V50/V52 versions needs its own history plan. Renaming source files alone is not authorization for a remote repair.

## Before any future deployment

1. Freeze the target environment and take a verified backup/restore checkpoint.
2. Complete definition-level V33 comparison and review the one-off backup/restore SQL in a private environment.
3. Document a target-specific migration history plan, including any already-applied old filename versions.
4. Rehearse the existing-schema upgrade and denial/positive actor tests in a separate complete Supabase staging environment.
5. Review changes and obtain deployment authorization; only then consider remote history repair or schema push.

Fresh replay and test preview success do not remove these gates. Payment integration and V53 remain outside this PR.
