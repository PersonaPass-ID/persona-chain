/**
 * Sumsub KYC Provider
 * Web3-optimized KYC with 500 free verifications/month + startup-friendly pricing
 * Primary provider for PersonaPass replacing expensive multi-provider setup
 */

import crypto from 'crypto'

export interface SumsubConfig {
  appToken: string
  secretKey: string
  environment: 'sandbox' | 'production'
  webhookSecret?: string
}

export interface SumsubVerificationRequest {
  externalUserId: string
  levelName?: string
  metadata?: {
    firstName?: string
    lastName?: string
    email?: string
    phoneNumber?: string
    address?: string
    city?: string
    state?: string
    postalCode?: string
    countryCode?: string
  }
}

export interface SumsubVerificationResponse {
  success: boolean
  verificationId: string
  redirectUrl?: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  expiresAt?: string
  error?: string
}

export class SumsubProvider {
  private config: SumsubConfig
  private baseUrl: string

  constructor(config: SumsubConfig) {
    this.config = config
    this.baseUrl = config.environment === 'production' 
      ? 'https://api.sumsub.com' 
      : 'https://api.sandbox.sumsub.com'
  }

  /**
   * Get provider information
   */
  getProviderInfo() {
    return {
      id: 'sumsub',
      name: 'Sumsub',
      description: 'Web3-optimized KYC with crypto compliance and startup-friendly pricing',
      cost: 1.35, // USD per verification (startup pricing)
      processingTime: '30 seconds - 2 minutes',
      accuracy: '99%+',
      verificationTypes: ['identity', 'address', 'phone', 'email'],
      countries: ['Global coverage - 220+ countries'],
      documents: ['Passport', 'Driver\'s License', 'National ID Card', 'Utility Bill', 'Bank Statement'],
      features: [
        'Web3 & Crypto Compliance',
        'Travel Rule Support',
        '500 Free Verifications/Month',
        'Real-time Verification',
        'AML Screening (1000+ lists)',
        'Mobile SDKs',
        'Webhook Support',
        'Anti-fraud Protection'
      ],
      freeTier: {
        enabled: true,
        monthlyLimit: 500,
        description: 'Perfect for beta testing and small startups'
      }
    }
  }

