/**
 * Didit KYC Provider - FREE TIER
 * Zero-cost KYC verification for PersonaPass with unlimited usage
 * Perfect for generating ZK proofs without storing personal data
 */

import crypto from 'crypto'

export interface DiditConfig {
  apiKey: string
  environment: 'sandbox' | 'production'
  webhookSecret?: string
}

export interface DiditVerificationRequest {
  externalUserId: string
  verificationTypes?: string[] // ['document', 'face_match', 'liveness']
  metadata?: {
    firstName?: string
    lastName?: string
    email?: string
    countryCode?: string
  }
}

export interface DiditVerificationResponse {
  success: boolean
  verificationId: string
  verificationUrl?: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  expiresAt?: string
  error?: string
}

export class DiditProvider {
  private config: DiditConfig
  private baseUrl: string

  constructor(config: DiditConfig) {
    this.config = config
    this.baseUrl = config.environment === 'production' 
      ? 'https://api.didit.me/v1' 
      : 'https://api-sandbox.didit.me/v1'
  }

  /**
   * Get provider information
   */
  getProviderInfo() {
    return {
      id: 'didit',
      name: 'Didit',
      description: 'FREE unlimited KYC verification with 30-second processing',
      cost: 0, // FREE FOREVER
      processingTime: '30 seconds average',
      accuracy: '99%+',
      verificationTypes: ['identity', 'document', 'face_match', 'liveness', 'nfc'],
      countries: ['Global coverage - 200+ countries'],
      documents: ['3000+ document types supported'],
      features: [
        'FREE UNLIMITED KYC FOREVER',
        'No trial periods or caps',
        'Document + NFC verification',
        'Passive liveness detection',
        'Face match 1:1',
        'IP geolocation analysis',
        'GDPR & ISO 27001 compliant',
        'Perfect for ZK proof generation',
        '30-second verification time',
        'Real-time API and webhooks'
      ],
      freeTier: {
        enabled: true,
        monthlyLimit: 999999999, // Unlimited
        description: 'Core KYC completely free forever - no asterisks!'
      }
    }
  }

