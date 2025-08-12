// Web3 DID Resolution Service
// Integrates PersonaChain blockchain with encrypted Supabase storage

import { identityStorage, DIDDocument, StorageResult } from './storage/identity-storage'
import { blockchainAnchor, BlockchainAnchor } from './storage/blockchain-anchor'

export interface DIDResolutionResult {
  '@context': string
  didDocument: DIDDocument | null
  didDocumentMetadata: {
    created?: string
    updated?: string
    deactivated?: boolean
    versionId?: string
    nextUpdate?: string
    nextVersionId?: string
    equivalentId?: string[]
    canonicalId?: string
  }
  didResolutionMetadata: {
    contentType: string
    retrieved: string
    duration?: number
    error?: string
    errorMessage?: string
  }
  blockchain?: {
    network: string
    txHash?: string
    blockHeight?: number
    contentHash?: string
  }
}

export interface DIDCreationParams {
  walletAddress: string
  walletType: string
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

/**
 * Web3 DID Resolver Service
 * Handles DID creation, resolution, and management across PersonaChain and Supabase
 */
export class DIDResolverService {
  private static readonly DID_METHOD = 'persona'
  private static readonly DID_PREFIX = `did:${DIDResolverService.DID_METHOD}:`

  /**
   * Create a new DID with Web3 identity storage
   */
  static async createDID(params: DIDCreationParams): Promise<DIDCreationResult> {
    const startTime = Date.now()
    
    try {
      console.log(`🆔 Creating new DID for wallet: ${params.walletAddress}`)

      // Generate DID identifier
      const didIdentifier = this.generateDIDIdentifier(params.walletAddress)
      const did = `${this.DID_PREFIX}${didIdentifier}`

      // Check if DID already exists
      const existingDID = await identityStorage.getDIDByWallet(params.walletAddress)
      if (existingDID) {
        console.log(`ℹ️ DID already exists: ${existingDID}`)
        return {
          success: false,
          error: 'DID already exists for this wallet address'
        }
      }

      // Create DID Document
      const didDocument = this.createDIDDocument({
        did,
        walletAddress: params.walletAddress,
        walletType: params.walletType,
        publicKey: params.publicKey,
        serviceEndpoints: params.serviceEndpoints
      })

      // Store encrypted DID document first
      const storageResult = await identityStorage.storeDIDDocument(
        did,
        params.walletAddress,
        params.walletType,
        didDocument
      )

      if (!storageResult.success) {
        console.error('❌ Failed to store DID document:', storageResult.error)
        return {
          success: false,
          error: storageResult.error || 'Failed to store DID document'
        }
      }

      // Anchor on PersonaChain blockchain
      const anchorResult = await blockchainAnchor.anchorDIDCreation(
        did,
        params.walletAddress,
        storageResult.contentHash!,
        didDocument
      )

      const duration = Date.now() - startTime
      console.log(`✅ DID created successfully in ${duration}ms: ${did}`)

      return {
        success: true,
        did,
        didDocument,
        txHash: anchorResult.txHash,
        contentHash: storageResult.contentHash
      }

    } catch (error) {
      console.error('❌ DID creation failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'DID creation failed'
      }
    }
  }

  /**
   * Resolve a DID to its DID Document
   */
  static async resolveDID(
    did: string,
    walletAddress?: string,
    walletType?: string
  ): Promise<DIDResolutionResult> {
    const startTime = Date.now()
    const retrieved = new Date().toISOString()

    try {
      console.log(`🔍 Resolving DID: ${did}`)

      // Validate DID format
      if (!this.isValidDID(did)) {
        return this.createErrorResult('invalidDid', 'Invalid DID format', retrieved, Date.now() - startTime)
      }

      // First try to resolve from blockchain
      let blockchainInfo: any = null
      try {
        const blockchainResult = await blockchainAnchor.resolveDID(did)
        if (blockchainResult.success && blockchainResult.anchor) {
          blockchainInfo = {
            network: 'personachain-1',
            contentHash: blockchainResult.anchor.contentHash,
            txHash: blockchainResult.transaction?.txHash,
            blockHeight: blockchainResult.transaction?.blockHeight
          }
        }
      } catch (blockchainError) {
        console.warn('⚠️ Blockchain resolution failed, continuing with storage lookup:', blockchainError)
      }

      // Resolve from encrypted storage
      let didDocument: DIDDocument | null = null
      let storageError: string | undefined

      if (walletAddress && walletType) {
        // User has authentication, can decrypt their data
        const storageResult = await identityStorage.getDIDDocument(did, walletAddress, walletType)
        
        if (storageResult.success && storageResult.data) {
          didDocument = storageResult.data
          
          // Verify blockchain content hash if available
          if (blockchainInfo?.contentHash && storageResult.contentHash) {
            if (blockchainInfo.contentHash !== storageResult.contentHash) {
              console.warn('⚠️ Content hash mismatch between blockchain and storage')
            }
          }
        } else {
          storageError = storageResult.error
        }
      } else {
        // Public resolution - can only provide basic DID document structure
        const exists = await identityStorage.checkDIDExists(did)
        if (exists) {
          didDocument = this.createPublicDIDDocument(did)
        } else {
          storageError = 'DID not found'
        }
      }

      const duration = Date.now() - startTime

      if (!didDocument && !blockchainInfo) {
        console.log(`📭 DID not found: ${did}`)
        return this.createErrorResult('notFound', storageError || 'DID not found', retrieved, duration)
      }

      // Create successful resolution result
      const result: DIDResolutionResult = {
        '@context': 'https://w3id.org/did-resolution/v1',
        didDocument,
        didDocumentMetadata: {
          created: didDocument?.created,
          updated: didDocument?.updated,
          deactivated: false
        },
        didResolutionMetadata: {
          contentType: 'application/did+ld+json',
          retrieved,
          duration
        }
      }

      if (blockchainInfo) {
        result.blockchain = blockchainInfo
      }

      console.log(`✅ DID resolved successfully in ${duration}ms: ${did}`)
      return result

    } catch (error) {
      console.error('❌ DID resolution failed:', error)
      const duration = Date.now() - startTime
      return this.createErrorResult(
        'internalError',
        error instanceof Error ? error.message : 'Resolution failed',
        retrieved,
        duration
      )
    }
  }

