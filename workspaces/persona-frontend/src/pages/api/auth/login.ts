/**
 * SECURE LOGIN API ENDPOINT
 * 
 * This endpoint demonstrates secure wallet authentication with:
 * - Signature verification
 * - Session creation with HttpOnly cookies
 * - Input validation
 * - Rate limiting
 * - Audit logging
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { withCors } from '@/middleware/cors';
import { withValidation } from '@/middleware/validation';
import { validators, schemas } from '@/lib/validation/input-validator';
import { walletAuth } from '@/lib/wallet-auth-secure';
import { sessionManager } from '@/lib/session/secure-session-manager';
import { z } from 'zod';

// Request validation schema
const loginSchema = z.object({
  walletAddress: validators.walletAddress,
  signature: validators.signature,
  nonce: validators.nonce,
  publicKey: z.string().optional(),
  walletType: z.enum(['ethereum', 'cosmos', 'solana']).optional(),
  chainId: z.string().optional()
});

// Response types
type SuccessResponse = {
  success: true;
  data: {
    sessionToken: string;
    expiresIn: number;
    user: {
      userId: string;
      walletAddress: string;
      did: string;
      permissions: string[];
    };
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
 * Login handler
 */
async function loginHandler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  // Only allow POST
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
    // Get validated input (already validated by middleware)
    const { walletAddress, signature, nonce, publicKey, walletType, chainId } = req.body;

    // Log login attempt for audit
    console.log('Login attempt:', {
      walletAddress: walletAddress.substring(0, 8) + '...',
      ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
      timestamp: new Date().toISOString()
    });

    // Verify wallet signature
    const verificationResult = await walletAuth.verifyWalletSignature(
      nonce,
      {
        signature,
        publicKey,
        algorithm: walletType === 'ethereum' ? 'secp256k1' : 'ed25519',
        walletType,
        chainId
      },
      walletAddress
    );

    if (!verificationResult.success) {
      console.warn('Failed login attempt:', {
        walletAddress: walletAddress.substring(0, 8) + '...',
        reason: 'Invalid signature'
      });

      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_SIGNATURE',
          message: 'Signature verification failed'
        }
      });
    }

    // Create secure session with HttpOnly cookies
    const sessionToken = await sessionManager.createSession(
      res,
      {
        userId: verificationResult.did!,
        walletAddress,
        did: verificationResult.did,
        permissions: ['wallet:read', 'did:manage', 'credentials:read']
      },
      req
    );

    // Log successful login
    console.log('Successful login:', {
      userId: verificationResult.did,
      walletAddress: walletAddress.substring(0, 8) + '...',
      sessionToken: sessionToken.substring(0, 8) + '...'
    });

    // Return success response
    return res.status(200).json({
      success: true,
      data: {
        sessionToken, // Can be used for client-side session management
        expiresIn: verificationResult.expiresIn!,
        user: {
          userId: verificationResult.did!,
          walletAddress,
          did: verificationResult.did!,
          permissions: ['wallet:read', 'did:manage', 'credentials:read']
        }
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred during login'
      }
    });
  }
}

// Apply middleware layers
export default withCors(
  withValidation(loginHandler, {
    body: loginSchema
  }),
  {
    credentials: true,
    allowedMethods: ['POST', 'OPTIONS']
  }
);