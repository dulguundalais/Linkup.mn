# V52 Worker preview contract

The previous Workers Builds trigger had an empty build command and `npx wrangler preview` as its preview command, but no Wrangler config, assets binding or Worker entry existed. Build 92352b02-014a-402e-b782-4decfa65b391 failed before creating a preview.

## Reviewable change

- Keep Cloudflare Pages and its existing settings unchanged. Worker configuration lives at `worker/wrangler.jsonc`, avoiding a root config that could be mistaken for Pages configuration.
- Reuse the V52 static export and the existing three Pages handlers: public config, public seller profile and private portfolio image signing. This is the existing deployment model packaged for Workers; no new Next.js server features or UI redesign are introduced.
- Pin Wrangler 4.156.0, its Miniflare 5.20261023.3-beta test runtime and workers-types 5.20261031.1 in the lockfile. Generate bindings from config and typecheck Worker globals separately from the Next.js DOM application. Compatibility date 2026-10-30 is the latest supported by the installed workerd binary.
- Build static assets with `npm run build:worker-preview`. The build marker records the actual checked-out Git SHA. Preview command: `npx wrangler preview --config worker/wrangler.jsonc`.
- Run Worker code first for `/api/*` and `/p/*`, retaining static assets, Pages `_headers`, `_redirects`, trailing-slash behavior and missing-page 404s.

## Backend isolation

Both base and preview config explicitly set `HUSTLE_STAGING_BACKEND=disabled`. Dynamic handlers receive no Supabase settings until a reviewed isolated staging configuration explicitly enables them. Even if unrelated backend variables are present, the disabled gate ignores them. No original Supabase URL, key, service-role secret, production route or external resource binding is committed or copied into this preview.

A deployed Worker preview can therefore serve the V52 interface while `/api/config`, a valid `/p/:slug` and a valid image path correctly return 503. This is intentional missing-staging behavior, not proof of authenticated hosted acceptance. Hosted staging connection remains audit B01; real Auth/order/file checks continue in the separate ephemeral Supabase CI environment. Do not use the original database to make this preview appear configured.

## Verification

- `wrangler deploy --dry-run --config worker/wrangler.jsonc` bundles locally; no production upload is performed.
- Five tests run the bundled handler in real local workerd with a synthetic outbound service and also exercise Wrangler's actual local static-assets server. They verify public config/profile and opt-out 404, permitted image signing, traversal/method/HEAD/unknown API behavior, static HTML/headers/redirects/missing pages, and the disabled backend gate despite supplied synthetic backend variables.
- The synthetic outbound service cannot contact a hosted Supabase project. Positive profile/image tests are fixture-backed runtime evidence; they are not live RLS evidence. Existing database and full Supabase suites remain separate.
- Existing unit, typecheck, lint, browser and database quality gates also run for the stacked PR base. `worker-preview.yml` has repository read permission and no cloud deployment credentials.

Current exact-SHA CI and hosted preview evidence belongs in the PR description. The branch-specific Cloudflare build trigger must use the explicit build/preview commands above. Do not change production triggers or deploy commands, or suppress the old failed checks to claim success.

## Production checkpoint

Before this work, the latest active `hustle-mn` production deployment was `8c8373fc-565a-4726-9da4-1fb2c809915d`, serving version `1cbe6356-cee6-4cfa-a70e-6947d68b24a7` at 100%, created 2026-10-27T13:11:37Z. Compare the deployment/version again after preview publication. Pages production branch remains `feature/homepage-ui-v1`; main and original Supabase are outside this change.

## Separate dependency security follow-up

The dependency audit on 2026-10-31 flags existing Next.js 15.5.27 with [GHSA-2464-fhr4-w9xw](https://github.com/advisories/GHSA-2464-fhr4-w9xw) and [GHSA-p3m5-59mp-jv5r](https://github.com/advisories/GHSA-p3m5-59mp-jv5r), and proposes 15.5.28 as the patched version. This change does not upgrade Next.js. Review and patch it in a separate stabilization PR with runtime/static/browser verification. An affected dependency report is not evidence that the current static preview has been exploited; runtime exposure must be assessed separately. Existing lint-tool transitive findings also remain documented dependency work.
