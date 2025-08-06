/**
 * Flexible PersonaID Token Purchase Component
 * Users can buy any amount of ID tokens they need
 */

'use client'

import { useState, useEffect } from 'react'
import { personaIDToken } from '@/lib/personaid-token'
import walletAuthClient from '@/lib/wallet-auth-client-v2'

interface PricingCalculator {
  usdAmount: number
  idTokens: number
  discount: number
  paymentMethod: 'stripe' | 'crypto'
  finalPrice: number
}

export default function FlexibleTokenPurchase() {
  const [usdAmount, setUsdAmount] = useState<string>('10.00')
  const [calculator, setCalculator] = useState<PricingCalculator>({
    usdAmount: 10,
    idTokens: 1000,
    discount: 0,
    paymentMethod: 'stripe',
    finalPrice: 10
  })
  const [userAddress, setUserAddress] = useState<string>('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const user = walletAuthClient.getStoredUser()
    if (user?.address) {
      setUserAddress(user.address)
    }
  }, [])

  const calculateTokens = (amount: string, method: 'stripe' | 'crypto') => {
    const usd = parseFloat(amount) || 0
    const baseRate = 0.01 // $0.01 per ID token
    
    let discount = 0
    let finalPrice = usd
    
    if (method === 'crypto') {
      discount = 5 // 5% crypto discount
      finalPrice = usd * 0.95
    }
    
    const tokens = Math.floor(usd / baseRate)
    
    setCalculator({
      usdAmount: usd,
      idTokens: tokens,
      discount,
      paymentMethod: method,
      finalPrice
    })
  }

  useEffect(() => {
    calculateTokens(usdAmount, calculator.paymentMethod)
  }, [usdAmount, calculator.paymentMethod])

  const handlePurchase = async (method: 'stripe' | 'crypto') => {
    if (!userAddress || calculator.usdAmount < 1) return
    
    setLoading(true)
    
    try {
      if (method === 'stripe') {
        const result = await personaIDToken.purchaseIDTokens({
          amount: calculator.idTokens,
          usdPrice: calculator.finalPrice,
          paymentMethod: 'stripe',
          userAddress
        })
        
        if (result.success && result.paymentUrl) {
          window.location.href = result.paymentUrl
        }
      } else {
        // TODO: Implement crypto purchase
        alert('Crypto purchases coming soon! Use Stripe for now.')
      }
    } catch (error) {
      console.error('Purchase error:', error)
      alert('Purchase failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Buy PersonaID Tokens
        </h2>
        
        {/* Amount Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Enter Amount (USD)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-3 text-gray-500">$</span>
            <input
              type="number"
              value={usdAmount}
              onChange={(e) => setUsdAmount(e.target.value)}
              min="1"
              max="10000"
              step="0.01"
              className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
              placeholder="10.00"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Minimum: $1.00 • Maximum: $10,000.00
          </p>
        </div>

        {/* Token Calculator Display */}
        <div className="bg-blue-50 rounded-lg p-6 mb-6">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {calculator.idTokens.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">ID Tokens</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                ${calculator.finalPrice.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Final Price</div>
            </div>
          </div>
          
          {calculator.discount > 0 && (
            <div className="mt-4 text-center">
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                {calculator.discount}% Crypto Discount Applied!
              </span>
            </div>
          )}
          
          <div className="mt-4 text-center text-sm text-gray-600">
            Rate: $0.01 per ID token • Enough for {Math.floor(calculator.idTokens / 10)} DID creations
          </div>
        </div>

        {/* Payment Method Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Payment Method
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => calculateTokens(usdAmount, 'stripe')}
              className={`p-4 border-2 rounded-lg transition-colors ${
                calculator.paymentMethod === 'stripe'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-center">
                <div className="text-lg font-semibold">💳 Credit Card</div>
                <div className="text-sm text-gray-600">Visa, Mastercard, Apple Pay</div>
                <div className="text-sm font-medium text-blue-600">Standard Rate</div>
              </div>
            </button>
            
            <button
              onClick={() => calculateTokens(usdAmount, 'crypto')}
              className={`p-4 border-2 rounded-lg transition-colors ${
                calculator.paymentMethod === 'crypto'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-center">
                <div className="text-lg font-semibold">⟠ Crypto</div>
                <div className="text-sm text-gray-600">ETH, USDC, ATOM</div>
                <div className="text-sm font-medium text-green-600">5% Discount</div>
              </div>
            </button>
          </div>
        </div>

        {/* Purchase Button */}
        <button
          onClick={() => handlePurchase(calculator.paymentMethod)}
          disabled={loading || !userAddress || calculator.usdAmount < 1}
          className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </span>
          ) : (
            `Purchase ${calculator.idTokens.toLocaleString()} ID Tokens`
          )}
        </button>

        {!userAddress && (
          <div className="mt-4 text-center p-3 bg-yellow-50 rounded-lg">
            <p className="text-yellow-800 text-sm">
              Connect your PersonaChain wallet to purchase ID tokens
            </p>
          </div>
        )}
      </div>
    </div>
  )
}