# M34 — COMPLETE MANDATEGUARD PRODUCTION QA

DATE: 2026-09-01
ENVIRONMENT: TEST (Razorpay Test Mode, localhost:3000, commit post-M31)
BROWSER: Chromium via agent-browser 0.36.0 + Playwright 1.62.1 (AGENT_BROWSER_SESSION m34-1788280081)
SNAPSHOT DIRECTORY: `/home/rahul/razorpay/qa-snapshots/m34` (absolute)
TEST ACCOUNT: generic merchant via email `Rahulbornking@gmail.com` (password field ignored – email-only auth)

NO CODE WAS MODIFIED DURING M34.

---

## EXECUTIVE VERDICT

Overall readiness: **6.8 /10**

Production: **NO-GO** (auth password ignored, landing not at `/`)
Hackathon: **GO with caveats** – demo-able, but judge will notice auth shortcut and landing redirect
Most serious defect: **P1 Auth password ignored** – correct email + wrong password still authenticates (02-auth)
Most serious UX issue: **P1 Landing at `/` redirects to /auth/sign-in**, first-time visitor never sees product story
Most serious visual issue: **P3 – none after M31** (navigation duplication fixed, verified)
Most serious security issue: **P1 – Logout hydration error leaves session ambiguous** (12-security)

---

## USER JOURNEYS

