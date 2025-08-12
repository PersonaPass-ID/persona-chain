/**
 * PersonaPass API Rate Limiting Middleware
 * 
 * Production-ready rate limiting for Next.js API routes with Redis support,
 * IP address handling, and comprehensive security features.
 * 
 * Based on OWASP security guidelines and express-rate-limit patterns.
 */

import { NextRequest, NextResponse } from 'next/server'
import { env } from './env'

// Rate limit store interface for different backends
interface RateLimitStore {
  get(key: string): Promise<{ hits: number; resetTime: Date } | null>
  increment(key: string, windowMs: number): Promise<{ hits: number; resetTime: Date }>
  reset(key: string): Promise<void>
  resetAll?(): Promise<void>
}

// In-memory store for development (not recommended for production clusters)
class MemoryStore implements RateLimitStore {
  private store = new Map<string, { hits: number; resetTime: Date }>()
  private timers = new Map<string, NodeJS.Timeout>()

  async get(key: string): Promise<{ hits: number; resetTime: Date } | null> {
    return this.store.get(key) || null
  }

  async increment(key: string, windowMs: number): Promise<{ hits: number; resetTime: Date }> {
    const now = new Date()
    const existing = this.store.get(key)

    if (!existing || existing.resetTime <= now) {
      // Create new entry or reset expired entry
      const resetTime = new Date(now.getTime() + windowMs)
      const entry = { hits: 1, resetTime }
      
      this.store.set(key, entry)
      
      // Clear existing timer and set new one
      const existingTimer = this.timers.get(key)
      if (existingTimer) clearTimeout(existingTimer)
      
      this.timers.set(key, setTimeout(() => {
        this.store.delete(key)
        this.timers.delete(key)
      }, windowMs))
      
      return entry
    } else {
      // Increment existing entry
      existing.hits++
      this.store.set(key, existing)
      return existing
    }
  }

  async reset(key: string): Promise<void> {
    const timer = this.timers.get(key)
    if (timer) {
      clearTimeout(timer)
      this.timers.delete(key)
    }
    this.store.delete(key)
  }

  async resetAll(): Promise<void> {
    for (const timer of this.timers.values()) {
      clearTimeout(timer)
    }
    this.timers.clear()
    this.store.clear()
  }
}

// Redis store for production (requires Redis connection)
class RedisStore implements RateLimitStore {
  private prefix: string

