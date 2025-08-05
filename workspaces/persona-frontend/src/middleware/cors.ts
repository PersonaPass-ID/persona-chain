/**
 * CORS MIDDLEWARE FOR API ROUTES
 * 
 * Security Features:
 * - Origin validation with whitelist
 * - Credentials support with secure configuration
 * - Method and header restrictions
 * - Preflight caching
 * - Environment-specific configuration
 */

import { NextApiRequest, NextApiResponse } from 'next';

// Allowed origins based on environment
const getAllowedOrigins = (): string[] => {
  const origins = [
    'https://personapass.io',
    'https://www.personapass.io',
    'https://app.personapass.io'
  ];

  // Add development origins
  if (process.env.NODE_ENV === 'development') {
    origins.push(
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000'
    );
  }

  // Add any additional origins from environment
  if (process.env.ADDITIONAL_ALLOWED_ORIGINS) {
    origins.push(...process.env.ADDITIONAL_ALLOWED_ORIGINS.split(','));
  }

  return origins;
};

// Allowed methods
const ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'];

// Allowed headers
const ALLOWED_HEADERS = [
  'X-CSRF-Token',
  'X-Requested-With',
  'Accept',
  'Accept-Version',
  'Content-Length',
  'Content-MD5',
  'Content-Type',
  'Date',
  'X-Api-Version',
  'Authorization',
  'X-Signature',
  'X-Timestamp',
  'X-Nonce'
];

// Exposed headers (that the browser can access)
const EXPOSED_HEADERS = [
  'X-Request-Id',
  'X-Rate-Limit-Remaining',
  'X-Rate-Limit-Reset'
];

export interface CorsOptions {
  credentials?: boolean;
  maxAge?: number;
  allowedMethods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  preflightContinue?: boolean;
}

/**
 * CORS middleware function
 */
export function cors(options: CorsOptions = {}) {
  const {
    credentials = true,
    maxAge = 86400, // 24 hours
    allowedMethods = ALLOWED_METHODS,
    allowedHeaders = ALLOWED_HEADERS,
    exposedHeaders = EXPOSED_HEADERS,
    preflightContinue = false
  } = options;

  const allowedOrigins = getAllowedOrigins();

  return async (
    req: NextApiRequest,
    res: NextApiResponse,
    next?: () => void | Promise<void>
  ) => {
    const origin = req.headers.origin;
    
    // Check if origin is allowed
    let allowedOrigin = '*';
    if (credentials && origin) {
      if (allowedOrigins.includes(origin)) {
        allowedOrigin = origin;
      } else {
        // Log unauthorized origin attempt
        console.warn(`Unauthorized origin attempt: ${origin}`);
        
        // For preflight requests, respond with error
        if (req.method === 'OPTIONS') {
          res.status(403).json({ error: 'Origin not allowed' });
          return;
        }
        // For actual requests, continue without CORS headers
        // This prevents the browser from accessing the response
      }
    }

    // Set CORS headers
    if (allowedOrigin !== '*' || !credentials) {
      res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    }
    
    if (credentials) {
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Methods', allowedMethods.join(', '));
      res.setHeader('Access-Control-Allow-Headers', allowedHeaders.join(', '));
      res.setHeader('Access-Control-Max-Age', maxAge.toString());
      
      if (exposedHeaders.length > 0) {
        res.setHeader('Access-Control-Expose-Headers', exposedHeaders.join(', '));
      }

      if (!preflightContinue) {
        res.status(204).end();
        return;
      }
    }

    // For actual requests, set exposed headers
    if (exposedHeaders.length > 0 && req.method !== 'OPTIONS') {
      res.setHeader('Access-Control-Expose-Headers', exposedHeaders.join(', '));
    }

    // Add Vary header to indicate that responses vary based on Origin
    const varyHeader = res.getHeader('Vary');
    if (varyHeader) {
      res.setHeader('Vary', `${varyHeader}, Origin`);
    } else {
      res.setHeader('Vary', 'Origin');
    }

    // Continue to next middleware or route handler
    if (next) {
      await next();
    }
  };
}

/**
 * Higher-order function to wrap API routes with CORS
 */
export function withCors(
  handler: (req: NextApiRequest, res: NextApiResponse) => void | Promise<void>,
  options?: CorsOptions
) {
  const corsMiddleware = cors(options);
  
  return async (req: NextApiRequest, res: NextApiResponse) => {
    await corsMiddleware(req, res, async () => {
      await handler(req, res);
    });
  };
}

/**
 * Validate origin against whitelist
 */
export function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return false;
  const allowedOrigins = getAllowedOrigins();
  return allowedOrigins.includes(origin);
}

/**
 * Get CORS headers for manual setting
 */
export function getCorsHeaders(origin?: string): Record<string, string> {
  const headers: Record<string, string> = {};
  const allowedOrigins = getAllowedOrigins();
  
  if (origin && allowedOrigins.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Credentials'] = 'true';
  } else if (process.env.NODE_ENV === 'development') {
    headers['Access-Control-Allow-Origin'] = '*';
  }
  
  headers['Access-Control-Allow-Methods'] = ALLOWED_METHODS.join(', ');
  headers['Access-Control-Allow-Headers'] = ALLOWED_HEADERS.join(', ');
  headers['Access-Control-Expose-Headers'] = EXPOSED_HEADERS.join(', ');
  headers['Access-Control-Max-Age'] = '86400';
  
  return headers;
}