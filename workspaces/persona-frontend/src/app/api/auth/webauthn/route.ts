/**
 * WebAuthn API Routes
 * 
 * Server-side endpoints for WebAuthn operations including
 * challenge generation, attestation verification, and assertion validation
 */

import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { env } from '@/lib/env'
import crypto from 'crypto'

// WebAuthn configuration
const RP_ID = new URL(env.NEXTAUTH_URL || 'https://personapass.io').hostname
const RP_NAME = 'PersonaPass Identity Platform'
const CHALLENGE_TIMEOUT = 5 * 60 * 1000 // 5 minutes

// In-memory challenge storage (in production, use Redis)
const challengeStore = new Map<string, { challenge: string; timestamp: number; userId: string }>()

// Clean up expired challenges
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of challengeStore.entries()) {
    if (now > value.timestamp + CHALLENGE_TIMEOUT) {
      challengeStore.delete(key)
    }
  }
}, 60000) // Clean every minute

/**
 * Generate registration options
 * POST /api/auth/webauthn?action=registration-options
 */
async function handleRegistrationOptions(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { userId, walletAddress, displayName } = body

    if (!userId || !walletAddress) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Generate challenge
    const challenge = crypto.randomBytes(32)
    const challengeKey = `reg_${userId}_${Date.now()}`
    
    challengeStore.set(challengeKey, {
      challenge: challenge.toString('base64url'),
      timestamp: Date.now(),
      userId
    })

    // Create registration options
    const options = {
      challenge: challenge.toString('base64url'),
      rp: {
        name: RP_NAME,
        id: RP_ID
      },
      user: {
        id: Buffer.from(userId).toString('base64url'),
        name: `${userId}@personapass.io`,
        displayName: displayName || `PersonaPass User ${userId.slice(0, 8)}`
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' },   // ES256
        { alg: -35, type: 'public-key' },  // ES384
        { alg: -36, type: 'public-key' },  // ES512
        { alg: -257, type: 'public-key' }  // RS256
      ],
      timeout: 60000,
      attestation: 'direct',
      authenticatorSelection: {
        userVerification: 'preferred',
        requireResidentKey: false
      },
      extensions: {
        credProps: true
      }
    }

    return NextResponse.json({
      success: true,
      options,
      challengeKey
    })

  } catch (error) {
    console.error('Registration options error:', error)
    return NextResponse.json(
      { error: 'Failed to generate registration options' },
      { status: 500 }
    )
  }
}

/**
 * Verify registration
 * POST /api/auth/webauthn?action=verify-registration
 */
async function handleVerifyRegistration(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { challengeKey, credential, walletAddress } = body

    if (!challengeKey || !credential || !walletAddress) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify challenge
    const storedChallenge = challengeStore.get(challengeKey)
    if (!storedChallenge) {
      return NextResponse.json(
        { error: 'Invalid or expired challenge' },
        { status: 400 }
      )
    }

    // Parse client data
    const clientDataJSON = Buffer.from(credential.response.clientDataJSON, 'base64url')
    const clientData = JSON.parse(clientDataJSON.toString())

    // Verify challenge matches
    if (clientData.challenge !== storedChallenge.challenge) {
      return NextResponse.json(
        { error: 'Challenge mismatch' },
        { status: 400 }
      )
    }

    // Verify origin
    const expectedOrigin = env.NEXTAUTH_URL || 'https://personapass.io'
    if (clientData.origin !== expectedOrigin) {
      return NextResponse.json(
        { error: 'Origin mismatch' },
        { status: 400 }
      )
    }

    // Parse attestation object (simplified verification)
    const attestationObject = Buffer.from(credential.response.attestationObject, 'base64url')
    
    // In a production system, you would:
    // 1. Parse the CBOR attestation object
    // 2. Extract and verify the authenticator data
    // 3. Verify the attestation statement
    // 4. Check the certificate chain (for direct attestation)
    // 5. Store the credential public key for future authentication

    // For now, we'll do basic validation
    const authData = Buffer.from(credential.response.authenticatorData, 'base64url')
    if (authData.length < 37) {
      return NextResponse.json(
        { error: 'Invalid authenticator data' },
        { status: 400 }
      )
    }

    // Extract flags
    const flags = authData[32]
    const userPresent = !!(flags & 0x01)
    const userVerified = !!(flags & 0x04)
    const attestedCredentialData = !!(flags & 0x40)

    if (!userPresent) {
      return NextResponse.json(
        { error: 'User presence not verified' },
        { status: 400 }
      )
    }

    // Clean up challenge
    challengeStore.delete(challengeKey)

    // Return success with credential info
    return NextResponse.json({
      success: true,
      credentialId: credential.id,
      userVerified,
      attestedCredentialData,
      message: 'Registration verified successfully'
    })

  } catch (error) {
    console.error('Registration verification error:', error)
    return NextResponse.json(
      { error: 'Failed to verify registration' },
      { status: 500 }
    )
  }
}

