# Authentication and access stabilization — 2026-10-31

Draft PR: https://github.com/dulguundalais/Hustle.mn/pull/79, stacked on PR #78.
Scope: existing V52 login, email confirmation, password recovery and account permissions. No new feature, CSS/design change, payment integration, production deployment or hosted Supabase mutation.

## Findings and acceptance criteria

| ID | Severity | Finding / evidence | Resolution and acceptance |
| --- | --- | --- | --- |
| AUTH-01 | P2 | `components/reset-password.tsx` accepted an existing session plus a caller-controlled `?type=recovery` as recovery evidence. That could open a password form for the account already signed in rather than the intended recovery recipient. This did not bypass Supabase's authentication requirement. | Remove that fallback; require the SDK's verified `PASSWORD_RECOVERY` event. Real valid recovery must still update the password. A signed-in member visiting the plain query URL must see the invalid-link state and no password form. |
| AUTH-02 | P2 | Local Auth's redirect allowlist contained `/auth/reset/` but omitted the application's `/login/` confirmation destination. Existing admin-confirmed fixtures bypassed email delivery entirely. | Add only the exact loopback login URL. GoTrue-generated confirmation mail captured in Mailpit must redirect to `/login/`, preserve the original buyer intent and admit a confirmed account as member only. |
| AUTH-03 | P1 release gate, open | Hosted public Auth settings confirm email/password signup enabled, confirmation required (`mailer_autoconfirm=false`), anonymous and phone auth disabled. These settings do not prove custom SMTP setup, delivery or the hosted redirect allowlist. No live mail was sent. | Before launch, verify exact approved domain login/reset URLs, Site URL, confirmation and recovery template links, configured sender, SPF/DKIM/DMARC, rate limits and successful receipt/Spam placement in designated Gmail/Outlook test inboxes. Keep broad preview wildcards out of the production redirect list. Record actual results; local Mailpit is not evidence of hosted delivery. |
| AUTH-04 | P2, open | Hosted security advisor reports `auth_leaked_password_protection`: leaked password protection disabled. | Owner/developer should verify plan/configuration support and enable/rehearse password-strength and compromised-password rejection before general release. No hosted setting was changed. |
| AUTH-05 | P2 operational follow-up | Supabase JWT access tokens can remain usable until expiry after logout; revoking refresh credentials does not instantly revoke already issued JWTs. Application account-disable and role changes query current allowlist state instead of trusting user metadata. | Use application access-disable for immediate restrictions. The rehearsal checks existing JWTs lose marketplace permissions immediately when disabled or demoted, and refresh cannot re-enable them. Strict per-session revocation would need a separately reviewed policy change; this PR does not claim it. |

## Reproducible isolated evidence

`qa/staging/auth.spec.mjs` uses real GoTrue, PostgREST, existing RLS, browser UI and Mailpit, with no mocked responses or prebuilt browser sessions. It covers:

1. Signup through UI; unconfirmed login denied; real confirmation resend; confirmed member admission and return intent; wrong password denied; admin entry denied; used confirmation link rejected; UI logout persists across reload.
2. Recovery request through UI; actual emailed one-time link; mismatched passwords rejected; valid password update; logout; old password rejected and new password accepted; recovery replay rejected; unknown email receives the same generic request message.
3. An existing signed-in account plus a plain `?type=recovery` query never enables the password form.
4. Global logout revokes refresh credentials; an expired saved browser session with that revoked refresh token returns to sign-in. Only the cached expiry timestamp is fault-injected; authentic tokens are untouched.
5. Expired confirmation and recovery links rejected by real GoTrue; confirming an email never re-enables an account previously disabled by an admin.
6. Direct HTTP/API role escalation denied; member cannot create partner codes; partner grant works; disable/re-enable and partner/admin demotion affect an already issued JWT; disabled account cannot send a message; token refresh does not restore access; revoked admin cannot call list/manage/pending-signup RPCs.

The existing two real marketplace tests remain enabled: unrelated order/chat/file/review access denied, and buyer→seller→private delivery→revision→review→admin oversight.

`scripts/expire-local-auth-link.mjs` is a test-only fault injector. It verifies the exact loopback API/database through `localStatus`, accepts only two fixed timestamp columns and synthetic `hustle-auth-…@example.test` emails, updates exactly one account, and returns no keys/tokens. It cannot target a hosted URL. Full local services run on a disposable GitHub Actions runner and are stopped with no backup. No hosted project is provisioned.

CI retains screenshots/HTML reports, with network traces, videos and exported session states disabled. Mail bodies and token-bearing verification URLs are kept out of assertions and logs. Only public loopback configuration enters browser clients; privileged connection settings remain in private runner files.

## Hosted read-only checkpoint

On 2026-10-31, the original project's `/auth/v1/settings` returned HTTP 200 with signup enabled, required email confirmation, email provider enabled, anonymous auth disabled and phone provider disabled. The read-only Auth log aggregate in the last 24-hour window contained 16 status-200 events and 3 info events without a status; it is a limited operational snapshot, not end-to-end proof.

Security advisors also flag nine intentionally exposed `SECURITY DEFINER` RPCs for review. Their presence alone does not establish an exploitable authorization defect. The existing audit backlog retains function-by-function permission review; this PR adds direct revoked-admin checks for the relevant account-management RPCs. Do not blanket revoke intended RPCs or convert them to invoker without verifying their actor checks and callers.

## Verification and preview boundary

Local unit suite: 247 passed; TypeScript and the changed recovery component's ESLint check passed. The final PR head must also pass all four workflow suites and both preview checks before review: application lint/type/build/runtime audit, 93 browser regressions, SQL/RLS replay, real isolated Supabase rehearsal and five Worker runtime tests.

Workers preview is built with `HUSTLE_STAGING_BACKEND=disabled`; use it for visual/static/transport verification only. Authenticated acceptance runs against loopback in CI, not against the Pages preview's inherited hosted backend. The branch-specific preview trigger is `36addfce-8c7c-4e0d-a693-be4b6179213c`; only its two build/preview commands were updated. Production and other branch triggers are unchanged.

Original production Worker checkpoint: deployment `8c8373fc-565a-4726-9da4-1fb2c809915d`, version `1cbe6356-cee6-4cfa-a70e-6947d68b24a7` at 100%, created 2026-10-27. Recheck after preview completion. Main and the original Supabase database remain unchanged by this PR.

## Primary references

- [Supabase: testing Auth flows locally](https://supabase.com/docs/guides/auth/testing-auth-flows)
- [Supabase: password-based Auth](https://supabase.com/docs/guides/auth/passwords)
- [Supabase JavaScript: resetPasswordForEmail](https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail)
- [Supabase: sessions](https://supabase.com/docs/guides/auth/sessions) and [sign-out behavior](https://supabase.com/docs/guides/auth/signout)
- [Supabase password-strength / leaked-password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)
- [Supabase SECURITY DEFINER advisor](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable)
- [Mailpit API schema](https://raw.githubusercontent.com/axllent/mailpit/master/server/ui/api/v1/swagger.json)

Current changelog reviewed. The November 10 CBC TLS retirement does not require changing this app's modern browser/Node clients. The self-hosted `API_EXTERNAL_URL` change is already aligned with CLI/hosted `/auth/v1` routing; this project does not add SAML or a custom Docker Auth deployment.
