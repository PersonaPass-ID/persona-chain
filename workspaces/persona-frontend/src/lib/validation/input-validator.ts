/**
 * COMPREHENSIVE INPUT VALIDATION SYSTEM
 * 
 * Security Features:
 * - Input sanitization to prevent XSS
 * - SQL injection prevention
 * - Command injection prevention
 * - Path traversal protection
 * - Size and length limits
 * - Type validation
 * - Custom validation rules
 * - Error message sanitization
 */

import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

// Common validation patterns
export const ValidationPatterns = {
  // Wallet addresses
  ethereumAddress: /^0x[a-fA-F0-9]{40}$/,
  cosmosAddress: /^[a-z]+1[a-z0-9]{38,}$/,
  solanaAddress: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
  
  // Identifiers
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  did: /^did:[a-z]+:[a-zA-Z0-9._%-]+$/,
  
  // Security
  safeString: /^[a-zA-Z0-9_\-\s]+$/,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  
  // Web
  url: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  
  // File paths (prevent traversal)
  safePath: /^[a-zA-Z0-9_\-\/]+$/,
  noTraversal: /^(?!.*\.\.)[a-zA-Z0-9_\-\/]+$/,
} as const;

// Size limits
export const SizeLimits = {
  username: { min: 3, max: 30 },
  password: { min: 8, max: 128 },
  email: { min: 5, max: 254 },
  name: { min: 1, max: 100 },
  description: { min: 0, max: 1000 },
  message: { min: 1, max: 5000 },
  signature: { min: 64, max: 512 },
  nonce: { min: 16, max: 64 },
  token: { min: 32, max: 2048 },
  did: { min: 10, max: 200 },
} as const;

/**
 * Base validators with security checks
 */
export const validators = {
  // Wallet address validators
  ethereumAddress: z
    .string()
    .regex(ValidationPatterns.ethereumAddress, 'Invalid Ethereum address')
    .transform(val => val.toLowerCase()),
  
  cosmosAddress: z
    .string()
    .regex(ValidationPatterns.cosmosAddress, 'Invalid Cosmos address'),
  
  solanaAddress: z
    .string()
    .regex(ValidationPatterns.solanaAddress, 'Invalid Solana address'),
  
  // Generic wallet address (accepts any format)
  walletAddress: z.string().refine((val) => {
    return ValidationPatterns.ethereumAddress.test(val) ||
           ValidationPatterns.cosmosAddress.test(val) ||
           ValidationPatterns.solanaAddress.test(val);
  }, 'Invalid wallet address'),
  
  // Identifier validators
  uuid: z
    .string()
    .regex(ValidationPatterns.uuid, 'Invalid UUID format'),
  
  did: z
    .string()
    .min(SizeLimits.did.min)
    .max(SizeLimits.did.max)
    .regex(ValidationPatterns.did, 'Invalid DID format'),
  
  // User input validators
  username: z
    .string()
    .min(SizeLimits.username.min, `Username must be at least ${SizeLimits.username.min} characters`)
    .max(SizeLimits.username.max, `Username must be at most ${SizeLimits.username.max} characters`)
    .regex(ValidationPatterns.safeString, 'Username can only contain letters, numbers, underscores, and hyphens')
    .transform(val => sanitizeString(val)),
  
  email: z
    .string()
    .min(SizeLimits.email.min)
    .max(SizeLimits.email.max)
    .email('Invalid email address')
    .transform(val => val.toLowerCase().trim()),
  
  password: z
    .string()
    .min(SizeLimits.password.min, `Password must be at least ${SizeLimits.password.min} characters`)
    .max(SizeLimits.password.max, `Password must be at most ${SizeLimits.password.max} characters`)
    .refine(val => {
      // Check for at least one uppercase, lowercase, number, and special character
      const hasUpperCase = /[A-Z]/.test(val);
      const hasLowerCase = /[a-z]/.test(val);
      const hasNumber = /[0-9]/.test(val);
      const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(val);
      return hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;
    }, 'Password must contain at least one uppercase letter, lowercase letter, number, and special character'),
  
  // Security-sensitive validators
  nonce: z
    .string()
    .min(SizeLimits.nonce.min)
    .max(SizeLimits.nonce.max)
    .regex(ValidationPatterns.alphanumeric, 'Invalid nonce format'),
  
  signature: z
    .string()
    .min(SizeLimits.signature.min)
    .max(SizeLimits.signature.max),
  
  token: z
    .string()
    .min(SizeLimits.token.min)
    .max(SizeLimits.token.max),
  
  // Content validators
  message: z
    .string()
    .min(SizeLimits.message.min)
    .max(SizeLimits.message.max)
    .transform(val => sanitizeHtml(val)),
  
  description: z
    .string()
    .max(SizeLimits.description.max)
    .transform(val => sanitizeHtml(val)),
  
  // URL validator
  url: z
    .string()
    .url('Invalid URL format')
    .regex(ValidationPatterns.url, 'Invalid URL format')
    .refine(val => {
      try {
        const url = new URL(val);
        // Only allow http and https protocols
        return ['http:', 'https:'].includes(url.protocol);
      } catch {
        return false;
      }
    }, 'Only HTTP and HTTPS URLs are allowed'),
  
  // File path validator (prevent directory traversal)
  filePath: z
    .string()
    .regex(ValidationPatterns.safePath, 'Invalid file path')
    .regex(ValidationPatterns.noTraversal, 'Path traversal detected')
    .transform(val => val.replace(/\/+/g, '/')), // Normalize multiple slashes
  
  // Pagination validators
  page: z
    .number()
    .int()
    .min(1, 'Page must be at least 1')
    .max(10000, 'Page number too large'),
  
  limit: z
    .number()
    .int()
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit must be at most 100'),
  
  // Timestamp validators
  timestamp: z
    .number()
    .int()
    .min(0)
    .max(Date.now() + 86400000, 'Timestamp cannot be more than 24 hours in the future')
    .refine(val => {
      // Check if timestamp is within reasonable bounds (not too old)
      const oneYearAgo = Date.now() - (365 * 24 * 60 * 60 * 1000);
      return val > oneYearAgo;
    }, 'Timestamp is too old'),
};

