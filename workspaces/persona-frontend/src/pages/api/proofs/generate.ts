import { NextApiRequest, NextApiResponse } from 'next'
import { ZKProofService, ZKProofRequest, ZKProof } from '../../../lib/zk-proofs'

interface GenerateProofRequest {
  credentialId: string
  requestedAttributes: string[]
  proofPurpose: string
  walletAddress: string
  walletType: 'keplr' | 'leap'
  verifierDid?: string
  challenge?: string
  proofType?: 'selective-disclosure' | 'membership' | 'range'
  rangeParams?: {
    attribute: string
    minValue: number
    maxValue: number
  }
  membershipParams?: {
    groupId: string
  }
}

interface GenerateProofResponse {
  success: boolean
  proof?: ZKProof
  txHash?: string
  contentHash?: string
  message?: string
  error?: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<GenerateProofResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    })
  }

  try {
    const {
      credentialId,
      requestedAttributes,
      proofPurpose,
      walletAddress,
      walletType,
      verifierDid,
      challenge,
      proofType = 'selective-disclosure',
      rangeParams,
      membershipParams
    }: GenerateProofRequest = req.body

    if (!credentialId || !walletAddress || !walletType || !proofPurpose) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: credentialId, walletAddress, walletType, proofPurpose'
      })
    }

    console.log(`🔐 Generating ${proofType} proof for credential: ${credentialId}`)

    let result
    
    switch (proofType) {
      case 'selective-disclosure':
        if (!requestedAttributes || requestedAttributes.length === 0) {
          return res.status(400).json({
            success: false,
            error: 'requestedAttributes required for selective-disclosure proof'
          })
        }

        const zkRequest: ZKProofRequest = {
          credentialId,
          requestedAttributes,
          proofPurpose,
          verifierDid,
          challenge
        }

        result = await ZKProofService.generateSelectiveDisclosureProof(
          zkRequest,
          walletAddress,
          walletType
        )
        break

      case 'membership':
        if (!membershipParams?.groupId) {
          return res.status(400).json({
            success: false,
            error: 'groupId required for membership proof'
          })
        }

        result = await ZKProofService.generateMembershipProof(
          credentialId,
          membershipParams.groupId,
          walletAddress,
          walletType,
          challenge
        )
        break

      case 'range':
        if (!rangeParams) {
          return res.status(400).json({
            success: false,
            error: 'rangeParams required for range proof'
          })
        }

        result = await ZKProofService.generateRangeProof(
          credentialId,
          rangeParams.attribute,
          rangeParams.minValue,
          rangeParams.maxValue,
          walletAddress,
          walletType
        )
        break

      default:
        return res.status(400).json({
          success: false,
          error: `Unsupported proof type: ${proofType}`
        })
    }

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error || 'Proof generation failed'
      })
    }

    const response: GenerateProofResponse = {
      success: true,
      proof: result.data,
      txHash: result.blockchainAnchor?.txHash,
      contentHash: result.contentHash,
      message: `${proofType} proof generated successfully with zero-knowledge privacy protection`
    }

    console.log(`✅ ZK proof generated successfully: ${result.data?.id}`)
    return res.status(200).json(response)

  } catch (error) {
    console.error('❌ Proof generation failed:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    })
  }
}