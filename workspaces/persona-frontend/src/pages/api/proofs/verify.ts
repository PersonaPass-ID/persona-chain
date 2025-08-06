import { NextApiRequest, NextApiResponse } from 'next'
import { ZKProofService, ZKProof, ZKVerificationRequest, ZKVerificationResult } from '../../../lib/zk-proofs'

interface VerifyProofRequest {
  proof: ZKProof
  verifierDid: string
  expectedChallenge?: string
  requiredAttributes?: string[]
}

interface VerifyProofResponse {
  success: boolean
  verification: ZKVerificationResult
  message?: string
  error?: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<VerifyProofResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      verification: {
        success: false,
        isValid: false,
        verifiedAttributes: {},
        proofMetadata: {
          verificationTime: new Date().toISOString(),
          verifierDid: 'unknown',
          nullifierUsed: false,
          expirationStatus: 'valid'
        }
      },
      error: 'Method not allowed'
    })
  }

  try {
    const {
      proof,
      verifierDid,
      expectedChallenge,
      requiredAttributes
    }: VerifyProofRequest = req.body

    if (!proof || !verifierDid) {
      return res.status(400).json({
        success: false,
        verification: {
          success: false,
          isValid: false,
          verifiedAttributes: {},
          proofMetadata: {
            verificationTime: new Date().toISOString(),
            verifierDid: verifierDid || 'unknown',
            nullifierUsed: false,
            expirationStatus: 'valid'
          }
        },
        error: 'Missing required fields: proof, verifierDid'
      })
    }

    console.log(`🔍 Verifying ZK proof: ${proof.id} for verifier: ${verifierDid}`)

    // Validate proof structure
    if (!proof.id || !proof.proofType || !proof.proofData || !proof.commitmentHash) {
      return res.status(400).json({
        success: false,
        verification: {
          success: false,
          isValid: false,
          verifiedAttributes: {},
          proofMetadata: {
            verificationTime: new Date().toISOString(),
            verifierDid,
            nullifierUsed: false,
            expirationStatus: 'valid'
          }
        },
        error: 'Invalid proof structure'
      })
    }

    // Create verification request
    const verificationRequest: ZKVerificationRequest = {
      proof,
      verifierDid,
      expectedChallenge,
      requiredAttributes
    }

    // Verify the proof
    const verificationResult = await ZKProofService.verifyProof(verificationRequest)

    // Check if required attributes are present in revealed attributes
    if (requiredAttributes && verificationResult.isValid) {
      const missingAttributes = requiredAttributes.filter(
        attr => !(attr in verificationResult.verifiedAttributes)
      )

      if (missingAttributes.length > 0) {
        verificationResult.isValid = false
        verificationResult.error = `Missing required attributes: ${missingAttributes.join(', ')}`
      }
    }

    const response: VerifyProofResponse = {
      success: true,
      verification: verificationResult,
      message: verificationResult.isValid 
        ? `${proof.proofType} proof verified successfully - attributes proven without revealing sensitive data`
        : `Proof verification failed: ${verificationResult.error || 'Invalid proof'}`
    }

    const logStatus = verificationResult.isValid ? '✅ VALID' : '❌ INVALID'
    const warningsText = verificationResult.warnings ? ` (${verificationResult.warnings.join(', ')})` : ''
    console.log(`${logStatus} ZK proof verification: ${proof.id}${warningsText}`)
    
    return res.status(200).json(response)

  } catch (error) {
    console.error('❌ Proof verification failed:', error)
    return res.status(500).json({
      success: false,
      verification: {
        success: false,
        isValid: false,
        verifiedAttributes: {},
        proofMetadata: {
          verificationTime: new Date().toISOString(),
          verifierDid: 'unknown',
          nullifierUsed: false,
          expirationStatus: 'valid'
        },
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      error: error instanceof Error ? error.message : 'Internal server error'
    })
  }
}