# Hustle.mn — live release stabilization audit

Огноо: 2026-10-30, Asia/Ulaanbaatar. Шийдвэр: **NO-GO — нийтэд launch хийх бэлэн байдал батлагдаагүй.**

Энэ нь эхний шатны бодит аудит ба хэрэгжүүлэх backlog. Application code/UI, live DB, production hosting өөрчлөөгүй. Payment integration нь амьд хөгжүүлэгчийн тусдаа ажил. Аудитад илрээгүй зүйлийг ажилладаг/аюулгүй гэж тооцоогүй.

## Залруулга — implementation үеийн нэмэлт шалгалт (2026-10-30)

**Доорх анхны B03 ба B04-ийн зарим дүгнэлтийг энэ залруулга орлоно.**
- B03: has_table_privilege=false нь column-level GRANT-ийг тооцдоггүй. LIVE information_schema.column_privileges-аар message_reports, category_suggestions, professional_verifications-д шаардлагатай INSERT/UPDATE баганын эрхүүд байгааг баталсан. Report/category flows-ийг эвдэрсэн гэж үзсэн нь буруу; blanket GRANT нэмэхгүй. B03-ийг **P2 — column privilege / RLS regression verification** болгон өөрчилсөн. professional_verifications upsert update payload дахь immutable key columns-ийн compatibility-г жинхэнэ SQL тестээр шалгах үлдсэн.
- B04: LIVE hustle_private.referral_guard() нь created_at, eligible_until, status-г server-ээс тогтоож, ownership/eligibility өөрчлөхийг хориглодог. Client-controlled eligibility гэж дүгнэсэн нь буруу. B04-ийн P1 хүрээ нь overbroad codes_read, existing flow-ийн баталгаажуулалт хэвээр.
- Иймээс corrected backlog: **7 P1, 4 P2, 2 P3**. Анхны snapshot мөрүүдийг түүхэн нотолгоо байдлаар үлдээсэн; энэ залруулгыг precedence-тэй уншина.

## Baseline ба хамрах хүрээ

- Repo: https://github.com/dulguundalais/Hustle.mn
- Baseline: main, eb32c23932225e136d66f5b821a7cc67f99fb72c. V52 + MN localization; PR #67 → #68 → #69.
- Claude V51/V52-ийн өнгө, typography, layout, navigation, component structure-ийг хадгална. Redesign, шинэ функц, V53 feature merge энэ stabilization-д орохгүй.
- V52 preview: https://702f1939.hustle-mn-preview.pages.dev
- Браузерт preview-build.json-ийг нээж dc87af8493ddabb7848e7d5230c4772482752800 SHA-г баталсан. Энэ нь main-ийн merge-ээс өмнөх V52 beta artifact; main SHA-тай ижил гэж тооцоогүй.
- Cloudflare Pages project: hustle-mn-preview. Production branch нь feature/homepage-ui-v1, canonical deployment cf1decaa3554751abfb08c6deafca579cfeb6638 / 2026-10-14 хэвээр.
- Latest preview нь V53 branch, 36f0019c24174e8ea5d857e990dbd8bbea5a4104, https://ddf23dc3.hustle-mn-preview.pages.dev . V52 acceptance baseline болгон ашиглахгүй.
- Original Supabase: pgrxsphkjudvfbpaudbd, Singapore, ACTIVE_HEALTHY, PostgreSQL 17.11. Metadata-only SELECT ба advisors ашигласан.
- hustle-collab-dev нь өөр төсөл; өөрчлөөгүй. Staging гэж автоматаар ашиглаагүй.
- Preview нь original Supabase-д холбогдсон. Preview hostname байна гэдэг нь өгөгдлийн тусгаарлалт биш.

## Нотолгооны чанар ба хязгаар

LIVE = энэ аудитад API/DB/browser-оор баталсан. SOURCE = код/SQL/workflow үзсэн. CI = тодорхой SHA-ийн өмнөх CI үр дүн. UNKNOWN = одоо нотолгоо хангалтгүй.

Live хэрэглэгч үүсгэх, нэвтрэх credential хайх, захиалга/чат/файл үүсгэх, SQL fixture-ийг original DB дээр ажиллуулах үйлдэл хийгээгүй. Иймээс authenticated end-to-end, email delivery, cross-account HTTP denial болон backup restore-ийг PASS гэж тэмдэглээгүй.

