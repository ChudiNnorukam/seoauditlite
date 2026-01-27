/**
 * Google Trends API wrapper
 *
 * WARNING: google-trends-api can be flaky with rate limiting.
 * Mitigation: Make trends data optional in UI, show "N/A" if unavailable.
 */

import googleTrends from 'google-trends-api';
import type { KeywordTrend } from './types';

interface TrendsDataPoint {
	time: string;
	value: number[];
	formattedTime: string;
	formattedAxisTime: string;
	formattedValue: string[];
	hasData: boolean[];
}

interface TrendsResult {
	default: {
		timelineData: TrendsDataPoint[];
	};
}

/**
 * Fetch interest over time for keywords
 */
export async function fetchTrends(
	keywords: string[],
	options: {
		geo?: string;
		startTime?: Date;
		endTime?: Date;
		retries?: number;
	} = {}
): Promise<KeywordTrend[]> {
	const { geo = 'US', startTime, endTime, retries = 2 } = options;

	// Default to last 90 days
	const start = startTime || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
	const end = endTime || new Date();

	// Limit to 5 keywords (Google Trends API limit)
	const limitedKeywords = keywords.slice(0, 5);

	let lastError: Error | null = null;

	for (let attempt = 0; attempt <= retries; attempt++) {
		try {
			const result = await googleTrends.interestOverTime({
				keyword: limitedKeywords,
				startTime: start,
				endTime: end,
				geo
			});

			const parsed = JSON.parse(result) as TrendsResult;
			const timelineData = parsed.default?.timelineData || [];

			return limitedKeywords.map((keyword, index) => {
				const values = timelineData
					.map((point) => point.value[index])
					.filter((v) => typeof v === 'number');

				const avgInterest = values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
				const trendDirection = calculateTrendDirection(values);

				return {
					keyword,
					relativeInterest: avgInterest,
					trendDirection,
					sparkline: values.slice(-30) // Last 30 data points for sparkline
				};
			});
		} catch (error) {
			lastError = error as Error;
			console.error(`[trends] Attempt ${attempt + 1}/${retries + 1} failed:`, error);

			// Wait before retry (exponential backoff)
			if (attempt < retries) {
				await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
			}
		}
	}

	// All retries failed - return empty trends with unknown direction
	console.error('[trends] All retries failed:', lastError);
	return limitedKeywords.map((keyword) => ({
		keyword,
		relativeInterest: 0,
		trendDirection: 'unknown' as const,
		sparkline: []
	}));
}

/**
 * Calculate trend direction from sparkline data
 */
function calculateTrendDirection(values: number[]): 'rising' | 'stable' | 'falling' | 'unknown' {
	if (values.length < 2) {
		return 'unknown';
	}

	// Compare last 7 days to previous 7 days
	const recentWindow = values.slice(-7);
	const previousWindow = values.slice(-14, -7);

	if (recentWindow.length === 0 || previousWindow.length === 0) {
		return 'unknown';
	}

	const recentAvg = recentWindow.reduce((a, b) => a + b, 0) / recentWindow.length;
	const previousAvg = previousWindow.reduce((a, b) => a + b, 0) / previousWindow.length;

	// Avoid division by zero for new/emerging keywords with zero historical data
	if (previousAvg === 0) {
		return recentAvg > 0 ? 'rising' : 'unknown';
	}

	const change = ((recentAvg - previousAvg) / previousAvg) * 100;

	if (change > 10) return 'rising';
	if (change < -10) return 'falling';
	return 'stable';
}

/**
 * Create cache key for trends data
 */
export function createTrendsCacheKey(keywords: string[], geo = 'US'): string {
	const sortedKeywords = [...keywords].sort();
	const hash = sortedKeywords.join(',');
	return `trends:${hash}:${geo}`;
}
