# AGENTS.md
**Architectural Roadmap & Agent Workflow Guide**
The Well Church — Henderson, NV — v1.2

---

## Phase Overview

This roadmap is structured in 6 phases. Each phase must be fully completed and reviewed before the next begins. Opus 4.8 reviews all phase completions; Sonnet 4.6 implements within phases.

| Phase | Name | Key Deliverables | Agent |
|---|---|---|---|
| 0 | Foundation & Setup | Repo, CI/CD, environments, DB, auth skeleton | Sonnet 4.6 |
| 1 | Public Site | Home, About, Sermons, Events, Contact, SEO, GEO | Sonnet 4.6 |
| 2 | Members Portal | Auth, dashboard, profile, directory, PCO sync | Sonnet 4.6 |
| 3 | Giving & Transactions | PCO Giving, donation history, receipts, Stripe fallback | Sonnet 4.6 |
| 4 | Security Hardening | Pen test prep, CSP, rate limiting, audit logging | Opus 4.8 + Sonnet 4.6 |
| 5 | AI GEO & Launch | Structured data, AI discoverability, perf audit, go-live | Sonnet 4.6 |

---

## PHASE 0 — Foundation & Setup

**Goal:** Establish a production-grade project skeleton that all subsequent phases build upon. Nothing ships without this being solid.

### 0.1 Repository & Tooling
- Initialize Next.js 16+ with App Router, TypeScript strict mode, Tailwind CSS v4 (Turbopack is the default bundler — no flags needed)
- Configure ESLint flat config (`eslint.config.mjs`: `eslint-config-next/core-web-vitals` + `eslint-config-next/typescript` + `eslint-config-prettier`), Prettier, Husky pre-commit hooks — `next lint` is removed in v16, lint via `eslint .`
- Set up path aliases: `@/components`, `@/lib`, `@/app`
- Add `.env.example` with all required variable names (no values)
- Configure `.gitignore` to exclude `.env*` and `*.pem` — **track both `prisma/schema.prisma` AND `prisma/migrations/`** (the versioned migration history must be committed so staging/prod reproduce schema via `prisma migrate deploy`)

### 0.2 CI/CD Pipeline
- GitHub Actions: lint → typecheck → test → build on every PR
- Vercel project connected to GitHub (auto-deploy preview on PR, auto-deploy main to staging)
- Production deploy is MANUAL trigger only (never auto-deploy to prod)
- Supply-chain security in CI from day one:
  - `.github/dependabot.yml` — weekly npm + GitHub Actions update PRs
  - CI `security` job runs `npm audit --audit-level=high` (block on high/critical)
  - GitHub secret scanning + push protection enabled on the repo; add `gitleaks` to pre-commit if a secret ever slips
