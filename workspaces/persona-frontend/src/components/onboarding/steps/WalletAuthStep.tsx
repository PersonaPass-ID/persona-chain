'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { StepProps } from './types'
import { useWalletAuth, WalletType } from '@/hooks/useWalletAuth'

interface WalletAuthStepProps extends StepProps {
  onWalletConnected?: (user: unknown) => void
}

export default function WalletAuthStep({ 
  onNext, 
  onWalletConnected 
}: WalletAuthStepProps) {
  const {
    isAuthenticated,
    user,
    isConnecting,
    error,
    availableWallets,
    connectWallet,
    disconnect,
    clearError,
    checkAuthHealth,
    isReady,
    connectionStatus,
    getInstalledWallets,
    getMissingWallets,
    hasWalletsInstalled
  } = useWalletAuth()

  const [selectedWallet, setSelectedWallet] = useState<WalletType | null>(null)
  const [showHealthCheck, setShowHealthCheck] = useState(false)
  const [showInstallGuide, setShowInstallGuide] = useState(false)

  // Handle successful authentication
  useEffect(() => {
    if (isAuthenticated && user) {
      onWalletConnected?.(user)
      // Auto-advance after success animation
      const timer = setTimeout(() => {
        onNext()
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [isAuthenticated, user, onNext, onWalletConnected])

  const handleWalletConnect = async (walletType: WalletType) => {
    setSelectedWallet(walletType)
    clearError()
    
    const result = await connectWallet(walletType)
    if (!result.success) {
      setSelectedWallet(null)
    }
  }

  const handleHealthCheck = async () => {
    setShowHealthCheck(true)
    const result = await checkAuthHealth()
    console.log('API Health:', result.success ? result.message : `Error: ${result.message}`)
  }

  const getWalletIcon = (walletType: WalletType) => {
    const icons = {
      keplr: (
        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
          <span className="text-white font-bold">K</span>
        </div>
      ),
      leap: (
        <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
          <span className="text-white font-bold">L</span>
        </div>
      ),
      cosmostation: (
        <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
          <span className="text-white font-bold">C</span>
        </div>
      ),
      'terra-station': (
        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
          <span className="text-white font-bold">T</span>
        </div>
      )
    }
    return icons[walletType]
  }

  const getWalletDescription = (walletType: WalletType) => {
    const descriptions = {
      keplr: 'The most popular Cosmos wallet with extensive ecosystem support',
      leap: 'Fast and user-friendly wallet with mobile support',
      cosmostation: 'Full-featured wallet with staking and governance features',
      'terra-station': 'Official Terra wallet with specialized Terra ecosystem features'
    }
    return descriptions[walletType]
  }

  const getInstallUrl = (walletType: WalletType) => {
    const urls = {
      keplr: 'https://chrome.google.com/webstore/detail/keplr/dmkamcknogkgcdfhhbddcghachkejeap',
      leap: 'https://chrome.google.com/webstore/detail/leap-cosmos-wallet/fcfcfllfndlomdhbehjjcoimbgofdncg',
      cosmostation: 'https://chrome.google.com/webstore/detail/cosmostation-wallet/fpkhgmpbidmiogeglndfbkegfdlnajnf',
      'terra-station': 'https://chrome.google.com/webstore/detail/terra-station-wallet/aiifbnbfobpmeekipheeijimdpnlpgpp'
    }
    return urls[walletType]
  }

  const installedWallets = getInstalledWallets()
  const missingWallets = getMissingWallets()

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full mx-auto mb-6 flex items-center justify-center">
          <span className="text-2xl">🌌</span>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Connect Your Cosmos Wallet
        </h1>
        
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Link your Cosmos wallet to PersonaPass for secure, decentralized authentication. 
          Your keys stay with you - we never store or access your private keys.
        </p>
      </motion.div>

      {/* Loading State */}
      {!isReady && (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            Detecting installed wallets...
          </p>
        </div>
      )}

      {/* Success State */}
      <AnimatePresence>
        {isAuthenticated && user && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="text-center py-8"
          >
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Wallet Connected Successfully!
            </h2>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 max-w-md mx-auto">
              <div className="flex items-center space-x-4 mb-4">
                {getWalletIcon(user.walletType as WalletType)}
                <div className="text-left">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {user.walletType.charAt(0).toUpperCase() + user.walletType.slice(1)} Wallet
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    PersonaChain Network
                  </p>
                </div>
              </div>
              
              <div className="text-left space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-300">Address:</span>
                  <span className="font-mono text-gray-900 dark:text-white">
                    {user.address.slice(0, 12)}...{user.address.slice(-8)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-300">Status:</span>
                  <span className="text-green-600 dark:text-green-400 font-medium">
                    {user.isVerified ? 'Verified' : 'Connected'}
                  </span>
                </div>
              </div>
            </div>
            
            <p className="text-gray-600 dark:text-gray-300 mt-6">
              Proceeding to the next step...
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Wallet Selection */}
      {isReady && !isAuthenticated && (
        <>
          {/* Installed Wallets */}
          {installedWallets.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Available Wallets
              </h3>
              <div className="space-y-3">
                {installedWallets.map((wallet, index) => {
                  const isConnecting = selectedWallet === wallet.type
                  
                  return (
                    <motion.button
                      key={wallet.type}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      disabled={isConnecting}
                      onClick={() => handleWalletConnect(wallet.type)}
                      className="w-full p-5 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 transform hover:scale-[1.02]"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          {getWalletIcon(wallet.type)}
                          <div className="text-left">
                            <h4 className="font-semibold text-gray-900 dark:text-white text-lg">
                              {wallet.name}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                              {getWalletDescription(wallet.type)}
                            </p>
                          </div>
                        </div>
                        
                        {isConnecting ? (
                          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded-full">
                              Installed
                            </span>
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </motion.button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Missing Wallets */}
          {missingWallets.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Available for Install
                </h3>
                <button
                  onClick={() => setShowInstallGuide(!showInstallGuide)}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  {showInstallGuide ? 'Hide' : 'Show'} Install Guide
                </button>
              </div>
              
              <div className="space-y-3">
                {missingWallets.map((wallet, index) => (
                  <motion.div
                    key={wallet.type}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (installedWallets.length + index) * 0.1 }}
                    className="w-full p-5 rounded-xl border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 opacity-75"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {getWalletIcon(wallet.type)}
                        <div className="text-left">
                          <h4 className="font-semibold text-gray-900 dark:text-white text-lg">
                            {wallet.name}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                            {getWalletDescription(wallet.type)}
                          </p>
                        </div>
                      </div>
                      
                      <a
                        href={getInstallUrl(wallet.type)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                      >
                        Install
                      </a>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* No Wallets */}
          {!hasWalletsInstalled() && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">💼</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                No Wallets Detected
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                You&apos;ll need to install a Cosmos wallet to continue. We recommend Keplr for the best experience.
              </p>
              <a
                href={getInstallUrl('keplr')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Install Keplr Wallet
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          )}

          {/* Install Guide */}
          <AnimatePresence>
            {showInstallGuide && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800"
              >
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-4">
                  How to Install a Wallet
                </h4>
                <ol className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                  <li className="flex items-start space-x-2">
                    <span className="bg-blue-200 dark:bg-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium">1</span>
                    <span>Click &ldquo;Install&rdquo; next to your preferred wallet</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="bg-blue-200 dark:bg-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium">2</span>
                    <span>Add the extension to your browser</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="bg-blue-200 dark:bg-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium">3</span>
                    <span>Create a new wallet or import an existing one</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="bg-blue-200 dark:bg-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium">4</span>
                    <span>Refresh this page and connect your wallet</span>
                  </li>
                </ol>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl"
          >
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                  Connection Failed
                </h4>
                <p className="text-sm text-red-700 dark:text-red-300">
                  {error}
                </p>
                <button
                  onClick={clearError}
                  className="mt-2 text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium"
                >
                  Try Again
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Security Info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700"
      >
        <div className="flex items-start space-x-3">
          <div className="text-purple-500 mt-0.5">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h4 className="font-medium text-purple-800 dark:text-purple-200 mb-1">
              Your Keys, Your Control
            </h4>
            <p className="text-purple-700 dark:text-purple-300 text-sm">
              PersonaPass uses signature-based authentication. Your private keys never leave your wallet, 
              and we can&apos;t access your funds or make transactions on your behalf. We only verify your identity 
              through cryptographic signatures.
            </p>
          </div>
        </div>
      </motion.div>

      {/* API Health Check */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleHealthCheck}
          className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex items-center space-x-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Test Authentication API</span>
        </button>
        
        <div className="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>Connection: {connectionStatus}</span>
          <span className={`px-2 py-1 rounded ${
            connectionStatus === 'connected' 
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
              : connectionStatus === 'connecting'
              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
          }`}>
            {connectionStatus}
          </span>
        </div>
      </div>
    </div>
  )
}