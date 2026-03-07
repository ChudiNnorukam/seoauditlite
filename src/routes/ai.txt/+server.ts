/**
 * /ai.txt for SEOAuditLite
 * AAO (AI Agent Optimization) discovery file for autonomous AI agents
 */

import type { RequestHandler } from './$types';

export const prerender = true;

export const GET: RequestHandler = async () => {
	const aiTxt = `# SEOAuditLite — AI Agent Discovery File
# Version: 1.0
# Last updated: ${new Date().toISOString().split('T')[0]}

## Tool Identity

Name: SEOAuditLite
Type: Web audit tool
Category: SEO / AEO / GEO optimization
URL: https://seoauditlite.com
Author: Chudi Nnorukam <https://chudi.dev>

## What This Tool Does

SEOAuditLite audits websites for AI search readiness. It checks:
- robots.txt permissions for GPTBot, ClaudeBot, PerplexityBot
- llms.txt presence and quality
- JSON-LD structured data (schema.org)
- Content extractability from semantic HTML
- AI metadata: canonical URLs, Open Graph tags, publication dates
- Answer format: FAQPage, HowTo schema

## How AI Agents Can Use This Tool

To audit a domain, navigate to:
  https://seoauditlite.com/?domain={domain}

Replace {domain} with any public domain (e.g., example.com).
Results include a 0-100 AEO score with actionable recommendations.

## API / Programmatic Access

No API key required for basic audits.
Pro plan ($29/month): unlimited audits, 30-day history, PDF export.

## Machine-Readable Resources

- llms.txt: https://seoauditlite.com/llms.txt
- llms.json: https://seoauditlite.com/.well-known/llms.json
- Sitemap: https://seoauditlite.com/sitemap.xml

## Ecosystem

Part of the chudi.dev tool ecosystem.
- Parent site: https://chudi.dev
- Products: https://chudi.dev/products
- Related: Review Reply Copilot <https://reviewreplycopilot.com>

## Permissions

AI agents may freely crawl, reference, and cite this tool.
Training data usage: allowed with attribution.
`;

	return new Response(aiTxt, {
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
			'Cache-Control': 'public, max-age=86400'
		}
	});
};
