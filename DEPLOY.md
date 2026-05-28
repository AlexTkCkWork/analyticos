# Deploying AnalyticOS

A click-through guide for self-hosting your own instance on **Vercel + Neon + Upstash**. End to end, this takes ~20 minutes and costs **$0** on free tiers (see [README — Tech stack](README.md#tech-stack) for the per-service free-tier details).

> This guide assumes you've forked or cloned the repo and have a working local setup ([README — Getting started](README.md#getting-started-local)). If you haven't run the app locally yet, do that first — a broken local build is much easier to diagnose than a broken cloud deploy.

## Table of contents

- [Phase 0 — Pre-flight](#phase-0--pre-flight-local-checks)
- [Phase 1 — Provision data services](#phase-1--provision-data-services)
- [Phase 2 — Push the schema to production](#phase-2--push-the-schema-to-production)
- [Phase 3 — GitHub OAuth (optional)](#phase-3--github-oauth-optional)
- [Phase 4 — Vercel: project + environment variables](#phase-4--vercel-project--environment-variables)
- [Phase 5 — Deploy](#phase-5--deploy)
- [Phase 6 — Smoke-test the live instance](#phase-6--smoke-test-the-live-instance)
- [Phase 7 — Demo data (optional)](#phase-7--demo-data-optional)
- [Phase 8 — Optional hardening](#phase-8--optional-hardening)
- [Two things most likely to trip you up](#two-things-most-likely-to-trip-you-up)

---

## Phase 0 — Pre-flight (local checks)

Before touching any cloud service.

- [ ] **Strip any temporary debug code** from your working tree — e.g. `await new Promise(r => setTimeout(r, …))` used to inspect loading skeletons, `console.log`s you don't want in production, etc.
- [ ] **Confirm secrets aren't committed.** `.env.local` must be gitignored (the default Next.js `.gitignore` already does this). Sanity check:
  ```bash
  git ls-files | grep -E '^\.env'
  ```
  Expected output: nothing, or only `.env.example`.
- [ ] **Build locally** — this catches production-only build errors before Vercel does:
  ```bash
  npm run typecheck
  npm run build
  ```
  Fix anything that fails. The edge `/api/collect` route in particular is worth confirming builds clean.
- [ ] **Pick a Vercel project name.** This determines your production URL (`https://<name>.vercel.app`). You'll need it for env vars in Phase 4, so decide it now.

---

## Phase 1 — Provision data services

### Neon (Postgres)

- [ ] Create a Neon project (or, if you already have one for dev, create a **separate branch** for production).
- [ ] Copy the production connection string. The app uses the Neon HTTP driver, so the standard connection string is fine — you don't need a special pooled URL.
- [ ] **Do not** reuse your dev branch for production.

### Upstash (Redis)

- [ ] Create an Upstash Redis database.
- [ ] Copy the **REST URL** and **REST token** (not the `redis://` URL — this app uses the HTTP API).

---

## Phase 2 — Push the schema to production

The Neon prod branch is empty. Drizzle's `db:push` will create the tables, but `drizzle.config.ts` reads the DB URL from `.env.local`, so you need to point it at prod temporarily.

**Safest method — temporarily swap `.env.local`:**

1. Open `.env.local` and change `DATABASE_URL` to your production Neon string.
2. Run:
   ```bash
   npm run db:push
   ```
3. **Immediately revert** `.env.local` back to your dev `DATABASE_URL`.

> Don't skip the revert. Forgetting it means your local dev writes against the production database — exactly the failure mode this app is designed to prevent.

Verify with Neon's table browser (or `npm run db:studio` while still pointed at prod) — all six tables should exist.

---

## Phase 3 — GitHub OAuth (optional)

GitHub sign-in is optional; credentials (email/password) login works without it. Skip this phase entirely if you don't want GitHub OAuth in production.

If you do want it:

- [ ] Create a **new** OAuth App at <https://github.com/settings/developers>. (A GitHub OAuth App permits only **one** callback URL, and your dev app likely uses `localhost` — so production needs its own.)
- [ ] **Authorization callback URL:** `https://<your-project>.vercel.app/api/auth/callback/github`
- [ ] Copy the **Client ID** and generate a **Client Secret**. You'll set both in Phase 4.

---

## Phase 4 — Vercel: project + environment variables

- [ ] In Vercel, import the GitHub repo. Vercel auto-detects Next.js — no build config needed.
- [ ] Generate a fresh production `AUTH_SECRET`:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
  ```
- [ ] In **Settings → Environment Variables**, add the following (scope: **Production**, and also **Preview** if you want preview deployments to fully work):

| Variable | Value | Notes |
|---|---|---|
| `DATABASE_URL` | Neon **prod** connection string | |
| `AUTH_SECRET` | the freshly generated value | **NEW**, not your dev secret. Keep stable once production is live — it salts the visitor hash. |
| `AUTH_URL` | `https://<your-project>.vercel.app` | |
| `AUTH_TRUST_HOST` | `true` | Required behind Vercel's reverse proxy |
| `NEXTAUTH_URL` | `https://<your-project>.vercel.app` | Legacy alias; mirror `AUTH_URL` |
| `NEXT_PUBLIC_APP_URL` | `https://<your-project>.vercel.app` | **Build-time inlined** — must be correct before the build; drives the tracking snippet |
| `UPSTASH_REDIS_REST_URL` | prod Upstash REST URL | |
| `UPSTASH_REDIS_REST_TOKEN` | prod Upstash REST token | |
| `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` | prod OAuth credentials | Only if Phase 3 done |

- [ ] **Do NOT** set `AUTH_DEBUG` in production.

---

## Phase 5 — Deploy

- [ ] Push to your default branch (or trigger Vercel's "Deploy" button). Vercel builds and ships.
- [ ] Watch the build logs. If it fails on a missing env var or edge incompatibility, fix and redeploy.
- [ ] **`NEXT_PUBLIC_APP_URL` gotcha:** because this variable is inlined at build time, the *first build is the one that matters*. If you ever change your production URL (e.g., add a custom domain), update the variable **and trigger a rebuild** — a redeploy of the same artifact won't apply the new value.

---

## Phase 6 — Smoke-test the live instance

Walk the full flow against your production URL:

- [ ] Landing page renders at `/`.
- [ ] **Register** a new account → lands inside the dashboard. No `AdapterError` in Vercel logs.
- [ ] Inspect Neon's `sessions` table — there should be a session row (this proves the Credentials + database-session integration is working in production).
- [ ] **Create a project** → redirected to its dashboard.
- [ ] **Settings page** → the tracking snippet shows your **production** URL in `src=` (confirms `NEXT_PUBLIC_APP_URL`).
- [ ] **Test ingestion.** Either:
  - Embed the snippet on a real page and visit it, or
  - POST to `/api/collect` directly with a real-browser User-Agent.
  A `pageviews` row should appear, with `country` now **populated** (the `x-vercel-ip-country` header works in production, unlike on localhost where it's always `null`).
- [ ] **Dashboard renders** the data; date-range picker works; sidebar lists your projects.
- [ ] **Sign out** → redirected to login; session row is removed from the DB.

If all of the above pass, your production deploy is functional.

---

## Phase 7 — Demo data (optional)

If you're hosting this as a public demo, an empty dashboard kills the first impression. Two complementary approaches:

1. **Seed historical data.** A standalone script (`scripts/seed-demo.ts`, not included by default) that inserts a few weeks of realistic-distribution pageviews into a demo project. Run once against production after deploy.
2. **Dogfood live traffic.** Embed the snippet on your deployed landing page itself, pointing at a "AnalyticOS" demo project. The dashboard then literally shows live traffic to your own site.

Combine for the best demo: seeded history + live self-tracking going forward. For a forced-into-demo UX, add a "View demo" button on the landing that signs the visitor into a pre-seeded demo account via a Server Action.

---

## Phase 8 — Optional hardening

Once the basic deploy is solid, these are the items worth doing in roughly this order:

- [ ] **Custom domain.** Add it in Vercel → Settings → Domains. Free — you just pay for the domain registration itself.
- [ ] **Daily re-seed cron** (only if you run a public demo). Vercel Cron + a small route that wipes the demo project's data and reseeds it — keeps the demo clean against visitors who delete things.
- [ ] **`localhost` skip in `public/script.js`** — production sites shouldn't track dev traffic. Add an early-return when `location.hostname === 'localhost'`.
- [ ] **CI workflow** (GitHub Actions: `typecheck` + `lint` on every PR). Green checks on the repo signal discipline.
- [ ] **Per-account brute-force tracking** — IP-based failure tracking is already in place ([`src/lib/auth.ts`](src/lib/auth.ts) → `authorize`). Per-email tracking is the natural next layer for distributed credential stuffing.
- [ ] **SPA route tracking in the script** — hook `history.pushState` / `popstate` to re-fire the beacon on client-side navigation.

---

## Two things most likely to trip you up

1. **`NEXT_PUBLIC_APP_URL` is build-time.** Set it correctly *before* the first production build. Changing it later requires a rebuild, not just a redeploy of the existing artifact.
2. **`db:push` against prod + forgetting to revert `.env.local`.** Swap → push → swap back, immediately. Leaving `.env.local` pointed at prod means every local dev run writes against the production database.

---

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| Login throws `AdapterError` | Schema not pushed to the production DB (Phase 2 skipped), or `AUTH_SECRET` missing |
| Tracking snippet's `src` shows the wrong URL | `NEXT_PUBLIC_APP_URL` was changed *after* the build — rebuild required |
| GitHub login redirects to `redirect_uri is not associated with this application` | Phase 3: the OAuth App's callback URL doesn't match your deployed URL. Either update it or create a separate prod OAuth App |
| `country` is always `null` in `pageviews` | Expected on localhost; only Vercel's edge network sets the `x-vercel-ip-country` header |
| Auth fails on Vercel but works locally | Set `AUTH_TRUST_HOST=true` — required behind Vercel's reverse proxy |
| Dashboard shows stale data after creating a pageview | The Redis dashboard cache (60s TTL) — wait it out or change the date range to bust the cache key |

For anything not covered here, open an issue on the repo with the Vercel build/runtime logs.
