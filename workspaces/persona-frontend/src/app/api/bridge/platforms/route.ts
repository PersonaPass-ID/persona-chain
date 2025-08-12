/**
 * Supported Platforms API
 * 
 * Returns information about all supported platforms for cross-platform bridging.
 * Includes platform capabilities, authentication methods, and current status.
 */

import { NextRequest, NextResponse } from 'next/server';
import { crossPlatformBridge } from '@/lib/cross-platform-bridge';
import { logger } from '@/lib/logger';
import { rateLimit } from '@/lib/rate-limit';

/**
 * GET /api/bridge/platforms - Get all supported platforms
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  
  try {
    // Light rate limiting for platform info
    const rateLimitResult = await rateLimit(request, {
      windowMs: 1 * 60 * 1000, // 1 minute
      maxRequests: 60, // Generous for informational endpoint
      keyGenerator: (req) => {
        const forwarded = req.headers.get('x-forwarded-for');
        const ip = forwarded ? forwarded.split(',')[0] : req.headers.get('x-real-ip') || 'anonymous';
        return `platforms:${ip}`;
      }
    });

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          message: 'Too many requests. Please try again later.'
        },
        { status: 429 }
      );
    }

    // Get all supported platforms
    const platforms = crossPlatformBridge.getSupportedPlatforms();
    
    // Enhance platform info with additional details
    const enhancedPlatforms = platforms.map(platform => {
      const capabilities = [];
      
      // Determine capabilities based on endpoints
      if (platform.endpoints.verify) capabilities.push('verify');
      if (platform.endpoints.issue) capabilities.push('issue');
      if (platform.endpoints.revoke) capabilities.push('revoke');
      
      // Determine platform category
      let category = 'other';
      if (['personachain', 'ethereum', 'polygon', 'solana'].includes(platform.type)) {
        category = 'blockchain';
      } else if (['oauth2', 'saml', 'openid'].includes(platform.type)) {
        category = 'identity_provider';
      } else if (platform.type === 'web2_api') {
        category = 'web2_integration';
      }

      // Determine current status (simplified for demo)
      const status = platform.type === 'personachain' ? 'active' : 'available';
      
      return {
        type: platform.type,
        name: platform.name,
        category,
        status,
        capabilities,
        authentication: {
          type: platform.authentication.type,
          description: getAuthDescription(platform.authentication.type)
        },
        network: platform.chainId ? {
          chainId: platform.chainId,
          contractAddress: platform.contractAddress
        } : null,
        features: getPlatformFeatures(platform.type),
        bridgingSupport: {
          fromPersonaChain: true,
          toPersonaChain: platform.type !== 'personachain',
          bidirectional: platform.type === 'personachain'
        }
      };
    });

    // Group platforms by category
    const platformsByCategory = enhancedPlatforms.reduce((acc, platform) => {
      if (!acc[platform.category]) {
        acc[platform.category] = [];
      }
      acc[platform.category].push(platform);
      return acc;
    }, {} as Record<string, typeof enhancedPlatforms>);

    // Calculate summary statistics
    const summary = {
      totalPlatforms: enhancedPlatforms.length,
      activePlatforms: enhancedPlatforms.filter(p => p.status === 'active').length,
      blockchainPlatforms: enhancedPlatforms.filter(p => p.category === 'blockchain').length,
      identityProviders: enhancedPlatforms.filter(p => p.category === 'identity_provider').length,
      supportedCapabilities: Array.from(
        new Set(enhancedPlatforms.flatMap(p => p.capabilities))
      ),
      authenticationMethods: Array.from(
        new Set(enhancedPlatforms.map(p => p.authentication.type))
      )
    };

    const result = {
      platforms: enhancedPlatforms,
      platformsByCategory,
      summary,
      metadata: {
        retrievedAt: new Date().toISOString(),
        version: '1.0.0',
        bridgeProtocol: 'PersonaPass Universal Bridge v1.0'
      }
    };

    logger.info('Platform information retrieved', {
      totalPlatforms: enhancedPlatforms.length,
      categories: Object.keys(platformsByCategory),
      duration: Date.now() - startTime
    });

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('Failed to retrieve platform information:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      duration: Date.now() - startTime
    });

    return NextResponse.json(
      { 
        error: 'Failed to retrieve platforms',
        message: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

// Helper functions for platform enhancement

function getAuthDescription(authType: string): string {
  switch (authType) {
    case 'signature':
      return 'Cryptographic signature verification using secp256k1';
    case 'oauth2':
      return 'OAuth 2.0 authorization code flow';
    case 'jwt':
      return 'JSON Web Token verification';
    case 'api_key':
      return 'API key authentication';
    default:
      return 'Custom authentication method';
  }
}

function getPlatformFeatures(platformType: string): string[] {
  switch (platformType) {
    case 'personachain':
      return [
        'Native credential storage',
        'Zero-knowledge proofs',
        'DID management',
        'Verifiable credentials',
        'On-chain verification',
        'Cross-chain bridging'
      ];
    
    case 'ethereum':
    case 'polygon':
      return [
        'ERC-721 NFT credentials',
        'Smart contract verification',
        'Decentralized storage',
        'Web3 wallet integration',
        'Cross-chain compatibility'
      ];
    
    case 'solana':
      return [
        'SPL token credentials',
        'Program-based verification',
        'High-speed transactions',
        'Low transaction costs'
      ];
    
    case 'oauth2':
      return [
        'Social login integration',
        'Scope-based permissions',
        'Refresh token support',
        'Multi-provider support'
      ];
    
    case 'saml':
      return [
        'Enterprise SSO',
        'XML-based assertions',
        'Identity federation',
        'Attribute mapping'
      ];
    
    case 'openid':
      return [
        'OpenID Connect flow',
        'ID token verification',
        'User info endpoint',
        'PKCE support'
      ];
    
    default:
      return ['Basic credential bridging'];
  }
}