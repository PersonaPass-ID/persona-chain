/**
 * KYC Verification System
 * Prevents sybil attacks by verifying user identity before free token claims
 */

export interface KYCProvider {
  id: string
  name: string
  apiUrl: string
  cost: number // Cost in ID tokens
  verificationTypes: ('identity' | 'address' | 'phone' | 'email')[]
  processingTime: string
  accuracy: number
}

export interface KYCVerificationData {
  userId: string
  userAddress: string
  provider: string
  verificationType: 'identity' | 'address' | 'phone' | 'email'
  status: 'pending' | 'verified' | 'failed' | 'expired'
  verificationId: string
  timestamp: string
  expiresAt: string
  cost: number
  evidence?: {
    documentType?: string
    documentNumber?: string
    countryCode?: string
    phoneNumber?: string
    emailAddress?: string
  }
}

export interface KYCResponse {
  success: boolean
  verificationId: string
  status: string
  cost: number
  redirectUrl?: string
  error?: string
}

export interface SybilProtectionConfig {
  minVerificationLevel: 'basic' | 'standard' | 'premium'
  maxFreeTokensPerMonth: number
  verificationExpiry: number // days
  allowedProviders: string[]
}

export class KYCVerificationManager {
  private config: SybilProtectionConfig = {
    minVerificationLevel: 'standard',
    maxFreeTokensPerMonth: 100,
    verificationExpiry: 365, // 1 year
    allowedProviders: ['persona', 'jumio', 'onfido']
  }

  private providers: KYCProvider[] = [
    {
      id: 'persona',
      name: 'Persona Identity Verification',
      apiUrl: 'https://withpersona.com/api/v1',
      cost: 5, // 5 ID tokens per verification
      verificationTypes: ['identity', 'address'],
      processingTime: '2-5 minutes',
      accuracy: 99.5
    },
    {
      id: 'jumio',
      name: 'Jumio KYC Suite',
      apiUrl: 'https://netverify.com/api/v4',
      cost: 3, // 3 ID tokens per verification  
      verificationTypes: ['identity'],
      processingTime: '1-3 minutes',
      accuracy: 99.2
    },
    {
      id: 'onfido',
      name: 'Onfido Document Verification',
      apiUrl: 'https://api.onfido.com/v3.6',
      cost: 4, // 4 ID tokens per verification
      verificationTypes: ['identity', 'address'],
      processingTime: '30 seconds - 2 minutes', 
      accuracy: 98.8
    },
    {
      id: 'plaid_identity',
      name: 'Plaid Identity Verification',
      apiUrl: 'https://api.plaid.com',
      cost: 2, // 2 ID tokens per verification
      verificationTypes: ['identity', 'address'],
      processingTime: '10-30 seconds',
      accuracy: 96.5
    }
  ]

  /**
   * Get available KYC providers
   */
  getProviders(): KYCProvider[] {
    return this.providers.filter(p => 
      this.config.allowedProviders.includes(p.id)
    )
  }

