/**
 * robots.txt for SEOAuditLite
 * Allows all AI crawlers and search engines
 */

export const GET = async () => {
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

# Sitemap
Sitemap: https://seoauditlite.vercel.app/sitemap.xml`;

  return new Response(robots, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
    },
  });
};
