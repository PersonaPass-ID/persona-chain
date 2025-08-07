import React, { useState, useEffect } from 'react'
import { 
  Shield, CheckCircle, AlertCircle, User, Fingerprint, Key, ArrowRight, 
  Loader2, Award, UserCheck, Lock, Globe, Zap, Eye, EyeOff, 
  Bookmark, Star, Trophy, Clock, MapPin, CreditCard, Briefcase,
  ChevronRight, Plus, Settings, Download, Share2, Sparkles
} from 'lucide-react'
import ZKProofStudio from './ZKProofStudio'

interface Credential {
  id: string
  type: string
  status: 'verified' | 'pending' | 'expired'
  issuedAt: string
  expiresAt?: string
  proofCount: number
  lastUsed?: string
  zkEnabled: boolean
}

interface ZKProofRequest {
  credentialId: string
  proofType: string
  attributes: string[]
  constraints?: Record<string, any>
  purpose: string
}

interface UniversalPassportUIProps {
  isLoading: boolean
  did: string | null
  credentials: Credential[]
  onCreateDID: () => void
  onVerifyIdentity: () => void
  onGenerateProof: (credentialType: string) => void
}

const credentialTypes = [
  { 
    id: 'personhood', 
    name: 'Proof of Personhood', 
    icon: User, 
    color: 'from-blue-500 to-indigo-600',
    description: 'Anti-Sybil resistance across protocols',
    priority: 1
  },
  { 
    id: 'age', 
    name: 'Age Verification', 
    icon: Clock, 
    color: 'from-green-500 to-emerald-600',
    description: 'Prove age without revealing birthdate',
    priority: 2
  },
  { 
    id: 'jurisdiction', 
    name: 'Jurisdiction/Residency', 
    icon: MapPin, 
    color: 'from-purple-500 to-violet-600',
    description: 'Geographic eligibility for protocols',
    priority: 3
  },
  { 
    id: 'accredited', 
    name: 'Accredited Investor', 
    icon: CreditCard, 
    color: 'from-orange-500 to-red-600',
    description: 'Access to exclusive investment opportunities',
    priority: 4
  },
  { 
    id: 'aml', 
    name: 'AML Clearance', 
    icon: Shield, 
    color: 'from-teal-500 to-cyan-600',
    description: 'Clean transaction history verification',
    priority: 5
  },
  { 
    id: 'professional', 
    name: 'Professional Identity', 
    icon: Briefcase, 
    color: 'from-pink-500 to-rose-600',
    description: 'LinkedIn/career verification',
    priority: 6
  }
]

