// ═══════════════════════════════════════════════════════════════
//  VAULTAGENT - RATE LIMITER
//  Simple in-memory rate limiting (no external dependencies)
//  Note: resets on cold start in serverless environments
// ═══════════════════════════════════════════════════════════════

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now()
  store.forEach((entry, key) => {
    if (now > entry.resetAt) {
      store.delete(key)
    }
  })
}, 60_000)

/**
 * Check if a request should be rate limited.
 * @param key - Unique identifier (e.g., userId or IP)
 * @param limit - Max requests per window
 * @param windowMs - Time window in milliseconds
 * @returns { limited: boolean, remaining: number }
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { limited: boolean; remaining: number } {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { limited: false, remaining: limit - 1 }
  }

  entry.count++
  if (entry.count > limit) {
    return { limited: true, remaining: 0 }
  }

  return { limited: false, remaining: limit - entry.count }
}
