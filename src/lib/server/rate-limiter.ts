/**
 * Simple in-memory rate limiter.
 *
 * WARNING: In-memory rate limiting does NOT scale across multiple server instances.
 * For production deployments with multiple instances, use Redis or database-backed storage.
 * This implementation only works correctly for single-instance deployments.
 */

import { dev } from '$app/environment';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory storage for rate limit tracking
const limitStore = new Map<string, RateLimitEntry>();

// Log warning in production about in-memory limitations
if (!dev) {
  console.warn(
    '[rate-limiter] Using in-memory rate limiting. ' +
    'This does NOT scale across multiple server instances. ' +
    'Consider using Redis or database-backed storage for production.'
  );
}

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

// Simple IPv4/IPv6 validation regex
const IPV4_REGEX = /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/;
const IPV6_REGEX = /^(?:[a-fA-F0-9]{1,4}:){7}[a-fA-F0-9]{1,4}$|^::(?:[a-fA-F0-9]{1,4}:){0,6}[a-fA-F0-9]{1,4}$|^(?:[a-fA-F0-9]{1,4}:){1,7}:$|^(?:[a-fA-F0-9]{1,4}:){1,6}:[a-fA-F0-9]{1,4}$/;

function isValidIP(ip: string): boolean {
  return IPV4_REGEX.test(ip) || IPV6_REGEX.test(ip);
}

/**
 * Get client IP from request headers.
 * Handles common proxy headers with validation to prevent spoofing.
 *
 * NOTE: IP-based rate limiting can be bypassed if attackers control
 * the X-Forwarded-For header. In production, ensure your reverse proxy
 * (nginx, Cloudflare, Vercel) overwrites/validates these headers.
 */
export function getClientIP(request: Request): string {
  // Prefer Cloudflare's header (harder to spoof when behind CF)
  const cfIP = request.headers.get('cf-connecting-ip');
  if (cfIP) {
    const ip = cfIP.trim();
    if (isValidIP(ip)) return ip;
  }

  // X-Real-IP is typically set by nginx
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    const ip = realIP.trim();
    if (isValidIP(ip)) return ip;
  }

  // X-Forwarded-For can be spoofed, validate the IP format
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    // Take first IP in the chain (client IP)
    const ip = forwarded.split(',')[0].trim();
    if (isValidIP(ip)) return ip;
    // Log suspicious header for monitoring
    if (!dev) {
      console.warn(`[rate-limiter] Invalid IP in X-Forwarded-For: ${ip}`);
    }
  }

  // Fallback (won't work properly in production)
  return 'unknown';
}

/**
 * Check rate limit by user ID (preferred over IP when user is authenticated).
 * User-based rate limiting is more reliable than IP-based.
 */
export function checkRateLimitByUser(
  userId: string,
  type: RateLimitType
): { allowed: boolean; remaining: number; resetIn: number } {
  return checkRateLimit(`user:${userId}`, type);
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
