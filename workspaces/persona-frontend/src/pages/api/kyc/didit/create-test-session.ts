/**
 * Create Test Didit Session
 * Test session creation with your actual API credentials
 */

import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.DIDIT_API_KEY
  const workflowId = process.env.DIDIT_WORKFLOW_ID
  const webhookSecret = process.env.DIDIT_WEBHOOK_SECRET

  if (!apiKey) {
    return res.status(400).json({ error: 'Missing DIDIT_API_KEY' })
  }

  if (!workflowId) {
    return res.status(400).json({ 
      error: 'Missing DIDIT_WORKFLOW_ID',
      suggestion: 'Run /api/kyc/didit/test-connection to find your workflow ID'
    })
  }

  try {
    console.log('🧪 Creating test Didit session...')

    // Test session with sample data
    const requestBody = {
      workflow_id: workflowId,
      vendor_data: {
        reference_id: `test_user_${Date.now()}`,
        user_tier: 'free'
      },
      callback: `${req.headers.origin || 'http://localhost:3001'}/api/kyc/didit/webhook`,
      metadata: {
        first_name: 'Test',
        last_name: 'User',
        email: 'test@personapass.xyz'
      },
      contact_details: {
        email: 'test@personapass.xyz'
      }
    }

    console.log('📤 Sending request to Didit:', JSON.stringify(requestBody, null, 2))

    const response = await fetch('https://verification.didit.me/v2/session', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    const responseText = await response.text()
    console.log('📥 Raw response:', response.status, responseText)

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: `Session creation failed: ${response.status}`,
        details: responseText,
        request_sent: requestBody,
        troubleshooting: {
          400: 'Check workflow_id and request format',
          401: 'API key may be invalid or expired', 
          403: 'API key may not have session creation permissions',
          404: 'Workflow ID not found',
          500: 'Didit server error - try again later'
        }
      })
    }

    let data
    try {
      data = JSON.parse(responseText)
    } catch (parseError) {
      data = { raw_response: responseText }
    }

    console.log('✅ Test session created successfully!')
    console.log('Session data:', data)

    res.status(200).json({
      success: true,
      message: '🎉 Test session created successfully!',
      session_data: data,
      next_steps: [
        '1. Save the session_url and test it in browser',
        '2. Complete the verification flow', 
        '3. Check webhook at /api/kyc/didit/webhook',
        '4. Integrate into your frontend component'
      ],
      webhook_url: `${req.headers.origin}/api/kyc/didit/webhook`,
      integration_ready: true
    })

  } catch (error: any) {
    console.error('❌ Test session creation failed:', error)
    
    res.status(500).json({
      success: false,
      error: 'Test session creation failed',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}