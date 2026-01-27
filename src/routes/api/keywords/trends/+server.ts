/**
 * API endpoint: POST /api/keywords/trends
 * Returns Google Trends data for keywords
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import { checkRateLimit, getClientIP } from '$lib/server/rate-limiter';
import { fetchTrends, createTrendsCacheKey } from '$lib/server/keywords/trends';
import { getCached, setCached, CACHE_TTL } from '$lib/server/keywords/cache';
import type { KeywordTrend, TrendsResponse } from '$lib/server/keywords/types';

export const POST: RequestHandler = async ({ request }) => {
	// Rate limiting
	const clientIP = getClientIP(request);
	const rateLimitResult = checkRateLimit(clientIP, 'keywords_trends');

	if (!rateLimitResult.allowed) {
		return json(
			{
				error: 'Rate limit exceeded',
				resetIn: rateLimitResult.resetIn
			},
			{
				status: 429,
				headers: {
					'X-RateLimit-Limit': '10',
					'X-RateLimit-Remaining': '0',
					'X-RateLimit-Reset': Math.ceil(rateLimitResult.resetIn / 1000).toString()
				}
			}
		);
	}

	// Parse request
	let keywords: string[];
	let geo: string;

	try {
		const body = await request.json();
		keywords = body.keywords;
		geo = body.geo || 'US';

		if (!Array.isArray(keywords) || keywords.length === 0) {
			return json({ error: 'Keywords array is required' }, { status: 400 });
		}

		if (keywords.length > 5) {
			return json({ error: 'Maximum 5 keywords allowed' }, { status: 400 });
		}

		if (keywords.some((k) => typeof k !== 'string' || k.trim().length < 2)) {
			return json({ error: 'All keywords must be at least 2 characters' }, { status: 400 });
		}
	} catch {
		return json({ error: 'Invalid request body' }, { status: 400 });
	}

	// Check cache
	const cacheKey = createTrendsCacheKey(keywords, geo);
	const cached = await getCached<KeywordTrend[]>(cacheKey);

	if (cached) {
		return json(
			{
				trends: cached,
				cached: true,
				fromCache: true
			} satisfies TrendsResponse,
			{
				headers: {
					'X-RateLimit-Limit': '10',
					'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
					'Cache-Control': 'private, max-age=21600' // 6h client cache
				}
			}
		);
	}

	// Fetch trends
	try {
		const trends = await fetchTrends(keywords, { geo });

		// Cache results (even if empty due to API failure - prevents hammering)
		await setCached(cacheKey, trends, 'trends', CACHE_TTL.trends);

		return json(
			{
				trends,
				cached: false,
				fromCache: false
			} satisfies TrendsResponse,
			{
				headers: {
					'X-RateLimit-Limit': '10',
					'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
					'Cache-Control': 'private, max-age=21600'
				}
			}
		);
	} catch (error) {
		console.error('[keywords/trends] Error fetching trends:', error);
		return json({ error: 'Failed to fetch trends' }, { status: 500 });
	}
};
