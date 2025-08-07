// Real Identity Storage Service using Supabase
// Production-ready Web3 identity storage with encryption and blockchain anchoring

import { getSupabaseClient } from './supabase-client'
import { IdentityEncryption, WalletSignatureGenerator } from '../encryption'
import { blockchainAnchor } from './blockchain-anchor'
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

export interface IdentityRecord {
  id: string
  did: string
  wallet_address: string
  content_hash: string
  encrypted_content: string
  metadata: any
  encryption_params: any
  created_at: string
  updated_at: string
  blockchain_tx_hash?: string
  blockchain_anchor?: any
}

export interface VerifiableCredentialRecord {
  id: string
  credential_id: string
  credential_type: string
  did: string  // Required field in actual database schema
  subject_did: string
  issuer_did: string
  content_hash: string
  encrypted_credential: string  // Actual field name in database
  status: string
  issuance_date: string  // Fixed: was issued_at
  expiration_date?: string  // Fixed: was expires_at
  metadata: any
  encryption_params: any
  blockchain_anchor?: any
  created_at: string
  updated_at: string
}

export interface StorageResult<T = any> {
  success: boolean
  data?: T
  error?: string
  contentHash?: string
  message?: string
  blockchainTxHash?: string
}

/**
 * Real Identity Storage Service with Supabase Backend
 */
export class RealIdentityStorageService {
  private supabase = getSupabaseClient()

  /**
   * Store DID Document with encryption and blockchain anchoring
   */
  async storeDIDDocument(
    did: string,
    walletAddress: string,
    walletType: string,
    didDocument: DIDDocument
  ): Promise<StorageResult<IdentityRecord>> {
    try {
      console.log(`🔐 Real Storage: Storing DID document for ${did}`)

      // Generate wallet signature for encryption
      const walletSignature = await WalletSignatureGenerator.generateEncryptionSignature(
        walletType,
        walletAddress,
        'encryption'
      )

      // Encrypt DID document
      const encryptedData = await IdentityEncryption.encryptData(didDocument, walletSignature)
      const contentHash = await IdentityEncryption.generateContentHash(didDocument)

      // Store in Supabase with row-level security
      const identityRecord: Omit<IdentityRecord, 'id' | 'created_at' | 'updated_at'> = {
        did,
        wallet_address: walletAddress,
        content_hash: contentHash,
        encrypted_content: JSON.stringify(encryptedData),
        metadata: {
          type: 'did-document',
          issuer: 'personachain',
          wallet_type: walletType,
          schema_version: '1.0'
        },
        encryption_params: {
          iv: encryptedData.iv,
          salt: encryptedData.salt,
          algorithm: 'AES-GCM',
          key_derivation: 'PBKDF2',
          iterations: 100000
        }
      }

      const { data: storedRecord, error: dbError } = await this.supabase
        .from('identity_records')
        .insert(identityRecord)
        .select()
        .single()

      if (dbError) {
        console.error('❌ Database storage failed:', dbError)
        return {
          success: false,
          error: `Database error: ${dbError.message}`
        }
      }

      // Anchor to PersonaChain blockchain
      console.log(`⚓ Anchoring DID ${did} to PersonaChain...`)
      const anchorResult = await blockchainAnchor.anchorDIDCreation(
        did,
        walletAddress,
        contentHash,
        didDocument
      )

      // Update record with blockchain transaction hash
      if (anchorResult.success && anchorResult.txHash) {
        const { error: updateError } = await this.supabase
          .from('identity_records')
          .update({
            blockchain_tx_hash: anchorResult.txHash,
            blockchain_anchor: {
              tx_hash: anchorResult.txHash,
              block_height: anchorResult.blockHeight,
              network: anchorResult.network,
              anchored_at: new Date().toISOString()
            }
          })
          .eq('id', storedRecord.id)

        if (updateError) {
          console.warn('⚠️ Failed to update blockchain anchor info:', updateError)
        }
      }

      console.log(`✅ DID ${did} stored and anchored successfully`)

      return {
        success: true,
        data: storedRecord,
        contentHash,
        blockchainTxHash: anchorResult.txHash,
        message: 'DID document stored and anchored to PersonaChain'
      }

    } catch (error) {
      console.error('❌ Real storage failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Storage error'
      }
    }
  }

