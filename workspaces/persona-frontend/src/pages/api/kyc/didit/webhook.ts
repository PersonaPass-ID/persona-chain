/**
 * Didit KYC Webhook Handler
 * Processes verification status updates from Didit.me
 */

import { NextApiRequest, NextApiResponse } from 'next'
import crypto from 'crypto'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Verify webhook signature for security (multiple possible header formats)
    const signature = req.headers['x-didit-signature'] || 
                     req.headers['x-signature'] || 
                     req.headers['signature'] as string
    const webhookSecret = process.env.DIDIT_WEBHOOK_SECRET || ''
    
    console.log('📨 Webhook received with headers:', Object.keys(req.headers))
    
    if (webhookSecret && signature) {
      // Get raw body for signature verification
      const rawBody = JSON.stringify(req.body)
      
      // Try different signature formats that Didit might use
      const possibleSignatures = [
        crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex'),
        crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('base64'),
        `sha256=${crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex')}`,
      ]
      
      const isValidSignature = possibleSignatures.some(expectedSig => 
        crypto.timingSafeEqual(
          Buffer.from(signature),
          Buffer.from(expectedSig)
        )
      )
      
      if (!isValidSignature) {
        console.error('❌ Invalid Didit webhook signature')
        console.error('Received signature:', signature)
        console.error('Expected signatures:', possibleSignatures)
        return res.status(401).json({ error: 'Invalid webhook signature' })
      }
      
      console.log('✅ Webhook signature verified')
    } else if (webhookSecret) {
      console.warn('⚠️ Webhook secret configured but no signature header found')
    } else {
      console.warn('⚠️ No webhook secret configured - accepting unsigned webhooks')
    }

    const webhookData = req.body
    console.log('📨 Didit webhook received:', JSON.stringify(webhookData, null, 2))

    // Process the webhook data directly
    const sessionId = webhookData.session_id || webhookData.id
    const status = webhookData.status || webhookData.verification_status
    const referenceId = webhookData.reference_id || webhookData.vendor_data?.reference_id
    
    console.log(`🔄 Processing webhook for session: ${sessionId}, status: ${status}`)

    // Handle different verification statuses
    switch (status) {
      case 'completed':
      case 'passed':
      case 'approved':
        console.log(`✅ KYC verification completed for session: ${sessionId}`)
        
        // TODO: Save verification result to database
        // TODO: Award 100 ID tokens to verified user
        // TODO: Create Verifiable Credential for user
        // TODO: Generate zero-knowledge proof for verified identity
        
        break
        
      case 'failed':
      case 'rejected':
      case 'declined':
        console.log(`❌ KYC verification failed for session: ${sessionId}`)
        // TODO: Notify user of verification failure
        break
        
      case 'processing':
      case 'pending':
        console.log(`⏳ KYC verification in progress for session: ${sessionId}`)
        break
        
      default:
        console.log(`📝 KYC verification status update: ${status} for session: ${sessionId}`)
    }

    // Acknowledge webhook receipt
    res.status(200).json({ 
      success: true, 
      message: 'Webhook processed successfully',
      session_id: sessionId,
      status: status,
      reference_id: referenceId
    })

  } catch (error: any) {
    console.error('❌ Didit webhook processing error:', error)
    
    // Still return 200 to prevent webhook retries for processing errors
    res.status(200).json({ 
      success: false, 
      error: 'Webhook processing failed',
      details: error.message 
    })
  }
}

// Disable body parsing to handle raw webhook payload
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
}