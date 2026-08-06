import type { MetadataRoute } from 'next';

// Required for these metadata routes under `output: 'export'`.
export const dynamic = 'force-static';

const BASE = 'https://thewell-demo.pages.dev';

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ['', '/who-we-are', '/what-we-do', '/connect', '/events', '/give'];
  return routes.map((path) => ({
    url: `${BASE}${path}`,
    changeFrequency: 'weekly',
    priority: path === '' ? 1 : 0.7,
  }));
}
