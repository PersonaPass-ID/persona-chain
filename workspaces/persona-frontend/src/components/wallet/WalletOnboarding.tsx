'use client'

import { useState, useEffect } from 'react'
import { personaApiClient } from '@/lib/api-client-updated'
import { walletAuth } from '@/lib/wallet-auth-secure'
import '@/types/wallet'

// Onboarding step types
type OnboardingStep = 
  | 'wallet-connection'
  | 'existing-user-check' 
  | 'identity-creation'
  | 'recovery-setup'
  | 'welcome'

interface WalletInfo {
  address: string
  publicKey: string
  walletType: 'keplr' | 'leap' | 'cosmostation' | 'terra-station'
}

interface UserProfile {
  walletAddress: string
  firstName: string
  lastName: string
  did: string
  walletType: string
  hasExistingDID: boolean
}

export default function WalletOnboarding() {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('wallet-connection')
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Identity creation form state (moved to top level)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')

  // Reset error when step changes
  useEffect(() => {
    setError(null)
  }, [currentStep])

  // Get available wallets with installation status
  const getAvailableWallets = () => {
    const wallets = [
      {
        type: 'keplr' as const,
        name: 'Keplr',
        isInstalled: typeof window !== 'undefined' && !!window.keplr
      },
      {
        type: 'leap' as const,
        name: 'Leap',
        isInstalled: typeof window !== 'undefined' && !!window.leap
      },
      {
        type: 'cosmostation' as const,
        name: 'Cosmostation',
        isInstalled: typeof window !== 'undefined' && !!window.cosmostation
      },
      {
        type: 'terra-station' as const,
        name: 'Terra Station',
        isInstalled: typeof window !== 'undefined' && !!window.station
      }
    ]
    return wallets
  }

  // Step 1: Wallet Connection
  const handleWalletConnection = async (walletType: 'keplr' | 'leap' | 'cosmostation' | 'terra-station') => {
    setLoading(true)
    setError(null)
    
    try {
      // Generate authentication challenge
      const tempAddress = await getWalletAddress(walletType)
      const challenge = await walletAuth.generateAuthChallenge(tempAddress)
      
      // Get wallet signature
      const signature = await signWalletChallenge(walletType, challenge.challenge)
      
      // Verify signature and create session
      const authResult = await walletAuth.verifyWalletSignature(
        challenge.nonce,
        signature,
        tempAddress
      )
      
      if (!authResult.success) {
        throw new Error('Wallet signature verification failed')
      }

      const wallet: WalletInfo = {
        address: tempAddress,
        publicKey: signature.publicKey,
        walletType: walletType
      }

      // Batch state updates and defer async call
      setWalletInfo(wallet)
      setCurrentStep('existing-user-check')
      
      // Defer the async call to prevent React error
      setTimeout(() => {
        checkExistingUser(wallet)
      }, 100)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect wallet')
    } finally {
      setLoading(false)
    }
  }

  // Helper: Get wallet address
  const getWalletAddress = async (walletType: string): Promise<string> => {
    if (typeof window === 'undefined') {
      throw new Error('Wallet not available on server side')
    }

    switch (walletType) {
      case 'keplr':
        if (!window.keplr) {
          throw new Error('Keplr wallet not installed')
        }
        await window.keplr.enable('cosmoshub-4')
        const keplrAccount = await window.keplr.getKey('cosmoshub-4')
        return keplrAccount.bech32Address
      
      case 'leap':
        if (!window.leap) {
          throw new Error('Leap wallet not installed')
        }
        await window.leap.enable('cosmoshub-4')
        const leapAccount = await window.leap.getKey('cosmoshub-4')
        return leapAccount.bech32Address
      
      default:
        throw new Error(`Wallet type ${walletType} not supported yet`)
    }
  }

  // Helper: Sign wallet challenge
  const signWalletChallenge = async (walletType: string, challenge: string): Promise<{
    signature: string;
    publicKey: string;
    algorithm: string;
  }> => {
    if (typeof window === 'undefined') {
      throw new Error('Wallet not available on server side')
    }

    switch (walletType) {
      case 'keplr':
        if (!window.keplr) {
          throw new Error('Keplr wallet not installed')
        }
        const keplrSignature = await window.keplr.signArbitrary(
          'cosmoshub-4',
          await getWalletAddress(walletType),
          challenge
        )
        return {
          signature: keplrSignature.signature,
          publicKey: keplrSignature.pub_key.value,
          algorithm: 'secp256k1'
        }
      
      case 'leap':
        if (!window.leap) {
          throw new Error('Leap wallet not installed')
        }
        const leapSignature = await window.leap.signArbitrary(
          'cosmoshub-4',
          await getWalletAddress(walletType),
          challenge
        )
        return {
          signature: leapSignature.signature,
          publicKey: leapSignature.pub_key.value,
          algorithm: 'secp256k1'
        }
      
      default:
        throw new Error(`Wallet type ${walletType} not supported yet`)
    }
  }

  // Step 2: Check for Existing User
  const checkExistingUser = async (wallet: WalletInfo) => {
    setLoading(true)
    
    try {
      const existingAuth = await personaApiClient.checkExistingWalletAuth(wallet.address)
      
      if (existingAuth.hasExistingDID && existingAuth.profile) {
        // Existing user - auto-login
        const profile: UserProfile = {
          ...existingAuth.profile,
          hasExistingDID: true
        }
        
        // Batch state updates to prevent React error
        setTimeout(() => {
          setUserProfile(profile)
          personaApiClient.storeWalletProfile(existingAuth.profile)
          setCurrentStep('welcome')
          setLoading(false)
        }, 0)
        return
      } else {
        // New user - continue to identity creation
        setTimeout(() => {
          setCurrentStep('identity-creation')
          setLoading(false)
        }, 0)
        return
      }
    } catch (err) {
      console.error('Failed to check existing user:', err)
      // Continue to identity creation even if check fails
      setTimeout(() => {
        setCurrentStep('identity-creation')
        setLoading(false)
      }, 0)
    }
  }

  // Step 3: Create Identity
  const handleIdentityCreation = async (firstName: string, lastName: string) => {
    if (!walletInfo) return

    setLoading(true)
    setError(null)
    
    try {
      const result = await personaApiClient.createDID(
        walletInfo.address,
        firstName,
        lastName,
        walletInfo.walletType,
        walletInfo.address // Using wallet address as identifier
      )

      if (!result.success) {
        throw new Error(result.error || 'Failed to create DID')
      }

      const profile: UserProfile = {
        walletAddress: walletInfo.address,
        firstName,
        lastName,
        did: result.did!,
        walletType: walletInfo.walletType,
        hasExistingDID: false
      }

      setUserProfile(profile)
      setCurrentStep('recovery-setup')

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create identity')
    } finally {
      setLoading(false)
    }
  }

  // Step 4: Recovery Setup (for now, just skip to welcome)
  const handleRecoverySetup = (skipRecovery: boolean = false) => {
    if (userProfile) {
      personaApiClient.storeWalletProfile({
        walletAddress: userProfile.walletAddress,
        firstName: userProfile.firstName,
        lastName: userProfile.lastName,
        username: `${userProfile.firstName} ${userProfile.lastName}`.trim(),
        did: userProfile.did,
        walletType: userProfile.walletType,
        createdAt: new Date().toISOString()
      })
    }
    
    setCurrentStep('welcome')
  }

  // Render wallet connection step
  const renderWalletConnection = () => (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Connect Your Wallet</h1>
        <p className="text-gray-600">Choose your preferred wallet to get started with PersonaPass</p>
      </div>

      <div className="space-y-3">
        {getAvailableWallets().map((wallet) => (
          <button
            key={wallet.type}
            onClick={() => handleWalletConnection(wallet.type)}
            disabled={!wallet.isInstalled || loading}
            className={`w-full p-4 rounded-lg border-2 transition-colors ${
              wallet.isInstalled 
                ? 'border-blue-200 hover:border-blue-400 hover:bg-blue-50' 
                : 'border-gray-200 bg-gray-50 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mr-3"></div>
                <div className="text-left">
                  <div className="font-semibold text-gray-900">{wallet.name}</div>
                  <div className="text-sm text-gray-500">
                    {wallet.isInstalled ? 'Ready to connect' : 'Not installed'}
                  </div>
                </div>
              </div>
              {wallet.isInstalled && (
                <div className="text-green-500">✓</div>
              )}
            </div>
          </button>
        ))}
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {loading && (
        <div className="mt-4 text-center">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <p className="text-sm text-gray-600 mt-2">Connecting wallet...</p>
        </div>
      )}
    </div>
  )

  // Render existing user check
  const renderExistingUserCheck = () => (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Checking Your Wallet</h2>
        <p className="text-gray-600">Looking for existing PersonaPass identity...</p>
        <p className="text-sm text-gray-500 mt-2">Wallet: {walletInfo?.address?.substring(0, 20)}...</p>
      </div>
    </div>
  )

  // Render identity creation form
  const renderIdentityCreation = () => {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Your Identity</h2>
          <p className="text-gray-600">Set up your decentralized identity on PersonaChain</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Name
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              placeholder="Enter your first name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Name
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              placeholder="Enter your last name"
            />
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Your DID Preview</h3>
            <p className="text-sm text-blue-700 mb-1">
              {personaApiClient.generateWalletDID(walletInfo?.address || '')}
            </p>
            <div className="text-xs text-blue-600 space-y-1">
              <div>✅ Stored on PersonaChain</div>
              <div>✅ Linked to your wallet</div>
              <div>✅ You control 100%</div>
            </div>
          </div>

          <button
            onClick={() => handleIdentityCreation(firstName, lastName)}
            disabled={!firstName.trim() || !lastName.trim() || loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Identity...' : 'Create Identity'}
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
      </div>
    )
  }

  // Render recovery setup
  const renderRecoverySetup = () => (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">🔐 Account Recovery</h2>
        <p className="text-gray-600">Set up recovery methods to secure your account</p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <div className="text-yellow-500 mr-2">⚠️</div>
          <div>
            <p className="text-sm font-semibold text-yellow-800">Important!</p>
            <p className="text-sm text-yellow-700">
              Set up recovery before you lose access to your wallet
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-2">📱 Recovery Phrase (Recommended)</h3>
          <p className="text-sm text-gray-600 mb-3">
            Write down a 12-word phrase to recover your account
          </p>
          <button 
            onClick={() => alert('Recovery phrase feature coming soon!')}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700"
          >
            Generate Recovery Phrase
          </button>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-2">👥 Social Recovery</h3>
          <p className="text-sm text-gray-600 mb-3">
            Add trusted friends who can help you recover your account
          </p>
          <button 
            onClick={() => alert('Social recovery feature coming soon!')}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700"
          >
            Add Guardians
          </button>
        </div>
      </div>

      <div className="flex space-x-3 mt-6">
        <button 
          onClick={() => handleRecoverySetup(true)}
          className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-300"
        >
          Skip for Now
        </button>
        <button 
          onClick={() => handleRecoverySetup(false)}
          className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700"
        >
          Setup Recovery
        </button>
      </div>
    </div>
  )

  // Render welcome screen
  const renderWelcome = () => (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="text-center mb-6">
        <div className="text-4xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {userProfile?.hasExistingDID ? 'Welcome Back!' : 'Welcome to PersonaPass!'}
        </h2>
        <p className="text-gray-600">
          {userProfile?.hasExistingDID 
            ? 'Your decentralized identity is ready to use'
            : 'Your decentralized identity has been created'
          }
        </p>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="space-y-2 text-sm">
          <div className="flex items-center">
            <span className="text-green-500 mr-2">✅</span>
            <span className="text-green-800">DID: {userProfile?.did?.substring(0, 30)}...</span>
          </div>
          <div className="flex items-center">
            <span className="text-green-500 mr-2">✅</span>
            <span className="text-green-800">Wallet: {userProfile?.walletAddress?.substring(0, 20)}...</span>
          </div>
          <div className="flex items-center">
            <span className="text-green-500 mr-2">✅</span>
            <span className="text-green-800">Name: {userProfile?.firstName} {userProfile?.lastName}</span>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-blue-900 mb-2">Quick Start Actions</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Verify your identity with zero-knowledge proofs</li>
          <li>• Connect with DApps using your PersonaPass DID</li>
          <li>• Share credentials without revealing private data</li>
          <li>• Manage your identity across the web3 ecosystem</li>
        </ul>
      </div>

      <div className="space-y-3">
        <button 
          onClick={() => window.location.href = '/dashboard'}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700"
        >
          View Dashboard
        </button>
        
        {!userProfile?.hasExistingDID && (
          <button 
            onClick={() => setCurrentStep('recovery-setup')}
            className="w-full bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-300"
          >
            Add Recovery Methods
          </button>
        )}
      </div>
    </div>
  )

  // Main render logic
  switch (currentStep) {
    case 'wallet-connection':
      return renderWalletConnection()
    case 'existing-user-check':
      return renderExistingUserCheck()
    case 'identity-creation':
      return renderIdentityCreation()
    case 'recovery-setup':
      return renderRecoverySetup()
    case 'welcome':
      return renderWelcome()
    default:
      return renderWalletConnection()
  }
}