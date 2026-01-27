/**
 * Google Autocomplete API wrapper with alphabet expansion
 *
 * WARNING: Uses unofficial Google Autocomplete endpoint. May be blocked.
 * Mitigation: Aggressive caching (24h), graceful error handling.
 */

import type { KeywordSuggestion } from './types';

/**
 * Fetch autocomplete suggestions from Google
 */
async function fetchAutocomplete(query: string, lang = 'en'): Promise<string[]> {
	const url = `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(query)}&hl=${lang}`;

	try {
		const response = await fetch(url, {
			headers: {
				'User-Agent': 'Mozilla/5.0 (compatible; SEOAuditLite/1.0)'
			}
		});

		if (!response.ok) {
			throw new Error(`Autocomplete API returned ${response.status}`);
		}

		const data = await response.json();

		// Response format: [query, [suggestions]]
		if (Array.isArray(data) && Array.isArray(data[1])) {
			return data[1] as string[];
		}

		return [];
	} catch (error) {
		console.error(`[autocomplete] Error fetching suggestions for "${query}":`, error);
		return [];
	}
}

/**
 * Expand seed keyword with alphabet soup (a-z), questions, prepositions
 */
export async function expandKeyword(
	seed: string,
	options: {
		includeAlphabet?: boolean;
		includeQuestions?: boolean;
		includePrepositions?: boolean;
		concurrency?: number;
		delayMs?: number;
		lang?: string;
	} = {}
): Promise<string[]> {
	const {
		includeAlphabet = true,
		includeQuestions = true,
		includePrepositions = true,
		concurrency = 5,
		delayMs = 200,
		lang = 'en'
	} = options;

	const queries: string[] = [seed]; // Base query
	const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');
	const questions = ['what', 'how', 'why', 'when', 'where', 'who', 'which'];
	const prepositions = ['for', 'vs', 'with', 'without', 'to', 'near', 'like'];

	// Alphabet soup: "seed a", "seed b", ...
	if (includeAlphabet) {
		queries.push(...alphabet.map((letter) => `${seed} ${letter}`));
	}

	// Question words: "how to seed", "what is seed", ...
	if (includeQuestions) {
		queries.push(...questions.map((q) => `${q} ${seed}`));
	}

	// Prepositions: "seed for", "seed vs", ...
	if (includePrepositions) {
		queries.push(...prepositions.map((p) => `${seed} ${p}`));
	}

	// Batch fetch with concurrency limit
	const results: string[] = [];
	const batches: string[][] = [];

	for (let i = 0; i < queries.length; i += concurrency) {
		batches.push(queries.slice(i, i + concurrency));
	}

	for (const batch of batches) {
		const batchResults = await Promise.all(batch.map((q) => fetchAutocomplete(q, lang)));
		results.push(...batchResults.flat());

		// Delay between batches to avoid IP blocks
		if (delayMs > 0) {
			await new Promise((resolve) => setTimeout(resolve, delayMs));
		}
	}

	// Deduplicate and return
	const uniqueSuggestions = Array.from(new Set(results)).filter(Boolean);
	return uniqueSuggestions;
}

/**
 * Classify keyword intent using heuristics
 */
export function classifyIntent(keyword: string): 'informational' | 'navigational' | 'transactional' | 'unknown' {
	const lower = keyword.toLowerCase();

	// Transactional signals
	const transactional = [
		'buy', 'price', 'cost', 'cheap', 'deal', 'discount', 'coupon',
		'free', 'download', 'trial', 'review', 'best', 'top', 'vs'
	];
	if (transactional.some((word) => lower.includes(word))) {
		return 'transactional';
	}

	// Informational signals
	const informational = [
		'how to', 'what is', 'why', 'guide', 'tutorial', 'learn',
		'meaning', 'definition', 'example', 'tips', 'ideas'
	];
	if (informational.some((phrase) => lower.includes(phrase))) {
		return 'informational';
	}

	// Navigational signals (brand names, specific domains)
	const navigational = ['login', 'sign in', 'official', 'website', 'app'];
	if (navigational.some((word) => lower.includes(word))) {
		return 'navigational';
	}

	return 'unknown';
}