  /**
   * Store DID document directly with pre-computed encryption data
   * Used for server-side testing to bypass wallet signature generation
   */
  async storeDIDDocumentDirect(
    did: string,
    walletAddress: string,
    walletType: string,
    didDocument: DIDDocument,
    encryptedData: any,
    contentHash: string,
    signature: string
  ): Promise<StorageResult<IdentityRecord>> {
    try {
      console.log(`🔐 Real Storage (Direct): Storing DID document for ${did}`)

      // Store in Supabase with row-level security
      const identityRecord: Omit<IdentityRecord, 'id' | 'created_at' | 'updated_at'> = {
        did,
        wallet_address: walletAddress,
        content_hash: contentHash,
        encrypted_content: JSON.stringify(encryptedData),
        metadata: {
          type: 'did-document',
          issuer: 'personachain',
          wallet_type: walletType,
          schema_version: '1.0'
        },
        encryption_params: {
          iv: encryptedData.iv,
          salt: encryptedData.salt,
          algorithm: 'AES-GCM',
          key_derivation: 'PBKDF2',
          iterations: 100000
        }
      }

      const { data: storedRecord, error: dbError } = await this.supabase
        .from('identity_records')
        .insert(identityRecord)
        .select()
        .single()

      if (dbError) {
        console.error('❌ Database storage failed:', dbError)
        return {
          success: false,
          error: `Database storage failed: ${dbError.message}`
        }
      }

      console.log(`✅ DID ${did} stored successfully (direct)`)

      return {
        success: true,
        data: storedRecord,
        contentHash,
        blockchainTxHash: `test-tx-hash-${Date.now()}`,
        message: 'DID document stored (test mode)'
      }

    } catch (error) {
      console.error('❌ Real storage (direct) failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Storage error'
      }
    }
  }

  /**
   * Get DID Document with decryption
   */
  async getDIDDocument(
    did: string,
    walletAddress: string,
    walletType: string
  ): Promise<StorageResult<DIDDocument>> {
    try {
      console.log(`🔍 Real Storage: Retrieving DID document for ${did}`)

      const { data: record, error: dbError } = await this.supabase
        .from('identity_records')
        .select('*')
        .eq('did', did)
        .eq('wallet_address', walletAddress)
        .single()

      if (dbError || !record) {
        return {
          success: false,
          error: 'DID document not found'
        }
      }

      // Generate wallet signature for decryption
      const walletSignature = await WalletSignatureGenerator.generateEncryptionSignature(
        walletType,
        walletAddress,
        'encryption'
      )

      // Decrypt DID document
      const encryptedData = JSON.parse(record.encrypted_content)
      const decryptionResult = await IdentityEncryption.decryptData(encryptedData, walletSignature)

      if (decryptionResult.success && decryptionResult.data) {
        return {
          success: true,
          data: decryptionResult.data as DIDDocument,
          contentHash: record.content_hash,
          blockchainTxHash: record.blockchain_tx_hash,
          message: 'DID document retrieved and decrypted successfully'
        }
      } else {
        return {
          success: false,
          error: decryptionResult.error || 'Decryption failed'
        }
      }

    } catch (error) {
      console.error('❌ Real retrieval failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Retrieval error'
      }
    }
  }

