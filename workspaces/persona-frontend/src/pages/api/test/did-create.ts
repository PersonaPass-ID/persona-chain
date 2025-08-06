import { NextApiRequest, NextApiResponse } from 'next'
import { TestDIDResolverService, DIDCreationParams } from '../../../lib/test-did-resolver'
import { VerifiableCredential } from '../../../lib/storage/identity-storage'

interface TestCreateDIDRequest {
  walletAddress: string
  walletType: 'keplr' | 'leap'
  firstName: string
  lastName: string
  publicKey?: string
}

interface TestCreateDIDResponse {
  success: boolean
  did?: string
  didDocument?: any
  txHash?: string
  contentHash?: string
  credential?: VerifiableCredential
  message?: string
  error?: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<TestCreateDIDResponse>) {
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
      publicKey 
    }: TestCreateDIDRequest = req.body

    if (!walletAddress || !walletType || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: walletAddress, walletType, firstName, lastName'
      })
    }

    console.log(`🧪 Testing DID creation for wallet: ${walletAddress}`)

    // Create DID using the test DID resolver system
    const creationParams: DIDCreationParams = {
      walletAddress,
      walletType,
      firstName,
      lastName,
      publicKey: publicKey || 'test-public-key-' + Date.now()
    }

    const result = await TestDIDResolverService.createDID(creationParams)

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
        id: `cred_test_identity_${Date.now()}`,
        type: ['VerifiableCredential', 'IdentityCredential'],
        issuer: 'did:persona:personachain',
        issuanceDate: new Date().toISOString(),
        credentialSubject: {
          id: result.did!,
          firstName,
          lastName,
          walletAddress,
          walletType,
          verificationMethod: 'wallet-signature-test',
          issuedAt: new Date().toISOString(),
          testMode: true
        },
        proof: {
          type: 'Ed25519Signature2018',
          created: new Date().toISOString(),
          proofPurpose: 'assertionMethod',
          verificationMethod: result.did! + '#key-1',
          blockchainTxHash: result.txHash,
          signature: `test_signature_${Date.now()}`
        }
      }

      const response: TestCreateDIDResponse = {
        success: true,
        did: result.did,
        didDocument: result.didDocument,
        txHash: result.txHash,
        contentHash: result.contentHash,
        credential: identityCredential,
        message: 'Test DID created successfully with Web3 hybrid storage (PersonaChain + encrypted Supabase)'
      }

      console.log(`✅ Test DID creation completed: ${result.did}`)
      return res.status(200).json(response)

  } catch (error) {
    console.error('❌ Test DID creation failed:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    })
  }
}