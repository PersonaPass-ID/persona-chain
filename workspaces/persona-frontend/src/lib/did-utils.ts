/**
 * DID Utilities - PersonaChain DID operations
 */

export interface DIDDocument {
  id: string
  context: string[]
  verificationMethod: VerificationMethod[]
  authentication: string[]
  assertionMethod: string[]
  capabilityInvocation: string[]
  capabilityDelegation: string[]
  service?: ServiceEndpoint[]
  created: string
  updated: string
}

export interface VerificationMethod {
  id: string
  type: string
  controller: string
  publicKeyMultibase?: string
  publicKeyJwk?: any
  blockchainAccountId?: string
}

export interface ServiceEndpoint {
  id: string
  type: string
  serviceEndpoint: string
}

export interface CreateDIDParams {
  publicKey: string
  address: string
  chainId?: string
}

export interface CreateDIDResult {
  did: string
  document: DIDDocument
  txHash?: string
  blockHeight?: number
}

/**
 * Generate a PersonaChain DID from wallet address
 */
export function generatePersonaChainDID(address: string, chainId: string = 'personachain-1'): string {
  return `did:persona:${chainId}:${address}`
}

/**
 * Parse a PersonaChain DID to extract components
 */
export function parsePersonaChainDID(did: string): {
  method: string
  chainId: string
  address: string
} | null {
  const match = did.match(/^did:persona:([^:]+):(.+)$/)
  if (!match) return null
  
  return {
    method: 'persona',
    chainId: match[1],
    address: match[2]
  }
}

/**
 * Create a basic DID document structure
 */
export function createDIDDocument(params: CreateDIDParams): DIDDocument {
  const { publicKey, address, chainId = 'personachain-1' } = params
  const did = generatePersonaChainDID(address, chainId)
  const timestamp = new Date().toISOString()
  
  return {
    id: did,
    context: [
      'https://www.w3.org/ns/did/v1',
      'https://w3id.org/security/suites/secp256k1-2019/v1'
    ],
    verificationMethod: [
      {
        id: `${did}#key-1`,
        type: 'EcdsaSecp256k1VerificationKey2019',
        controller: did,
        publicKeyMultibase: publicKey,
        blockchainAccountId: `cosmos:${chainId}:${address}`
      }
    ],
    authentication: [`${did}#key-1`],
    assertionMethod: [`${did}#key-1`],
    capabilityInvocation: [`${did}#key-1`],
    capabilityDelegation: [`${did}#key-1`],
    created: timestamp,
    updated: timestamp
  }
}

/**
 * Validate DID format
 */
export function isValidPersonaChainDID(did: string): boolean {
  return /^did:persona:[^:]+:.+$/.test(did)
}

/**
 * Create authentication proof for DID operations
 */
export function createAuthProof(did: string, challenge: string, privateKey: string): {
  type: string
  challenge: string
  domain: string
  proofPurpose: string
  verificationMethod: string
  created: string
  signature: string
} {
  // This would normally use the actual private key to sign
  // For now, return a mock structure
  return {
    type: 'EcdsaSecp256k1Signature2019',
    challenge,
    domain: 'personachain.io',
    proofPurpose: 'authentication',
    verificationMethod: `${did}#key-1`,
    created: new Date().toISOString(),
    signature: 'mock-signature-' + Date.now()
  }
}

/**
 * Mock PersonaChain RPC client
 */
export class PersonaChainRPCClient {
  private endpoint: string

  constructor(endpoint: string = 'http://54.92.180.187:26657') {
    this.endpoint = endpoint
  }

  async createDID(params: CreateDIDParams): Promise<CreateDIDResult> {
    const document = createDIDDocument(params)
    
    // Mock blockchain interaction
    const txHash = 'mock-tx-' + Date.now()
    const blockHeight = 1000 + Math.floor(Math.random() * 1000)
    
    console.log('Creating DID on PersonaChain:', document.id)
    
    return {
      did: document.id,
      document,
      txHash,
      blockHeight
    }
  }

  async resolveDID(did: string): Promise<DIDDocument | null> {
    if (!isValidPersonaChainDID(did)) {
      throw new Error('Invalid PersonaChain DID format')
    }

    // Mock resolution
    const parsed = parsePersonaChainDID(did)
    if (!parsed) return null

    return createDIDDocument({
      publicKey: 'mock-public-key',
      address: parsed.address,
      chainId: parsed.chainId
    })
  }

  async updateDID(did: string, updates: Partial<DIDDocument>): Promise<CreateDIDResult> {
    const existing = await this.resolveDID(did)
    if (!existing) {
      throw new Error('DID not found')
    }

    const updatedDocument = {
      ...existing,
      ...updates,
      updated: new Date().toISOString()
    }

    const txHash = 'update-tx-' + Date.now()
    const blockHeight = 1000 + Math.floor(Math.random() * 1000)

    return {
      did,
      document: updatedDocument,
      txHash,
      blockHeight
    }
  }

  async deactivateDID(did: string): Promise<{ txHash: string; blockHeight: number }> {
    console.log('Deactivating DID:', did)
    
    return {
      txHash: 'deactivate-tx-' + Date.now(),
      blockHeight: 1000 + Math.floor(Math.random() * 1000)
    }
  }
}

// Export default RPC client instance
export const rpcClient = new PersonaChainRPCClient()

// Helper functions for common operations
export async function createPersonaChainDID(walletAddress: string, publicKey: string): Promise<CreateDIDResult> {
  return rpcClient.createDID({
    publicKey,
    address: walletAddress
  })
}

export async function resolvePersonaChainDID(did: string): Promise<DIDDocument | null> {
  return rpcClient.resolveDID(did)
}

/**
 * Generate a new DID with random wallet address (for testing)
 */
export async function generateNewDID(): Promise<CreateDIDResult> {
  // Generate a mock wallet address for testing
  const mockAddress = 'cosmos1' + Math.random().toString(36).substring(2, 41)
  const mockPublicKey = 'mock-pubkey-' + Date.now()
  
  return createPersonaChainDID(mockAddress, mockPublicKey)
}