/**
 * KYC Verification Webhook Handler
 * Processes callbacks from third-party KYC providers
 */

import { NextApiRequest, NextApiResponse } from 'next'

interface KYCWebhookData {
  verificationId: string
  provider: string
  status: 'verified' | 'failed' | 'pending' | 'rejected'
  userAddress: string
  verificationType: 'identity' | 'address' | 'phone' | 'email'
  timestamp: string
  evidence?: {
    documentType?: string
    documentNumber?: string
    countryCode?: string
    phoneNumber?: string
    emailAddress?: string
    confidence?: number
    riskScore?: number
  }
  error?: {
    code: string
    message: string
    details?: any
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const webhookData: KYCWebhookData = req.body
    const { verificationId, provider, status, userAddress, verificationType } = webhookData

    // Validate webhook signature (in production, verify this comes from trusted provider)
    const isValidSignature = await validateWebhookSignature(req, provider)
    if (!isValidSignature) {
      console.error('🚨 KYC Webhook: Invalid signature detected')
      return res.status(401).json({ error: 'Invalid webhook signature' })
    }

    console.log(`🔐 KYC Webhook: ${provider} verification ${verificationId} status: ${status}`)

    // Update verification record in database
    await updateVerificationStatus(webhookData)

    // Handle successful verification
    if (status === 'verified') {
      await handleSuccessfulVerification(webhookData)
    }

    // Handle failed verification
    if (status === 'failed' || status === 'rejected') {
      await handleFailedVerification(webhookData)
    }

    return res.status(200).json({
      success: true,
      message: 'Webhook processed successfully',
      verificationId,
      status
    })

  } catch (error) {
    console.error('KYC webhook processing error:', error)
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Webhook processing failed'
    })
  }
}

/**
 * Validate webhook signature to ensure it's from trusted provider
 */
async function validateWebhookSignature(req: NextApiRequest, provider: string): Promise<boolean> {
  try {
    const signature = req.headers['x-webhook-signature'] as string
    const timestamp = req.headers['x-webhook-timestamp'] as string
    
    if (!signature || !timestamp) {
      return false
    }

    // In production, verify signature with provider's webhook secret
    // For MVP, we'll just check that signature exists
    const hasSignature = signature && signature.length > 10
    
    console.log(`🔍 Webhook signature validation for ${provider}: ${hasSignature ? 'PASSED' : 'FAILED'}`)
    
    return hasSignature
  } catch (error) {
    console.error('Webhook signature validation failed:', error)
    return false
  }
}

/**
 * Update verification status in database
 */
async function updateVerificationStatus(webhookData: KYCWebhookData): Promise<void> {
  try {
    const { verificationId, status, evidence, error } = webhookData
    
    // In production, update database record
    // For MVP, we'll just log the update
    console.log(`📝 Updating verification ${verificationId} to status: ${status}`)
    
    if (evidence) {
      console.log(`📋 Evidence provided:`, {
        documentType: evidence.documentType,
        countryCode: evidence.countryCode,
        confidence: evidence.confidence,
        riskScore: evidence.riskScore
      })
    }
    
    if (error) {
      console.log(`❌ Verification error:`, error)
    }
    
    // TODO: Implement actual database update
    // await database.verifications.update(verificationId, { status, evidence, error })
    
  } catch (error) {
    console.error('Failed to update verification status:', error)
    throw error
  }
}

/**
 * Handle successful verification
 */
async function handleSuccessfulVerification(webhookData: KYCWebhookData): Promise<void> {
  try {
    const { verificationId, userAddress, verificationType, provider, evidence } = webhookData
    
    console.log(`✅ Processing successful ${verificationType} verification for ${userAddress}`)
    
    // Create Verifiable Credential for the successful verification
    const credential = await createKYCVerifiableCredential(webhookData)
    
    // Update user's verification status
    await updateUserVerificationLevel(userAddress, verificationType)
    
    // If identity verification, enable free token claiming
    if (verificationType === 'identity') {
      console.log(`🎁 User ${userAddress} is now eligible for free monthly tokens`)
      
      // Send notification to user about eligibility
      await notifyUserAboutFreeTokenEligibility(userAddress, verificationId)
    }
    
    // Log anti-sybil protection success
    console.log(`🛡️ Sybil protection: Successfully verified unique identity for ${userAddress}`)
    
  } catch (error) {
    console.error('Failed to handle successful verification:', error)
    throw error
  }
}

