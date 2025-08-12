// ZK Proof Generation Modal
// Allows users to generate and share zero-knowledge proofs from their credentials

'use client'

import React, { useState, useEffect } from 'react'
import { zkProofService } from '@/lib/zk-proof-service'
import { credentialManagementService } from '@/lib/credential-management-service'
import type { PersonaChainCredential } from '@/lib/personachain-service'
import type { ZKProofRequest, ZKProof, QRShareData } from '@/lib/zk-proof-service'

interface ZKProofModalProps {
  isOpen: boolean
  onClose: () => void
  credential: PersonaChainCredential
}

export default function ZKProofModal({ isOpen, onClose, credential }: ZKProofModalProps) {
  const [selectedProofType, setSelectedProofType] = useState<ZKProofRequest['proofType']>('developer_level')
  const [customClaims, setCustomClaims] = useState<string[]>([])
  const [validityPeriod, setValidityPeriod] = useState(24) // hours
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedProof, setGeneratedProof] = useState<ZKProof | null>(null)
  const [qrShareData, setQrShareData] = useState<QRShareData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const proofTypes = zkProofService.getAvailableProofTypes(credential)

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setGeneratedProof(null)
      setQrShareData(null)
      setError(null)
      setIsGenerating(false)
    }
  }, [isOpen])

  const handleGenerateProof = async () => {
    try {
      setIsGenerating(true)
      setError(null)

      const request: ZKProofRequest = {
        credentialId: credential.id,
        proofType: selectedProofType,
        customClaims: selectedProofType === 'custom' ? customClaims : undefined,
        includeTimestamp: true,
        validityPeriod
      }

      console.log(`🔐 Generating proof with request:`, request)

      const proof = await zkProofService.generateProof(credential, request)
      setGeneratedProof(proof)

      // Automatically create QR share
      const shareData = await zkProofService.createQRShare(proof)
      setQrShareData(shareData)

      console.log(`✅ Proof and QR share generated successfully`)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('❌ Proof generation error:', err)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopyShareUrl = () => {
    if (qrShareData?.shareUrl) {
      navigator.clipboard.writeText(qrShareData.shareUrl)
      // You could add a toast notification here
      console.log(`📋 Share URL copied: ${qrShareData.shareUrl}`)
    }
  }

  const handleDownloadQR = () => {
    if (qrShareData?.qrCodeDataUrl) {
      const link = document.createElement('a')
      link.download = `personapass-proof-${generatedProof?.id}.svg`
      link.href = qrShareData.qrCodeDataUrl
      link.click()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Generate Zero-Knowledge Proof</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {!generatedProof ? (
            <div className="space-y-6">
              {/* Credential Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Source Credential</h3>
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gray-900 rounded-md flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">GitHub Developer Credential</p>
                    <p className="text-sm text-gray-600">
                      @{credential.credentialData.credentialSubject.githubUsername}
                    </p>
                  </div>
                </div>
              </div>

              {/* Proof Type Selection */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">What would you like to prove?</h3>
                <div className="grid gap-3">
                  {proofTypes.map((type) => (
                    <label
                      key={type.type}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedProofType === type.type
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="proofType"
                        value={type.type}
                        checked={selectedProofType === type.type}
                        onChange={(e) => setSelectedProofType(e.target.value as ZKProofRequest['proofType'])}
                        className="sr-only"
                      />
                      <div className="flex items-start">
                        <span className="text-2xl mr-3">{type.icon}</span>
                        <div>
                          <h4 className="font-medium text-gray-900">{type.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Custom Claims (if custom proof selected) */}
              {selectedProofType === 'custom' && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Custom Claims</h3>
                  <div className="space-y-2">
                    {['githubUsername', 'publicRepos', 'followers', 'accountAgeMonths', 'verificationLevel'].map((claim) => (
                      <label key={claim} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={customClaims.includes(claim)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCustomClaims([...customClaims, claim])
                            } else {
                              setCustomClaims(customClaims.filter(c => c !== claim))
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700 capitalize">
                          {claim.replace(/([A-Z])/g, ' $1').toLowerCase()}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Validity Period */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Proof Validity</h3>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="validity"
                      checked={validityPeriod === 24}
                      onChange={() => setValidityPeriod(24)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">24 hours</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="validity"
                      checked={validityPeriod === 168}
                      onChange={() => setValidityPeriod(168)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">7 days</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="validity"
                      checked={validityPeriod === 720}
                      onChange={() => setValidityPeriod(720)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">30 days</span>
                  </label>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Error</h3>
                      <p className="mt-1 text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Generate Button */}
              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 px-4 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerateProof}
                  disabled={isGenerating || (selectedProofType === 'custom' && customClaims.length === 0)}
                  className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? 'Generating...' : 'Generate Proof'}
                </button>
              </div>
            </div>
          ) : (
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
                    <h3 className="text-sm font-medium text-green-800">Zero-Knowledge Proof Generated!</h3>
                    <p className="mt-1 text-sm text-green-700">
                      Your proof has been created and is ready to share.
                    </p>
                  </div>
                </div>
              </div>

              {/* QR Code */}
              {qrShareData && (
                <div className="text-center">
                  <h3 className="font-medium text-gray-900 mb-4">Scan to Verify</h3>
                  <div className="inline-block bg-white p-4 rounded-lg border-2 border-gray-200">
                    <img
                      src={qrShareData.qrCodeDataUrl}
                      alt="QR Code for proof verification"
                      className="w-48 h-48 mx-auto"
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-3 max-w-md mx-auto">
                    {qrShareData.verificationInstructions}
                  </p>
                </div>
              )}

              {/* Share Options */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Share Your Proof</h3>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Share URL</p>
                      <p className="text-xs text-gray-600 break-all">{qrShareData?.shareUrl}</p>
                    </div>
                    <button
                      onClick={handleCopyShareUrl}
                      className="ml-3 py-1 px-3 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleDownloadQR}
                    className="py-2 px-4 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 font-medium transition-colors"
                  >
                    Download QR
                  </button>
                  <button
                    onClick={() => {
                      if (qrShareData?.shareUrl) {
                        window.open(`https://twitter.com/intent/tweet?text=Verify my developer credentials with PersonaPass&url=${encodeURIComponent(qrShareData.shareUrl)}`, '_blank')
                      }
                    }}
                    className="py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium transition-colors"
                  >
                    Share on Twitter
                  </button>
                </div>
              </div>

              {/* Proof Details */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">Proof Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Proof ID:</span>
                    <span className="font-mono text-xs">{generatedProof.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className="capitalize">{generatedProof.proofType.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Valid Until:</span>
                    <span>{qrShareData ? new Date(qrShareData.validUntil).toLocaleString() : 'No expiration'}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setGeneratedProof(null)
                    setQrShareData(null)
                  }}
                  className="flex-1 py-3 px-4 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 font-medium transition-colors"
                >
                  Generate Another
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}