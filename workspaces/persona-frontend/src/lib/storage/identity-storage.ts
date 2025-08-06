// Web3 Identity Storage Service
// Hybrid architecture: PersonaChain + Encrypted Supabase + Client-side control

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { IdentityEncryption, WalletSignatureGenerator } from '../encryption'
import { 
  getSupabaseConfig, 
  IdentityRecord, 
  VerifiableCredentialRecord, 
  ZKProofRecord,
  SessionRecord 
} from './supabase-config'

export interface DIDDocument {
  '@context': string[]
  id: string
  verificationMethod: Array<{
    id: string
    type: string
    controller: string
    publicKeyMultibase?: string
    blockchainAccountId?: string
  }>
  authentication: string[]
  assertionMethod: string[]
  service?: Array<{
    id: string
    type: string
    serviceEndpoint: string
  }>
  created: string
  updated?: string
}

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
    signature?: string
    blockchainTxHash?: string
  }
}

export interface StorageResult<T = any> {
  success: boolean
  data?: T
  error?: string
  contentHash?: string
  blockchainAnchor?: {
    txHash?: string
    blockHeight?: number
    network: string
  }
}

/**
 * Web3 Identity Storage Service
 * Provides encrypted storage with blockchain anchoring
 */
export class IdentityStorageService {
  private supabase: SupabaseClient
  private static instance: IdentityStorageService

  constructor() {
    const config = getSupabaseConfig()
    this.supabase = createClient(config.url, config.anonKey)
  }

  static getInstance(): IdentityStorageService {
    if (!IdentityStorageService.instance) {
      IdentityStorageService.instance = new IdentityStorageService()
    }
    return IdentityStorageService.instance
  }

