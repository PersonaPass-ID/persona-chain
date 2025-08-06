// Mock Storage Service for Testing
// Bypasses actual Supabase connection for development testing

export interface MockIdentityRecord {
  id: string
  did: string
  wallet_address: string
  content_hash: string
  encrypted_content: string
  metadata: any
  encryption_params: any
  created_at: string
  updated_at: string
}

export interface MockCredentialRecord {
  id: string
  credential_id: string
  credential_type: string
  holder_did: string
  issuer_did: string
  content_hash: string
  encrypted_content: string
  status: string
  issued_at: string
  expires_at?: string
  revoked_at?: string
  metadata: any
  encryption_params: any
  created_at: string
  updated_at: string
}

/**
 * Mock storage service for testing identity system without database
 */
export class MockStorageService {
  private static identityRecords: Map<string, MockIdentityRecord> = new Map()
  private static credentialRecords: Map<string, MockCredentialRecord> = new Map()
  private static didToWallet: Map<string, string> = new Map()

  /**
   * Store identity record (DID document)
   */
  static async storeIdentityRecord(record: Omit<MockIdentityRecord, 'created_at' | 'updated_at'>): Promise<{ success: boolean; data?: MockIdentityRecord; error?: string }> {
    try {
      const now = new Date().toISOString()
      const fullRecord: MockIdentityRecord = {
        ...record,
        created_at: now,
        updated_at: now
      }

      this.identityRecords.set(record.did, fullRecord)
      this.didToWallet.set(record.did, record.wallet_address)

      console.log(`🧪 Mock storage: Stored identity record for DID ${record.did}`)
      
      return {
        success: true,
        data: fullRecord
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Storage failed'
      }
    }
  }

  /**
   * Get identity record by DID
   */
  static async getIdentityRecord(did: string): Promise<{ success: boolean; data?: MockIdentityRecord; error?: string }> {
    try {
      const record = this.identityRecords.get(did)
      
      if (!record) {
        return {
          success: false,
          error: 'Identity record not found'
        }
      }

      console.log(`🧪 Mock storage: Retrieved identity record for DID ${did}`)
      
      return {
        success: true,
        data: record
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Retrieval failed'
      }
    }
  }

  /**
   * Get DID by wallet address
   */
  static async getDIDByWallet(walletAddress: string): Promise<string | null> {
    try {
      for (const [did, wallet] of this.didToWallet.entries()) {
        if (wallet === walletAddress) {
          console.log(`🧪 Mock storage: Found DID ${did} for wallet ${walletAddress}`)
          return did
        }
      }

      console.log(`🧪 Mock storage: No DID found for wallet ${walletAddress}`)
      return null
    } catch (error) {
      console.error('❌ Mock storage getDIDByWallet failed:', error)
      return null
    }
  }

  /**
   * Store credential record
   */
  static async storeCredentialRecord(record: Omit<MockCredentialRecord, 'created_at' | 'updated_at'>): Promise<{ success: boolean; data?: MockCredentialRecord; error?: string }> {
    try {
      const now = new Date().toISOString()
      const fullRecord: MockCredentialRecord = {
        ...record,
        created_at: now,
        updated_at: now
      }

      this.credentialRecords.set(record.credential_id, fullRecord)

      console.log(`🧪 Mock storage: Stored credential record ${record.credential_id}`)
      
      return {
        success: true,
        data: fullRecord
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Storage failed'
      }
    }
  }

  /**
   * Get credentials by DID
   */
  static async getCredentialsByDID(did: string): Promise<{ success: boolean; data?: MockCredentialRecord[]; error?: string }> {
    try {
      const credentials = Array.from(this.credentialRecords.values())
        .filter(cred => cred.holder_did === did)

      console.log(`🧪 Mock storage: Found ${credentials.length} credentials for DID ${did}`)
      
      return {
        success: true,
        data: credentials
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Retrieval failed'
      }
    }
  }

  /**
   * Get storage statistics
   */
  static async getStorageStats(walletAddress: string): Promise<{ 
    totalIdentities: number
    totalCredentials: number
    activeCredentials: number
  }> {
    const did = await this.getDIDByWallet(walletAddress)
    const credentials = did ? await this.getCredentialsByDID(did) : { success: false, data: [] }
    
    return {
      totalIdentities: this.identityRecords.size,
      totalCredentials: credentials.success ? (credentials.data?.length || 0) : 0,
      activeCredentials: credentials.success ? (credentials.data?.filter(c => c.status === 'active').length || 0) : 0
    }
  }

  /**
   * Clear all mock data (for testing)
   */
  static clearAll(): void {
    this.identityRecords.clear()
    this.credentialRecords.clear()
    this.didToWallet.clear()
    console.log('🧪 Mock storage: Cleared all data')
  }

  /**
   * Get all stored data (for debugging)
   */
  static getDebugInfo(): {
    identities: number
    credentials: number
    didMappings: number
  } {
    return {
      identities: this.identityRecords.size,
      credentials: this.credentialRecords.size,
      didMappings: this.didToWallet.size
    }
  }
}