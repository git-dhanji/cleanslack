import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"
import type { NextRequest } from "next/server"

// Rate limiting configuration using Upstash Redis
// This prevents code enumeration, signaling spam, and DoS attacks

const REST_URL = process.env.UPSTASH_REDIS_REST_URL
const REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN

// Create Redis client for rate limiting (only if configured)
let redis: Redis | null = null
if (REST_URL && REST_TOKEN) {
    redis = new Redis({
        url: REST_URL,
        token: REST_TOKEN,
    })
    console.log("✅ Redis connection established for rate limiting")
    console.log("📊 Redis URL:", REST_URL)
} else {
    console.warn("⚠️ Redis not configured - rate limiting disabled")
}

// Different rate limiters for different endpoints
// Using sliding window algorithm for more accurate rate limiting

// Code endpoint rate limiter: prevents code enumeration attacks
// Allows 20 requests per 10 seconds per IP (generous for legitimate use)
export const codeRateLimiter = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(20, "10 s"),
        analytics: true,
        prefix: "ratelimit:code",
    })
    : null

// Signal GET (polling) rate limiter: prevents polling spam
// Allows 60 requests per 10 seconds (6 per second) per IP+code combination
// This is reasonable for WebRTC handshake polling (typically 2-3/sec)
export const signalPollRateLimiter = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(60, "10 s"),
        analytics: true,
        prefix: "ratelimit:signal:poll",
    })
    : null

// Signal POST rate limiter: prevents message spam
// Allows 30 requests per 10 seconds per IP+code combination
// WebRTC handshake exchanges ~10-20 messages total
export const signalPostRateLimiter = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(30, "10 s"),
        analytics: true,
        prefix: "ratelimit:signal:post",
    })
    : null

// Extract client identifier from request
// Uses IP address, falls back to a generic identifier if unavailable
export function getClientIdentifier(request: NextRequest): string {
    // Try to get real IP from various headers (Vercel, Cloudflare, etc.)
    const forwarded = request.headers.get("x-forwarded-for")
    const realIp = request.headers.get("x-real-ip")
    const cfIp = request.headers.get("cf-connecting-ip")

    const ip = cfIp || realIp || forwarded?.split(",")[0] || "anonymous"
    return ip.trim()
}

// Create a composite identifier for signaling endpoints (IP + code)
// This prevents one user from exhausting the rate limit for all codes
export function getSignalIdentifier(request: NextRequest, code: string): string {
    const ip = getClientIdentifier(request)
    return `${ip}:${code}`
}

// Check rate limit and return appropriate response
export async function checkRateLimit(
    limiter: Ratelimit | null,
    identifier: string,
): Promise<{ success: boolean; response?: Response }> {
    // If rate limiting is not configured (no Redis), allow the request
    if (!limiter) {
        return { success: true }
    }

    try {
        const { success, limit, remaining, reset } = await limiter.limit(identifier)

        console.log("🔍 Rate limit check:", {
            identifier,
            success,
            limit,
            remaining,
            reset: new Date(reset).toISOString()
        })

        if (!success) {
            // Rate limit exceeded
            const now = Date.now()
            const resetDate = new Date(reset)
            const retryAfter = Math.ceil((resetDate.getTime() - now) / 1000)

            return {
                success: false,
                response: new Response(
                    JSON.stringify({
                        error: "Too many requests",
                        retryAfter,
                    }),
                    {
                        status: 429,
                        headers: {
                            "Content-Type": "application/json",
                            "Cache-Control": "no-store",
                            "Retry-After": String(retryAfter),
                            "X-RateLimit-Limit": String(limit),
                            "X-RateLimit-Remaining": "0",
                            "X-RateLimit-Reset": String(Math.floor(resetDate.getTime() / 1000)),
                        },
                    },
                ),
            }
        }

        // Rate limit check passed
        return { success: true }
    } catch (error) {
        // If rate limiting fails (Redis error), allow the request
        // This ensures the service degrades gracefully
        console.error("Rate limit check failed:", error)
        return { success: true }
    }
}