  constructor(private redis: any, prefix = 'rl:') {
    this.prefix = prefix
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`
  }

  async get(key: string): Promise<{ hits: number; resetTime: Date } | null> {
    const redisKey = this.getKey(key)
    const pipeline = this.redis.pipeline()
    pipeline.hgetall(redisKey)
    pipeline.ttl(redisKey)
    
    const [[, data], [, ttl]] = await pipeline.exec()
    
    if (!data || !data.hits) return null
    
    const resetTime = new Date(Date.now() + (ttl * 1000))
    return {
      hits: parseInt(data.hits, 10),
      resetTime
    }
  }

  async increment(key: string, windowMs: number): Promise<{ hits: number; resetTime: Date }> {
    const redisKey = this.getKey(key)
    const pipeline = this.redis.pipeline()
    
    pipeline.hincrby(redisKey, 'hits', 1)
    pipeline.expire(redisKey, Math.ceil(windowMs / 1000))
    pipeline.hget(redisKey, 'hits')
    
    const results = await pipeline.exec()
    const hits = parseInt(results[2][1], 10)
    const resetTime = new Date(Date.now() + windowMs)
    
    return { hits, resetTime }
  }

  async reset(key: string): Promise<void> {
    await this.redis.del(this.getKey(key))
  }

  async resetAll(): Promise<void> {
    const keys = await this.redis.keys(`${this.prefix}*`)
    if (keys.length > 0) {
      await this.redis.del(...keys)
    }
  }
}

// Rate limit configuration options
export interface RateLimitOptions {
  windowMs?: number           // Time window in milliseconds (default: 15 minutes)
  max?: number               // Maximum requests per window (default: 100)
  message?: string | object  // Error message when limit exceeded
  statusCode?: number        // HTTP status code when limit exceeded (default: 429)
  standardHeaders?: boolean  // Send standard RateLimit headers (default: true)
  legacyHeaders?: boolean    // Send legacy X-RateLimit headers (default: false)
  store?: RateLimitStore    // Custom store implementation
  keyGenerator?: (req: NextRequest) => string  // Custom key generation function
  skip?: (req: NextRequest) => boolean | Promise<boolean>  // Skip rate limiting function
  onLimitReached?: (req: NextRequest, identifier: string) => void | Promise<void>  // Callback when limit reached
}

// Rate limit result information
export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: Date
  identifier: string
}

// Default configuration
const DEFAULT_OPTIONS: Required<Omit<RateLimitOptions, 'store' | 'keyGenerator' | 'skip' | 'onLimitReached'>> = {
  windowMs: env.API_RATE_LIMIT_WINDOW_MS,
  max: env.API_RATE_LIMIT_MAX_REQUESTS,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    type: 'rate_limit_exceeded'
  },
  statusCode: 429,
  standardHeaders: true,
  legacyHeaders: false,
}

// Extract client IP address with proxy support
function getClientIP(req: NextRequest): string {
  // Check forwarded headers (for proxies/load balancers)
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    // Take the first IP from the comma-separated list
    const firstIP = forwarded.split(',')[0].trim()
    // Remove port if present (e.g., "192.168.1.1:54321" -> "192.168.1.1")
    return firstIP.replace(/:\d+$/, '')
  }

  // Check other common headers
  const realIP = req.headers.get('x-real-ip')
  if (realIP) return realIP.replace(/:\d+$/, '')

  const cfConnectingIP = req.headers.get('cf-connecting-ip')
  if (cfConnectingIP) return cfConnectingIP.replace(/:\d+$/, '')

  // Fallback to connection remote address
  return req.ip || 'unknown'
}

// Default key generator (uses IP address)
function defaultKeyGenerator(req: NextRequest): string {
  return getClientIP(req)
}

// Create rate limit store instance
function createStore(): RateLimitStore {
  // Use Redis in production if available
  if (env.REDIS_URL && env.NODE_ENV === 'production') {
    try {
      // Dynamic import for Redis (optional dependency)
      const Redis = require('ioredis')
      const redis = new Redis(env.REDIS_URL, {
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      })
      
      return new RedisStore(redis)
    } catch (error) {
      console.warn('⚠️  Redis not available, falling back to memory store:', error.message)
    }
  }

  // Use memory store as fallback
  return new MemoryStore()
}

// Global store instance
let globalStore: RateLimitStore | null = null

function getStore(): RateLimitStore {
  if (!globalStore) {
    globalStore = createStore()
  }
  return globalStore
}

// Main rate limiting function
export async function rateLimit(
  req: NextRequest,
  options: RateLimitOptions = {}
): Promise<RateLimitResult> {
  const config = { ...DEFAULT_OPTIONS, ...options }
  const store = options.store || getStore()
  const keyGenerator = options.keyGenerator || defaultKeyGenerator
  
  // Generate identifier for this request
  const identifier = keyGenerator(req)
  
  // Check if we should skip rate limiting
  if (options.skip) {
    const shouldSkip = await options.skip(req)
    if (shouldSkip) {
      return {
        success: true,
        limit: config.max,
        remaining: config.max,
        reset: new Date(Date.now() + config.windowMs),
        identifier
      }
    }
  }

  // Get current hit count and increment
  const { hits, resetTime } = await store.increment(identifier, config.windowMs)
  const remaining = Math.max(0, config.max - hits)
  const success = hits <= config.max

  // Call onLimitReached callback if limit exceeded for the first time
  if (!success && hits === config.max + 1 && options.onLimitReached) {
    try {
      await options.onLimitReached(req, identifier)
    } catch (error) {
      console.error('Rate limit onLimitReached callback error:', error)
    }
  }

  return {
    success,
    limit: config.max,
    remaining,
    reset: resetTime,
    identifier
  }
}

// Middleware function for Next.js API routes
export function createRateLimitMiddleware(options: RateLimitOptions = {}) {
  const config = { ...DEFAULT_OPTIONS, ...options }

  return async function rateLimitMiddleware(req: NextRequest): Promise<NextResponse | null> {
    const result = await rateLimit(req, options)

    // Create response with rate limit headers
    const response = result.success 
      ? null  // Continue to next handler
      : NextResponse.json(config.message, { status: config.statusCode })

    // Add rate limit headers
    const headers = new Headers()
    
    if (config.standardHeaders) {
      // RFC 6585 standard headers
      headers.set('RateLimit-Limit', config.max.toString())
      headers.set('RateLimit-Remaining', result.remaining.toString())
      headers.set('RateLimit-Reset', Math.ceil(result.reset.getTime() / 1000).toString())
      headers.set('RateLimit-Policy', `${config.max};w=${Math.ceil(config.windowMs / 1000)}`)
    }

    if (config.legacyHeaders) {
      // Legacy X-RateLimit headers for backward compatibility
      headers.set('X-RateLimit-Limit', config.max.toString())
      headers.set('X-RateLimit-Remaining', result.remaining.toString())
      headers.set('X-RateLimit-Reset', Math.ceil(result.reset.getTime() / 1000).toString())
    }

    // Add Retry-After header when rate limited
    if (!result.success) {
      const retryAfterSeconds = Math.ceil((result.reset.getTime() - Date.now()) / 1000)
      headers.set('Retry-After', retryAfterSeconds.toString())
    }

    // Apply headers to response
    if (response) {
      headers.forEach((value, key) => {
        response.headers.set(key, value)
      })
    }

    return response
  }
}

// Utility function to check rate limit without incrementing
export async function checkRateLimit(
  req: NextRequest, 
  options: RateLimitOptions = {}
): Promise<RateLimitResult> {
  const config = { ...DEFAULT_OPTIONS, ...options }
  const store = options.store || getStore()
  const keyGenerator = options.keyGenerator || defaultKeyGenerator
  
  const identifier = keyGenerator(req)
  const current = await store.get(identifier)
  
  if (!current) {
    return {
      success: true,
      limit: config.max,
      remaining: config.max,
      reset: new Date(Date.now() + config.windowMs),
      identifier
    }
  }

  const remaining = Math.max(0, config.max - current.hits)
  
  return {
    success: current.hits < config.max,
    limit: config.max,
    remaining,
    reset: current.resetTime,
    identifier
  }
}

// Reset rate limit for a specific identifier
export async function resetRateLimit(identifier: string, store?: RateLimitStore): Promise<void> {
  const rateLimitStore = store || getStore()
  await rateLimitStore.reset(identifier)
}

// Common rate limit configurations
export const RateLimitPresets = {
  // Very strict for authentication endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,                   // 5 attempts per IP
    message: {
      error: 'Too many authentication attempts, please try again later.',
      type: 'auth_rate_limit_exceeded'
    }
  },

  // Moderate for API endpoints
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,                 // 100 requests per IP
    message: {
      error: 'API rate limit exceeded, please try again later.',
      type: 'api_rate_limit_exceeded'
    }
  },

  // Relaxed for public endpoints
  public: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000,                // 1000 requests per IP
    message: {
      error: 'Rate limit exceeded, please try again later.',
      type: 'public_rate_limit_exceeded'
    }
  },

  // Very strict for sensitive operations
  sensitive: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,                   // 3 attempts per IP per hour
    message: {
      error: 'Too many attempts for sensitive operation, please try again later.',
      type: 'sensitive_rate_limit_exceeded'
    }
  }
} as const

// Helper to create commonly used rate limiters
export const createAuthRateLimit = () => createRateLimitMiddleware(RateLimitPresets.auth)
export const createApiRateLimit = () => createRateLimitMiddleware(RateLimitPresets.api)
export const createPublicRateLimit = () => createRateLimitMiddleware(RateLimitPresets.public)
export const createSensitiveRateLimit = () => createRateLimitMiddleware(RateLimitPresets.sensitive)

// Example usage for Next.js API routes:
/*
// pages/api/auth/login.ts or app/api/auth/login/route.ts
import { createAuthRateLimit } from '@/lib/rate-limit'

const rateLimiter = createAuthRateLimit()

export async function POST(req: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await rateLimiter(req)
  if (rateLimitResponse) {
    return rateLimitResponse // Rate limit exceeded
  }

  // Continue with your API logic
  // ... authentication logic
}
*/

export default createRateLimitMiddleware