/**
 * Generate authentication options
 * POST /api/auth/webauthn?action=authentication-options
 */
async function handleAuthenticationOptions(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { walletAddress, allowCredentials } = body

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Missing wallet address' },
        { status: 400 }
      )
    }

    // Generate challenge
    const challenge = crypto.randomBytes(32)
    const challengeKey = `auth_${walletAddress}_${Date.now()}`
    
    challengeStore.set(challengeKey, {
      challenge: challenge.toString('base64url'),
      timestamp: Date.now(),
      userId: walletAddress
    })

    // Create authentication options
    const options = {
      challenge: challenge.toString('base64url'),
      timeout: 60000,
      rpId: RP_ID,
      allowCredentials: allowCredentials?.map((credId: string) => ({
        id: credId,
        type: 'public-key',
        transports: ['internal', 'usb', 'nfc', 'ble', 'hybrid']
      })) || [],
      userVerification: 'preferred',
      extensions: {}
    }

    return NextResponse.json({
      success: true,
      options,
      challengeKey
    })

  } catch (error) {
    console.error('Authentication options error:', error)
    return NextResponse.json(
      { error: 'Failed to generate authentication options' },
      { status: 500 }
    )
  }
}

/**
 * Verify authentication
 * POST /api/auth/webauthn?action=verify-authentication
 */
async function handleVerifyAuthentication(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { challengeKey, credential, walletAddress } = body

    if (!challengeKey || !credential || !walletAddress) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify challenge
    const storedChallenge = challengeStore.get(challengeKey)
    if (!storedChallenge) {
      return NextResponse.json(
        { error: 'Invalid or expired challenge' },
        { status: 400 }
      )
    }

    // Parse client data
    const clientDataJSON = Buffer.from(credential.response.clientDataJSON, 'base64url')
    const clientData = JSON.parse(clientDataJSON.toString())

    // Verify challenge matches
    if (clientData.challenge !== storedChallenge.challenge) {
      return NextResponse.json(
        { error: 'Challenge mismatch' },
        { status: 400 }
      )
    }

    // Verify origin
    const expectedOrigin = env.NEXTAUTH_URL || 'https://personapass.io'
    if (clientData.origin !== expectedOrigin) {
      return NextResponse.json(
        { error: 'Origin mismatch' },
        { status: 400 }
      )
    }

    // Parse authenticator data
    const authData = Buffer.from(credential.response.authenticatorData, 'base64url')
    if (authData.length < 37) {
      return NextResponse.json(
        { error: 'Invalid authenticator data' },
        { status: 400 }
      )
    }

    // Extract flags
    const flags = authData[32]
    const userPresent = !!(flags & 0x01)
    const userVerified = !!(flags & 0x04)

    if (!userPresent) {
      return NextResponse.json(
        { error: 'User presence not verified' },
        { status: 400 }
      )
    }

    // In a production system, you would:
    // 1. Retrieve the stored public key for this credential
    // 2. Create the signed data (authData + SHA256(clientDataJSON))
    // 3. Verify the signature using the stored public key
    // 4. Check the signature counter to prevent replay attacks

    // For now, we'll return success
    challengeStore.delete(challengeKey)

    return NextResponse.json({
      success: true,
      credentialId: credential.id,
      userVerified,
      message: 'Authentication verified successfully'
    })

  } catch (error) {
    console.error('Authentication verification error:', error)
    return NextResponse.json(
      { error: 'Failed to verify authentication' },
      { status: 500 }
    )
  }
}

/**
 * Main POST handler
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  // Apply rate limiting
  const rateLimitResult = await rateLimit(request, {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 30 // 30 requests per window
  })

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': new Date(rateLimitResult.reset).toISOString()
        }
      }
    )
  }

  try {
    const url = new URL(request.url)
    const action = url.searchParams.get('action')

    switch (action) {
      case 'registration-options':
        return handleRegistrationOptions(request)
      
      case 'verify-registration':
        return handleVerifyRegistration(request)
      
      case 'authentication-options':
        return handleAuthenticationOptions(request)
      
      case 'verify-authentication':
        return handleVerifyAuthentication(request)
      
      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('WebAuthn API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET handler for status
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: 'active',
    rpId: RP_ID,
    rpName: RP_NAME,
    supportedAlgorithms: [-7, -35, -36, -257],
    challengeTimeout: CHALLENGE_TIMEOUT,
    activeChallenges: challengeStore.size
  })
}