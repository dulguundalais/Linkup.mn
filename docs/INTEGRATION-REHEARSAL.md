# V52 stabilization integration and isolated rehearsal

Draft PR #76 integrates #72 (database CI), #73 (migration filenames/hardening), #74 (workspace startup race) and #75 (V33 evidence/actor checks). Its merge parents are 635019f182cf6e7db0fef4b6efddea62c807590b and eefc81beced88345b811cfa4f445f6e7f9ce0db9. No V53 changes or new marketplace features are included. The V52 layout and CSS are unchanged.

## Two different verification environments

1. `.github/workflows/stabilization-postgres.yml` replays the repository on disposable PostgreSQL 17, verifies 133 V33 metadata entries against captured original evidence, exercises effective column/non-row grants and the V33/V34/V35/V47/V50/V52 SQL actors. Its Auth/Storage contracts are minimal SQL fixtures.
2. `.github/workflows/stabilization-supabase.yml` starts real local Supabase Auth, PostgREST, Storage and Realtime services inside the GitHub runner, using CLI 2.122.0 and PostgreSQL major 17. It uses no cloud account token, project link, repository write permission or remote database secret. This is an ephemeral full service test environment, not a persistent hosted staging project.

The new workflow holds only the final non-row privilege migration outside the migration directory, starts the preceding V52 schema, creates four confirmed synthetic Auth users, profiles, a published service/package, an order and a message, then applies the held migration with `supabase migration up --local`. It compares complete synthetic rows before/after, checks the local migration history entry and verifies denial of TRUNCATE/REFERENCES/TRIGGER for both API roles. It does not invoke TRUNCATE.

Fixture scripts refuse any API except `http://127.0.0.1:54321` and any database except postgres on `127.0.0.1:54322`. Keys and fixture state stay in private runner temporary files, outside artifacts. The browser uses only the public local key and synthetic users; traces and session-state exports are disabled. Services are stopped after the run. The developer machine has no Docker, so the full service suite runs in CI; unit tests, typecheck and configured lint can run locally.

`qa/staging/marketplace.spec.mjs` contains no response mocks. It signs in through real Auth and checks buyer order snapshots, seller transitions, chat receipt without recipient reload while Realtime is connected, private file upload/download, revision limits, completion, one verified review, admin oversight and outsider UI/API denial. Direct API checks cover immutable price, forged review, member metadata role escalation and anonymous/unrelated file access. Confirmed fixture accounts are not evidence of real email confirmation or password-reset delivery.

Current results and exact tested commit are recorded in the PR checks/description. A test being present in source is not a passing result.

Observed on code commit `87d21de94930047fa0af3a9201ca3588d2c1dff5`:

- [Full Supabase rehearsal](https://github.com/dulguundalais/Hustle.mn/actions/runs/41078581364): populated upgrade/preservation check and 2 real HTTP/browser scenarios passed, with retries disabled.
- [Application quality](https://github.com/dulguundalais/Hustle.mn/actions/runs/41078581437): 247 unit/security tests, typecheck, configured lint, runtime/static builds and 91 existing mocked browser tests passed. Mocked tests remain separate from real-service evidence.
- [PostgreSQL verification](https://github.com/dulguundalais/Hustle.mn/actions/runs/41078581259): V33 evidence comparison, grant and SQL actor suites passed.
- Local 247 tests, typecheck and configured lint passed. The full Supabase suite was run in CI, not on the developer machine.
- Pages preview passed; Workers check failed for the separately recorded configuration defect below. This is not an all-green release and no production action followed.

## Preview contract

Cloudflare Pages `hustle-mn-preview` produces branch previews. Its production branch remains `feature/homepage-ui-v1`. The integration preview marker was observed at commit 87d21de94930047fa0af3a9201ca3588d2c1dff5 on https://e5dbeb52.hustle-mn-preview.pages.dev/preview-build.json. The marker's historical `V26` label is not the visual baseline version; compare `commit_sha`.

These Pages previews inherit the original backend configuration. Use them as source/visual evidence only. Authenticated mutation tests run exclusively against the loopback backend inside CI. A Pages preview is not evidence of hosted backend isolation.

Workers build 53e31096-d9bb-407f-8671-965cf46cee21 failed on 2026-10-30 at this integration commit. Read-only Cloudflare API evidence shows no build command and deploy command `npx wrangler preview`; Wrangler 4.156.0 reports a missing `previews` block. The repo also has no Worker adapter/configuration contract. Adding an empty block alone would not prove a working Next.js deployment. No Worker deployment settings were changed by this PR.

## Remaining release backlog, in dependency order

| Severity / existing audit scope | Required follow-up | Acceptance |
|---|---|---|
| P1 B01/B07 | Complete isolated service/browser checks; separately provide a hosted isolated preview before external acceptance | Green real-service checks; exact deployed SHA and separate backend verified; no original-data mutations |
| P1 B05 | Target-specific history/backup rehearsal | Recheck V33 evidence, review remote-only operational versions, demonstrate restore and history strategy on an isolated copy; never blind repair/push |
| P1 B02/B04 | Review unneeded DML/default owners and existing Partner code visibility | Allowed CRUD/referral behavior preserved; unrelated private rows and forged roles/eligibility denied; no V53 feature merge |
| P1 B06 | Resolve Pages/Workers deployment contract and exact-commit smoke | One documented hosting path with working dynamic profile/image routes; intentionally retired stale check or correctly configured Worker preview; no production publish |
| P1 B08 | Confirmation/reset, disabled/expired sessions and privileged RPC review | Actual isolated confirmation/reset origin, denial matrix and RPC dispositions recorded; local confirmed fixtures do not close this item |
| P2 B09 | V52 responsive/accessibility regression | 320/390/768/1024/1440, MN/EN, light/dark, keyboard and zoom reviewed; fix defects without redesign |
| P2 B10/B11 | Legal/support owner facts and restore/rollback exercise | Verified operator/contact/retention/dispute policy and restored test data, reviewed by responsible humans |

The original moderation-grant finding must not be reopened as a table-wide grant fix: existing column grants intentionally permit specific fields. See the corrected audit and `STABILIZATION-DATABASE-CI.md`. Payment/provider/webhooks/settlement integration remains a human developer handoff. These checks do not authorize merging main, original Supabase changes or production publication.
