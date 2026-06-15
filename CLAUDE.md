# CLAUDE.md
**AI Agent Context & Project Constitution**
The Well Church — Henderson, NV — v1.2

---

## 1. Project Identity

This file is the authoritative context document for all Claude agents working on this project. Read it completely before taking any action. Never deviate from the constraints defined here without explicit user approval.

| Field | Value |
|---|---|
| Project Name | The Well Church (Henderson, NV) |
| Client Type | Local church — Henderson, NV (non-profit, faith-based) |
| Primary Goal | Full-featured public + members website with secure transactions |
| Stack | Next.js 16+ (App Router, Turbopack default) + Node.js 20.9+ + PostgreSQL + Tailwind CSS v4 |
| Church Mgmt | Planning Center integration (PCO) for members, events, giving |
| Payments | Planning Center Giving (primary) + Stripe fallback for custom flows |
| Hosting Target | Vercel (frontend) + Railway or Supabase (backend/DB) |
| AI Models Used | Claude Sonnet 4.6 (implementation) \| Claude Opus 4.8 (architecture/review) |

---

## 2. Model Role Assignment

This project uses two Claude models with distinct responsibilities. Always identify which role you are operating in at the start of each session.

| Model | Role | Responsibilities |
|---|---|---|
| claude-opus-4-8 | Architect / Reviewer | System design decisions, security architecture, API schema review, AGENTS.md updates, cross-cutting concern evaluation, code review of critical paths |
| claude-sonnet-4-6 | Implementer | Feature coding, component building, API routes, database migrations, test writing, bug fixing, documentation generation, PR descriptions |

---

## 3. Architecture Constraints (Non-Negotiable)

The following rules are HARD constraints. Do not propose alternatives or workarounds without flagging them as deviations requiring user approval.

### 3.1 Framework & Rendering
- Use Next.js App Router exclusively — no Pages Router patterns
- Server Components by default; Client Components only when interactivity requires it
- All data fetching in Server Components or Route Handlers (never client-side for sensitive data)
- Tailwind CSS for all styling — no inline styles, no CSS modules unless justified
- shadcn/ui as the component library baseline

### 3.1.1 Next.js 16 Conventions (read before writing App Router code)
Next.js 16 made several breaking changes from the 14/15 conventions baked into AI training data. These are HARD constraints for this project:

- **Turbopack is the default** bundler for `next dev` and `next build` — no `--turbopack` flag needed. Do not add a custom Webpack config unless explicitly required.
- **Async Request APIs are mandatory**: `cookies()`, `headers()`, `draftMode()`, route `params`, and `searchParams` all return Promises — always `await` them in Server Components/Route Handlers, or `use()` them in synchronous Client Components.
- **`fetch` and Route Handler `GET` are NOT cached by default.** Wherever ISR-style caching is required (see 1.4 — sermons/events with 1-hour revalidation), opt in explicitly via `cache: 'force-cache'`, `export const dynamic = 'force-static'`, or `export const fetchCache = 'default-cache'`.
- **Route protection lives in `proxy.ts`** (renamed from `middleware.ts`; the exported function is `proxy`, not `middleware`). The proxy runtime is Node.js only — there is no Edge runtime in `proxy.ts`.
- **Tailwind CSS v4 uses CSS-first configuration** — theme tokens live in `@theme` blocks inside `app/globals.css`. Do not create a `tailwind.config.ts` unless a plugin requires it.
- **ESLint 9 flat config** (`eslint.config.mjs`) extends `eslint-config-next/core-web-vitals` + `eslint-config-next/typescript` + `eslint-config-prettier`. The `next lint` command is removed — use `eslint .` (already wired as `npm run lint`).
- **`images.domains` is deprecated** — use `images.remotePatterns` in `next.config.ts` for any external image sources (Cloudinary, PCO avatars, etc.).
- **`revalidateTag` requires a `cacheLife` profile** as its second argument when `cacheComponents` is enabled — relevant for PCO sync revalidation (Phase 2) and giving history (Phase 3).
- **shadcn/ui CLI must be current** — use the latest `npx shadcn@latest add ...` when scaffolding components; older CLI versions assume Tailwind v3 config and will not match the v4 CSS-first setup.
- **Partial Prerendering (PPR)** is available — prefer it for pages mixing a static shell with dynamic data (sermon/event pages with live PCO data). Enable per route via `export const experimental_ppr = true` once validated; pair with `<Suspense>` + `loading.tsx` streaming.
- **React Compiler (React 19)** may be enabled (`reactCompiler: true` in `next.config.ts`) to auto-memoize components — adopt only after confirming build + test suite stay green.
- Minimum versions: Node.js 20.9+, TypeScript 5.1+, React 19.2.

