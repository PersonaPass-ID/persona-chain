// Test DID Resolver using Mock Storage
// Bypasses actual Supabase and PersonaChain for testing

import { testIdentityStorage } from './storage/test-identity-storage'
import { blockchainAnchor } from './storage/blockchain-anchor'
import { DIDDocument } from './storage/identity-storage'

export interface DIDCreationParams {
  walletAddress: string
  walletType: 'keplr' | 'leap'
  firstName: string
  lastName: string
  publicKey?: string
  serviceEndpoints?: Array<{
    id: string
    type: string
    serviceEndpoint: string
  }>
}

export interface DIDCreationResult {
  success: boolean
  did?: string
  didDocument?: DIDDocument
  txHash?: string
  contentHash?: string
  error?: string
}

export interface DIDResolutionResult {
  success: boolean
  didDocument?: DIDDocument
  contentHash?: string
  blockchainAnchor?: {
    txHash: string
    blockHeight: number
    network: string
  }
  error?: string
}

/**
 * Test DID Resolver Service with Mock Storage
 */
export class TestDIDResolverService {
  /**
   * Create a new DID with test storage
   */
  static async createDID(params: DIDCreationParams): Promise<DIDCreationResult> {
    try {
      console.log(`🧪 Test DID Resolver: Creating DID for ${params.walletAddress}`)

      // Generate test DID
      const timestamp = Date.now()
      const randomSuffix = Math.random().toString(36).substring(2, 8)
      const did = `did:persona:test:${timestamp}:${randomSuffix}`

      // Create DID Document
      const didDocument: DIDDocument = {
        '@context': [
          'https://www.w3.org/ns/did/v1',
          'https://personapass.org/contexts/identity/v1'
        ],
        id: did,
        verificationMethod: [{
          id: did + '#key-1',
          type: 'EcdsaSecp256k1VerificationKey2019',
          controller: did,
          publicKeyMultibase: params.publicKey || 'test-key-' + timestamp,
          blockchainAccountId: `${params.walletAddress}@personachain-1`
        }],
        authentication: [did + '#key-1'],
        assertionMethod: [did + '#key-1'],
        service: params.serviceEndpoints || [{
          id: did + '#personapass',
          type: 'PersonaPassService',
          serviceEndpoint: 'https://personapass.org/services/identity'
        }],
        created: new Date().toISOString()
      }

      // Store DID document using test storage
      const storageResult = await testIdentityStorage.storeDIDDocument(
        did,
        params.walletAddress,
        params.walletType,
        didDocument
      )

      if (!storageResult.success) {
        return {
          success: false,
          error: storageResult.error || 'Failed to store DID document'
        }
      }

      // Anchor to blockchain (this will use fallback mode)
      const anchorResult = await blockchainAnchor.anchorDIDCreation(
        did,
        params.walletAddress,
        storageResult.contentHash!,
        didDocument
      )

      console.log(`✅ Test DID created successfully: ${did}`)
      
      return {
        success: true,
        did,
        didDocument,
        txHash: anchorResult.txHash,
        contentHash: storageResult.contentHash
      }

    } catch (error) {
      console.error('❌ Test DID creation failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'DID creation failed'
      }
    }
  }

  /**
   * Resolve a DID with test storage
   */
  static async resolveDID(did: string, walletAddress?: string, walletType?: string): Promise<DIDResolutionResult> {
    try {
      console.log(`🧪 Test DID Resolver: Resolving DID ${did}`)

      if (!walletAddress || !walletType) {
        return {
          success: false,
          error: 'Wallet address and type required for test resolution'
        }
      }

      // Get DID document from test storage
      const storageResult = await testIdentityStorage.getDIDDocument(did, walletAddress, walletType)

      if (!storageResult.success) {
        return {
          success: false,
          error: storageResult.error || 'DID not found in test storage'
        }
      }

      // Try to get blockchain anchor info
      const anchorResult = await blockchainAnchor.resolveDID(did)

      return {
        success: true,
        didDocument: storageResult.data!,
        contentHash: storageResult.contentHash,
        blockchainAnchor: anchorResult.success && anchorResult.anchor ? {
          txHash: 'test-tx-hash',
          blockHeight: Math.floor(Date.now() / 1000),
          network: 'personachain-1-test'
        } : undefined
      }

    } catch (error) {
      console.error('❌ Test DID resolution failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'DID resolution failed'
      }
    }
  }

  /**
   * Update DID with test storage
   */
  static async updateDID(
    did: string,
    walletAddress: string,
    walletType: string,
    updates: Partial<DIDDocument>
  ): Promise<DIDCreationResult> {
    try {
      console.log(`🧪 Test DID Resolver: Updating DID ${did}`)

      // Get current DID document
      const currentResult = await this.resolveDID(did, walletAddress, walletType)
      
      if (!currentResult.success) {
        return {
          success: false,
          error: currentResult.error || 'DID not found for update'
        }
      }

      // Apply updates
      const updatedDocument: DIDDocument = {
        ...currentResult.didDocument!,
        ...updates,
        updated: new Date().toISOString()
      }

      // Store updated document
      const storageResult = await testIdentityStorage.storeDIDDocument(
        did,
        walletAddress,
        walletType,
        updatedDocument
      )

      if (!storageResult.success) {
        return {
          success: false,
          error: storageResult.error || 'Failed to update DID document'
        }
      }

      // Anchor update to blockchain
      const anchorResult = await blockchainAnchor.anchorDIDCreation(
        did,
        walletAddress,
        storageResult.contentHash!,
        updatedDocument
      )

      console.log(`✅ Test DID updated successfully: ${did}`)
      
      return {
        success: true,
        did,
        didDocument: updatedDocument,
        txHash: anchorResult.txHash,
        contentHash: storageResult.contentHash
      }

    } catch (error) {
      console.error('❌ Test DID update failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'DID update failed'
      }
    }
  }
}

// Export singleton for convenience
export const testDIDResolver = new TestDIDResolverService()