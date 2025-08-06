/**
 * 🆓 Didit KYC Session Creation API
 * Creates FREE verification sessions using Didit.me API
 * Based on Didit documentation: POST https://verification.didit.me/v2/session/
 */

import { NextApiRequest, NextApiResponse } from 'next'

interface CreateSessionRequest {
  user_address: string
  email: string
  metadata?: {
    platform?: string
    tier?: string
    timestamp?: string
    first_name?: string
    last_name?: string
  }
}

interface DiditSessionResponse {
  session_id: string
  session_url: string
  status: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.DIDIT_API_KEY
  const workflowId = process.env.DIDIT_WORKFLOW_ID
  const webhookSecret = process.env.DIDIT_WEBHOOK_SECRET

  // Validate required environment variables
  if (!apiKey) {
    return res.status(500).json({ 
      success: false,
      error: 'DIDIT_API_KEY not configured',
      troubleshooting: 'Add your Didit API key to .env.local'
    })
  }

  if (!workflowId) {
    return res.status(500).json({ 
      success: false,
      error: 'DIDIT_WORKFLOW_ID not configured',
      troubleshooting: 'Get your workflow ID from Didit Business Console → Workflows'
    })
  }

  try {
    const { user_address, email, metadata = {} }: CreateSessionRequest = req.body

    // Validate request data
    if (!user_address) {
      return res.status(400).json({
        success: false,
        error: 'user_address is required'
      })
    }

    console.log('🚀 Creating FREE Didit verification session for:', user_address)

    // Prepare session request according to Didit API documentation
    const sessionRequest = {
      workflow_id: workflowId,
      vendor_data: {
        reference_id: user_address, // Use wallet address as unique reference
        user_tier: metadata.tier || 'free',
        platform: metadata.platform || 'PersonaPass'
      },
      callback: `${req.headers.origin || process.env.NEXT_PUBLIC_SITE_URL || 'https://personapass.xyz'}/api/kyc/didit/webhook`,
      metadata: {
        first_name: metadata.first_name || 'PersonaPass',
        last_name: metadata.last_name || 'User',
        email: email || `${user_address.slice(0, 8)}@personapass.xyz`,
        wallet_address: user_address,
        verification_type: 'proof_of_personhood',
        created_at: new Date().toISOString()
      },
      contact_details: {
        email: email || `${user_address.slice(0, 8)}@personapass.xyz`
      }
    }

    console.log('📤 Sending session creation request to Didit API')
    console.log('Request payload:', JSON.stringify(sessionRequest, null, 2))

    // Call Didit API to create session
    const diditResponse = await fetch('https://verification.didit.me/v2/session/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(sessionRequest)
    })

    const responseText = await diditResponse.text()
    console.log('📥 Raw Didit API response:', diditResponse.status, responseText)

    if (!diditResponse.ok) {
      console.error('❌ Didit API error:', diditResponse.status, responseText)
      
      let errorMessage = 'Session creation failed'
      let troubleshooting: Record<number, string> = {
        400: 'Invalid request format or missing workflow_id',
        401: 'API key is invalid or expired',
        403: 'API key lacks session creation permissions',
        404: 'Workflow ID not found in your Didit account',
        429: 'Rate limit exceeded - try again in a moment',
        500: 'Didit server error - try again later'
      }

      return res.status(diditResponse.status).json({
        success: false,
        error: errorMessage,
        status_code: diditResponse.status,
        details: responseText,
        troubleshooting: troubleshooting[diditResponse.status] || 'Unexpected error occurred',
        request_sent: sessionRequest
      })
    }

    // Parse successful response
    let sessionData: DiditSessionResponse
    try {
      sessionData = JSON.parse(responseText)
    } catch (parseError) {
      console.error('❌ Failed to parse Didit response:', parseError)
      return res.status(500).json({
        success: false,
        error: 'Invalid response from Didit API',
        raw_response: responseText
      })
    }

    console.log('✅ Didit session created successfully!')
    console.log('Session data:', sessionData)

    // Return success response
    res.status(200).json({
      success: true,
      message: '🎉 FREE verification session created successfully!',
      session_data: sessionData,
      cost_info: {
        cost: 0,
        provider: 'Didit',
        billing: 'FREE unlimited verifications',
        savings_vs_competitors: '99%+ cost savings'
      },
      next_steps: [
        '1. User completes verification in session_url',
        '2. Didit sends webhook to /api/kyc/didit/webhook',
        '3. PersonaPass awards 100 ID tokens',
        '4. User gets Proof of Personhood VC',
        '5. Monthly free token eligibility activated'
      ]
    })

  } catch (error: any) {
    console.error('❌ Session creation error:', error)
    
    res.status(500).json({
      success: false,
      error: 'Internal server error during session creation',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}