/**
 * Didit KYC Webhook Handler
 * Processes verification status updates from Didit.me
 */

import { NextApiRequest, NextApiResponse } from 'next'
import { PersonaDiditProvider } from '@/lib/kyc-providers/persona-didit-provider'
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

    // Initialize provider for webhook processing
    const diditProvider = new PersonaDiditProvider({
      templateId: process.env.DIDIT_WORKFLOW_ID || '',
      apiKey: process.env.DIDIT_API_KEY || '',
      environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
      webhookSecret: webhookSecret
    })

    // Process the webhook
    const webhookResult = diditProvider.processWebhook(webhookData)
    
    console.log(`🔄 Webhook processed:`, webhookResult)

    // Handle different verification statuses
    switch (webhookResult.status) {
      case 'completed':
      case 'passed':
        console.log(`✅ KYC verification completed for: ${webhookResult.verificationId}`)
        
        // Generate zero-knowledge proof for verified identity
        const zkProofData = diditProvider.generateZkProofData(webhookResult)
        console.log(`🔐 ZK Proof generated: ${zkProofData.zkProofHash}`)
        
        // TODO: Save verification result to database
        // TODO: Award ID tokens to verified user
        // TODO: Create Verifiable Credential for user
        
        break
        
      case 'failed':
      case 'rejected':
        console.log(`❌ KYC verification failed for: ${webhookResult.verificationId}`)
        // TODO: Notify user of verification failure
        break
        
      case 'processing':
      case 'pending':
        console.log(`⏳ KYC verification in progress for: ${webhookResult.verificationId}`)
        break
        
      default:
        console.log(`📝 KYC verification status update: ${webhookResult.status}`)
    }

    // Acknowledge webhook receipt
    res.status(200).json({ 
      success: true, 
      message: 'Webhook processed successfully',
      verification_id: webhookResult.verificationId,
      status: webhookResult.status,
      cost: webhookResult.cost || 0
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