// Proof Verification Page
// Handles verification of shared ZK proofs via QR codes and URLs

'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { zkProofService } from '@/lib/zk-proof-service'
import type { ZKProof } from '@/lib/zk-proof-service'

export default function VerifyProofPage() {
  const params = useParams()
  const shareId = params.shareId as string
  
  const [proof, setProof] = useState<ZKProof | null>(null)
  const [verificationResult, setVerificationResult] = useState<{ valid: boolean; message: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (shareId) {
      loadAndVerifyProof()
    }
  }, [shareId])

  const loadAndVerifyProof = async () => {
    try {
      setIsLoading(true)
      setError(null)

      console.log(`🔍 Loading proof for share ID: ${shareId}`)

      // In a real implementation, this would fetch the proof from the backend
      // For now, we'll simulate loading a proof
      const mockProof = await simulateProofLoad(shareId)
      setProof(mockProof)

      // Verify the proof
      const result = await zkProofService.verifyProof(mockProof)
      setVerificationResult(result)

      console.log(`✅ Proof verification complete: ${result.valid}`)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('❌ Proof verification error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Simulate loading a proof (in production, fetch from API)
  const simulateProofLoad = async (shareId: string): Promise<ZKProof> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Create a mock proof based on the share ID
    const mockProof: ZKProof = {
      id: `zkp_${shareId}`,
      proofType: 'developer_level',
      credentialId: `cred_${shareId}`,
      claims: {
        verificationLevel: 'experienced',
        verified: true
      },
      proof: {
        pi_a: [
          `0x${Math.random().toString(16).substr(2, 64)}`,
          `0x${Math.random().toString(16).substr(2, 64)}`,
          "1"
        ],
        pi_b: [
          [
            `0x${Math.random().toString(16).substr(2, 64)}`,
            `0x${Math.random().toString(16).substr(2, 64)}`
          ],
          [
            `0x${Math.random().toString(16).substr(2, 64)}`,
            `0x${Math.random().toString(16).substr(2, 64)}`
          ],
          ["1", "0"]
        ],
        pi_c: [
          `0x${Math.random().toString(16).substr(2, 64)}`,
          `0x${Math.random().toString(16).substr(2, 64)}`,
          "1"
        ],
        protocol: "groth16",
        curve: "bn128"
      },
      publicSignals: ["experienced", "true"],
      verificationKey: {
        protocol: "groth16",
        curve: "bn128",
        nPublic: 2,
        vk_alpha_1: [
          `0x${Math.random().toString(16).substr(2, 64)}`,
          `0x${Math.random().toString(16).substr(2, 64)}`,
          "1"
        ],
        vk_beta_2: [
          [
            `0x${Math.random().toString(16).substr(2, 64)}`,
            `0x${Math.random().toString(16).substr(2, 64)}`
          ],
          [
            `0x${Math.random().toString(16).substr(2, 64)}`,
            `0x${Math.random().toString(16).substr(2, 64)}`
          ],
          ["1", "0"]
        ],
        vk_gamma_2: [
          [
            `0x${Math.random().toString(16).substr(2, 64)}`,
            `0x${Math.random().toString(16).substr(2, 64)}`
          ],
          [
            `0x${Math.random().toString(16).substr(2, 64)}`,
            `0x${Math.random().toString(16).substr(2, 64)}`
          ],
          ["1", "0"]
        ],
        vk_delta_2: [
          [
            `0x${Math.random().toString(16).substr(2, 64)}`,
            `0x${Math.random().toString(16).substr(2, 64)}`
          ],
          [
            `0x${Math.random().toString(16).substr(2, 64)}`,
            `0x${Math.random().toString(16).substr(2, 64)}`
          ],
          ["1", "0"]
        ],
        vk_alphabeta_12: [
          [
            `0x${Math.random().toString(16).substr(2, 64)}`,
            `0x${Math.random().toString(16).substr(2, 64)}`
          ],
          [
            `0x${Math.random().toString(16).substr(2, 64)}`,
            `0x${Math.random().toString(16).substr(2, 64)}`
          ]
        ],
        IC: [
          [
            `0x${Math.random().toString(16).substr(2, 64)}`,
            `0x${Math.random().toString(16).substr(2, 64)}`,
            "1"
          ]
        ]
      },
      metadata: {
        issuer: 'did:personapass:issuer',
        issuedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        proofPurpose: 'Proof of developer level'
      }
    }

    return mockProof
  }

  const getProofTypeIcon = (proofType: string) => {
    const icons = {
      developer_level: '🏆',
      account_age: '📅',
      repository_count: '📦',
      follower_count: '👥',
      custom: '⚙️'
    }
    return icons[proofType as keyof typeof icons] || '🔐'
  }

  const getProofTypeName = (proofType: string) => {
    const names = {
      developer_level: 'Developer Level',
      account_age: 'Account Age',
      repository_count: 'Repository Count',
      follower_count: 'Follower Count',
      custom: 'Custom Proof'
    }
    return names[proofType as keyof typeof names] || 'Unknown Proof'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying proof...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Verification Failed</h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Proof Verification</h1>
          <p className="text-lg text-gray-600">
            Verifying zero-knowledge proof shared via PersonaPass
          </p>
        </div>

        {/* Verification Result */}
        {verificationResult && (
          <div className={`rounded-lg p-6 mb-8 ${
            verificationResult.valid 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                verificationResult.valid ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {verificationResult.valid ? (
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              <div className="ml-4">
                <h3 className={`text-lg font-medium ${
                  verificationResult.valid ? 'text-green-800' : 'text-red-800'
                }`}>
                  {verificationResult.valid ? 'Proof Verified Successfully' : 'Proof Verification Failed'}
                </h3>
                <p className={`text-sm ${
                  verificationResult.valid ? 'text-green-700' : 'text-red-700'
                }`}>
                  {verificationResult.message}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Proof Details */}
        {proof && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Proof Details</h2>
            
            {/* Proof Type */}
            <div className="flex items-center mb-6">
              <span className="text-3xl mr-4">{getProofTypeIcon(proof.proofType)}</span>
              <div>
                <h3 className="text-lg font-medium text-gray-900">{getProofTypeName(proof.proofType)}</h3>
                <p className="text-sm text-gray-600">{proof.metadata.proofPurpose}</p>
              </div>
            </div>

            {/* Claims */}
            <div className="border-t border-gray-200 pt-6 mb-6">
              <h4 className="font-medium text-gray-900 mb-3">Verified Claims</h4>
              <div className="space-y-2">
                {Object.entries(proof.claims).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').toLowerCase()}:</span>
                    <span className="font-medium text-gray-900">
                      {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Metadata */}
            <div className="border-t border-gray-200 pt-6">
              <h4 className="font-medium text-gray-900 mb-3">Proof Metadata</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Proof ID:</span>
                  <p className="font-mono text-xs mt-1 break-all">{proof.id}</p>
                </div>
                <div>
                  <span className="text-gray-600">Issuer:</span>
                  <p className="font-mono text-xs mt-1 break-all">{proof.metadata.issuer}</p>
                </div>
                <div>
                  <span className="text-gray-600">Issued At:</span>
                  <p className="mt-1">{new Date(proof.metadata.issuedAt).toLocaleString()}</p>
                </div>
                {proof.metadata.expiresAt && (
                  <div>
                    <span className="text-gray-600">Expires At:</span>
                    <p className="mt-1">{new Date(proof.metadata.expiresAt).toLocaleString()}</p>
                  </div>
                )}
                <div>
                  <span className="text-gray-600">Protocol:</span>
                  <p className="mt-1 uppercase">{proof.proof.protocol}</p>
                </div>
                <div>
                  <span className="text-gray-600">Curve:</span>
                  <p className="mt-1 uppercase">{proof.proof.curve}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* About Zero-Knowledge Proofs */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h3 className="font-semibold text-blue-900 mb-3">🔐 About Zero-Knowledge Proofs</h3>
          <div className="space-y-2 text-sm text-blue-800">
            <p><strong>Privacy-Preserving:</strong> Proofs verify claims without revealing underlying data</p>
            <p><strong>Cryptographically Secure:</strong> Uses advanced cryptography to ensure proof validity</p>
            <p><strong>Verifiable:</strong> Anyone can verify the proof without accessing private information</p>
            <p><strong>PersonaChain:</strong> Proofs are anchored to blockchain credentials for immutable verification</p>
          </div>
        </div>

        {/* Actions */}
        <div className="text-center">
          <button
            onClick={() => window.location.href = '/'}
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 font-medium transition-colors"
          >
            Create Your Own Credentials
          </button>
        </div>
      </div>
    </div>
  )
}