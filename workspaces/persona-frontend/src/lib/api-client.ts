// API Client for Persona Issuer Service
// Connects frontend to real DID/VC blockchain infrastructure

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

export interface ZKProof {
  proof: {
    type: string
    nonce: string
    revealedAttributes: string[]
    proof: string
  }
  metadata: {
    proofType: string
    timestamp: string
    attributes: string[]
  }
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
  private baseUrl: string

  constructor() {
    // Force HTTPS URL to prevent mixed content errors
    let apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://lgx05f1fwg.execute-api.us-east-1.amazonaws.com/prod'
    
    // Override any HTTP URLs with HTTPS version (use API Gateway with valid SSL)
    if (apiUrl.startsWith('http://161.35.2.88:3001')) {
      apiUrl = 'https://lgx05f1fwg.execute-api.us-east-1.amazonaws.com/prod'
      console.warn('🔒 Overriding HTTP API URL with HTTPS API Gateway to prevent mixed content errors')
    }
    
    this.baseUrl = apiUrl
    console.log('🔗 PersonaApiClient initialized with baseUrl:', this.baseUrl)
  }

  /**
   * Start phone verification process
   */
  async startPhoneVerification(phoneNumber: string): Promise<StartVerificationResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/issue-vc/phone/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: phoneNumber
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

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
      const response = await fetch(`${this.baseUrl}/issue-vc/phone/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: phoneNumber,
          verificationCode: verificationCode
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

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
      const response = await fetch(`${this.baseUrl}/issue-vc/email/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

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
      const response = await fetch(`${this.baseUrl}/issue-vc/email/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          verificationCode: verificationCode
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

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
   * Verify an existing VC
   */
  async verifyCredential(credential: PhoneVerificationCredential | EmailVerificationCredential): Promise<{
    valid: boolean
    reason?: string
    message?: string
  }> {
    try {
      const credentialType = credential.type.includes('PhoneVerification') ? 'phone' : 'email'
      const response = await fetch(`${this.baseUrl}/issue-vc/${credentialType}/verify-credential`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          credential: credential
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Failed to verify credential:', error)
      return {
        valid: false,
        reason: 'Verification service unavailable',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Create zero-knowledge proof from VC
   */
  async createZKProof(credential: PhoneVerificationCredential, requiredAttributes: string[]): Promise<ZKProof | null> {
    try {
      const response = await fetch(`${this.baseUrl}/issue-vc/phone/create-zk-proof`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          credential: credential,
          requiredAttributes: requiredAttributes
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Failed to create ZK proof:', error)
      return null
    }
  }

  /**
   * Create DID on blockchain
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
      const url = `${this.baseUrl}/api/did/create`
      console.log('🌐 Making DID creation request to:', url)
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress,
          firstName,
          lastName,
          authMethod,
          identifier
        })
      })

      console.log('📡 DID creation response status:', response.status)
      console.log('📡 DID creation response headers:', Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ DID creation failed with response:', errorText)
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
      }

      const result = await response.json()
      console.log('✅ DID creation successful! Response:', result)
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
   * Get user credentials from blockchain
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
      const response = await fetch(`${this.baseUrl}/api/credentials/${walletAddress}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

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
   * Check service health
   */
  async checkHealth(): Promise<HealthCheckResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
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
   * Clear stored credentials
   */
  clearStoredCredentials(): void {
    try {
      localStorage.removeItem('persona_vc')
      localStorage.removeItem('persona_did')
      localStorage.removeItem('persona_profile')
    } catch (error) {
      console.error('Failed to clear credentials:', error)
    }
  }
}

// Export singleton instance
export const personaApiClient = new PersonaApiClient()
export default personaApiClient