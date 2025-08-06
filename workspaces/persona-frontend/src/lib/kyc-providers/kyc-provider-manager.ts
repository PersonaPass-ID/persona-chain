/**
 * Multi-Provider KYC Manager
 * Manages multiple KYC providers with failover and load balancing
 */

import { SumsubProvider } from './sumsub-provider'
import { PersonaProvider } from './persona-provider'
import { JumioProvider } from './jumio-provider'
import { OnfidoProvider } from './onfido-provider'
import { PlaidProvider } from './plaid-provider'
import { PlaidKYCProvider } from './plaid-kyc-provider'

export interface KYCProviderConfig {
  enabled: boolean
  priority: number // Lower number = higher priority
  maxConcurrentVerifications: number
  failoverEnabled: boolean
  costMultiplier: number // For pricing adjustments
}

export interface ProviderCapabilities {
  identity: boolean
  address: boolean
  phone: boolean
  email: boolean
  countries: string[]
  documents: string[]
}

export class KYCProviderManager {
  private providers: Map<string, any> = new Map()
  private configs: Map<string, KYCProviderConfig> = new Map()
  private activeVerifications: Map<string, number> = new Map()

  constructor() {
    this.initializeProviders()
  }

  /**
   * Initialize all available providers
   */
  private initializeProviders() {
    // Sumsub Provider (PRIMARY - Web3 optimized with free tier)
    if (process.env.SUMSUB_APP_TOKEN && process.env.SUMSUB_SECRET_KEY) {
      const sumsubProvider = new SumsubProvider({
        appToken: process.env.SUMSUB_APP_TOKEN,
        secretKey: process.env.SUMSUB_SECRET_KEY,
        environment: process.env.SUMSUB_ENVIRONMENT === 'production' ? 'production' : 'sandbox',
        webhookSecret: process.env.SUMSUB_WEBHOOK_SECRET || ''
      })

      this.providers.set('sumsub', sumsubProvider)
      this.configs.set('sumsub', {
        enabled: true,
        priority: 0, // HIGHEST PRIORITY - Primary provider
        maxConcurrentVerifications: 1000,
        failoverEnabled: true,
        costMultiplier: 1.0 // $1.35 per verification (61% cheaper than current setup)
      })
      this.activeVerifications.set('sumsub', 0)

      console.log('✅ Sumsub KYC provider initialized (PRIMARY - Web3 optimized)')
    } else {
      console.log('⚠️ Sumsub KYC provider: Missing environment variables (SUMSUB_APP_TOKEN, SUMSUB_SECRET_KEY)')
    }

    // Persona Provider
    if (process.env.PERSONA_API_KEY && process.env.PERSONA_TEMPLATE_ID) {
      const personaProvider = new PersonaProvider({
        apiKey: process.env.PERSONA_API_KEY,
        apiSecret: process.env.PERSONA_API_SECRET || '',
        templateId: process.env.PERSONA_TEMPLATE_ID,
        environment: process.env.PERSONA_ENVIRONMENT === 'production' ? 'production' : 'sandbox',
        webhookSecret: process.env.PERSONA_WEBHOOK_SECRET || ''
      })

      this.providers.set('persona', personaProvider)
      this.configs.set('persona', {
        enabled: false, // DISABLED - Expensive legacy provider
        priority: 10,
        maxConcurrentVerifications: 100,
        failoverEnabled: true,
        costMultiplier: 3.7 // $5 per verification (270% more expensive than Sumsub)
      })
      this.activeVerifications.set('persona', 0)

      console.log('✅ Persona KYC provider initialized')
    } else {
      console.log('⚠️ Persona KYC provider: Missing environment variables')
    }

    // Jumio Provider
    if (process.env.JUMIO_API_TOKEN && process.env.JUMIO_API_SECRET) {
      const jumioProvider = new JumioProvider({
        apiToken: process.env.JUMIO_API_TOKEN,
        apiSecret: process.env.JUMIO_API_SECRET,
        baseUrl: process.env.JUMIO_ENVIRONMENT === 'production' 
          ? 'https://netverify.com' 
          : 'https://netverify.eu',
        webhookSecret: process.env.JUMIO_WEBHOOK_SECRET || '',
        environment: process.env.JUMIO_ENVIRONMENT === 'production' ? 'production' : 'sandbox'
      })

      this.providers.set('jumio', jumioProvider)
      this.configs.set('jumio', {
        enabled: false, // DISABLED - Expensive legacy provider  
        priority: 11,
        maxConcurrentVerifications: 50,
        failoverEnabled: true,
        costMultiplier: 2.2 // $3 per verification (122% more expensive than Sumsub)
      })
      this.activeVerifications.set('jumio', 0)

      console.log('✅ Jumio KYC provider initialized')
    } else {
      console.log('⚠️ Jumio KYC provider: Missing environment variables')
    }

    // Onfido Provider
    if (process.env.ONFIDO_API_TOKEN) {
      const onfidoProvider = new OnfidoProvider({
        apiToken: process.env.ONFIDO_API_TOKEN,
        webhookToken: process.env.ONFIDO_WEBHOOK_TOKEN || '',
        baseUrl: 'https://api.eu.onfido.com/v3.6',
        environment: process.env.ONFIDO_ENVIRONMENT === 'live' ? 'live' : 'sandbox'
      })

      this.providers.set('onfido', onfidoProvider)
      this.configs.set('onfido', {
        enabled: false, // DISABLED - Expensive legacy provider
        priority: 12,
        maxConcurrentVerifications: 75,
        failoverEnabled: true,
        costMultiplier: 3.0 // $4 per verification (196% more expensive than Sumsub)
      })
      this.activeVerifications.set('onfido', 0)

      console.log('✅ Onfido KYC provider initialized')
    } else {
      console.log('⚠️ Onfido KYC provider: Missing environment variables')
    }

    // Plaid KYC Provider (Enhanced Identity Verification)
    if (process.env.PLAID_CLIENT_ID && process.env.PLAID_SECRET) {
      const plaidKYCProvider = new PlaidKYCProvider({
        clientId: process.env.PLAID_CLIENT_ID,
        secret: process.env.PLAID_SECRET,
        environment: process.env.PLAID_ENVIRONMENT === 'production' 
          ? 'production' 
          : process.env.PLAID_ENVIRONMENT === 'development' 
            ? 'development' 
            : 'sandbox',
        webhookUrl: `${process.env.NEXTAUTH_URL}/api/kyc/webhook/plaid`
      })

      this.providers.set('plaid_kyc', plaidKYCProvider)
      this.configs.set('plaid_kyc', {
        enabled: false, // DISABLED - Not approved yet, user confirmed Sumsub working
        priority: 5, // LOWER PRIORITY - Enable when Plaid approves Identity Verification
        maxConcurrentVerifications: 50,
        failoverEnabled: true,
        costMultiplier: 1.0 // $2 per verification, privacy-compliant
      })
      this.activeVerifications.set('plaid_kyc', 0)

      console.log('✅ Plaid KYC provider initialized (User requested, privacy-compliant)')
    } else {
      console.log('⚠️ Plaid KYC provider: Missing environment variables (PLAID_CLIENT_ID, PLAID_SECRET)')
    }

    // Legacy Plaid Identity Provider (kept for compatibility)
    if (process.env.PLAID_CLIENT_ID && process.env.PLAID_SECRET) {
      const plaidProvider = new PlaidProvider({
        clientId: process.env.PLAID_CLIENT_ID,
        secret: process.env.PLAID_SECRET,
        environment: process.env.PLAID_ENVIRONMENT === 'production' 
          ? 'production' 
          : process.env.PLAID_ENVIRONMENT === 'development' 
            ? 'development' 
            : 'sandbox',
        webhookUrl: `${process.env.NEXTAUTH_URL}/api/kyc/webhook/plaid-legacy`
      })

      this.providers.set('plaid_identity', plaidProvider)
      this.configs.set('plaid_identity', {
        enabled: false, // DISABLED - Legacy provider, replaced by plaid_kyc
        priority: 13,
        maxConcurrentVerifications: 25,
        failoverEnabled: true,
        costMultiplier: 1.5 // $2 per verification (legacy implementation)
      })
      this.activeVerifications.set('plaid_identity', 0)

      console.log('✅ Legacy Plaid Identity provider initialized (disabled by default)')
    } else {
      console.log('⚠️ Legacy Plaid Identity provider: Missing environment variables')
    }

    console.log(`🔐 KYC Provider Manager initialized with ${this.providers.size} providers`)
    
    const enabledProviders = Array.from(this.configs.entries())
      .filter(([_, config]) => config.enabled)
      .map(([id, _]) => id)
    
    console.log(`💰 Active providers: ${enabledProviders.join(', ')} | Legacy providers disabled for cost savings`)
    
    if (enabledProviders.includes('plaid_kyc')) {
      console.log(`🎯 Primary provider: Plaid KYC (User requested, privacy-compliant)`)
    } else {
      console.log(`🎯 Primary provider: Sumsub (61% cost savings vs previous multi-provider setup)`)
    }
  }