Shell HTTP/DNS энэ орчинд ажиллаагүй; browser-оор V52 нээгдсэн тул энэ алдааг сайт down гэж тооцоогүй. Local runtime build EPERM (mkdir .next/server/app/api/beta) шалтгаанаар зогссон; application compile bug гэж дүгнээгүй.

## Одоогийн хийсэн / дутуу / эвдэрсэн төлөв

| Хэсэг | Төлөв | Бодит нотолгоо / хязгаар |
|---|---|---|
| GitHub baseline | Хийгдсэн | #69 merged; main V52 + MN localization. 75 remote branch, 13 open PR аудит эхлэхэд байсан. |
| Хуучин PR-үүд | Цэгцлэх дутуу | #1, #2, #3, #4, #5, #12, #21, #23, #41, #42, #46, #47, #70 open. Mergeability нь хэрэгтэй өөрчлөлт үлдсэн эсэхийг батлахгүй. |
| Buyer discovery | LIVE хэсэгчлэн ажилласан | Нүүрийн каталог ачаалсан, бодит seller profile → listing нээгдсэн. Standard багц сонгоход үнэ, next=tier=Standard&order=1 login handoff хадгалагдсан. |
| Buyer authenticated order | SOURCE/CI; live дутуу | Order create/accept/progress/deliver/revision/complete/review код ба fixtures бий; original DB дээр browser round-trip хийгээгүй. |
| Seller | SOURCE/CI; live дутуу | Profile studio, services/packages, upload, delivery бий. Category suggestion болон professional verification бичих DB эрх дутуу (B03). |
| Admin | Хэсэгчлэн эвдэрсэн | UI нь message_reports/category_suggestions/professional_verifications дээр direct write хийдэг; authenticated INSERT/UPDATE эрх false (B03). |
| Chat | SOURCE/CI; live дутуу | Message safety/read receipt triggers live DB-д байна; report INSERT эрх дутуу. Хоёр бодит session, realtime reconnect шалгаагүй. |
| Order/file | SOURCE + live metadata | order_events/order_files ба v52_order_event trigger live байна. 4 storage bucket бүгд private. Signed download/expiry/outsider denial browser-оор батлагдаагүй. |
| Review | SOURCE/CI | Completed-order buyer-only, unique order review ба aggregate-only catalog tests PASS. Live review mutation шалгаагүй. |
| Partner V52 | Аюулгүй байдлын дутуу | codes_read нь бүх beta member-д кодын мөрүүд харах эрхтэй; frontend direct referral INSERT/eligible_until-г өөрөө өгдөг (B04). |
| Partner V53 | Тусдаа Draft | #70 unmerged. partner_memberships/partner_rewards original schema-д байхгүй; V53 migration history-д байхгүй. CI ногоон нь live backend deployed гэсэн үг биш. |
| Auth | SOURCE/metadata; live дутуу | beta_role allowlist дээр тулгуурладаг; list_pending_beta_signups дотор admin identity guard байна. SMTP, redirect allowlist, confirmation/reset/revocation батлагдаагүй. |
| RLS | Байгаа, хангалттай биш | Public 27 table бүгд RLS enabled; public view илрээгүй. Гэхдээ TRUNCATE grants болон дутуу DML grants байна. |
| Responsive UI | LIVE хязгаарт ажилласан | Desktop нүүр, 390px нүүр/listing, profile navigation, guest login handoff үзсэн. DOM scrollWidth 375 ≤ viewport 390. Бүх dashboard, бүх breakpoint-д PASS гэж тооцоогүй. |
| Legal/support | Launch-д дутуу | Terms/privacy/cookies нь draft/review=true; operator identity, retention, privacy channel, minimum-age process эцэслээгүй. Live contact хуудсанд албан ёсны support email нийтлэгдээгүй. |
| Payments | Зориуд оруулаагүй | Real payments/escrow байхгүй гэсэн UI тайлбар бий. Launch-ын payment/provider/tax/settlement ажлыг амьд хөгжүүлэгчид үлдээнэ. |

## Severity

P0 = нотлогдсон шууд ноцтой compromise, data loss эсвэл бүх үндсэн flow зогссон.
P1 = launch хаах security/үндсэн ажиллагаа/release reproducibility асуудал.
P2 = launch-аас өмнө дуусгах UX/operations/quality ажил.
P3 = бага нөлөөтэй засвар, баримтжуулалтын зөрүү.

**Нотлогдсон P0 incident байхгүй. Энэ нь P0 эрсдэл байхгүй гэсэн баталгаа биш.**
Доорх 13 item нь давхардахгүй ажлын багц: 7 P1, 4 P2, 2 P3.

