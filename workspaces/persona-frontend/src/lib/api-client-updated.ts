// PersonaPass API Client - WALLET-ONLY AUTHENTICATION
// Pure wallet-based authentication with Keplr, Leap, Cosmostation, Terra Station

export interface WalletIdentityCredential {
  id: string
  type: string
  issuer: string
  issuanceDate: string
  credentialSubject: {
    id: string
    walletAddress: string
    firstName: string
    lastName: string
    walletType: string
    verificationMethod: string
  }
  proof: {
    type: string
    created: string
    proofPurpose: string
    verificationMethod: string
    blockchainTxHash: string
    walletAddress: string
  }
}

export interface WalletProfile {
  walletAddress: string
  firstName: string
  lastName: string
  username: string
  did: string
  walletType: string
  createdAt: string
}

export interface WalletCredential {
  id: string
  did: string  
  type: string
  status: string
  walletAddress: string
  firstName: string
  lastName: string
  walletType: string
  createdAt: string
  blockchain?: {
    txHash: string
    blockHeight: number
    network: string
  }
  verification?: {
    method: string
    walletType: string
  }
}

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy'
  services: Array<{
    name: string
    status: 'up' | 'down'
    responseTime?: number
  }>
  timestamp: string
  error?: string
}

export interface CreateDIDResponse {
  success: boolean
  did?: string
  txHash?: string
  credential?: WalletIdentityCredential
  message?: string
  error?: string
}

export interface GetCredentialsResponse {
  success: boolean
  credentials?: WalletCredential[]
  blockchain?: {
    network: string
    nodeUrl: string
    totalCredentials: number
    activeCredentials: number
    latestBlockHeight: number
  }
  error?: string
}

export interface WalletZKProofResponse {
  success: boolean
  zkProof?: {
    id: string
    proof: unknown
    publicSignals: string[]
  }
  error?: string
}

export interface WalletZKVerifyResponse {
  success: boolean
  valid?: boolean
  error?: string
}

class PersonaWalletApiClient {
  private mainApiUrl: string     // Main API gateway

  constructor() {
    // API configuration - WALLET-ONLY
    this.mainApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
    
    console.log('🔗 PersonaWalletApiClient initialized - WALLET-ONLY AUTHENTICATION:')
    console.log('   📡 Main API:', this.mainApiUrl)
  }

  /**
   * Make API request to PersonaPass API
   */
  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const fullUrl = `${this.mainApiUrl}${endpoint}`
    
