/**
 * sitemap.xml for SEOAuditLite
 * Lists main pages for search engines
 * Uses dynamic origin to support custom domains
 */

import type { RequestHandler } from './$types';
import { getBaseUrl, SITE_PAGES } from '$lib/config/site';

export const GET: RequestHandler = async ({ url }) => {
  const baseUrl = getBaseUrl(url);
  const today = new Date().toISOString().split('T')[0];

  const pages = SITE_PAGES.map((page) => ({
    url: `${baseUrl}${page.path}`,
    lastmod: today,
    changefreq: page.changefreq,
    priority: page.priority.toString(),
  }));

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
  .map(
    (page) => `  <url>
    <loc>${escapeXml(page.url)}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      'X-Content-Type-Options': 'nosniff'
    },
  });
};

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