## Release stabilization backlog — хэрэгжүүлэх дарааллаар

| ID / severity | Нөхцөл, нотолгоо | Засварын хүрээ | Acceptance criteria |
|---|---|---|---|
| B01 / P1 | Preview original DB ашигладаг; V53 latest preview нь V52 baseline биш. | Exact V52 SHA-тай isolated staging backend/preview сонгох; live credentials/data ашиглахгүй; V53 hold хэвээр. | Preview marker == PR head; backend project ref original-оос өөр; synthetic buyer/seller/admin/outsider; production branch/domain/DB өөрчлөгдөөгүй гэсэн diff ба config evidence. Шинэ paid resource хэрэгтэй бол үнэ батлуулах. |
| B02 / P1 | LIVE: 13 table-д 15 TRUNCATE grant байна: authenticated services, profiles, portfolio_items, business_rules, partner_codes, referrals, audit_events, orders, messages, saved_services, reviews, chat_attachments, messenger_presence; anon chat_attachments, messenger_presence. | Least-privilege hardening; TRUNCATE/REFERENCES/TRIGGER ба шаардлагагүй DML-г revoke; default privileges шалгах. V53-тай давхар grant policy гаргахгүй, суурь hardening-ийг нэг migration-д эзэмшүүлэх. | Isolated DB-д anon/authenticated has_table_privilege(TRUNCATE)=false; allowed CRUD хэвээр; denied CRUD/role spoofing tests PASS; advisor дахин шалгах. Original DB-д энэ шатанд apply хийхгүй. |
| B03 / P1 | LIVE: category_suggestions, message_reports, professional_verifications тус бүрийн INSERT/UPDATE authenticated privilege=false, RLS policy байгаа ч UI direct write хийдэг. SOURCE: category-admin.tsx:35/84, service-category-fields.tsx:33, chat-safety.tsx:86/211. | Эдгээр existing flow-д шаардлагатай DML grant + owner/admin RLS-г хамтад нь засах; UI redesign хийхгүй. | Seller өөрийн suggestion INSERT, user өөрийн report INSERT, admin moderation/verification upsert PASS; outsider/nonadmin update DENY; revoked admin DENY; браузерт амжилттай refresh/persist. |
| B04 / P1 | LIVE: codes_read USING beta_role IS NOT NULL. SOURCE workspace.tsx direct partner_codes/referrals INSERT, eligible_until=new Date().toISOString(). V53 өөрчлөлт staged боловч live биш. | Existing V52 Partner flow-ийн code visibility, eligibility ownership-ийг server-ээр баталгаажуулах; V53 шинэ enrollment/reward feature merge хийхгүй. Compatibility шийдвэрийг #70-той тулгана. | Өөр partner-ийн хувийн мөр харагдахгүй; self/duplicate/expired claim DENY; client eligibility/status/tier override DENY; allowed referral workflow PASS; no payouts. |
| B05 / P1 | Repo V50=20261025090000, live=20261026040835; repo V52=20261026090000, live=20261026034838. Repo V33=20261023050000 live history-д алга боловч V33 RPC-үүд байна. Live backup_before_v50/post_v50_restore_service_timestamps файлууд repo-д алга. | History ба schema definition-г тулгаж reconcile; зөвхөн нэрээр аль нэгийг missing гэж үзэхгүй. Fresh bootstrap болон existing snapshot upgrade замыг ялгах. | Fresh isolated DB бүх migration-аар амжилттай босно; live-compatible schema snapshot upgrade PASS; duplicate policy/trigger алга; schema diff тайлбарлагдсан; original history-г blind repair/push хийхгүй. |
| B06 / P1 | CI #69 head дээр validate/messenger-browser PASS; verify-preview FAIL: /p/test-freelancer=404; бодит opted-in profile LIVE ажилласан. Workers Builds #69/#70 FAIL. | Stable synthetic public-profile fixture-ийг isolated staging-д баталгаажуулах; exact-commit deploy smoke; Pages vs Workers deployment contract-ийг тодорхой болгох. | PR head-д validate, browser, SQL integration, deployed preview smoke PASS; opt-in image байт шалгах; opt-out 404; Workers хэрэглэвэл adapter/config build PASS, хэрэглэхгүй бол stale check-ийг зөвөөр retire хийх; улаан check нуухгүй. |
| B07 / P1 | SOURCE CI browser support.mjs config/Supabase-г mock хийдэг. main CI SQL fixtures ажиллуулах job-гүй. | Existing flows-ийн DB-backed release test suite-г B01 isolated backend-д холбох. | Buyer→seller accept→progress→file→deliver→revision→redeliver→complete→one review; chat explicit-send/retry/realtime; admin actions; direct API outsider denials; MN/EN mobile/desktop PASS. Fixtures original DB-д бичихгүй. |
| B08 / P1 | Auth SMTP/URL config, real confirmation/reset, disabled account/session behavior UNKNOWN. Advisor leaked_password_protection disabled. | Auth configuration evidence, sender/redirect checks, password protection боломжийг шалгах; authorization RPC 9 warning бүрийг owner/role/argument-аар review хийх. | Confirm/reset зөв preview origin-д буцна; intended order/context хадгална; enumeration-free errors; expired/disabled/outsider/session tests DENY; 9 RPC тус бүр reviewed disposition + negative test; password policy decision documented. |
| B09 / P2 | Desktop болон 390px хязгаарт үзсэн; full V52 visual regression current audit-д хийгээгүй. Public bio урт plain text давтагдаж харагдсан; харагдах нөлөөг baseline-тай тулгах хэрэгтэй. | V52 screenshot baseline freeze; эвдэрсэн spacing/overflow/focus/empty/loading/error state-ийг л засах. | 320/390/768/1024/1440px, MN/EN, light/dark; keyboard drawer/dialog/menu; 200% zoom; no horizontal overflow; buyer/seller/admin views screenshot diff review. Шинэ layout/design feature оруулахгүй. |
| B10 / P2 | Terms/privacy/cookies drafts; operator/contact/retention/age/complaints final биш. LIVE support email нийтлэгдээгүй. | Owner-ийн бодит мэдээлэл, баталгаажсан support/privacy channel, MN legal review; existing policy copy-ийг эцэслэх. | Operator identity/registration/contact/effective date; data purposes/providers/Singapore transfer/retention/deletion; complaints/IP/dispute/min-age rules; terms acceptance evidence requirement-ийг хуульчтай шийдэх; MN/EN consistency. Payment terms-ийг paid launch-аас өмнө human developer/legal owner эцэслэнэ. |
| B11 / P2 | Backup restore, rollback drill, error monitoring/incident owner UNKNOWN. | Existing release operations-ийг баримтжуулах, isolated restore/rollback хийх. | Restore rehearsal evidence; exact code+DB compatibility matrix; rollback/no-data-loss decision; sanitized monitoring, support owner and incident route; staging launch checklist signed off. |
| B12 / P3 | 75 branches, 13 open historical PR; old PR content main-д давхардсан байж болно. | SHA/diff-based PR inventory; superseded эсэхийг батлаад closure recommendation гаргах. | Нэг change-д нэг active PR; V52 baseline мөрдөх; #70 hold; хуучин branch/PR-г автоматаар merge/delete/close хийхгүй. |
| B13 / P3 | docs/CLOUDFLARE_PREVIEW.md configuration draft/no deployment гэж бичсэн, харин Pages deployment LIVE байна; preview-build version=V26, AGENTS closed-beta текст ба current open-beta зөрнө; lint зөвхөн explicit subset. | Deployment/auth/release docs, marker naming ба lint coverage-ийг бодит contract-тай нийцүүлэх. | Docs source/hosting/database ownership-ийг зөв заана; marker нь app release ба artifact SHA-г ялгана; lint coverage documented/expanded, changed production files хамрагдана; хуучин tests-ийг зөв шинэчилнэ. |

