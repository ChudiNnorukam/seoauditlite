/**
 * robots.txt for SEOAuditLite
 * Allows all AI crawlers and search engines
 * Uses dynamic origin to support custom domains
 */

import type { RequestHandler } from './$types';
import { getBaseUrl } from '$lib/config/site';

export const GET: RequestHandler = async ({ url }) => {
  const baseUrl = getBaseUrl(url);

  const robots = `# Allow all crawlers
User-agent: *
Allow: /

# AI Search Engine Crawlers - Explicitly Allow
User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Googlebot-Extended
Allow: /

User-agent: CCBot
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: Google-Extended
Allow: /

# AI Context Files
# llms.txt - AI-readable site summary
# See: https://llmstxt.org/

# Sitemap
Sitemap: ${baseUrl}/sitemap.xml`;

  return new Response(robots, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
};
