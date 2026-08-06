import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: '/login' },
    sitemap: 'https://thewell-demo.pages.dev/sitemap.xml',
  };
}
