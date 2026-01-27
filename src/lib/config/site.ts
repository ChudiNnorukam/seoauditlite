/**
 * Site configuration for SEOAuditLite
 * Central config for URLs, metadata, and branding
 */

// Production domain - used when request context unavailable
export const SITE_URL = 'https://seoauditlite.com';

// Site metadata
export const SITE_CONFIG = {
	name: 'SEOAuditLite',
	tagline: 'AI Search Readiness Audit',
	description: 'Check your site\'s AEO (Answer Engine Optimization) readiness for Perplexity, ChatGPT, and Claude. Free audit in 2 minutes.',
	author: {
		name: 'Chudi Nnorukam',
		url: 'https://chudi.dev',
		twitter: '@chaborchudi'
	},
	social: {
		twitter: '@seoauditlite',
		github: 'https://github.com/ChudiNnorukam/seoauditlite'
	}
};

// Pages for sitemap
export const SITE_PAGES = [
	{ path: '/', changefreq: 'daily' as const, priority: 1.0 },
	{ path: '/report', changefreq: 'weekly' as const, priority: 0.8 },
	{ path: '/planner', changefreq: 'weekly' as const, priority: 0.7 },
	{ path: '/about', changefreq: 'monthly' as const, priority: 0.6 },
	{ path: '/contact', changefreq: 'monthly' as const, priority: 0.5 },
	{ path: '/privacy', changefreq: 'monthly' as const, priority: 0.3 },
	{ path: '/terms', changefreq: 'monthly' as const, priority: 0.3 },
	{ path: '/llms.txt', changefreq: 'weekly' as const, priority: 0.4 }
];

/**
 * Get the base URL, preferring request origin for dynamic environments
 */
export function getBaseUrl(requestUrl?: URL): string {
	if (requestUrl) {
		return requestUrl.origin;
	}
	return SITE_URL;
}