  /**
   * Update a DID Document
   */
  static async updateDID(
    did: string,
    walletAddress: string,
    walletType: string,
    updates: Partial<DIDDocument>
  ): Promise<DIDCreationResult> {
    try {
      console.log(`🔄 Updating DID: ${did}`)

      // Get existing DID document
      const existingResult = await identityStorage.getDIDDocument(did, walletAddress, walletType)
      
      if (!existingResult.success || !existingResult.data) {
        return {
          success: false,
          error: 'DID not found or access denied'
        }
      }

      // Merge updates
      const updatedDocument: DIDDocument = {
        ...existingResult.data,
        ...updates,
        updated: new Date().toISOString()
      }

      // Store updated document
      const storageResult = await identityStorage.storeDIDDocument(
        did,
        walletAddress,
        walletType,
        updatedDocument
      )

      if (!storageResult.success) {
        return {
          success: false,
          error: storageResult.error
        }
      }

      console.log(`✅ DID updated successfully: ${did}`)
      return {
        success: true,
        did,
        didDocument: updatedDocument,
        contentHash: storageResult.contentHash
      }

    } catch (error) {
      console.error('❌ DID update failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'DID update failed'
      }
    }
  }

  /**
   * Deactivate a DID
   */
  static async deactivateDID(
    did: string,
    walletAddress: string,
    walletType: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`🚫 Deactivating DID: ${did}`)

      // Update DID document to mark as deactivated
      const result = await this.updateDID(did, walletAddress, walletType, {
        // Clear sensitive methods while keeping the DID structure
        verificationMethod: [],
        authentication: [],
        assertionMethod: []
      })

      if (result.success) {
        console.log(`✅ DID deactivated: ${did}`)
        return { success: true }
      } else {
        return { success: false, error: result.error }
      }

    } catch (error) {
      console.error('❌ DID deactivation failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'DID deactivation failed'
      }
    }
  }

  /**
   * Generate DID identifier from wallet address
   */
  private static generateDIDIdentifier(walletAddress: string): string {
    // Use last 12 characters for readability while maintaining uniqueness
    return walletAddress.slice(-12).toLowerCase()
  }

  /**
   * Create a complete DID Document
   */
  private static createDIDDocument(params: {
    did: string
    walletAddress: string
    walletType: string
    publicKey?: string
    serviceEndpoints?: Array<{
      id: string
      type: string
      serviceEndpoint: string
    }>
  }): DIDDocument {
    const now = new Date().toISOString()

    return {
      '@context': [
        'https://www.w3.org/ns/did/v1',
        'https://w3id.org/security/suites/ed25519-2020/v1'
      ],
      id: params.did,
      verificationMethod: [{
        id: `${params.did}#key-1`,
        type: 'Ed25519VerificationKey2020',
        controller: params.did,
        publicKeyMultibase: params.publicKey || 'z6Mk...', // Placeholder
        blockchainAccountId: `cosmos:cosmoshub-4:${params.walletAddress}`
      }],
      authentication: [`${params.did}#key-1`],
      assertionMethod: [`${params.did}#key-1`],
      service: params.serviceEndpoints || [{
        id: `${params.did}#persona-service`,
        type: 'PersonaPassService',
        serviceEndpoint: 'https://personapass.org/api/did'
      }],
      created: now
    }
  }

  /**
   * Create public DID document (without private key access)
   */
  private static createPublicDIDDocument(did: string): DIDDocument {
    return {
      '@context': [
        'https://www.w3.org/ns/did/v1'
      ],
      id: did,
      verificationMethod: [],
      authentication: [],
      assertionMethod: [],
      created: new Date().toISOString()
    }
  }

  /**
   * Validate DID format
   */
  private static isValidDID(did: string): boolean {
    const didPattern = new RegExp(`^${this.DID_PREFIX}[a-z0-9]+$`)
    return didPattern.test(did)
  }

  /**
   * Create error resolution result
   */
  private static createErrorResult(
    error: string,
    errorMessage: string,
    retrieved: string,
    duration: number
  ): DIDResolutionResult {
    return {
      '@context': 'https://w3id.org/did-resolution/v1',
      didDocument: null,
      didDocumentMetadata: {},
      didResolutionMetadata: {
        contentType: 'application/did+ld+json',
        retrieved,
        duration,
        error,
        errorMessage
      }
    }
  }

  /**
   * Get DID method information
   */
  static getMethodInfo(): {
    method: string
    prefix: string
    description: string
    specification: string
  } {
    return {
      method: this.DID_METHOD,
      prefix: this.DID_PREFIX,
      description: 'PersonaPass Decentralized Identity Method',
      specification: 'https://personapass.org/did-method-specification'
    }
  }
}

// Export for convenience
export const didResolver = DIDResolverService