### 3.2 Security
- JWT tokens stored in httpOnly cookies only — never localStorage or sessionStorage
- All member routes protected via Next.js proxy (`proxy.ts`, Node.js runtime) with role-based auth
- Multi-factor authentication (MFA/TOTP) REQUIRED for all staff/admin accounts; offered opt-in to members
- Password hashing with **argon2id** (OWASP-preferred); bcrypt ≥ 12 rounds acceptable only where argon2 is unavailable
- Bot/abuse protection (Cloudflare Turnstile or hCaptcha) on registration, contact, and every public form
- Input validation with Zod on every API route, both client and server
- CSRF protection on all state-mutating endpoints
- Rate limiting on auth endpoints, donation endpoints, and all public forms
- Full hardened header set via `next.config.ts` `headers()` (and/or `proxy.ts` for dynamic per-route policies):
  - Content-Security-Policy (nonce-based — no `unsafe-inline`/`unsafe-eval`), `frame-ancestors 'none'`
  - Strict-Transport-Security (HSTS — `max-age` ≥ 1 year, `includeSubDomains`, `preload`)
  - Referrer-Policy (`strict-origin-when-cross-origin`), Permissions-Policy (deny unused features)
  - X-Frame-Options `DENY`, X-Content-Type-Options `nosniff`
- Automated dependency scanning (Dependabot + `npm audit` in CI) and secret scanning (GitHub secret scanning / gitleaks) — block merges on high/critical findings
- Environment variables in `.env.local` — NEVER committed to git
- Secrets rotated per environment (dev / staging / prod)
- PII must be encrypted at rest (member records, transaction data)
- PCI DSS compliance delegated entirely to Planning Center Giving / Stripe — never handle raw card data

### 3.3 Database
- PostgreSQL with Prisma ORM for all data access
- Row-Level Security (RLS) enabled on member and transaction tables
- Migrations are versioned, never run raw SQL in production manually
- Backups automated daily with 30-day retention minimum
- Soft deletes only — no hard DELETE on member or transaction records

### 3.4 Performance & SEO
- Core Web Vitals targets: LCP < 2.5s, CLS < 0.1, INP < 200ms (INP replaced FID as the Core Web Vital responsiveness metric in March 2024)
- Use Partial Prerendering + streaming (`<Suspense>`, `loading.tsx`) to keep LCP fast on data-backed pages (sermons, events, dashboard)
- Images: Next.js Image component with WebP/AVIF, never raw `<img>` tags
- Fonts: next/font with font-display: swap
- All public pages must have unique meta title, description, and OG tags
- Structured data (JSON-LD) on: Home, About, Events, Contact, Service Times
- Sitemap.xml and robots.txt generated via the built-in `app/sitemap.ts` and `app/robots.ts` (MetadataRoute) conventions — no third-party sitemap package needed
- Local SEO: NAP (Name, Address, Phone) consistent across all pages + Schema.org/Church markup

### 3.5 Accessibility
- WCAG 2.1 AA minimum on all public-facing pages
- Semantic HTML throughout — headings in order, landmark regions labeled
- All interactive elements keyboard-navigable
- Color contrast ratio ≥ 4.5:1 for body text

---

## 4. Required Project Structure

```
/
├── app/
│   ├── (public)/          # Public routes: home, about, sermons, events, contact
│   ├── (auth)/            # Login, register, password reset
│   ├── (members)/         # Protected member portal
│   │   ├── dashboard/
│   │   ├── giving/        # Giving history, recurring setup
│   │   ├── directory/     # Member directory (role-gated)
│   │   └── profile/
│   ├── api/               # Route handlers
│   │   ├── auth/
│   │   ├── giving/
│   │   ├── webhooks/      # PCO webhooks
│   │   └── admin/
│   └── admin/             # Church staff CMS
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── layout/            # Header, Footer, Nav
│   ├── public/            # Public section components
│   └── members/           # Member portal components
├── lib/
│   ├── auth.ts            # NextAuth config
│   ├── db.ts              # Prisma client
│   ├── pco.ts             # Planning Center API client
│   ├── stripe.ts          # Stripe client (if used)
│   └── validations/       # Zod schemas
├── proxy.ts                # Route protection (Next.js 16 proxy convention, formerly middleware.ts)
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── public/
│   └── seo/               # OG images, favicons
├── CLAUDE.md              # This file
└── AGENTS.md              # Agent workflow file
```

