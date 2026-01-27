/**
 * DataForSEO API wrapper for search volume and keyword difficulty
 *
 * Docs: https://docs.dataforseo.com/v3/keywords_data/google_ads/search_volume/live
 * Pricing: ~$0.075 per request (up to 1000 keywords)
 * Rate limit: 12 requests per minute
 */

export interface DataForSEOKeywordData {
	keyword: string;
	searchVolume: number; // Monthly search volume
	competition: 'HIGH' | 'MEDIUM' | 'LOW' | null;
	competitionIndex: number; // 0-100
	cpc: number; // Cost per click
}

interface DataForSEOResponse {
	status_code: number;
	cost: number;
	tasks: Array<{
		result: Array<{
			keyword: string;
			search_volume: number;
			competition: string | null;
			competition_index: number;
			cpc: number;
		}>;
	}>;
}

/**
 * Fetch search volume and competition data from DataForSEO
 */
export async function fetchSearchVolume(
	keywords: string[],
	options: {
		locationCode?: number;
		languageCode?: string;
		username?: string;
		password?: string;
	} = {}
): Promise<DataForSEOKeywordData[]> {
	const { locationCode = 2840, languageCode = 'en', username, password } = options;

	if (!username || !password) {
		console.warn('[dataforseo] Credentials not provided, skipping search volume fetch');
		return keywords.map((keyword) => ({
			keyword,
			searchVolume: 0,
			competition: null,
			competitionIndex: 0,
			cpc: 0
		}));
	}

	// Limit to 1000 keywords per request
	const limitedKeywords = keywords.slice(0, 1000);

	try {
		const response = await fetch('https://api.dataforseo.com/v3/keywords_data/google_ads/search_volume/live', {
			method: 'POST',
			headers: {
				'Authorization': 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64'),
				'Content-Type': 'application/json'
			},
			body: JSON.stringify([
				{
					location_code: locationCode,
					language_code: languageCode,
					keywords: limitedKeywords
				}
			])
		});

		if (!response.ok) {
			throw new Error(`DataForSEO API returned ${response.status}`);
		}

		const data = (await response.json()) as DataForSEOResponse;

		if (data.status_code !== 20000) {
			throw new Error(`DataForSEO API error: ${data.status_code}`);
		}

		// Extract results
		const results = data.tasks[0]?.result || [];

		return results.map((item) => ({
			keyword: item.keyword,
			searchVolume: item.search_volume || 0,
			competition: (item.competition as 'HIGH' | 'MEDIUM' | 'LOW') || null,
			competitionIndex: item.competition_index || 0,
			cpc: item.cpc || 0
		}));
	} catch (error) {
		console.error('[dataforseo] Error fetching search volume:', error);
		// Return empty data on failure
		return keywords.map((keyword) => ({
			keyword,
			searchVolume: 0,
			competition: null,
			competitionIndex: 0,
			cpc: 0
		}));
	}
}