/**
 * Sanitize string to prevent XSS
 */
export function sanitizeString(input: string): string {
  // Remove any HTML tags
  const stripped = input.replace(/<[^>]*>/g, '');
  // Remove any potential script injections
  const cleaned = stripped
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/[<>'"]/g, '');
  
  return cleaned.trim();
}

/**
 * Sanitize HTML content
 */
export function sanitizeHtml(input: string): string {
  // Use DOMPurify for comprehensive HTML sanitization
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'target'],
    ALLOW_DATA_ATTR: false,
    USE_PROFILES: { html: true }
  });
}

/**
 * Validate and sanitize SQL-like inputs
 */
export function preventSqlInjection(input: string): string {
  // Remove or escape SQL meta-characters
  const dangerous = /['";\\%_\x00\x1a]/g;
  return input.replace(dangerous, '');
}

/**
 * Validate and sanitize shell command inputs
 */
export function preventCommandInjection(input: string): string {
  // Remove or escape shell meta-characters
  const dangerous = /[;&|`$()<>\{\}\[\]\\'"]/g;
  return input.replace(dangerous, '');
}

/**
 * Create a rate-limited validator
 */
export function createRateLimitedValidator<T extends z.ZodType>(
  schema: T,
  rateLimitKey: string,
  maxAttempts: number = 5,
  windowMs: number = 60000
) {
  const attempts = new Map<string, { count: number; resetAt: number }>();
  
  return async (input: unknown, identifier: string): Promise<z.infer<T>> => {
    const now = Date.now();
    const key = `${rateLimitKey}:${identifier}`;
    const attemptInfo = attempts.get(key);
    
    if (attemptInfo) {
      if (now < attemptInfo.resetAt) {
        if (attemptInfo.count >= maxAttempts) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
        attemptInfo.count++;
      } else {
        // Reset the counter
        attemptInfo.count = 1;
        attemptInfo.resetAt = now + windowMs;
      }
    } else {
      attempts.set(key, { count: 1, resetAt: now + windowMs });
    }
    
    // Clean up old entries
    for (const [k, v] of attempts.entries()) {
      if (now > v.resetAt) {
        attempts.delete(k);
      }
    }
    
    return schema.parse(input);
  };
}

/**
 * Common validation schemas
 */
export const schemas = {
  // Authentication schemas
  loginRequest: z.object({
    walletAddress: validators.walletAddress,
    signature: validators.signature,
    nonce: validators.nonce,
    timestamp: validators.timestamp,
  }),
  
  signupRequest: z.object({
    walletAddress: validators.walletAddress,
    username: validators.username,
    email: validators.email.optional(),
    did: validators.did.optional(),
  }),
  
  // Profile schemas
  updateProfile: z.object({
    username: validators.username.optional(),
    email: validators.email.optional(),
    description: validators.description.optional(),
  }),
  
  // Transaction schemas
  createTransaction: z.object({
    from: validators.walletAddress,
    to: validators.walletAddress,
    amount: z.number().positive().finite(),
    message: validators.message.optional(),
    nonce: validators.nonce,
  }),
  
  // Pagination schema
  paginationQuery: z.object({
    page: validators.page.default(1),
    limit: validators.limit.default(20),
    sort: z.enum(['asc', 'desc']).default('desc'),
    orderBy: z.string().regex(/^[a-zA-Z_]+$/).optional(),
  }),
  
  // Search schema
  searchQuery: z.object({
    q: z.string().min(1).max(100).transform(sanitizeString),
    filters: z.record(z.string(), z.any()).optional(),
    page: validators.page.default(1),
    limit: validators.limit.default(20),
  }),
};

/**
 * Validation result type
 */
export type ValidationResult<T> = 
  | { success: true; data: T }
  | { success: false; errors: z.ZodError };

/**
 * Safe validation wrapper
 */
export function safeValidate<T extends z.ZodType>(
  schema: T,
  input: unknown
): ValidationResult<z.infer<T>> {
  try {
    const result = schema.safeParse(input);
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return { success: false, errors: result.error };
    }
  } catch (error) {
    // This should not happen with safeParse, but just in case
    return {
      success: false,
      errors: new z.ZodError([{
        code: 'custom',
        message: 'Validation failed',
        path: [],
      }])
    };
  }
}