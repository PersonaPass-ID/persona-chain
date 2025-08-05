/**
 * PersonaPass Environment Variable Validation
 * 
 * Validates and provides type-safe access to environment variables
 * using Zod schemas. Ensures all required configuration is present
 * and properly formatted before the application starts.
 * 
 * Based on OWASP security guidelines and Zod best practices.
 */

import { z } from 'zod'

// Define the environment schema with comprehensive validation
const envSchema = z.object({
  // Node.js Environment
  NODE_ENV: z.enum(['development', 'production', 'test'], {
    required_error: 'NODE_ENV is required',
    invalid_type_error: 'NODE_ENV must be development, production, or test'
  }),

  // Database Configuration
  DATABASE_URL: z.string().url({
    message: 'DATABASE_URL must be a valid PostgreSQL connection URL'
  }).startsWith('postgresql://', {
    message: 'DATABASE_URL must be a PostgreSQL connection string'
  }),

  // PersonaChain Blockchain Configuration
  PERSONACHAIN_RPC_URL: z.string().url({
    message: 'PERSONACHAIN_RPC_URL must be a valid RPC endpoint URL'
  }).startsWith('https://', {
    message: 'PERSONACHAIN_RPC_URL must use HTTPS in production'
  }),
  
  PERSONACHAIN_CHAIN_ID: z.string().regex(/^persona-\d+$/, {
    message: 'PERSONACHAIN_CHAIN_ID must match format: persona-{number}'
  }),

  // JWT & Session Security
  JWT_SECRET: z.string().min(32, {
    message: 'JWT_SECRET must be at least 32 characters long'
  }).regex(/[A-Za-z0-9+/=]/, {
    message: 'JWT_SECRET should contain alphanumeric characters and symbols'
  }),

  SESSION_SECRET: z.string().min(32, {
    message: 'SESSION_SECRET must be at least 32 characters long'
  }),

  // API Security
  API_RATE_LIMIT_WINDOW_MS: z.string().regex(/^\d+$/, {
    message: 'API_RATE_LIMIT_WINDOW_MS must be a number in milliseconds'
  }).transform(Number).pipe(z.number().min(1000, {
    message: 'Rate limit window must be at least 1000ms (1 second)'
  })).default('900000'), // 15 minutes

  API_RATE_LIMIT_MAX_REQUESTS: z.string().regex(/^\d+$/, {
    message: 'API_RATE_LIMIT_MAX_REQUESTS must be a positive number'
  }).transform(Number).pipe(z.number().min(1)).default('100'),

  API_CORS_ORIGIN: z.string().url({
    message: 'API_CORS_ORIGIN must be a valid URL'
  }).or(z.literal('*')).default('http://localhost:3000'),

  // Stripe Payment Integration
  STRIPE_SECRET_KEY: z.string().startsWith('sk_', {
    message: 'STRIPE_SECRET_KEY must start with sk_'
  }).min(100, {
    message: 'STRIPE_SECRET_KEY appears to be invalid (too short)'
  }),

  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_', {
    message: 'STRIPE_WEBHOOK_SECRET must start with whsec_'
  }),

  // Public Environment Variables (exposed to browser)
  NEXT_PUBLIC_APP_URL: z.string().url({
    message: 'NEXT_PUBLIC_APP_URL must be a valid URL'
  }),

  NEXT_PUBLIC_API_URL: z.string().url({
    message: 'NEXT_PUBLIC_API_URL must be a valid URL'
  }),

  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_', {
    message: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY must start with pk_'
  }),

  NEXT_PUBLIC_PERSONACHAIN_RPC_URL: z.string().url({
    message: 'NEXT_PUBLIC_PERSONACHAIN_RPC_URL must be a valid URL'
  }),

  NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: z.string().uuid({
    message: 'NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID must be a valid UUID'
  }),

  // Monitoring & Logging
  SENTRY_DSN: z.string().url({
    message: 'SENTRY_DSN must be a valid Sentry DSN URL'
  }).optional(),

  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug'], {
    invalid_type_error: 'LOG_LEVEL must be error, warn, info, or debug'
  }).default('info'),

  // Email Configuration (optional for development)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().regex(/^\d+$/).transform(Number).pipe(
    z.number().min(1).max(65535)
  ).optional(),
  SMTP_USER: z.string().email().optional(),
  SMTP_PASS: z.string().min(8).optional(),

  // Redis Configuration (optional for development)
  REDIS_URL: z.string().url().startsWith('redis://').optional(),

  // File Upload Configuration
  MAX_FILE_SIZE_MB: z.string().regex(/^\d+$/).transform(Number).pipe(
    z.number().min(1).max(100)
  ).default('10'),

  UPLOAD_BUCKET_NAME: z.string().optional(),
  AWS_REGION: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),

  // Zero-Knowledge Circuit Configuration
  ZK_CIRCUIT_PATH: z.string().default('./circuits'),
  ZK_PROVING_KEY_PATH: z.string().default('./circuits/proving_key.zkey'),
  ZK_VERIFICATION_KEY_PATH: z.string().default('./circuits/verification_key.json'),

  // Feature Flags
  ENABLE_ANALYTICS: z.string().transform(v => v === 'true').pipe(z.boolean()).default('true'),
  ENABLE_DEBUG_LOGGING: z.string().transform(v => v === 'true').pipe(z.boolean()).default('false'),
  MAINTENANCE_MODE: z.string().transform(v => v === 'true').pipe(z.boolean()).default('false'),

}).refine((data) => {
  // Cross-field validation: Email configuration must be complete if any field is provided
  const emailFields = [data.SMTP_HOST, data.SMTP_PORT, data.SMTP_USER, data.SMTP_PASS]
  const emailFieldsProvided = emailFields.filter(field => field !== undefined).length
  
  if (emailFieldsProvided > 0 && emailFieldsProvided < 4) {
    return false
  }
  return true
}, {
  message: 'If email configuration is provided, all SMTP fields must be present',
  path: ['SMTP_HOST']
}).refine((data) => {
  // AWS configuration must be complete if upload bucket is specified
  if (data.UPLOAD_BUCKET_NAME) {
    return data.AWS_REGION && data.AWS_ACCESS_KEY_ID && data.AWS_SECRET_ACCESS_KEY
  }
  return true
}, {
  message: 'AWS credentials required when UPLOAD_BUCKET_NAME is specified',
  path: ['AWS_ACCESS_KEY_ID']
}).refine((data) => {
  // Production environment validations
  if (data.NODE_ENV === 'production') {
    // Must use HTTPS URLs in production
    const prodUrls = [
      data.NEXT_PUBLIC_APP_URL,
      data.NEXT_PUBLIC_API_URL,
      data.PERSONACHAIN_RPC_URL,
      data.NEXT_PUBLIC_PERSONACHAIN_RPC_URL
    ]
    return prodUrls.every(url => url.startsWith('https://'))
  }
  return true
}, {
  message: 'All URLs must use HTTPS in production environment',
  path: ['NODE_ENV']
}).refine((data) => {
  // Stripe keys must match environment
  if (data.NODE_ENV === 'production') {
    return data.STRIPE_SECRET_KEY.startsWith('sk_live_') && 
           data.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.startsWith('pk_live_')
  } else {
    return data.STRIPE_SECRET_KEY.startsWith('sk_test_') && 
           data.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.startsWith('pk_test_')
  }
}, {
  message: 'Stripe keys must match environment (live keys for production, test keys for development)',
  path: ['STRIPE_SECRET_KEY']
})