  /**
   * Get all available providers with their info
   */
  getAvailableProviders(): any[] {
    const providers = []

    for (const [providerId, provider] of this.providers) {
      const config = this.configs.get(providerId)
      if (config?.enabled) {
        const info = provider.getProviderInfo()
        
        // Apply cost multiplier
        info.cost = Math.round(info.cost * config.costMultiplier)
        info.priority = config.priority
        info.maxConcurrent = config.maxConcurrentVerifications
        info.currentLoad = this.activeVerifications.get(providerId) || 0

        providers.push(info)
      }
    }

    // Sort by priority (lower number = higher priority)
    return providers.sort((a, b) => a.priority - b.priority)
  }

  /**
   * Get recommended provider for a verification type
   */
  getRecommendedProvider(verificationType: 'identity' | 'address', countryCode?: string): string | null {
    const availableProviders = this.getAvailableProviders()

    // Filter providers that support the verification type
    const supportedProviders = availableProviders.filter(provider => {
      const capabilities = this.getProviderCapabilities(provider.id)
      
      // Check if provider supports verification type
      const supportsType = capabilities[verificationType as keyof ProviderCapabilities]
      
      // Check country support if specified
      const supportsCountry = !countryCode || 
        capabilities.countries.includes(countryCode) ||
        capabilities.countries.includes('Global coverage')

      // Check if provider is not at capacity
      const hasCapacity = provider.currentLoad < provider.maxConcurrent

      return supportsType && supportsCountry && hasCapacity
    })

    // Return highest priority provider (lowest priority number)
    return supportedProviders[0]?.id || null
  }

