'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import UniversalPassportUI from '@/components/credentials/UniversalPassportUI'
import { Loader2, AlertCircle, Shield } from 'lucide-react'

interface CredentialRecord {
  id: string
  credential_id: string
  did: string
  encrypted_credential: string
  credential_type: string
  status: 'active' | 'pending' | 'expired'
  created_at: string
  updated_at: string
  expiration_date?: string
}

export default function CredentialsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [credentials, setCredentials] = useState<CredentialRecord[]>([])
  const [did, setDid] = useState<string | null>(null)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/login')
      return
    }

    loadUserData()
  }, [session, status, router])

  const loadUserData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Try to get wallet address from session or localStorage
      const savedWalletAddress = localStorage.getItem('walletAddress')
      if (!savedWalletAddress) {
        setError('Please connect your wallet first')
        setIsLoading(false)
        return
      }

      setWalletAddress(savedWalletAddress)

      // Load existing DID
      await loadDID(savedWalletAddress)
      
      // Load credentials
      await loadCredentials(savedWalletAddress)
      
    } catch (error) {
      console.error('Failed to load user data:', error)
      setError('Failed to load your credentials. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const loadDID = async (address: string) => {
    try {
      const response = await fetch(`/api/did/get?address=${encodeURIComponent(address)}`)
      if (response.ok) {
        const data = await response.json()
        setDid(data.did)
      }
    } catch (error) {
      console.error('Failed to load DID:', error)
    }
  }

  const loadCredentials = async (address: string) => {
    try {
      const response = await fetch(`/api/credentials/${encodeURIComponent(address)}`)
      if (response.ok) {
        const data = await response.json()
        setCredentials(data.credentials || [])
      }
    } catch (error) {
      console.error('Failed to load credentials:', error)
    }
  }

  const handleCreateDID = async () => {
    if (!walletAddress) {
      setError('Wallet address not found')
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/did/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress,
          walletType: 'keplr',
          firstName: 'Web3',
          lastName: 'User'
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setDid(data.did)
        
        // Create basic identity credential after DID creation
        await handleCreateBasicIdentity()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to create DID')
      }
    } catch (error: any) {
      console.error('Failed to create DID:', error)
      setError(error.message || 'Failed to create DID')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateBasicIdentity = async () => {
    if (!walletAddress || !did) {
      return
    }

    try {
      const response = await fetch('/api/kyc/create-basic-identity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress,
          did,
          firstName: 'Web3',
          lastName: 'User',
          email: 'user@personapass.xyz'
        }),
      })

      if (response.ok) {
        // Reload credentials to show the new basic identity
        await loadCredentials(walletAddress)
      }
    } catch (error) {
      console.error('Failed to create basic identity:', error)
    }
  }

  const handleVerifyIdentity = async () => {
    if (!walletAddress) {
      setError('Wallet address not found')
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Start Didit KYC session
      const response = await fetch('/api/kyc/didit/create-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_address: walletAddress,
          email: 'user@personapass.xyz',
          metadata: {
            first_name: 'Web3',
            last_name: 'User',
            platform: 'PersonaPass'
          }
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.session_data?.url) {
          // Redirect to Didit verification
          window.open(data.session_data.url, '_blank')
        } else {
          throw new Error('No verification URL received')
        }
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to start verification')
      }
    } catch (error: any) {
      console.error('Failed to start verification:', error)
      setError(error.message || 'Failed to start verification')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateProof = async (credentialType: string) => {
    if (!walletAddress) {
      setError('Wallet address not found')
      return
    }

    try {
      setError(null)
      console.log('Generating ZK proof for:', credentialType)
      
      // Find the credential of the requested type
      const credential = credentials.find(c => c.credential_type === credentialType && c.status === 'active')
      if (!credential) {
        setError('No verified credential found for this proof type')
        return
      }

      // Generate ZK proof via API
      const response = await fetch('/api/zk-proofs/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          credentialId: credential.id,
          proofType: credentialType,
          attributes: [], // Will be configured in ZK Studio
          purpose: `${credentialType} verification`,
          walletAddress
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          // Show success message with proof details
          alert(`🎉 ZK Proof Generated Successfully!

Proof ID: ${data.proofId}
Type: ${data.proof.metadata.proofType}
Purpose: ${data.proof.metadata.purpose}

This proof can now be used to verify your eligibility without revealing sensitive information.

Download URL: ${data.downloadUrl}
Verification URL: ${data.verificationUrl}`)
        } else {
          throw new Error(data.error || 'Failed to generate proof')
        }
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate proof')
      }

    } catch (error: any) {
      console.error('Failed to generate ZK proof:', error)
      setError(error.message || 'Failed to generate ZK proof')
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">Loading Universal Passport...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Universal Passport</h1>
            <p className="text-gray-400">Your Web3-native identity and credential vault</p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-purple-400 hover:text-purple-300 transition-colors flex items-center space-x-2"
          >
            <span>← Back to Dashboard</span>
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-900/20 border border-red-500/20 rounded-xl p-4 mb-8 flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-red-400 font-medium mb-1">Error</h3>
              <p className="text-red-300 text-sm">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-300 text-sm underline mt-2"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Wallet Connection Check */}
        {!walletAddress && (
          <div className="bg-yellow-900/20 border border-yellow-500/20 rounded-xl p-6 mb-8 text-center">
            <Shield className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-yellow-400 mb-2">Wallet Connection Required</h3>
            <p className="text-gray-300 mb-4">
              Connect your Keplr wallet to access your Universal Passport
            </p>
            <button
              onClick={() => router.push('/login')}
              className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white px-6 py-3 rounded-lg hover:from-yellow-700 hover:to-orange-700 transition-all duration-200 font-medium"
            >
              Connect Wallet
            </button>
          </div>
        )}

        {/* Main Universal Passport UI */}
        {walletAddress && (
          <UniversalPassportUI
            isLoading={isLoading}
            did={did}
            credentials={credentials.map(c => ({
              id: c.id,
              type: c.credential_type || 'personhood',
              status: c.status === 'active' ? 'verified' : c.status === 'pending' ? 'pending' : 'expired',
              issuedAt: c.created_at,
              expiresAt: c.expiration_date,
              proofCount: Math.floor(Math.random() * 10), // TODO: Track actual proof usage
              lastUsed: c.updated_at,
              zkEnabled: true
            }))}
            onCreateDID={handleCreateDID}
            onVerifyIdentity={handleVerifyIdentity}
            onGenerateProof={handleGenerateProof}
          />
        )}

        {/* Future Enhancements Preview */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
            <h3 className="text-lg font-semibold text-white mb-3">🔮 Coming Soon</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>• ZK Proof Studio</li>
              <li>• Cross-chain credentials</li>
              <li>• Reputation system</li>
              <li>• API for 3rd parties</li>
            </ul>
          </div>
          
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
            <h3 className="text-lg font-semibold text-white mb-3">🌐 Multi-Chain</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>• Ethereum compatibility</li>
              <li>• Solana integration</li>
              <li>• Cosmos IBC support</li>
              <li>• Bitcoin L2 proofs</li>
            </ul>
          </div>
          
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
            <h3 className="text-lg font-semibold text-white mb-3">🔐 Privacy Features</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>• Selective disclosure</li>
              <li>• Anonymous sets</li>
              <li>• BBS+ signatures</li>
              <li>• Zero-knowledge proofs</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}