// ═══════════════════════════════════════════════════════════════
//  VAULTAGENT - RATE LIMITER
//  Production: Upstash Redis (persistent across serverless instances)
//  Development: In-memory fallback when Redis not configured
// ═══════════════════════════════════════════════════════════════

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// In-memory fallback for development
interface RateLimitEntry {
  count: number
  resetAt: number
}

const memoryStore = new Map<string, RateLimitEntry>()

// Initialize Upstash Redis if configured
let redis: Redis | null = null
let upstashLimiters: Map<string, Ratelimit> = new Map()

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  })
}

/**
 * Get or create an Upstash rate limiter for a specific configuration
 */
function getUpstashLimiter(limit: number, windowMs: number): Ratelimit {
  const key = `${limit}:${windowMs}`

  if (!upstashLimiters.has(key)) {
    upstashLimiters.set(key, new Ratelimit({
      redis: redis!,
      limiter: Ratelimit.slidingWindow(limit, `${windowMs}ms`),
      analytics: true,
      prefix: 'vaultagent',
    }))
  }

  return upstashLimiters.get(key)!
}

/**
 * In-memory rate limiting fallback
 */
function memoryRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { limited: boolean; remaining: number } {
  const now = Date.now()
  const entry = memoryStore.get(key)

  if (!entry || now > entry.resetAt) {
    memoryStore.set(key, { count: 1, resetAt: now + windowMs })
    return { limited: false, remaining: limit - 1 }
  }

  entry.count++
  if (entry.count > limit) {
    return { limited: true, remaining: 0 }
  }

  return { limited: false, remaining: limit - entry.count }
}

/**
 * Check if a request should be rate limited.
 * Uses Upstash Redis in production, in-memory in development.
 *
 * @param key - Unique identifier (e.g., userId or IP)
 * @param limit - Max requests per window
 * @param windowMs - Time window in milliseconds
 * @returns { limited: boolean, remaining: number }
 */
export async function rateLimitAsync(
  key: string,
  limit: number,
  windowMs: number
): Promise<{ limited: boolean; remaining: number }> {
  // Use Upstash if configured
  if (redis) {
    try {
      const limiter = getUpstashLimiter(limit, windowMs)
      const result = await limiter.limit(key)
      return {
        limited: !result.success,
        remaining: result.remaining,
      }
    } catch (err) {
      // Fall back to memory on Redis error
      console.error('[RateLimit] Upstash error, falling back to memory:', err)
      return memoryRateLimit(key, limit, windowMs)
    }
  }

  // Use in-memory fallback
  return memoryRateLimit(key, limit, windowMs)
}

/**
 * Synchronous rate limiting (uses in-memory only)
 * For backwards compatibility - prefer rateLimitAsync in new code
 *
 * @deprecated Use rateLimitAsync for production-grade rate limiting
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { limited: boolean; remaining: number } {
  // If Redis is configured, log a warning about using sync version
  if (redis && process.env.NODE_ENV === 'development') {
    console.warn('[RateLimit] Using sync rate limit with Redis configured. Consider using rateLimitAsync.')
  }
  return memoryRateLimit(key, limit, windowMs)
}

// Clean up expired in-memory entries periodically
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    memoryStore.forEach((entry, key) => {
      if (now > entry.resetAt) {
        memoryStore.delete(key)
      }
    })
  }, 60_000)
}
