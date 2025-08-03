'use client'

import React, { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { WalletConnectService } from '@/lib/wallet-connect-service'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [walletInfo, setWalletInfo] = useState<any>(null)
  const [credentials, setCredentials] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/')
      return
    }

    loadWalletInfo()
    loadCredentials()
  }, [session, status, router])

  const loadWalletInfo = async () => {
    try {
      const walletService = new WalletConnectService()
      const wallet = await walletService.getConnectedWallet()
      setWalletInfo(wallet)
    } catch (error) {
      console.error('Failed to load wallet info:', error)
    }
  }

  const loadCredentials = async () => {
    try {
      // TODO: Load real credentials from PersonaChain
      // For now, simulate loading
      setIsLoading(false)
      setCredentials([])
    } catch (error) {
      console.error('Failed to load credentials:', error)
      setIsLoading(false)
    }
  }

  const createGitHubCredential = () => {
    router.push('/login')
  }

  const createLinkedInCredential = () => {
    // TODO: Implement LinkedIn credential creation
    alert('LinkedIn credential creation coming soon!')
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' })
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session) {
    return null // Redirecting
  }

  const userDID = walletInfo ? `did:personapass:${walletInfo.address.slice(-8)}` : 'Loading...'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">PersonaPass</h1>
              <span className="ml-2 text-sm text-gray-500">Dashboard</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                <span className="font-medium">DID:</span>
                <span className="ml-1 font-mono text-xs">{userDID}</span>
              </div>
              <button
                onClick={handleSignOut}
                className="text-gray-600 hover:text-gray-800 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {session.user?.name || 'User'}!
          </h2>
          <p className="text-gray-600">
            Manage your verifiable credentials and create new ones to showcase your professional achievements.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-2xl font-bold text-gray-900">{credentials.length}</h3>
                <p className="text-gray-600">Total Credentials</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-2xl font-bold text-gray-900">0</h3>
                <p className="text-gray-600">ZK Proofs Generated</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-2xl font-bold text-gray-900">0</h3>
                <p className="text-gray-600">Credentials Shared</p>
              </div>
            </div>
          </div>
        </div>

        {/* Create New Credential */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Create New Credential</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* GitHub Credential */}
            <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors cursor-pointer" onClick={createGitHubCredential}>
              <div className="flex items-center mb-3">
                <div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                  </svg>
                </div>
                <h4 className="ml-3 font-semibold text-gray-900">GitHub Developer</h4>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Verify your GitHub profile, repositories, and developer activity
              </p>
              <div className="text-xs text-blue-600 font-medium">
                Click to create →
              </div>
            </div>

            {/* LinkedIn Credential */}
            <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors cursor-pointer opacity-50" onClick={createLinkedInCredential}>
              <div className="flex items-center mb-3">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </div>
                <h4 className="ml-3 font-semibold text-gray-900">LinkedIn Professional</h4>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Verify your LinkedIn profile, connections, and professional experience
              </p>
              <div className="text-xs text-gray-400 font-medium">
                Coming soon
              </div>
            </div>

            {/* Certificate Credential */}
            <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors cursor-pointer opacity-50">
              <div className="flex items-center mb-3">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <h4 className="ml-3 font-semibold text-gray-900">Certificates</h4>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Upload and verify professional certificates and achievements
              </p>
              <div className="text-xs text-gray-400 font-medium">
                Coming soon
              </div>
            </div>
          </div>
        </div>

        {/* Existing Credentials */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Your Credentials</h3>
          
          {credentials.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              <h4 className="text-lg font-medium text-gray-900 mb-2">No credentials yet</h4>
              <p className="text-gray-600 mb-4">
                Create your first verifiable credential to get started with PersonaPass
              </p>
              <button
                onClick={createGitHubCredential}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Create GitHub Credential
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {credentials.map((credential, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  {/* Credential card content will go here */}
                  <p>Credential {index + 1}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}