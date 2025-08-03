'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useWalletAuth } from '@/hooks/useWalletAuth'
import WalletAuthModal from './WalletAuthModal'

interface WalletAuthButtonProps {
  className?: string
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  onSuccess?: (user: unknown) => void
  children?: React.ReactNode
}

export default function WalletAuthButton({
  className = '',
  variant = 'primary',
  size = 'md',
  onSuccess,
  children
}: WalletAuthButtonProps) {
  const {
    isAuthenticated,
    user,
    disconnect,
    connectionStatus
  } = useWalletAuth()

  const [showModal, setShowModal] = useState(false)

  const handleSuccess = (user: unknown) => {
    setShowModal(false)
    onSuccess?.(user)
  }

  const handleDisconnect = async () => {
    await disconnect()
  }

  // Size classes
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  }

  // Variant classes
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white border-transparent',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white border-transparent',
    outline: 'bg-transparent hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-600'
  }

  const baseClasses = `
    inline-flex items-center justify-center
    font-medium rounded-lg border
    transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900
    disabled:opacity-50 disabled:cursor-not-allowed
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    ${className}
  `

  if (isAuthenticated && user) {
    return (
      <div className="relative group">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={baseClasses}
          title={`Connected: ${user.address}`}
        >
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="hidden sm:inline">
              {user.address.slice(0, 6)}...{user.address.slice(-4)}
            </span>
            <span className="sm:hidden">Connected</span>
          </div>
        </motion.button>

        {/* Dropdown Menu */}
        <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
          <div className="p-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {user.address?.charAt(0).toUpperCase() || 'P'}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Persona Wallet
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  PersonaChain
                </p>
              </div>
            </div>
            
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Address:</span>
                <span className="font-mono text-gray-900 dark:text-white">
                  {user.address.slice(0, 8)}...{user.address.slice(-6)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Status:</span>
                <span className="text-green-600 dark:text-green-400">
                  {user.isVerified ? 'Verified' : 'Connected'}
                </span>
              </div>
            </div>
            
            <button
              onClick={handleDisconnect}
              className="w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              Disconnect Wallet
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setShowModal(true)}
        className={baseClasses}
        disabled={connectionStatus === 'connecting'}
      >
        {connectionStatus === 'connecting' ? (
          <>
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
            Connecting...
          </>
        ) : (
          <>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            {children || 'Connect Wallet'}
          </>
        )}
      </motion.button>

      <WalletAuthModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleSuccess}
      />
    </>
  )
}