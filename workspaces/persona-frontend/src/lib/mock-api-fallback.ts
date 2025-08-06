/**
 * Mock API Fallback for Testing
 * Provides fake responses when the real API is down or CORS-blocked
 */

export interface MockCredential {
  id: string
  type: string
  status: 'verified' | 'pending' | 'failed'
  issuedAt: string
  credentialData: any
}

export class MockApiFallback {
  private mockCredentials: Map<string, MockCredential[]> = new Map()

  constructor() {
    // Pre-populate with test data
    this.mockCredentials.set('cosmos17em02n4rgky94xhc8e3q35zr4ht84pgzr0ajcd', [
      {
        id: 'cred_test_123',
        type: 'GitHubVerification', 
        status: 'verified',
        issuedAt: new Date().toISOString(),
        credentialData: {
          githubUsername: 'testuser',
          verified: true
        }
      }
    ])
  }

  async getCredentials(walletAddress: string): Promise<{
    success: boolean
    credentials?: MockCredential[]
    error?: string
  }> {
    console.log('🔄 Using mock API fallback for credentials')
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const credentials = this.mockCredentials.get(walletAddress) || []
    
    return {
      success: true,
      credentials
    }
  }

  async createCredential(walletAddress: string, credentialData: any): Promise<{
    success: boolean
    credential?: MockCredential
    error?: string
  }> {
    console.log('🔄 Using mock API fallback to create credential')
    
    const credential: MockCredential = {
      id: `cred_${Date.now()}`,
      type: credentialData.type || 'TestCredential',
      status: 'verified',
      issuedAt: new Date().toISOString(),
      credentialData
    }
    
    // Store the credential
    const existing = this.mockCredentials.get(walletAddress) || []
    existing.push(credential)
    this.mockCredentials.set(walletAddress, existing)
    
    return {
      success: true,
      credential
    }
  }

  async submitKYC(walletAddress: string, kycData: any): Promise<{
    success: boolean
    reward?: { amount: number; token: string }
    error?: string
  }> {
    console.log('🔄 Using mock API fallback for KYC submission')
    
    // Simulate KYC processing
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    return {
      success: true,
      reward: {
        amount: 100,
        token: 'ID'
      }
    }
  }
}