TRUNCATE-ийн эрх байгаа нь батлагдсан. Гэхдээ anonymous browser-оос arbitrary TRUNCATE гүйцэтгэх endpoint байгаа эсэхийг нотлоогүй, destructive exploit туршаагүй. PostgreSQL-д TRUNCATE/REFERENCES нь row security-д хамаардаггүй тул зөвхөн RLS enabled гэж аюулгүйд тооцох боломжгүй:
https://www.postgresql.org/docs/17/ddl-rowsecurity.html

9 SECURITY DEFINER advisor warning нь 9 батлагдсан vulnerability гэсэн үг биш. Шалгасан 7 project RPC-д auth.uid(), beta_role() ба empty search_path байна; list_pending_beta_signups нь admin identity guard-тай. Predicate correctness, grants, race/argument abuse-г B08 тестээр баталгаажуулна.
https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable
https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

## Roadmap ба PR хуваарилалт

1. **R0 — Freeze/isolate (B01):** main V52 SHA, CSS болон critical route baseline; V53 hold; staging backend тусгаарлах. Эхний audit PR нь зөвхөн энэ тайлан.
2. **R1 — DB integrity (B05 → B02 → B03 → B04):** migration reconciliation PR; marketplace grant hardening PR; missing-flow permissions PR; existing Partner security PR. Shared SQL grant-уудын ownership-ийг нэгтгэж давхардуулахгүй.
3. **R2 — Auth + verification (B08, B06 → B07):** auth evidence/guards; Pages/Workers release contract; SQL CI; real staging E2E. R1-ээс өмнө UI polish-ийг нэн тэргүүнд тавихгүй.
4. **R3 — Finish V52 (B09, B10, B11):** visual/a11y fixes; legal/support owner signoff; restore/rollback. B12/B13 цэгцлэлтийг зэрэгцүүлж болно, шинэ feature merge хийхгүй.
5. **R4 — Human payment handoff:** payment architecture/provider onboarding, verification/webhook idempotency, settlement/refund/tax review-ийг амьд хөгжүүлэгч хариуцна. Энэ аудит payment code бичихгүй, production deploy хийхгүй.

