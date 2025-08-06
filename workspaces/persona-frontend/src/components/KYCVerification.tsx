/**
 * KYC Verification Component
 * Complete identity verification system with sybil attack prevention
 */

'use client'

import { useState, useEffect } from 'react'
import { kycManager, KYCProvider, KYCVerificationData, SybilProtection } from '@/lib/kyc-verification'
import walletAuthClient from '@/lib/wallet-auth-client-v2'
import DiditKYCComponent from './DiditKYCComponent'

interface VerificationStatus {
  isVerified: boolean
  verificationLevel: 'none' | 'basic' | 'standard' | 'premium'
  verifications: KYCVerificationData[]
  canClaimFreeTokens: boolean
  nextClaimDate?: string
  privileges: string[]
  requirements: string[]
}

export default function KYCVerification() {
  const [userAddress, setUserAddress] = useState<string>('')
  const [status, setStatus] = useState<VerificationStatus | null>(null)
  const [providers, setProviders] = useState<KYCProvider[]>([])
  const [selectedProvider, setSelectedProvider] = useState<string>('')
  const [verificationType, setVerificationType] = useState<'identity' | 'address' | 'phone' | 'email'>('identity')
  const [loading, setLoading] = useState(false)
  const [claiming, setClaiming] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null)

  useEffect(() => {
    const user = walletAuthClient.getStoredUser()
    if (user?.address) {
      setUserAddress(user.address)
      loadKYCStatus(user.address)
    }

    const availableProviders = kycManager.getProviders()
    setProviders(availableProviders)
    if (availableProviders.length > 0) {
      setSelectedProvider(availableProviders[0].id)
    }
  }, [])

  const loadKYCStatus = async (address: string) => {
    try {
      const kycStatus = await kycManager.checkKYCStatus(address)
      setStatus(kycStatus)
    } catch (error) {
      console.error('Failed to load KYC status:', error)
    }
  }

  const handleStartVerification = async () => {
    if (!userAddress || !selectedProvider) return

    setLoading(true)
    setMessage(null)

    try {
      const result = await kycManager.initiateKYCVerification({
        userAddress,
        providerId: selectedProvider,
        verificationType
      })

      if (result.success && result.redirectUrl) {
        setMessage({
          type: 'info',
          text: `Verification started! Cost: ${result.cost} ID tokens. Opening verification window...`
        })
        
        // Open verification in new window
        window.open(result.redirectUrl, 'kyc_verification', 'width=800,height=600,scrollbars=yes,resizable=yes')
        
        // Refresh status after a delay to check for updates
        setTimeout(() => loadKYCStatus(userAddress), 5000)
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'Failed to start verification'
        })
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Verification initiation failed'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClaimFreeTokens = async () => {
    if (!userAddress) return

    setClaiming(true)
    setMessage(null)

    try {
      const result = await kycManager.claimFreeTokens(userAddress)

      if (result.success) {
        setMessage({
          type: 'success',
          text: `🎉 Successfully claimed ${result.tokensAwarded} free ID tokens!`
        })
        
        // Refresh status
        loadKYCStatus(userAddress)
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'Failed to claim free tokens'
        })
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Token claim failed'
      })
    } finally {
      setClaiming(false)
    }
  }

  const getVerificationLevelColor = (level: string) => {
    switch (level) {
      case 'premium': return 'text-purple-600 bg-purple-100'
      case 'standard': return 'text-blue-600 bg-blue-100'
      case 'basic': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getVerificationLevelIcon = (level: string) => {
    switch (level) {
      case 'premium': return '👑'
      case 'standard': return '🛡️'
      case 'basic': return '✅'
      default: return '❓'
    }
  }

  if (!userAddress) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Connect Your Wallet</h3>
          <p className="text-yellow-700">Please connect your PersonaChain wallet to access KYC verification.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Identity Verification</h1>
        <p className="text-gray-600">
          Verify your identity to claim free ID tokens and prevent sybil attacks
        </p>
      </div>

      {/* Status Card */}
      {status && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Verification Status</h2>
            <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${getVerificationLevelColor(status.verificationLevel)}`}>
              <span>{getVerificationLevelIcon(status.verificationLevel)}</span>
              {status.verificationLevel.charAt(0).toUpperCase() + status.verificationLevel.slice(1)} Level
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Verification Info */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Current Verifications</h3>
              {status.verifications.length > 0 ? (
                <div className="space-y-2">
                  {status.verifications.map((verification, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <span className="font-medium capitalize">{verification.verificationType}</span>
                        <p className="text-sm text-gray-600">{verification.provider}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        verification.status === 'verified' ? 'bg-green-100 text-green-800' :
                        verification.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {verification.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No verifications completed</p>
              )}
            </div>

            {/* Privileges */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Your Privileges</h3>
              {status.privileges.length > 0 ? (
                <ul className="space-y-1">
                  {status.privileges.map((privilege, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      {privilege.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-sm">No special privileges yet</p>
              )}
            </div>
          </div>

          {/* Free Token Claim */}
          {status.canClaimFreeTokens && (
            <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-green-800">🎁 Free Tokens Available!</h3>
                  <p className="text-sm text-green-600 mt-1">
                    You can claim 100 free ID tokens this month as a verified user
                  </p>
                </div>
                <button
                  onClick={handleClaimFreeTokens}
                  disabled={claiming}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {claiming ? 'Claiming...' : 'Claim 100 ID Tokens'}
                </button>
              </div>
            </div>
          )}

          {/* Next Claim Date */}
          {status.nextClaimDate && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Next claim available:</strong> {new Date(status.nextClaimDate).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
      )}

      {/* DIDIT FREE KYC - NEW PREFERRED OPTION */}
      {(!status?.isVerified || status.verificationLevel === 'basic') && (
        <DiditKYCComponent 
          userAddress={userAddress}
          userTier="free"
          onVerificationComplete={(result) => {
            if (result.success) {
              setMessage({
                type: 'success',
                text: '🎉 FREE KYC verification completed! You can now claim ID tokens.'
              })
              loadKYCStatus(userAddress)
            }
          }}
        />
      )}

      {/* Legacy Verification Options (Fallback) */}
      {(!status?.isVerified || status.verificationLevel === 'basic') && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Alternative Verification Methods</h2>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800">
              <strong>💡 Tip:</strong> Use Didit (above) for FREE unlimited verification. The options below are legacy providers with costs.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Verification Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Verification Type
              </label>
              <div className="space-y-2">
                {(['identity', 'address', 'phone', 'email'] as const).map(type => (
                  <label key={type} className="flex items-center">
                    <input
                      type="radio"
                      value={type}
                      checked={verificationType === type}
                      onChange={(e) => setVerificationType(e.target.value as any)}
                      className="mr-2"
                    />
                    <span className="capitalize font-medium">{type}</span>
                    {type === 'identity' && (
                      <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                        Required for free tokens
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Provider Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Verification Provider
              </label>
              <div className="space-y-3">
                {providers.map(provider => (
                  <label key={provider.id} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      value={provider.id}
                      checked={selectedProvider === provider.id}
                      onChange={(e) => setSelectedProvider(e.target.value)}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <div className="font-medium">{provider.name}</div>
                      <div className="text-sm text-gray-600">
                        Cost: {provider.cost} ID tokens • {provider.processingTime}
                      </div>
                      <div className="text-xs text-gray-500">
                        Accuracy: {provider.accuracy}%
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={handleStartVerification}
              disabled={loading || !selectedProvider}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Starting Verification...' : `Start ${verificationType.charAt(0).toUpperCase() + verificationType.slice(1)} Verification`}
            </button>
          </div>
        </div>
      )}

      {/* Requirements */}
      {status && status.requirements.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="font-medium text-yellow-800 mb-3">Requirements for Free Tokens</h3>
          <ul className="space-y-1">
            {status.requirements.map((req, index) => (
              <li key={index} className="text-sm text-yellow-700 flex items-start gap-2">
                <span className="text-yellow-500 mt-0.5">•</span>
                {req}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Sybil Protection Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-medium text-blue-800 mb-3">🛡️ Sybil Attack Prevention</h3>
        <p className="text-sm text-blue-700 mb-3">
          Identity verification ensures one person = one account, preventing fake users from claiming multiple free token allocations.
        </p>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <strong className="text-blue-800">What we verify:</strong>
            <ul className="mt-1 space-y-1 text-blue-600">
              <li>• Government-issued photo ID</li>
              <li>• Address verification</li>
              <li>• Phone number confirmation</li>
              <li>• Email address validation</li>
            </ul>
          </div>
          <div>
            <strong className="text-blue-800">Benefits:</strong>
            <ul className="mt-1 space-y-1 text-blue-600">
              <li>• 100 free ID tokens monthly</li>
              <li>• Discounted API costs</li>
              <li>• Higher transaction limits</li>
              <li>• Platform governance rights</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' :
          message.type === 'error' ? 'bg-red-50 border border-red-200 text-red-800' :
          'bg-blue-50 border border-blue-200 text-blue-800'
        }`}>
          {message.text}
        </div>
      )}
    </div>
  )
}