  /**
   * Create verification session
   */
  async createVerificationSession(params: DiditVerificationRequest): Promise<DiditVerificationResponse> {
    try {
      const endpoint = '/verifications'
      
      // Prepare request body
      const requestBody = {
        external_user_id: params.externalUserId,
        verification_types: params.verificationTypes || ['document', 'face_match', 'liveness'],
        user_info: {
          first_name: params.metadata?.firstName || '',
          last_name: params.metadata?.lastName || '',
          email: params.metadata?.email || '',
          country_code: params.metadata?.countryCode || 'US'
        },
        webhook_url: `${process.env.NEXTAUTH_URL}/api/kyc/webhook/didit`,
        return_url: `${process.env.NEXTAUTH_URL}/dashboard?tab=kyc&status=completed`
      }

      const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
        'X-API-Version': '2025-01'
      }

      console.log(`🆓 Creating FREE Didit verification for user: ${params.externalUserId}`)

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Didit API error: ${response.status} - ${errorData.message || 'Unknown error'}`)
      }

      const data = await response.json()

      console.log(`✅ FREE Didit verification created: ${data.verification_id}`)

      return {
        success: true,
        verificationId: data.verification_id,
        verificationUrl: data.verification_url,
        status: 'pending',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      }

    } catch (error) {
      console.error('Didit verification creation failed:', error)
      
      return {
        success: false,
        verificationId: '',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Get verification status
   */
  async getVerificationStatus(verificationId: string) {
    try {
      const endpoint = `/verifications/${verificationId}`
      
      const headers = {
        'Accept': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
        'X-API-Version': '2025-01'
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        headers
      })

      if (!response.ok) {
        throw new Error(`Failed to get status: ${response.status}`)
      }

      const data = await response.json()

      // Map Didit status to PersonaPass status
      const statusMap: Record<string, 'pending' | 'processing' | 'completed' | 'failed'> = {
        'pending': 'pending',
        'processing': 'processing',
        'in_progress': 'processing',
        'completed': 'completed',
        'approved': 'completed',
        'passed': 'completed',
        'failed': 'failed',
        'rejected': 'failed',
        'expired': 'failed'
      }

      return {
        status: statusMap[data.status] || 'pending',
        result: data.result,
        createdAt: data.created_at,
        completedAt: data.completed_at,
        checks: data.checks || [],
        documentType: data.document_type,
        country: data.country
      }

    } catch (error) {
      console.error('Failed to get Didit verification status:', error)
      throw error
    }
  }

  /**
   * Process webhook from Didit
   */
  processWebhook(webhookData: any) {
    try {
      const { event_type, verification_id, status, result, user_id } = webhookData

      console.log(`📨 Didit FREE webhook received: ${event_type} for verification ${verification_id}`)

      return {
        provider: 'didit',
        verificationId: verification_id,
        userId: user_id,
        event: event_type,
        status: this.mapWebhookStatus(status),
        result: result,
        timestamp: new Date().toISOString(),
        rawData: webhookData,
        readyForZkProof: status === 'completed' && result === 'passed'
      }

    } catch (error) {
      console.error('Failed to process Didit webhook:', error)
      throw error
    }
  }

  /**
   * Validate webhook signature
   */
  validateWebhookSignature(signature: string, payload: string, timestamp?: string): boolean {
    try {
      if (!this.config.webhookSecret) {
        console.warn('⚠️ Didit webhook secret not configured - skipping signature validation')
        return true // Allow webhook if no secret configured (development mode)
      }

      // Didit uses HMAC-SHA256 for webhook signatures
      const expectedSignature = crypto
        .createHmac('sha256', this.config.webhookSecret)
        .update(payload)
        .digest('hex')

      return signature === expectedSignature

    } catch (error) {
      console.error('Didit webhook signature validation failed:', error)
      return false
    }
  }

  /**
   * Map Didit webhook status to PersonaPass status
   */
  private mapWebhookStatus(status: string): 'pending' | 'processing' | 'completed' | 'failed' {
    const statusMap: Record<string, 'pending' | 'processing' | 'completed' | 'failed'> = {
      'pending': 'pending',
      'processing': 'processing',
      'in_progress': 'processing',
      'completed': 'completed',
      'approved': 'completed',
      'passed': 'completed',
      'failed': 'failed',
      'rejected': 'failed',
      'expired': 'failed'
    }

    return statusMap[status] || 'pending'
  }

  /**
   * Generate ZK proof data for PersonaPass DID
   * This creates a privacy-preserving proof that user completed KYC
   */
  generateZkProofData(verificationResult: any) {
    try {
      // Create hash of verification without storing personal data
      const proofData = {
        provider: 'didit',
        verificationId: verificationResult.verificationId,
        timestamp: new Date().toISOString(),
        proofType: 'human_verification',
        checks_passed: verificationResult.checks?.filter((check: any) => check.status === 'passed') || [],
        document_verified: verificationResult.checks?.some((check: any) => 
          check.type === 'document' && check.status === 'passed'
        ) || false,
        liveness_verified: verificationResult.checks?.some((check: any) => 
          check.type === 'liveness' && check.status === 'passed'
        ) || false,
        face_match_verified: verificationResult.checks?.some((check: any) => 
          check.type === 'face_match' && check.status === 'passed'
        ) || false
      }

      // Generate cryptographic proof (hash) without personal data
      const zkProofHash = crypto
        .createHash('sha256')
        .update(JSON.stringify(proofData))
        .digest('hex')

      return {
        zkProofHash,
        proofType: 'didit_human_verification',
        timestamp: proofData.timestamp,
        verificationLevel: 'basic_kyc',
        eligibleForTokens: true, // User gets 100 free ID tokens monthly
        reusable: true // Proof can be used across services
      }

    } catch (error) {
      console.error('Failed to generate ZK proof data:', error)
      throw error
    }
  }

  /**
   * Get pricing information
   */
  getPricing() {
    return {
      provider: 'didit',
      freeTier: {
        enabled: true,
        unlimited: true,
        cost: 0,
        description: 'Core KYC completely FREE forever'
      },
      paidTier: {
        amlScreening: 0.30, // $0.30 per AML check
        advancedBiometrics: 0.15, // $0.15 per advanced check
        description: 'Optional premium features only'
      },
      features: [
        '✅ UNLIMITED free KYC verifications',
        '✅ Document + NFC verification',
        '✅ Passive liveness detection',
        '✅ Face match verification',
        '✅ IP geolocation analysis', 
        '✅ 30-second processing time',
        '✅ GDPR & ISO 27001 compliant',
        '✅ Perfect for ZK proof generation',
        '✅ No trial periods or caps',
        '✅ Real-time webhooks'
      ],
      costComparison: {
        currentPersonaPassSetup: 3.50, // Previous average
        diditCost: 0.00, // FREE
        savingsPerVerification: 3.50,
        savingsPercent: '100%'
      }
    }
  }

  /**
   * Get supported countries and documents
   */
  getSupportedCapabilities() {
    return {
      countries: [
        'Global coverage - 200+ countries and territories',
        'United States - Full support',
        'Europe - GDPR compliant',
        'Asia Pacific - Comprehensive coverage',
        'Latin America - Extensive support'
      ],
      documents: [
        '3000+ document types supported',
        'Government-issued IDs',
        'Passports (all countries)',
        'Driver\'s licenses',
        'National ID cards',
        'NFC-enabled documents'
      ],
      verificationTypes: [
        'Document verification',
        'NFC chip reading',
        'Passive liveness detection',
        'Face match 1:1',
        'IP geolocation analysis'
      ]
    }
  }
}

export default DiditProvider