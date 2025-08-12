/**
 * KYC Status Check API
 * Returns user's verification status and free token eligibility
 */

import { NextApiRequest, NextApiResponse } from 'next'

interface KYCStatusRequest {
  userAddress: string
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

interface TokenClaimRecord {
  userAddress: string
  month: string
  tokensAwarded: number
  claimedAt: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { userAddress }: KYCStatusRequest = req.body

    if (!userAddress) {
      return res.status(400).json({ error: 'userAddress is required' })
    }

    // For MVP, we'll use in-memory storage
    // In production, this would query a real database
    const mockVerifications: KYCVerification[] = [
      // Sample verified user for testing
      {
        id: '1',
        userAddress: 'persona1sample123...',
        provider: 'persona',
        verificationType: 'identity',
        status: 'verified',
        verificationId: 'persona_12345',
        timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        expiresAt: new Date(Date.now() + (365 * 86400000)).toISOString(), // 1 year from now
        cost: 5
      }
    ]

    const mockTokenClaims: TokenClaimRecord[] = [
      // Sample claim record
      {
        userAddress: 'persona1sample123...',
        month: '2024-01',
        tokensAwarded: 100,
        claimedAt: new Date(Date.now() - (15 * 86400000)).toISOString() // 15 days ago
      }
    ]

    // Get user's verifications
    const userVerifications = mockVerifications.filter(v => 
      v.userAddress === userAddress
    )

    // Check if user has valid identity verification
    const hasValidIdentityVerification = userVerifications.some(v => 
      v.verificationType === 'identity' && 
      v.status === 'verified' &&
      new Date(v.expiresAt) > new Date()
    )

    // Check if user already claimed tokens this month
    const currentMonth = new Date().toISOString().substring(0, 7) // YYYY-MM
    const hasClaimedThisMonth = mockTokenClaims.some(claim =>
      claim.userAddress === userAddress && claim.month === currentMonth
    )

    // Calculate next claim date
    const nextClaimDate = hasClaimedThisMonth 
      ? new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString()
      : new Date().toISOString()

    // Determine verification level
    let verificationLevel: 'none' | 'basic' | 'standard' | 'premium' = 'none'
    const hasIdentity = userVerifications.some(v => v.verificationType === 'identity' && v.status === 'verified')
    const hasAddress = userVerifications.some(v => v.verificationType === 'address' && v.status === 'verified')
    const hasPhone = userVerifications.some(v => v.verificationType === 'phone' && v.status === 'verified')
    const hasEmail = userVerifications.some(v => v.verificationType === 'email' && v.status === 'verified')

    if (hasIdentity && hasAddress) {
      verificationLevel = 'premium'
    } else if (hasIdentity || (hasPhone && hasEmail && hasAddress)) {
      verificationLevel = 'standard'
    } else if (hasPhone || hasEmail) {
      verificationLevel = 'basic'
    }

    console.log(`🔍 KYC Status Check: ${userAddress} - Level: ${verificationLevel}, Can Claim: ${hasValidIdentityVerification && !hasClaimedThisMonth}`)

    return res.status(200).json({
      success: true,
      isVerified: hasValidIdentityVerification,
      verificationLevel,
      verifications: userVerifications,
      canClaimFreeTokens: hasValidIdentityVerification && !hasClaimedThisMonth,
      nextClaimDate: hasClaimedThisMonth ? nextClaimDate : null,
      privileges: getPrivilegesForLevel(verificationLevel),
      requirements: getRequirementsForFreeTokens(userVerifications)
    })

  } catch (error) {
    console.error('KYC status check error:', error)
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check KYC status'
    })
  }
}

function getPrivilegesForLevel(level: string): string[] {
  switch (level) {
    case 'premium':
      return [
        'claim_free_tokens',
        'reduced_api_costs',
        'priority_support', 
        'governance_voting',
        'higher_transaction_limits'
      ]
    case 'standard':
      return [
        'claim_free_tokens',
        'reduced_api_costs',
        'standard_transaction_limits'
      ]
    case 'basic':
      return ['basic_transaction_limits']
    default:
      return []
  }
}

function getRequirementsForFreeTokens(verifications: KYCVerification[]): string[] {
  const hasIdentity = verifications.some(v => v.verificationType === 'identity' && v.status === 'verified')
  
  if (hasIdentity) {
    return [] // No additional requirements
  }

  return [
    'Complete identity verification with government-issued ID',
    'Verification typically takes 2-5 minutes',
    'Required to prevent sybil attacks and ensure one user = one account'
  ]
}