  /**
   * Check if user has valid KYC verification
   */
  async checkKYCStatus(userAddress: string): Promise<{
    isVerified: boolean
    verifications: KYCVerificationData[]
    canClaimFreeTokens: boolean
    nextClaimDate?: string
  }> {
    try {
      // Call API to check user's KYC status
      const response = await fetch('/api/kyc/check-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userAddress })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to check KYC status')
      }

      return data
    } catch (error) {
      console.error('KYC status check failed:', error)
      return {
        isVerified: false,
        verifications: [],
        canClaimFreeTokens: false
      }
    }
  }

  /**
   * Initiate KYC verification process
   */
  async initiateKYCVerification(params: {
    userAddress: string
    providerId: string
    verificationType: 'identity' | 'address' | 'phone' | 'email'
  }): Promise<KYCResponse> {
    try {
      const provider = this.providers.find(p => p.id === params.providerId)
      if (!provider) {
        throw new Error('Invalid KYC provider')
      }

      // Check user has enough tokens to pay for verification
      const response = await fetch('/api/kyc/initiate-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to initiate verification')
      }

      console.log(`🔐 Initiated KYC verification with ${provider.name} (${provider.cost} ID tokens)`)
      
      return {
        success: true,
        verificationId: data.verificationId,
        status: 'pending',
        cost: provider.cost,
        redirectUrl: data.redirectUrl
      }

    } catch (error) {
      console.error('KYC initiation failed:', error)
      return {
        success: false,
        verificationId: '',
        status: 'failed',
        cost: 0,
        error: error instanceof Error ? error.message : 'Verification failed'
      }
    }
  }

  /**
   * Claim free monthly tokens (after KYC verification)
   */
  async claimFreeTokens(userAddress: string): Promise<{
    success: boolean
    tokensAwarded: number
    nextClaimDate: string
    error?: string
  }> {
    try {
      const response = await fetch('/api/kyc/claim-free-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userAddress })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to claim free tokens')
      }

      console.log(`🎁 Awarded ${data.tokensAwarded} free ID tokens to verified user ${userAddress}`)
      
      return data

    } catch (error) {
      console.error('Free token claim failed:', error)
      return {
        success: false,
        tokensAwarded: 0,
        nextClaimDate: '',
        error: error instanceof Error ? error.message : 'Token claim failed'
      }
    }
  }

  /**
   * Get user's verification level and privileges
   */
  getVerificationLevel(verifications: KYCVerificationData[]): {
    level: 'none' | 'basic' | 'standard' | 'premium'
    privileges: string[]
    missingVerifications: string[]
  } {
    const hasIdentity = verifications.some(v => 
      v.verificationType === 'identity' && v.status === 'verified'
    )
    const hasAddress = verifications.some(v => 
      v.verificationType === 'address' && v.status === 'verified'
    )
    const hasPhone = verifications.some(v => 
      v.verificationType === 'phone' && v.status === 'verified'
    )
    const hasEmail = verifications.some(v => 
      v.verificationType === 'email' && v.status === 'verified'
    )

    let level: 'none' | 'basic' | 'standard' | 'premium' = 'none'
    let privileges: string[] = []
    let missingVerifications: string[] = []

    if (hasIdentity && hasAddress) {
      level = 'premium'
      privileges = [
        'claim_free_tokens',
        'reduced_api_costs', 
        'priority_support',
        'governance_voting',
        'higher_transaction_limits'
      ]
    } else if (hasIdentity || (hasPhone && hasEmail && hasAddress)) {
      level = 'standard'
      privileges = [
        'claim_free_tokens',
        'reduced_api_costs',
        'standard_transaction_limits'
      ]
    } else if (hasPhone || hasEmail) {
      level = 'basic'
      privileges = ['basic_transaction_limits']
      missingVerifications.push('identity verification required for free tokens')
    } else {
      missingVerifications = ['phone', 'email', 'identity', 'address']
    }

    return { level, privileges, missingVerifications }
  }

  /**
   * Generate Verifiable Credential for KYC verification
   */
  async generateKYCCredential(verification: KYCVerificationData): Promise<{
    success: boolean
    credential?: any
    error?: string
  }> {
    try {
      // Create VC proving user has completed KYC verification
      const credential = {
        '@context': [
          'https://www.w3.org/2018/credentials/v1',
          'https://personapass.xyz/credentials/kyc/v1'
        ],
        id: `https://personapass.xyz/credentials/kyc/${verification.verificationId}`,
        type: ['VerifiableCredential', 'PersonaKYCCredential'],
        issuer: 'did:persona:kyc-authority',
        issuanceDate: new Date().toISOString(),
        expirationDate: new Date(verification.expiresAt).toISOString(),
        credentialSubject: {
          id: `did:persona:${verification.userAddress}`,
          kycVerified: true,
          verificationLevel: this.getVerificationLevel([verification]).level,
          provider: verification.provider,
          verificationType: verification.verificationType,
          verificationDate: verification.timestamp,
          eligibleForFreeTokens: true
        },
        proof: {
          type: 'Ed25519Signature2020',
          created: new Date().toISOString(),
          verificationMethod: 'did:persona:kyc-authority#key-1',
          proofPurpose: 'assertionMethod'
          // signature will be added by credential service
        }
      }

      return { success: true, credential }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Credential generation failed'
      }
    }
  }
}

// Export singleton instance
export const kycManager = new KYCVerificationManager()

/**
 * Utility functions for sybil protection
 */
export const SybilProtection = {
  /**
   * Check if address is eligible for free tokens
   */
  async isEligibleForFreeTokens(userAddress: string): Promise<boolean> {
    const status = await kycManager.checkKYCStatus(userAddress)
    return status.canClaimFreeTokens
  },

  /**
   * Get required verification steps for free tokens
   */
  getRequiredVerificationSteps(): string[] {
    return [
      'Complete identity verification (government ID)',
      'Verify address (utility bill or bank statement)', 
      'Confirm email address',
      'Wait for verification approval (2-5 minutes)'
    ]
  },

  /**
   * Calculate verification cost
   */
  calculateVerificationCost(providerId: string, verificationType: string): number {
    const provider = kycManager.getProviders().find(p => p.id === providerId)
    return provider?.cost || 5 // Default 5 ID tokens
  }
}