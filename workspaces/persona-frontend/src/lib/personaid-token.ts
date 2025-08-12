/**
 * PersonaID Token Management System
 * Handles $ID token purchasing, balance checking, and DID operations
 */

export interface PersonaIDBalance {
  balance: string
  denom: string
  formatted: string // Human readable (e.g., "1,000 ID")
}

export interface TokenPurchase {
  amount: number // ID tokens to purchase
  usdPrice: number // Price in USD
  paymentMethod: 'stripe' | 'paypal' | 'crypto'
  userAddress: string // PersonaChain address
}

export interface DIDOperation {
  type: 'create' | 'update' | 'verify' | 'revoke'
  cost: number // Cost in ID tokens
  description: string
}

export class PersonaIDTokenManager {
  private rpcEndpoint: string

  constructor(rpcEndpoint = 'http://13.221.89.96:26657') {
    this.rpcEndpoint = rpcEndpoint
  }

  /**
   * Get current ID token exchange rate
   */
  getExchangeRate(): { usdPerID: number; idPerUSD: number } {
    return {
      usdPerID: 0.0005, // $0.0005 per ID token (competitive with new launches)
      idPerUSD: 2000    // 2,000 ID tokens per $1 (20x more tokens!)
    }
  }

  /**
   * Get ID token balance for a PersonaChain address (alias for getIDBalance)
   */
  async getBalance(address: string): Promise<string> {
    const balance = await this.getIDBalance(address)
    return balance ? balance.formatted : '0 ID'
  }

  /**
   * Get ID token balance for a PersonaChain address
   */
  async getIDBalance(address: string): Promise<PersonaIDBalance | null> {
    try {
      // For now, simulate balance check
      // TODO: Replace with actual PersonaChain balance query
      const mockBalance = '1000000' // 1000 ID tokens (6 decimals)
      
      return {
        balance: mockBalance,
        denom: 'uid',
        formatted: this.formatIDAmount(mockBalance)
      }
    } catch (error) {
      console.error('Failed to get ID balance:', error)
      return null
    }
  }

  /**
   * Calculate cost for DID operations
   */
  getDIDOperationCost(operation: DIDOperation['type']): DIDOperation {
    const costs: Record<DIDOperation['type'], { cost: number; description: string }> = {
      create: { 
        cost: 10, 
        description: 'Create new DID with cryptographic proof' 
      },
      update: { 
        cost: 5, 
        description: 'Update DID document or credentials' 
      },
      verify: { 
        cost: 1, 
        description: 'Verify credential authenticity' 
      },
      revoke: { 
        cost: 3, 
        description: 'Revoke credential or DID' 
      }
    }

    return {
      type: operation,
      ...costs[operation]
    }
  }

  /**
   * Calculate purchase amounts and pricing
   */
  calculatePurchase(usdAmount: number): {
    idTokens: number
    usdCost: number
    fees: number
    total: number
  } {
    const rate = this.getExchangeRate()
    const idTokens = Math.floor(usdAmount * rate.idPerUSD)
    const fees = Math.max(0.30, usdAmount * 0.029) // Stripe fees: 2.9% + $0.30
    
    return {
      idTokens,
      usdCost: usdAmount,
      fees: Math.round(fees * 100) / 100,
      total: Math.round((usdAmount + fees) * 100) / 100
    }
  }

  /**
   * Initiate ID token purchase
   */
  async purchaseIDTokens(purchase: TokenPurchase): Promise<{
    success: boolean
    paymentUrl?: string
    error?: string
  }> {
    try {
      console.log('🛒 Processing ID token purchase:', purchase)

      // For MVP, create Stripe Checkout session
      const response = await fetch('/api/payments/purchase-id-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(purchase)
      })

      if (!response.ok) {
        throw new Error('Purchase request failed')
      }

      const data = await response.json()
      
      if (data.success && data.paymentUrl) {
        return {
          success: true,
          paymentUrl: data.paymentUrl
        }
      }

      return {
        success: false,
        error: data.error || 'Purchase failed'
      }

    } catch (error) {
      console.error('ID token purchase failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Purchase failed'
      }
    }
  }

  /**
   * Check if user has enough ID tokens for operation
   */
  async canAffordOperation(address: string, operation: DIDOperation['type']): Promise<{
    canAfford: boolean
    balance: number
    required: number
    shortfall?: number
  }> {
    const balance = await this.getIDBalance(address)
    const cost = this.getDIDOperationCost(operation)
    
    if (!balance) {
      return {
        canAfford: false,
        balance: 0,
        required: cost.cost,
        shortfall: cost.cost
      }
    }

    const balanceAmount = parseInt(balance.balance) / 1000000 // Convert from uid to ID
    const canAfford = balanceAmount >= cost.cost
    
    return {
      canAfford,
      balance: balanceAmount,
      required: cost.cost,
      shortfall: canAfford ? 0 : cost.cost - balanceAmount
    }
  }

  /**
   * Format ID token amounts for display
   */
  private formatIDAmount(amount: string): string {
    const idAmount = parseInt(amount) / 1000000 // Convert uid to ID
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 2
    }).format(idAmount) + ' ID'
  }

  /**
   * Get pricing tiers for ID token purchases
   */
  getPricingTiers(): Array<{
    usd: number
    id: number
    bonus: number
    popular?: boolean
    description: string
  }> {
    return [
      {
        usd: 10,
        id: 22000,
        bonus: 2000,
        description: 'Starter - 22K tokens + 10% bonus'
      },
      {
        usd: 25,
        id: 60000,
        bonus: 10000,
        popular: true,
        description: 'Popular - 60K tokens + 20% bonus'
      },
      {
        usd: 50,
        id: 130000,
        bonus: 30000,
        description: 'Power - 130K tokens + 30% bonus'
      },
      {
        usd: 100,
        id: 300000,
        bonus: 100000,
        description: 'Whale - 300K tokens + 50% bonus'
      }
    ]
  }
}

// Export singleton instance
export const personaIDToken = new PersonaIDTokenManager()
export default personaIDToken