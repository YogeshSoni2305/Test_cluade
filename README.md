# Rajasthan Kaam — Work · Learn · Grow

A mobile-first job and practical-learning platform for people from Rajasthan who want to work in established businesses in other Indian cities, learn how those businesses run, and make informed decisions about their future. Built from the concept note: transparent listings, verified employers, a "learn the business" differentiator, and trust & safety tooling.

**Stack:** Next.js 16 (App Router, server actions) · React 19 · Tailwind CSS 4 · SQLite (`better-sqlite3`) · Clerk (with a demo-auth bypass)

## Quick start

```bash
npm install
cp .env.example .env.local   # AUTH_BYPASS=true by default
npm run dev                  # http://localhost:3000
```

On first run (bypass mode) the SQLite database at `data/app.db` is created and seeded with demo employers, jobs, candidates, applications and a report. Re-seed anytime with `npm run seed`.

## Auth: Clerk + bypass

* **Now (no keys):** `AUTH_BYPASS=true`. `/sign-in` and `/sign-up` redirect to `/dev-login`, where you can continue as any demo user (candidate / employer / admin) or create a fresh test account. A yellow banner shows while bypass is on.
* **Later (keys arrived):** put `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` in `.env.local`, set `AUTH_BYPASS=false`, restart. Clerk's `<SignIn/>`/`<SignUp/>` and `clerkMiddleware` (in `proxy.ts`) take over. In the Clerk dashboard enable **Phone number (SMS code)** for phone-first sign-up. New Clerk users choose Candidate/Employer on `/onboarding`; e-mails listed in `ADMIN_EMAILS` (or `publicMetadata.role = "admin"`) become admins.
* All app code goes through `lib/auth.ts` (`getCurrentUser`, `requireUser(role)`), so switching modes needs no other changes.

## What's inside

| Area | Routes |
| --- | --- |
| Public | `/` landing (goal picker, trust pledge, Hindi/English toggle) · `/jobs` discovery with filters & trust-based ranking · `/jobs/[id]` full transparent listing · `/employers/[id]` · `/safety` · `/jobs/[id]/report` |
| Candidate | `/candidate/profile` (no résumé) · `/candidate` dashboard: applications timeline, saved jobs, explainable matches · `/feedback/[applicationId]` |
| Employer | `/employer` (landing or dashboard) · `/employer/profile` · `/employer/verification` · `/employer/jobs/new` · `/employer/jobs/[id]` (applicants, status, mark filled) |
| Admin | `/admin` pilot metrics · `/admin/employers` verification checklist · `/admin/reports` complaints & review moderation · `/admin/jobs` |

### Principles implemented from the concept note

* **Transparency is mandatory:** listings can't be published without salary, hours, weekly holiday and explicit deductions; deposits trigger a warning for candidates.
* **No unconfirmed claims:** accommodation and "what you can learn" show *Confirmed by employer* only if the employer ticked the confirmation.
* **Verified ≠ guaranteed:** the Verified badge lists exactly which checks were done (identity, GST, address, phone); admins must tick ≥ 2.
* **Not salary-only ranking:** default sort is trust + a 0–10 *Clarity* score; salary, newest and most-to-learn sorts are available.
* **Learning path:** skills per industry grouped in three stages (Foundation → Operations → Business) with a disclaimer against guarantees.
* **Privacy:** phone numbers are shown to an employer only after the candidate applies; family sharing is an explicit WhatsApp share button.
* **Safety loop:** report → admin review → resolve/remove listing; moderated reviews; no candidate fees.
* **Pilot metrics:** interview rate, hires, 30/90-day retention, listing accuracy, complaints.

## Testing

`e2e/flow.cjs` drives the whole product in a browser (candidate sign-up → apply → report; employer status update and job posting with validation; admin verification; feedback; mobile + Hindi). With a fresh DB and the server running (`npm run build && npm start -p 3100`), run `NODE_PATH=$(npm root -g) npm run e2e` (needs Playwright installed globally).
Clerk mode was smoke-tested with placeholder keys: public pages render, `/dev-login` returns 404, and `/candidate`, `/employer/*`, `/admin` redirect to Clerk sign-in.

## Deploying

The app installs as a PWA (`/manifest.webmanifest`). Data lives in a SQLite file (`DATABASE_PATH`, default `data/app.db`), so deploy to a host with a persistent disk (Fly.io, Railway, a VPS). Serverless hosts such as Vercel have no persistent disk; move `lib/db.ts` to a hosted database (Postgres/Turso) before deploying there. In production, set `AUTH_BYPASS=false`, add the Clerk keys and `ADMIN_EMAILS`, and run `npm run seed` only if you want demo data.

## Scripts

`npm run dev` · `npm run build` · `npm start` · `npm run seed` · `npm run typecheck`
