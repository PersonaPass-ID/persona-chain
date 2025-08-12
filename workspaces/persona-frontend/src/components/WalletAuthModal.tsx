'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWalletAuth, WalletType } from '@/hooks/useWalletAuth'
import { createAppKit } from '@reown/appkit/react'
import { mainnet, polygon, arbitrum } from '@reown/appkit/networks'

interface WalletAuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (user: unknown) => void
  title?: string
  subtitle?: string
}

export default function WalletAuthModal({
  isOpen,
  onClose,
  onSuccess,
  title = "Connect Your Wallet",
  subtitle = "Choose your preferred Cosmos wallet to authenticate with PersonaPass"
}: WalletAuthModalProps) {
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
    connectionStatus
  } = useWalletAuth()

  const [selectedWallet, setSelectedWallet] = useState<WalletType | null>(null)
  const [showHealthCheck, setShowHealthCheck] = useState(false)
  const [healthStatus, setHealthStatus] = useState<string>('')

  // Handle successful authentication
  useEffect(() => {
    if (isAuthenticated && user && onSuccess) {
      onSuccess(user)
    }
  }, [isAuthenticated, user, onSuccess])

  // Clear error when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      clearError()
    }
  }, [isOpen, clearError])

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
    setHealthStatus(result.success ? result.message : `Error: ${result.message}`)
  }

  const getWalletIcon = (walletType: WalletType) => {
    const icons = {
      keplr: (
        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">K</span>
        </div>
      ),
      leap: (
        <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">L</span>
        </div>
      ),
      cosmostation: (
        <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">C</span>
        </div>
      ),
      'terra-station': (
        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">T</span>
        </div>
      ),
      'walletconnect': (
        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">WC</span>
        </div>
      ),
      'reown': (
        <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">R</span>
        </div>
      )
    }
    return icons[walletType]
  }

  const getWalletStatus = (walletType: WalletType) => {
    const wallet = availableWallets.find(w => w.type === walletType)
    if (!wallet) return { installed: false, connecting: false }
    
    return {
      installed: wallet.isInstalled,
      connecting: isConnecting && selectedWallet === walletType
    }
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed top-0 left-0 w-full h-full flex items-center justify-center p-4"
      style={{ 
        zIndex: 999999, 
        position: 'fixed',
        backgroundColor: 'rgba(0, 0, 0, 0.75)'
      }}
      onClick={onClose}
    >
      {/* Modal */}
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-200"
        style={{ zIndex: 999999 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {title}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {subtitle}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Loading State */}
          {!isReady && (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-300">Detecting wallets...</p>
            </div>
          )}

          {/* Success State */}
          {isAuthenticated && user && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-6"
            >
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Successfully Connected!
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-1">
                Wallet: {user.walletType}
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-xs font-mono">
                {user.address.slice(0, 12)}...{user.address.slice(-8)}
              </p>
              <div className="mt-4 space-y-2">
                <button
                  onClick={onClose}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Continue
                </button>
                <button
                  onClick={disconnect}
                  className="w-full px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Disconnect
                </button>
              </div>
            </motion.div>
          )}

          {/* Wallet Selection */}
          {isReady && !isAuthenticated && (
            <div className="space-y-3">
              {(['keplr', 'leap', 'cosmostation', 'terra-station', 'reown'] as WalletType[]).map((walletType) => {
                const wallet = availableWallets.find(w => w.type === walletType)
                const status = getWalletStatus(walletType)
                
                return (
                  <motion.button
                    key={walletType}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    disabled={!status.installed || status.connecting}
                    onClick={() => handleWalletConnect(walletType)}
                    className={`w-full p-4 rounded-xl border-2 transition-all duration-200 ${
                      status.installed
                        ? 'border-gray-200 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 bg-white dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                        : 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getWalletIcon(walletType)}
                        <div className="text-left">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {wallet?.name || walletType}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {status.installed ? 'Ready to connect' : 'Not installed'}
                          </div>
                        </div>
                      </div>
                      
                      {status.connecting ? (
                        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      ) : status.installed ? (
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      ) : (
                        <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded">
                          Install
                        </span>
                      )}
                    </div>
                  </motion.button>
                )
              })}
            </div>
          )}

          {/* Error Display */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg"
              >
                <div className="flex items-start space-x-2">
                  <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                      Connection Failed
                    </p>
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                      {error}
                    </p>
                  </div>
                </div>
                <button
                  onClick={clearError}
                  className="mt-2 text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                >
                  Dismiss
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Health Check */}
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleHealthCheck}
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex items-center space-x-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Test API Connection</span>
            </button>
            
            {showHealthCheck && (
              <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded text-xs font-mono text-gray-600 dark:text-gray-300">
                {healthStatus}
              </div>
            )}
          </div>

          {/* Connection Status */}
          <div className="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Status: {connectionStatus}</span>
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
    </div>
  )
}