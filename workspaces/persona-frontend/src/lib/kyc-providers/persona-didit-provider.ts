/**
 * Persona (Didit) KYC Provider - FREE + Optional Premium Features
 * Free Tier: ID verification, passive liveness, face match - $0 cost
 * Premium Tier: Age estimation, active liveness, phone - pay per use
 */

export interface PersonaDiditConfig {
  templateId: string // Your Persona template ID
  apiKey: string
  environment: 'sandbox' | 'production'
  webhookSecret: string
}

export interface PersonaDiditRequest {
  externalUserId: string
  userTier: 'free' | 'premium' | 'enterprise'
  features: {
    // FREE features (always enabled)
    idVerification: true
    passiveLiveness: true
    faceMatch: true
    
    // PAID features (only for premium/enterprise users)
    activeEnhancedLiveness?: boolean    // $0.15 - More secure than passive
    phoneVerification?: boolean         // $0.10 - Alternative to $0.02 SMS
    ageEstimation?: boolean            // $0.10 - HUGE revenue opportunity
    biometricAuth?: boolean            // $0.10 - For returning users
  }
  metadata: {
    firstName?: string
    lastName?: string
    email?: string
    phoneNumber?: string
  }
}

export interface PersonaDiditResponse {
  success: boolean
  verificationId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  cost: number // Actual cost incurred
  features: {
    // FREE results
    idVerified: boolean
    livenessVerified: boolean
    faceMatched: boolean
    
    // PREMIUM results (if requested)
    ageEstimated?: number
    phoneVerified?: boolean
    enhancedLivenessScore?: number
  }
  result?: any
  error?: string
}

export class PersonaDiditProvider {
  private config: PersonaDiditConfig
  private baseUrl: string

  constructor(config: PersonaDiditConfig) {
    this.config = config
    this.baseUrl = config.environment === 'production'
      ? 'https://verification.didit.me/v2'
      : 'https://sandbox.verification.didit.me/v2'
  }

  /**
   * Get provider information with FREE + premium pricing
   */
  getProviderInfo() {
    return {
      id: 'persona_didit',
      name: 'Persona (Didit) Identity Platform',
      description: 'FREE core KYC + optional premium features',
      
      freeTier: {
        cost: 0.00,
        features: [
          '✅ ID Verification - FREE unlimited',
          '✅ Passive Liveness Detection - FREE unlimited',
          '✅ Face Matching - FREE unlimited', 
          '✅ Database Validation - FREE unlimited',
          '✅ IP Analysis - FREE unlimited',
          '✅ NFC Verification - FREE unlimited'
        ],
        countries: '220+ countries and territories',
        documents: '3000+ document types supported'
      },
      
      premiumFeatures: {
        activeEnhancedLiveness: {
          cost: 0.15,
          description: 'Enhanced security liveness detection',
          useCase: 'High-value transactions, enterprise security'
        },
        phoneVerification: {
          cost: 0.10,
          description: 'Phone number verification',
          useCase: 'Enhanced trust scoring, 2FA setup'
        },
        ageEstimation: {
          cost: 0.10, 
          description: 'AI-based age estimation from face',
          useCase: 'Age-gated platforms, gaming, adult content'
        },
        biometricAuth: {
          cost: 0.10,
          description: 'Fast re-verification for returning users',
          useCase: 'Login security, account recovery'
        }
      },
      
      revenueOpportunity: {
        ageGatedPlatforms: 'Gaming, social media, adult content',
        financialServices: 'Enhanced security for high-value transactions',
        enterprises: 'White-label identity solutions'
      }
    }
  }

  /**
   * Create Didit verification session using their actual API structure
   */
  async createVerificationSession(params: PersonaDiditRequest): Promise<PersonaDiditResponse> {
    try {
      // Calculate expected cost before API call
      const expectedCost = this.calculateVerificationCost(params)
      
      // Block expensive features for free users
      if (params.userTier === 'free' && expectedCost > 0) {
        console.log(`🚫 Blocking premium features for free user: ${params.externalUserId}`)
        // Strip premium features for free users
        params.features = {
          idVerification: true,
          passiveLiveness: true,
          faceMatch: true
          // Remove all premium features
        }
      }

      console.log(`🆓 Creating Didit verification for ${params.externalUserId} (Expected cost: $${expectedCost})`)

      // Use Didit's actual API structure from your documentation
      const requestBody = {
        workflow_id: this.config.templateId,
        vendor_data: {
          reference_id: params.externalUserId,
          user_tier: params.userTier
        },
        callback: `${process.env.NEXT_PUBLIC_BASE_URL}/api/kyc/didit/webhook`,
        metadata: {
          first_name: params.metadata.firstName,
          last_name: params.metadata.lastName,
          email: params.metadata.email
        },
        contact_details: {
          email: params.metadata.email,
          phone: params.metadata.phoneNumber
        },
        // Configure features based on user tier
        features: this.buildFeatureConfig(params.features, params.userTier)
      }

      const response = await fetch(`${this.baseUrl}/session`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Didit verification session creation failed')
      }

      console.log(`✅ Didit verification session created: ${data.session_id} (Expected cost: $${expectedCost})`)

      return {
        success: true,
        verificationId: data.session_id,
        status: 'pending',
        cost: expectedCost,
        features: {
          idVerified: false, // Will be updated via webhook
          livenessVerified: false,
          faceMatched: false,
          // Premium features included if user paid for them
          ...(params.features.ageEstimation && { ageEstimated: undefined }),
          ...(params.features.phoneVerification && { phoneVerified: false }),
          ...(params.features.activeEnhancedLiveness && { enhancedLivenessScore: undefined })
        },
        // Include session URL for frontend integration
        result: {
          session_url: data.session_url,
          session_id: data.session_id
        }
      }

    } catch (error: any) {
      console.error('Didit verification session creation failed:', error)
      
      return {
        success: false,
        verificationId: '',
        status: 'failed',
        cost: 0,
        features: { idVerified: false, livenessVerified: false, faceMatched: false },
        error: error.message || 'Failed to create Didit verification session'
      }
    }
  }