  /**
   * Create verification session with automatic provider selection
   */
  async createVerificationSession(params: {
    userAddress: string
    verificationType: 'identity' | 'address'
    providerId?: string
    metadata?: any
  }) {
    try {
      // Use specified provider or get recommended one
      const providerId = params.providerId || this.getRecommendedProvider(params.verificationType)
      
      if (!providerId) {
        throw new Error('No suitable KYC provider available')
      }

      const provider = this.providers.get(providerId)
      const config = this.configs.get(providerId)

      if (!provider || !config?.enabled) {
        throw new Error(`Provider ${providerId} not available`)
      }

      // Check capacity
      const currentLoad = this.activeVerifications.get(providerId) || 0
      if (currentLoad >= config.maxConcurrentVerifications) {
        // Try failover to next available provider
        if (config.failoverEnabled) {
          const fallbackProviderId = this.getRecommendedProvider(params.verificationType)
          if (fallbackProviderId && fallbackProviderId !== providerId) {
            console.log(`🔄 Provider ${providerId} at capacity, failing over to ${fallbackProviderId}`)
            return this.createVerificationSession({
              ...params,
              providerId: fallbackProviderId
            })
          }
        }
        throw new Error(`Provider ${providerId} at capacity`)
      }

      // Increment active verifications counter
      this.activeVerifications.set(providerId, currentLoad + 1)

      // Create session with selected provider
      const result = await provider.createVerificationSession(params)

      console.log(`🔐 Created verification session with ${providerId}: ${result.verificationId}`)

      return {
        ...result,
        selectedProvider: providerId,
        fallbackAvailable: this.providers.size > 1
      }

    } catch (error) {
      console.error('Failed to create KYC verification session:', error)
      throw error
    }
  }

  /**
   * Get verification status from appropriate provider
   */
  async getVerificationStatus(verificationId: string, providerId: string) {
    try {
      const provider = this.providers.get(providerId)
      if (!provider) {
        throw new Error(`Provider ${providerId} not found`)
      }

      return await provider.getVerificationStatus(verificationId)

    } catch (error) {
      console.error(`Failed to get verification status from ${providerId}:`, error)
      throw error
    }
  }

