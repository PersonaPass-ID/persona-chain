/**
 * Universal Identity Resolution API
 * 
 * Resolves identities across multiple platforms and returns consolidated credentials.
 * Supports various identifier formats:
 * - Blockchain addresses (0x..., persona1...)
 * - Email addresses (user@domain.com)
 * - DID URIs (did:persona:..., did:eth:...)
 * - Platform-specific IDs
 */

import { NextRequest, NextResponse } from 'next/server';
import { crossPlatformBridge } from '@/lib/cross-platform-bridge';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { rateLimit } from '@/lib/rate-limit';

const ResolveIdentitySchema = z.object({
  identifier: z.string().min(1, 'Identifier is required'),
  includeExpired: z.boolean().optional().default(false),
  platforms: z.array(z.string()).optional()
});

/**
 * POST /api/bridge/resolve - Resolve universal identity
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  
  try {
    // Rate limiting for identity resolution
    const rateLimitResult = await rateLimit(request, {
      windowMs: 5 * 60 * 1000, // 5 minutes
      maxRequests: 20, // Reasonable limit for identity resolution
      keyGenerator: (req) => {
        const forwarded = req.headers.get('x-forwarded-for');
        const ip = forwarded ? forwarded.split(',')[0] : req.headers.get('x-real-ip') || 'anonymous';
        return `resolve_identity:${ip}`;
      }
    });

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          message: 'Too many resolution requests. Please try again later.'
        },
        { status: 429 }
      );
    }

    // Parse and validate request
    const body = await request.json();
    const { identifier, includeExpired, platforms } = ResolveIdentitySchema.parse(body);

    logger.info('Universal identity resolution request', {
      identifier: identifier.substring(0, 20) + '...', // Log partial identifier for privacy
      includeExpired,
      requestedPlatforms: platforms?.length || 'all'
    });

    // Resolve identity across platforms
    const universalCredentials = await crossPlatformBridge.resolveUniversalIdentity(identifier);

    // Filter out expired credentials if requested
    const filteredCredentials = includeExpired 
      ? universalCredentials
      : universalCredentials.filter(cred => {
          // Check if any proof has expiration and if it's still valid
          const hasExpiredProof = cred.proofs.some(proof => {
            if (proof.proof.metadata?.expiresAt) {
              return new Date(proof.proof.metadata.expiresAt) < new Date();
            }
            return false;
          });
          return !hasExpiredProof;
        });

    // Group credentials by type for better organization
    const credentialsByType = filteredCredentials.reduce((acc, cred) => {
      const primaryType = cred.type[0] || 'Unknown';
      if (!acc[primaryType]) {
        acc[primaryType] = [];
      }
      acc[primaryType].push(cred);
      return acc;
    }, {} as Record<string, typeof filteredCredentials>);

    // Calculate platform coverage
    const allPlatforms = new Set<string>();
    filteredCredentials.forEach(cred => {
      cred.bridgeMetadata.bridgedPlatforms.forEach(platform => allPlatforms.add(platform));
      allPlatforms.add(cred.bridgeMetadata.originalPlatform);
    });

    // Determine identity confidence score based on number of platforms and credential types
    const platformCount = allPlatforms.size;
    const credentialTypeCount = Object.keys(credentialsByType).length;
    const confidenceScore = Math.min(
      (platformCount * 0.3 + credentialTypeCount * 0.4 + filteredCredentials.length * 0.1) / 2,
      1.0
    );

    const result = {
      identifier,
      credentials: filteredCredentials,
      credentialsByType,
      summary: {
        totalCredentials: filteredCredentials.length,
        credentialTypes: Object.keys(credentialsByType),
        platforms: Array.from(allPlatforms),
        platformCount,
        confidenceScore: Math.round(confidenceScore * 100) / 100,
        hasExpiredCredentials: universalCredentials.length > filteredCredentials.length
      },
      metadata: {
        resolvedAt: new Date().toISOString(),
        includeExpired,
        searchDuration: Date.now() - startTime
      }
    };

    logger.info('Identity resolution completed', {
      identifier: identifier.substring(0, 20) + '...',
      credentialCount: filteredCredentials.length,
      platformCount,
      confidenceScore: result.summary.confidenceScore,
      duration: Date.now() - startTime
    });

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('Identity resolution failed:', {
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
        error: 'Identity resolution failed',
        message: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/bridge/resolve?identifier=... - Resolve identity via query params
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, {
      windowMs: 5 * 60 * 1000, // 5 minutes
      maxRequests: 30, // More generous for GET requests
      keyGenerator: (req) => {
        const forwarded = req.headers.get('x-forwarded-for');
        const ip = forwarded ? forwarded.split(',')[0] : req.headers.get('x-real-ip') || 'anonymous';
        return `resolve_identity_get:${ip}`;
      }
    });

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          message: 'Too many resolution requests. Please try again later.'
        },
        { status: 429 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const identifier = searchParams.get('identifier');
    const includeExpired = searchParams.get('includeExpired') === 'true';
    const platformsParam = searchParams.get('platforms');
    
    if (!identifier) {
      return NextResponse.json(
        { error: 'identifier parameter is required' },
        { status: 400 }
      );
    }

    let platforms: string[] | undefined;
    if (platformsParam) {
      platforms = platformsParam.split(',').map(p => p.trim());
    }

    // Forward to POST handler logic
    const mockRequest = {
      json: async () => ({
        identifier,
        includeExpired,
        platforms
      })
    } as any;

    const mockResponse = await POST({ ...request, ...mockRequest } as NextRequest);
    return mockResponse;

  } catch (error) {
    logger.error('GET identity resolution failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime
    });

    return NextResponse.json(
      { 
        error: 'Identity resolution failed',
        message: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}