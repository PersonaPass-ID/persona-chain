/**
 * TOTP Verification API Route - PRODUCTION READY
 * Integrates with AWS Lambda for real TOTP code verification
 */

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { did, code, setup_mode } = body

    // Validate required fields
    if (!did || !code) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'DID and verification code are required' 
        },
        { status: 400 }
      )
    }

    // Validate code format
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Verification code must be 6 digits' 
        },
        { status: 400 }
      )
    }

    // Get Lambda function URL from environment
    const lambdaUrl = process.env.TOTP_VERIFY_LAMBDA_URL
    if (!lambdaUrl) {
      console.error('❌ TOTP_VERIFY_LAMBDA_URL not configured')
      return NextResponse.json(
        { 
          success: false, 
          message: 'TOTP verification service not configured' 
        },
        { status: 500 }
      )
    }

    console.log('🔍 Calling Lambda function for TOTP verification...')

    // Call AWS Lambda function
    const lambdaResponse = await fetch(lambdaUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.LAMBDA_API_KEY || 'dev-key'}`
      },
      body: JSON.stringify({
        did,
        code,
        setup_mode: setup_mode || false,
        timestamp: Date.now()
      })
    })

    if (!lambdaResponse.ok) {
      const errorText = await lambdaResponse.text()
      console.error('❌ Lambda function error:', errorText)
      return NextResponse.json(
        { 
          success: false, 
          message: 'TOTP verification service error' 
        },
        { status: 500 }
      )
    }

    const lambdaResult = await lambdaResponse.json()

    if (!lambdaResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          message: lambdaResult.message || 'Invalid verification code' 
        },
        { status: 400 }
      )
    }

    console.log('✅ TOTP verification successful for DID:', did)

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'TOTP verification successful',
      setup_complete: lambdaResult.setup_complete || false
    })

  } catch (error) {
    console.error('❌ TOTP verification API error:', error)
    
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