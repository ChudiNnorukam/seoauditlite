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
 * Classify keyword intent using weighted scoring heuristics
 *
 * Improved accuracy by:
 * - Using weighted scores instead of binary matching
 * - Checking informational signals first (more specific)
 * - Considering word position (start/end matters)
 * - Context-aware matching ("free guide" vs "seo tool free")
 */
export function classifyIntent(keyword: string): 'informational' | 'navigational' | 'transactional' | 'unknown' {
	const lower = keyword.toLowerCase();

	// Weighted scoring: higher score = stronger signal
	let informationalScore = 0;
	let transactionalScore = 0;
	let navigationalScore = 0;

	// Informational signals (check first - more specific)
	const informational = {
		strong: ['how to', 'what is', 'what are', 'why', 'when to', 'guide', 'tutorial', 'meaning', 'definition'],
		medium: ['learn', 'example', 'tips', 'ideas', 'explained', 'understand', 'basics', 'beginner'],
		weak: ['help', 'info', 'about']
	};

	informational.strong.forEach(phrase => {
		if (lower.includes(phrase)) {
			informationalScore += lower.startsWith(phrase) ? 3 : 2.5;
		}
	});
	informational.medium.forEach(phrase => {
		if (lower.includes(phrase)) informationalScore += 1.5;
	});
	informational.weak.forEach(word => {
		if (lower.includes(word)) informationalScore += 0.5;
	});

	// Transactional signals
	const transactional = {
		strong: ['buy', 'purchase', 'price', 'pricing', 'cost', 'cheap', 'discount', 'coupon', 'deal', 'order'],
		medium: ['best', 'top', 'review', 'comparison', 'vs', 'versus', 'alternative'],
		weak: ['free', 'trial', 'download'] // Weak because "free guide" is informational
	};

	transactional.strong.forEach(word => {
		if (lower.includes(word)) {
			transactionalScore += lower.startsWith(word) ? 3 : 2.5;
		}
	});
	transactional.medium.forEach(word => {
		if (lower.includes(word)) transactionalScore += 1.5;
	});
	transactional.weak.forEach(word => {
		// Only count if at end (e.g., "seo tool free" not "free seo guide")
		if (lower.endsWith(word) || lower.includes(` ${word} `)) {
			transactionalScore += 0.5;
		}
	});

	// Navigational signals
	const navigational = {
		strong: ['login', 'sign in', 'sign up', 'register', 'dashboard', 'account', 'portal'],
		medium: ['official', 'website', 'site', 'app', 'platform'],
		weak: ['online', 'web']
	};

	navigational.strong.forEach(phrase => {
		if (lower.includes(phrase)) navigationalScore += 2.5;
	});
	navigational.medium.forEach(word => {
		if (lower.includes(word)) navigationalScore += 1.5;
	});
	navigational.weak.forEach(word => {
		if (lower.includes(word)) navigationalScore += 0.5;
	});

	// Determine intent by highest score (with minimum threshold)
	const maxScore = Math.max(informationalScore, transactionalScore, navigationalScore);

	if (maxScore < 1) return 'unknown'; // No strong signals

	if (informationalScore === maxScore) return 'informational';
	if (transactionalScore === maxScore) return 'transactional';
	if (navigationalScore === maxScore) return 'navigational';

	return 'unknown';
}
