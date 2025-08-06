// Test Identity Storage Service
// Uses mock storage to bypass Supabase for testing

import { IdentityEncryption } from '../encryption'
import { MockStorageService } from './mock-storage'
import { DIDDocument } from './identity-storage'

export interface VerifiableCredential {
  '@context': string[]
  id: string
  type: string[]
  issuer: string | { id: string; name?: string }
  issuanceDate: string
  expirationDate?: string
  credentialSubject: {
    id: string
    [key: string]: any
  }
  proof: {
    type: string
    created: string
    proofPurpose: string
    verificationMethod: string
    signature: string
    blockchainTxHash?: string
    [key: string]: any
  }
}

export interface StorageResult<T = any> {
  success: boolean
  data?: T
  error?: string
  contentHash?: string
  message?: string
}

/**
 * Test Identity Storage Service with Mock Storage
 */
export class TestIdentityStorageService {
  /**
   * Store DID Document with mock storage
   */
  async storeDIDDocument(
    did: string,
    walletAddress: string,
    walletType: string,
    didDocument: DIDDocument
  ): Promise<StorageResult<any>> {
    try {
      console.log(`🧪 Test Storage: Storing DID document for ${did}`)

      // Generate deterministic mock signature for consistent encryption/decryption
      const mockSignature = 'test-signature-' + walletAddress.slice(-8)
      
      // Encrypt DID document
      const encryptedData = await IdentityEncryption.encryptData(didDocument, mockSignature)
      const contentHash = await IdentityEncryption.generateContentHash(didDocument)

      // Store in mock storage
      const result = await MockStorageService.storeIdentityRecord({
        id: `id_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        did,
        wallet_address: walletAddress,
        content_hash: contentHash,
        encrypted_content: JSON.stringify(encryptedData),
        metadata: {
          type: 'did-document',
          issuer: 'personachain',
          created_at: new Date().toISOString(),
          schema_version: '1.0'
        },
        encryption_params: {
          iv: encryptedData.iv,
          salt: encryptedData.salt,
          algorithm: 'AES-GCM',
          key_derivation: 'PBKDF2'
        }
      })

      if (result.success) {
        return {
          success: true,
          data: result.data,
          contentHash,
          message: 'DID document stored successfully with test storage'
        }
      } else {
        return {
          success: false,
          error: result.error || 'Storage failed'
        }
      }

    } catch (error) {
      console.error('❌ Test storage failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Storage error'
      }
    }
  }

  /**
   * Get DID Document with mock storage
   */
  async getDIDDocument(
    did: string,
    walletAddress: string,
    walletType: string
  ): Promise<StorageResult<DIDDocument>> {
    try {
      console.log(`🧪 Test Storage: Retrieving DID document for ${did}`)

      const result = await MockStorageService.getIdentityRecord(did)
      
      if (!result.success || !result.data) {
        return {
          success: false,
          error: 'DID document not found in test storage'
        }
      }

      // Generate deterministic mock signature for consistent encryption/decryption
      const mockSignature = 'test-signature-' + walletAddress.slice(-8)
      
      // Decrypt DID document
      const encryptedData = JSON.parse(result.data.encrypted_content)
      const decryptionResult = await IdentityEncryption.decryptData(encryptedData, mockSignature)

      if (decryptionResult.success && decryptionResult.data) {
        return {
          success: true,
          data: decryptionResult.data as DIDDocument,
          contentHash: result.data.content_hash,
          message: 'DID document retrieved successfully from test storage'
        }
      } else {
        return {
          success: false,
          error: decryptionResult.error || 'Decryption failed'
        }
      }

    } catch (error) {
      console.error('❌ Test retrieval failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Retrieval error'
      }
    }
  }

  /**
   * Store Verifiable Credential with mock storage
   */
  async storeVerifiableCredential(
    credential: VerifiableCredential,
    walletAddress: string,
    walletType: string
  ): Promise<StorageResult<any>> {
    try {
      console.log(`🧪 Test Storage: Storing credential ${credential.id}`)

      // Generate deterministic mock signature for consistent encryption/decryption
      const mockSignature = 'test-signature-' + walletAddress.slice(-8)
      
      // Encrypt credential
      const encryptedData = await IdentityEncryption.encryptData(credential, mockSignature)
      const contentHash = await IdentityEncryption.generateContentHash(credential)

      // Store in mock storage
      const result = await MockStorageService.storeCredentialRecord({
        id: `cred_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        credential_id: credential.id,
        credential_type: credential.type.join(','),
        holder_did: credential.credentialSubject.id,
        issuer_did: typeof credential.issuer === 'string' ? credential.issuer : credential.issuer.id,
        content_hash: contentHash,
        encrypted_content: JSON.stringify(encryptedData),
        status: 'active',
        issued_at: credential.issuanceDate,
        expires_at: credential.expirationDate,
        metadata: {
          type: 'verifiable-credential',
          issuer: typeof credential.issuer === 'string' ? credential.issuer : credential.issuer.id,
          created_at: new Date().toISOString(),
          schema_version: '1.0'
        },
        encryption_params: {
          iv: encryptedData.iv,
          salt: encryptedData.salt,
          algorithm: 'AES-GCM',
          key_derivation: 'PBKDF2'
        }
      })

      if (result.success) {
        return {
          success: true,
          data: result.data,
          contentHash,
          message: 'Credential stored successfully with test storage'
        }
      } else {
        return {
          success: false,
          error: result.error || 'Storage failed'
        }
      }

    } catch (error) {
      console.error('❌ Test credential storage failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Storage error'
      }
    }
  }

