/**
 * AUTHENTICATION MIDDLEWARE
 * 
 * Middleware for authenticating API requests using JWT tokens
 * and wallet signatures for blockchain-based authentication.
 */

import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { logger } from '@/lib/logger'

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string
    walletAddress: string
    role: string
  }
}

export interface JWTPayload {
  userId: string
  walletAddress: string
  role: string
  exp: number
  iat: number
}

/**
 * Verify JWT token from Authorization header
 */
export async function verifyJWTToken(request: NextRequest): Promise<JWTPayload | null> {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix
    const secret = process.env.JWT_SECRET

    if (!secret) {
      logger.error('JWT_SECRET not configured')
      return null
    }

    const payload = jwt.verify(token, secret) as JWTPayload
    
    // Check if token is expired
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      logger.warn('JWT token expired', { userId: payload.userId })
      return null
    }

    return payload

  } catch (error) {
    logger.error('JWT verification failed', { error: error instanceof Error ? error.message : 'Unknown error' })
    return null
  }
}

/**
 * Verify wallet signature for blockchain authentication
 */
export async function verifyWalletSignature(
  walletAddress: string,
  message: string,
  signature: string
): Promise<boolean> {
  try {
    // In a real implementation, you would verify the signature using the appropriate
    // blockchain library (e.g., @cosmjs/crypto for Cosmos chains)
    
    // For now, we'll simulate signature verification
    // This should be replaced with actual cryptographic verification
    const isValid = signature.length > 0 && walletAddress.length > 0
    
    logger.info('Wallet signature verification', { 
      walletAddress, 
      isValid,
      signatureLength: signature.length 
    })
    
    return isValid

  } catch (error) {
    logger.error('Wallet signature verification failed', {
      walletAddress,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    return false
  }
}

/**
 * Authentication middleware for API routes
 */
export function withAuth(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // Verify JWT token
      const payload = await verifyJWTToken(request)
      
      if (!payload) {
        logger.warn('Authentication failed - invalid or missing token', {
          path: request.nextUrl.pathname,
          method: request.method
        })
        
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }

      // Add user info to request
      const authenticatedRequest = request as AuthenticatedRequest
      authenticatedRequest.user = {
        id: payload.userId,
        walletAddress: payload.walletAddress,
        role: payload.role
      }

      logger.info('API request authenticated', {
        userId: payload.userId,
        walletAddress: payload.walletAddress,
        path: request.nextUrl.pathname,
        method: request.method
      })

      // Call the actual handler
      return await handler(authenticatedRequest)

    } catch (error) {
      logger.error('Authentication middleware error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        path: request.nextUrl.pathname
      })

      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

/**
 * Role-based authorization middleware
 */
export function withRole(requiredRole: string, handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
  return withAuth(async (request: AuthenticatedRequest): Promise<NextResponse> => {
    if (!request.user || request.user.role !== requiredRole) {
      logger.warn('Authorization failed - insufficient permissions', {
        userId: request.user?.id,
        userRole: request.user?.role,
        requiredRole,
        path: request.nextUrl.pathname
      })

      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    return await handler(request)
  })
}

/**
 * Admin-only middleware
 */
export function withAdmin(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
  return withRole('admin', handler)
}

/**
 * Merchant-only middleware
 */
export function withMerchant(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
  return withRole('merchant', handler)
}

/**
 * Generate JWT token for authenticated user
 */
export function generateJWTToken(userId: string, walletAddress: string, role: string = 'user'): string {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET not configured')
  }

  const payload: Omit<JWTPayload, 'exp' | 'iat'> = {
    userId,
    walletAddress,
    role
  }

  const options = {
    expiresIn: '24h', // Token expires in 24 hours
    issuer: 'personapass.io',
    audience: 'personapass-users'
  }

  return jwt.sign(payload, secret, options)
}

/**
 * Extract wallet address from request (various methods)
 */
export function extractWalletAddress(request: NextRequest): string | null {
  // Try from Authorization header (for API calls)
  const authPayload = verifyJWTToken(request)
  if (authPayload) {
    return authPayload.then(p => p?.walletAddress || null).catch(() => null)
  }

  // Try from query parameters
  const walletFromQuery = request.nextUrl.searchParams.get('wallet')
  if (walletFromQuery) {
    return walletFromQuery
  }

  // Try from headers
  const walletFromHeader = request.headers.get('x-wallet-address')
  if (walletFromHeader) {
    return walletFromHeader
  }

  return null
}

/**
 * Rate limiting middleware (basic implementation)
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>()

export function withRateLimit(maxRequests: number = 100, windowMs: number = 60000) {
  return (handler: (req: NextRequest) => Promise<NextResponse>) => {
    return async (request: NextRequest): Promise<NextResponse> => {
      const clientId = request.ip || 'unknown'
      const now = Date.now()
      
      const clientData = requestCounts.get(clientId)
      
      if (!clientData || now > clientData.resetTime) {
        // Reset or initialize counter
        requestCounts.set(clientId, {
          count: 1,
          resetTime: now + windowMs
        })
      } else {
        // Increment counter
        clientData.count++
        
        if (clientData.count > maxRequests) {
          logger.warn('Rate limit exceeded', {
            clientId,
            count: clientData.count,
            maxRequests,
            path: request.nextUrl.pathname
          })
          
          return NextResponse.json(
            { error: 'Rate limit exceeded' },
            { status: 429 }
          )
        }
      }
      
      return await handler(request)
    }
  }
}