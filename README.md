# AnalyticOS

![CI](https://github.com/AlexTkCkWork/analyticos/actions/workflows/ci.yml/badge.svg)

A privacy-first, cookieless web analytics platform — a self-hostable, open-source alternative to Google Analytics in the spirit of Plausible/Fathom. Embed a sub-kilobyte script on your site; see pageviews, unique visitors, top pages, referrers, devices, and geography in a fast dashboard. No cookies. No consent banner. No tracking across days.

> **Live demo:** [analyticos-nu.vercel.app](https://analyticos-nu.vercel.app)
> **Author:** Oleksii Tkachenko ([@AlexTkCkWork](https://github.com/AlexTkCkWork))
> **License:** AGPL-3.0-or-later

---

## Table of contents

- [Why AnalyticOS](#why-analyticos)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Key engineering decisions](#key-engineering-decisions)
- [Getting started (local)](#getting-started-local)
- [Self-hosting](#self-hosting)
- [Project structure](#project-structure)
- [Scripts](#scripts)
- [Status & scope](#status--scope)
- [Contributing](#contributing)
- [License](#license)

---

## Why AnalyticOS

Most web analytics tools force a tradeoff between **insight** and **privacy**. Google Analytics gives you everything — at the cost of cookies, persistent identifiers, GDPR overhead, consent banners, and a 50KB+ tracking script that hurts your page-speed budget.

AnalyticOS deliberately refuses that tradeoff. It collects only what a site owner actually needs to make decisions, identifies visitors with a server-side daily-salted hash that resets every day, and ships a tiny edge-served script that fires once and disappears. The architecture is built around the constraint *"we never know who anyone is across days"* — and proves you can still produce a useful analytics product within it.

The project is also a deliberate exercise in production-grade engineering: edge runtime, defense in depth, IDOR-safe data access, type-safe end-to-end, and a deliberate Server/Client component boundary. See [Key engineering decisions](#key-engineering-decisions) for the substance.

---

## Features

- **Dashboard per project** — total pageviews and unique visitors, time series, top pages, top referrers, breakdowns by device, browser, OS, and country
- **Date range picker** — named periods (Today / 7d / 30d / 90d) plus custom from–to range, all reflected in URL params (bookmarkable, shareable)
- **Multi-project** — create as many sites as you like; per-project public keys; type-the-domain-to-confirm deletion
- **Tracking script** — ~1KB, fire-and-forget, runs `defer` so it never blocks page render, uses `navigator.sendBeacon` (with `fetch+keepalive` fallback)
- **Server-side bot filtering** — known crawlers, AI bots, and CLI clients are detected and dropped before the DB write
- **Auth** — email/password (bcrypt) and GitHub OAuth, with database-backed sessions (server-side invalidation possible)
- **Privacy by design** — no cookies, no localStorage, no persistent visitor ID. Daily-rotating SHA-256 hash means cross-day tracking is mathematically impossible

---

## Tech stack

Every choice is justified — see [Key engineering decisions](#key-engineering-decisions) for the longer reasoning behind several of these.

| Layer | Tech | Why |
|---|---|---|
| Framework | **Next.js 16** (App Router) | Server Components, Server Actions, edge runtime, file-system routing |
| Language | **TypeScript** | End-to-end type safety; schema-derived types ([§ Types](#types-organization)) |
| Database | **Neon** (serverless Postgres 17) | HTTP driver works on edge runtime; instant branching for dev/test/prod |
| ORM | **Drizzle ORM** | Type-safe, no codegen, edge-compatible, ~35KB |
| Auth | **Auth.js v5** (beta) | App Router-native; supports database session strategy and OAuth |
| Cache & rate-limit | **Upstash Redis** (HTTP) | Works on edge runtime; free tier; clean Ratelimit primitives |
| Validation | **Zod v4** | Runtime validation + type inference |
| UI | **shadcn/ui** (`base-nova` style) on **@base-ui/react** | Production-grade, you own the source |
| Styling | **Tailwind CSS v4** | Modern CSS-first config with theme tokens |
| Charts | **Recharts** | React-native, declarative; theming via CSS variables |
| Forms | **react-hook-form** + Zod resolver | Field-level validation, minimal re-renders |
| IDs | **CUID2** | Non-enumerable, collision-resistant, URL-safe |
| UA parsing | **ua-parser-js v2** | Edge-compatible; bot/crawler detection module |
| Password hashing | **bcryptjs** | Industry standard, cost factor 12 |
| Deploy | **Vercel** | Edge network, serverless functions, automatic preview deployments |
| CI | **GitHub Actions** | Typecheck + lint on every PR |

---

## Architecture

### Two actors, two trust models

AnalyticOS serves two completely different kinds of traffic, and the architecture reflects that:

| Actor | What it does | Trust | Identified by | Rate limited by |
|---|---|---|---|---|
| **Dashboard user** | Logs in, manages projects, views analytics | Authenticated, high trust | Session token (database-backed) | User ID |
| **Tracking script** | Anonymous beacons from random visitors on third-party sites | Untrusted | Project public key only | IP address |

The two flows share a database but almost nothing else — different routes, different runtimes, different rate-limit buckets, different validation surfaces.

### Request flow — tracking pixel

```
Visitor's browser (on customer's site)
      |
      |  1. <script defer data-key="..." src="/script.js">
      v
AnalyticOS edge (serves script.js)
      |
      |  2. script reads data-key, derives endpoint from its own src,
      |     gathers location.pathname + document.referrer,
      |     sends via navigator.sendBeacon (text/plain → no CORS preflight)
      v
AnalyticOS /api/collect (edge runtime)
      |
      |  3. Zod-validate payload
      |  4. Bot filter (ua-parser-js bot-detection submodule)
      |  5. Resolve publicKey -> projectId (DB lookup)
      |  6. Enrich: parse UA -> browser/os/device,
      |             read x-vercel-ip-country -> country,
      |             compute visitorHash (SHA-256 with daily-rotating salt),
      |             clean URL (origin + pathname only)
      |  7. Insert pageview row
      v
Neon Postgres (`pageviews` table)
```

Everything but the DB insert runs on edge. The script, the validation, the enrichment, the bot filter, and the hash computation all happen close to the visitor.

### Request flow — dashboard

```
Browser (authenticated user)
      v
Middleware (edge): rate-limit by user ID, infer auth via JWT cookie
      v
Dashboard layout (Server Component): session guard + fetch user's projects
      v
Project page (Server Component): parse date range from URL,
                                  fetch 8 analytics queries in parallel,
                                  cached as one bundle in Redis (60s TTL),
                                  pass plain data down to charts
      v
Chart components (Client): render SVG (Recharts), handle interactivity
```

Server Components do all the data work. The only client JS shipped for the dashboard is Recharts itself, hydrated for the one interactive chart.

### Privacy model

The visitor identifier is recomputed every day:

```
visitorHash = SHA-256( ip : userAgent : projectId : YYYY-MM-DD : AUTH_SECRET )
```

Properties:

- **Counts unique visitors within a day.** The same person hitting the site three times in one day produces the same hash three times → counted once.
- **Cannot track across days.** The `YYYY-MM-DD` component changes; the same person tomorrow produces a different hash. No persistent identifier exists, even on the server.
- **Cannot be reversed.** The `AUTH_SECRET` salt prevents an attacker who knows IP+UA+projectId+date from precomputing the hash.
- **Scoped per project.** Two different customer sites can't correlate the same visitor.

This is the foundation of being cookieless and consent-banner-free: there is no persistent identifier to consent to.

---

## Key engineering decisions

This section captures the *why* behind the non-obvious choices in the codebase. It's the most useful part of this README for engineers reviewing the project.

### 1. Auth.js Credentials + database sessions via `jwt.encode` override

Auth.js v5's Credentials provider doesn't natively integrate with the database session strategy — by design, the team treats credentials as a one-shot authentication and leaves "what to do with the session" as an extension point. The naive setup gives you a cookie but no `sessions` row, so subsequent server-side `auth()` calls throw `AdapterError`.

The fix is to override `jwt.encode` in the NextAuth config: when the token is flagged as originating from a credentials sign-in (via a one-time flag set in the `jwt` callback), we generate an opaque session token, manually call `adapter.createSession()`, and return the token. Auth.js writes it to the cookie; subsequent requests look it up in the `sessions` table successfully.

This is the documented workaround pattern, and it demonstrates how `jwt.encode` is a public extension point — strategy-pattern dependency injection via configuration.

See: [`src/lib/auth.ts`](src/lib/auth.ts)

### 2. Edge runtime for ingestion

`/api/collect` runs on Vercel's edge runtime. Three reasons:

- **Latency:** an ingestion endpoint should run close to the visitor, not in a single US region.
- **Cost:** edge functions are cheaper at scale than serverless functions.
- **Cold start:** edge cold-starts in single-digit ms vs hundreds for Node serverless — important for fire-and-forget beacons.

This forces every dependency on the hot path to be edge-compatible: the Neon driver (HTTP, not TCP), Upstash (HTTP), Web Crypto (`crypto.subtle.digest` instead of Node `crypto`), and `ua-parser-js` (verified pure-JS with no `fs`/`Buffer`/`eval`).

See: [`src/app/api/collect/route.ts`](src/app/api/collect/route.ts)

### 3. IDOR-safe queries by construction

Every database lookup of a user-owned resource filters by both `id` AND `userId`:

```typescript
where: and(eq(projects.id, projectId), eq(projects.userId, session.user.id))
```

This is enforced uniformly via helper functions in `src/lib/db/queries.ts` (reads) and the Server Actions in `src/actions/projects.ts` (mutations). Centralizing the pattern means a new page that calls `getProjectByIdForUser()` inherits the IDOR protection automatically — you can't accidentally write the vulnerable version. Deletes apply the user filter on the `DELETE` query itself, not just the lookup, so a TOCTOU race still can't slip through.

See: [`src/lib/db/queries.ts`](src/lib/db/queries.ts), [`src/actions/projects.ts`](src/actions/projects.ts)

### 4. Brute-force protection: failures-only, inside `authorize()`

The first design put rate-limiting in middleware against the `/login` page route — wrong on two counts. It throttled *page loads* (so navigating broke the auth pages) and missed the actual sensitive endpoint (the credentials callback bypassed middleware's matcher entirely).

The corrected design lives inside the Credentials provider's `authorize()` function and tracks **only failed attempts** by IP via a Redis counter with a fixed 15-minute window:

- Successful logins consume no slots — you can log in and out a hundred times without ever incrementing the counter.
- Failures increment; on the first failure, a 15-minute TTL is set (subsequent failures don't reset the window).
- Success deletes the counter, so prior typos don't accumulate.
- Returning `null` from `authorize()` makes a rate-limit block indistinguishable from a wrong-password response — no information leak about whether the attacker is being throttled.

Constant-time-style: the code uses a single boolean for "user exists AND password matches" so an attacker can't time the response to enumerate registered emails.

See: [`src/lib/auth.ts`](src/lib/auth.ts) — the `authorize()` function.

### 5. Composition-layer caching for the dashboard

The dashboard runs 8 analytics queries in parallel via `Promise.all`. The cache wraps **the whole bundle** under one Redis key, not each query independently:

```typescript
const data = await withCache(
    `stats:${projectId}:${rangeKey}`,
    60,
    async () => {
        const [topLine, overTime, ...] = await Promise.all([...8 queries...]);
        return { topLine, overTime, ... };
    }
);
```

- On a cache hit, **one Redis round-trip** returns everything.
- On a miss, all 8 queries run in parallel inside the closure.
- The cache key uses the *named period* (`7d`, `today`) for relative ranges and the explicit `from:to` for custom ranges — keying by the moving "now" timestamp would make the cache key change every second and never hit.
- TTL-based invalidation, no manual cache-busting: pageviews stream in continuously, eventual consistency within 60 seconds is acceptable. Contrast with project mutations (`createProject`, `deleteProject`) which call `revalidatePath` for *active* invalidation.

The cache wrapper is **fail-open**: Redis being unreachable degrades the dashboard to "slower" (uncached), never to "broken."

See: [`src/lib/cache.ts`](src/lib/cache.ts), [`src/app/dashboard/[projectId]/page.tsx`](src/app/dashboard/[projectId]/page.tsx)

### 6. Server/Client component boundary

Server Components do all the data work — DB queries, session resolution, redirects, metadata. Client Components handle only what requires the browser — hooks, state, event handlers, SVG measurement.

Consequences:
- **The sidebar is a Client Component** (`usePathname()` for active highlighting) — but the project list it renders is fetched by the *layout* (Server) and passed down as props. No client-side data fetching, no waterfalls.
- **The dashboard time-series chart is the only Recharts-bundled file** that ships to the browser. The 6 "bar list" breakdowns are pure HTML/CSS, rendered server-side — zero client JS.
- **Forms that submit to Server Actions** (sign-out, project create/delete) work without JavaScript via standard form POSTs — progressive enhancement.

See the import boundary in [`src/components/`](src/components/) and the data flow in [`src/app/dashboard/[projectId]/page.tsx`](src/app/dashboard/[projectId]/page.tsx).

### 7. Defense in depth on auth

Authentication is verified at three layers:

1. **Middleware** (edge) — first-line, rejects unauthenticated requests to protected routes before any rendering happens.
2. **Dashboard layout** (Server Component) — re-checks the session; provides the user object the header needs anyway.
3. **Server Actions** — each action re-checks `auth()` because actions are callable from anywhere (any Client Component, any page).

The triple-check isn't redundancy for redundancy's sake. Each layer has a distinct failure mode and a distinct fix-by-design property: middleware is the broad-stroke router boundary, the layout is the data-access boundary, the actions treat themselves as public endpoints.

### 8. Tracking script: write-once for the unknown browser population

`script.js` (in `public/`) is the one file in the codebase deliberately written in ES5 style — `var`, `function`, no arrow functions, no `const`/`let`. The rationale:

- The dashboard runs in *your* users' browsers, where you control the audience and can assume modern JS.
- The tracking script runs on *third-party* sites in *their* visitors' browsers — a population you can't predict.
- A `try/catch` cannot rescue a *parse* error from an unsupported syntax feature; the script would simply fail to load on old/locked-down browsers and silently break analytics.

The script is wrapped in `try/catch` so any runtime error is swallowed — analytics must never break the host page. It derives its own endpoint URL from its `<script>` tag's `src`, so the same script.js works on any deployment without rebuild.

See: [`public/script.js`](public/script.js)

### Types organization

Types live with the code that owns them. Schema-derived (`User`, `Project` via `$inferSelect`), Zod-derived (`CreateProjectInput` via `z.infer`), and module-local types stay co-located. Only genuinely cross-cutting types live in `src/types/`. Never hand-write a type that can be inferred — the single source of truth for any data shape is the producer (schema, Zod schema, or query function).

---

## Getting started (local)

### Prerequisites

- Node.js 22+
- A Neon Postgres database (free tier is fine)
- An Upstash Redis instance (free tier is fine)
- A GitHub OAuth App (only if you want GitHub login locally — credentials login works without it)

### Setup

```bash
# 1. Clone and install
git clone https://github.com/AlexTkCkWork/analyticos.git
cd analyticos
npm install

# 2. Configure environment variables
cp .env.example .env.local
# Edit .env.local — see "Environment variables" below

# 3. Push the schema to your Neon DB
npm run db:push

# 4. Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and register a new account.

### Environment variables

Create `.env.local` (a template is provided in `.env.example`):

```env
# Database
DATABASE_URL="postgresql://..."           # Neon connection string

# Auth.js
AUTH_SECRET=""                            # node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
AUTH_URL="http://localhost:3000"
AUTH_TRUST_HOST="true"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# GitHub OAuth (optional — credentials login works without these)
AUTH_GITHUB_ID=""
AUTH_GITHUB_SECRET=""

# Upstash Redis (HTTP)
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""
```

> **Important:** `AUTH_SECRET` both signs sessions and salts the `visitorHash`. Once you're collecting real data, keep this value stable — changing it invalidates all sessions and breaks cross-day visitor counting continuity.

### Verifying tracking locally

```html
<!-- Drop this into any HTML file served from localhost:3000 -->
<script
  defer
  data-key="<your-project-public-key>"
  src="http://localhost:3000/script.js"
></script>
```

Load the page in a real browser and a row should appear in the `pageviews` table within a second.

---

## Self-hosting

A full production deployment to Vercel + Neon + Upstash takes about 20 minutes. See [`DEPLOY.md`](DEPLOY.md) for the click-through walkthrough.

Quick summary:

1. Create a Neon **production** branch; push the schema with `db:push`.
2. Create an Upstash Redis instance.
3. Generate a fresh `AUTH_SECRET` (do NOT reuse your dev one).
4. Import the repo on Vercel; set all env vars scoped to **Production** (and Preview if you want preview deploys to work fully).
5. Set `AUTH_TRUST_HOST=true` (required behind Vercel's reverse proxy).
6. Set `NEXT_PUBLIC_APP_URL` to your production URL — note this is **build-time inlined** into the tracking snippet, so changing it later requires a rebuild.
7. (Optional) Create a separate GitHub OAuth App for production — OAuth Apps allow only one callback URL, so dev and prod need separate apps.

---

## Project structure

```
analyticos/
├── public/
│   └── script.js                         # The tracking script (ES5-style, self-locating)
├── src/
│   ├── app/
│   │   ├── (auth)/                       # Auth route group — centered shell, redirects authed users away
│   │   │   ├── layout.tsx
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── error/page.tsx
│   │   ├── dashboard/                    # Protected dashboard routes
│   │   │   ├── layout.tsx                # Sidebar + topbar; fetches projects
│   │   │   ├── page.tsx                  # Branches: first project, or onboarding if none
│   │   │   ├── onboarding/page.tsx       # Project creation form
│   │   │   └── [projectId]/
│   │   │       ├── page.tsx              # Analytics dashboard (8 queries + cache + charts)
│   │   │       ├── loading.tsx           # Skeleton fallback
│   │   │       └── settings/page.tsx     # Snippet display + type-to-confirm delete
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/       # Auth.js handler
│   │   │   └── collect/route.ts          # Edge ingestion endpoint
│   │   ├── layout.tsx                    # Root layout (fonts, theme tokens)
│   │   └── page.tsx                      # Marketing landing page
│   │
│   ├── actions/                          # Server Actions
│   │   ├── auth.ts                       # registerUser, signOutAction
│   │   └── projects.ts                   # createProject, deleteProject (IDOR-safe)
│   │
│   ├── components/
│   │   ├── ui/                           # shadcn primitives (Button, Card, Skeleton, etc.)
│   │   ├── auth/                         # LoginForm, RegisterForm, SignOutButton, GitHubButton
│   │   ├── dashboard/                    # Sidebar, ProjectForm, DateRangePicker, CopySnippet, DeleteProjectForm
│   │   └── charts/                       # TimeSeriesChart (Client + Recharts), BarList (Server)
│   │
│   ├── lib/
│   │   ├── db/
│   │   │   ├── index.ts                  # Drizzle client (Neon HTTP)
│   │   │   ├── schema.ts                 # All tables; types via $inferSelect
│   │   │   ├── queries.ts                # Project reads (IDOR-safe helpers)
│   │   │   └── analytics.ts              # Aggregation queries + fillTimeSeries
│   │   ├── auth.config.ts                # Edge-safe auth config (no adapter)
│   │   ├── auth.ts                       # Full auth config + Credentials provider + jwt.encode override
│   │   ├── redis.ts                      # Upstash Redis client
│   │   ├── rate-limit.ts                 # Ratelimit instances (collect, global, api, action)
│   │   ├── routes-config.ts              # Config-driven route classification for middleware
│   │   ├── validations.ts                # All Zod schemas
│   │   ├── analytics-range.ts            # URL params -> {from, to, bucket} range
│   │   ├── visitor-hash.ts               # Daily-salted SHA-256 (Web Crypto)
│   │   ├── cache.ts                      # withCache wrapper (fail-open)
│   │   └── utils.ts                      # cn() and other small helpers
│   │
│   ├── types/
│   │   └── next-auth.d.ts                # Session/User type augmentation
│   │
│   └── middleware.ts                     # Global rate-limit + route-config-driven auth check
│
├── drizzle/                              # Drizzle migration files
├── drizzle.config.ts
├── components.json                       # shadcn config (style: base-nova)
└── tsconfig.json
```

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Next dev server with Turbopack |
| `npm run build` | Production build |
| `npm run start` | Run the production build locally |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:push` | Push the Drizzle schema to the database |
| `npm run db:studio` | Open Drizzle Studio |
| `npm run db:generate` | Generate a migration |
| `npm run db:migrate` | Apply pending migrations |

---

## Testing

Unit tests cover the privacy/correctness-critical surface — visitor hashing, date-range parsing, time-series gap-filling, and input validation schemas. An end-to-end Playwright test covers the full register → create-project → see-snippet user journey.

```bash
npm test           # Vitest unit tests (62 tests, < 1s)
npm run test:e2e   # Playwright E2E (1 test, real browser)
```

Unit tests run on every PR via GitHub Actions. Test scope is deliberately focused: pure logic where silent bugs would corrupt data or break privacy. UI rendering and DB-mocking tests are skipped — UI bugs surface via E2E, and mocked DB tests would test the mocks.

---

## Status & scope

AnalyticOS is a functional MVP. The full pipeline works end-to-end: register → create project → embed script → see pageviews appear in real time → explore the dashboard with date ranges, charts, and breakdowns.

**Deliberately not (yet) included:**

- **SPA route tracking** — the script fires one pageview on full page load. Single-page-app `history.pushState` navigations aren't re-tracked. Planned.
- **Per-site timezone** — currently UTC-only for day boundaries. A user in UTC+2 sees "today" flip at UTC midnight. Acceptable for MVP; per-project timezone is a planned improvement.
- **Script minification** — `public/script.js` ships unminified for readability. A build step is planned.
- **`localhost` skip in script** — dev traffic from self-hosters currently pollutes their own stats; a noop on `localhost`/`127.0.0.1` is planned.
- **Per-account brute-force tracking** — IP-based failure tracking exists; per-email tracking (to defend against distributed credential-stuffing rotating IPs) is a natural next layer.
- **Hosted free service** — this is the open-source code for self-hosting; there is no shared hosted instance. The demo URL above is a single seeded instance for showcase only.

---

## Contributing

This is a personal portfolio project, but issues and pull requests are welcome — especially if you're self-hosting and find rough edges. Please:

1. Open an issue describing the change first for anything non-trivial.
2. Match existing style — Prettier handles most of it.
3. `npm run typecheck` and `npm run lint` must pass.
4. Conventional Commits (`feat:`, `fix:`, `ref:`, etc.) for commit messages.

---

## License

[AGPL-3.0-or-later](LICENSE) — same license as Plausible Analytics. You're free to self-host, modify, and run AnalyticOS for any purpose, including commercially. If you offer modifications as a service over a network, you must make the modified source available to your users.

---

## Acknowledgments

Inspired by [Plausible Analytics](https://plausible.io) and [Fathom Analytics](https://usefathom.com), whose privacy-first model proves that good analytics doesn't require cookies or surveillance. Built on the shoulders of [Next.js](https://nextjs.org), [Auth.js](https://authjs.dev), [Drizzle](https://orm.drizzle.team), [Neon](https://neon.tech), [Upstash](https://upstash.com), and [shadcn/ui](https://ui.shadcn.com).

Built in Brno, Czech Republic.
