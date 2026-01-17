/**
 * Simple in-memory rate limiter.
 *
 * For production, consider using Redis or a distributed rate limiter.
 * This implementation works well for single-instance deployments.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory storage for rate limit tracking
const limitStore = new Map<string, RateLimitEntry>();

// Cleanup interval (every 5 minutes)
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

// Rate limit configurations
export const RATE_LIMITS = {
  // Audit creation: 10 per minute per IP
  audit: { maxRequests: 10, windowMs: 60 * 1000 },
  // Checkout: 5 per minute per IP
  checkout: { maxRequests: 5, windowMs: 60 * 1000 },
  // API reads: 60 per minute per IP
  read: { maxRequests: 60, windowMs: 60 * 1000 }
} as const;

type RateLimitType = keyof typeof RATE_LIMITS;

/**
 * Check if a request should be rate limited.
 *
 * @param identifier - Unique identifier (e.g., IP address, entitlement key)
 * @param type - Type of rate limit to apply
 * @returns Object with allowed status and limit info
 */
export function checkRateLimit(
  identifier: string,
  type: RateLimitType
): { allowed: boolean; remaining: number; resetIn: number } {
  const config = RATE_LIMITS[type];
  const key = `${type}:${identifier}`;
  const now = Date.now();

  let entry = limitStore.get(key);

  // Reset if window has passed
  if (!entry || now >= entry.resetAt) {
    entry = {
      count: 0,
      resetAt: now + config.windowMs
    };
  }

  const remaining = Math.max(0, config.maxRequests - entry.count);
  const resetIn = Math.max(0, entry.resetAt - now);

  if (entry.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetIn };
  }

  // Increment count
  entry.count++;
  limitStore.set(key, entry);

  return {
    allowed: true,
    remaining: remaining - 1,
    resetIn
  };
}

/**
 * Get client IP from request headers.
 * Handles common proxy headers.
 */
export function getClientIP(request: Request): string {
  // Check common proxy headers
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    // Take first IP in the chain (client IP)
    return forwarded.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP.trim();
  }

  // Cloudflare
  const cfIP = request.headers.get('cf-connecting-ip');
  if (cfIP) {
    return cfIP.trim();
  }

  // Fallback (won't work in production)
  return 'unknown';
}

// Periodic cleanup of expired entries
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of limitStore.entries()) {
    if (now >= entry.resetAt) {
      limitStore.delete(key);
    }
  }
}, CLEANUP_INTERVAL_MS);
