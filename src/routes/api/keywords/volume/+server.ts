/**
 * API endpoint: POST /api/keywords/volume
 * Returns search volume data from DataForSEO (optional - requires credentials)
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import { checkRateLimit, getClientIP } from '$lib/server/rate-limiter';
import { fetchSearchVolume } from '$lib/server/keywords/dataforseo';
import { getCached, setCached, CACHE_TTL } from '$lib/server/keywords/cache';
import type { DataForSEOKeywordData } from '$lib/server/keywords/dataforseo';
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ request }) => {
	// Rate limiting (share with trends limit)
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

	try {
		const body = await request.json();
		keywords = body.keywords;

		if (!Array.isArray(keywords) || keywords.length === 0) {
			return json({ error: 'Keywords array is required' }, { status: 400 });
		}

		if (keywords.length > 100) {
			return json({ error: 'Maximum 100 keywords allowed per request' }, { status: 400 });
		}
	} catch {
		return json({ error: 'Invalid request body' }, { status: 400 });
	}

	// Check if DataForSEO credentials are configured
	const username = env.DATAFORSEO_USERNAME;
	const password = env.DATAFORSEO_PASSWORD;

	if (!username || !password) {
		// Return graceful degradation - no volume data
		return json({
			volumeData: keywords.map((keyword) => ({
				keyword,
				searchVolume: 0,
				competition: null,
				competitionIndex: 0,
				cpc: 0
			})),
			available: false,
			message: 'Search volume data requires DataForSEO API credentials'
		});
	}

	// Check cache
	const cacheKey = `volume:${keywords.sort().join(',')}`;
	const cached = await getCached<DataForSEOKeywordData[]>(cacheKey);

	if (cached) {
		return json(
			{
				volumeData: cached,
				available: true,
				cached: true
			},
			{
				headers: {
					'X-RateLimit-Limit': '10',
					'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
					'Cache-Control': 'private, max-age=86400' // 24h cache
				}
			}
		);
	}

	// Fetch search volume
	try {
		const volumeData = await fetchSearchVolume(keywords, {
			username,
			password,
			locationCode: 2840, // US
			languageCode: 'en'
		});

		// Cache results
		await setCached(cacheKey, volumeData, 'dataforseo', CACHE_TTL.autocomplete); // 24h

		return json(
			{
				volumeData,
				available: true,
				cached: false
			},
			{
				headers: {
					'X-RateLimit-Limit': '10',
					'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
					'Cache-Control': 'private, max-age=86400'
				}
			}
		);
	} catch (error) {
		console.error('[keywords/volume] Error fetching volume data:', error);
		return json({ error: 'Failed to fetch volume data' }, { status: 500 });
	}
};
