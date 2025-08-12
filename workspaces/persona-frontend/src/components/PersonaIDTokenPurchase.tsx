/**
 * PersonaID Token Purchase Component
 * Allows users to buy ID tokens for DID operations
 */

'use client'

import { useState, useEffect } from 'react'
import { personaIDToken } from '@/lib/personaid-token'
import walletAuthClient from '@/lib/wallet-auth-client-v2'

interface PricingTier {
  usd: number
  id: number
  bonus: number
  popular?: boolean
  description: string
}

export default function PersonaIDTokenPurchase() {
  const [selectedTier, setSelectedTier] = useState<PricingTier | null>(null)
  const [loading, setLoading] = useState(false)
  const [userAddress, setUserAddress] = useState<string>('')
  const [balance, setBalance] = useState<string>('0 ID')
  const [pricingTiers] = useState<PricingTier[]>(personaIDToken.getPricingTiers())

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      const user = walletAuthClient.getStoredUser()
      if (user?.address) {
        setUserAddress(user.address)
        
        const balance = await personaIDToken.getIDBalance(user.address)
        if (balance) {
          setBalance(balance.formatted)
        }
      }
    } catch (error) {
      console.error('Failed to load user data:', error)
    }
  }

  const handlePurchase = async (tier: PricingTier) => {
    if (!userAddress) {
      alert('Please connect your wallet first')
      return
    }

    setLoading(true)
    setSelectedTier(tier)

    try {
      const purchase = {
        amount: tier.id,
        usdPrice: tier.usd,
        paymentMethod: 'stripe' as const,
        userAddress
      }

      const result = await personaIDToken.purchaseIDTokens(purchase)

      if (result.success && result.paymentUrl) {
        // Redirect to Stripe Checkout
        window.location.href = result.paymentUrl
      } else {
        alert(`Purchase failed: ${result.error}`)
      }
    } catch (error) {
      console.error('Purchase error:', error)
      alert('Purchase failed. Please try again.')
    } finally {
      setLoading(false)
      setSelectedTier(null)
    }
  }

  const getDIDOperations = (idAmount: number): string => {
    const createOps = Math.floor(idAmount / 10) // 10 ID per DID creation
    const verifyOps = Math.floor(idAmount / 1)  // 1 ID per verification
    return `${createOps} DID creations or ${verifyOps.toLocaleString()} verifications`
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Purchase PersonaID Tokens
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          PersonaID (ID) tokens power all operations on PersonaChain. 
          Create DIDs, issue credentials, and verify identities using your ID tokens.
        </p>
        
        {userAddress && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              <span className="font-medium">Current Balance:</span> {balance}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Wallet: {userAddress.slice(0, 20)}...{userAddress.slice(-10)}
            </p>
          </div>
        )}
      </div>

      {/* Pricing Tiers */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {pricingTiers.map((tier, index) => (
          <div
            key={index}
            className={`relative bg-white rounded-xl border-2 p-6 hover:shadow-lg transition-all ${
              tier.popular 
                ? 'border-blue-500 shadow-lg' 
                : 'border-gray-200 hover:border-blue-300'
            }`}
          >
            {tier.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </span>
              </div>
            )}
            
            <div className="text-center">
              <div className="mb-4">
                <span className="text-3xl font-bold text-gray-900">${tier.usd}</span>
              </div>
              
              <div className="mb-4">
                <div className="text-xl font-semibold text-blue-600">
                  {tier.id.toLocaleString()} ID
                </div>
                {tier.bonus > 0 && (
                  <div className="text-sm text-green-600 font-medium">
                    +{tier.bonus} bonus tokens!
                  </div>
                )}
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                {tier.description}
              </p>
              
              <p className="text-xs text-gray-500 mb-6">
                Enables: {getDIDOperations(tier.id)}
              </p>
              
              <button
                onClick={() => handlePurchase(tier)}
                disabled={loading || !userAddress}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
                  loading && selectedTier === tier
                    ? 'bg-gray-400 cursor-not-allowed'
                    : tier.popular
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-900 hover:bg-gray-800 text-white'
                } ${!userAddress ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading && selectedTier === tier ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  'Purchase ID Tokens'
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Usage Information */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          How PersonaID Tokens Work
        </h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">DID Operations</h4>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• Create DID: 10 ID tokens</li>
              <li>• Update DID: 5 ID tokens</li>
              <li>• Verify credential: 1 ID token</li>
              <li>• Revoke credential: 3 ID tokens</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Token Benefits</h4>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• No expiration - tokens never expire</li>
              <li>• Instant transactions on PersonaChain</li>
              <li>• Bonus tokens on larger purchases</li>
              <li>• Support digital sovereignty</li>
            </ul>
          </div>
        </div>
      </div>

      {!userAddress && (
        <div className="mt-8 text-center p-4 bg-yellow-50 rounded-lg">
          <p className="text-yellow-800">
            Please connect your PersonaChain wallet to purchase ID tokens.
          </p>
        </div>
      )}
    </div>
  )
}