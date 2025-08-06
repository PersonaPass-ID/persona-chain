/**
 * Sumsub Webhook Handler
 * Processes real-time verification updates from Sumsub
 */

import { NextApiRequest, NextApiResponse } from 'next'
import { kycProviderManager } from '@/lib/kyc-providers/kyc-provider-manager'

export default async function handler(
  req: NextApiRequest, 
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get signature from headers
    const signature = req.headers['x-payload-digest'] as string
    const timestamp = req.headers['x-payload-timestamp'] as string
    
    if (!signature) {
      console.error('❌ Sumsub webhook: Missing signature')
      return res.status(400).json({ error: 'Missing signature' })
    }

    // Validate webhook signature
    const payload = JSON.stringify(req.body)
    const isValid = kycProviderManager.validateWebhookSignature(
      signature, 
      payload, 
      'sumsub',
      timestamp
    )

    if (!isValid) {
      console.error('❌ Sumsub webhook: Invalid signature')
      return res.status(401).json({ error: 'Invalid signature' })
    }

    // Process webhook
    const result = kycProviderManager.processWebhook(req.body, 'sumsub')
    
    console.log(`📨 Sumsub webhook processed successfully:`, {
      verificationId: result.verificationId,
      status: result.status,
      event: result.event
    })

    // TODO: Update PersonaChain with verification result
    // TODO: Award free ID tokens if verification successful
    // TODO: Update user verification status in database
    
    if (result.status === 'completed') {
      console.log(`✅ KYC verification completed for user: ${result.verificationId}`)
      console.log(`🎁 User eligible for 100 free ID tokens monthly`)
      
      // TODO: Call PersonaChain to mint free tokens
      // TODO: Update user's KYC status to verified
      // TODO: Send confirmation email/notification
    } else if (result.status === 'failed') {
      console.log(`❌ KYC verification failed for user: ${result.verificationId}`)
      
      // TODO: Log failure reason
      // TODO: Allow user to retry verification
      // TODO: Send failure notification with next steps
    }

    return res.status(200).json({ 
      success: true,
      message: 'Webhook processed successfully',
      verificationId: result.verificationId,
      status: result.status
    })

  } catch (error) {
    console.error('Sumsub webhook processing failed:', error)
    
    return res.status(500).json({ 
      success: false,
      error: 'Failed to process webhook' 
    })
  }
}