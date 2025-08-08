'use client'

import { useState } from 'react'
import WalletAuthModal from '@/components/WalletAuthModal'

const SignUpPage = () => {
  const [showWalletModal, setShowWalletModal] = useState(false)

  const handleWalletSuccess = (user: any) => {
    setShowWalletModal(false)
    // Redirect to onboarding for new users
    window.location.href = '/onboarding'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mb-6">
            <span className="text-white font-bold text-xl">P</span>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">
            Create Your PersonaPass
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Your decentralized identity starts here
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl rounded-2xl sm:px-10">
          <div className="space-y-6">
            <button
              onClick={() => setShowWalletModal(true)}
              className="w-full flex justify-center items-center py-4 px-6 border border-transparent rounded-xl shadow-sm text-base font-medium text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200"
            >
              <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create Account
            </button>

            <div className="text-center">
              <p className="text-xs text-gray-500">
                One wallet, infinite possibilities
              </p>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <div className="text-sm text-gray-600 space-y-3">
                <h4 className="font-medium text-gray-900">What you'll get:</h4>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-purple-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Self-sovereign DID identity</span>
                  </div>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-purple-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Verifiable credentials storage</span>
                  </div>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-purple-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Zero-knowledge proof generation</span>
                  </div>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-purple-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Full data ownership & control</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Already have an account?{' '}
                <a href="/auth/signin" className="text-purple-600 hover:text-purple-500 font-medium">
                  Sign in
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>

      <WalletAuthModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        onSuccess={handleWalletSuccess}
        title="Connect Your Wallet"
        subtitle="Choose your wallet to create your PersonaPass identity"
      />
    </div>
  )
}

export default SignUpPage