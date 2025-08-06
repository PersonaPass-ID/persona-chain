/**
 * Onfido Identity Verification Integration
 * https://documentation.onfido.com/
 */

export interface OnfidoConfig {
  apiToken: string
  webhookToken: string
  baseUrl: string
  environment: 'sandbox' | 'live'
}

export class OnfidoProvider {
  private config: OnfidoConfig
  private baseUrl: string

  constructor(config: OnfidoConfig) {
    this.config = config
    this.baseUrl = config.environment === 'live' 
      ? 'https://api.eu.onfido.com/v3.6'
      : 'https://api.eu.onfido.com/v3.6' // Onfido uses same URL with different API keys
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

      // Step 1: Create applicant
      const applicant = await this.createApplicant({
        firstName: metadata?.firstName || 'User',
        lastName: metadata?.lastName || userAddress.substring(0, 8),
        email: metadata?.email,
        address: metadata?.address
      })

      if (!applicant.success) {
        throw new Error(applicant.error)
      }

      // Step 2: Create SDK token
      const sdkToken = await this.createSDKToken(applicant.id, userAddress)

      if (!sdkToken.success) {
        throw new Error(sdkToken.error)
      }

      // Step 3: Create check
      const check = await this.createCheck(applicant.id, verificationType)

      const sessionUrl = `https://sdk.onfido.com/v1?token=${sdkToken.token}&steps=${verificationType === 'identity' ? 'document,face' : 'address'}`

      console.log(`✅ Created Onfido verification session for applicant: ${applicant.id}`)

      return {
        success: true,
        verificationId: applicant.id,
        redirectUrl: sessionUrl,
        provider: 'onfido',
        cost: 4,
        checkId: check.id,
        expiresAt: new Date(Date.now() + (24 * 60 * 60 * 1000)).toISOString()
      }

    } catch (error) {
      console.error('Onfido session creation failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: 'onfido',
        cost: 4
      }
    }
  }

  /**
   * Create applicant
   */
  private async createApplicant(params: {
    firstName: string
    lastName: string
    email?: string
    address?: string
  }) {
    try {
      const response = await fetch(`${this.baseUrl}/applicants`, {
        method: 'POST',
        headers: {
          'Authorization': `Token token=${this.config.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          first_name: params.firstName,
          last_name: params.lastName,
          email: params.email,
          address: params.address ? {
            flat_number: '',
            building_name: '',
            building_number: '',
            street: params.address,
            sub_street: '',
            town: '',
            state: '',
            postcode: '',
            country: 'USA'
          } : undefined
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to create applicant')
      }

      return {
        success: true,
        id: data.id,
        href: data.href
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Create SDK token
   */
  private async createSDKToken(applicantId: string, userReference: string) {
    try {
      const response = await fetch(`${this.baseUrl}/sdk_token`, {
        method: 'POST',
        headers: {
          'Authorization': `Token token=${this.config.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          applicant_id: applicantId,
          referrer: process.env.NEXTAUTH_URL || 'https://personapass.xyz',
          application_id: 'personapass-kyc'
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to create SDK token')
      }

      return {
        success: true,
        token: data.token
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Create check
   */
  private async createCheck(applicantId: string, verificationType: 'identity' | 'address') {
    try {
      const reportNames = verificationType === 'identity' 
        ? ['document', 'facial_similarity_photo']
        : ['proof_of_address']

      const response = await fetch(`${this.baseUrl}/checks`, {
        method: 'POST',
        headers: {
          'Authorization': `Token token=${this.config.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          applicant_id: applicantId,
          report_names: reportNames,
          tags: ['personapass-kyc'],
          suppress_form_emails: true
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to create check')
      }

      return {
        success: true,
        id: data.id,
        status: data.status
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get verification status
   */
  async getVerificationStatus(verificationId: string) {
    try {
      const response = await fetch(`${this.baseUrl}/applicants/${verificationId}`, {
        headers: {
          'Authorization': `Token token=${this.config.apiToken}`
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to get applicant status')
      }

      // Get latest check for this applicant
      const checksResponse = await fetch(`${this.baseUrl}/checks?applicant_id=${verificationId}`, {
        headers: {
          'Authorization': `Token token=${this.config.apiToken}`
        }
      })

      const checksData = await checksResponse.json()
      const latestCheck = checksData.checks?.[0]

      const status = this.mapOnfidoStatus(latestCheck?.status || 'in_progress')

      return {
        success: true,
        status,
        verificationId,
        evidence: {
          checkId: latestCheck?.id,
          confidence: latestCheck?.result === 'clear' ? 95 : 60,
          documentType: latestCheck?.report_names?.includes('document') ? 'government_id' : 'proof_of_address'
        },
        provider: 'onfido'
      }

    } catch (error) {
      console.error('Failed to get Onfido verification status:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: 'onfido'
      }
    }
  }

  /**
   * Validate webhook signature
   */
  validateWebhookSignature(signature: string, payload: string, timestamp?: string): boolean {
    try {
      // Onfido uses HMAC SHA256 for webhook signatures
      const crypto = require('crypto')
      const expectedSignature = crypto
        .createHmac('sha256', this.config.webhookToken)
        .update(payload)
        .digest('hex')
      
      return signature === expectedSignature
    } catch (error) {
      console.error('Onfido webhook signature validation failed:', error)
      return false
    }
  }

  /**
   * Process webhook data
   */
  processWebhook(webhookData: any) {
    try {
      const resource = webhookData.payload.resource
      
      return {
        verificationId: webhookData.payload.object.applicant_id,
        status: this.mapOnfidoStatus(resource.status),
        provider: 'onfido',
        userAddress: '', // Need to lookup from applicant ID
        timestamp: new Date().toISOString(),
        evidence: {
          checkId: resource.id,
          result: resource.result,
          confidence: resource.result === 'clear' ? 95 : 60
        }
      }
    } catch (error) {
      console.error('Failed to process Onfido webhook:', error)
      return null
    }
  }

  /**
   * Map Onfido status to our standard status
   */
  private mapOnfidoStatus(onfidoStatus: string): 'pending' | 'verified' | 'failed' | 'expired' {
    switch (onfidoStatus) {
      case 'complete':
      case 'clear':
        return 'verified'
      case 'consider':
      case 'unidentified':
        return 'failed'
      case 'cancelled':
        return 'expired'
      case 'in_progress':
      case 'awaiting_applicant':
      case 'awaiting_approval':
      default:
        return 'pending'
    }
  }

  /**
   * Get provider configuration for frontend
   */
  getProviderInfo() {
    return {
      id: 'onfido',
      name: 'Onfido Document Verification',
      cost: 4,
      processingTime: '30 seconds - 2 minutes',
      accuracy: 98.8,
      verificationTypes: ['identity', 'address'],
      supportedDocuments: [
        'Passport',
        'Driver\'s License',
        'National ID Card',
        'Residence Permit',
        'Utility Bill',
        'Bank Statement'
      ],
      supportedCountries: ['195+ countries supported'],
      features: [
        'Real-time document verification',
        'Biometric face verification',
        'Document authenticity checks',
        'Global coverage',
        'AI-powered fraud detection',
        'Mobile-first experience'
      ]
    }
  }
}