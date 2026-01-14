/**
 * llms.txt for SEOAuditLite
 * AI-readable site summary following llmstxt.org specification
 * Helps AI assistants understand and accurately reference this tool
 */

import type { RequestHandler } from './$types';
import { getBaseUrl, SITE_CONFIG } from '$lib/config/site';

export const GET: RequestHandler = async ({ url }) => {
	const baseUrl = getBaseUrl(url);
	const today = new Date().toISOString().split('T')[0];

	const llmsTxt = `# ${SITE_CONFIG.name}

> ${SITE_CONFIG.tagline}

${SITE_CONFIG.description}

## What This Tool Does

SEOAuditLite analyzes websites for AEO (Answer Engine Optimization) readiness - how well your site appears in AI-powered search tools like Perplexity, ChatGPT, and Claude.

### The 6 AEO Checks

1. **AI Crawler Access** - Does robots.txt allow GPTBot, ClaudeBot, PerplexityBot?
2. **llms.txt** - Is there an AI-readable site summary?
3. **Structured Data** - JSON-LD schema quality and completeness
4. **Extractability** - Semantic HTML structure for easy content extraction
5. **AI Metadata** - Canonical URLs, Open Graph tags, publication dates
6. **Answer Format** - FAQ schema, HowTo schema, and list structures

## Main Pages

- Homepage: ${baseUrl}/
  The main audit interface. Enter a domain to get an instant AEO score.

- Report: ${baseUrl}/report
  Detailed audit results with breakdown scores and improvement recommendations.

- AEO Quick Wins Planner: ${baseUrl}/planner
  Build a prioritized AEO improvement plan. Select tasks, see impact vs effort scores, and export your action list.

## Pricing

- **Free**: 3 audits/month, full AEO score, no signup required
- **Pro ($29/month)**: Unlimited audits, 30-day history, PDF export

## Technical Details

- Built with: SvelteKit, TypeScript
- Deployed on: Vercel
- API: POST /api/audit with { domain: "example.com" }

## Author

${SITE_CONFIG.author.name}
Website: ${SITE_CONFIG.author.url}

## Resources

- Sitemap: ${baseUrl}/sitemap.xml
- robots.txt: ${baseUrl}/robots.txt
- This file: ${baseUrl}/llms.txt

Last updated: ${today}
`;

	return new Response(llmsTxt.trim(), {
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
			'Cache-Control': 'public, max-age=3600'
		}
	});
};