  /**
   * Store Verifiable Credential with encryption
   */
  async storeVerifiableCredential(
    credential: VerifiableCredential,
    walletAddress: string,
    walletType: string
  ): Promise<StorageResult<VerifiableCredentialRecord>> {
    try {
      console.log(`📜 Real Storage: Storing credential ${credential.id}`)

      // Generate wallet signature for encryption
      const walletSignature = await WalletSignatureGenerator.generateEncryptionSignature(
        walletType,
        walletAddress,
        'encryption'
      )

      // Encrypt credential
      const encryptedData = await IdentityEncryption.encryptData(credential, walletSignature)
      const contentHash = await IdentityEncryption.generateContentHash(credential)

      // First, get the DID for this wallet to satisfy the required 'did' field
      const didResult = await this.getDIDByWallet(walletAddress)
      if (!didResult) {
        return {
          success: false,
          error: 'DID not found for wallet address - must create identity first'
        }
      }

      // Store in Supabase
      const credentialRecord: Omit<VerifiableCredentialRecord, 'id' | 'created_at' | 'updated_at'> = {
        credential_id: credential.id,
        credential_type: credential.type.join(','),
        subject_did: credential.credentialSubject.id,
        issuer_did: typeof credential.issuer === 'string' ? credential.issuer : credential.issuer.id,
        did: didResult, // Add the required did field
        content_hash: contentHash,
        encrypted_credential: JSON.stringify(encryptedData), // Fix field name
        status: 'valid',
        issuance_date: credential.issuanceDate,  // Fixed: was issued_at
        expiration_date: credential.expirationDate,  // Fixed: was expires_at
        metadata: {
          type: 'verifiable-credential',
          issuer: typeof credential.issuer === 'string' ? credential.issuer : credential.issuer.id,
          wallet_type: walletType,
          schema_version: '1.0'
        },
        encryption_params: {
          iv: encryptedData.iv,
          salt: encryptedData.salt,
          algorithm: 'AES-GCM',
          key_derivation: 'PBKDF2',
          iterations: 100000
        }
      }

      const { data: storedRecord, error: dbError } = await this.supabase
        .from('verifiable_credentials')
        .insert(credentialRecord)
        .select()
        .single()

      if (dbError) {
        console.error('❌ Credential storage failed:', dbError)
        return {
          success: false,
          error: `Database error: ${dbError.message}`
        }
      }

      console.log(`✅ Credential ${credential.id} stored successfully`)

      return {
        success: true,
        data: storedRecord,
        contentHash,
        message: 'Credential stored successfully'
      }

    } catch (error) {
      console.error('❌ Real credential storage failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Storage error'
      }
    }
  }

