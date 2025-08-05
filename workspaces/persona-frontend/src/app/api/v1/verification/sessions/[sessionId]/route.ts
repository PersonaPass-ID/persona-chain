import { NextRequest, NextResponse } from 'next/server'
import { sessions } from '../route'
import { verifyApiKey } from '@/lib/auth/api-key'
import { recordVerificationUsage } from '@/lib/stripe/client'
import { logger } from '@/lib/logger'
import { zkAgeVerifier } from '@/lib/zk-age-verification'

// Mock database (in production, use real database)
const verifications = new Map()

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    // Verify API key
    const apiKey = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!apiKey || !apiKey.startsWith('pk_')) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      )
    }

    const { sessionId } = params
    const session = sessions.get(sessionId)

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Check if session belongs to this merchant
    if (session.api_key !== apiKey) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Check if verification was completed
    const verification = verifications.get(sessionId)
    
    return NextResponse.json({
      session_id: session.id,
      status: verification ? 'completed' : session.status,
      verified: verification?.verified || false,
      verification_id: verification?.id,
      timestamp: verification?.timestamp || null,
      minimum_age: session.minimum_age,
      created_at: session.created_at,
      expires_at: session.expires_at
    })

  } catch (error) {
    console.error('Error fetching session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Complete verification (called by frontend after ZK proof)
export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params
    const session = sessions.get(sessionId)

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Parse verification proof
    const body = await request.json()
    const { proof, walletAddress } = body

    // Verify ZK proof
    let verified = false
    try {
      // In production, this would verify on PersonaChain
      // For MVP, verify locally
      verified = await zkAgeVerifier.verifyAgeProof(proof)
    } catch (error) {
      logger.error('ZK proof verification failed', { error, sessionId })
      verified = false
    }

    if (verified) {
      const verification = {
        id: `ver_${Date.now()}`,
        session_id: sessionId,
        wallet_address: walletAddress,
        verified: true,
        timestamp: new Date().toISOString()
      }

      verifications.set(sessionId, verification)
      session.status = 'completed'

      // Record usage for billing (charge merchant $0.05)
      try {
        if (session.merchant_id) {
          await recordVerificationUsage(session.merchant_id, 1)
          logger.info('Verification usage recorded for billing', {
            merchantId: session.merchant_id,
            sessionId,
            cost: 0.05
          })
        }
      } catch (error) {
        logger.error('Failed to record usage for billing', { error, sessionId })
        // Don't fail the verification if billing fails
      }

      // Send webhook to merchant
      // TODO: Implement webhook delivery
      sendWebhook(session, verification)

      return NextResponse.json({
        verified: true,
        verification_id: verification.id
      })
    }

    return NextResponse.json({
      verified: false,
      error: 'Age verification failed'
    }, { status: 400 })

  } catch (error) {
    console.error('Error completing verification:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Send webhook notification to merchant
async function sendWebhook(session: any, verification: any) {
  try {
    // In production, get webhook URL from merchant settings
    const webhookUrl = session.metadata?.webhook_url
    if (!webhookUrl) return

    const payload = {
      event: 'verification.completed',
      data: {
        session_id: session.id,
        verification_id: verification.id,
        verified: verification.verified,
        timestamp: verification.timestamp,
        metadata: session.metadata
      }
    }

    // Sign payload for security
    const signature = createWebhookSignature(payload)

    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-PersonaPass-Signature': signature
      },
      body: JSON.stringify(payload)
    })

    logger.info('Webhook delivered', {
      sessionId: session.id,
      webhookUrl
    })
  } catch (error) {
    logger.error('Webhook delivery failed', {
      error,
      sessionId: session.id
    })
  }
}

function createWebhookSignature(payload: any): string {
  // In production, use HMAC with merchant's webhook secret
  return 'mock_signature'
}