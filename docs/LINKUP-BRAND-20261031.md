# Linkup brand (2026-10-31)

The product name changes from Hustle.mn to **Linkup**. Domain `linkup.mn` is not registered yet, so no URL, Supabase redirect or Cloudflare setting changes here.

## What changed
- Logo: the owner-supplied "Linkup." PNG was vectorised. `lib/brand.ts` holds the paths; `components/linkup-wordmark.tsx` renders them with `currentColor` (text) and 72% opacity (dot), so the mark follows light/dark themes and dark panels without extra colours. The server-rendered public portfolio uses `public/brand/linkup-wordmark-mask.svg` as a CSS mask for the same effect.
- Text logos replaced in the site header, footer, sign-in, password reset, Smart Finder, guided entry and the public portfolio. Decorative cover placeholders read `linkup.`.
- Favicon `app/icon.svg` ("L." mark) and share card `public/og/linkup.png` (1200×630).
- User-visible copy, page titles, metadata and `og:site_name`: Hustle / Hustle.mn / HUSTLE → Linkup. Mongolian suffixes follow the back-vowel reading "линкап": Linkup-аар, Linkup-ын, Linkup-ыг, Linkup-д.
- Profile URL hint shows `linkup.mn/p/…` (the planned domain).

## Deliberately unchanged
CSS class names (`hustle-*`), the `hustle_private` schema, localStorage keys (`hustle-language`, `hustle-return-intent` …), `HUSTLE_SUPPORT_*` variables, `X-Hustle-Storage-*` headers, Cloudflare/Supabase project names, code comments and the unrouted `app/legacy-home.tsx`. Renaming these would reset saved user state or need deployment changes without any visible benefit.

`public/og/hustle.png` stays for links already shared; nothing references it now.

## Checks
`tests/linkup-brand.mjs` fails if Hustle/HUSTLE/hustle.mn appears in user-visible source again, and checks the wordmark, favicon and share card. Existing tests that asserted Hustle copy now assert the Linkup equivalents.
