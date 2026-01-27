/**
 * Database-backed cache for keyword data
 * - Autocomplete: 24h TTL
 * - Trends: 6h TTL
 */

import { getDb } from '$lib/server/db';
import type { CacheEntry } from './types';

/**
 * Read from cache if not expired
 */
export async function getCached<T>(cacheKey: string): Promise<T | null> {
	const db = await getDb();
	const now = new Date().toISOString();

	try {
		const result = await db.execute({
			sql: 'SELECT data_json, expires_at FROM keyword_cache WHERE cache_key = ? AND expires_at > ?',
			args: [cacheKey, now]
		});

		if (result.rows.length === 0) {
			return null;
		}

		const row = result.rows[0];
		return JSON.parse(row.data_json as string) as T;
	} catch (error) {
		console.error(`[cache] Error reading cache for key ${cacheKey}:`, error);
		return null;
	}
}

/**
 * Write to cache with expiration
 */
export async function setCached<T>(
	cacheKey: string,
	data: T,
	source: string,
	ttlMs: number
): Promise<void> {
	const db = await getDb();
	const now = new Date();
	const expiresAt = new Date(now.getTime() + ttlMs).toISOString();

	try {
		await db.execute({
			sql: `INSERT OR REPLACE INTO keyword_cache (cache_key, data_json, source, created_at, expires_at)
			      VALUES (?, ?, ?, ?, ?)`,
			args: [cacheKey, JSON.stringify(data), source, now.toISOString(), expiresAt]
		});
	} catch (error) {
		console.error(`[cache] Error writing cache for key ${cacheKey}:`, error);
	}
}

/**
 * Purge expired cache entries (run periodically)
 */
export async function purgeExpiredCache(): Promise<number> {
	const db = await getDb();
	const now = new Date().toISOString();

	try {
		const result = await db.execute({
			sql: 'DELETE FROM keyword_cache WHERE expires_at <= ?',
			args: [now]
		});

		return result.rowsAffected;
	} catch (error) {
		console.error('[cache] Error purging expired cache:', error);
		return 0;
	}
}

/**
 * Cache TTL configurations
 */
export const CACHE_TTL = {
	autocomplete: 24 * 60 * 60 * 1000, // 24 hours
	trends: 6 * 60 * 60 * 1000 // 6 hours
} as const;
