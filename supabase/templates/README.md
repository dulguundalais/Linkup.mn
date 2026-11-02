# Linkup auth emails (Mongolian)

These are the email templates set in Supabase → Authentication → Emails → Templates
(owner approved, 2026-11-02). Sent from **Linkup &lt;noreply@linkup.mn&gt;** through Resend SMTP.

| File | Supabase template | Subject |
|---|---|---|
| `confirm-signup.html` | Confirm sign up | Linkup бүртгэлээ баталгаажуулна уу |
| `reset-password.html` | Reset password | Linkup нууц үгээ шинэчлэх |
| `change-email.html` | Change email address | Linkup шинэ имэйл хаягаа баталгаажуулна уу |
| `magic-link.html` | Magic link or OTP | Linkup-д нэвтрэх холбоос |

When a template changes, update the file here and paste the same HTML into Supabase.
Fonts: Manrope where the mail app loads web fonts, otherwise the system font
(Segoe UI / Roboto / San Francisco), all of which have the Mongolian letters ү and ө.
