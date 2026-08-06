import type { NextConfig } from 'next';

/**
 * DEMO BUILD CONFIG.
 *
 * This branch (demo/church-frontend) is a front-end-only pitch demo for The Well
 * Church. It is exported as a fully static site (`output: 'export'`) so it can be
 * hosted on Cloudflare Pages with no server, database, or auth. All interactive
 * features (login, giving, member portal) are shown as styled "Coming soon" states.
 *
 * When the church commits to the build, remove `output: 'export'` to re-enable
 * SSR / PPR / Route Handlers, then resume the backend phases per CLAUDE.md.
 */
const nextConfig: NextConfig = {
  output: 'export',
  // Static export cannot run the Next.js image optimizer at runtime.
  images: { unoptimized: true },
  // Emit /route/index.html so pages resolve cleanly on static hosts.
  trailingSlash: true,
};

export default nextConfig;