---

## 5. Key Integrations & APIs

| Service | Purpose | Notes |
|---|---|---|
| Planning Center (PCO) | Member management, events, check-in, giving | Use PCO API v2 — OAuth2 for member auth, Personal Access Token for server-side sync |
| Planning Center Giving | Primary donation & tithe processing | PCI compliant — embed PCO Giving widget; never store card data |
| Stripe | Custom donation flows if PCO Giving insufficient | Stripe Elements only — server-side PaymentIntents |
| NextAuth.js v5 | Authentication layer | Credentials + PCO OAuth provider |
| Resend / SendGrid | Transactional email | Donation receipts, welcome emails, password reset |
| Google Analytics 4 | Public site analytics | No tracking in members portal without consent |
| Cloudinary / Next.js Image | Media management | Sermon thumbnails, event photos, staff directory — use `images.remotePatterns`, not `images.domains` |
| Vercel | Hosting + Proxy (`proxy.ts`, Node.js runtime) | Edge Config for feature flags; ISR for sermon/event pages — requires explicit `fetch`/route cache opt-in (Next 16 caches nothing by default) |

---

## 6. Coding Standards

### 6.1 TypeScript
- Strict mode always on — no `any` types without explicit justification comment
- All API responses typed with Zod schemas, inferred types exported
- Prefer `type` over `interface` unless extending
- Explicit return types on all exported functions

### 6.2 Git Workflow
- Branch naming: `feature/[ticket]-description` | `fix/[ticket]-description` | `chore/description`
- Commit format: `type(scope): description` — e.g. `feat(giving): add recurring donation toggle`
- No direct commits to main — all changes via PR
- PR must include: what changed, why, how to test, screenshots if UI

### 6.3 Testing
- Unit tests with Vitest for all utility functions and validation schemas
- Integration tests for all API routes (especially auth and payment flows)
- E2E with Playwright for: registration flow, login, donation flow, member portal access
- Target: 80%+ coverage on `lib/` and `api/` directories

### 6.4 Environments
- Three environments: development, staging, production
- Staging must mirror production — no schema differences
- Feature flags via Vercel Edge Config for gradual rollouts

---

## 7. Absolute Do-Not Rules

These actions are prohibited in all circumstances. If a task requires one of these, STOP and ask the user for clarification.

- Do NOT commit secrets, API keys, or credentials to the repository
- Do NOT use client-side storage (localStorage/sessionStorage) for auth tokens or PII
- Do NOT handle raw payment card data — always delegate to PCO Giving or Stripe
- Do NOT skip Zod validation on user inputs, even "internal" endpoints
- Do NOT hard delete member records or transaction records
- Do NOT deploy to production without passing the full test suite
- Do NOT add new third-party npm packages without checking bundle size impact
- Do NOT expose Planning Center API credentials or Stripe secret keys client-side
- Do NOT create endpoints that return full member PII without role check
- Do NOT make architectural changes without flagging for Opus 4.8 review

---

## 8. Glossary

| Term | Definition |
|---|---|
| PCO | Planning Center Online — the church management system |
| Members Portal | The authenticated area for registered church members |
| Public Site | Unauthenticated pages visible to anyone (home, sermons, events, contact) |
| Staff CMS | Admin interface for church staff to manage content |
| AI GEO | Generative Engine Optimization — structuring content for AI search discovery (Perplexity, ChatGPT, etc.) |
| Local SEO | Optimization for Google local search (Google Business Profile, Henderson NV maps) |
| ISR | Incremental Static Regeneration — Next.js feature for cached + fresh content |
| RLS | Row-Level Security — PostgreSQL policy enforcing data access at DB level |
| Proxy | Next.js 16 convention (`proxy.ts`, exported function `proxy`) that replaces `middleware.ts`; runs on the Node.js runtime and is used here for route protection |
