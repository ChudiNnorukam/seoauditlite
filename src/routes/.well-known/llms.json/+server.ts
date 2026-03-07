/**
 * /.well-known/llms.json for SEOAuditLite
 * Machine-readable tool metadata for AI agent discovery
 */

import type { RequestHandler } from './$types';
import { SITE_CONFIG } from '$lib/config/site';

export const prerender = true;

export const GET: RequestHandler = async () => {
	const payload = {
		schema_version: '1.0',
		name: SITE_CONFIG.name,
		url: 'https://seoauditlite.com',
		description: SITE_CONFIG.tagline,
		type: 'tool',
		category: 'SEO / AEO',
		pricing: 'freemium',
		free_tier: '3 audits per month, no signup required',
		author: {
			name: 'Chudi Nnorukam',
			url: 'https://chudi.dev',
			email: 'hello@chudi.dev'
		},
		capabilities: [
			'AI crawler access audit (GPTBot, ClaudeBot, PerplexityBot)',
			'llms.txt validation',
			'Structured data / JSON-LD analysis',
			'Content extractability scoring',
			'AI metadata audit (canonical, OG tags, dates)',
			'Answer format check (FAQ/HowTo schema)'
		],
		endpoints: {
			homepage: 'https://seoauditlite.com',
			audit: 'https://seoauditlite.com/?domain={domain}',
			llms_txt: 'https://seoauditlite.com/llms.txt',
			sitemap: 'https://seoauditlite.com/sitemap.xml'
		},
		ecosystem: {
			parent_site: 'https://chudi.dev',
			related_tools: [
				{
					name: 'Review Reply Copilot',
					url: 'https://reviewreplycopilot.com',
					description: 'Free review reply generator for Google, Yelp, and Airbnb reviews'
				}
			]
		},
		generated_at: new Date().toISOString().split('T')[0]
	};

	return new Response(JSON.stringify(payload, null, 2), {
		headers: {
			'Content-Type': 'application/json',
			'Cache-Control': 'public, max-age=86400'
		}
	});
};
