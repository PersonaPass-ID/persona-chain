'use client'

import { useState } from 'react'
import WalletAuthModal from '@/components/WalletAuthModal'

const SignInPage = () => {
  const [showWalletModal, setShowWalletModal] = useState(false)

  const handleWalletSuccess = (user: any) => {
    setShowWalletModal(false)
    // Redirect to dashboard after successful wallet connection
    window.location.href = '/dashboard'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mb-6">
            <span className="text-white font-bold text-xl">P</span>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">
            Welcome to PersonaPass
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Connect your wallet to access your decentralized identity
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl rounded-2xl sm:px-10">
          <div className="space-y-6">
            <button
              onClick={() => setShowWalletModal(true)}
              className="w-full flex justify-center items-center py-4 px-6 border border-transparent rounded-xl shadow-sm text-base font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
            >
              <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Connect Wallet
            </button>

            <div className="text-center">
              <p className="text-xs text-gray-500">
                Secure access with your crypto wallet
              </p>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <div className="text-sm text-gray-600 space-y-2">
                <div className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>300+ wallets supported via Reown</span>
                </div>
                <div className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Mobile wallet compatibility</span>
                </div>
                <div className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Native Cosmos & Ethereum support</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <WalletAuthModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        onSuccess={handleWalletSuccess}
        title="Connect Your Wallet"
        subtitle="Choose your preferred wallet to access PersonaPass"
      />
    </div>
  )
}

export default SignInPage