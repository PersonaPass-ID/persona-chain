/**
 * KYC Verification Initiation API
 * Starts verification process with multiple third-party providers
 */

import { NextApiRequest, NextApiResponse } from 'next'
import { kycProviderManager } from '@/lib/kyc-providers/kyc-provider-manager'

interface VerificationRequest {
  userAddress: string
  providerId?: string // Optional - will auto-select if not provided
  verificationType: 'identity' | 'address' | 'phone' | 'email'
  countryCode?: string
  metadata?: {
    firstName?: string
    lastName?: string
    email?: string
    phoneNumber?: string
    address?: string
    city?: string
    state?: string
    postalCode?: string
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
    const { userAddress, providerId, verificationType, countryCode, metadata }: VerificationRequest = req.body

    // Validate input
    if (!userAddress || !verificationType) {
      return res.status(400).json({ 
        error: 'Missing required fields: userAddress, verificationType' 
      })
    }

    // Validate verification type
    const validTypes = ['identity', 'address', 'phone', 'email']
    if (!validTypes.includes(verificationType)) {
      return res.status(400).json({ error: 'Invalid verification type' })
    }

    // Get available providers
    const availableProviders = kycProviderManager.getAvailableProviders()
    if (availableProviders.length === 0) {
      return res.status(503).json({ error: 'No KYC providers available' })
    }

    // TODO: Check user has sufficient ID tokens to pay for verification
    const userIDBalance = 50 // Mock balance - in production, query PersonaChain
    const recommendedProvider = kycProviderManager.getRecommendedProvider(verificationType, countryCode)
    const selectedProvider = availableProviders.find(p => p.id === (providerId || recommendedProvider))
    
    if (!selectedProvider) {
      return res.status(400).json({ 
        error: 'No suitable provider available for this verification type',
        availableProviders: availableProviders.map(p => ({
          id: p.id,
          name: p.name,
          cost: p.cost,
          supportedTypes: p.verificationTypes
        }))
      })
    }
    
    if (userIDBalance < selectedProvider.cost) {
      return res.status(400).json({ 
        error: `Insufficient ID tokens. Required: ${selectedProvider.cost}, Available: ${userIDBalance}`,
        requiredTokens: selectedProvider.cost,
        availableTokens: userIDBalance
      })
    }

    // Create verification session using multi-provider manager
    const result = await kycProviderManager.createVerificationSession({
      userAddress,
      verificationType,
      providerId: selectedProvider.id,
      metadata
    })

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Failed to create verification session'
      })
    }

    console.log(`🔐 Initiated ${verificationType} verification for ${userAddress} with ${selectedProvider.name} (${selectedProvider.cost} ID tokens)`)

    // TODO: Deduct tokens from user's PersonaChain balance
    console.log(`💳 Would deduct ${selectedProvider.cost} ID tokens from ${userAddress}`)

    return res.status(200).json({
      success: true,
      verificationId: result.verificationId,
      provider: selectedProvider.name,
      selectedProviderId: result.selectedProvider,
      cost: selectedProvider.cost,
      redirectUrl: result.redirectUrl,
      status: 'pending',
      expiresAt: result.expiresAt,
      fallbackAvailable: result.fallbackAvailable,
      instructions: getVerificationInstructions(result.selectedProvider, verificationType),
      availableProviders: availableProviders.map(p => ({
        id: p.id,
        name: p.name,
        cost: p.cost,
        processingTime: p.processingTime,
        accuracy: p.accuracy
      }))
    })

  } catch (error) {
    console.error('KYC initiation error:', error)
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to initiate verification'
    })
  }
}

/**
 * Get verification instructions based on provider and type
 */

function getVerificationInstructions(providerId: string, verificationType: string): string[] {
  const baseInstructions = [
    'Click the verification link to start the process',
    'Have your documents ready before starting',
    'Ensure good lighting for document photos',
    'Process typically takes 2-5 minutes'
  ]

  const typeSpecific = {
    identity: [
      'Valid government-issued photo ID required (driver\'s license, passport, or national ID)',
      'Take clear photos of front and back of document',
      'Complete a brief selfie verification'
    ],
    address: [
      'Recent utility bill, bank statement, or government document showing your address',
      'Document must be dated within the last 3 months',
      'Address must match your profile information'
    ],
    phone: [
      'Receive SMS verification code',
      'Enter the 6-digit code within 10 minutes'
    ],
    email: [
      'Check your email for verification link',
      'Click the link within 24 hours to verify'
    ]
  }

  return [...baseInstructions, ...typeSpecific[verificationType as keyof typeof typeSpecific] || []]
}