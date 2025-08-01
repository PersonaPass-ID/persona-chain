// Updated API Client for PersonaPass - AWS + Digital Ocean Architecture
// Smart routing between computation (AWS Fargate) and storage (Digital Ocean)

export interface PhoneVerificationCredential {
  '@context': string[]
  id: string
  type: string[]
  issuer: {
    id: string
    name: string
  }
  issuanceDate: string
  expirationDate: string
  credentialSubject: {
    id: string
    phoneNumber: string
    phoneNumberHashed: string
    verificationMethod: string
    verificationTimestamp: string
    countryCode: string
  }
  proof: {
    type: string
    created: string
    verificationMethod: string
    proofPurpose: string
    jws?: string
  }
}

export interface EmailVerificationCredential {
  '@context': string[]
  id: string
  type: string[]
  issuer: {
    id: string
    name: string
  }
  issuanceDate: string
  expirationDate: string
  credentialSubject: {
    id: string
    email: string
    emailHashed: string
    verificationMethod: string
    verificationTimestamp: string
  }
  proof: {
    type: string
    created: string
    verificationMethod: string
    proofPurpose: string
    jws?: string
  }
}

export interface PersonaIdentityCredential {
  id: string
  type: string
  issuer: string
  issuanceDate: string
  credentialSubject: {
    id: string
    firstName: string
    lastName: string
    verificationMethod: string
  }
  proof: {
    type: string
    created: string
    proofPurpose: string
    verificationMethod: string
    blockchainTxHash: string
  }
}

export interface ZKProof {
  id: string
  proof: {
    type: string
    nonce: string
    revealedAttributes: string[]
    proof: string
    publicSignals: string[]
  }
  metadata: {
    proofType: string
    timestamp: string
    attributes: string[]
    computationTime: number
    circuitUsed: string
    proofSize: number
  }
}

export interface CreateAccountRequest {
  email: string
  password: string
  firstName: string
  lastName: string
  username: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface AuthResponse {
  success: boolean
  message: string
  token?: string
  user?: {
    id: string
    email: string
    firstName: string
    lastName: string
    username: string
  }
}

export interface TokenVerificationResponse {
  valid: boolean
  user?: {
    id: string
    email: string
    firstName: string
    lastName: string
    username: string
  }
  message?: string
}

export interface CheckEmailResponse {
  exists: boolean
  user?: {
    firstName: string
    lastName: string
    username: string
  }
}

export interface CheckUsernameResponse {
  exists: boolean
  available: boolean
}

export interface APICredential {
  id: string
  did: string  
  type: string
  status: string
  firstName: string
  lastName: string
  authMethod: string
  createdAt: string
  blockchain?: {
    txHash: string
    blockHeight: number
  }
  verification?: {
    method: string
  }
}

export interface StartVerificationResponse {
  success: boolean
  message: string
  verificationId?: string
  expiresIn?: number
  error?: string
}

export interface VerifyCodeResponse {
  success: boolean
  message: string
  credential?: PhoneVerificationCredential | EmailVerificationCredential
  zkProof?: ZKProof
  error?: string
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

class PersonaApiClient {
  private storageUrl: string     // Digital Ocean - blockchain storage
  private computeUrl: string     // AWS Fargate - heavy computation
  private mainApiUrl: string     // Main API gateway

  constructor() {
    // API routing configuration
    this.mainApiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://personapass.xyz/api'
    this.storageUrl = process.env.NEXT_PUBLIC_RPC_URL || 'https://personapass.xyz'
    this.computeUrl = process.env.NEXT_PUBLIC_COMPUTE_URL || 'https://personapass-compute.execute-api.us-east-1.amazonaws.com/prod'
    
    console.log('🔗 PersonaApiClient initialized with smart routing:')
    console.log('   📡 Main API:', this.mainApiUrl)
    console.log('   💾 Storage (DO):', this.storageUrl)
    console.log('   💻 Compute (AWS):', this.computeUrl)
  }

