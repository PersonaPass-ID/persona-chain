import React, { useState, useEffect } from 'react'
import { 
  Zap, Shield, Eye, EyeOff, CheckCircle, AlertCircle, Clock, 
  User, MapPin, CreditCard, Award, Lock, Unlock, Download,
  ArrowRight, Settings, Info, Sparkles
} from 'lucide-react'

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

interface ZKProofStudioProps {
  credentials: Credential[]
  onGenerateProof: (request: ZKProofRequest) => Promise<void>
  onClose: () => void
}

const proofTemplates = [
  {
    id: 'age-verification',
    name: 'Age Verification',
    icon: Clock,
    description: 'Prove you meet minimum age requirements without revealing your exact age',
    color: 'from-green-500 to-emerald-600',
    requiresCredential: 'personhood',
    constraints: {
      minAge: { type: 'number', label: 'Minimum Age', default: 18, min: 13, max: 65 }
    },
    useCases: [
      'Access age-restricted DeFi protocols',
      'Join adult-only DAOs and communities', 
      'Purchase age-restricted NFTs and tokens',
      'Participate in regulated financial products'
    ]
  },
  {
    id: 'jurisdiction-proof',
    name: 'Jurisdiction Proof',
    icon: MapPin,
    description: 'Prove geographic eligibility without revealing exact location',
    color: 'from-purple-500 to-violet-600',
    requiresCredential: 'jurisdiction',
    constraints: {
      allowedRegions: { 
        type: 'multiselect', 
        label: 'Allowed Regions', 
        options: ['US', 'EU', 'UK', 'Canada', 'Australia', 'Japan', 'Singapore'],
        default: ['US', 'EU']
      }
    },
    useCases: [
      'Access geo-restricted DeFi protocols',
      'Comply with regional regulations',
      'Participate in jurisdiction-specific offerings',
      'Verify eligibility for government programs'
    ]
  },
  {
    id: 'accredited-investor',
    name: 'Accredited Investor Status',
    icon: CreditCard,
    description: 'Prove investment eligibility without revealing financial details',
    color: 'from-orange-500 to-red-600',
    requiresCredential: 'accredited',
    constraints: {
      minNetWorth: { 
        type: 'select', 
        label: 'Minimum Net Worth Threshold',
        options: ['$1M', '$5M', '$10M', '$25M'],
        default: '$1M'
      }
    },
    useCases: [
      'Access private investment opportunities',
      'Join exclusive investment DAOs',
      'Participate in high-value token sales',
      'Qualify for sophisticated financial products'
    ]
  },
  {
    id: 'anti-sybil',
    name: 'Anti-Sybil Proof',
    icon: Shield,
    description: 'Prove unique human identity without revealing personal information',
    color: 'from-blue-500 to-indigo-600',
    requiresCredential: 'personhood',
    constraints: {
      uniquenessSet: {
        type: 'text',
        label: 'Uniqueness Context',
        placeholder: 'e.g., "gitcoin-round-19"',
        default: ''
      }
    },
    useCases: [
      'Prevent multi-account abuse in airdrops',
      'Ensure fair governance participation',
      'Enable one-person-one-vote systems',
      'Qualify for Sybil-resistant rewards'
    ]
  },
  {
    id: 'selective-disclosure',
    name: 'Selective Disclosure',
    icon: Eye,
    description: 'Reveal only specific attributes while keeping others private',
    color: 'from-teal-500 to-cyan-600',
    requiresCredential: 'any',
    constraints: {
      attributes: {
        type: 'multiselect',
        label: 'Attributes to Reveal',
        options: ['age_over_18', 'country_tier', 'verification_level', 'risk_score'],
        default: ['age_over_18']
      }
    },
    useCases: [
      'Custom compliance requirements',
      'Granular privacy controls',
      'Multi-attribute verification',
      'Flexible protocol integration'
    ]
  },
  {
    id: 'professional-identity',
    name: 'Professional Credentials',
    icon: Award,
    description: 'Prove professional qualifications without revealing employer details',
    color: 'from-pink-500 to-rose-600',
    requiresCredential: 'professional',
    constraints: {
      skillLevel: {
        type: 'select',
        label: 'Minimum Skill Level',
        options: ['Entry', 'Mid', 'Senior', 'Expert'],
        default: 'Mid'
      }
    },
    useCases: [
      'Access professional networking DAOs',
      'Qualify for skilled worker programs',
      'Join industry-specific protocols',
      'Participate in expert governance roles'
    ]
  }
]

