/**
 * Cross-Platform Identity Bridge API
 * 
 * RESTful endpoints for bridging PersonaPass credentials across platforms:
 * - Bridge credentials to other blockchain networks
 * - Convert to traditional identity formats (OAuth2, SAML)
 * - Verify credentials across multiple platforms
 * - Resolve universal identity
 */

import { NextRequest, NextResponse } from 'next/server';
import { crossPlatformBridge, PlatformType, PlatformCredential } from '@/lib/cross-platform-bridge';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { rateLimit } from '@/lib/rate-limit';

// Request schemas
const BridgeCredentialSchema = z.object({
  credential: z.object({
    platformType: z.nativeEnum(PlatformType),
    platformId: z.string(),
    credentialId: z.string(),
    credentialType: z.string(),
    issuer: z.string(),
    subject: z.string(),
    claims: z.record(z.any()),
    proof: z.object({
      type: z.string(),
      value: z.string(),
      signature: z.string().optional()
    }).optional(),
    metadata: z.object({
      issuedAt: z.string(),
      expiresAt: z.string().optional(),
      chainId: z.string().optional(),
      network: z.string().optional(),
      contractAddress: z.string().optional()
    })
  }),
  targetPlatforms: z.array(z.nativeEnum(PlatformType))
});

const VerifyCredentialSchema = z.object({
  credentialId: z.string(),
  platforms: z.array(z.nativeEnum(PlatformType)).optional()
});

const ResolveIdentitySchema = z.object({
  identifier: z.string().min(1, 'Identifier is required')
});

/**
 * POST /api/bridge - Bridge a credential to other platforms
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 10, // Limit bridge operations
      keyGenerator: (req) => {
        const forwarded = req.headers.get('x-forwarded-for');
        const ip = forwarded ? forwarded.split(',')[0] : req.headers.get('x-real-ip') || 'anonymous';
        return `bridge:${ip}`;
      }
    });

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          message: 'Too many bridge requests. Please try again later.'
        },
        { status: 429 }
      );
    }

    // Parse request body
    const body = await request.json();
    const validatedData = BridgeCredentialSchema.parse(body);

    logger.info('Bridge credential request received', {
      originalPlatform: validatedData.credential.platformType,
      targetPlatforms: validatedData.targetPlatforms,
      credentialId: validatedData.credential.credentialId
    });

    // Execute bridge operation
    const result = await crossPlatformBridge.bridgeCredential(
      validatedData.credential,
      validatedData.targetPlatforms
    );

    // Log success metrics
    logger.info('Bridge operation completed', {
      credentialId: validatedData.credential.credentialId,
      successfulBridges: result.metadata.successfulBridges,
      failedBridges: result.metadata.failedBridges,
      duration: Date.now() - startTime
    });

    return NextResponse.json({
      success: true,
      data: result,
      metadata: {
        processedAt: new Date().toISOString(),
        duration: Date.now() - startTime
      }
    });

  } catch (error) {
    logger.error('Bridge operation failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      duration: Date.now() - startTime
    });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation error',
          details: error.errors
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Bridge operation failed',
        message: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/bridge/verify?credentialId=...&platforms=... - Verify credential across platforms
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, {
      windowMs: 5 * 60 * 1000, // 5 minutes
      maxRequests: 30, // More generous for verification
      keyGenerator: (req) => {
        const forwarded = req.headers.get('x-forwarded-for');
        const ip = forwarded ? forwarded.split(',')[0] : req.headers.get('x-real-ip') || 'anonymous';
        return `bridge_verify:${ip}`;
      }
    });

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          message: 'Too many verification requests. Please try again later.'
        },
        { status: 429 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const credentialId = searchParams.get('credentialId');
    const platformsParam = searchParams.get('platforms');
    
    if (!credentialId) {
      return NextResponse.json(
        { error: 'credentialId parameter is required' },
        { status: 400 }
      );
    }

    let platforms: PlatformType[] | undefined;
    if (platformsParam) {
      try {
        platforms = platformsParam.split(',').map(p => p.trim() as PlatformType);
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid platforms parameter' },
          { status: 400 }
        );
      }
    }

    logger.info('Cross-platform verification request', {
      credentialId,
      platforms: platforms || 'all'
    });

    // First, we need to resolve the universal credential
    // For now, we'll assume it's a PersonaChain credential ID
    const universalCredentials = await crossPlatformBridge.resolveUniversalIdentity(credentialId);
    
    if (universalCredentials.length === 0) {
      return NextResponse.json(
        { 
          error: 'Credential not found',
          message: 'No universal credential found for the given ID'
        },
        { status: 404 }
      );
    }

    // Verify the first matching credential across platforms
    const universalCredential = universalCredentials[0];
    const verificationResults = await crossPlatformBridge.verifyCredentialAcrossPlatforms(
      universalCredential,
      platforms
    );

    logger.info('Cross-platform verification completed', {
      credentialId,
      results: verificationResults,
      duration: Date.now() - startTime
    });

    return NextResponse.json({
      success: true,
      data: {
        credentialId,
        universalCredential,
        verificationResults,
        summary: {
          totalPlatforms: Object.keys(verificationResults).length,
          validPlatforms: Object.values(verificationResults).filter(Boolean).length,
          invalidPlatforms: Object.values(verificationResults).filter(v => !v).length
        }
      },
      metadata: {
        verifiedAt: new Date().toISOString(),
        duration: Date.now() - startTime
      }
    });

  } catch (error) {
    logger.error('Cross-platform verification failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      duration: Date.now() - startTime
    });

    return NextResponse.json(
      { 
        error: 'Verification failed',
        message: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/bridge/platforms - Get supported platforms
 */
export async function GET_PLATFORMS(): Promise<NextResponse> {
  try {
    const platforms = crossPlatformBridge.getSupportedPlatforms();
    
    return NextResponse.json({
      success: true,
      data: {
        platforms: platforms.map(p => ({
          type: p.type,
          name: p.name,
          chainId: p.chainId,
          endpoints: Object.keys(p.endpoints),
          authType: p.authentication.type
        }))
      },
      metadata: {
        retrievedAt: new Date().toISOString(),
        totalPlatforms: platforms.length
      }
    });

  } catch (error) {
    logger.error('Failed to get platforms:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to retrieve platforms',
        message: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}