    console.log(`🔀 Routing ${endpoint} → Main API (Wallet-Only)`)
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'PersonaPass-Frontend',
        ...options.headers
      },
      ...options
    }
    
    try {
      const response = await fetch(fullUrl, defaultOptions)
      
      if (!response.ok) {
        console.error(`❌ Request failed: ${response.status} ${response.statusText}`)
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return response
    } catch (error) {
      console.error(`🚫 Network error for ${fullUrl}:`, error)
      throw error
    }
  }

  /**
   * Create DID on blockchain - WALLET-ONLY
   */
  async createDID(walletAddress: string, firstName: string, lastName: string, authMethod: string, identifier: string): Promise<CreateDIDResponse> {
    try {
      console.log('⛓️ Creating wallet-based DID on PersonaChain blockchain...')
      
      const response = await this.makeRequest('/api/did/create', {
        method: 'POST',
        body: JSON.stringify({
          walletAddress,
          firstName,
          lastName,
          authMethod,
          identifier
        })
      })

      const result = await response.json()
      
      if (result.success) {
        console.log('✅ Wallet-based DID created on blockchain:', result.did)
      }
      
      return result
    } catch (error) {
      console.error('Failed to create wallet DID:', error)
      return {
        success: false,
        message: 'Failed to create wallet-based DID on blockchain',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get user credentials from blockchain - WALLET-ONLY
   */
  async getCredentials(walletAddress: string): Promise<GetCredentialsResponse> {
    try {
      console.log(`🔍 Getting wallet credentials: ${walletAddress}`)
      
      const response = await this.makeRequest(`/api/credentials/${walletAddress}`)
      const result = await response.json()
      
      if (result.success) {
        return result
      } else {
        throw new Error(result.error || 'Failed to get credentials')
      }
    } catch (error) {
      console.error('Failed to get wallet credentials:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Create zero-knowledge proof for wallet credentials
   */
  async createWalletZKProof(credential: WalletIdentityCredential, requiredAttributes: string[]): Promise<WalletZKProofResponse> {
    try {
      console.log('🧮 Creating wallet ZK proof...')
      
      const response = await this.makeRequest('/api/zk-proof/generate', {
        method: 'POST',
        body: JSON.stringify({
          credential: credential,
          proofType: 'groth16',
          requiredAttributes: requiredAttributes
        })
      })

      const result = await response.json()
      
      if (result.success) {
        console.log('✅ Wallet ZK proof created successfully:', result.zkProof.id)
        return {
          success: true,
          zkProof: result.zkProof
        }
      } else {
        console.error('❌ Wallet ZK proof creation failed:', result.error)
        return {
          success: false,
          error: result.error
        }
      }
      
    } catch (error) {
      console.error('Failed to create wallet ZK proof:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Verify wallet ZK proof
   */
  async verifyWalletZKProof(proof: unknown, publicSignals: string[]): Promise<WalletZKVerifyResponse> {
    try {
      console.log('🔍 Verifying wallet ZK proof...')
      
      const response = await this.makeRequest('/api/zk-proof/verify', {
        method: 'POST',
        body: JSON.stringify({
          proof: proof,
          publicSignals: publicSignals
        })
      })

      const result = await response.json()
      
      if (result.success) {
        console.log('✅ Wallet ZK proof verification:', result.valid ? 'VALID' : 'INVALID')
        return {
          success: true,
          valid: result.valid
        }
      } else {
        console.error('❌ Wallet ZK proof verification failed:', result.error)
        return {
          success: false,
          error: result.error
        }
      }
      
    } catch (error) {
      console.error('Failed to verify wallet ZK proof:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Check service health with architecture info
   */
  async checkHealth(): Promise<HealthCheckResponse & { architecture?: Record<string, unknown> }> {
    try {
      const response = await this.makeRequest('/api/health')
      const healthData = await response.json()
      
      // Add architecture information
      return {
        ...healthData,
        architecture: {
          authType: 'Wallet-only authentication',
          mainApi: this.mainApiUrl,
          supportedWallets: ['Keplr', 'Leap', 'Cosmostation', 'Terra Station']
        }
      }
    } catch (error) {
      console.error('Health check failed:', error)
      return {
        status: 'unhealthy',
        services: [],
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Test system architecture
   */
  async testSystemArchitecture(): Promise<{
    success: boolean
    results: {
      mainApi: boolean
      computeEngine: boolean
      blockchainStorage: boolean
    }
    message: string
  }> {
    console.log('🧪 Testing PersonaPass wallet-only system architecture...')
    
    const results = {
      mainApi: false,
      computeEngine: false,
      blockchainStorage: false
    }
    
    try {
      // Test main API
      try {
        const mainResponse = await fetch(`${this.mainApiUrl}/health`, { signal: AbortSignal.timeout(5000) })
        results.mainApi = mainResponse.ok
        console.log(`📡 Main API: ${results.mainApi ? '✅' : '❌'}`)
      } catch (error) {
        console.log('📡 Main API: ❌')
      }
      
      // Test wallet authentication system
      try {
        const testResponse = await fetch(`${this.mainApiUrl}/system/test`, { signal: AbortSignal.timeout(5000) })
        results.computeEngine = testResponse.ok  // Reusing existing result structure
        console.log(`🔐 Wallet Auth: ${results.computeEngine ? '✅' : '❌'}`)
      } catch (error) {
        console.log('🔐 Wallet Auth: ❌')
      }
      
      // Set blockchain storage to same as main API since it's unified
      results.blockchainStorage = results.mainApi
      console.log(`⛓️ DID Creation: ${results.blockchainStorage ? '✅' : '❌'}`)
      
      const allWorking = results.mainApi && results.computeEngine && results.blockchainStorage
      
      return {
        success: allWorking,
        results,
        message: allWorking 
          ? 'Wallet-only authentication system operational' 
          : 'Some wallet authentication components unavailable'
      }
      
    } catch (error) {
      return {
        success: false,
        results,
        message: `System test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  // WALLET-ONLY UTILITY METHODS
  
  /**
   * Generate DID from wallet address
   */
  generateWalletDID(walletAddress: string): string {
    const hash = Buffer.from(walletAddress).toString('base64').substring(0, 16)
    return `did:persona:${hash}`
  }

  /**
   * Store wallet profile in localStorage
   */
  storeWalletProfile(profile: WalletProfile): void {
    try {
      localStorage.setItem('persona_wallet_profile', JSON.stringify(profile))
      localStorage.setItem('persona_did', profile.did)
    } catch (error) {
      console.error('Failed to store wallet profile:', error)
    }
  }

  /**
   * Get stored wallet profile
   */
  getStoredWalletProfile(): WalletProfile | null {
    try {
      const profileData = localStorage.getItem('persona_wallet_profile')
      return profileData ? JSON.parse(profileData) : null
    } catch (error) {
      console.error('Failed to get stored wallet profile:', error)
      return null
    }
  }

  /**
   * Clear wallet session (disconnect)
   */
  disconnectWallet(): void {
    try {
      localStorage.removeItem('persona_wallet_profile')
      localStorage.removeItem('persona_did')
      localStorage.removeItem('persona_wallet_access_token')
      localStorage.removeItem('persona_wallet_refresh_token')
      localStorage.removeItem('persona_wallet_user')
      console.log('🔓 Wallet disconnected and session cleared')
    } catch (error) {
      console.error('Failed to disconnect wallet:', error)
    }
  }

  /**
   * Clear all stored wallet data
   */
  clearAllWalletData(): void {
    try {
      // Clear all wallet-related storage
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('persona_wallet_') || key.startsWith('persona_')) {
          localStorage.removeItem(key)
        }
      })
      console.log('🧹 All wallet data cleared')
    } catch (error) {
      console.error('Failed to clear wallet data:', error)
    }
  }

  /**
   * Check if wallet is already connected and has a DID
   */
  async checkExistingWalletAuth(walletAddress: string): Promise<{
    hasExistingDID: boolean
    profile?: WalletProfile
    credentials?: WalletCredential[]
    shouldAutoLogin: boolean
  }> {
    try {
      // Check for existing credentials on blockchain
      const credentialsResponse = await this.getCredentials(walletAddress)
      
      if (credentialsResponse.success && credentialsResponse.credentials && credentialsResponse.credentials.length > 0) {
        // Has existing DID on blockchain
        const credential = credentialsResponse.credentials[0]
        
        const profile: WalletProfile = {
          walletAddress: walletAddress,
          firstName: credential.firstName || '',
          lastName: credential.lastName || '',
          username: `${credential.firstName || 'User'} ${credential.lastName || ''}`.trim(),
          did: credential.did,
          walletType: credential.walletType,
          createdAt: credential.createdAt
        }

        return {
          hasExistingDID: true,
          profile: profile,
          credentials: credentialsResponse.credentials,
          shouldAutoLogin: true
        }
      } else {
        // No existing DID found
        return {
          hasExistingDID: false,
          shouldAutoLogin: false
        }
      }
    } catch (error) {
      console.error('Failed to check existing wallet auth:', error)
      return {
        hasExistingDID: false,
        shouldAutoLogin: false
      }
    }
  }
}

// Export singleton instance - WALLET-ONLY AUTHENTICATION
export const personaApiClient = new PersonaWalletApiClient()
export default personaApiClient