- Branch protection on main: require PR, require CI green — review requirement waived for solo development (GitHub can't allow self-approval); revisit and enable "require 1 review" if a second maintainer joins

### 0.3 Database
- Provision PostgreSQL on Railway (staging) and Railway or Supabase (prod)
- Initialize Prisma schema with initial User, Session, Member, Transaction models
- Enable Row-Level Security on members and transactions tables
- Run initial migration, confirm schema in staging
- Configure automated daily backups with 30-day retention

### 0.4 Authentication Skeleton
- Install and configure NextAuth.js v5 (Auth.js)
- Credentials provider for email/password (hashed with bcrypt, min 12 rounds)
- Planning Center OAuth provider (for future member SSO)
- Session stored in PostgreSQL via Prisma adapter
- `proxy.ts` (Next.js 16 proxy convention — exported function `proxy`, Node.js runtime, no Edge runtime): protect all `/members/*` and `/admin/*` routes
- Auth tokens in httpOnly, Secure, SameSite=Strict cookies

### 0.5 Security Baselines
- `next.config.ts` `headers()` — full hardened header set:
  - Content-Security-Policy (nonce-based; no `unsafe-inline`/`unsafe-eval`)
  - Strict-Transport-Security (`max-age=63072000; includeSubDomains; preload`)
  - Referrer-Policy (`strict-origin-when-cross-origin`)
  - Permissions-Policy (deny camera/microphone/geolocation and other unused features)
  - X-Frame-Options `DENY` / CSP `frame-ancestors 'none'`, X-Content-Type-Options `nosniff`
- Bot/abuse protection (Cloudflare Turnstile or hCaptcha) wired for public forms + registration
- MFA/TOTP scaffolding for staff/admin accounts (enforced in Phase 2; audited in Phase 4)
- Rate limiting with `@upstash/ratelimit` on auth routes (5 attempts / 15 min per IP)
- CORS: restrict API routes to same-origin + PCO webhook IPs
- Enable HTTPS-only (Vercel enforces this; verify staging)
- Sentry error monitoring configured for all environments
- `app/robots.ts`: noindex staging environment

### Phase 0 Exit Criteria — Opus 4.8 Reviews
- [ ] All env vars documented in `.env.example`
- [ ] CI/CD pipeline green on a test PR
- [ ] Database connects and migrations run cleanly in staging
- [ ] Auth: register, login, logout, and protected-route redirect all work
- [ ] CSP headers visible in staging response headers
- [ ] Sentry receiving errors from staging

---

## PHASE 1 — Public Website

**Goal:** Build the full public-facing website optimized for Local SEO, AI GEO discoverability, and performance. This is the church's digital front door.

### 1.1 Pages & Content
- **Home** — hero, service times, latest sermon preview, upcoming events, call to action
- **About** — church history, leadership team, beliefs/statement of faith, location + map
- **Sermons** — filterable archive, individual sermon pages with audio/video embed
- **Events** — upcoming events list, individual event detail, PCO event sync
- **Ministries** — ministry listing pages (children, youth, women, men, small groups)
- **Give** — public giving page linking to PCO Giving widget
- **Contact** — form with Zod validation, rate-limited, sends via Resend/SendGrid
- **New Here** — first-time visitor landing page
- **404 page** — styled, branded, with search and nav links

### 1.2 Local SEO
- Every page: unique `<title>` and `<meta description>` via Next.js `generateMetadata`
- Canonical URLs on all pages
- Schema.org `Church` JSON-LD on homepage (name, address, phone, hours, geo coordinates)
- Schema.org `Event` JSON-LD on each event page
- Schema.org `VideoObject` on sermon pages
- Google Business Profile: NAP (Name/Address/Phone) matching schema markup exactly
- Henderson NV geo targeting in meta and schema — include city, state, ZIP
- Sitemap.xml via the built-in `app/sitemap.ts` (MetadataRoute) — no `next-sitemap` dependency needed, submitted to Google Search Console
- `app/robots.ts` (MetadataRoute): allow all public pages, disallow `/members/`, `/admin/`, `/api/`

### 1.3 AI GEO (Generative Engine Optimization)
Structure content so AI assistants (ChatGPT, Perplexity, Google AI Overviews) can accurately surface this church.

- FAQ structured content on key pages (What time are services? Where are you located? How do I join?)
- Clear, concise answers in page body — first paragraph of each page answers the page's primary question
- Schema.org `FAQPage` markup on About and New Here pages
- Church description optimized for zero-click / featured snippet capture
- `llms.txt` file in `/public` describing the site for AI crawlers
- Open Graph tags on all pages (og:title, og:description, og:image, og:type)
- Twitter/X card tags on all public pages
- Cookie consent banner (CCPA/Nevada compliance for GA4)
- Privacy Policy page linked in footer and cookie banner

### 1.4 Performance
- All images via `next/image` with width/height and `priority` on above-fold images
- Fonts loaded via `next/font` — no external Google Fonts requests at runtime
- Static pages: ISR with 1-hour revalidation for sermons and events — in Next.js 16, `fetch` and Route Handler `GET` are uncached by default, so opt in explicitly (`cache: 'force-cache'` + `next: { revalidate: 3600 }`, or `export const revalidate = 3600` on the route segment)
- Lighthouse CI run on all key pages — fail build if LCP > 3s
- Third-party scripts (analytics, PCO widget) loaded with `next/script strategy='lazyOnload'`
- Sermon media hosted on CDN (Cloudinary, Mux, or Vimeo embed) — never self-hosted large files

### Phase 1 Exit Criteria
- [ ] All public pages render correctly on mobile, tablet, desktop
- [ ] Lighthouse score ≥ 90 on Performance, Accessibility, SEO for homepage
- [ ] Schema.org markup validates in Google Rich Results Test
- [ ] Contact form sends email and is rate-limited
- [ ] Sitemap.xml accessible at `/sitemap.xml`
- [ ] Cookie consent banner functional

---

## PHASE 2 — Members Portal

**Goal:** Build the secure, authenticated members area integrated with Planning Center. All routes are protected. PII handled carefully throughout.

### 2.1 Registration & Onboarding
- Registration: email, password (`@zxcvbn-ts/core` strength meter — the original `zxcvbn` package is unmaintained), first name, last name
- Email verification required before portal access granted
- Welcome email via Resend with church introduction content
- Optional: link existing PCO profile via OAuth during onboarding
- Admin approval workflow for new member registration (configurable on/off)
- Terms of Use acceptance required at registration

### 2.2 Member Dashboard
- Personalized greeting, upcoming events they are checked in for
- Quick links: Give, Upcoming Services, My Groups, Update Profile
- Recent giving summary (last 3 gifts) with link to full history
- Notifications / announcements from church staff

### 2.3 Planning Center Sync
- PCO API v2 sync: pull member profile, household, groups, donations
- Webhook handler at `/api/webhooks/pco` for real-time PCO updates
- Webhook signature verification on all incoming PCO webhooks
- Background sync job (daily): reconcile local DB with PCO for member status changes
- PCO Group membership displayed in member portal

### 2.4 Member Directory
- Directory visible only to members (role check in proxy AND server component)
- Privacy controls: members can hide phone, email, or address from directory
- Search by name, neighborhood, small group
- Admin-only view shows full data including private fields

### 2.5 Profile Management
- Members can update: photo, phone, address, bio, privacy settings
- Changes sync back to Planning Center via PCO API PATCH
- Audit log of profile changes (who changed what, when)
- Password change with current password confirmation
- Email unsubscribe preferences stored and respected

### Phase 2 Exit Criteria
- [ ] Unauthenticated users cannot access `/members/*` — redirect to login
- [ ] Members cannot access other members' full PII via direct URL manipulation
- [ ] PCO sync completes without errors in staging
- [ ] Privacy controls respected in directory view
- [ ] Terms of Use accepted before access granted

---

## PHASE 3 — Giving & Transactions

**Goal:** Implement secure, PCI-compliant giving flows for donations and tithing. Never handle raw card data.

### 3.1 Public Giving Page
- Embed Planning Center Giving widget on `/give` (primary path)
- Preset gift amounts ($25, $50, $100, $250, custom) via PCO widget config
- Fund selection: Tithe, Building Fund, Missions, Special Offering
- Recurring giving options: weekly, bi-weekly, monthly
- Guest giving (no account required) and member giving (pre-filled details)

### 3.2 Member Giving History
- In-portal giving history pulled from PCO Giving API
- Filter by date range, fund, amount
- Year-end giving statement download (PDF generated server-side, print-styled)
- Manage recurring gifts: view, pause, cancel (via PCO API)

### 3.3 Tax Receipts & Confirmation
- Automated email receipt on every gift via PCO webhook + Resend
- Receipt includes: date, amount, fund, transaction ID, church tax EIN
- Annual tax statement email sent in January for prior year
- All receipts archived in member portal under Giving History

### 3.4 Stripe Fallback (If Needed)
- Stripe Elements for any custom giving flows PCO cannot support
- PaymentIntent created server-side — client receives only `client_secret`
- Webhook at `/api/webhooks/stripe` with signature verification
- Stripe Customer ID stored in DB (never card data)
- 3D Secure (SCA) compliance handled by Stripe

### 3.5 Financial Reporting (Admin)
- Admin dashboard: giving totals by fund, by date range
- Export to CSV for church bookkeeper
- Reconciliation view comparing PCO Giving data vs local records
- Role-gated: only Finance Admin role can view giving reports

### Phase 3 Exit Criteria
- [ ] Test donation completes end-to-end in staging (PCO/Stripe test mode)
- [ ] Receipt email received within 60 seconds of donation
- [ ] Recurring gift can be set up and cancelled
- [ ] No card data appears in logs, DB, or error reports
- [ ] Year-end statement PDF generates correctly

---

## PHASE 4 — Security Hardening [Opus 4.8 Led]

**Goal:** Audit, harden, and document the security posture of the full application before public launch.

### 4.1 Authentication Audit
- Review all auth flows for session fixation, token leakage, replay attacks
- Confirm httpOnly cookie flags on all environments
- Verify MFA/TOTP is enforced for all staff/admin accounts and cannot be bypassed
- Confirm password hashing uses argon2id (or bcrypt ≥ 12 rounds) — no weaker fallback
- Verify account lockout after failed login attempts
- Test password reset flow for token expiry and single-use enforcement
- Confirm email verification cannot be bypassed

### 4.2 Authorization Audit
- IDOR test: can member A access member B's data by manipulating IDs?
- Role escalation test: can a member access staff/admin routes?
- Verify proxy (`proxy.ts`) is not bypassable via direct API route calls
- Confirm RLS policies prevent cross-member data access at DB level

### 4.3 Input & Injection
- Confirm Zod validation on every API route input
- Test all forms for XSS — confirm no raw HTML rendered from user input
- SQL injection: verify Prisma parameterized queries throughout (no raw SQL)
- File upload validation (if any): type, size, virus scan

### 4.4 Infrastructure
- `npm audit` — resolve all critical and high vulnerabilities
- CSP header review: no `unsafe-inline` without nonce, no `unsafe-eval`
- HSTS header confirmed in production
- API routes return no stack traces in production error responses
- Confirm no secrets in client bundle (check all `NEXT_PUBLIC_` prefixed vars)

### 4.5 Audit Logging
- Log: login, logout, failed login, password change, profile update, donation
- Log: admin actions (member role change, content publish)
- Logs written to append-only table, not deletable by app
- Log retention: 1 year minimum
- PII in logs: hash or omit sensitive fields

### 4.6 Compliance
- **COPPA**: site must not knowingly collect data from users under 13
- **CAN-SPAM**: all email must include unsubscribe and physical address
- **PCI DSS SAQ-A**: confirm delegated entirely to PCO/Stripe (no card data touched)
- **Nevada SB 220**: privacy policy published, opt-out of data sale noted (N/A for church)
- **WCAG 2.1 AA**: run axe-core audit, fix all critical issues
- **Member data export**: CCPA right-to-portability — export member's own data on request
- **Account deletion**: soft delete + PCO data note, right to erasure flow documented

### Phase 4 Exit Criteria — Opus 4.8 Sign-Off Required
- [ ] All IDOR and role escalation tests pass
- [ ] `npm audit` shows 0 critical, 0 high vulnerabilities
- [ ] CSP header passes securityheaders.com — rating A or A+
- [ ] Audit log captures all specified events
- [ ] Privacy policy and Terms of Use published and linked in footer
- [ ] Member data export and account deletion flows working

---

## PHASE 5 — AI GEO Finalization & Launch

**Goal:** Finalize AI discoverability, run full performance audit, and launch to production.

### 5.1 AI GEO Final Pass
- Review all public pages: does the first paragraph clearly answer who, what, where, when?
- Test: ask ChatGPT, Perplexity, and Google AI "What churches are in Henderson NV?" — does this church appear?
- `llms.txt` finalized at domain root
- Church listed on Apple Maps, Bing Places, Yelp (these feed AI overviews)
- Wikipedia-style About content on homepage: factual, structured, citable

### 5.2 Performance Final Audit
- Run WebPageTest from US-West
- Lighthouse CI on all key pages: homepage, sermons, events, give, member dashboard
- Image audit: all images have alt text, correct dimensions, lazy/eager correctly set
- Bundle analyzer: confirm no unexpectedly large dependencies

### 5.3 Pre-Launch Checklist
- [ ] Custom domain configured and SSL active
- [ ] Production env vars set in Vercel (verify none missing)
- [ ] Google Analytics 4 property connected and receiving data
- [ ] Google Search Console property verified, sitemap submitted
- [ ] Google Business Profile updated with correct hours, website URL, photos
- [ ] 404 and 500 error pages styled and helpful
- [ ] Redirect rules configured (www → non-www or vice versa)
- [ ] All forms tested in production: contact, registration, giving
- [ ] Smoke test member portal: login, dashboard, profile update
- [ ] PCO admin notified to point production webhooks to production URL
- [ ] Staging environment set to noindex

### 5.4 Post-Launch (Week 1)
- Monitor Vercel error logs and Sentry for runtime errors
- Monitor Core Web Vitals in Google Search Console
- Confirm Google is indexing public pages (`site:domain.com`)
- Gather first member feedback on portal UX

---

## Agent Session Workflow

Follow this protocol at the start of every development session.

| # | Step | Action |
|---|---|---|
| 1 | Identify model role | State: "Operating as Sonnet 4.6 — Implementer" or "Operating as Opus 4.8 — Architect" |
| 2 | Read CLAUDE.md | Re-read constraints section relevant to today's task |
| 3 | Read AGENTS.md | Confirm current phase and open tasks |
| 4 | State the task | Describe in one sentence what you are about to do and which phase it belongs to |
| 5 | Implement | Code, test, document — follow constraints throughout |
| 6 | Self-review | Check against Do-Not Rules before presenting output |
| 7 | Flag for Opus 4.8 | If task touches auth, payments, or architecture — flag for Opus 4.8 review before merge |
| 8 | Update docs | If task introduces new patterns, update CLAUDE.md or AGENTS.md accordingly |

---

## Things You Might Forget — Build These In Early

These are commonly deferred until too late. Address them in the phase indicated.

| Item | Why It Matters | Phase |
|---|---|---|
| Cookie consent banner | Required for GA4 and any tracking — CCPA/Nevada compliance | Phase 1 |
| Privacy Policy page | Legal requirement; linked in footer and cookie banner | Phase 1 |
| Terms of Use page | Needed before member registration opens | Phase 2 |
| Email unsubscribe handling | CAN-SPAM compliance for all outbound email | Phase 2 |
| Error monitoring (Sentry) | Can't fix what you can't see in production | Phase 0 |
| 404 page | SEO and UX — branded page with search/nav | Phase 1 |
| Maintenance mode | For DB migrations — implement via `proxy.ts` (Next.js 16 proxy convention) | Phase 0 |
| noindex on staging | Prevent staging from being indexed by Google | Phase 0 |
| Image alt text policy | Accessibility + SEO — establish standard early | Phase 1 |
| Sermon media hosting | Large video/audio files need CDN (Cloudinary, Mux, or Vimeo) | Phase 1 |
| Offline fallback (PWA) | Church apps benefit from offline sermon access | Phase 5 |
| Print stylesheets | Giving statements and event programs need print CSS | Phase 3 |
| Member data export | CCPA right-to-portability — export member's own data | Phase 4 |
| Account deletion flow | Right to erasure — soft delete + PCO data note | Phase 4 |
| Staff/admin role seeding | First admin must be seeded — document the process | Phase 0 |
