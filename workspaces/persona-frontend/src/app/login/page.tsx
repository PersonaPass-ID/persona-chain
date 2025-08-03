'use client'

import React, { useState, useEffect } from 'react'
import { useSession, signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { WalletConnectService } from '@/lib/wallet-connect-service'

const LoginPage = () => {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [walletConnected, setWalletConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (session) {
      router.push('/github-verification')
    }
  }, [session, router])

  useEffect(() => {
    checkWalletConnection()
  }, [])

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
      setError('Failed to connect wallet. Please install Keplr or Cosmostation.')
      console.error('Wallet connection error:', err)
    } finally {
      setIsConnecting(false)
    }
  }

  const handleGitHubSignIn = async () => {
    if (!walletConnected) {
      setError('Please connect your wallet first')
      return
    }

    setError(null)
    try {
      // Use standard OAuth flow with redirect
      await signIn('github', {
        callbackUrl: '/github-verification'
      })
    } catch (err) {
      setError('Failed to sign in with GitHub')
      console.error('GitHub sign-in error:', err)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const walletStepClass = walletConnected 
    ? 'border rounded-lg p-4 border-green-200 bg-green-50' 
    : 'border rounded-lg p-4 border-gray-200'

  const githubStepClass = !walletConnected 
    ? 'border rounded-lg p-4 border-gray-200 opacity-50' 
    : 'border rounded-lg p-4 border-gray-200'

  const connectButtonClass = isConnecting
    ? 'w-full py-2 px-4 rounded-md font-medium transition-colors bg-gray-400 text-gray-700 cursor-not-allowed'
    : 'w-full py-2 px-4 rounded-md font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700'

  const githubButtonClass = !walletConnected
    ? 'w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-colors bg-gray-400 cursor-not-allowed'
    : 'w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-colors bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500'

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">PersonaPass</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            Verifiable Developer Identity
          </h2>
          <p className="text-lg text-gray-600">
            Create secure, verifiable developer credentials using zero-knowledge proofs
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            
          <div className={walletStepClass}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium text-gray-900">
                1. Connect Wallet
              </h3>
              {walletConnected && (
                <span className="text-green-600 text-sm font-medium">✓ Connected</span>
              )}
            </div>
            
            {walletConnected ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Wallet connected successfully
                </p>
                <p className="text-xs font-mono bg-gray-100 p-2 rounded break-all">
                  {walletAddress}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Connect your Cosmos wallet to create your DID
                </p>
                <button
                  onClick={connectWallet}
                  disabled={isConnecting}
                  className={connectButtonClass}
                >
                  {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                </button>
              </div>
            )}
          </div>

          <div className="mt-4">
            <div className={githubStepClass}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-medium text-gray-900">
                  2. Verify GitHub
                </h3>
              </div>
              
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Connect your GitHub account to create verifiable developer credentials
                </p>
                <button
                  onClick={handleGitHubSignIn}
                  disabled={!walletConnected}
                  className={githubButtonClass}
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                  </svg>
                  Continue with GitHub
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Create verifiable credentials that prove your developer experience
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage