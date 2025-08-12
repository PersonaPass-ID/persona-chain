/**
 * Revenue-First KYC System
 * Only do expensive KYC AFTER user pays - never before
 */

export interface RevenueGatedKYC {
  user: {
    subscription: 'free' | 'premium' | 'enterprise'
    paymentStatus: 'unpaid' | 'paid' | 'failed'
    monthlyValue: number // How much they pay per month
  }
  kycTier: 'free' | 'basic' | 'premium' | 'enterprise'
  costPerVerification: number
  provider: string
}

export class RevenueFirstKYCManager {
  
  /**
   * Determine KYC tier based on user's payment status
   */
  getKYCTier(user: any): RevenueGatedKYC {
    // FREE USERS: Zero-cost proof of personhood
    if (user.subscription === 'free' || user.paymentStatus === 'unpaid') {
      return {
        user,
        kycTier: 'free',
        costPerVerification: 0.02, // Only SMS verification cost
        provider: 'worldcoin+gitcoin+github'
      }
    }
    
    // PREMIUM USERS ($2.99/month): Light KYC with profit margin
    if (user.subscription === 'premium' && user.monthlyValue >= 2.99) {
      return {
        user,
        kycTier: 'basic', 
        costPerVerification: 0.50, // Civic - still profitable
        provider: 'civic'
      }
    }
    
    // ENTERPRISE USERS ($49+/month): Full KYC suite  
    if (user.subscription === 'enterprise' && user.monthlyValue >= 49) {
      return {
        user,
        kycTier: 'enterprise',
        costPerVerification: 1.35, // Sumsub - high margin justifies cost
        provider: 'sumsub'
      }
    }
    
    // Default: Free tier
    return {
      user,
      kycTier: 'free',
      costPerVerification: 0.02,
      provider: 'worldcoin+gitcoin'
    }
  }

  /**
   * FREE TIER: Multi-signal proof of personhood (no KYC cost)
   */
  async verifyFreeTier(userAddress: string) {
    const signals = await Promise.all([
      this.verifyWorldcoin(userAddress),      // FREE - Iris scan proof
      this.verifyGitcoinPassport(userAddress), // FREE - Humanity score  
      this.verifyGitHub(userAddress),         // FREE - Developer proof
      this.analyzeWalletHistory(userAddress), // FREE - Crypto identity
      this.verifyEmail(userAddress),          // FREE - Email verification
      // SMS only if user requests it
    ])
    
    const humanityScore = this.calculateHumanityScore(signals)
    
    return {
      tier: 'free',
      cost: 0.00,
      humanityScore,
      proofOfPersonhood: humanityScore > 60,
      zkProof: this.generateZKProof(signals),
      utilityLevel: 'basic' // Still good for most DeFi/social use cases
    }
  }

  /**
   * PREMIUM TIER: Enhanced verification for paying users
   */
  async verifyPremiumTier(userAddress: string) {
    // Only run if user has active paid subscription
    const user = await this.getUserSubscription(userAddress)
    if (user.monthlyValue < 2.99) {
      throw new Error('Premium KYC requires active $2.99/month subscription')
    }
    
    const freeSignals = await this.verifyFreeTier(userAddress)
    const civicKYC = await this.runCivicKYC(userAddress) // $0.50 cost
    
    return {
      ...freeSignals,
      tier: 'premium',
      cost: 0.50,
      kycLevel: 'basic',
      utilityLevel: 'enhanced', // Works for financial apps
      profitMargin: 2.99 - 0.50 // $2.49 profit per user
    }
  }

  /**
   * ENTERPRISE TIER: Full compliance for high-value customers  
   */
  async verifyEnterpriseTier(userAddress: string) {
    const user = await this.getUserSubscription(userAddress)
    if (user.monthlyValue < 49) {
      throw new Error('Enterprise KYC requires $49+/month contract')
    }
    
    const premiumSignals = await this.verifyPremiumTier(userAddress)
    const sumsubKYC = await this.runSumsubKYC(userAddress) // $1.35 cost
    
    return {
      ...premiumSignals,
      tier: 'enterprise', 
      cost: 1.35,
      kycLevel: 'full',
      utilityLevel: 'maximum', // Banking, compliance, everything
      profitMargin: 49 - 1.35  // $47.65 profit per enterprise user
    }
  }

  /**
   * NEVER PAY FOR KYC WITHOUT REVENUE
   */
  async createVerification(userAddress: string) {
    const user = await this.getUserSubscription(userAddress)
    const kycTier = this.getKYCTier(user)
    
    // CRITICAL: Never spend money on unpaid users
    if (user.paymentStatus === 'unpaid' && kycTier.costPerVerification > 0.10) {
      console.log('🚫 Blocking expensive KYC for unpaid user:', userAddress)
      return this.verifyFreeTier(userAddress)
    }
    
    // Only do paid KYC for paying customers
    switch (kycTier.kycTier) {
      case 'free':
        return this.verifyFreeTier(userAddress)
      case 'basic':
        return this.verifyPremiumTier(userAddress)  
      case 'enterprise':
        return this.verifyEnterpriseTier(userAddress)
      default:
        return this.verifyFreeTier(userAddress)
    }
  }

  /**
   * Calculate multi-signal humanity score (0-100)
   */
  private calculateHumanityScore(signals: any[]): number {
    let score = 0
    
    // Worldcoin verification (40 points)
    if (signals.worldcoin?.verified) score += 40
    
    // Gitcoin Passport (30 points)
    score += Math.min(30, signals.gitcoin?.score || 0)
    
    // GitHub verification (15 points) 
    if (signals.github?.verified && signals.github.accountAge > 1) score += 15
    
    // Wallet history (10 points)
    if (signals.wallet?.transactionCount > 10) score += 10
    
    // Email verification (5 points)
    if (signals.email?.verified) score += 5
    
    return Math.min(100, score)
  }

  /**
   * Startup-friendly cost tracking
   */
  async getCostAnalysis(period: 'month' | 'year') {
    const users = await this.getUserStats()
    
    return {
      freeUsers: {
        count: users.free,
        costPer: 0.02,
        totalCost: users.free * 0.02
      },
      premiumUsers: {
        count: users.premium, 
        costPer: 0.50,
        totalCost: users.premium * 0.50,
        revenue: users.premium * 2.99,
        profit: users.premium * (2.99 - 0.50)
      },
      enterpriseUsers: {
        count: users.enterprise,
        costPer: 1.35, 
        totalCost: users.enterprise * 1.35,
        revenue: users.enterprise * 49,
        profit: users.enterprise * (49 - 1.35)
      },
      totalProfit: this.calculateTotalProfit(users)
    }
  }
}

export const revenueFirstKYC = new RevenueFirstKYCManager()