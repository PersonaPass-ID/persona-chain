/**
 * Persona Identity Verification Integration
 * https://withpersona.com/docs
 */

export interface PersonaConfig {
  apiKey: string
  apiSecret: string
  templateId: string
  environment: 'sandbox' | 'production'
  webhookSecret: string
}

export class PersonaProvider {
  private config: PersonaConfig
  private baseUrl: string

  constructor(config: PersonaConfig) {
    this.config = config
    this.baseUrl = config.environment === 'production' 
      ? 'https://withpersona.com/api/v1'
      : 'https://sandbox.withpersona.com/api/v1'
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

      const templateId = verificationType === 'identity' 
        ? this.config.templateId 
        : 'itmpl_address_verification'

      const payload = {
        data: {
          type: 'inquiry',
          attributes: {
            'inquiry-template-id': templateId,
            'reference-id': userAddress,
            'account-id': 'account_persona_default',
            'environment': this.config.environment,
            fields: {
              'name-first': metadata?.firstName || '',
              'name-last': metadata?.lastName || '',
              'address-street-1': metadata?.address || '',
              'address-city': metadata?.city || '',
              'address-subdivision': metadata?.state || '',
              'address-country-code': metadata?.countryCode || 'US'
            }
          }
        }
      }

      const response = await fetch(`${this.baseUrl}/inquiries`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          'Persona-Version': '2023-01-05'
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.errors?.[0]?.detail || 'Failed to create Persona inquiry')
      }

      const inquiryId = data.data.id
      const sessionUrl = `https://withpersona.com/verify?inquiry-id=${inquiryId}`

      console.log(`✅ Created Persona verification session: ${inquiryId}`)

      return {
        success: true,
        verificationId: inquiryId,
        redirectUrl: sessionUrl,
        provider: 'persona',
        cost: 5,
        expiresAt: new Date(Date.now() + (24 * 60 * 60 * 1000)).toISOString()
      }

    } catch (error) {
      console.error('Persona session creation failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: 'persona',
        cost: 5
      }
    }
  }

  /**
   * Get verification status
   */
  async getVerificationStatus(verificationId: string) {
    try {
      const response = await fetch(`${this.baseUrl}/inquiries/${verificationId}`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Persona-Version': '2023-01-05'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.errors?.[0]?.detail || 'Failed to get inquiry status')
      }

      const inquiry = data.data
      const status = this.mapPersonaStatus(inquiry.attributes.status)

      return {
        success: true,
        status,
        verificationId,
        evidence: inquiry.attributes,
        provider: 'persona'
      }

    } catch (error) {
      console.error('Failed to get Persona verification status:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: 'persona'
      }
    }
  }

  /**
   * Validate webhook signature
   */
  validateWebhookSignature(signature: string, payload: string, timestamp: string): boolean {
    try {
      // Persona uses HMAC SHA256 for webhook signatures
      const crypto = require('crypto')
      const expectedSignature = crypto
        .createHmac('sha256', this.config.webhookSecret)
        .update(`${timestamp}.${payload}`)
        .digest('hex')
      
      return signature === `v1=${expectedSignature}`
    } catch (error) {
      console.error('Persona webhook signature validation failed:', error)
      return false
    }
  }

  /**
   * Process webhook data
   */
  processWebhook(webhookData: any) {
    try {
      const inquiry = webhookData.data
      const event = webhookData.event
      
      return {
        verificationId: inquiry.id,
        status: this.mapPersonaStatus(inquiry.attributes.status),
        provider: 'persona',
        userAddress: inquiry.attributes['reference-id'],
        timestamp: new Date().toISOString(),
        event,
        evidence: {
          documentType: inquiry.attributes.document?.type,
          countryCode: inquiry.attributes.document?.country,
          confidence: inquiry.attributes.score,
          riskScore: inquiry.attributes['risk-score']
        }
      }
    } catch (error) {
      console.error('Failed to process Persona webhook:', error)
      return null
    }
  }

  /**
   * Map Persona status to our standard status
   */
  private mapPersonaStatus(personaStatus: string): 'pending' | 'verified' | 'failed' | 'expired' {
    switch (personaStatus) {
      case 'completed':
      case 'approved':
        return 'verified'
      case 'declined':
      case 'failed':
        return 'failed'
      case 'expired':
        return 'expired'
      case 'pending':
      case 'created':
      default:
        return 'pending'
    }
  }

  /**
   * Get provider configuration for frontend
   */
  getProviderInfo() {
    return {
      id: 'persona',
      name: 'Persona Identity Verification',
      cost: 5,
      processingTime: '2-5 minutes',
      accuracy: 99.5,
      verificationTypes: ['identity', 'address'],
      supportedDocuments: [
        'Driver\'s License',
        'Passport',
        'National ID Card',
        'Utility Bill',
        'Bank Statement'
      ],
      supportedCountries: ['US', 'CA', 'GB', 'AU', 'EU'],
      features: [
        'Real-time verification',
        'Document + Selfie verification',
        'Address verification',
        'Anti-fraud detection',
        'Global document support'
      ]
    }
  }
}