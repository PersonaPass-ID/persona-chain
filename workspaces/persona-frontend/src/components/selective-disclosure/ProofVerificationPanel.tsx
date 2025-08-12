/**
 * PROOF VERIFICATION PANEL
 * 
 * Component for verifying selective disclosure proofs with detailed
 * validation results, trust scoring, and privacy assessment.
 */

'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Eye,
  Lock,
  Zap,
  TrendingUp,
  Info
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  SelectiveDisclosureProof,
  SelectiveDisclosureRequest,
  VerificationResult,
  selectiveDisclosureService
} from '@/lib/zkp/selective-disclosure-service'

interface ProofVerificationPanelProps {
  proof?: SelectiveDisclosureProof
  request?: SelectiveDisclosureRequest
  onVerificationComplete?: (result: VerificationResult) => void
}

export function ProofVerificationPanel({ 
  proof, 
  request, 
  onVerificationComplete 
}: ProofVerificationPanelProps) {
  const [proofJson, setProofJson] = useState('')
  const [requestJson, setRequestJson] = useState('')
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const { toast } = useToast()

  const handleVerification = async () => {
    let proofToVerify: SelectiveDisclosureProof
    let requestToVerify: SelectiveDisclosureRequest

    try {
      // Use provided props or parse from JSON
      if (proof && request) {
        proofToVerify = proof
        requestToVerify = request
      } else {
        if (!proofJson || !requestJson) {
          toast({
            title: "Missing Input",
            description: "Please provide both proof and request data",
            variant: "destructive"
          })
          return
        }

        proofToVerify = JSON.parse(proofJson)
        requestToVerify = JSON.parse(requestJson)
      }

      setIsVerifying(true)
      setVerificationResult(null)

      // Perform verification
      const result = await selectiveDisclosureService.verifySelectiveDisclosureProof(
        proofToVerify,
        requestToVerify
      )

      setVerificationResult(result)
      onVerificationComplete?.(result)

      if (result.valid) {
        toast({
          title: "Verification Successful",
          description: `Trust score: ${result.trustScore}/100, Privacy score: ${result.privacyScore}/100`,
        })
      } else {
        toast({
          title: "Verification Failed",
          description: result.errors?.join(', ') || 'Unknown verification error',
          variant: "destructive"
        })
      }

    } catch (error) {
      toast({
        title: "Verification Error",
        description: error instanceof Error ? error.message : 'Invalid input format',
        variant: "destructive"
      })
    } finally {
      setIsVerifying(false)
    }
  }

  const getTrustColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getTrustLevel = (score: number) => {
    if (score >= 90) return 'Excellent'
    if (score >= 80) return 'High'
    if (score >= 60) return 'Medium'
    if (score >= 40) return 'Low'
    return 'Very Low'
  }

  const getPrivacyColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getPrivacyLevel = (score: number) => {
    if (score >= 80) return 'Maximum'
    if (score >= 60) return 'Standard'
    return 'Minimal'
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  const getClaimIcon = (proven: boolean) => {
    return proven ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <XCircle className="h-4 w-4 text-red-600" />
    )
  }

  return (
    <div className="space-y-6">
      {/* Input Section */}
      {!proof || !request ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Proof Verification
            </CardTitle>
            <CardDescription>
              Verify selective disclosure proofs and validate claims
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="proof-json">Selective Disclosure Proof (JSON)</Label>
              <Textarea
                id="proof-json"
                placeholder="Paste the proof JSON here..."
                value={proofJson}
                onChange={(e) => setProofJson(e.target.value)}
                rows={6}
                className="font-mono text-sm"
              />
            </div>
            
            <div>
              <Label htmlFor="request-json">Presentation Request (JSON)</Label>
              <Textarea
                id="request-json"
                placeholder="Paste the request JSON here..."
                value={requestJson}
                onChange={(e) => setRequestJson(e.target.value)}
                rows={6}
                className="font-mono text-sm"
              />
            </div>

            <Button 
              onClick={handleVerification} 
              disabled={isVerifying || (!proofJson && !proof) || (!requestJson && !request)}
              className="w-full"
            >
              {isVerifying ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Verifying Proof...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Verify Proof
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Automatic Verification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={handleVerification} disabled={isVerifying} className="w-full">
              {isVerifying ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Verifying Proof...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Verify Provided Proof
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Verification Results */}
      {verificationResult && (
        <>
          {/* Overall Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {verificationResult.valid ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                Verification {verificationResult.valid ? 'Successful' : 'Failed'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Proof ID</Label>
                  <p className="text-sm font-mono">{verificationResult.proofId}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Verified At</Label>
                  <p className="text-sm">{formatTimestamp(verificationResult.verifiedAt)}</p>
                </div>
              </div>

              {!verificationResult.valid && verificationResult.errors && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium text-red-800">Verification Errors</span>
                  </div>
                  <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                    {verificationResult.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Trust and Privacy Scores */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Trust Score */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className={`h-5 w-5 ${getTrustColor(verificationResult.trustScore)}`} />
                  Trust Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          verificationResult.trustScore >= 80 ? 'bg-green-500' : 
                          verificationResult.trustScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${verificationResult.trustScore}%` }}
                      />
                    </div>
                    <Badge variant="outline" className={getTrustColor(verificationResult.trustScore)}>
                      {verificationResult.trustScore}/100
                    </Badge>
                  </div>
                  <Badge className={getTrustColor(verificationResult.trustScore)}>
                    {getTrustLevel(verificationResult.trustScore)}
                  </Badge>
                </div>
                
                <div className="text-sm text-gray-600">
                  <p>
                    Trust score indicates the reliability and authenticity of the proof
                    based on cryptographic verification and issuer reputation.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Privacy Score */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className={`h-5 w-5 ${getPrivacyColor(verificationResult.privacyScore)}`} />
                  Privacy Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          verificationResult.privacyScore >= 80 ? 'bg-green-500' : 
                          verificationResult.privacyScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${verificationResult.privacyScore}%` }}
                      />
                    </div>
                    <Badge variant="outline" className={getPrivacyColor(verificationResult.privacyScore)}>
                      {verificationResult.privacyScore}/100
                    </Badge>
                  </div>
                  <Badge className={getPrivacyColor(verificationResult.privacyScore)}>
                    {getPrivacyLevel(verificationResult.privacyScore)}
                  </Badge>
                </div>
                
                <div className="text-sm text-gray-600">
                  <p>
                    Privacy score measures how much personal information is protected
                    while still proving the required claims.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Verified Claims */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Verified Claims
              </CardTitle>
              <CardDescription>
                Claims that were validated through zero-knowledge proofs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {verificationResult.claims.map((claim, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {getClaimIcon(claim.proven)}
                        <span className="font-medium text-sm capitalize">
                          {claim.attribute.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {claim.operation}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600">{claim.description}</p>
                      
                      {/* Show value only if explicitly disclosed */}
                      {claim.value !== undefined && (
                        <div className="mt-1">
                          <Badge variant="outline" className="text-xs">
                            Value: {typeof claim.value === 'object' ? JSON.stringify(claim.value) : claim.value}
                          </Badge>
                        </div>
                      )}
                      
                      {/* Show range if applicable */}
                      {claim.range && (
                        <div className="mt-1">
                          <Badge variant="outline" className="text-xs">
                            Range: {claim.range.min} - {claim.range.max}
                          </Badge>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right">
                      {claim.proven ? (
                        <Badge className="bg-green-100 text-green-800">Proven</Badge>
                      ) : (
                        <Badge variant="destructive">Failed</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Technical Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Technical Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">Verifier DID</Label>
                    <p className="text-sm font-mono break-all">{verificationResult.verifierDID}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Proof ID</Label>
                    <p className="text-sm font-mono break-all">{verificationResult.proofId}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">Verification Time</Label>
                    <p className="text-sm">{formatTimestamp(verificationResult.verifiedAt)}</p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <div className="flex items-center gap-2">
                      {verificationResult.valid ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-green-600">Valid</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-red-600" />
                          <span className="text-sm text-red-600">Invalid</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Zero-Knowledge Proof Verification</p>
                    <p>
                      This proof was verified using cryptographic zero-knowledge techniques, 
                      ensuring that the claims are valid without revealing the underlying 
                      credential data. The trust and privacy scores reflect the quality 
                      and security of the proof.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}