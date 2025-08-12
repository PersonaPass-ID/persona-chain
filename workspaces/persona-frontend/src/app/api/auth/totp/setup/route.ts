/**
 * TOTP Setup API Route - PRODUCTION READY
 * Integrates with AWS Lambda for real TOTP secret generation
 */

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { did, signature } = body

    // Validate required fields
    if (!did || !signature) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'DID and signature are required' 
        },
        { status: 400 }
      )
    }

    // Get Lambda function URL from environment
    const lambdaUrl = process.env.TOTP_SETUP_LAMBDA_URL
    if (!lambdaUrl) {
      console.error('❌ TOTP_SETUP_LAMBDA_URL not configured')
      return NextResponse.json(
        { 
          success: false, 
          message: 'TOTP service not configured' 
        },
        { status: 500 }
      )
    }

    console.log('🔐 Calling Lambda function for TOTP setup...')

    // Call AWS Lambda function
    const lambdaResponse = await fetch(lambdaUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.LAMBDA_API_KEY || 'dev-key'}`
      },
      body: JSON.stringify({
        did,
        signature,
        timestamp: Date.now()
      })
    })

    if (!lambdaResponse.ok) {
      const errorText = await lambdaResponse.text()
      console.error('❌ Lambda function error:', errorText)
      return NextResponse.json(
        { 
          success: false, 
          message: 'TOTP setup service error' 
        },
        { status: 500 }
      )
    }

    const lambdaResult = await lambdaResponse.json()

    if (!lambdaResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          message: lambdaResult.message || 'TOTP setup failed' 
        },
        { status: 400 }
      )
    }

    console.log('✅ TOTP setup successful for DID:', did)

    // Return success response with TOTP data
    return NextResponse.json({
      success: true,
      secret: lambdaResult.secret,
      qr_code: lambdaResult.qr_code,
      backup_codes: lambdaResult.backup_codes
    })

  } catch (error) {
    console.error('❌ TOTP setup API error:', error)
    
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