// Type inference for the validated environment
export type Env = z.infer<typeof envSchema>

// Validation function with detailed error reporting
function validateEnv(): Env {
  const result = envSchema.safeParse(process.env)

  if (!result.success) {
    const errorMessages = result.error.issues.map(issue => {
      const path = issue.path.length > 0 ? `${issue.path.join('.')}: ` : ''
      return `${path}${issue.message}`
    })

    console.error('❌ Environment validation failed:')
    errorMessages.forEach(msg => console.error(`  • ${msg}`))
    console.error('\n💡 Please check your .env files and ensure all required variables are set.')
    
    // In development, provide helpful suggestions
    if (process.env.NODE_ENV !== 'production') {
      console.error('\n📝 Common issues:')
      console.error('  • Copy .env.example to .env.local and fill in the values')
      console.error('  • Check that URLs include the protocol (https://)')
      console.error('  • Ensure secret keys are at least 32 characters long')
      console.error('  • Verify Stripe keys match your environment (test vs live)')
    }

    process.exit(1)
  }

  return result.data
}

// Export the validated environment variables
export const env = validateEnv()

// Helper functions for common environment checks
export const isDevelopment = env.NODE_ENV === 'development'
export const isProduction = env.NODE_ENV === 'production'
export const isTest = env.NODE_ENV === 'test'

// Security helpers
export const getSecureHeaders = () => ({
  'Strict-Transport-Security': isProduction 
    ? 'max-age=31536000; includeSubDomains; preload' 
    : undefined,
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
})

// Database connection helper with validation
export const getDatabaseConfig = () => {
  if (!env.DATABASE_URL.includes('sslmode=require') && isProduction) {
    console.warn('⚠️  Warning: Database connection should use SSL in production')
  }
  
  return {
    url: env.DATABASE_URL,
    ssl: isProduction ? { rejectUnauthorized: false } : false,
  }
}

// Rate limiting configuration
export const getRateLimitConfig = () => ({
  windowMs: env.API_RATE_LIMIT_WINDOW_MS,
  max: env.API_RATE_LIMIT_MAX_REQUESTS,
  message: {
    error: 'Too many requests',
    retryAfter: Math.ceil(env.API_RATE_LIMIT_WINDOW_MS / 1000)
  }
})

// Logging configuration
export const getLogConfig = () => ({
  level: env.LOG_LEVEL,
  silent: isTest,
  format: isProduction ? 'json' : 'pretty',
  redact: ['password', 'secret', 'token', 'key', 'authorization']
})

// Validation status for health checks
export const envValidationStatus = {
  valid: true,
  checkedAt: new Date().toISOString(),
  environment: env.NODE_ENV,
  version: process.env.npm_package_version || 'unknown'
}

export default env