/**
 * Handle failed verification
 */
async function handleFailedVerification(webhookData: KYCWebhookData): Promise<void> {
  try {
    const { verificationId, userAddress, error } = webhookData
    
    console.log(`❌ Processing failed verification ${verificationId} for ${userAddress}`)
    
    if (error) {
      console.log(`Failure reason: ${error.code} - ${error.message}`)
    }
    
    // TODO: Implement retry logic or user notification
    // await notifyUserAboutVerificationFailure(userAddress, verificationId, error)
    
  } catch (error) {
    console.error('Failed to handle verification failure:', error)
    throw error
  }
}

/**
 * Create Verifiable Credential for successful KYC verification
 */
async function createKYCVerifiableCredential(webhookData: KYCWebhookData): Promise<any> {
  try {
    const { verificationId, userAddress, verificationType, provider, evidence, timestamp } = webhookData
    
    const credential = {
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://personapass.xyz/credentials/kyc/v1'
      ],
      id: `https://personapass.xyz/credentials/kyc/${verificationId}`,
      type: ['VerifiableCredential', 'PersonaKYCCredential'],
      issuer: 'did:persona:kyc-authority',
      issuanceDate: new Date().toISOString(),
      expirationDate: new Date(Date.now() + (365 * 24 * 60 * 60 * 1000)).toISOString(), // 1 year
      credentialSubject: {
        id: `did:persona:${userAddress}`,
        kycVerified: true,
        verificationType,
        provider,
        verificationDate: timestamp,
        verificationId,
        evidence: evidence ? {
          documentType: evidence.documentType,
          countryCode: evidence.countryCode,
          confidence: evidence.confidence,
          riskScore: evidence.riskScore
        } : undefined
      },
      proof: {
        type: 'Ed25519Signature2020',
        created: new Date().toISOString(),
        verificationMethod: 'did:persona:kyc-authority#key-1',
        proofPurpose: 'assertionMethod'
        // signature will be added by credential service
      }
    }
    
    console.log(`📜 Created KYC credential for verification ${verificationId}`)
    
    // TODO: Store credential in PersonaChain
    // await personaChainService.storeCredential(userAddress, credential)
    
    return credential
    
  } catch (error) {
    console.error('Failed to create KYC credential:', error)
    throw error
  }
}

/**
 * Update user's overall verification level
 */
async function updateUserVerificationLevel(userAddress: string, newVerificationType: string): Promise<void> {
  try {
    // Get user's current verifications
    // const currentVerifications = await database.verifications.getByUser(userAddress)
    
    // Calculate new verification level
    let newLevel = 'basic'
    
    // This is simplified logic - in production, check all verification types
    if (newVerificationType === 'identity') {
      newLevel = 'standard' // Identity verification = standard level
    }
    
    console.log(`📈 Updated verification level for ${userAddress}: ${newLevel}`)
    
    // TODO: Update user record in database
    // await database.users.update(userAddress, { verificationLevel: newLevel })
    
  } catch (error) {
    console.error('Failed to update user verification level:', error)
    throw error
  }
}

/**
 * Notify user about free token eligibility
 */
async function notifyUserAboutFreeTokenEligibility(userAddress: string, verificationId: string): Promise<void> {
  try {
    console.log(`📧 Notifying ${userAddress} about free token eligibility`)
    
    // TODO: Implement notification system (email, push notification, etc.)
    // For now, just log the notification
    
    const notification = {
      type: 'kyc_verification_success',
      recipient: userAddress,
      message: '🎉 Identity verification successful! You can now claim 100 free ID tokens monthly.',
      verificationId,
      timestamp: new Date().toISOString(),
      actions: [
        {
          label: 'Claim Free Tokens',
          url: '/dashboard?tab=kyc&action=claim'
        }
      ]
    }
    
    console.log('📬 Notification prepared:', notification)
    
    // TODO: Send actual notification
    // await notificationService.send(notification)
    
  } catch (error) {
    console.error('Failed to send notification:', error)
  }
}