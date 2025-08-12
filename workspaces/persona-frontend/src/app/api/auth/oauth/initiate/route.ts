/**
 * OAuth Initiation API Route - PRODUCTION READY
 * Integrates with AWS Lambda for real OAuth provider authentication
 */

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { provider, did, state } = body

    // Validate required fields
    if (!provider || !did || !state) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Provider, DID, and state are required' 
        },
        { status: 400 }
      )
    }

    // Validate provider
    const validProviders = ['microsoft', 'google', 'github']
    if (!validProviders.includes(provider)) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid OAuth provider' 
        },
        { status: 400 }
      )
    }

    // Get Lambda function URL from environment
    const lambdaUrl = process.env.OAUTH_INITIATE_LAMBDA_URL
    if (!lambdaUrl) {
      console.error('❌ OAUTH_INITIATE_LAMBDA_URL not configured')
      return NextResponse.json(
        { 
          success: false, 
          message: 'OAuth service not configured' 
        },
        { status: 500 }
      )
    }

    console.log(`🌐 Initiating OAuth with ${provider} for DID:`, did)

    // Call AWS Lambda function
    const lambdaResponse = await fetch(lambdaUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.LAMBDA_API_KEY || 'dev-key'}`
      },
      body: JSON.stringify({
        provider,
        did,
        state,
        redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/oauth/callback`,
        timestamp: Date.now()
      })
    })

    if (!lambdaResponse.ok) {
      const errorText = await lambdaResponse.text()
      console.error('❌ Lambda function error:', errorText)
      return NextResponse.json(
        { 
          success: false, 
          message: 'OAuth initiation service error' 
        },
        { status: 500 }
      )
    }

    const lambdaResult = await lambdaResponse.json()

    if (!lambdaResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          message: lambdaResult.message || 'OAuth initiation failed' 
        },
        { status: 400 }
      )
    }

    console.log(`✅ OAuth URL generated for ${provider}`)

    // Return success response with auth URL
    return NextResponse.json({
      success: true,
      authUrl: lambdaResult.authUrl,
      state: lambdaResult.state
    })

  } catch (error) {
    console.error('❌ OAuth initiation API error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}