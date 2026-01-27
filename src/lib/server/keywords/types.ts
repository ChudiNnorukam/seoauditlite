/**
 * Shared TypeScript interfaces for keyword research tool
 */

export interface KeywordSuggestion {
	keyword: string;
	source: 'autocomplete' | 'trends';
}

export interface KeywordTrend {
	keyword: string;
	relativeInterest: number; // 0-100
	trendDirection: 'rising' | 'stable' | 'falling' | 'unknown';
	sparkline: number[]; // Last 90 days of interest data
}

export interface KeywordIntent {
	keyword: string;
	intent: 'informational' | 'navigational' | 'transactional' | 'unknown';
	confidence: number; // 0-1
}

export interface KeywordResult {
	keyword: string;
	relativeInterest: number;
	trendDirection: 'rising' | 'stable' | 'falling' | 'unknown';
	sparkline: number[];
	intent: 'informational' | 'navigational' | 'transactional' | 'unknown';
}

export interface CacheEntry {
	cacheKey: string;
	dataJson: string;
	source: string;
	createdAt: string;
	expiresAt: string;
}

export interface AutocompleteResponse {
	suggestions: string[];
	cached: boolean;
	fromCache?: boolean;
}

export interface TrendsResponse {
	trends: KeywordTrend[];
	cached: boolean;
	fromCache?: boolean;
}
