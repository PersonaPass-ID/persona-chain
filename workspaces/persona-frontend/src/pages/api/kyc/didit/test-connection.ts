/**
 * Didit API Connection Test
 * Test your API credentials and discover available workflows
 */

import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.DIDIT_API_KEY
  const webhookSecret = process.env.DIDIT_WEBHOOK_SECRET

  if (!apiKey) {
    return res.status(400).json({ 
      error: 'Missing DIDIT_API_KEY in environment variables' 
    })
  }

  try {
    console.log('🔍 Testing Didit API connection...')
    
    // Test 1: Check API key validity by trying to access account/workflows
    const workflowsResponse = await fetch('https://verification.didit.me/v2/workflows', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (!workflowsResponse.ok) {
      const errorData = await workflowsResponse.text()
      console.error('❌ Workflows API failed:', workflowsResponse.status, errorData)
      
      return res.status(500).json({
        success: false,
        error: `API connection failed: ${workflowsResponse.status}`,
        details: errorData,
        suggestions: [
          'Verify your API key is correct',
          'Check if API key has proper permissions', 
          'Ensure Didit account is active'
        ]
      })
    }

    const workflowsData = await workflowsResponse.json()
    console.log('✅ Successfully connected to Didit API')
    console.log('📋 Available workflows:', workflowsData)

    // Test 2: Try alternative endpoints if workflows endpoint doesn't exist
    let accountInfo = null
    try {
      const accountResponse = await fetch('https://verification.didit.me/v2/account', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (accountResponse.ok) {
        accountInfo = await accountResponse.json()
      }
    } catch (accountError) {
      console.log('ℹ️ Account endpoint not available (this is normal)')
    }

    res.status(200).json({
      success: true,
      message: '✅ Didit API connection successful!',
      api_key_status: 'Valid',
      webhook_secret_configured: !!webhookSecret,
      workflows: workflowsData,
      account_info: accountInfo,
      next_steps: [
        '1. Copy a workflow ID from the workflows list above',
        '2. Update DIDIT_WORKFLOW_ID in your .env.local file',
        '3. Test creating a verification session',
        '4. Configure webhook URL in Didit dashboard: https://personapass.xyz/api/kyc/didit/webhook'
      ],
      integration_status: {
        api_credentials: '✅ Valid',
        webhook_secret: webhookSecret ? '✅ Configured' : '⚠️ Missing',
        workflow_id: process.env.DIDIT_WORKFLOW_ID ? '✅ Configured' : '⚠️ Needs to be set'
      }
    })

  } catch (error: any) {
    console.error('❌ Didit API test failed:', error)
    
    res.status(500).json({
      success: false,
      error: 'Connection test failed',
      details: error.message,
      troubleshooting: {
        network_error: 'Check your internet connection',
        api_error: 'Verify API key format and permissions',
        endpoint_error: 'Confirm Didit API endpoints are correct'
      }
    })
  }
}