# Rajasthan Kaam — Work · Learn · Grow

A mobile-first job and practical-learning platform for people from Rajasthan who want to work in established businesses in other Indian cities, learn how those businesses run, and make informed decisions about their future. Built from the concept note: transparent listings, verified employers, a "learn the business" differentiator, and trust & safety tooling.

**Stack:** Next.js 16 (App Router, server actions) · React 19 · Tailwind CSS 4 · SQLite (`better-sqlite3`) · Clerk (with a demo-auth bypass) · Vitest · Playwright

## Quick start

```bash
npm install
cp .env.example .env.local   # AUTH_BYPASS=true by default
npm run dev                  # http://localhost:3000
```

On first run (bypass mode) the database at `data/app.db` is created, migrated and seeded with demo employers, jobs, candidates, applications, a conversation, alerts and staff accounts. Re-seed with `npm run seed`. Use `/dev-login` to switch between demo users (candidate, employer, super admin, verifier, analyst).

## Auth: Clerk + bypass

* **Now (no keys):** `AUTH_BYPASS=true`. `/sign-in` and `/sign-up` redirect to `/dev-login`. A dark "Demo" strip shows while bypass is on.
* **With keys:** set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`, set `AUTH_BYPASS=false`, restart. Enable **Phone number (SMS code)** in the Clerk dashboard. New users choose Candidate/Employer on `/onboarding`; e-mails in `ADMIN_EMAILS` become super admins. Account deletion also deletes the Clerk user.
* All app code goes through `lib/auth.ts` (`getCurrentUser`, `requireUser(role)`, `requireAdmin(permission)`).

## What's inside

| Area | Routes |
| --- | --- |
| Public | `/` · `/jobs` (filters, trust ranking, “Notify me”) · `/jobs/[id]` (ledger of terms, listen-aloud, share with family, save offline, report) · `/employers/[id]` · `/safety` · `/letters` (verify an experience letter) · `/offline` |
| Candidate | `/candidate/profile` (full form or one-question-at-a-time mode) · `/candidate` (invitations, applications, work history & letters, saved, matches) · `/candidate/alerts` · `/feedback/[id]` |
| Employer | `/employer` (dashboard with views/applicants/expiry, renew, duplicate) · `/employer/jobs/[id]` (applicants, analytics, status, experience letters) · `/employer/candidates` (search & invite) · `/employer/profile` · `/employer/verification` |
| Everyone signed in | `/messages` (chat, masked calls, block) · `/notifications` · `/account` (language, WhatsApp/SMS, visibility, export, delete) |
| Admin | `/admin` pilot metrics + CSV exports · `/admin/analytics` funnel & web vitals · `/admin/employers` verification · `/admin/reports` complaints, flagged content, reviews · `/admin/jobs` bulk moderation · `/admin/users` suspend & staff roles · `/admin/audit` audit log |

### Trust & safety

* **Mandatory transparency:** salary, hours, weekly holiday and deductions are required; accommodation and training are shown as *confirmed by employer* only when the employer confirms them.
* **Verified ≠ guaranteed:** the stamp lists exactly which checks were done; verifiers must record ≥ 2.
* **Abuse protection:** per-user and per-IP rate limits (sign-up, apply, report, message, post, invite, alerts, calls); honeypot + signed form-timing token on public forms, plus Cloudflare Turnstile when keys are set; one account per mobile number; duplicate GST refused; same-phone employers flagged; repeated messages refused.
* **Scam detection** (`lib/moderation.ts`): listings mentioning registration/joining fees, advance money, UPI transfers or holding original documents are **held for review** and hidden; such chat messages are delivered with a warning; flagged reviews are hidden until moderated.
* **Privacy:** phone numbers are hidden from employers unless the candidate chooses to share; chat and masked calls work without them. Candidate search is opt-in, verified-employers-only, and shows only first name + initial. Users can export (JSON) or permanently delete their data.
* **Moderation loop:** report → moderator review → reporter is notified of the outcome; listings can be removed/restored (singly or in bulk) with the reason sent to the employer; users can be suspended; every staff and owner action is in the audit log.

### Staff roles

| Role | Can |
| --- | --- |
| super | everything, including staff roles |
| verifier | verify / reject / revoke employers |
| moderator | complaints, flagged content, reviews, listings, suspensions |
| analyst | read-only dashboards and CSV exports |

### Notifications, alerts & housekeeping

* Every event (new applicant, status change, message, invitation, report outcome, verification decision, alert match, expiring listing, 30/90-day check-in, experience letter) creates an in-app notification in the recipient's language, and is sent on **WhatsApp** (Cloud API template) and/or **SMS** (MSG91) when configured and opted in.
* Listings expire after 30 days (reminder 3 days before; one-click renew). Housekeeping runs in-process at most every 10 minutes, and `GET /api/cron/housekeeping` (with `Authorization: Bearer $CRON_SECRET`) is available for a real scheduler.

### Hindi & low-literacy support

Every candidate- and employer-facing screen is translated (admin tools are English). Employers can add Hindi versions of their free text; otherwise it is labelled "written in English". The one-question-at-a-time profile has large tap targets, read-aloud for every question (device text-to-speech) and voice typing (device speech recognition). Job pages have a "Listen" button that reads the terms aloud.

### Offline & performance

A service worker caches the app shell, recently viewed public pages and jobs the user explicitly saves for offline. Fonts are trimmed to the weights and scripts in use. Measured on throttled slow 3G (400 kbps, 4× CPU): job pages transfer ~470 KB (English) / ~640 KB (Hindi) on first visit; repeat visits load fonts and scripts from cache.

### Analytics & SEO

* First-party, cookie-less analytics (`/api/events`): page views, job views, searches, apply clicks, feature use and Core Web Vitals. No IPs, phone numbers or free text are stored; Do Not Track / Global Privacy Control are respected. Dashboard at `/admin/analytics`.
* `sitemap.xml`, `robots.txt`, canonical URLs, Open Graph metadata, `JobPosting` structured data on job pages (for Google job search), Organization/WebSite data on the home page, and generated share images for every job (what WhatsApp shows when a link is shared with family).

## Configuration

See `.env.example`. Everything optional degrades gracefully: without WhatsApp/MSG91 keys notifications stay in-app; without Exotel keys a "call" becomes a call request in the chat; without Turnstile keys the honeypot and timing token still apply.

## Testing

```bash
npm run typecheck
npm test              # 48 unit tests (Vitest): moderation, rate limits, tokens, alerts, housekeeping, search, data export/deletion, CSV, JSON-LD, i18n completeness
npm run build
npm run test:e2e      # 22 Playwright tests against a production build with a fresh database
```

The end-to-end suite covers simple-mode onboarding, applying with a hidden number, chat and masked-call requests, scam warnings, job alerts, employer verification checks, held scam listings, invitations, experience letters and public verification, bot/duplicate/report/suspension/role enforcement, data export and deletion, WCAG 2.1 AA checks (axe) in English and Hindi, SEO artefacts and offline mode. GitHub Actions (`.github/workflows/ci.yml`) runs all of it on every push and pull request.

## Deploying

The app is a PWA. Data lives in SQLite (`DATABASE_PATH`), so deploy to a host with a persistent disk (Fly.io, Railway, a VPS) — Vercel has no persistent disk, so `lib/db.ts` would need a hosted database first. In production set `AUTH_BYPASS=false`, the Clerk keys, `ADMIN_EMAILS`, `SITE_URL`, `APP_SECRET` and `CRON_SECRET`, and point a scheduler at `/api/cron/housekeeping`. Schema changes ship as forward-only migrations in `lib/db.ts`.

## Design

The visual language borrows from the *bahi-khata* (the red cloth ledger every Marwari business keeps) and Rajasthani craft: Cormorant Garamond, Tiro Devanagari Hindi and Mukta; paper, sindoor, haldi, neel and peacock colours; hand-built leheriya, bandhani, block-print, jharokha, seal and stamp motifs (`components/ornaments.tsx`); and a custom line-icon set (`components/icons.tsx`) instead of emoji.

## Scripts

`npm run dev` · `npm run build` · `npm start` · `npm run seed` · `npm run typecheck` · `npm test` · `npm run test:e2e`
