# Signup email verification

The existing password signup now stays on the signup page and asks for the emailed
code. `verifyOtp({email, token, type: 'email'})` creates the authenticated session;
the existing buyer provisioning, role restrictions and safe return-intent flow run
after verification. Google OAuth and password recovery retain their own flows.

The pending email, entry mode and request timestamp survive reloads in this tab's
sessionStorage for 30 minutes. Passwords and codes are never stored. Resend keeps
the server's rate limits and a 60-second UI cooldown. Numeric codes between six and
ten digits support the configured Supabase OTP length; the UI does not assume six.

## Hosted rollout

1. Deploy and review the feature preview first.
2. In Supabase Authentication → Email Templates → Confirm signup, use the checked-in
   `supabase/templates/confirm-signup.html`. Suggested subject:
   `Linkup — Имэйл баталгаажуулах код`.
3. Keep email confirmations enabled and the existing SMTP and redirect allowlist.
   The code is Supabase's `{{ .Token }}`. Do not generate a separate frontend code.
4. The template retains `{{ .ConfirmationURL }}` as a fallback for old signup pages.
   Existing emailed links remain usable through the existing callback handling.
5. Test a fresh allowed address on the hosted preview: signup → actual inbox code →
   verification → original service/project request with draft preserved. Test an
   incorrect/expired code, resend, reload, seller signup and an unavailable account.
   Do not create real orders or send test emails without an owner-designated address.

The code/template changes alone do not update the hosted Supabase email template.
No database migration, service-role key or change to account authorization is needed.
