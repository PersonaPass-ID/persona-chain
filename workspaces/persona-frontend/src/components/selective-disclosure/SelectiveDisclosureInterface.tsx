/**
 * SELECTIVE DISCLOSURE INTERFACE
 * 
 * React component for creating and managing selective disclosure requests
 * and ZK proof generation with privacy-preserving credential sharing.
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Shield, Eye, EyeOff, Lock, Zap, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { selectiveDisclosureService, ClaimRequirement, SelectiveDisclosureRequest, SelectiveDisclosureProof } from '@/lib/zkp/selective-disclosure-service'

interface SelectiveDisclosureInterfaceProps {
  walletAddress: string
  onProofGenerated?: (proof: SelectiveDisclosureProof) => void
  onRequestCreated?: (request: SelectiveDisclosureRequest) => void
}

interface ClaimFormData extends Omit<ClaimRequirement, 'essential'> {
  essential: boolean
  privacy: 'minimal' | 'standard' | 'maximum'
}

export function SelectiveDisclosureInterface({ 
  walletAddress, 
  onProofGenerated, 
  onRequestCreated 
}: SelectiveDisclosureInterfaceProps) {
  const [mode, setMode] = useState<'create' | 'respond'>('create')
  const [claims, setClaims] = useState<ClaimFormData[]>([])
  const [context, setContext] = useState('')
  const [verifierDID, setVerifierDID] = useState('')
  const [expirationMinutes, setExpirationMinutes] = useState(60)
  const [selectedCredential, setSelectedCredential] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedProof, setGeneratedProof] = useState<SelectiveDisclosureProof | null>(null)
  const [privacyScore, setPrivacyScore] = useState(0)
  const { toast } = useToast()

  // Available circuits
  const availableCircuits = selectiveDisclosureService.getAvailableCircuits()

  const addClaim = () => {
    setClaims([...claims, {
      attribute: '',
      operation: 'equals',
      value: '',
      description: '',
      essential: false,
      privacy: 'standard'
    }])
  }

  const updateClaim = (index: number, field: keyof ClaimFormData, value: any) => {
    const updatedClaims = [...claims]
    updatedClaims[index] = { ...updatedClaims[index], [field]: value }
    setClaims(updatedClaims)
    calculatePrivacyScore(updatedClaims)
  }

  const removeClaim = (index: number) => {
    const updatedClaims = claims.filter((_, i) => i !== index)
    setClaims(updatedClaims)
    calculatePrivacyScore(updatedClaims)
  }

  const calculatePrivacyScore = (currentClaims: ClaimFormData[]) => {
    let score = 100
    
    // Reduce score for disclosed values
    const disclosedCount = currentClaims.filter(c => c.value && c.operation === 'equals').length
    score -= (disclosedCount / currentClaims.length) * 30

    // Reduce score for sensitive attributes
    const sensitiveAttributes = ['salary', 'age', 'address', 'income', 'health', 'financial']
    const sensitiveCount = currentClaims.filter(c => 
      sensitiveAttributes.some(attr => c.attribute.toLowerCase().includes(attr))
    ).length
    score -= (sensitiveCount / currentClaims.length) * 20

    // Boost for range/comparison operations (more private)
    const privateOps = currentClaims.filter(c => 
      ['greaterThan', 'lessThan', 'range', 'exists'].includes(c.operation)
    ).length
    score += (privateOps / currentClaims.length) * 10

    setPrivacyScore(Math.max(0, Math.min(100, Math.round(score))))
  }

  const createPresentationRequest = () => {
    if (!verifierDID || claims.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please provide verifier DID and at least one claim",
        variant: "destructive"
      })
      return
    }

    const claimRequirements: ClaimRequirement[] = claims.map(claim => ({
      attribute: claim.attribute,
      operation: claim.operation,
      value: claim.value || undefined,
      minValue: claim.minValue || undefined,
      maxValue: claim.maxValue || undefined,
      description: claim.description,
      essential: claim.essential
    }))

    const request = selectiveDisclosureService.createPresentationRequest(
      verifierDID,
      claimRequirements,
      context,
      expirationMinutes
    )

    onRequestCreated?.(request)
    
    toast({
      title: "Presentation Request Created",
      description: `Request created with ${claims.length} claims`,
    })
  }

  const generateProof = async () => {
    if (!selectedCredential || claims.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select a credential and define claims",
        variant: "destructive"
      })
      return
    }

    setIsGenerating(true)

    try {
      // Mock credential data - in real implementation, fetch from storage
      const mockCredentialData = {
        birthDate: '1990-05-15',
        address: {
          zipCode: '10001',
          country: 'US',
          state: 'NY'
        },
        employment: {
          isEmployed: true,
          salary: 75000,
          yearsExperience: 5
        },
        education: {
          hasGraduated: true,
          degree: 'Bachelor',
          gpa: 3.7
        },
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '+1234567890'
      }

      const claimRequirements: ClaimRequirement[] = claims.map(claim => ({
        attribute: claim.attribute,
        operation: claim.operation,
        value: claim.value || undefined,
        minValue: claim.minValue || undefined,
        maxValue: claim.maxValue || undefined,
        description: claim.description,
        essential: claim.essential
      }))

      const request: SelectiveDisclosureRequest = {
        credentialId: selectedCredential,
        requiredClaims: claimRequirements,
        context: context || 'Selective disclosure proof generation',
        challengeNonce: crypto.getRandomValues(new Uint8Array(32))
          .reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), ''),
        verifierDID: verifierDID || 'did:persona:verifier',
        expiresAt: new Date(Date.now() + expirationMinutes * 60 * 1000).toISOString()
      }

      const result = await selectiveDisclosureService.generateSelectiveDisclosureProof(
        walletAddress,
        mockCredentialData,
        request
      )

      if (result.success && result.proof) {
        setGeneratedProof(result.proof)
        onProofGenerated?.(result.proof)
        
        toast({
          title: "Proof Generated Successfully",
          description: `ZK proof created with privacy score: ${result.proof.metadata.privacyLevel}`,
        })
      } else {
        throw new Error(result.error || 'Proof generation failed')
      }

    } catch (error) {
      toast({
        title: "Proof Generation Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
    }
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

  return (
    <div className="space-y-6">
      {/* Mode Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Selective Disclosure
          </CardTitle>
          <CardDescription>
            Share specific claims from your credentials without revealing unnecessary information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Button
              variant={mode === 'create' ? 'default' : 'outline'}
              onClick={() => setMode('create')}
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              Create Request
            </Button>
            <Button
              variant={mode === 'respond' ? 'default' : 'outline'}
              onClick={() => setMode('respond')}
              className="flex items-center gap-2"
            >
              <Lock className="h-4 w-4" />
              Generate Proof
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Score */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className={`h-5 w-5 ${getPrivacyColor(privacyScore)}`} />
              <span className="font-medium">Privacy Score</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    privacyScore >= 80 ? 'bg-green-500' : 
                    privacyScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${privacyScore}%` }}
                />
              </div>
              <Badge variant="outline" className={getPrivacyColor(privacyScore)}>
                {privacyScore}/100 ({getPrivacyLevel(privacyScore)})
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {mode === 'create' && (
        <>
          {/* Request Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Request Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="verifier-did">Verifier DID</Label>
                  <Input
                    id="verifier-did"
                    placeholder="did:persona:verifier:123..."
                    value={verifierDID}
                    onChange={(e) => setVerifierDID(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="expiration">Expiration (minutes)</Label>
                  <Input
                    id="expiration"
                    type="number"
                    min="1"
                    max="1440"
                    value={expirationMinutes}
                    onChange={(e) => setExpirationMinutes(parseInt(e.target.value))}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="context">Context</Label>
                <Textarea
                  id="context"
                  placeholder="Purpose of this selective disclosure request..."
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Claims Definition */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Required Claims
                <Button onClick={addClaim} size="sm">
                  Add Claim
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {claims.map((claim, index) => (
                  <Card key={index} className="border-dashed">
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <Label>Attribute</Label>
                          <Input
                            placeholder="age, location, employment..."
                            value={claim.attribute}
                            onChange={(e) => updateClaim(index, 'attribute', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>Operation</Label>
                          <Select 
                            value={claim.operation} 
                            onValueChange={(value) => updateClaim(index, 'operation', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="equals">Equals</SelectItem>
                              <SelectItem value="greaterThan">Greater Than</SelectItem>
                              <SelectItem value="lessThan">Less Than</SelectItem>
                              <SelectItem value="range">Range</SelectItem>
                              <SelectItem value="contains">Contains</SelectItem>
                              <SelectItem value="exists">Exists</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        {claim.operation === 'range' ? (
                          <>
                            <div>
                              <Label>Min Value</Label>
                              <Input
                                placeholder="Minimum value"
                                value={claim.minValue || ''}
                                onChange={(e) => updateClaim(index, 'minValue', e.target.value)}
                              />
                            </div>
                            <div>
                              <Label>Max Value</Label>
                              <Input
                                placeholder="Maximum value"
                                value={claim.maxValue || ''}
                                onChange={(e) => updateClaim(index, 'maxValue', e.target.value)}
                              />
                            </div>
                          </>
                        ) : claim.operation !== 'exists' && (
                          <div className="col-span-2">
                            <Label>Value</Label>
                            <Input
                              placeholder="Expected value"
                              value={claim.value || ''}
                              onChange={(e) => updateClaim(index, 'value', e.target.value)}
                            />
                          </div>
                        )}
                      </div>

                      <div className="mb-4">
                        <Label>Description</Label>
                        <Input
                          placeholder="Purpose of this claim..."
                          value={claim.description}
                          onChange={(e) => updateClaim(index, 'description', e.target.value)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`essential-${index}`}
                            checked={claim.essential}
                            onCheckedChange={(checked) => updateClaim(index, 'essential', checked)}
                          />
                          <Label htmlFor={`essential-${index}`}>Essential</Label>
                        </div>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => removeClaim(index)}
                        >
                          Remove
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {claims.length > 0 && (
                <Button onClick={createPresentationRequest} className="w-full mt-4">
                  Create Presentation Request
                </Button>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {mode === 'respond' && (
        <>
          {/* Credential Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Credential</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedCredential} onValueChange={setSelectedCredential}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose credential to use..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cred_identity_123">Identity Credential</SelectItem>
                  <SelectItem value="cred_employment_456">Employment Credential</SelectItem>
                  <SelectItem value="cred_education_789">Education Credential</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Available Circuits */}
          <Card>
            <CardHeader>
              <CardTitle>Available ZK Circuits</CardTitle>
              <CardDescription>
                These circuits enable different types of privacy-preserving proofs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableCircuits.map((circuit) => (
                  <Card key={circuit.name} className="border-dashed">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="h-4 w-4" />
                        <h4 className="font-medium capitalize">
                          {circuit.name.replace('_', ' ')}
                        </h4>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {circuit.description}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {circuit.supportedClaims.map((claim) => (
                          <Badge key={claim} variant="secondary" className="text-xs">
                            {claim}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Proof Generation */}
          <Card>
            <CardHeader>
              <CardTitle>Generate ZK Proof</CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={generateProof} 
                disabled={isGenerating || !selectedCredential || claims.length === 0}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Generating Proof...
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    Generate Selective Disclosure Proof
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Generated Proof */}
          {generatedProof && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Proof Generated Successfully
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Proof ID</Label>
                      <p className="text-sm font-mono">{generatedProof.proofId}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Privacy Level</Label>
                      <Badge variant="outline">
                        {generatedProof.metadata.privacyLevel}
                      </Badge>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Proven Claims</Label>
                    <div className="space-y-2 mt-2">
                      {generatedProof.claims.map((claim, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm">{claim.description}</span>
                          {claim.proven ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Privacy Protection:</strong> This proof validates your claims without revealing 
                      the underlying credential data. Only the proven claims are shared with the verifier.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}