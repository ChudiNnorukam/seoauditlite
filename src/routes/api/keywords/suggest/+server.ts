/**
 * API endpoint: POST /api/keywords/suggest
 * Returns autocomplete suggestions for a seed keyword
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import { checkRateLimit, getClientIP } from '$lib/server/rate-limiter';
import { expandKeyword } from '$lib/server/keywords/autocomplete';
import { getCached, setCached, CACHE_TTL } from '$lib/server/keywords/cache';
import type { AutocompleteResponse } from '$lib/server/keywords/types';

export const POST: RequestHandler = async ({ request }) => {
	// Rate limiting
	const clientIP = getClientIP(request);
	const rateLimitResult = checkRateLimit(clientIP, 'keywords_suggest');

	if (!rateLimitResult.allowed) {
		return json(
			{
				error: 'Rate limit exceeded',
				resetIn: rateLimitResult.resetIn
			},
			{
				status: 429,
				headers: {
					'X-RateLimit-Limit': '20',
					'X-RateLimit-Remaining': '0',
					'X-RateLimit-Reset': Math.ceil(rateLimitResult.resetIn / 1000).toString()
				}
			}
		);
	}

	// Parse request
	let seed: string;
	let lang: string;

	try {
		const body = await request.json();
		seed = body.seed?.trim();
		lang = body.lang || 'en';

		if (!seed || seed.length < 2) {
			return json({ error: 'Seed keyword must be at least 2 characters' }, { status: 400 });
		}

		if (seed.length > 100) {
			return json({ error: 'Seed keyword must be less than 100 characters' }, { status: 400 });
		}
	} catch {
		return json({ error: 'Invalid request body' }, { status: 400 });
	}

	// Check cache
	const cacheKey = `suggest:${seed}:${lang}`;
	const cached = await getCached<string[]>(cacheKey);

	if (cached) {
		return json(
			{
				suggestions: cached,
				cached: true,
				fromCache: true
			} satisfies AutocompleteResponse,
			{
				headers: {
					'X-RateLimit-Limit': '20',
					'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
					'Cache-Control': 'private, max-age=86400' // 24h client cache
				}
			}
		);
	}

	// Fetch suggestions
	try {
		const suggestions = await expandKeyword(seed, {
			includeAlphabet: true,
			includeQuestions: true,
			includePrepositions: true,
			concurrency: 5,
			delayMs: 200,
			lang
		});

		// Cache results
		await setCached(cacheKey, suggestions, 'autocomplete', CACHE_TTL.autocomplete);

		return json(
			{
				suggestions,
				cached: false,
				fromCache: false
			} satisfies AutocompleteResponse,
			{
				headers: {
					'X-RateLimit-Limit': '20',
					'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
					'Cache-Control': 'private, max-age=86400'
				}
			}
		);
	} catch (error) {
		console.error('[keywords/suggest] Error expanding keyword:', error);
		return json({ error: 'Failed to fetch suggestions' }, { status: 500 });
	}
};