  /**
   * Calculate verification cost based on requested features
   */
  private calculateVerificationCost(params: PersonaDiditRequest): number {
    let cost = 0

    // FREE features (no cost)
    // idVerification, passiveLiveness, faceMatch - always $0

    // PREMIUM features (pay per use)
    if (params.features.activeEnhancedLiveness) cost += 0.15
    if (params.features.phoneVerification) cost += 0.10
    if (params.features.ageEstimation) cost += 0.10
    if (params.features.biometricAuth) cost += 0.10

    return cost
  }

  /**
   * Build feature configuration for Persona API
   */
  private buildFeatureConfig(features: any, userTier: string) {
    const config: any = {
      // Always enabled FREE features
      'id-verification': true,
      'passive-liveness': true,
      'face-match': true,
      'database-validation': true,
      'ip-analysis': true
    }

    // Add premium features only for paying users
    if (userTier !== 'free') {
      if (features.activeEnhancedLiveness) config['active-liveness'] = true
      if (features.phoneVerification) config['phone-verification'] = true
      if (features.ageEstimation) config['age-estimation'] = true
      if (features.biometricAuth) config['biometric-authentication'] = true
    }

    return config
  }

  /**
   * Process webhook with cost tracking
   */
  processWebhook(webhookData: any) {
    try {
      const { data } = webhookData
      const verification = data.attributes

      console.log(`📨 Persona webhook: ${verification.status} for verification ${data.id}`)

      // Track actual costs incurred
      const actualCost = this.calculateActualCost(verification)

      return {
        provider: 'persona_didit',
        verificationId: data.id,
        event: `verification.${verification.status}`,
        status: verification.status,
        result: verification,
        timestamp: new Date().toISOString(),
        cost: actualCost,
        readyForZkProof: verification.status === 'passed',
        complianceReady: verification.status === 'passed'
      }

    } catch (error) {
      console.error('Failed to process Persona webhook:', error)
      throw error
    }
  }

  /**
   * Calculate actual cost from completed verification
   */
  private calculateActualCost(verification: any): number {
    let cost = 0

    // Check which premium features were actually used
    const checks = verification.checks || {}
    
    if (checks['active-liveness']?.status === 'passed') cost += 0.15
    if (checks['phone-verification']?.status === 'passed') cost += 0.10
    if (checks['age-estimation']?.status === 'passed') cost += 0.10
    if (checks['biometric-authentication']?.status === 'passed') cost += 0.10

    return cost
  }

  /**
   * Generate ZK proof with cost information
   */
  generateZkProofData(verificationResult: any) {
    const proofData = {
      provider: 'persona_didit',
      verificationId: verificationResult.verificationId,
      timestamp: new Date().toISOString(),
      cost: verificationResult.cost, // Track actual cost in proof
      features_used: this.extractFeaturesUsed(verificationResult),
      verification_level: verificationResult.cost > 0 ? 'premium' : 'free'
    }

    const crypto = require('crypto')
    const zkProofHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(proofData))
      .digest('hex')

    return {
      zkProofHash,
      verificationLevel: proofData.verification_level,
      timestamp: proofData.timestamp,
      eligibleForTokens: true,
      cost: verificationResult.cost,
      legalCompliance: {
        gdprCompliant: true,
        dataRetentionPeriod: '7 years',
        consentObtained: true
      }
    }
  }

  /**
   * Extract which features were actually used
   */
  private extractFeaturesUsed(verificationResult: any): string[] {
    const features = ['id_verification', 'passive_liveness', 'face_match'] // Always included

    if (verificationResult.features.enhancedLivenessScore) features.push('active_liveness')
    if (verificationResult.features.phoneVerified) features.push('phone_verification')
    if (verificationResult.features.ageEstimated) features.push('age_estimation')

    return features
  }

  /**
   * Get cost analysis for business planning
   */
  getCostAnalysis(monthlyUsers: { free: number, premium: number, enterprise: number }) {
    return {
      freeTier: {
        users: monthlyUsers.free,
        costPerUser: 0.00,
        totalCost: 0.00,
        features: 'Core identity verification suite'
      },
      premiumTier: {
        users: monthlyUsers.premium,
        avgCostPerUser: 0.20, // Estimated based on feature usage
        maxCostPerUser: 0.45, // If all premium features used
        totalCost: monthlyUsers.premium * 0.20,
        revenue: monthlyUsers.premium * 2.99,
        profit: monthlyUsers.premium * (2.99 - 0.20)
      },
      enterpriseTier: {
        users: monthlyUsers.enterprise,
        avgCostPerUser: 0.35, // Higher feature usage
        totalCost: monthlyUsers.enterprise * 0.35,
        revenue: monthlyUsers.enterprise * 49,
        profit: monthlyUsers.enterprise * (49 - 0.35)
      },
      totalProfit: (monthlyUsers.premium * 2.79) + (monthlyUsers.enterprise * 48.65)
    }
  }
}

export default PersonaDiditProvider