Шат бүр isolated branch + reviewable PR, зөвхөн тухайн ажлын тест, PR-head preview evidence-тай байна. Merge болон original Supabase apply, production publish нь энэ шатны автомат алхам биш.

## Энэ аудитын validation

- Local Node tests: **240/240 PASS**, audit-unit.log.
- Local typecheck: exit 0, audit-typecheck.log.
- Local configured lint: exit 0, audit-lint.log. Энэ нь repo-ийн бүх TSX файлын full lint биш.
- Local runtime build: **environment-blocked**, EPERM mkdir .next/server/app/api/beta. CI-ийн PASS-аар энэ орчны build-ийг pass болгож тайлагнаагүй.
- V52 CI, dc87af8: validate + messenger-browser + Pages PASS; Workers Builds + verify-preview FAIL.
- V53 CI, 36f0019: validate + messenger-browser + isolated postgres-security + Pages PASS; Workers Builds FAIL. V52 acceptance-д орлуулахгүй.
- Original DB: 27 public table RLS=true; 4 buckets private; metadata/advisors SELECT only.
- Browser LIVE: V52 manifest SHA, loaded catalog, opted-in seller profile, listing, Standard package price and login next-context, contact/support warning.
- Responsive: 390px home/listing overflow measurement, desktop homepage observation; authenticated matrix not executed.
- Хууль: Монгол Улсын Хүний хувийн мэдээлэл хамгаалах тухай хуулийн official source-ийг хайж шалгасан. Full legal compliance opinion биш; policy gaps нь repo-ийн өөрийн draft текстээр батлагдсан:
https://legalinfo.mn/mn/detail?lawId=16390288615991

## Гол эх сурвалж

- V52: https://github.com/dulguundalais/Hustle.mn/pull/67
- MN localization: https://github.com/dulguundalais/Hustle.mn/pull/68
- Main consolidation: https://github.com/dulguundalais/Hustle.mn/pull/69
- V52 CI: https://github.com/dulguundalais/Hustle.mn/actions/runs/40508147298
- Failed deployed smoke: https://github.com/dulguundalais/Hustle.mn/actions/runs/40508066105/job/122202419727
- V53 draft: https://github.com/dulguundalais/Hustle.mn/pull/70
- V53 CI: https://github.com/dulguundalais/Hustle.mn/actions/runs/40649188121
- V53 existing security work: https://github.com/dulguundalais/Hustle.mn/blob/feature/partner-self-service-v53-20261028/docs/V53-PARTNER-SECURITY-AUDIT.md
- Supabase: https://supabase.com/dashboard/project/pgrxsphkjudvfbpaudbd
- Repo source anchors: .github/workflows/beta-quality.yml; .github/workflows/preview-deployment-smoke.yml; qa/browser/support.mjs; lib/marketplace/client.ts; lib/site-information.ts; components/chat-safety.tsx; components/category-admin.tsx; components/service-category-fields.tsx; components/workspace.tsx; supabase/migrations/.

## Launch acceptance gate

B01–B11-ийн шалгуур биелж, release SHA ба DB migration set тогтмол болсон, бүх P1 хаагдсан, remaining P2 owner-reviewed байх хүртэл **NO-GO**. Build амжилттай эсвэл preview нээгдэх нь дангаараа launch permission биш. Payment readiness ба production publish-ийг хүн тусад нь шийднэ.
