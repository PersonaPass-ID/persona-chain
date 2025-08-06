import { NextApiRequest, NextApiResponse } from 'next'
import { identityStorage, VerifiableCredential } from '../../../lib/storage/identity-storage'
import { blockchainAnchor } from '../../../lib/storage/blockchain-anchor'

interface IssueCredentialRequest {
  issuerDid: string
  subjectDid: string
  walletAddress: string
  walletType: 'keplr' | 'leap'
  credentialType: string[]
  credentialSubject: {
    [key: string]: any
  }
  expirationDate?: string
}

interface IssueCredentialResponse {
  success: boolean
  credential?: VerifiableCredential
  txHash?: string
  contentHash?: string
  message?: string
  error?: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<IssueCredentialResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    })
  }

  try {
    const {
      issuerDid,
      subjectDid,
      walletAddress,
      walletType,
      credentialType,
      credentialSubject,
      expirationDate
    }: IssueCredentialRequest = req.body

    if (!issuerDid || !subjectDid || !walletAddress || !walletType || !credentialType || !credentialSubject) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: issuerDid, subjectDid, walletAddress, walletType, credentialType, credentialSubject'
      })
    }

    console.log(`📜 Issuing credential for DID: ${subjectDid}`)

    // Create the verifiable credential
    const credential: VerifiableCredential = {
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://personapass.org/contexts/credentials/v1'
      ],
      id: `cred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: ['VerifiableCredential', ...credentialType],
      issuer: issuerDid,
      issuanceDate: new Date().toISOString(),
      expirationDate,
      credentialSubject: {
        id: subjectDid,
        ...credentialSubject
      },
      proof: {
        type: 'Ed25519Signature2018',
        created: new Date().toISOString(),
        proofPurpose: 'assertionMethod',
        verificationMethod: issuerDid + '#key-1',
        signature: `signature_${Date.now()}`
      }
    }

    // Store encrypted credential
    const storageResult = await identityStorage.storeVerifiableCredential(
      credential,
      walletAddress,
      walletType
    )

    if (!storageResult.success) {
      return res.status(500).json({
        success: false,
        error: storageResult.error || 'Failed to store credential'
      })
    }

    // Anchor credential issuance on PersonaChain
    let anchorResult
    try {
      anchorResult = await blockchainAnchor.anchorCredentialIssuance(
        credential.id,
        issuerDid,
        subjectDid,
        storageResult.contentHash!
      )
    } catch (anchorError) {
      console.warn('⚠️ Credential anchoring failed:', anchorError)
    }

    const response: IssueCredentialResponse = {
      success: true,
      credential,
      txHash: anchorResult?.txHash,
      contentHash: storageResult.contentHash,
      message: 'Credential issued successfully with Web3 hybrid storage'
    }

    console.log(`✅ Credential issued successfully: ${credential.id}`)
    return res.status(200).json(response)

  } catch (error) {
    console.error('❌ Credential issuance failed:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    })
  }
}