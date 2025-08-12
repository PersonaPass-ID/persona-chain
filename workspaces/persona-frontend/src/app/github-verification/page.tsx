// Production GitHub Verification Page - Create VC from OAuth session
// Handles GitHub credential creation after OAuth authentication

'use client'

import React, { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { githubOAuthService } from '@/lib/github-oauth-service'
import type { GitHubOAuthResult } from '@/lib/github-oauth-service'
import { WalletConnectService } from '@/lib/wallet-connect-service'

const GitHubVerificationPage = () => {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(false)
  const [verificationResult, setVerificationResult] = useState<GitHubOAuthResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [walletInfo, setWalletInfo] = useState<any>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    // Load wallet info when component mounts
    loadWalletInfo()
  }, [])

  useEffect(() => {
    if (session?.user?.githubUsername && !verificationResult && !isCreating && walletInfo) {
      handleCreateCredential()
    }
  }, [session, verificationResult, isCreating, walletInfo])

  const loadWalletInfo = async () => {
    try {
      const walletService = new WalletConnectService()
      const wallet = await walletService.getConnectedWallet()
      if (wallet) {
        setWalletInfo(wallet)
      } else {
        setError('No wallet connected. Please connect your wallet first.')
      }
    } catch (error) {
      console.error('Failed to load wallet info:', error)
      setError('Failed to connect to wallet. Please ensure your wallet is connected.')
    }
  }

  const handleCreateCredential = async () => {
    if (!session?.user?.githubUsername) {
      setError('No GitHub session found')
      return
    }

    if (!walletInfo?.address) {
      setError('No wallet connected. Please connect your wallet first.')
      return
    }

    setIsCreating(true)
    setError(null)

    try {
      const userId = `github_${session.user.githubId || Date.now()}`
      const walletAddress = walletInfo.address

      console.log(`🔗 Creating credential for wallet: ${walletAddress}`)

      const result = await githubOAuthService.createCredentialFromSession(
        userId,
        walletAddress,
        session
      )

      setVerificationResult(result)

      if (!result.success) {
        setError(result.error || 'Failed to create credential')
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Credential creation error:', err)
    } finally {
      setIsCreating(false)
    }
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  const handleCreateAnother = () => {
    setVerificationResult(null)
    setError(null)
    handleCreateCredential()
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'expert': return 'text-purple-700 bg-purple-100'
      case 'experienced': return 'text-blue-700 bg-blue-100'
      case 'basic': return 'text-green-700 bg-green-100'
      default: return 'text-gray-700 bg-gray-100'
    }
  }

  const getLevelDescription = (level: string) => {
    switch (level) {
      case 'expert': return '20+ repos, 10+ followers, 2+ years experience'
      case 'experienced': return '10+ repos, 1+ years experience'
      case 'basic': return '6+ months GitHub experience'
      default: return 'GitHub account verification'
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            GitHub Developer Verification
          </h1>
          <p className="text-lg text-gray-600">
            Creating your verifiable developer credential
          </p>
        </div>

        {/* GitHub Session Info */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">GitHub Account</h2>
            <button
              onClick={handleSignOut}
              className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Sign Out
            </button>
          </div>
          
          <div className="flex items-center space-x-4">
            {session.user.image && (
              <img
                src={session.user.image}
                alt="GitHub Avatar"
                className="w-16 h-16 rounded-full"
              />
            )}
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                @{session.user.githubUsername}
              </h3>
              <p className="text-sm text-gray-600">
                {session.user.name || 'GitHub Developer'}
              </p>
              {session.user.email && (
                <p className="text-sm text-gray-500">
                  {session.user.email}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Wallet Info */}
        {walletInfo && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-blue-900 mb-4">Connected Wallet</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700">
                  <span className="font-medium">Provider:</span> {walletInfo.provider.toUpperCase()}
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  <span className="font-medium">Address:</span>
                  <span className="ml-2 font-mono text-xs">{walletInfo.address}</span>
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  <span className="font-medium">DID:</span>
                  <span className="ml-2 font-mono text-xs">did:personapass:{walletInfo.address.slice(-8)}</span>
                </p>
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="ml-2 text-sm font-medium text-green-700">Connected</span>
              </div>
            </div>
          </div>
        )}

        {/* Verification Status */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Verification Status</h2>
          
          {isCreating && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Creating your verifiable credential...</p>
              <p className="text-sm text-gray-500 mt-2">
                Analyzing your GitHub profile and generating proof
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Verification Failed</h3>
                  <p className="mt-1 text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {verificationResult && verificationResult.success && (
            <div className="space-y-6">
              {/* Success Message */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">Verification Successful!</h3>
                    <p className="mt-1 text-sm text-green-700">
                      Your GitHub developer credential has been created and stored securely.
                    </p>
                  </div>
                </div>
              </div>

              {/* Developer Level */}
              {verificationResult.verificationLevel && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Developer Level</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getLevelColor(verificationResult.verificationLevel)}`}>
                        {verificationResult.verificationLevel.toUpperCase()}
                      </span>
                      <p className="text-sm text-gray-600 mt-2">
                        {getLevelDescription(verificationResult.verificationLevel)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Profile Summary */}
              {verificationResult.profile && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Summary</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Public Repositories:</span>
                      <span className="ml-2 font-medium">{verificationResult.profile.publicRepos}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Followers:</span>
                      <span className="ml-2 font-medium">{verificationResult.profile.followers}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Account Created:</span>
                      <span className="ml-2 font-medium">
                        {new Date(verificationResult.profile.accountCreated).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Following:</span>
                      <span className="ml-2 font-medium">{verificationResult.profile.following}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Credential Details */}
              {verificationResult.credential && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Credential Details</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Credential Type:</span>
                      <span className="font-medium">GitHub Developer Credential</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Issued:</span>
                      <span className="font-medium">
                        {new Date(verificationResult.credential.issuanceDate).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subject ID:</span>
                      <span className="font-mono text-xs break-all">
                        {verificationResult.credential.credentialSubject.id}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Blockchain Storage Info */}
              {verificationResult.blockchainResult && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-green-900 mb-4">⛓️ PersonaChain Storage</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-green-700">Storage Status:</span>
                      <div className="flex items-center">
                        <svg className="w-4 h-4 text-green-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="font-medium text-green-800">Stored on Blockchain</span>
                      </div>
                    </div>
                    {verificationResult.txHash && (
                      <div className="flex justify-between">
                        <span className="text-green-700">Transaction Hash:</span>
                        <span className="font-mono text-xs text-green-800 break-all">
                          {verificationResult.txHash}
                        </span>
                      </div>
                    )}
                    {verificationResult.blockHeight && (
                      <div className="flex justify-between">
                        <span className="text-green-700">Block Height:</span>
                        <span className="font-medium text-green-800">
                          #{verificationResult.blockHeight.toLocaleString()}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-green-700">Network:</span>
                      <span className="font-medium text-green-800">PersonaChain Testnet</span>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-green-100 rounded-md">
                    <p className="text-xs text-green-800">
                      🔒 Your credential is now immutably stored on PersonaChain blockchain and can be verified by anyone using the transaction hash above.
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-4">
                <button
                  onClick={handleCreateAnother}
                  disabled={isCreating}
                  className="flex-1 py-3 px-4 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 font-medium transition-colors"
                >
                  Create New Credential
                </button>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium transition-colors"
                >
                  View Dashboard
                </button>
              </div>
            </div>
          )}
        </div>

        {/* How It Works */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-3">🔐 How It Works</h3>
          <div className="space-y-2 text-sm text-blue-800">
            <p><strong>1. GitHub OAuth:</strong> Secure authentication with your GitHub account</p>
            <p><strong>2. Profile Analysis:</strong> Analyze your repositories, followers, and activity</p>
            <p><strong>3. Credential Creation:</strong> Generate verifiable credential with your developer level</p>
            <p><strong>4. Zero-Knowledge Proofs:</strong> Create shareable proofs without revealing private data</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GitHubVerificationPage