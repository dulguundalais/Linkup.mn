# Next.js and CSS dependency security stabilization

This change is stacked on PR #77. It preserves the V52 application source, CSS, routes, backend rules and payment boundary.

## Dependency changes

| Dependency | Before | Proposed result | Reason |
|---|---|---|---|
| next | 15.5.27 | exact 15.5.28 | Official security patch for GHSA-2464-fhr4-w9xw and GHSA-p3m5-59mp-jv5r |
| Next's nested postcss | 8.4.31 | use the existing root 8.5.30 pin | The Next patch alone retains an affected CSS dependency; a root override references `$postcss` so all current PostCSS consumers use the existing patched v8 version |
| postcss-selector-parser | 6.1.4 | 6.1.5 within the existing v6 range | Compatible security patch for flat-selector CPU exhaustion |

The override changes the dependency graph rather than editing installed package code. The generated lockfile was reconciled in a temporary clean directory and compared by package path/version before adoption. This avoided retaining the stale nested PostCSS copy. Other dependency versions were preserved beyond the security updates listed here and Next's own matching packages.

Remove or reconsider the override when a future reviewed Next release already depends on a patched PostCSS. Do not run a broad forced major upgrade to clear unrelated tooling findings.

## Advisory scope and observed exposure

- [Next image optimization advisory](https://github.com/vercel/next.js/security/advisories/GHSA-2464-fhr4-w9xw): the affected path concerns upstream image processing on glibc Linux. The prior lock already resolved sharp 0.35.5, and this app config uses `images.unoptimized=true`. Updating Next also removes its affected-version declaration; this is not evidence of a live exploit.
- [Next Server Actions advisory](https://github.com/vercel/next.js/security/advisories/GHSA-p3m5-59mp-jv5r): the documented trigger requires an App Router application with a Server Action. No first-party `use server` declaration was found in app/lib during the source check. This limited source observation does not replace patching the dependency or prove the absence of every possible runtime path.
- [PostCSS source-map advisory](https://github.com/advisories/GHSA-fxqj-rqcc-2cmp): versions through 8.5.22 are affected. The existing root 8.5.30 is newer than the fixed release. Other reported PostCSS advisories are also removed by eliminating 8.4.31.
- [Selector parser advisory](https://github.com/advisories/GHSA-rj75-hqrm-r3gf): 6.1.5 is the fixed release for v6. The advisory distinguishes untrusted selector processing from ordinary trusted build input.

## Verification contract

1. `npm ci` must install the committed lock cleanly; effective Next/PostCSS/selector versions must match this table.
2. `npm audit --omit=dev --audit-level=high` must pass. The production audit gate now runs in application CI. Development-only moderate lint-tool findings remain separately reported; they are not represented as an entirely clean full audit.
3. Existing 247 unit/security, root/Worker typecheck, lint, runtime/static builds, 93 browser tests, five real local Worker tests, database actors and two real isolated Supabase scenarios must pass on the PR commit.
4. Compare V52 generated CSS content before/after the dependency update and verify the exact source marker on previews. Styling source is unchanged; build output differences still require review.
5. Publish only branch previews. Keep the Worker backend gate disabled, original Supabase unchanged, production deployment/version unchanged and PR unmerged.

`docs/evidence/next-security-audit-20261031.json` records the dated before/after audit summary and effective versions. Exact-SHA CI/preview outcomes are recorded in the PR description after execution. An npm audit result covers known dependency advisories at that moment; it does not close the remaining auth/RLS, hosted staging, legal or backup release gates.