  /**
   * Get DID by wallet address
   */
  async getDIDByWallet(walletAddress: string): Promise<string | null> {
    return await MockStorageService.getDIDByWallet(walletAddress)
  }

  /**
   * Get verifiable credentials for a DID
   */
  async getVerifiableCredentials(
    did: string,
    walletAddress: string,
    walletType: string
  ): Promise<StorageResult<VerifiableCredential[]>> {
    try {
      console.log(`🧪 Test Storage: Retrieving credentials for DID ${did}`)

      const result = await MockStorageService.getCredentialsByDID(did)
      
      if (!result.success || !result.data) {
        return {
          success: true,
          data: [],
          message: 'No credentials found in test storage'
        }
      }

      // Generate deterministic mock signature for consistent encryption/decryption
      const mockSignature = 'test-signature-' + walletAddress.slice(-8)
      
      const credentials: VerifiableCredential[] = []

      for (const credRecord of result.data) {
        try {
          const encryptedData = JSON.parse(credRecord.encrypted_content)
          const decryptionResult = await IdentityEncryption.decryptData(encryptedData, mockSignature)

          if (decryptionResult.success && decryptionResult.data) {
            credentials.push(decryptionResult.data as VerifiableCredential)
          }
        } catch (error) {
          console.warn(`⚠️ Failed to decrypt credential ${credRecord.credential_id}:`, error)
        }
      }

      return {
        success: true,
        data: credentials,
        message: `Retrieved ${credentials.length} credentials from test storage`
      }

    } catch (error) {
      console.error('❌ Test credential retrieval failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Retrieval error'
      }
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(walletAddress: string): Promise<{
    totalCredentials: number
    activeCredentials: number
    totalIdentities: number
  }> {
    const stats = await MockStorageService.getStorageStats(walletAddress)
    return {
      totalCredentials: stats.totalCredentials,
      activeCredentials: stats.activeCredentials,
      totalIdentities: stats.totalIdentities
    }
  }

  /**
   * Clear test data
   */
  clearTestData(): void {
    MockStorageService.clearAll()
  }

  /**
   * Get debug info
   */
  getDebugInfo() {
    return MockStorageService.getDebugInfo()
  }
}

// Export singleton for testing
export const testIdentityStorage = new TestIdentityStorageService()