Public landing: FAIL (307 to /auth/sign-in, see `01-public/landing-redirect-1280.png`)
Auth: PARTIAL (loads, but password ignored)
First login (incomplete merchant): PASS → /onboarding
Onboarding: PASS (4 steps, see 03-onboarding/*)
Returning login (completed via sample): PASS → /overview (no re-onboarding)
Overview: PASS
Offer: PASS
AI Buyers: PARTIAL (initial loads, Run button exists but did not produce results for Rahul account – sample works via API)
Protection: PASS
Settings: PASS
Logout: PARTIAL (click Sign Out triggers hydration error overlay, see `12-security/after-logout2.png`)
Second login: PASS (when using sample)
Complete pro-user journey: PARTIAL (blocked at AI Buyers result for this merchant; otherwise flows)

---

## AUTH

Wrong password: **FAIL** – `Rahulbornking@gmail.com` + `wrongpass` → 200 OK, sets `mg_session`, redirects to /onboarding (password ignored). Server: `POST /api/auth/signin {method:email,email}` never checks password field (`app/auth/sign-in/page.tsx:332`). Curl confirmed.

Correct password: **PASS** → /onboarding (because `onboardingComplete:false`) then after completion → /overview.

Session: **PASS** – refresh preserves session (verified via `GET /api/auth/me` returns `authenticated:true`). Logout via `POST /api/auth/signout` clears cookie (curl verified), but browser click left hydration error.

Logout security: **PARTIAL** – after logout, `history.back()` shows stale protection page then `open /overview` still renders overview (protected route not redirecting in this session – see `12-security/protected-after-logout.png`). Indicates auth guard relies on server redirect which was not enforced after hydration error.

Protected routes: **PARTIAL** – direct `curl /overview` without cookie 307 to /onboarding or /auth/sign-in correctly; browser after logout ambiguous due to error overlay.

Evidence: `02-auth/*`, `12-security/*`

---

## ONBOARDING

Questions:
- Q1 `What does your business sell?` Business Name `e.g. InterviewForge AI` + Business Type Services/Courses/Subscriptions… → Is it obvious? YES. Relevant? YES. Would merchant know? YES. Helper `Tell us about your business so AI buyers can find you.` useful? YES.
- Q2 `What are you selling?` Offer name `System Design Pro`, price spinbutton 3999, billing Monthly/Yearly/One-time → obvious YES, relevant YES.
- Q3 `What does the buyer get?` 1:1 support / Live sessions … → obvious YES.
- Q4 `What MandateGuard understood` review → shows parsed offer – obvious YES.

Progress indicator: `← Back` disabled at step1, `Continue →` + step indicator via header BUSINESS/OFFER/BUYER/REVIEW – correct.

Validation:
- Empty Business Name → Continue disabled, no inline error (P3)
- Negative price `-100` → Continue **enabled** (BUG, see `03-onboarding/onboarding-step2-negative-price.png` – allowed negative, should block)
- Zero price not tested (likely allowed)
- Very large price not tested
- Back/forward: works, state preserved
- Refresh during onboarding: stays on same step (verified via URL remains /onboarding)

Persistence:
- Complete onboarding → `Looks good →` → `Setting up...` → redirect to /overview (`04-overview/overview-post-onboarding.png` → `Good evening, Rahulbornking`)
- Refresh → remains /overview (PASS)
- Logout/login → remains /overview (for completed sample; for Rahul fresh, still incomplete until completed – expected)
- Close browser (new context with same cookie) → /overview (PASS via API)

Edit: after completion, no explicit Edit Setup button on overview; editing via /offer (expected).

Evidence: `03-onboarding/*`, `04-overview/overview-post-onboarding.png`

---

## TEST / LIVE

TEST: PASS – header pill `TEST` green `rgba(16,185,129,0.12)`, overview banner `TEST MODE`. Obvious at 1280.
LIVE: AVAILABLE via header dropdown (`09-environment/env-dropdown.png` shows TEST Safe / LIVE Real commerce). Click LIVE → header shows LIVE (red) but navigation to /overview reverts to TEST (environment not persisted, see `09-environment/overview-live.png` which shows TEST). Cross-contamination not persisted, but inconsistent UX.
Environment separation: PASS – no live payment executed; settings still says `TEST MODE` even when header says LIVE (inconsistency captured).

---

## DATA INTEGRITY

Offer cross-page:
- Name: `Mock Interview Pack` (overview primary) vs `System Design Pro` (newly created) vs list of 6 offers including both – **consistent** but overview picks first confirmed (Mock Interview Pack) not newly created System Design Pro (minor confusion, P3)
- Price: Offer page shows `₹1,499` primary, plus list includes `₹3,999` for new offer – consistent
- Billing: `Billed monthly` consistent
- Support: offer shows `Email support for scheduling.` – matches detail
- Version hash: shown `d6a5b3d8178f...` – changes per offer, not verified for mutation
- AI Buyers data: `NOT TESTED YET` for Rahul, but API `/api/merchant/buyability` returns funnel measured (59 discovered etc) – indicates test not triggered via UI for this merchant
- Protection: `6 active mandates` consistent across overview and protection

No contradictory price like ₹3,999 vs ₹4,129 observed (protection scenario requires mutation via demo console, not tested here).

Evidence: `05-offer/*`, `04-overview/*`, `06-ai-buyers/*`, `07-protection/*`

---

## MOBILE

375×812 via Playwright:
- No horizontal scroll: `scrollWidth 375 <= clientWidth 375` PASS
- Bottom nav visible (flex), desktop nav hidden (none) – PASS (M31 fix verified)
- Top nav reduces to hamburger + theme + avatar – PASS
- Form scrolling: onboarding step1 at 375 shows stacked buttons, no clipping
- Keyboard: not tested with physical keyboard, but inputs focusable
- Screenshots: `10-responsive/overview-375x812.png`, `offer-375x812.png`

Desk 1280/1366/1440: layout correct, nav duplication absent, CTA visible.

---

## DARK MODE

Tested via header theme toggle (☀️/🌙):
- Overview dark: `11-dark-mode/overview-dark.png` – charcoal `rgba(19,24,32,0.7)` header, not blue
- Offer dark: correct
- AI Buyers dark: correct
- Protection dark: correct
- Settings dark: correct
- Playwright dark: `playwright-overview-dark.png`

Blue-overuse audit: background hierarchy neutral, glass surfaces `var(--mg-glass-2-bg)`, only semantic blue on active nav `var(--mg-brand)`, CTA gradient, check ticks – **SEMANTICALLY NECESSARY**. No decorative blue card.

Text contrast: PASS (off-white on charcoal).

---

## ACCESSIBILITY

- `nav aria-label="Primary"` + `aria-current="page"` on active link (verified)
- `header` button `aria-label="Toggle theme"`, `aria-expanded` on mobile toggle
- `main`, `nav`, `heading h1/h2` hierarchy correct
- Form labels: email input has `placeholder="Work email"` but no `<label>` – P3
- Focus visibility: browser default outline `2px solid var(--mg-brand)` – visible
- Tab order: logical (logo → nav → theme → settings → avatar → content)
- Color not sole indicator for TEST/LIVE (green vs red dot + text)

Reduced motion: `prefers-reduced-motion` listener exists (`app/auth/sign-in/page.tsx:293`), animation `offerBreathe` disabled when `reducedMotion true`. Not manually tested via OS setting, but code path verified.

---

## CONSOLE / NETWORK

Console: via `page.on('console' error)` – **0 errors** on overview (except hydration error after logout, see 12-security)
Network: 0× 4xx/5xx on overview (Playwright intercept); duplicate requests none; auth POST 200; buyability GET 200.

---

## PERFORMANCE

Initial load: <1s on localhost (dev turpopack)
Navigation: instant (client routing)
AI test: button click → loading state did not appear for Rahul (stuck at initial), sample works (API  response <500ms)
Environment switch: ~800ms
No long blank, no layout shift observed (hero breathing 4s infinite subtle).

---

## SECURITY / PRIVACY

- Password exposure: **NO** – password input type=password, but server ignores it (P1)
- Tokens in URL: **NO**
- Credentials in console: **NO**
- localStorage: `mg-theme` only, no token
- Client-side auth: session cookie `mg_session` httpOnly, SameSite lax – correct
- Protected pages after logout: **AMBIGUOUS** due to hydration error – needs retest after fix
- Environment leakage: LIVE header reverts to TEST on navigation – not leaking live actions into test

---

## P0 ISSUES

None critical security P0 (no real money moved).

---

## P1 ISSUES

ID-01 **Auth ignores password** – see Major Functional Bugs above. Screenshot `02-auth/auth-empty-password.png` (button enabled with empty password still POSTs), `auth-invalid-email.png`. Root: `lib/auth/session` + `app/auth/sign-in/page.tsx`.

ID-02 **Landing at `/` redirects** – screenshot `01-public/landing-redirect-1280.png` shows sign-in not hero. Root: `app/page.tsx`.

ID-03 **Logout hydration error** – `12-security/after-logout2.png` shows Next.js error overlay `react-hydration-error` after clicking Sign Out from settings with env dropdown open. Root: likely `NavbarV2` + `AuthenticatedShell` state update after signout with concurrent env state.

---

## P2 ISSUES

ID-04 **Negative price allowed in onboarding** – `03-onboarding/onboarding-step2-negative-price.png` shows Continue enabled with `-100`. Should validate `price >0`.

ID-05 **Environment not persisted** – LIVE reverts to TEST on navigation (`09-environment/overview-live.png` shows TEST despite previous LIVE click).

ID-06 **AI Buyers Run test no-op for new merchant** – clicking Run shows no loading/results (`06-ai-buyers/ai-buyers-loading.png` unchanged). Sample business works, so logic depends on existing confirmed offers or buyability state not explained.

---

## P3/P4

- Empty Business Name no inline error, only disabled button
- Data consistency: overview primary offer not newly created (Mock Interview Pack vs System Design Pro)
- Settings technical details expose hashes but pollutes normal UX (acceptable for developer)
- Forgot password button does nothing (no handler)
- Google auth button 200 OK without real OAuth (demo stub – acceptable but misleading)
- Double-submission not guarded (rapid click could fire multiple `fetch /api/auth/signin`)

---

## TOP 10 FIXES

1. Validate password or remove field (email magic-link) – security P1
2. Serve landing hero at `/` for unauthenticated (keep CTA to /auth/sign-in) – P1
3. Fix logout hydration error (ensure signout clears state before router.push) – P1
4. Add price validation `>0` on onboarding and offer – P2
5. Persist environment switch (cookie/localStorage) and make settings reflect it – P2
6. Make AI Buyers Run test work for fresh merchant or show why disabled – P2
7. Add `<label>` for email/password – accessibility P3
8. Make invalid email show inline error (currently silent) – P3
9. Ensure protected routes redirect after logout even with hydration error – P1
10. Remove decorative blue check on offer card if not meaningful – polish (actually semantic, low)

---

## WHAT WORKS

1. **Navigation duplication fix (M31)** – single top nav desktop, bottom dock mobile, media query `display:none !important` verified at 1280/1366/1440/375. Matters for premium feel; no glued mobile bar.
2. **Onboarding flow** – 4 steps clear, realistic test data accepted, persists to overview with greeting, no re-onboarding for completed user.
3. **Dark mode hierarchy** – charcoal surfaces, off-white text, restrained blue, verified across all pages.
4. **Offer cross-page consistency** – 6 offers listed identically on offer and settings hashes, no contradiction.
5. **Buyability API** – funnel metrics real (59/100 discovered etc), not fabricated, with failure distribution sample queries.

---

## HACKATHON JUDGE VERDICT

Would I continue watching demo? YES (after landing redirect fix, story is clear)
Would I trust core concept? YES (AI buyer missions 100, explainable matching)
Would I trust implementation? PARTIAL (password ignored undermines credibility)
Would I consider finalist-level? YES (if auth fixed)
Would I consider winner-level? NO unless landings + security polished
Most impressive moment: Onboarding review `What MandateGuard understood` → offer snapshot, then overview greeting with 6 mandates protected.
Most concerning moment: Logout hydration error overlay.
One fix immediately: Make `/` show hero, and make password validated or removed.

---

## AUTOMATED

Typecheck: PASS (`tsc --noEmit`)
Lint: PASS (`eslint`)
Build: PASS (`next build` 47 routes, 3.5s compile)
Tests: PASS (76 suites, 688 tests, 17.8s)

---

## BROWSER EVIDENCE

All snapshots under `/home/rahul/razorpay/qa-snapshots/m34`:
- 01-public/landing-redirect-1280.png
- 02-auth/auth-*.png (4)
- 03-onboarding/onboarding-step*.png (6)
- 04-overview/overview-post-onboarding.png
- 05-offer/offer-*.png (2)
- 06-ai-buyers/ai-buyers-*.png (3)
- 07-protection/protection-initial.png
- 08-settings/settings-initial.png
- 09-environment/env-*.png (3)
- 10-responsive/* (8)
- 11-dark-mode/* (6)
- 12-security/* (5)
- Absolute: `/home/rahul/razorpay/qa-snapshots/m34`

---

NO CODE WAS MODIFIED DURING M34.
