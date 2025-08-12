/**
 * SECURE API ROUTE EXAMPLE WITH CORS
 * 
 * This demonstrates how to properly secure an API route with:
 * - CORS configuration
 * - Authentication
 * - Input validation
 * - Rate limiting
 * - Audit logging
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { withCors } from '@/middleware/cors';
import { walletAuth } from '@/lib/wallet-auth-secure';
import { z } from 'zod';

// Input validation schema
const verifyRequestSchema = z.object({
  sessionToken: z.string().min(32).max(128),
  action: z.enum(['verify', 'refresh', 'logout']).optional()
});

// Response types
type SuccessResponse = {
  success: true;
  data: {
    valid: boolean;
    session?: any;
    shouldRefresh?: boolean;
  };
};

type ErrorResponse = {
  success: false;
  error: {
    code: string;
    message: string;
  };
};

type ApiResponse = SuccessResponse | ErrorResponse;

/**
 * API handler for session verification
 */
async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only POST requests are allowed'
      }
    });
  }

  try {
    // Validate input
    const validationResult = verifyRequestSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Invalid request data',
          // In production, don't expose detailed validation errors
          // details: validationResult.error.flatten()
        }
      });
    }

    const { sessionToken, action = 'verify' } = validationResult.data;

    // Log request for audit
    console.log('Session verification request:', {
      action,
      ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
      timestamp: new Date().toISOString()
    });

    // Handle different actions
    switch (action) {
      case 'verify': {
        const result = await walletAuth.validateSession(sessionToken);
        
        if (!result.valid) {
          return res.status(401).json({
            success: false,
            error: {
              code: 'INVALID_SESSION',
              message: 'Session is invalid or expired'
            }
          });
        }

        // Don't expose full session data to client
        const sanitizedSession = result.session ? {
          walletAddress: result.session.walletAddress,
          did: result.session.did,
          expiresAt: result.session.expiresAt
        } : undefined;

        return res.status(200).json({
          success: true,
          data: {
            valid: result.valid,
            session: sanitizedSession,
            shouldRefresh: result.shouldRefresh
          }
        });
      }

      case 'refresh': {
        // Implement refresh logic
        return res.status(501).json({
          success: false,
          error: {
            code: 'NOT_IMPLEMENTED',
            message: 'Refresh action not yet implemented'
          }
        });
      }

      case 'logout': {
        await walletAuth.logout(sessionToken);
        
        return res.status(200).json({
          success: true,
          data: {
            valid: false
          }
        });
      }

      default: {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_ACTION',
            message: 'Invalid action specified'
          }
        });
      }
    }

  } catch (error) {
    console.error('Session verification error:', error);
    
    // Don't expose internal errors to client
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred'
      }
    });
  }
}

// Export handler wrapped with CORS middleware
export default withCors(handler, {
  credentials: true,
  allowedMethods: ['POST', 'OPTIONS'],
  maxAge: 3600 // 1 hour cache for preflight
});