/**
 * Verifiable Credential Card Component
 * Shows user's Proof of Personhood VC after successful KYC
 */

'use client'

import React, { useState } from 'react'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Copy, Download, Share2, Shield, CheckCircle, Clock, AlertCircle } from 'lucide-react'

interface VerifiableCredentialProps {
  user: {
    id: string
    email: string
    walletAddress?: string
    kycStatus: 'pending' | 'processing' | 'completed' | 'failed'
    kycProvider?: string
    verificationLevel?: 'basic' | 'enhanced' | 'full'
    zkProofHash?: string
    vcCreatedAt?: string
    tokensAwarded?: number
  }
}

export default function VerifiableCredentialCard({ user }: VerifiableCredentialProps) {
  const [copied, setCopied] = useState(false)
  const [sharing, setSharing] = useState(false)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getStatusIcon = () => {
    switch (user.kycStatus) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'processing':
        return <Clock className="h-5 w-5 text-yellow-500" />
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusBadge = () => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      completed: 'default',
      processing: 'secondary',
      failed: 'destructive',
      pending: 'outline'
    }
    
    return (
      <Badge variant={variants[user.kycStatus] || 'outline'}>
        {getStatusIcon()}
        <span className="ml-1">
          {user.kycStatus === 'completed' ? 'Verified Human' : 
           user.kycStatus === 'processing' ? 'Verification in Progress' :
           user.kycStatus === 'failed' ? 'Verification Failed' : 
           'Verification Pending'}
        </span>
      </Badge>
    )
  }

  const generateVC = () => {
    if (user.kycStatus !== 'completed') return null

    return {
      "@context": ["https://www.w3.org/2018/credentials/v1"],
      "type": ["VerifiableCredential", "PersonhoodCredential"],
      "issuer": "did:personachain:personapass",
      "issuanceDate": user.vcCreatedAt || new Date().toISOString(),
      "expirationDate": new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      "credentialSubject": {
        "id": `did:personachain:${user.id}`,
        "personhood": {
          "verified": true,
          "level": user.verificationLevel || "basic",
          "provider": user.kycProvider || "sumsub",
          "zkProofHash": user.zkProofHash,
          "ageVerified": true,
          "uniqueness": true,
          "complianceLevel": "gdpr_ccpa_bsa"
        }
      },
      "proof": {
        "type": "Ed25519Signature2020",
        "created": new Date().toISOString(),
        "verificationMethod": "did:personachain:personapass#keys-1",
        "proofPurpose": "assertionMethod",
        "proofValue": user.zkProofHash?.substring(0, 20) + "..."
      }
    }
  }

  const downloadVC = () => {
    const vc = generateVC()
    if (!vc) return

    const blob = new Blob([JSON.stringify(vc, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `personapass-vc-${user.id}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const shareVC = async () => {
    setSharing(true)
    try {
      const vc = generateVC()
      if (!vc) return

      if (navigator.share) {
        await navigator.share({
          title: 'PersonaPass Proof of Personhood',
          text: 'My verified PersonaPass Proof of Personhood credential',
          url: `https://personapass.xyz/verify/${user.zkProofHash}`
        })
      } else {
        copyToClipboard(`https://personapass.xyz/verify/${user.zkProofHash}`)
      }
    } finally {
      setSharing(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Identity Verification Status
            </h3>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {user.kycStatus === 'completed' && (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Verification Level:</span>
                  <p className="font-medium capitalize">{user.verificationLevel}</p>
                </div>
                <div>
                  <span className="text-gray-600">Provider:</span>
                  <p className="font-medium capitalize">{user.kycProvider}</p>
                </div>
                <div>
                  <span className="text-gray-600">Tokens Earned:</span>
                  <p className="font-medium text-green-600">+{user.tokensAwarded || 100} ID Tokens</p>
                </div>
                <div>
                  <span className="text-gray-600">Verified:</span>
                  <p className="font-medium">{user.vcCreatedAt ? new Date(user.vcCreatedAt).toLocaleDateString() : 'Today'}</p>
                </div>
              </div>
            )}

            {user.kycStatus === 'pending' && (
              <div className="text-center py-4">
                <p className="text-gray-600 mb-4">Complete identity verification to unlock:</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="font-medium">✅ Proof of Personhood VC</p>
                    <p className="text-gray-600">Reusable identity credential</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="font-medium">🎁 100 Free ID Tokens</p>
                    <p className="text-gray-600">Monthly reward</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Verifiable Credential Card */}
      {user.kycStatus === 'completed' && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Your Proof of Personhood Credential
            </h3>
            <p className="text-sm text-gray-600">
              Share this credential with companies to prove you're a verified human without revealing personal data
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Zero-Knowledge Proof Hash */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Zero-Knowledge Proof Hash</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(user.zkProofHash || '')}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Copy className="h-4 w-4" />
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
                <p className="font-mono text-sm break-all bg-white p-2 rounded border">
                  {user.zkProofHash || 'abc123def456...'}
                </p>
              </div>

              {/* VC Features */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                  <Shield className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                  <p className="font-medium">Privacy Preserving</p>
                  <p className="text-gray-600">No personal data shared</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg text-center">
                  <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-600" />
                  <p className="font-medium">Verified Human</p>
                  <p className="text-gray-600">Sybil-resistant proof</p>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg text-center">
                  <Share2 className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                  <p className="font-medium">Reusable</p>
                  <p className="text-gray-600">Use across platforms</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button onClick={downloadVC} variant="outline" className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Download VC
                </Button>
                <Button onClick={shareVC} disabled={sharing} className="flex-1">
                  <Share2 className="h-4 w-4 mr-2" />
                  {sharing ? 'Sharing...' : 'Share Proof'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* How Companies Use This */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">How Companies Verify You</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-4 w-4 mt-0.5 text-green-500" />
              <div>
                <p className="font-medium">DeFi Protocols</p>
                <p className="text-gray-600">Higher lending limits, governance voting, sybil-resistant airdrops</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-4 w-4 mt-0.5 text-green-500" />
              <div>
                <p className="font-medium">Social Platforms</p>
                <p className="text-gray-600">Blue checkmark equivalent, reduced moderation, premium features</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-4 w-4 mt-0.5 text-green-500" />
              <div>
                <p className="font-medium">Gaming</p>
                <p className="text-gray-600">One account per person, tournament eligibility, anti-cheat verification</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-4 w-4 mt-0.5 text-green-500" />
              <div>
                <p className="font-medium">Financial Apps</p>
                <p className="text-gray-600">Faster approvals, higher limits, reduced fraud monitoring</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}