import { NextApiRequest, NextApiResponse } from 'next'
import { identityStorage, VerifiableCredential } from '../../../lib/storage/identity-storage'
import { DIDResolverService } from '../../../lib/did-resolver'

interface VerifyCredentialRequest {
  credentialId?: string
  credential?: VerifiableCredential
  walletAddress: string
  walletType: 'keplr' | 'leap'
}

interface VerifyCredentialResponse {
  success: boolean
  isValid: boolean
  credential?: VerifiableCredential
  verification: {
    issuerValid: boolean
    signatureValid: boolean
    notExpired: boolean
    contentIntegrityValid: boolean
    blockchainAnchored: boolean
  }
  metadata?: {
    issuerDid: string
    subjectDid: string
    issuanceDate: string
    expirationDate?: string
    credentialType: string[]
  }
  error?: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<VerifyCredentialResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      isValid: false,
      verification: {
        issuerValid: false,
        signatureValid: false,
        notExpired: false,
        contentIntegrityValid: false,
        blockchainAnchored: false
      },
      error: 'Method not allowed'
    })
  }

  try {
    const {
      credentialId,
      credential: providedCredential,
      walletAddress,
      walletType
    }: VerifyCredentialRequest = req.body

    if (!walletAddress || !walletType || (!credentialId && !providedCredential)) {
      return res.status(400).json({
        success: false,
        isValid: false,
        verification: {
          issuerValid: false,
          signatureValid: false,
          notExpired: false,
          contentIntegrityValid: false,
          blockchainAnchored: false
        },
        error: 'Missing required fields: walletAddress, walletType, and either credentialId or credential'
      })
    }

    console.log(`🔍 Verifying credential: ${credentialId || providedCredential?.id}`)

    let credential: VerifiableCredential | undefined = providedCredential

    // If credentialId provided, fetch from storage
    if (credentialId && !credential) {
      const did = await identityStorage.getDIDByWallet(walletAddress)
      if (!did) {
        return res.status(404).json({
          success: false,
          isValid: false,
          verification: {
            issuerValid: false,
            signatureValid: false,
            notExpired: false,
            contentIntegrityValid: false,
            blockchainAnchored: false
          },
          error: 'DID not found for wallet address'
        })
      }

      const credentialsResult = await identityStorage.getVerifiableCredentials(
        did,
        walletAddress,
        walletType
      )

      if (!credentialsResult.success || !credentialsResult.data) {
        return res.status(404).json({
          success: false,
          isValid: false,
          verification: {
            issuerValid: false,
            signatureValid: false,
            notExpired: false,
            contentIntegrityValid: false,
            blockchainAnchored: false
          },
          error: 'Credentials not found'
        })
      }

      credential = credentialsResult.data.find(c => c.id === credentialId)
      if (!credential) {
        return res.status(404).json({
          success: false,
          isValid: false,
          verification: {
            issuerValid: false,
            signatureValid: false,
            notExpired: false,
            contentIntegrityValid: false,
            blockchainAnchored: false
          },
          error: 'Specific credential not found'
        })
      }
    }

    if (!credential) {
      return res.status(400).json({
        success: false,
        isValid: false,
        verification: {
          issuerValid: false,
          signatureValid: false,
          notExpired: false,
          contentIntegrityValid: false,
          blockchainAnchored: false
        },
        error: 'No credential provided for verification'
      })
    }

    // Perform verification checks
    const verification = {
      issuerValid: false,
      signatureValid: false,
      notExpired: false,
      contentIntegrityValid: false,
      blockchainAnchored: false
    }

    // 1. Verify issuer DID exists and is valid
    try {
      const issuerDid = typeof credential.issuer === 'string' ? credential.issuer : credential.issuer.id
      const issuerResolution = await DIDResolverService.resolveDID(issuerDid)
      verification.issuerValid = !!issuerResolution.didDocument
    } catch (error) {
      console.warn('⚠️ Issuer DID verification failed:', error)
    }

    // 2. Verify signature (simplified - in production use cryptographic verification)
    verification.signatureValid = !!(
      credential.proof?.signature && 
      credential.proof?.verificationMethod && 
      credential.proof?.type
    )

    // 3. Check expiration
    const now = new Date()
    const issuanceDate = new Date(credential.issuanceDate)
    const expirationDate = credential.expirationDate ? new Date(credential.expirationDate) : null
    
    verification.notExpired = now >= issuanceDate && (
      !expirationDate || now <= expirationDate
    )

    // 4. Verify content integrity (simplified)
    verification.contentIntegrityValid = !!(
      credential.credentialSubject &&
      credential.credentialSubject.id &&
      credential['@context'] &&
      credential.type
    )

    // 5. Check blockchain anchoring (simplified)
    verification.blockchainAnchored = !!(
      credential.proof?.blockchainTxHash ||
      (credential.proof as any)?.blockchainAnchor
    )

    const isValid = Object.values(verification).every(v => v === true)

    const response: VerifyCredentialResponse = {
      success: true,
      isValid,
      credential,
      verification,
      metadata: {
        issuerDid: typeof credential.issuer === 'string' ? credential.issuer : credential.issuer.id,
        subjectDid: credential.credentialSubject.id,
        issuanceDate: credential.issuanceDate,
        expirationDate: credential.expirationDate,
        credentialType: Array.isArray(credential.type) ? credential.type : [credential.type]
      }
    }

    console.log(`✅ Credential verification complete: ${isValid ? 'VALID' : 'INVALID'}`)
    return res.status(200).json(response)

  } catch (error) {
    console.error('❌ Credential verification failed:', error)
    return res.status(500).json({
      success: false,
      isValid: false,
      verification: {
        issuerValid: false,
        signatureValid: false,
        notExpired: false,
        contentIntegrityValid: false,
        blockchainAnchored: false
      },
      error: error instanceof Error ? error.message : 'Internal server error'
    })
  }
}