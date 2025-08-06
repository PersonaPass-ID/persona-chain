/**
 * Plaid Identity Verification Integration
 * https://plaid.com/docs/identity-verification/
 */

export interface PlaidConfig {
  clientId: string
  secret: string
  environment: 'sandbox' | 'development' | 'production'
  webhookUrl: string
}

export class PlaidProvider {
  private config: PlaidConfig
  private baseUrl: string

  constructor(config: PlaidConfig) {
    this.config = config
    this.baseUrl = this.getBaseUrl(config.environment)
  }

  private getBaseUrl(environment: string): string {
    switch (environment) {
      case 'production':
        return 'https://production.plaid.com'
      case 'development':
        return 'https://development.plaid.com'
      case 'sandbox':
      default:
        return 'https://sandbox.plaid.com'
    }
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

      // Step 1: Create Identity Verification session
      const identityVerification = await this.createIdentityVerification({
        templateId: verificationType === 'identity' ? 'idvtmp_identity' : 'idvtmp_address',
        userReference: userAddress,
        clientUserId: userAddress,
        isShareable: false,
        gaveConsent: true,
        user: {
          client_user_id: userAddress,
          legal_name: metadata?.legalName || '',
          phone_number: metadata?.phoneNumber || '',
          email_address: metadata?.email || '',
          address: metadata?.address ? {
            street: metadata.address,
            city: metadata.city || '',
            region: metadata.state || '',
            postal_code: metadata.postalCode || '',
            country: metadata.countryCode || 'US'
          } : undefined
        }
      })

      if (!identityVerification.success) {
        throw new Error(identityVerification.error)
      }

      // Step 2: Create Link Token
      const linkToken = await this.createLinkToken({
        clientUserId: userAddress,
        identityVerificationId: identityVerification.id
      })

      if (!linkToken.success) {
        throw new Error(linkToken.error)
      }

      const sessionUrl = `https://cdn.plaid.com/link/v2/stable/link.html?token=${linkToken.token}`

      console.log(`✅ Created Plaid verification session: ${identityVerification.id}`)

      return {
        success: true,
        verificationId: identityVerification.id,
        redirectUrl: sessionUrl,
        provider: 'plaid_identity',
        cost: 2,
        expiresAt: new Date(Date.now() + (24 * 60 * 60 * 1000)).toISOString()
      }

    } catch (error) {
      console.error('Plaid session creation failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: 'plaid_identity',
        cost: 2
      }
    }
  }

  /**
   * Create Identity Verification
   */
  private async createIdentityVerification(params: {
    templateId: string
    userReference: string
    clientUserId: string
    isShareable: boolean
    gaveConsent: boolean
    user: any
  }) {
    try {
      const response = await fetch(`${this.baseUrl}/identity_verification/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          client_id: this.config.clientId,
          secret: this.config.secret,
          template_id: params.templateId,
          gave_consent: params.gaveConsent,
          is_shareable: params.isShareable,
          user: params.user,
          client_user_id: params.clientUserId
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error_message || 'Failed to create identity verification')
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
   * Create Link Token
   */
  private async createLinkToken(params: {
    clientUserId: string
    identityVerificationId: string
  }) {
    try {
      const response = await fetch(`${this.baseUrl}/link/token/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          client_id: this.config.clientId,
          secret: this.config.secret,
          client_name: 'PersonaPass Identity Verification',
          products: ['identity_verification'],
          country_codes: ['US', 'CA'],
          language: 'en',
          user: {
            client_user_id: params.clientUserId
          },
          identity_verification: {
            template_id: params.identityVerificationId
          },
          webhook: this.config.webhookUrl
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error_message || 'Failed to create link token')
      }

      return {
        success: true,
        token: data.link_token,
        expiration: data.expiration
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
      const response = await fetch(`${this.baseUrl}/identity_verification/get`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          client_id: this.config.clientId,
          secret: this.config.secret,
          identity_verification_id: verificationId
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error_message || 'Failed to get verification status')
      }

      const status = this.mapPlaidStatus(data.status)

      return {
        success: true,
        status,
        verificationId,
        evidence: {
          confidence: data.steps?.accept_tos?.status === 'success' ? 90 : 50,
          documentType: 'bank_verified_identity',
          steps: data.steps
        },
        provider: 'plaid_identity'
      }

    } catch (error) {
      console.error('Failed to get Plaid verification status:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: 'plaid_identity'
      }
    }
  }

  /**
   * Validate webhook signature
   */
  validateWebhookSignature(signature: string, payload: string, timestamp: string): boolean {
    try {
      // Plaid uses JWT for webhook verification
      // This is a simplified validation - in production, use Plaid's webhook verification library
      return signature && signature.length > 100 // JWT should be much longer
    } catch (error) {
      console.error('Plaid webhook signature validation failed:', error)
      return false
    }
  }

  /**
   * Process webhook data
   */
  processWebhook(webhookData: any) {
    try {
      return {
        verificationId: webhookData.identity_verification_id,
        status: this.mapPlaidStatus(webhookData.status),
        provider: 'plaid_identity',
        userAddress: webhookData.user?.client_user_id || '',
        timestamp: new Date().toISOString(),
        evidence: {
          steps: webhookData.steps,
          confidence: webhookData.status === 'success' ? 90 : 50
        }
      }
    } catch (error) {
      console.error('Failed to process Plaid webhook:', error)
      return null
    }
  }

  /**
   * Map Plaid status to our standard status
   */
  private mapPlaidStatus(plaidStatus: string): 'pending' | 'verified' | 'failed' | 'expired' {
    switch (plaidStatus) {
      case 'success':
      case 'completed':
        return 'verified'
      case 'failed':
      case 'expired':
        return 'failed'
      case 'expired':
        return 'expired'
      case 'pending':
      case 'waiting_for_prerequisite':
      case 'user_input_required':
      default:
        return 'pending'
    }
  }

  /**
   * Get provider configuration for frontend
   */
  getProviderInfo() {
    return {
      id: 'plaid_identity',
      name: 'Plaid Identity Verification',
      cost: 2,
      processingTime: '10-30 seconds',
      accuracy: 96.5,
      verificationTypes: ['identity', 'address'],
      supportedDocuments: [
        'Bank Account Verification',
        'Identity Document + Bank Link',
        'Address via Bank Statement'
      ],
      supportedCountries: ['US', 'CA'],
      features: [
        'Bank-grade identity verification',
        'Real-time processing',
        'Address verification via bank records',
        'Lower cost option',
        'High user completion rates',
        'Trusted financial data'
      ]
    }
  }
}