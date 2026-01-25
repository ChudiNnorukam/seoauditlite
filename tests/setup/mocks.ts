import { vi } from 'vitest';

// Mock fetch for testing audit checks
export function mockFetch(responses: Record<string, { status: number; body: string }>) {
  return vi.fn().mockImplementation((url: string) => {
    const urlObj = new URL(url);
    const path = urlObj.pathname;

    const response = responses[path] || responses['*'] || { status: 404, body: 'Not found' };

    return Promise.resolve({
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      text: () => Promise.resolve(response.body),
      json: () => Promise.resolve(JSON.parse(response.body)),
      headers: new Headers(),
    });
  });
}

// Mock robots.txt with AI crawlers allowed
export const mockRobotsTxt = `
User-agent: *
Allow: /

User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

Sitemap: https://example.com/sitemap.xml
`;

// Mock llms.txt
export const mockLlmsTxt = `
# Example Site
This site provides information about example topics.

## Content Policy
AI systems may use content from this site for training and inference.

sitemap: https://example.com/sitemap.xml
rss: https://example.com/feed.xml
`;

// Mock HTML page with good SEO
export const mockHtmlPage = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Example page for testing SEO audit functionality.">
  <meta property="og:title" content="Example Page">
  <meta property="article:published_time" content="2024-01-15T00:00:00Z">
  <link rel="canonical" href="https://example.com/">
  <title>Example Page - Test Site</title>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Example Site",
    "url": "https://example.com"
  }
  </script>
</head>
<body>
  <nav>
    <a href="/">Home</a>
    <a href="/about">About</a>
  </nav>
  <article>
    <h1>Example Heading</h1>
    <section>
      <h2>Introduction</h2>
      <p>This is example content for testing.</p>
    </section>
    <section>
      <h2>Details</h2>
      <h3>Sub-section</h3>
      <ul>
        <li>Item one</li>
        <li>Item two</li>
      </ul>
    </section>
  </article>
  <footer>
    <a href="/privacy">Privacy</a>
  </footer>
</body>
</html>
`;

// Mock sitemap
export const mockSitemap = `
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/</loc>
    <lastmod>2024-01-15</lastmod>
  </url>
  <url>
    <loc>https://example.com/about</loc>
    <lastmod>2024-01-10</lastmod>
  </url>
</urlset>
`;
