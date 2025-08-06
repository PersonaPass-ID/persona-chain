import { NextApiRequest, NextApiResponse } from 'next'
import { DIDResolverService, DIDCreationParams } from '../../../lib/did-resolver'
import { VerifiableCredential } from '../../../lib/storage/identity-storage'

interface CreateDIDRequest {
  walletAddress: string
  walletType: 'keplr' | 'leap'
  firstName?: string
  lastName?: string
  publicKey?: string
  serviceEndpoints?: Array<{
    id: string
    type: string
    serviceEndpoint: string
  }>
}

interface CreateDIDResponse {
  success: boolean
  did?: string
  didDocument?: any
  txHash?: string
  contentHash?: string
  credential?: VerifiableCredential
  message?: string
  error?: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<CreateDIDResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    })
  }

  try {
    const { 
      walletAddress, 
      walletType, 
      firstName, 
      lastName, 
      publicKey, 
      serviceEndpoints 
    }: CreateDIDRequest = req.body

    if (!walletAddress || !walletType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: walletAddress, walletType'
      })
    }

    console.log(`🆔 Creating DID using hybrid storage for wallet: ${walletAddress}`)

    // Create DID using the new hybrid storage system
    const creationParams: DIDCreationParams = {
      walletAddress,
      walletType,
      firstName: firstName || 'PersonaPass',
      lastName: lastName || 'User',
      publicKey,
      serviceEndpoints
    }

    const result = await DIDResolverService.createDID(creationParams)

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error || 'DID creation failed'
      })
    }

    // Create a basic identity credential for the new DID
    const identityCredential: VerifiableCredential = {
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://personapass.org/contexts/identity/v1'
      ],
      id: `cred_identity_${Date.now()}`,
      type: ['VerifiableCredential', 'IdentityCredential'],
      issuer: 'did:persona:personachain',
      issuanceDate: new Date().toISOString(),
      credentialSubject: {
        id: result.did!,
        firstName: firstName || 'PersonaPass',
        lastName: lastName || 'User',
        walletAddress,
        walletType,
        verificationMethod: 'wallet-signature',
        issuedAt: new Date().toISOString()
      },
      proof: {
        type: 'Ed25519Signature2018',
        created: new Date().toISOString(),
        proofPurpose: 'assertionMethod',
        verificationMethod: result.did! + '#key-1',
        blockchainTxHash: result.txHash,
        signature: `signature_${Date.now()}`
      }
    }

    const response: CreateDIDResponse = {
      success: true,
      did: result.did,
      didDocument: result.didDocument,
      txHash: result.txHash,
      contentHash: result.contentHash,
      credential: identityCredential,
      message: 'DID created successfully with Web3 hybrid storage (PersonaChain + encrypted Supabase)'
    }

    console.log(`✅ Web3 DID creation completed: ${result.did}`)
    return res.status(200).json(response)

  } catch (error) {
    console.error('❌ Web3 DID creation failed:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    })
  }
}