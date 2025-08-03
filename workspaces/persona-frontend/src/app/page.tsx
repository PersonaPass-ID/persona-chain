'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { WalletConnectService } from '@/lib/wallet-connect-service'

export default function HomePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [walletConnected, setWalletConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkWalletConnection()
  }, [])

  useEffect(() => {
    // If user has both wallet and is authenticated, go to dashboard
    if (walletConnected && session) {
      router.push('/dashboard')
    }
  }, [walletConnected, session, router])

  const checkWalletConnection = async () => {
    try {
      const walletService = new WalletConnectService()
      const wallet = await walletService.getConnectedWallet()
      if (wallet) {
        setWalletConnected(true)
        setWalletAddress(wallet.address)
      }
    } catch (error) {
      console.log('No wallet connected')
    }
  }

  const connectWallet = async () => {
    setIsConnecting(true)
    setError(null)
    
    try {
      const walletService = new WalletConnectService()
      const wallet = await walletService.connectWallet()
      
      if (wallet) {
        setWalletConnected(true)
        setWalletAddress(wallet.address)
      }
    } catch (err) {
      setError('Failed to connect wallet. Please install Keplr, Cosmostation, or Leap.')
      console.error('Wallet connection error:', err)
    } finally {
      setIsConnecting(false)
    }
  }

  const goToDashboard = () => {
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">PersonaPass</h1>
              <span className="ml-2 text-sm text-gray-500">Beta</span>
            </div>
            <div className="flex items-center space-x-4">
              {walletConnected && walletAddress && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Connected:</span>
                  <span className="ml-1 font-mono text-xs">{walletAddress.slice(0, 8)}...{walletAddress.slice(-6)}</span>
                </div>
              )}
              {walletConnected && session && (
                <button
                  onClick={goToDashboard}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Dashboard
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Universal Digital Identity Platform
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Create verifiable credentials for your GitHub, LinkedIn, and professional achievements. 
            Store them securely on PersonaChain and generate zero-knowledge proofs for privacy-preserving verification.
          </p>
          
          {!walletConnected ? (
            <div className="max-w-md mx-auto">
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                className={isConnecting 
                  ? "w-full py-4 px-8 rounded-lg font-semibold text-gray-700 bg-gray-400 cursor-not-allowed"
                  : "w-full py-4 px-8 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-lg"
                }
              >
                {isConnecting ? 'Connecting...' : 'Connect Wallet & Get Started'}
              </button>
              <p className="text-sm text-gray-500 mt-2">
                Supports Keplr, Cosmostation, and Leap wallets
              </p>
            </div>
          ) : !session ? (
            <div className="max-w-md mx-auto">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-green-800 font-medium">Wallet Connected!</span>
                </div>
                <p className="text-green-700 text-sm mt-1">DID created: did:personapass:{walletAddress?.slice(-8)}</p>
              </div>
              <button
                onClick={goToDashboard}
                className="w-full py-4 px-8 rounded-lg font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors shadow-lg"
              >
                Continue to Dashboard
              </button>
            </div>
          ) : (
            <div className="max-w-md mx-auto">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-center">
                  <svg className="h-5 w-5 text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-blue-800 font-medium">Ready to create credentials!</span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="max-w-md mx-auto mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Verifiable Credentials</h3>
            <p className="text-gray-600">Create tamper-proof credentials for GitHub, LinkedIn, and professional achievements using blockchain technology.</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Zero-Knowledge Proofs</h3>
            <p className="text-gray-600">Share proof of your credentials without revealing private information. Verify without compromising privacy.</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">PersonaChain Storage</h3>
            <p className="text-gray-600">Store credentials securely on PersonaChain blockchain with automatic renewals and complete ownership control.</p>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-2xl p-8 shadow-sm">
          <h3 className="text-2xl font-bold text-center text-gray-900 mb-8">How PersonaPass Works</h3>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-blue-600">1</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Connect Wallet</h4>
              <p className="text-sm text-gray-600">Connect your Cosmos wallet to create your PersonaPass DID</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-green-600">2</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Choose Credentials</h4>
              <p className="text-sm text-gray-600">Select platforms to verify: GitHub, LinkedIn, certificates</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-purple-600">3</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Verify & Store</h4>
              <p className="text-sm text-gray-600">Authenticate and store verifiable credentials on blockchain</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-orange-600">4</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Share Proofs</h4>
              <p className="text-sm text-gray-600">Generate ZK proofs and share with employers or clients</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}