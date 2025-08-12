/**
 * Free Token Claiming API
 * Allows verified users to claim monthly free ID tokens
 */

import { NextApiRequest, NextApiResponse } from 'next'

interface ClaimRequest {
  userAddress: string
}

interface TokenClaimRecord {
  userAddress: string
  month: string
  tokensAwarded: number
  claimedAt: string
  verificationId: string
}

interface KYCVerification {
  id: string
  userAddress: string
  provider: string
  verificationType: 'identity' | 'address' | 'phone' | 'email'
  status: 'pending' | 'verified' | 'failed' | 'expired'
  verificationId: string
  timestamp: string
  expiresAt: string
  cost: number
}

const FREE_TOKENS_PER_MONTH = 100
const REQUIRED_VERIFICATION_LEVEL = 'identity'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { userAddress }: ClaimRequest = req.body

    if (!userAddress) {
      return res.status(400).json({ error: 'userAddress is required' })
    }

    // For MVP, using mock data - in production this would query real database
    const mockVerifications: KYCVerification[] = [
      {
        id: '1',
        userAddress: 'persona1sample123...',
        provider: 'persona',
        verificationType: 'identity',
        status: 'verified',
        verificationId: 'persona_12345',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        expiresAt: new Date(Date.now() + (365 * 86400000)).toISOString(),
        cost: 5
      }
    ]

    const mockTokenClaims: TokenClaimRecord[] = [
      // Previous month's claim (user can claim again this month)
      {
        userAddress: 'persona1sample123...',
        month: '2024-12',
        tokensAwarded: 100,
        claimedAt: new Date(Date.now() - (35 * 86400000)).toISOString(),
        verificationId: 'persona_12345'
      }
    ]

    // Check user's verification status
    const userVerifications = mockVerifications.filter(v => 
      v.userAddress === userAddress
    )

    const hasValidIdentityVerification = userVerifications.some(v => 
      v.verificationType === REQUIRED_VERIFICATION_LEVEL && 
      v.status === 'verified' &&
      new Date(v.expiresAt) > new Date()
    )

    if (!hasValidIdentityVerification) {
      return res.status(403).json({
        success: false,
        error: 'Identity verification required',
        requirements: [
          'Complete identity verification with government-issued ID',
          'Verification must be in "verified" status',
          'Verification must not be expired'
        ],
        action: 'initiate_kyc_verification'
      })
    }

    // Check if user already claimed this month
    const currentMonth = new Date().toISOString().substring(0, 7) // YYYY-MM
    const hasClaimedThisMonth = mockTokenClaims.some(claim =>
      claim.userAddress === userAddress && claim.month === currentMonth
    )

    if (hasClaimedThisMonth) {
      const nextClaimDate = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
      
      return res.status(400).json({
        success: false,
        error: 'Already claimed tokens this month',
        nextClaimDate: nextClaimDate.toISOString(),
        currentMonth,
        tokensAwarded: 0
      })
    }

    // Get the verification used for eligibility
    const identityVerification = userVerifications.find(v => 
      v.verificationType === 'identity' && v.status === 'verified'
    )

    // Create claim record
    const claimRecord: TokenClaimRecord = {
      userAddress,
      month: currentMonth,
      tokensAwarded: FREE_TOKENS_PER_MONTH,
      claimedAt: new Date().toISOString(),
      verificationId: identityVerification?.verificationId || 'unknown'
    }

    // In production, this would:
    // 1. Store claim record in database
    // 2. Call PersonaChain to mint tokens to user's address
    // 3. Update user's token balance
    
    console.log(`🎁 Awarding ${FREE_TOKENS_PER_MONTH} free ID tokens to verified user ${userAddress}`)
    console.log(`📝 Claim record:`, claimRecord)

    // Mock token minting - in production this would call PersonaChain
    const mockMintResponse = await simulateTokenMinting(userAddress, FREE_TOKENS_PER_MONTH)
    
    if (!mockMintResponse.success) {
      return res.status(500).json({
        success: false,
        error: 'Token minting failed',
        details: mockMintResponse.error
      })
    }

    // Calculate next claim date (first day of next month)
    const nextClaimDate = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)

    // Add user's new verification level perks
    const verificationLevel = getUserVerificationLevel(userVerifications)
    const perks = getVerificationPerks(verificationLevel)

    return res.status(200).json({
      success: true,
      tokensAwarded: FREE_TOKENS_PER_MONTH,
      nextClaimDate: nextClaimDate.toISOString(),
      currentMonth,
      claimedAt: claimRecord.claimedAt,
      transactionHash: mockMintResponse.transactionHash,
      message: `🎉 Successfully claimed ${FREE_TOKENS_PER_MONTH} ID tokens!`,
      verificationLevel,
      perks,
      antiSybilProtection: {
        verified: true,
        method: 'identity_document_verification',
        provider: identityVerification?.provider,
        verifiedAt: identityVerification?.timestamp
      }
    })

  } catch (error) {
    console.error('Free token claim error:', error)
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to claim free tokens',
      tokensAwarded: 0,
      nextClaimDate: ''
    })
  }
}

/**
 * Simulate token minting to PersonaChain
 * In production, this would call the actual blockchain
 */
async function simulateTokenMinting(userAddress: string, amount: number): Promise<{
  success: boolean
  transactionHash?: string
  error?: string
}> {
  try {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Mock successful minting
    const mockTxHash = `0x${Math.random().toString(16).substring(2)}${Date.now().toString(16)}`
    
    console.log(`⛓️ Minted ${amount} ID tokens to ${userAddress} - TX: ${mockTxHash}`)
    
    return {
      success: true,
      transactionHash: mockTxHash
    }
  } catch (error) {
    return {
      success: false,
      error: 'Blockchain transaction failed'
    }
  }
}

/**
 * Get user's verification level
 */
function getUserVerificationLevel(verifications: KYCVerification[]): string {
  const hasIdentity = verifications.some(v => v.verificationType === 'identity' && v.status === 'verified')
  const hasAddress = verifications.some(v => v.verificationType === 'address' && v.status === 'verified')
  const hasPhone = verifications.some(v => v.verificationType === 'phone' && v.status === 'verified')
  const hasEmail = verifications.some(v => v.verificationType === 'email' && v.status === 'verified')

  if (hasIdentity && hasAddress) return 'premium'
  if (hasIdentity || (hasPhone && hasEmail && hasAddress)) return 'standard'
  if (hasPhone || hasEmail) return 'basic'
  return 'none'
}

/**
 * Get perks for verification level
 */
function getVerificationPerks(level: string): string[] {
  const perks = {
    premium: [
      '100 free ID tokens monthly',
      '50% discount on API calls when paying with ID tokens',
      'Priority customer support',
      'Governance voting rights',
      'Higher transaction limits (10,000 ID/day)'
    ],
    standard: [
      '100 free ID tokens monthly', 
      '25% discount on API calls when paying with ID tokens',
      'Standard transaction limits (1,000 ID/day)'
    ],
    basic: [
      'Basic transaction limits (100 ID/day)'
    ],
    none: []
  }

  return perks[level as keyof typeof perks] || []
}