export default function UniversalPassportUI({
  isLoading,
  did,
  credentials,
  onCreateDID,
  onVerifyIdentity,
  onGenerateProof
}: UniversalPassportUIProps) {
  const [activeView, setActiveView] = useState<'passport' | 'credentials' | 'proofs'>('passport')
  const [selectedCredential, setSelectedCredential] = useState<string | null>(null)
  const [showPrivateInfo, setShowPrivateInfo] = useState(false)
  const [showZKStudio, setShowZKStudio] = useState(false)

  const verifiedCredentials = credentials.filter(c => c.status === 'verified')
  const trustScore = Math.min(100, verifiedCredentials.length * 16 + (did ? 20 : 0))
  const reputationLevel = trustScore >= 80 ? 'Diamond' : trustScore >= 60 ? 'Gold' : trustScore >= 40 ? 'Silver' : 'Bronze'

  const handleZKProofRequest = async (request: ZKProofRequest) => {
    try {
      // TODO: Implement actual ZK proof generation via API
      console.log('Generating ZK Proof:', request)
      
      // Simulate proof generation delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // For now, call the original handler with the credential type
      // In the future, this would call a proper ZK proof API
      const credential = credentials.find(c => c.id === request.credentialId)
      if (credential) {
        await onGenerateProof(credential.type)
      }
      
      // Show success message or download proof
      alert(`ZK Proof generated successfully!\n\nProof Type: ${request.proofType}\nPurpose: ${request.purpose}\n\nThis proof can now be used to verify your eligibility without revealing sensitive information.`)
      
    } catch (error) {
      console.error('ZK proof generation failed:', error)
      alert('Failed to generate ZK proof. Please try again.')
      throw error
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-gray-400">Initializing Universal Passport...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Bookmark Header */}
      <div className="bg-gradient-to-br from-purple-900/40 to-indigo-900/40 border border-purple-500/20 rounded-2xl p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple-500/10 to-transparent rounded-full -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-indigo-500/10 to-transparent rounded-full -ml-12 -mb-12" />
        
        <div className="flex items-start justify-between relative z-10">
          <div className="flex items-center space-x-6">
            <div className="relative">
              <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${
                reputationLevel === 'Diamond' ? 'from-cyan-400 to-blue-600' :
                reputationLevel === 'Gold' ? 'from-yellow-400 to-orange-600' :
                reputationLevel === 'Silver' ? 'from-gray-300 to-gray-600' :
                'from-amber-600 to-amber-800'
              } flex items-center justify-center shadow-xl`}>
                <Bookmark className="w-8 h-8 text-white" />
              </div>
              {did && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-gray-900">
                  <UserCheck className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
            
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-3xl font-bold text-white">Universal Passport</h1>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  reputationLevel === 'Diamond' ? 'bg-cyan-500/20 text-cyan-300' :
                  reputationLevel === 'Gold' ? 'bg-yellow-500/20 text-yellow-300' :
                  reputationLevel === 'Silver' ? 'bg-gray-500/20 text-gray-300' :
                  'bg-amber-500/20 text-amber-300'
                }`}>
                  {reputationLevel} Member
                </div>
              </div>
              <p className="text-gray-300 mb-4">Your self-sovereign Web3 identity</p>
              
              {did ? (
                <div className="bg-gray-900/50 rounded-lg p-3 max-w-md">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-400 text-sm">Decentralized ID</span>
                    <button 
                      onClick={() => setShowPrivateInfo(!showPrivateInfo)}
                      className="text-purple-400 hover:text-purple-300"
                    >
                      {showPrivateInfo ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <code className="text-purple-300 text-sm font-mono block truncate">
                    {showPrivateInfo ? did : did.substring(0, 20) + '...' + did.slice(-8)}
                  </code>
                </div>
              ) : (
                <button
                  onClick={onCreateDID}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 flex items-center space-x-2 font-medium"
                >
                  <Shield className="w-5 h-5" />
                  <span>Initialize Bookmark</span>
                </button>
              )}
            </div>
          </div>
          
          <div className="text-right">
            <div className="flex items-center space-x-2 mb-2">
              <Star className="w-5 h-5 text-yellow-400" />
              <span className="text-2xl font-bold text-white">{trustScore}</span>
              <span className="text-gray-400">/100</span>
            </div>
            <p className="text-gray-400 text-sm mb-4">Trust Score</p>
            
            <div className="flex items-center space-x-4 text-sm">
              <div className="text-center">
                <div className="text-xl font-bold text-green-400">{verifiedCredentials.length}</div>
                <div className="text-gray-400">Verified</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-blue-400">{credentials.reduce((sum, c) => sum + c.proofCount, 0)}</div>
                <div className="text-gray-400">Proofs Used</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-purple-400">{credentialTypes.length - verifiedCredentials.length}</div>
                <div className="text-gray-400">Available</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-800/50 p-1 rounded-xl">
        {[
          { id: 'passport', name: 'Passport Overview', icon: Bookmark },
          { id: 'credentials', name: 'Credentials Vault', icon: Lock },
          { id: 'proofs', name: 'ZK Proofs', icon: Zap }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id as any)}
            className={`flex-1 py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 font-medium ${
              activeView === tab.id
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            <tab.icon className="w-5 h-5" />
            <span>{tab.name}</span>
          </button>
        ))}
      </div>

      {/* Content based on active view */}
      {activeView === 'passport' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Available Credentials */}
          <div>
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center space-x-2">
              <Plus className="w-5 h-5 text-purple-400" />
              <span>Build Your Passport</span>
            </h3>
            
            <div className="space-y-4">
              {credentialTypes.map((credType) => {
                const existing = credentials.find(c => c.type === credType.id)
                const Icon = credType.icon
                
                return (
                  <div key={credType.id} className="bg-gray-800/50 rounded-xl p-5 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-200">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${credType.color} flex items-center justify-center`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-semibold text-white">{credType.name}</h4>
                            {existing?.status === 'verified' && (
                              <CheckCircle className="w-4 h-4 text-green-400" />
                            )}
                            {existing?.status === 'pending' && (
                              <Clock className="w-4 h-4 text-yellow-400" />
                            )}
                          </div>
                          <p className="text-gray-400 text-sm mb-3">{credType.description}</p>
                          
                          {existing?.status === 'verified' && (
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span>Issued: {new Date(existing.issuedAt).toLocaleDateString()}</span>
                              <span>Used: {existing.proofCount} times</span>
                              {existing.zkEnabled && (
                                <span className="text-purple-400 flex items-center space-x-1">
                                  <Zap className="w-3 h-3" />
                                  <span>ZK Ready</span>
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        {existing?.status === 'verified' ? (
                          <button
                            onClick={() => setShowZKStudio(true)}
                            className="px-4 py-2 bg-purple-600/20 text-purple-300 rounded-lg hover:bg-purple-600/30 transition-all duration-200 text-sm font-medium"
                          >
                            Generate Proof
                          </button>
                        ) : existing?.status === 'pending' ? (
                          <div className="px-4 py-2 bg-yellow-600/20 text-yellow-300 rounded-lg text-sm font-medium">
                            Verifying...
                          </div>
                        ) : (
                          <button
                            onClick={onVerifyIdentity}
                            disabled={!did}
                            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                          >
                            <span>Verify</span>
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Benefits & Usage */}
          <div>
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center space-x-2">
              <Globe className="w-5 h-5 text-green-400" />
              <span>Cross-Platform Benefits</span>
            </h3>
            
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 border border-green-500/20 rounded-xl p-6">
                <Award className="w-8 h-8 text-green-400 mb-3" />
                <h4 className="text-white font-semibold mb-2">DeFi Access</h4>
                <p className="text-gray-400 text-sm mb-4">Access undercollateralized loans, exclusive pools, and governance tokens</p>
                <div className="flex items-center space-x-2 text-green-400 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  <span>Works across all major DeFi protocols</span>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-blue-900/20 to-indigo-900/20 border border-blue-500/20 rounded-xl p-6">
                <Trophy className="w-8 h-8 text-blue-400 mb-3" />
                <h4 className="text-white font-semibold mb-2">Exclusive Opportunities</h4>
                <p className="text-gray-400 text-sm mb-4">Early access to token sales, airdrops, and exclusive events</p>
                <div className="flex items-center space-x-2 text-blue-400 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  <span>Sybil-resistant eligibility verification</span>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-900/20 to-violet-900/20 border border-purple-500/20 rounded-xl p-6">
                <Shield className="w-8 h-8 text-purple-400 mb-3" />
                <h4 className="text-white font-semibold mb-2">Privacy-First</h4>
                <p className="text-gray-400 text-sm mb-4">Zero-knowledge proofs protect your data while proving eligibility</p>
                <div className="flex items-center space-x-2 text-purple-400 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  <span>Selective disclosure with ZK proofs</span>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-orange-900/20 to-red-900/20 border border-orange-500/20 rounded-xl p-6">
                <Globe className="w-8 h-8 text-orange-400 mb-3" />
                <h4 className="text-white font-semibold mb-2">Multi-Chain</h4>
                <p className="text-gray-400 text-sm mb-4">Use your credentials on Ethereum, Cosmos, Solana, and more</p>
                <div className="flex items-center space-x-2 text-orange-400 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  <span>W3C standards ensure portability</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeView === 'credentials' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {credentials.map((credential) => {
            const credType = credentialTypes.find(ct => ct.type === credential.type)
            const Icon = credType?.icon || User
            
            return (
              <div key={credential.id} className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-200">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${credType?.color || 'from-gray-500 to-gray-600'} flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    credential.status === 'verified' ? 'bg-green-500/20 text-green-400' :
                    credential.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {credential.status}
                  </div>
                </div>
                
                <h4 className="font-semibold text-white mb-2">{credType?.name || credential.type}</h4>
                
                <div className="space-y-2 text-sm text-gray-400">
                  <div>Issued: {new Date(credential.issuedAt).toLocaleDateString()}</div>
                  {credential.expiresAt && (
                    <div>Expires: {new Date(credential.expiresAt).toLocaleDateString()}</div>
                  )}
                  <div>Proofs Generated: {credential.proofCount}</div>
                  {credential.lastUsed && (
                    <div>Last Used: {new Date(credential.lastUsed).toLocaleDateString()}</div>
                  )}
                </div>
                
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-700/50">
                  <div className="flex items-center space-x-1 text-xs text-purple-400">
                    <Zap className="w-3 h-3" />
                    <span>ZK Ready</span>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button className="p-1 text-gray-400 hover:text-white transition-colors">
                      <Download className="w-4 h-4" />
                    </button>
                    <button className="p-1 text-gray-400 hover:text-white transition-colors">
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button className="p-1 text-gray-400 hover:text-white transition-colors">
                      <Settings className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {activeView === 'proofs' && (
        <div className="text-center py-20">
          <Zap className="w-16 h-16 text-purple-400 mx-auto mb-4" />
          <h3 className="text-2xl font-semibold text-white mb-2">Zero-Knowledge Proof Generator</h3>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">
            Generate privacy-preserving proofs of your credentials without revealing sensitive information
          </p>
          <button 
            onClick={() => setShowZKStudio(true)}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-4 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 font-medium flex items-center space-x-3 mx-auto"
          >
            <Zap className="w-5 h-5" />
            <span>Open ZK Proof Studio</span>
          </button>
        </div>
      )}

      {/* ZK Proof Studio Modal */}
      {showZKStudio && (
        <ZKProofStudio
          credentials={verifiedCredentials}
          onGenerateProof={handleZKProofRequest}
          onClose={() => setShowZKStudio(false)}
        />
      )}
    </div>
  )
}