  /**
   * Store DID Document with encryption
   */
  async storeDIDDocument(
    did: string,
    walletAddress: string,
    walletType: string,
    didDocument: DIDDocument,
    blockchainTxHash?: string
  ): Promise<StorageResult<IdentityRecord>> {
    try {
      console.log(`🔐 Storing encrypted DID document: ${did}`)

      // Generate encryption key from wallet signature
      const encryptionSignature = await WalletSignatureGenerator.generateEncryptionSignature(
        walletType,
        walletAddress,
        'encryption'
      )

      // Encrypt the DID document
      const encryptedData = await IdentityEncryption.encryptData(didDocument, encryptionSignature)
      
      // Generate content hash for blockchain
      const contentHash = await IdentityEncryption.generateContentHash(didDocument)

      // Store encrypted data in Supabase
      const record: Partial<IdentityRecord> = {
        did,
        wallet_address: walletAddress,
        content_hash: contentHash,
        encrypted_content: encryptedData.encryptedContent,
        metadata: {
          type: 'DIDDocument',
          issuer: did,
          created_at: new Date().toISOString(),
          schema_version: '1.0'
        },
        encryption_params: {
          iv: encryptedData.iv,
          salt: encryptedData.salt,
          algorithm: 'AES-GCM',
          key_derivation: 'PBKDF2'
        }
      }

      const { data, error } = await this.supabase
        .from('identity_records')
        .upsert(record, { onConflict: 'did' })
        .select()
        .single()

      if (error) {
        console.error('❌ Supabase storage error:', error)
        return { success: false, error: error.message }
      }

      // Log audit event
      await this.logAuditEvent('did_stored', 'identity_record', did, walletAddress)

      console.log(`✅ DID document stored successfully: ${did}`)
      return {
        success: true,
        data: data as IdentityRecord,
        contentHash,
        blockchainAnchor: {
          txHash: blockchainTxHash,
          network: 'personachain-1'
        }
      }

    } catch (error) {
      console.error('❌ DID storage failed:', error)
      await this.logAuditEvent('did_storage_failed', 'identity_record', did, walletAddress, error)
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Storage failed'
      }
    }
  }

  /**
   * Retrieve and decrypt DID Document
   */
  async getDIDDocument(
    did: string,
    walletAddress: string,
    walletType: string
  ): Promise<StorageResult<DIDDocument>> {
    try {
      console.log(`🔍 Retrieving DID document: ${did}`)

      // Fetch encrypted record from Supabase
      const { data: record, error } = await this.supabase
        .from('identity_records')
        .select('*')
        .eq('did', did)
        .single()

      if (error || !record) {
        console.log(`📭 DID not found: ${did}`)
        return { success: false, error: 'DID not found' }
      }

      // Generate decryption key from wallet signature
      const encryptionSignature = await WalletSignatureGenerator.generateEncryptionSignature(
        walletType,
        walletAddress,
        'encryption'
      )

      // Decrypt the DID document
      const encryptedData = {
        encryptedContent: record.encrypted_content,
        iv: record.encryption_params.iv,
        salt: record.encryption_params.salt,
        keyDerivationParams: {
          iterations: 100000,
          algorithm: 'PBKDF2'
        }
      }

      const decryptionResult = await IdentityEncryption.decryptData(encryptedData, encryptionSignature)

      if (!decryptionResult.success) {
        console.error('❌ Decryption failed:', decryptionResult.error)
        return { success: false, error: 'Decryption failed' }
      }

      // Verify content integrity
      const isValid = await IdentityEncryption.verifyContentHash(
        decryptionResult.data,
        record.content_hash
      )

      if (!isValid) {
        console.error('❌ Content integrity check failed')
        return { success: false, error: 'Content integrity verification failed' }
      }

      console.log(`✅ DID document retrieved successfully: ${did}`)
      return {
        success: true,
        data: decryptionResult.data as DIDDocument,
        contentHash: record.content_hash
      }

    } catch (error) {
      console.error('❌ DID retrieval failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Retrieval failed'
      }
    }
  }

  /**
   * Store Verifiable Credential with encryption
   */
  async storeVerifiableCredential(
    credential: VerifiableCredential,
    walletAddress: string,
    walletType: string,
    blockchainTxHash?: string
  ): Promise<StorageResult<VerifiableCredentialRecord>> {
    try {
      console.log(`🔐 Storing encrypted VC: ${credential.id}`)

      // Generate encryption key from wallet signature
      const encryptionSignature = await WalletSignatureGenerator.generateEncryptionSignature(
        walletType,
        walletAddress,
        'encryption'
      )

      // Encrypt the credential
      const encryptedData = await IdentityEncryption.encryptData(credential, encryptionSignature)
      
      // Generate content hash
      const contentHash = await IdentityEncryption.generateContentHash(credential)

      // Extract credential metadata
      const issuerDid = typeof credential.issuer === 'string' ? credential.issuer : credential.issuer.id
      const subjectDid = credential.credentialSubject.id

      const record: Partial<VerifiableCredentialRecord> = {
        credential_id: credential.id,
        did: subjectDid,
        content_hash: contentHash,
        encrypted_credential: encryptedData.encryptedContent,
        credential_type: Array.isArray(credential.type) ? credential.type.join(',') : credential.type,
        issuer_did: issuerDid,
        subject_did: subjectDid,
        issuance_date: credential.issuanceDate,
        expiration_date: credential.expirationDate,
        status: 'valid',
        encryption_params: {
          iv: encryptedData.iv,
          salt: encryptedData.salt,
          algorithm: 'AES-GCM'
        },
        blockchain_anchor: {
          tx_hash: blockchainTxHash,
          network: 'personachain-1'
        }
      }

      const { data, error } = await this.supabase
        .from('verifiable_credentials')
        .upsert(record, { onConflict: 'credential_id' })
        .select()
        .single()

      if (error) {
        console.error('❌ VC storage error:', error)
        return { success: false, error: error.message }
      }

      await this.logAuditEvent('vc_stored', 'verifiable_credential', credential.id, walletAddress)

      console.log(`✅ VC stored successfully: ${credential.id}`)
      return {
        success: true,
        data: data as VerifiableCredentialRecord,
        contentHash,
        blockchainAnchor: {
          txHash: blockchainTxHash,
          network: 'personachain-1'
        }
      }

    } catch (error) {
      console.error('❌ VC storage failed:', error)
      await this.logAuditEvent('vc_storage_failed', 'verifiable_credential', credential.id, walletAddress, error)
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'VC storage failed'
      }
    }
  }

  /**
   * Get all Verifiable Credentials for a DID
   */
  async getVerifiableCredentials(
    did: string,
    walletAddress: string,
    walletType: string
  ): Promise<StorageResult<VerifiableCredential[]>> {
    try {
      console.log(`🔍 Retrieving VCs for DID: ${did}`)

      const { data: records, error } = await this.supabase
        .from('verifiable_credentials')
        .select('*')
        .eq('did', did)
        .eq('status', 'valid')
        .order('created_at', { ascending: false })

      if (error) {
        return { success: false, error: error.message }
      }

      if (!records || records.length === 0) {
        return { success: true, data: [] }
      }

      // Generate decryption key
      const encryptionSignature = await WalletSignatureGenerator.generateEncryptionSignature(
        walletType,
        walletAddress,
        'encryption'
      )

      // Decrypt all credentials
      const decryptedCredentials: VerifiableCredential[] = []

      for (const record of records) {
        try {
          const encryptedData = {
            encryptedContent: record.encrypted_credential,
            iv: record.encryption_params.iv,
            salt: record.encryption_params.salt,
            keyDerivationParams: {
              iterations: 100000,
              algorithm: 'PBKDF2'
            }
          }

          const decryptionResult = await IdentityEncryption.decryptData(encryptedData, encryptionSignature)

          if (decryptionResult.success && decryptionResult.data) {
            decryptedCredentials.push(decryptionResult.data as VerifiableCredential)
          }
        } catch (decryptError) {
          console.warn(`⚠️ Failed to decrypt credential ${record.credential_id}:`, decryptError)
        }
      }

      console.log(`✅ Retrieved ${decryptedCredentials.length} VCs for ${did}`)
      return { success: true, data: decryptedCredentials }

    } catch (error) {
      console.error('❌ VC retrieval failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'VC retrieval failed'
      }
    }
  }

  /**
   * Check if DID exists
   */
  async checkDIDExists(did: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('identity_records')
        .select('did')
        .eq('did', did)
        .single()

      return !error && !!data
    } catch (error) {
      return false
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

      return error ? null : data?.did || null
    } catch (error) {
      return null
    }
  }

  /**
   * Log audit events for compliance and security
   */
  private async logAuditEvent(
    eventType: string,
    entityType: string,
    entityId: string,
    walletAddress: string,
    error?: any
  ): Promise<void> {
    try {
      await this.supabase
        .from('audit_log')
        .insert({
          event_type: eventType,
          entity_type: entityType,
          entity_id: entityId,
          actor_wallet_address: walletAddress,
          result: error ? 'error' : 'success',
          error_message: error ? (error instanceof Error ? error.message : String(error)) : null,
          event_data: {}
        })
    } catch (auditError) {
      console.warn('⚠️ Audit logging failed:', auditError)
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(walletAddress: string): Promise<{
    totalDIDs: number
    totalCredentials: number
    totalProofs: number
    storageUsed: string
  }> {
    try {
      const [didsResult, credentialsResult, proofsResult] = await Promise.all([
        this.supabase.from('identity_records').select('id', { count: 'exact' }).eq('wallet_address', walletAddress),
        this.supabase.from('verifiable_credentials').select('id', { count: 'exact' }).eq('did', await this.getDIDByWallet(walletAddress) || ''),
        this.supabase.from('zk_proofs').select('id', { count: 'exact' })
      ])

      return {
        totalDIDs: didsResult.count || 0,
        totalCredentials: credentialsResult.count || 0,
        totalProofs: proofsResult.count || 0,
        storageUsed: 'Encrypted cloud storage'
      }
    } catch (error) {
      return {
        totalDIDs: 0,
        totalCredentials: 0,
        totalProofs: 0,
        storageUsed: 'Unknown'
      }
    }
  }
}

// Export singleton instance
export const identityStorage = IdentityStorageService.getInstance()