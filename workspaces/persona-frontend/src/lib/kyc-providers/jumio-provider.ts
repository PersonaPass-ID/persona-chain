/**
 * Jumio Identity Verification Integration
 * https://github.com/Jumio/implementation-guides
 */

export interface JumioConfig {
  apiToken: string
  apiSecret: string
  baseUrl: string
  webhookSecret: string
  environment: 'sandbox' | 'production'
}

export class JumioProvider {
  private config: JumioConfig

  constructor(config: JumioConfig) {
    this.config = config
  }

  /**
   * Create verification session
   */
  async createVerificationSession(params: {
    userAddress: string
    verificationType: 'identity' | 'address'
    metadata?: any
  }) {
    try {
      const { userAddress, verificationType, metadata } = params

      // Jumio workflow configuration
      const workflowId = verificationType === 'identity' 
        ? 'id_verification_workflow'
        : 'address_verification_workflow'

      const payload = {
        customerInternalReference: userAddress,
        workflowDefinition: {
          key: workflowId,
          credentials: [{
            category: verificationType === 'identity' ? 'ID' : 'PROOF_OF_ADDRESS',
            types: {
              allowedChannels: ['WEB'],
              allowedDocuments: verificationType === 'identity' 
                ? ['DRIVING_LICENSE', 'PASSPORT', 'IDENTITY_CARD']
                : ['UTILITY_BILL', 'BANK_STATEMENT', 'TAX_RETURN']
            }
          }]
        },
        callbackUrl: `${process.env.NEXTAUTH_URL}/api/kyc/webhook/jumio`,
        userReference: userAddress,
        tokenLifetimeInMinutes: 1440 // 24 hours
      }

      const authHeader = Buffer.from(`${this.config.apiToken}:${this.config.apiSecret}`).toString('base64')

      const response = await fetch(`${this.config.baseUrl}/api/v4/initiate`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authHeader}`,
          'Content-Type': 'application/json',
          'User-Agent': 'PersonaPass KYC Integration'
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to create Jumio verification')
      }

      console.log(`✅ Created Jumio verification session: ${data.transactionReference}`)

      return {
        success: true,
        verificationId: data.transactionReference,
        redirectUrl: data.redirectUrl,
        provider: 'jumio',
        cost: 3,
        expiresAt: new Date(Date.now() + (24 * 60 * 60 * 1000)).toISOString()
      }

    } catch (error) {
      console.error('Jumio session creation failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: 'jumio',
        cost: 3
      }
    }
  }

  /**
   * Get verification status
   */
  async getVerificationStatus(verificationId: string) {
    try {
      const authHeader = Buffer.from(`${this.config.apiToken}:${this.config.apiSecret}`).toString('base64')

      const response = await fetch(`${this.config.baseUrl}/api/v4/accounts/${verificationId}`, {
        headers: {
          'Authorization': `Basic ${authHeader}`,
          'User-Agent': 'PersonaPass KYC Integration'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to get verification status')
      }

      const status = this.mapJumioStatus(data.status)

      return {
        success: true,
        status,
        verificationId,
        evidence: {
          documentType: data.document?.type,
          countryCode: data.document?.issuingCountry,
          confidence: data.verification?.similarity,
          riskScore: data.risk?.score
        },
        provider: 'jumio'
      }

    } catch (error) {
      console.error('Failed to get Jumio verification status:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: 'jumio'
      }
    }
  }

  /**
   * Validate webhook signature
   */
  validateWebhookSignature(signature: string, payload: string, timestamp: string): boolean {
    try {
      // Jumio uses HMAC SHA256 for webhook signatures
      const crypto = require('crypto')
      const expectedSignature = crypto
        .createHmac('sha256', this.config.webhookSecret)
        .update(payload)
        .digest('hex')
      
      return signature === expectedSignature
    } catch (error) {
      console.error('Jumio webhook signature validation failed:', error)
      return false
    }
  }

  /**
   * Process webhook data
   */
  processWebhook(webhookData: any) {
    try {
      return {
        verificationId: webhookData.transactionReference,
        status: this.mapJumioStatus(webhookData.status),
        provider: 'jumio',
        userAddress: webhookData.customerInternalReference,
        timestamp: webhookData.timestamp,
        evidence: {
          documentType: webhookData.document?.type,
          countryCode: webhookData.document?.issuingCountry,
          confidence: webhookData.verification?.similarity,
          riskScore: webhookData.risk?.score
        }
      }
    } catch (error) {
      console.error('Failed to process Jumio webhook:', error)
      return null
    }
  }

  /**
   * Map Jumio status to our standard status
   */
  private mapJumioStatus(jumioStatus: string): 'pending' | 'verified' | 'failed' | 'expired' {
    switch (jumioStatus) {
      case 'PASSED':
      case 'DONE':
        return 'verified'
      case 'REJECTED':
      case 'DENIED':
      case 'ERROR':
        return 'failed'
      case 'EXPIRED':
        return 'expired'
      case 'INITIATED':
      case 'UPLOADED':
      case 'PROCESSING':
      default:
        return 'pending'
    }
  }

  /**
   * Get provider configuration for frontend
   */
  getProviderInfo() {
    return {
      id: 'jumio',
      name: 'Jumio KYC Suite',
      cost: 3,
      processingTime: '1-3 minutes',
      accuracy: 99.2,
      verificationTypes: ['identity', 'address'],
      supportedDocuments: [
        'Driver\'s License',
        'Passport',
        'National ID Card',
        'Utility Bill',
        'Bank Statement',
        'Tax Return'
      ],
      supportedCountries: ['Global coverage - 200+ countries'],
      features: [
        'AI-powered verification',
        'Liveness detection',
        'Document authentication',
        'Real-time processing',
        'Global document support',
        'Fraud prevention'
      ]
    }
  }
}