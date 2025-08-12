/**
 * 🔍 Debug Didit Session Creation
 * Advanced debugging for Didit API integration
 */

import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.DIDIT_API_KEY
  const workflowId = process.env.DIDIT_WORKFLOW_ID
  const webhookSecret = process.env.DIDIT_WEBHOOK_SECRET

  console.log('🔍 Starting Didit API debug...')
  
  // Test 1: Basic API key validation
  try {
    console.log('🧪 Test 1: Testing API key validation...')
    const authTest = await fetch('https://verification.didit.me/v2/session/', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    })

    console.log('Auth test response:', authTest.status, authTest.statusText)
    const authBody = await authTest.text()
    console.log('Auth body:', authBody)
  } catch (error: any) {
    console.log('Auth test error:', error.message)
  }

  // Test 2: Try different session creation formats
  const testCases = [
    {
      name: 'Basic session with minimal data',
      payload: {
        workflow_id: workflowId,
        vendor_data: {
          reference_id: `test_${Date.now()}`
        },
        callback: `${req.headers.origin}/api/kyc/didit/webhook`,
        contact_details: {
          email: 'test@personapass.xyz'
        }
      }
    },
    {
      name: 'Session with all metadata',
      payload: {
        workflow_id: workflowId,
        vendor_data: {
          reference_id: `test_full_${Date.now()}`,
          user_tier: 'free',
          platform: 'PersonaPass'
        },
        callback: `${req.headers.origin}/api/kyc/didit/webhook`,
        metadata: {
          first_name: 'Test',
          last_name: 'User',
          email: 'test@personapass.xyz'
        },
        contact_details: {
          email: 'test@personapass.xyz'
        }
      }
    }
  ]

  const results = []

  for (const testCase of testCases) {
    try {
      console.log(`🧪 Testing: ${testCase.name}`)
      console.log('Payload:', JSON.stringify(testCase.payload, null, 2))

      const response = await fetch('https://verification.didit.me/v2/session/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testCase.payload)
      })

      const responseText = await response.text()
      
      console.log(`Response ${testCase.name}:`, response.status, responseText)
      
      results.push({
        test: testCase.name,
        status: response.status,
        success: response.ok,
        response: responseText,
        payload: testCase.payload
      })

    } catch (error: any) {
      console.log(`Error in ${testCase.name}:`, error.message)
      results.push({
        test: testCase.name,
        status: 'ERROR',
        success: false,
        error: error.message,
        payload: testCase.payload
      })
    }
  }

  // Test 3: Check API endpoints
  const endpointTests = [
    'https://verification.didit.me/v2/',
    'https://verification.didit.me/v2/session',
    'https://verification.didit.me/v2/workflows',
    'https://verification.didit.me/v2/status'
  ]

  const endpointResults = []
  for (const endpoint of endpointTests) {
    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      })
      const text = await response.text()
      endpointResults.push({
        endpoint,
        status: response.status,
        response: text.length > 200 ? text.substring(0, 200) + '...' : text
      })
    } catch (error: any) {
      endpointResults.push({
        endpoint,
        status: 'ERROR',
        error: error.message
      })
    }
  }

  res.status(200).json({
    debug_info: {
      api_key_configured: !!apiKey,
      workflow_id_configured: !!workflowId,
      webhook_secret_configured: !!webhookSecret,
      workflow_id: workflowId,
      api_key_preview: apiKey ? `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 8)}` : 'NOT SET'
    },
    test_results: results,
    endpoint_tests: endpointResults,
    recommendations: [
      'Check if the workflow is "Active" in your Didit console',
      'Verify API key has session creation permissions',
      'Make sure you\'re using the production/sandbox environment correctly',
      'Check if your account needs to be verified first',
      'Try creating a session manually in the Didit console first'
    ]
  })
}