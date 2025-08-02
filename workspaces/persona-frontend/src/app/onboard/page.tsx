'use client'

import dynamic from 'next/dynamic'

const WalletOnboarding = dynamic(() => import('@/components/wallet/WalletOnboarding'), {
  ssr: false,
  loading: () => (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading wallet onboarding...</p>
      </div>
    </div>
  )
})

export default function OnboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              PersonaPass
            </span>
          </h1>
          <p className="text-lg text-gray-600">
            Your Decentralized Identity on PersonaChain
          </p>
        </div>

        {/* Features Banner */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="text-2xl mb-2">🔐</div>
              <h3 className="font-semibold text-gray-900">Wallet-Only Auth</h3>
              <p className="text-sm text-gray-600">No phone or email required</p>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="text-2xl mb-2">⛓️</div>
              <h3 className="font-semibold text-gray-900">On-Chain Identity</h3>
              <p className="text-sm text-gray-600">Stored on PersonaChain</p>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="text-2xl mb-2">🛡️</div>
              <h3 className="font-semibold text-gray-900">Self-Sovereign</h3>
              <p className="text-sm text-gray-600">You control 100%</p>
            </div>
          </div>
        </div>

        {/* Main Onboarding Component */}
        <WalletOnboarding />

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">          
          <p>
            Powered by{' '}
            <span className="font-semibold text-blue-600">PersonaChain</span> •{' '}
            <span className="font-semibold text-purple-600">Web3 Identity</span> •{' '}
            <span className="font-semibold text-green-600">Zero-Knowledge Proofs</span>
          </p>
        </div>
      </div>
    </div>
  )
}