  /**
   * Create verification session
   */
  async createVerificationSession(params: SumsubVerificationRequest): Promise<SumsubVerificationResponse> {
    try {
      const endpoint = '/resources/applicants'
      const method = 'POST'
      
      // Prepare request body
      const requestBody = {
        externalUserId: params.externalUserId,
        info: {
          firstName: params.metadata?.firstName || '',
          lastName: params.metadata?.lastName || '',
          email: params.metadata?.email || '',
          phone: params.metadata?.phoneNumber || '',
          country: params.metadata?.countryCode || 'US'
        }
      }

      // Create request signature
      const timestamp = Math.floor(Date.now() / 1000)
      const signature = this.createSignature(method, endpoint, JSON.stringify(requestBody), timestamp)
      
      const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-App-Token': this.config.appToken,
        'X-App-Access-Sig': signature,
        'X-App-Access-Ts': timestamp.toString()
      }

      console.log(`🔐 Creating Sumsub verification for user: ${params.externalUserId}`)

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers,
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Sumsub API error: ${response.status} - ${errorData.description || 'Unknown error'}`)
      }

      const data = await response.json()

      // Create access token for user verification flow
      const accessToken = await this.createAccessToken(data.id, params.levelName || 'basic-kyc-level')

      console.log(`✅ Sumsub verification created: ${data.id}`)

      return {
        success: true,
        verificationId: data.id,
        redirectUrl: `${this.baseUrl}/websdk/build/sumsub-kyc.html?accessToken=${accessToken}`,
        status: 'pending',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      }

    } catch (error) {
      console.error('Sumsub verification creation failed:', error)
      
      return {
        success: false,
        verificationId: '',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Create access token for verification flow
   */
  private async createAccessToken(applicantId: string, levelName: string): Promise<string> {
    const endpoint = `/resources/accessTokens?userId=${applicantId}&levelName=${levelName}`
    const method = 'POST'
    const timestamp = Math.floor(Date.now() / 1000)
    const signature = this.createSignature(method, endpoint, '', timestamp)

    const headers = {
      'Accept': 'application/json',
      'X-App-Token': this.config.appToken,
      'X-App-Access-Sig': signature,
      'X-App-Access-Ts': timestamp.toString()
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers
    })

    if (!response.ok) {
      throw new Error(`Failed to create access token: ${response.status}`)
    }

    const data = await response.json()
    return data.token
  }

  /**
   * Get verification status
   */
  async getVerificationStatus(verificationId: string) {
    try {
      const endpoint = `/resources/applicants/${verificationId}/one`
      const method = 'GET'
      const timestamp = Math.floor(Date.now() / 1000)
      const signature = this.createSignature(method, endpoint, '', timestamp)

      const headers = {
        'Accept': 'application/json',
        'X-App-Token': this.config.appToken,
        'X-App-Access-Sig': signature,
        'X-App-Access-Ts': timestamp.toString()
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers
      })

      if (!response.ok) {
        throw new Error(`Failed to get status: ${response.status}`)
      }

      const data = await response.json()

      // Map Sumsub status to PersonaPass status
      const statusMap: Record<string, 'pending' | 'processing' | 'completed' | 'failed'> = {
        'init': 'pending',
        'pending': 'processing', 
        'queued': 'processing',
        'processing': 'processing',
        'completed': 'completed',
        'onHold': 'processing',
        'approved': 'completed',
        'rejected': 'failed',
        'cancelled': 'failed'
      }

      return {
        status: statusMap[data.inspectionResult?.reviewStatus] || 'pending',
        reviewResult: data.inspectionResult?.reviewResult,
        createdAt: data.createdAt,
        reviewDate: data.inspectionResult?.createdAt,
        rejectLabels: data.inspectionResult?.rejectLabels || [],
        moderationComment: data.inspectionResult?.moderationComment
      }

    } catch (error) {
      console.error('Failed to get Sumsub verification status:', error)
      throw error
    }
  }

  /**
   * Process webhook from Sumsub
   */
  processWebhook(webhookData: any) {
    try {
      const { type, applicantId, inspectionId, reviewStatus, reviewResult } = webhookData

      console.log(`📨 Sumsub webhook received: ${type} for applicant ${applicantId}`)

      // Map webhook data to PersonaPass format
      return {
        provider: 'sumsub',
        verificationId: applicantId,
        inspectionId,
        event: type,
        status: this.mapWebhookStatus(reviewStatus),
        result: reviewResult,
        timestamp: new Date().toISOString(),
        rawData: webhookData
      }

    } catch (error) {
      console.error('Failed to process Sumsub webhook:', error)
      throw error
    }
  }

  /**
   * Validate webhook signature
   */
  validateWebhookSignature(signature: string, payload: string, timestamp?: string): boolean {
    try {
      if (!this.config.webhookSecret) {
        console.warn('⚠️ Sumsub webhook secret not configured - skipping signature validation')
        return true // Allow webhook if no secret configured (development mode)
      }

      // Sumsub uses HMAC-SHA256 for webhook signatures
      const expectedSignature = crypto
        .createHmac('sha256', this.config.webhookSecret)
        .update(payload)
        .digest('hex')

      return signature === expectedSignature

    } catch (error) {
      console.error('Sumsub webhook signature validation failed:', error)
      return false
    }
  }

  /**
   * Create API signature for requests
   */
  private createSignature(method: string, endpoint: string, body: string, timestamp: number): string {
    const message = timestamp + method.toUpperCase() + endpoint + body
    return crypto
      .createHmac('sha256', this.config.secretKey)
      .update(message)
      .digest('hex')
  }

  /**
   * Map Sumsub webhook status to PersonaPass status
   */
  private mapWebhookStatus(reviewStatus: string): 'pending' | 'processing' | 'completed' | 'failed' {
    const statusMap: Record<string, 'pending' | 'processing' | 'completed' | 'failed'> = {
      'init': 'pending',
      'pending': 'processing',
      'prechecked': 'processing',
      'queued': 'processing', 
      'processing': 'processing',
      'completed': 'completed',
      'onHold': 'processing',
      'approved': 'completed',
      'rejected': 'failed',
      'cancelled': 'failed'
    }

    return statusMap[reviewStatus] || 'pending'
  }

  /**
   * Get pricing information
   */
  getPricing() {
    return {
      provider: 'sumsub',
      freeTier: {
        enabled: true,
        monthlyVerifications: 500,
        cost: 0
      },
      paidTier: {
        startupPricing: 1.35, // USD per verification
        standardPricing: 2.00, // USD per verification
        enterprisePricing: 'Custom pricing for high volumes'
      },
      features: [
        '500 free verifications per month',
        'Web3 & crypto compliance built-in',
        'Travel Rule support',
        'AML screening (1000+ sanctions lists)',
        'Real-time verification (30-60 seconds)',
        '99%+ accuracy rate',
        'Global coverage (220+ countries)',
        'Mobile SDKs & Web SDK',
        'Comprehensive API documentation',
        'Webhook support for real-time updates'
      ],
      costComparison: {
        currentPersonaPassSetup: 3.50, // Average of Persona $5 + Jumio $3 + Onfido $4 + Plaid $2
        sumsubCost: 1.35,
        savingsPerVerification: 2.15,
        savingsPercent: '61%'
      }
    }
  }

  /**
   * Get supported countries
   */
  getSupportedCountries() {
    return [
      'Global coverage - 220+ countries and territories',
      'Comprehensive document support for all major economies',
      'Specialized crypto/Web3 compliance for regulated jurisdictions',
      'Real-time verification in multiple languages',
      'Travel Rule compliance for crypto exchanges'
    ]
  }
}

export default SumsubProvider