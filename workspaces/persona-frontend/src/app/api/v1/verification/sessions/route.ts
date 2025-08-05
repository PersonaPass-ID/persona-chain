import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { z } from 'zod'
import { verifyApiKey, recordApiUsage } from '@/lib/auth/api-key'
import { recordVerificationUsage } from '@/lib/stripe/client'
import { logger } from '@/lib/logger'

// Schema for creating verification session
const createSessionSchema = z.object({
  minimum_age: z.number().min(13).max(100),
  redirect_url: z.string().url().optional(),
  metadata: z.record(z.any()).optional()
})

// Mock database (in production, use real database)
export const sessions = new Map()

export async function POST(request: NextRequest) {
  try {
    // Verify API key
    const apiKey = request.headers.get('authorization')?.replace('Bearer ', '')
    const merchant = await verifyApiKey(apiKey)
    
    if (!merchant) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validated = createSessionSchema.parse(body)

    // Create verification session
    const sessionId = randomUUID()
    const session = {
      id: sessionId,
      api_key: apiKey!,
      merchant_id: merchant.id,
      status: 'pending',
      minimum_age: validated.minimum_age,
      redirect_url: validated.redirect_url,
      metadata: validated.metadata,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      verification_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.personapass.xyz'}/verify/${sessionId}`
    }

    // Store session (in production, use database)
    sessions.set(sessionId, session)

    // Record API usage
    await recordApiUsage(apiKey!, '/api/v1/verification/sessions', true)

    // Log for audit
    logger.info('Verification session created', {
      sessionId,
      merchantId: merchant.id,
      minimumAge: validated.minimum_age
    })

    // Return session details
    return NextResponse.json(session, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating verification session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  // List sessions for merchant (pagination would be added in production)
  const apiKey = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!apiKey || !apiKey.startsWith('pk_')) {
    return NextResponse.json(
      { error: 'Invalid API key' },
      { status: 401 }
    )
  }

  const merchantSessions = Array.from(sessions.values())
    .filter(session => session.api_key === apiKey)
    .map(({ api_key, ...session }) => session) // Remove API key from response

  return NextResponse.json({
    sessions: merchantSessions,
    total: merchantSessions.length
  })
}