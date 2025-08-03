'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useWalletAuth, WalletType } from '@/hooks/useWalletAuth'
import { Navigation } from '@/components/Navigation'
import Image from 'next/image'

// Wallet logos (using placeholder paths - replace with actual assets)
const walletLogos = {
  keplr: '/wallets/keplr.svg',
  cosmostation: '/wallets/cosmostation.svg',
  leap: '/wallets/leap.svg',
  metamask: '/wallets/metamask.svg'
}

export default function AuthPage() {
  const router = useRouter()
  const {
    isAuthenticated,
    user,
    isConnecting,
    isInitializing,
    error,
    availableWallets,
    connectWallet,
    clearError,
    isReady,
    connectionStatus
  } = useWalletAuth()

  const [showSigningMessage, setShowSigningMessage] = useState(false)
  const [securityUnlockRequired, setSecurityUnlockRequired] = useState(false)
  const [enhancedSecurityRequired, setEnhancedSecurityRequired] = useState(false)
  const [challengeNumber, setChallengeNumber] = useState(1)

  // Check for security requirements in URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const security = urlParams.get('security')
      const challenge = urlParams.get('challenge')
      
      if (security === 'unlock_required') {
        setSecurityUnlockRequired(true)
        console.log('🔐 SECURITY: Forced wallet unlock required')
      } else if (security === 'enhanced_verification') {
        setEnhancedSecurityRequired(true)
        setChallengeNumber(parseInt(challenge || '1'))
        console.log(`🛡️ ENHANCED SECURITY: Multi-signature verification required - Challenge ${challenge}/3`)
      }
    }
  }, [])

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated && user && !isInitializing) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, user, isInitializing, router])

  // Show loading screen while initializing
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-300">Initializing PersonaPass...</p>
        </div>
      </div>
    )
  }

  const handleWalletConnect = async (walletType: WalletType) => {
    clearError()
    setShowSigningMessage(true)
    
    const result = await connectWallet(walletType)
    
    if (result.success) {
      // Will auto-redirect via useEffect
    } else {
      setShowSigningMessage(false)
    }
  }

  const getWalletLogo = (walletType: WalletType) => {
    switch (walletType) {
      case 'keplr':
        return (
          <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-lg">K</span>
          </div>
        )
      case 'cosmostation':
        return (
          <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-lg">C</span>
          </div>
        )
      case 'leap':
        return (
          <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-lg">L</span>
          </div>
        )
      case 'terra-station':
        return (
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-lg">T</span>
          </div>
        )
      default:
        return (
          <div className="w-12 h-12 bg-gray-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-lg">W</span>
          </div>
        )
    }
  }

  if (!isReady) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="pt-24 pb-16">
        <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {enhancedSecurityRequired ? (
                <>
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h1 className="text-3xl font-bold text-purple-900 mb-2">
                    🛡️ Enhanced Security Verification
                  </h1>
                  <p className="text-purple-700">
                    Challenge {challengeNumber}/3: Multi-signature verification in progress. Connect your wallet to continue the security verification process.
                  </p>
                </>
              ) : securityUnlockRequired ? (
                <>
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h1 className="text-3xl font-bold text-red-900 mb-2">
                    🔐 Security Check Required
                  </h1>
                  <p className="text-red-700">
                    For maximum security, you must unlock your wallet with your password and reconnect to access your credentials
                  </p>
                </>
              ) : (
                <>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Connect Your Wallet
                  </h1>
                  <p className="text-gray-600">
                    Sign in to PersonaPass with your Web3 wallet to access your digital identity
                  </p>
                </>
              )}
            </motion.div>
          </div>

          {/* Wallet Connection Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            {/* Enhanced Security Alert */}
            {enhancedSecurityRequired && (
              <div className="mb-6 bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-purple-800">
                      🛡️ Multi-Signature Security Challenge {challengeNumber}/3
                    </h3>
                    <div className="mt-2 text-sm text-purple-700">
                      <p><strong>Enhanced Security Protocol Active:</strong> Your credentials contain sensitive identity information that requires maximum protection.</p>
                      <div className="mt-2 space-y-1">
                        <div className={`flex items-center ${challengeNumber >= 1 ? 'text-purple-800 font-medium' : 'text-purple-600'}`}>
                          {challengeNumber > 1 ? '✅' : '🔄'} Challenge 1: Wallet Ownership Verification
                        </div>
                        <div className={`flex items-center ${challengeNumber >= 2 ? 'text-purple-800 font-medium' : 'text-purple-500'}`}>
                          {challengeNumber > 2 ? '✅' : challengeNumber === 2 ? '🔄' : '⏳'} Challenge 2: Identity Confirmation
                        </div>
                        <div className={`flex items-center ${challengeNumber >= 3 ? 'text-purple-800 font-medium' : 'text-purple-500'}`}>
                          {challengeNumber === 3 ? '🔄' : '⏳'} Challenge 3: Access Authorization
                        </div>
                      </div>
                      <p className="mt-2 font-medium">Connect your wallet to continue with Challenge {challengeNumber}.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Security Alert for Forced Unlock */}
            {securityUnlockRequired && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      🔒 Mandatory Security Verification
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>You were disconnected for security reasons. To access your credentials, you must:</p>
                      <ul className="mt-2 list-disc list-inside space-y-1">
                        <li>Unlock your wallet by entering your password</li>
                        <li>Reconnect to PersonaPass</li>
                        <li>Sign a verification message to prove wallet ownership</li>
                      </ul>
                      <p className="mt-2 font-medium">This ensures only you can access your verifiable credentials.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Connection Status */}
            {showSigningMessage && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg"
              >
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
                  <p className="text-sm text-blue-800">
                    Please sign the message in your wallet to authenticate...
                  </p>
                </div>
              </motion.div>
            )}

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"
                >
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-red-500 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm text-red-800">{error}</p>
                      <button
                        onClick={clearError}
                        className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Wallet Options */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700 mb-4">
                {enhancedSecurityRequired 
                  ? `🛡️ Challenge ${challengeNumber}/3: Connect wallet for signature verification`
                  : securityUnlockRequired 
                  ? '🔐 Unlock your wallet with password and reconnect' 
                  : 'Choose your wallet provider'}
              </h3>
              
              {availableWallets.map((wallet, index) => (
                <motion.button
                  key={wallet.type}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  onClick={() => handleWalletConnect(wallet.type)}
                  disabled={!wallet.isInstalled || isConnecting}
                  className={`
                    w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all
                    ${wallet.isInstalled 
                      ? 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 cursor-pointer' 
                      : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-60'}
                    ${isConnecting ? 'pointer-events-none opacity-50' : ''}
                  `}
                >
                  <div className="flex items-center">
                    {getWalletLogo(wallet.type)}
                    <div className="ml-4 text-left">
                      <h4 className="font-semibold text-gray-900">{wallet.name}</h4>
                      <p className="text-xs text-gray-500">
                        {wallet.isInstalled ? 'Ready to connect' : 'Not installed'}
                      </p>
                    </div>
                  </div>
                  
                  {wallet.isInstalled ? (
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  ) : (
                    <a
                      href={`https://www.${wallet.type}.app`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                      Install
                    </a>
                  )}
                </motion.button>
              ))}
            </div>

            {/* Help Text */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                By connecting your wallet, you agree to our{' '}
                <a href="/terms" className="text-blue-600 hover:text-blue-800 underline">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="/privacy" className="text-blue-600 hover:text-blue-800 underline">
                  Privacy Policy
                </a>
              </p>
            </div>
          </motion.div>

          {/* Additional Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-8 text-center"
          >
            <h3 className="text-sm font-medium text-gray-700 mb-4">
              Why connect your wallet?
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-600">Secure Authentication</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-600">Privacy Protected</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-2">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                  </svg>
                </div>
                <p className="text-sm text-gray-600">Self-Sovereign Identity</p>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  )
}