export default function ZKProofStudio({ credentials, onGenerateProof, onClose }: ZKProofStudioProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [proofRequest, setProofRequest] = useState<Partial<ZKProofRequest>>({})
  const [isGenerating, setIsGenerating] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const template = selectedTemplate ? proofTemplates.find(t => t.id === selectedTemplate) : null
  const availableCredentials = credentials.filter(c => 
    c.status === 'verified' && 
    (template?.requiresCredential === 'any' || c.type === template?.requiresCredential)
  )

  const handleGenerateProof = async () => {
    if (!template || !proofRequest.credentialId) return

    try {
      setIsGenerating(true)
      
      const fullRequest: ZKProofRequest = {
        credentialId: proofRequest.credentialId!,
        proofType: template.id,
        attributes: proofRequest.attributes || [],
        constraints: proofRequest.constraints || {},
        purpose: proofRequest.purpose || `${template.name} verification`
      }

      await onGenerateProof(fullRequest)
      
      // Success - could show success state here
      setSelectedTemplate(null)
      setProofRequest({})
    } catch (error) {
      console.error('Proof generation failed:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl border border-gray-700 max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900/40 to-indigo-900/40 border-b border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Sparkles className="w-8 h-8 text-purple-400" />
              <div>
                <h2 className="text-2xl font-bold text-white">ZK Proof Studio</h2>
                <p className="text-gray-400">Generate privacy-preserving proofs of your credentials</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Template Selection */}
          <div className="w-1/3 border-r border-gray-700 p-6 overflow-y-auto">
            <h3 className="text-lg font-semibold text-white mb-4">Proof Templates</h3>
            <div className="space-y-3">
              {proofTemplates.map((template) => {
                const Icon = template.icon
                const hasRequiredCredential = template.requiresCredential === 'any' || 
                  credentials.some(c => c.type === template.requiresCredential && c.status === 'verified')
                
                return (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template.id)}
                    disabled={!hasRequiredCredential}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                      selectedTemplate === template.id
                        ? 'bg-gradient-to-r from-purple-600/20 to-indigo-600/20 border-purple-500/50'
                        : hasRequiredCredential
                        ? 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
                        : 'bg-gray-800/20 border-gray-800 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${template.color} flex items-center justify-center flex-shrink-0`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-white text-sm mb-1">{template.name}</h4>
                        <p className="text-gray-400 text-xs leading-relaxed">{template.description}</p>
                        {!hasRequiredCredential && (
                          <p className="text-red-400 text-xs mt-2">
                            Requires {template.requiresCredential} credential
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Configuration Panel */}
          <div className="flex-1 p-6 overflow-y-auto">
            {!selectedTemplate ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Zap className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Select a Proof Template</h3>
                  <p className="text-gray-400">Choose from the available templates to generate your ZK proof</p>
                </div>
              </div>
            ) : template ? (
              <div className="space-y-6">
                {/* Template Details */}
                <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                  <div className="flex items-start space-x-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${template.color} flex items-center justify-center`}>
                      <template.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-2">{template.name}</h3>
                      <p className="text-gray-400 mb-4">{template.description}</p>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold text-white mb-2 text-sm">Use Cases</h4>
                          <ul className="space-y-1">
                            {template.useCases.map((useCase, idx) => (
                              <li key={idx} className="text-gray-300 text-sm flex items-start space-x-2">
                                <CheckCircle className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                                <span>{useCase}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Credential Selection */}
                <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                  <h4 className="font-semibold text-white mb-4">Select Credential</h4>
                  <div className="space-y-2">
                    {availableCredentials.map((credential) => (
                      <button
                        key={credential.id}
                        onClick={() => setProofRequest({...proofRequest, credentialId: credential.id})}
                        className={`w-full text-left p-3 rounded-lg border transition-all duration-200 ${
                          proofRequest.credentialId === credential.id
                            ? 'bg-purple-600/20 border-purple-500'
                            : 'bg-gray-900/50 border-gray-700 hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium text-white capitalize">
                              {credential.type.replace('_', ' ')} Credential
                            </span>
                            <p className="text-gray-400 text-sm">
                              Issued: {new Date(credential.issuedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Constraint Configuration */}
                {template.constraints && Object.keys(template.constraints).length > 0 && (
                  <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                    <h4 className="font-semibold text-white mb-4">Proof Parameters</h4>
                    <div className="space-y-4">
                      {Object.entries(template.constraints).map(([key, constraint]) => (
                        <div key={key}>
                          <label className="block text-gray-300 text-sm font-medium mb-2">
                            {(constraint as any).label}
                          </label>
                          {(constraint as any).type === 'number' && (
                            <input
                              type="number"
                              min={(constraint as any).min}
                              max={(constraint as any).max}
                              defaultValue={(constraint as any).default}
                              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white"
                              onChange={(e) => setProofRequest({
                                ...proofRequest,
                                constraints: {
                                  ...proofRequest.constraints,
                                  [key]: parseInt(e.target.value)
                                }
                              })}
                            />
                          )}
                          {(constraint as any).type === 'select' && (
                            <select
                              defaultValue={(constraint as any).default}
                              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white"
                              onChange={(e) => setProofRequest({
                                ...proofRequest,
                                constraints: {
                                  ...proofRequest.constraints,
                                  [key]: e.target.value
                                }
                              })}
                            >
                              {(constraint as any).options.map((option: string) => (
                                <option key={option} value={option}>{option}</option>
                              ))}
                            </select>
                          )}
                          {(constraint as any).type === 'text' && (
                            <input
                              type="text"
                              placeholder={(constraint as any).placeholder}
                              defaultValue={(constraint as any).default}
                              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white"
                              onChange={(e) => setProofRequest({
                                ...proofRequest,
                                constraints: {
                                  ...proofRequest.constraints,
                                  [key]: e.target.value
                                }
                              })}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Purpose */}
                <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                  <h4 className="font-semibold text-white mb-4">Proof Purpose</h4>
                  <input
                    type="text"
                    placeholder="e.g., Gitcoin Round 19 eligibility verification"
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white"
                    onChange={(e) => setProofRequest({...proofRequest, purpose: e.target.value})}
                  />
                  <p className="text-gray-500 text-sm mt-2">
                    This helps you track how your proofs are used and provides context to verifiers
                  </p>
                </div>

                {/* Generate Button */}
                <div className="flex justify-end">
                  <button
                    onClick={handleGenerateProof}
                    disabled={!proofRequest.credentialId || isGenerating}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-3 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {isGenerating ? (
                      <>
                        <div className="w-5 h-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        <span>Generating Proof...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5" />
                        <span>Generate ZK Proof</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}