  /**
   * Process webhook from any provider
   */
  processWebhook(webhookData: any, providerId: string) {
    try {
      const provider = this.providers.get(providerId)
      if (!provider) {
        throw new Error(`Provider ${providerId} not found`)
      }

      const result = provider.processWebhook(webhookData)
      
      // Decrement active verifications counter
      const currentLoad = this.activeVerifications.get(providerId) || 0
      this.activeVerifications.set(providerId, Math.max(0, currentLoad - 1))

      return result

    } catch (error) {
      console.error(`Failed to process webhook from ${providerId}:`, error)
      throw error
    }
  }

  /**
   * Validate webhook signature
   */
  validateWebhookSignature(signature: string, payload: string, providerId: string, timestamp?: string): boolean {
    try {
      const provider = this.providers.get(providerId)
      if (!provider) {
        return false
      }

      return provider.validateWebhookSignature(signature, payload, timestamp)

    } catch (error) {
      console.error(`Failed to validate webhook signature for ${providerId}:`, error)
      return false
    }
  }

  /**
   * Get provider capabilities
   */
  private getProviderCapabilities(providerId: string): ProviderCapabilities {
    const capabilities: Record<string, ProviderCapabilities> = {
      sumsub: {
        identity: true,
        address: true,
        phone: true,
        email: true,
        countries: ['Global coverage - 220+ countries', 'Web3 & Crypto optimized'],
        documents: ['Passport', 'Driver\'s License', 'National ID Card', 'Utility Bill', 'Bank Statement', '6500+ document types']
      },
      persona: {
        identity: true,
        address: true,
        phone: false,
        email: false,
        countries: ['US', 'CA', 'GB', 'AU', 'EU'],
        documents: ['Driver\'s License', 'Passport', 'National ID Card', 'Utility Bill']
      },
      jumio: {
        identity: true,
        address: true,
        phone: false,
        email: false,
        countries: ['Global coverage'],
        documents: ['Driver\'s License', 'Passport', 'National ID Card', 'Utility Bill', 'Bank Statement']
      },
      onfido: {
        identity: true,
        address: true,
        phone: false,
        email: false,
        countries: ['195+ countries supported'],
        documents: ['Passport', 'Driver\'s License', 'National ID Card', 'Utility Bill']
      },
      plaid_kyc: {
        identity: true,
        address: true,
        phone: true,
        email: true,
        countries: ['US', 'CA'],
        documents: ['Government ID', 'Bank Account', 'Utility Bills', 'Employment Records']
      },
      plaid_identity: {
        identity: true,
        address: true,
        phone: false,
        email: false,
        countries: ['US', 'CA'],
        documents: ['Bank Account Verification', 'Bank-linked Identity']
      }
    }

    return capabilities[providerId] || {
      identity: false,
      address: false,
      phone: false,
      email: false,
      countries: [],
      documents: []
    }
  }

  /**
   * Get provider instance for direct access
   */
  getProvider(providerId: string) {
    return this.providers.get(providerId)
  }

  /**
   * Get provider statistics
   */
  getProviderStats() {
    const stats = []
    
    for (const [providerId, provider] of this.providers) {
      const config = this.configs.get(providerId)
      const activeLoad = this.activeVerifications.get(providerId) || 0
      
      stats.push({
        providerId,
        enabled: config?.enabled || false,
        priority: config?.priority || 99,
        currentLoad: activeLoad,
        maxCapacity: config?.maxConcurrentVerifications || 0,
        utilizationPercent: Math.round((activeLoad / (config?.maxConcurrentVerifications || 1)) * 100),
        costMultiplier: config?.costMultiplier || 1.0
      })
    }

    return stats
  }

  /**
   * Enable/disable a provider
   */
  setProviderEnabled(providerId: string, enabled: boolean) {
    const config = this.configs.get(providerId)
    if (config) {
      config.enabled = enabled
      console.log(`${enabled ? '✅' : '❌'} ${providerId} KYC provider ${enabled ? 'enabled' : 'disabled'}`)
    }
  }

  /**
   * Update provider priority
   */
  setProviderPriority(providerId: string, priority: number) {
    const config = this.configs.get(providerId)
    if (config) {
      config.priority = priority
      console.log(`📊 ${providerId} priority updated to ${priority}`)
    }
  }
}

// Export singleton instance
export const kycProviderManager = new KYCProviderManager()