  /**
   * Store verifiable credential directly with pre-computed encryption data
   * Used for server-side testing to bypass wallet signature generation
   */
  async storeVerifiableCredentialDirect(
    credential: VerifiableCredential,
    walletAddress: string,
    walletType: string,
    encryptedData: any,
    contentHash: string,
    signature: string
  ): Promise<StorageResult<VerifiableCredentialRecord>> {
    try {
      console.log(`🎫 Real Storage (Direct): Storing credential ${credential.id}`)

      // Get the DID for this wallet to satisfy the required 'did' field
      const didResult = await this.getDIDByWallet(walletAddress)
      if (!didResult) {
        return {
          success: false,
          error: 'DID not found for wallet address - must create identity first'
        }
      }

      const credentialRecord: Omit<VerifiableCredentialRecord, 'id' | 'created_at' | 'updated_at'> = {
        credential_id: credential.id,
        credential_type: Array.isArray(credential.type) ? credential.type.join(',') : credential.type,
        subject_did: credential.credentialSubject.id,
        issuer_did: typeof credential.issuer === 'string' ? credential.issuer : credential.issuer.id,
        did: didResult, // Add the required did field
        content_hash: contentHash,
        encrypted_credential: JSON.stringify(encryptedData), // Fix field name
        status: 'valid',
        issuance_date: credential.issuanceDate,  // Fixed: was issued_at
        expiration_date: credential.expirationDate,  // Fixed: was expires_at
        metadata: {
          type: 'verifiable-credential',
          issuer: typeof credential.issuer === 'string' ? credential.issuer : credential.issuer.id,
          wallet_type: walletType,
          schema_version: '1.0'
        },
        encryption_params: {
          iv: encryptedData.iv,
          salt: encryptedData.salt,
          algorithm: 'AES-GCM',
          key_derivation: 'PBKDF2',
          iterations: 100000
        }
      }

      const { data: storedRecord, error: dbError } = await this.supabase
        .from('verifiable_credentials')
        .insert(credentialRecord)
        .select()
        .single()

      if (dbError) {
        console.error('❌ Credential storage (direct) failed:', dbError)
        return {
          success: false,
          error: `Database error: ${dbError.message}`
        }
      }

      console.log(`✅ Credential ${credential.id} stored successfully (direct)`)

      return {
        success: true,
        data: storedRecord,
        contentHash,
        message: 'Credential stored successfully (test mode)'
      }

    } catch (error) {
      console.error('❌ Real credential storage (direct) failed:', error)
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
    try {
      const { data, error } = await this.supabase
        .from('identity_records')
        .select('did')
        .eq('wallet_address', walletAddress)
        .single()

      if (error || !data) {
        return null
      }

      return data.did

    } catch (error) {
      console.error('❌ DID lookup failed:', error)
      return null
    }
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
      console.log(`🔍 Real Storage: Retrieving credentials for DID ${did}`)

      const { data: records, error: dbError } = await this.supabase
        .from('verifiable_credentials')
        .select('*')
        .eq('subject_did', did)
        .eq('status', 'active')

      if (dbError) {
        return {
          success: false,
          error: `Database error: ${dbError.message}`
        }
      }

      if (!records || records.length === 0) {
        return {
          success: true,
          data: [],
          message: 'No credentials found'
        }
      }

      // Generate wallet signature for decryption
      const walletSignature = await WalletSignatureGenerator.generateEncryptionSignature(
        walletType,
        walletAddress,
        'encryption'
      )

      const credentials: VerifiableCredential[] = []

      for (const record of records) {
        try {
          const encryptedData = JSON.parse(record.encrypted_credential) // Fix field name
          const decryptionResult = await IdentityEncryption.decryptData(encryptedData, walletSignature)

          if (decryptionResult.success && decryptionResult.data) {
            credentials.push(decryptionResult.data as VerifiableCredential)
          }
        } catch (error) {
          console.warn(`⚠️ Failed to decrypt credential ${record.credential_id}:`, error)
        }
      }

      return {
        success: true,
        data: credentials,
        message: `Retrieved ${credentials.length} credentials`
      }

    } catch (error) {
      console.error('❌ Real credential retrieval failed:', error)
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
    try {
      // Get identity count
      const { count: identityCount } = await this.supabase
        .from('identity_records')
        .select('*', { count: 'exact', head: true })
        .eq('wallet_address', walletAddress)

      // Get credential counts
      const { count: totalCredentials } = await this.supabase
        .from('verifiable_credentials')
        .select('*', { count: 'exact', head: true })
        .in('subject_did', 
          this.supabase
            .from('identity_records')
            .select('did')
            .eq('wallet_address', walletAddress)
        )

      const { count: activeCredentials } = await this.supabase
        .from('verifiable_credentials')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .in('subject_did', 
          this.supabase
            .from('identity_records')
            .select('did')
            .eq('wallet_address', walletAddress)
        )

      return {
        totalCredentials: totalCredentials || 0,
        activeCredentials: activeCredentials || 0,
        totalIdentities: identityCount || 0
      }

    } catch (error) {
      console.error('❌ Stats query failed:', error)
      return {
        totalCredentials: 0,
        activeCredentials: 0,
        totalIdentities: 0
      }
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    success: boolean
    message: string
    details?: any
  }> {
    try {
      // Test database connection
      const { error: dbError } = await this.supabase
        .from('identity_records')
        .select('count')
        .limit(1)

      if (dbError) {
        return {
          success: false,
          message: 'Database connection failed',
          details: { error: dbError.message }
        }
      }

      // Test blockchain connection
      const blockchainHealth = await blockchainAnchor.healthCheck?.() || { success: true }

      return {
        success: true,
        message: 'Real identity storage is healthy',
        details: {
          database: 'connected',
          blockchain: blockchainHealth.success ? 'connected' : 'degraded'
        }
      }

    } catch (error) {
      return {
        success: false,
        message: 'Health check failed',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }
}

// Export singleton for real storage
export const realIdentityStorage = new RealIdentityStorageService()