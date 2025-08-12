'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useWalletAuth } from '@/hooks/useWalletAuth'
import { personaChainService } from '@/lib/personachain-service'
import type { PersonaChainCredential } from '@/lib/personachain-service'
import { credentialManagementService } from '@/lib/credential-management-service'
import { personaIDToken } from '@/lib/personaid-token'
import PersonaIDTokenPurchase from '@/components/PersonaIDTokenPurchase'
import FlexibleTokenPurchase from '@/components/FlexibleTokenPurchase'
import KYCVerificationFlow from '@/components/KYCVerificationFlow'
import ZKProofModal from '@/components/ZKProofModal'
import VerifiableCredentialCard from '@/components/VerifiableCredentialCard'
import {
  Shield,
  User,
  Wallet,
  Plus,
  ExternalLink,
  Settings,
  LogOut,
  CheckCircle,
  AlertCircle,
  Clock,
  Zap,
  Award,
  Globe,
  Lock,
  TrendingUp,
  Eye,
  Copy,
  Loader2
} from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const { isAuthenticated, user, disconnect, isInitializing, signMessage } = useWalletAuth()
  const [credentials, setCredentials] = useState<PersonaChainCredential[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [networkStatus, setNetworkStatus] = useState<any>(null)
  const [selectedCredentialForProof, setSelectedCredentialForProof] = useState<PersonaChainCredential | null>(null)
  const [isProofModalOpen, setIsProofModalOpen] = useState(false)
  const [insights, setInsights] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'credentials' | 'identity' | 'purchase'>('overview')
  const [idBalance, setIDBalance] = useState<string>('0 ID')
  const [hasIdentity, setHasIdentity] = useState(false)
  const [showDIDCopy, setShowDIDCopy] = useState(false)

  useEffect(() => {
    if (isInitializing) return
    
    if (!isAuthenticated) {
      router.push('/auth')
      return
    }

    if (user?.address) {
      loadDashboardData()
    }
  }, [isAuthenticated, isInitializing, user?.address, router])

  const loadDashboardData = async () => {
    try {
      await Promise.all([
        loadCredentials(),
        loadInsights(), 
        loadIDBalance(),
        loadNetworkStatus()
      ])
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadCredentials = async () => {
    if (!user?.address) return
    
    try {
      console.log('🔍 Loading credentials from PersonaChain for', user.address)
      const fetchedCredentials = await personaChainService.getCredentials(user.address)
      console.log('✅ Loaded', fetchedCredentials.length, 'credentials from PersonaChain')
      setCredentials(fetchedCredentials)
      setHasIdentity(fetchedCredentials.length > 0)
    } catch (error) {
      console.error('❌ Failed to load credentials:', error)
    }
  }

  const loadInsights = async () => {
    if (!user?.address) return
    
    try {
      console.log('📊 Generating credential insights for', user.address)
      const credentialInsights = await credentialManagementService.generateInsights(user.address)
      console.log('✅ Generated insights:', credentialInsights)
      setInsights(credentialInsights)
    } catch (error) {
      console.error('❌ Failed to generate insights:', error)
    }
  }

  const loadIDBalance = async () => {
    if (!user?.address) return
    
    try {
      const balance = await personaIDToken.getBalance(user.address)
      console.log('💰 ID Token Balance:', balance)
      setIDBalance(`${balance} ID`)
    } catch (error) {
      console.error('❌ Failed to load ID balance:', error)
      setIDBalance('1 ID') // Fallback
    }
  }

  const loadNetworkStatus = async () => {
    try {
      console.log('📡 Checking PersonaChain network status')
      const status = await personaChainService.getNetworkStatus()
      console.log('📡 PersonaChain network status:', status)
      setNetworkStatus(status)
    } catch (error) {
      console.error('❌ Failed to load network status:', error)
    }
  }

  const handleCreateCredential = (credential: PersonaChainCredential) => {
    setCredentials(prev => [...prev, credential])
    loadInsights()
    loadIDBalance()
  }

  const handleGenerateProof = (credential: PersonaChainCredential) => {
    setSelectedCredentialForProof(credential)
    setIsProofModalOpen(true)
    
    if (user?.address) {
      credentialManagementService.trackCredentialEvent(
        user.address,
        credential.id,
        'shared',
        { sharedWith: 'ZK Proof Generation' }
      )
    }
  }

  const handleCloseProofModal = () => {
    setIsProofModalOpen(false)
    setSelectedCredentialForProof(null)
  }

  const handleSignOut = async () => {
    await disconnect()
    router.push('/')
  }

  const copyDID = async () => {
    if (user?.did) {
      await navigator.clipboard.writeText(user.did)
      setShowDIDCopy(true)
      setTimeout(() => setShowDIDCopy(false), 2000)
    }
  }

  const handleVerificationComplete = (verificationData: any) => {
    console.log('✅ Verification completed:', verificationData)
    loadCredentials()
    loadIDBalance()
  }

  const handleBasicIdentityFallback = async () => {
    try {
      console.log('💡 Didit verification failed, using basic identity verification...')
      console.log('🆔 Creating basic identity verification...')
      
      const response = await fetch('/api/kyc/create-basic-identity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_address: user?.address,
          email: user?.email || `${user?.address?.slice(0, 8)}@personapass.xyz`,
          verification_type: 'basic_wallet'
        })
      })
      
      const result = await response.json()
      console.log('📥 Basic identity response:', result)
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to store identity credential')
      }
      
      handleVerificationComplete(result)
    } catch (error: any) {
      console.error('❌ Basic identity creation failed:', error)
      throw error
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">Loading your identity dashboard...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  const userDID = user?.did || 'did:personapass:loading'
  const trustScore = insights?.trustScore || 0
  const verifiedCredentials = credentials.filter(c => c.status === 'active').length

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Modern Header */}
      <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            {/* Logo & Title */}
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">PersonaPass</h1>
                <p className="text-sm text-gray-400">Web3 Identity Dashboard</p>
              </div>
            </div>

            {/* User Info & Actions */}
            <div className="flex items-center space-x-6">
              {/* ID Balance */}
              <div className="bg-purple-600/20 border border-purple-500/30 rounded-lg px-4 py-2">
                <div className="flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-purple-400" />
                  <span className="text-purple-300 font-medium">{idBalance}</span>
                </div>
              </div>

              {/* DID Display */}
              <div className="hidden lg:flex items-center space-x-2 bg-gray-700/50 rounded-lg px-3 py-2">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-300 font-mono">
                  {userDID.length > 30 ? `${userDID.slice(0, 20)}...${userDID.slice(-8)}` : userDID}
                </span>
                <button
                  onClick={copyDID}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  {showDIDCopy ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setActiveTab('purchase')}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Buy Tokens</span>
                </button>
                
                <button
                  onClick={handleSignOut}
                  className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-700/50 transition-all duration-200"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-gray-800/30 border-b border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: TrendingUp },
              { id: 'identity', label: 'Identity Verification', icon: Shield },
              { id: 'credentials', label: 'My Credentials', icon: Award },
              { id: 'purchase', label: 'Buy ID Tokens', icon: Wallet }
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-400'
                      : 'border-transparent text-gray-400 hover:text-white hover:border-gray-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Trust Score</p>
                    <p className="text-3xl font-bold text-white">{trustScore}/100</p>
                  </div>
                  <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-green-400" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full transition-all duration-300" style={{ width: `${trustScore}%` }}></div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Verified Credentials</p>
                    <p className="text-3xl font-bold text-white">{verifiedCredentials}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <Award className="w-6 h-6 text-purple-400" />
                  </div>
                </div>
                <p className="text-gray-500 text-sm mt-2">Active credentials</p>
              </div>

              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">ID Token Balance</p>
                    <p className="text-3xl font-bold text-white">{idBalance.replace(' ID', '')}</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                    <Zap className="w-6 h-6 text-yellow-400" />
                  </div>
                </div>
                <p className="text-gray-500 text-sm mt-2">Available tokens</p>
              </div>

              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Network Status</p>
                    <p className="text-sm font-medium text-green-400">
                      {networkStatus?.online ? 'Online' : 'Offline'}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <Globe className="w-6 h-6 text-blue-400" />
                  </div>
                </div>
                {networkStatus?.blockHeight && (
                  <p className="text-gray-500 text-sm mt-2">Block: {networkStatus.blockHeight}</p>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab('identity')}
                  className="p-4 bg-gradient-to-r from-purple-600/20 to-indigo-600/20 border border-purple-500/30 rounded-lg hover:from-purple-600/30 hover:to-indigo-600/30 transition-all duration-200 text-left"
                >
                  <Shield className="w-8 h-8 text-purple-400 mb-2" />
                  <h4 className="font-medium text-white">Verify Identity</h4>
                  <p className="text-sm text-gray-400">Complete identity verification</p>
                </button>

                <button
                  onClick={() => router.push('/credentials')}
                  className="p-4 bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-lg hover:from-green-600/30 hover:to-emerald-600/30 transition-all duration-200 text-left"
                >
                  <Award className="w-8 h-8 text-green-400 mb-2" />
                  <h4 className="font-medium text-white">Universal Passport</h4>
                  <p className="text-sm text-gray-400">Manage your credentials</p>
                </button>

                <button
                  onClick={() => setActiveTab('purchase')}
                  className="p-4 bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border border-yellow-500/30 rounded-lg hover:from-yellow-600/30 hover:to-orange-600/30 transition-all duration-200 text-left"
                >
                  <Wallet className="w-8 h-8 text-yellow-400 mb-2" />
                  <h4 className="font-medium text-white">Buy ID Tokens</h4>
                  <p className="text-sm text-gray-400">Purchase additional tokens</p>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Identity Verification Tab */}
        {activeTab === 'identity' && (
          <div className="space-y-6">
            {/* Verification Status Overview */}
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-700/30 rounded-xl p-8 border border-gray-600/30">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Identity Verification</h2>
                    <p className="text-gray-300">Secure, privacy-preserving identity verification</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className={`w-3 h-3 rounded-full ${
                      hasIdentity ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'
                    }`}></span>
                    <span className="text-sm font-medium text-gray-300">
                      {hasIdentity ? 'Verified' : 'Pending Verification'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">Status updated live</p>
                </div>
              </div>
              
              {/* Benefits Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/20">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-green-400 font-medium text-sm">100% Free</span>
                  </div>
                  <p className="text-gray-300 text-sm">Unlimited identity verifications with zero cost</p>
                </div>
                
                <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-500/20">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <span className="text-purple-400 font-medium text-sm">Privacy-First</span>
                  </div>
                  <p className="text-gray-300 text-sm">Zero-knowledge proofs protect your sensitive data</p>
                </div>
                
                <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span className="text-blue-400 font-medium text-sm">100 ID Tokens</span>
                  </div>
                  <p className="text-gray-300 text-sm">Earn tokens immediately upon verification</p>
                </div>
              </div>
            </div>
            
            {/* Verification Flow */}
            <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700/50">
              <KYCVerificationFlow
                userAddress={user?.address || ''}
                userEmail={user?.email}
                onVerificationComplete={handleVerificationComplete}
                className="w-full"
              />
            </div>
          </div>
        )}

        {/* Credentials Tab */}
        {activeTab === 'credentials' && (
          <div className="space-y-6">
            {/* Header with Stats */}
            <div className="bg-gradient-to-r from-gray-800/50 to-gray-700/30 rounded-xl p-6 border border-gray-600/30">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">My Credentials</h2>
                  <p className="text-gray-300">Your verified digital identity portfolio</p>
                </div>
                <button
                  onClick={() => router.push('/credentials')}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 flex items-center space-x-2 shadow-lg"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Universal Passport</span>
                </button>
              </div>
              
              {/* Credential Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{verifiedCredentials}</div>
                  <div className="text-sm text-gray-400">Verified</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{credentials.length}</div>
                  <div className="text-sm text-gray-400">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">{trustScore}</div>
                  <div className="text-sm text-gray-400">Trust Score</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">✓</div>
                  <div className="text-sm text-gray-400">ZK Ready</div>
                </div>
              </div>
            </div>

            {credentials.length === 0 ? (
              <div className="bg-gradient-to-br from-gray-800/30 to-gray-700/20 rounded-2xl p-12 border border-gray-600/30 text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-600/20 to-indigo-600/20 rounded-2xl mx-auto mb-6 flex items-center justify-center">
                  <Award className="w-12 h-12 text-purple-400" />
                </div>
                <h3 className="text-2xl font-semibold text-white mb-3">Build Your Identity Portfolio</h3>
                <p className="text-gray-400 mb-8 max-w-md mx-auto">
                  Complete identity verification to start building your verifiable credential collection
                </p>
                <button
                  onClick={() => setActiveTab('identity')}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-4 rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 font-medium shadow-lg"
                >
                  Start Verification
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {credentials.map((credential) => (
                  <VerifiableCredentialCard
                    key={credential.id}
                    credential={credential}
                    onGenerateProof={() => handleGenerateProof(credential)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Purchase Tab */}
        {activeTab === 'purchase' && (
          <div className="space-y-6">
            {/* Purchase Header */}
            <div className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border border-yellow-500/20 rounded-xl p-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">Buy ID Tokens</h2>
                  <p className="text-gray-300">Power your Web3 identity with PersonaID tokens</p>
                </div>
              </div>
              
              <div className="bg-yellow-500/10 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span className="text-yellow-400 font-medium">Current Balance: {idBalance}</span>
                </div>
                <p className="text-gray-300 text-sm">Use tokens to generate zero-knowledge proofs and access Web3 services</p>
              </div>
            </div>
            
            {/* Purchase Component */}
            <div className="max-w-4xl mx-auto">
              <FlexibleTokenPurchase />
            </div>
          </div>
        )}
      </main>

      {/* ZK Proof Modal */}
      {isProofModalOpen && selectedCredentialForProof && (
        <ZKProofModal
          credential={selectedCredentialForProof}
          isOpen={isProofModalOpen}
          onClose={handleCloseProofModal}
        />
      )}
    </div>
  )
}