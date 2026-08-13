# The Well Church — Henderson, NV

Website for The Well Church. Next.js 16 (App Router) · Tailwind CSS v4 · TypeScript ·
Prisma/PostgreSQL (frozen — see below).

**Read [`CLAUDE.md`](./CLAUDE.md) before changing anything** — it is the project
constitution (architecture constraints, security rules, Next 16 conventions).
[`AGENTS.md`](./AGENTS.md) holds the phased build plan.

## Current state: DEMO-FIRST

The church has **not yet committed** to using this build. What exists today is a
front-end-only **pitch demo** on branch `demo/church-frontend` — a fully static export
(`output: 'export'`) with mock content and no backend. Interactive features (login,
giving, member portal, contact form) render as styled "Coming soon" states.

Live demo: **https://thewell-demo.pages.dev** — the interactive WebGL water background
runs on **every device**, tuned per tier (sim resolution, pixel-ratio cap, fps cap), and
derates itself when out of sight: it pauses once you scroll past the pool and sleeps when
the water has decayed flat. Devices without WebGL2 get a 2D ring fallback; only
`prefers-reduced-motion` gets the static CSS pool. Append `?water=debug` to any URL to
see which path a device took.

Backend is **FROZEN** at Phase 0.3 (Prisma schema + RLS, branch
`feature/phase-0.3-database`). Do not build Phase 0.4+ until the church greenlights.

## Requirements

Node is **pinned in `.nvmrc`** (currently `24.16.0`). `package.json` `engines` and CI
both read that file — change the version there and every layer follows. Node 20 went
end-of-life on 2026-04-30 and is not a supported target.

```bash
nvm use          # reads .nvmrc
npm ci
```

## Commands

| Command             | What it does                                         |
| ------------------- | ---------------------------------------------------- |
| `npm run dev`       | Dev server on http://localhost:3000                  |
| `npm run build`     | Production build → static export in `out/`           |
| `npm run lint`      | ESLint 9 flat config (`next lint` is removed in v16) |
| `npm run typecheck` | `tsc --noEmit`                                       |
| `npm run test`      | Vitest                                               |
| `npm run format`    | Prettier                                             |

Preview the exported build the way the host serves it:

```bash
cd out && python -m http.server 8080
```

Kill any stray `http.server` process first — it locks `out/` and the next build fails.

## Deploying the demo

Cloudflare Pages project `thewell-demo`, **direct upload** (not git-connected), so the
build happens here and Pages only serves `out/`:

```bash
npm run build
CLOUDFLARE_ACCOUNT_ID=17793385ce1563b8f48fd3841a1ad12a \
  wrangler pages deploy out --project-name thewell-demo --branch main --commit-dirty=true
```

The Cloudflare API occasionally exceeds wrangler's 10s timeout from this machine —
retry, it lands.

## Hosting (decided, not built)

When the church says yes: drop `output: 'export'` to re-enable SSR/PPR/Route Handlers,
then self-host on a **Proxmox VM** — Next.js standalone + PostgreSQL via Docker Compose,
ingress via **Cloudflare Tunnel** (no open ports), nightly `pg_dump` → NAS. See
CLAUDE.md §1.1.