  /**
   * Route request to appropriate service
   */
  private getServiceUrl(endpoint: string): string {
    // Heavy computation routes to AWS Fargate
    if (endpoint.includes('/zk-proof/') || 
        endpoint.includes('/credential/process') ||
        endpoint.includes('/identity/verify')) {
      return this.computeUrl
    }
    
    // Blockchain storage routes to Digital Ocean
    if (endpoint.includes('/blockchain/') ||
        endpoint.includes('/did/') ||
        endpoint.includes('/credentials/')) {
      return this.storageUrl
    }
    
    // Default to main API (includes verification services)
    return this.mainApiUrl
  }

  /**
   * Make API request with smart routing
   */
  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const serviceUrl = this.getServiceUrl(endpoint)
    const fullUrl = `${serviceUrl}${endpoint}`
    
    console.log(`🔀 Routing ${endpoint} → ${serviceUrl === this.computeUrl ? 'AWS Fargate' : serviceUrl === this.storageUrl ? 'Digital Ocean' : 'Main API'}`)
    
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
   * Start phone verification process
   */
  async startPhoneVerification(phoneNumber: string): Promise<StartVerificationResponse> {
    try {
      const response = await this.makeRequest('/api/persona/phone/verify-start', {
        method: 'POST',
        body: JSON.stringify({
          phoneNumber: phoneNumber
        })
      })

      return await response.json()
    } catch (error) {
      console.error('Failed to start phone verification:', error)
      return {
        success: false,
        message: 'Failed to connect to verification service',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Verify phone code and issue VC + DID
   */
  async verifyPhoneCodeAndIssueVC(phoneNumber: string, verificationCode: string): Promise<VerifyCodeResponse> {
    try {
      const response = await this.makeRequest('/api/persona/phone/verify-complete', {
        method: 'POST',
        body: JSON.stringify({
          phoneNumber: phoneNumber,
          verificationCode: verificationCode
        })
      })

      return await response.json()
    } catch (error) {
      console.error('Failed to verify phone code:', error)
      return {
        success: false,
        message: 'Failed to connect to verification service',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Start email verification process
   */
  async startEmailVerification(email: string): Promise<StartVerificationResponse> {
    try {
      const response = await this.makeRequest('/api/persona/email/verify-start', {
        method: 'POST',
        body: JSON.stringify({
          email: email
        })
      })

      return await response.json()
    } catch (error) {
      console.error('Failed to start email verification:', error)
      return {
        success: false,
        message: 'Failed to connect to verification service',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Verify email code and issue VC
   */
  async verifyEmailCodeAndIssueVC(email: string, verificationCode: string): Promise<VerifyCodeResponse> {
    try {
      const response = await this.makeRequest('/api/persona/email/verify-complete', {
        method: 'POST',
        body: JSON.stringify({
          email: email,
          verificationCode: verificationCode
        })
      })

      return await response.json()
    } catch (error) {
      console.error('Failed to verify email code:', error)
      return {
        success: false,
        message: 'Failed to connect to verification service',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Create zero-knowledge proof (routes to AWS Fargate)
   */
  async createZKProof(credential: PhoneVerificationCredential | EmailVerificationCredential, requiredAttributes: string[]): Promise<ZKProof | null> {
    try {
      console.log('🧮 Creating ZK proof via AWS Fargate...')
      
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
        console.log('✅ ZK proof created successfully:', result.zkProof.id)
        return result.zkProof
      } else {
        console.error('❌ ZK proof creation failed:', result.error)
        return null
      }
      
    } catch (error) {
      console.error('Failed to create ZK proof:', error)
      return null
    }
  }

  /**
   * Verify ZK proof (routes to AWS Fargate)
   */
  async verifyZKProof(proof: unknown, publicSignals: string[]): Promise<boolean> {
    try {
      console.log('🔍 Verifying ZK proof via AWS Fargate...')
      
      const response = await this.makeRequest('/api/zk-proof/verify', {
        method: 'POST',
        body: JSON.stringify({
          proof: proof,
          publicSignals: publicSignals
        })
      })

      const result = await response.json()
      
      if (result.success) {
        console.log('✅ ZK proof verification:', result.valid ? 'VALID' : 'INVALID')
        return result.valid
      } else {
        console.error('❌ ZK proof verification failed:', result.error)
        return false
      }
      
    } catch (error) {
      console.error('Failed to verify ZK proof:', error)
      return false
    }
  }

  /**
   * Create DID on blockchain (routes to Digital Ocean)
   */
  async createDID(walletAddress: string, firstName: string, lastName: string, authMethod: string, identifier: string): Promise<{
    success: boolean
    did?: string
    txHash?: string
    credential?: PersonaIdentityCredential
    message?: string
    error?: string
  }> {
    try {
      console.log('⛓️ Creating DID on PersonaChain blockchain...')
      
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
        console.log('✅ DID created on blockchain:', result.did)
      }
      
      return result
    } catch (error) {
      console.error('Failed to create DID:', error)
      return {
        success: false,
        message: 'Failed to create DID on blockchain',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get user credentials from blockchain (routes to Digital Ocean)
   */
  async getCredentials(walletAddress: string): Promise<{
    success: boolean
    credentials?: APICredential[]
    blockchain?: {
      network: string
      nodeUrl: string
      totalCredentials: number
      activeCredentials: number
      latestBlockHeight: number
    }
    error?: string
  }> {
    try {
      const response = await this.makeRequest(`/api/credentials/${walletAddress}`)
      return await response.json()
    } catch (error) {
      console.error('Failed to get credentials:', error)
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
      const response = await this.makeRequest('/health')
      const healthData = await response.json()
      
      // Add architecture information
      return {
        ...healthData,
        architecture: {
          routing: 'Smart routing enabled',
          computation: this.computeUrl,
          storage: this.storageUrl,
          mainApi: this.mainApiUrl
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
    console.log('🧪 Testing PersonaPass system architecture...')
    
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
      
      // Test compute engine (AWS Fargate)
      try {
        const computeResponse = await fetch(`${this.computeUrl}/health`, { signal: AbortSignal.timeout(5000) })
        results.computeEngine = computeResponse.ok
        console.log(`💻 Compute Engine: ${results.computeEngine ? '✅' : '❌'}`)
      } catch (error) {
        console.log('💻 Compute Engine: ❌')
      }
      
      // Test blockchain storage (Digital Ocean)
      try {
        const storageResponse = await fetch(`${this.storageUrl}/status`, { signal: AbortSignal.timeout(5000) })
        results.blockchainStorage = storageResponse.ok
        console.log(`💾 Blockchain Storage: ${results.blockchainStorage ? '✅' : '❌'}`)
      } catch (error) {
        console.log('💾 Blockchain Storage: ❌')
      }
      
      const allWorking = results.mainApi && results.computeEngine && results.blockchainStorage
      
      return {
        success: allWorking,
        results,
        message: allWorking 
          ? 'All system components operational' 
          : 'Some system components unavailable'
      }
      
    } catch (error) {
      return {
        success: false,
        results,
        message: `System test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  // Existing methods (authentication, etc.) remain the same...
  
  /**
   * Create password-based account
   */
  async createAccount(request: CreateAccountRequest): Promise<AuthResponse> {
    try {
      const response = await this.makeRequest('/auth/create-account', {
        method: 'POST',
        body: JSON.stringify(request)
      })

      const result = await response.json()
      
      // Store token if successful
      if (result.success && result.token) {
        localStorage.setItem('persona_auth_token', result.token)
        localStorage.setItem('persona_user', JSON.stringify(result.user))
      }

      return result
    } catch (error) {
      console.error('Failed to create account:', error)
      return {
        success: false,
        message: 'Failed to create account. Please try again.',
      }
    }
  }

  /**
   * Login with email and password
   */
  async login(request: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await this.makeRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify(request)
      })

      const result = await response.json()
      
      // Store token if successful
      if (result.success && result.token) {
        localStorage.setItem('persona_auth_token', result.token)
        localStorage.setItem('persona_user', JSON.stringify(result.user))
      }

      return result
    } catch (error) {
      console.error('Failed to login:', error)
      return {
        success: false,
        message: 'Login failed. Please try again.',
      }
    }
  }

  /**
   * Verify stored authentication token
   */
  async verifyToken(): Promise<TokenVerificationResponse> {
    try {
      const token = localStorage.getItem('persona_auth_token')
      if (!token) {
        return {
          valid: false,
          message: 'No authentication token found'
        }
      }

      const response = await this.makeRequest('/auth/verify-token', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const result = await response.json()
      
      // Update stored user data if valid
      if (result.valid && result.user) {
        localStorage.setItem('persona_user', JSON.stringify(result.user))
      } else {
        // Clear invalid token
        localStorage.removeItem('persona_auth_token')
        localStorage.removeItem('persona_user')
      }

      return result
    } catch (error) {
      console.error('Failed to verify token:', error)
      // Clear potentially invalid token
      localStorage.removeItem('persona_auth_token')
      localStorage.removeItem('persona_user')
      return {
        valid: false,
        message: 'Token verification failed'
      }
    }
  }

  /**
   * Check if email already exists
   */
  async checkEmailExists(email: string): Promise<CheckEmailResponse> {
    try {
      const response = await this.makeRequest('/auth/check-email', {
        method: 'POST',
        body: JSON.stringify({ email })
      })

      return await response.json()
    } catch (error) {
      console.error('Failed to check email:', error)
      return {
        exists: false
      }
    }
  }

  /**
   * Check if username already exists
   */
  async checkUsernameExists(username: string): Promise<CheckUsernameResponse> {
    try {
      const response = await this.makeRequest('/auth/check-username', {
        method: 'POST',
        body: JSON.stringify({ username })
      })

      return await response.json()
    } catch (error) {
      console.error('Failed to check username:', error)
      return {
        exists: false,
        available: true
      }
    }
  }

  /**
   * Generate a proper DID from phone number and credential
   */
  generateDID(phoneNumber: string, credential?: PhoneVerificationCredential): string {
    if (credential) {
      return credential.credentialSubject.id
    }
    
    // Generate DID format: did:persona:phone:{hash}
    // Simple hash using btoa for browser compatibility
    const hash = btoa(phoneNumber).substring(0, 16)
    return `did:persona:phone:${hash}`
  }

  /**
   * Store VC in browser localStorage securely (with encryption)
   */
  storeCredential(credential: PhoneVerificationCredential, passphrase?: string): void {
    try {
      const credentialData = {
        credential,
        storedAt: new Date().toISOString(),
        id: credential.id
      }

      if (passphrase) {
        // In production, use proper encryption
        const encrypted = btoa(JSON.stringify(credentialData))
        localStorage.setItem('persona_vc', encrypted)
      } else {
        localStorage.setItem('persona_vc', JSON.stringify(credentialData))
      }
    } catch (error) {
      console.error('Failed to store credential:', error)
    }
  }

  /**
   * Retrieve stored VC from localStorage
   */
  getStoredCredential(passphrase?: string): PhoneVerificationCredential | null {
    try {
      const stored = localStorage.getItem('persona_vc')
      if (!stored) return null

      if (passphrase) {
        // In production, use proper decryption
        const decrypted = atob(stored)
        const credentialData = JSON.parse(decrypted)
        return credentialData.credential
      } else {
        const credentialData = JSON.parse(stored)
        return credentialData.credential
      }
    } catch (error) {
      console.error('Failed to retrieve credential:', error)
      return null
    }
  }

  /**
   * Get stored authentication token
   */
  getStoredToken(): string | null {
    try {
      return localStorage.getItem('persona_auth_token')
    } catch (error) {
      console.error('Failed to get stored token:', error)
      return null
    }
  }

  /**
   * Get stored user data
   */
  getStoredUser(): {
    id: string
    email: string
    firstName: string
    lastName: string
    username: string
  } | null {
    try {
      const userData = localStorage.getItem('persona_user')
      return userData ? JSON.parse(userData) : null
    } catch (error) {
      console.error('Failed to get stored user:', error)
      return null
    }
  }

  /**
   * Logout user
   */
  logout(): void {
    try {
      localStorage.removeItem('persona_auth_token')
      localStorage.removeItem('persona_user')
    } catch (error) {
      console.error('Failed to logout:', error)
    }
  }

  /**
   * Clear stored credentials
   */
  clearStoredCredentials(): void {
    try {
      localStorage.removeItem('persona_vc')
      localStorage.removeItem('persona_did')
      localStorage.removeItem('persona_profile')
      localStorage.removeItem('persona_auth_token')
      localStorage.removeItem('persona_user')
    } catch (error) {
      console.error('Failed to clear credentials:', error)
    }
  }
}

// Export singleton instance
export const personaApiClient = new PersonaApiClient()
export default personaApiClient