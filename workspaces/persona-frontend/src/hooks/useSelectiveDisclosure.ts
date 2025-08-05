/**
 * SELECTIVE DISCLOSURE HOOK
 * 
 * React hook for managing selective disclosure operations including
 * proof generation, verification, and presentation request handling.
 */

'use client'

import { useState, useCallback, useEffect } from 'react'
import { 
  selectiveDisclosureService, 
  SelectiveDisclosureRequest,
  SelectiveDisclosureProof,
  VerificationResult,
  ClaimRequirement,
  ZKCircuit
} from '@/lib/zkp/selective-disclosure-service'
import { useToast } from '@/hooks/use-toast'

export interface UseSelectiveDisclosureOptions {
  walletAddress: string
  autoVerify?: boolean
  cacheProofs?: boolean
}

export interface ProofGenerationState {
  isGenerating: boolean
  progress: number
  currentStep: string
  error: string | null
}

export interface VerificationState {
  isVerifying: boolean
  result: VerificationResult | null
  error: string | null
}

export function useSelectiveDisclosure(options: UseSelectiveDisclosureOptions) {
  const { walletAddress, autoVerify = true, cacheProofs = true } = options
  const { toast } = useToast()

  // State management
  const [proofs, setProofs] = useState<SelectiveDisclosureProof[]>([])
  const [requests, setRequests] = useState<SelectiveDisclosureRequest[]>([])
  const [generationState, setGenerationState] = useState<ProofGenerationState>({
    isGenerating: false,
    progress: 0,
    currentStep: '',
    error: null
  })
  const [verificationState, setVerificationState] = useState<VerificationState>({
    isVerifying: false,
    result: null,
    error: null
  })

  // Available circuits
  const [availableCircuits, setAvailableCircuits] = useState<ZKCircuit[]>([])

  useEffect(() => {
    // Load available circuits
    const circuits = selectiveDisclosureService.getAvailableCircuits()
    setAvailableCircuits(circuits)
  }, [])

  /**
   * Create a presentation request
   */
  const createPresentationRequest = useCallback((
    verifierDID: string,
    claims: ClaimRequirement[],
    context: string,
    expirationMinutes: number = 60
  ): SelectiveDisclosureRequest => {
    const request = selectiveDisclosureService.createPresentationRequest(
      verifierDID,
      claims,
      context,
      expirationMinutes
    )

    setRequests(prev => [...prev, request])

    toast({
      title: "Presentation Request Created",
      description: `Request created with ${claims.length} claims`,
    })

    return request
  }, [toast])

  /**
   * Generate selective disclosure proof
   */
  const generateProof = useCallback(async (
    credentialData: any,
    request: SelectiveDisclosureRequest
  ): Promise<SelectiveDisclosureProof | null> => {
    setGenerationState({
      isGenerating: true,
      progress: 0,
      currentStep: 'Initializing...',
      error: null
    })

    try {
      // Step 1: Validate inputs
      setGenerationState(prev => ({
        ...prev,
        progress: 20,
        currentStep: 'Validating inputs...'
      }))

      if (!credentialData || !request.requiredClaims.length) {
        throw new Error('Invalid credential data or claims')
      }

      // Step 2: Find suitable circuit
      setGenerationState(prev => ({
        ...prev,
        progress: 40,
        currentStep: 'Finding suitable ZK circuit...'
      }))

      const circuit = selectiveDisclosureService.findSuitableCircuit(request.requiredClaims)
      if (!circuit) {
        throw new Error('No suitable ZK circuit found for the required claims')
      }

      // Step 3: Generate proof
      setGenerationState(prev => ({
        ...prev,
        progress: 60,
        currentStep: `Generating proof using ${circuit.name}...`
      }))

      const result = await selectiveDisclosureService.generateSelectiveDisclosureProof(
        walletAddress,
        credentialData,
        request
      )

      if (!result.success || !result.proof) {
        throw new Error(result.error || 'Proof generation failed')
      }

      // Step 4: Verify proof if auto-verify enabled
      if (autoVerify) {
        setGenerationState(prev => ({
          ...prev,
          progress: 80,
          currentStep: 'Verifying generated proof...'
        }))

        const verification = await verifyProof(result.proof, request)
        if (!verification?.valid) {
          throw new Error('Generated proof failed verification')
        }
      }

      // Step 5: Cache proof
      setGenerationState(prev => ({
        ...prev,
        progress: 100,
        currentStep: 'Finalizing...'
      }))

      if (cacheProofs) {
        setProofs(prev => [...prev, result.proof!])
      }

      toast({
        title: "Proof Generated Successfully",
        description: `ZK proof created with privacy level: ${result.proof.metadata.privacyLevel}`,
      })

      return result.proof

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      setGenerationState(prev => ({
        ...prev,
        error: errorMessage
      }))

      toast({
        title: "Proof Generation Failed",
        description: errorMessage,
        variant: "destructive"
      })

      return null

    } finally {
      setGenerationState(prev => ({
        ...prev,
        isGenerating: false,
        progress: 0,
        currentStep: ''
      }))
    }
  }, [walletAddress, autoVerify, cacheProofs, toast])

  /**
   * Verify selective disclosure proof
   */
  const verifyProof = useCallback(async (
    proof: SelectiveDisclosureProof,
    request: SelectiveDisclosureRequest
  ): Promise<VerificationResult | null> => {
    setVerificationState({
      isVerifying: true,
      result: null,
      error: null
    })

    try {
      const result = await selectiveDisclosureService.verifySelectiveDisclosureProof(proof, request)
      
      setVerificationState({
        isVerifying: false,
        result,
        error: null
      })

      if (result.valid) {
        toast({
          title: "Proof Verified",
          description: `Trust score: ${result.trustScore}/100, Privacy score: ${result.privacyScore}/100`,
        })
      } else {
        toast({
          title: "Proof Verification Failed",
          description: result.errors?.join(', ') || 'Unknown verification error',
          variant: "destructive"
        })
      }

      return result

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Verification failed'
      
      setVerificationState({
        isVerifying: false,
        result: null,
        error: errorMessage
      })

      toast({
        title: "Verification Error",
        description: errorMessage,
        variant: "destructive"
      })

      return null
    }
  }, [toast])

  /**
   * Get suitable circuit for claims
   */
  const findSuitableCircuit = useCallback((claims: ClaimRequirement[]): ZKCircuit | null => {
    return selectiveDisclosureService.findSuitableCircuit(claims)
  }, [])

  /**
   * Calculate privacy score for claims
   */
  const calculatePrivacyScore = useCallback((
    claims: ClaimRequirement[],
    proofMetadata?: SelectiveDisclosureProof['metadata']
  ): number => {
    let score = 100

    // Reduce score for disclosed values
    const disclosedCount = claims.filter(c => c.value && c.operation === 'equals').length
    if (claims.length > 0) {
      score -= (disclosedCount / claims.length) * 30
    }

    // Reduce score for sensitive attributes
    const sensitiveAttributes = ['salary', 'age', 'address', 'income', 'health', 'financial']
    const sensitiveCount = claims.filter(c => 
      sensitiveAttributes.some(attr => c.attribute.toLowerCase().includes(attr))
    ).length
    if (claims.length > 0) {
      score -= (sensitiveCount / claims.length) * 20
    }

    // Boost for range/comparison operations (more private)
    const privateOps = claims.filter(c => 
      ['greaterThan', 'lessThan', 'range', 'exists'].includes(c.operation)
    ).length
    if (claims.length > 0) {
      score += (privateOps / claims.length) * 10
    }

    // Adjust based on proof metadata
    if (proofMetadata) {
      if (proofMetadata.privacyLevel === 'maximum') score += 5
      if (proofMetadata.privacyLevel === 'minimal') score -= 5
    }

    return Math.max(0, Math.min(100, Math.round(score)))
  }, [])

  /**
   * Clear cached proofs
   */
  const clearProofs = useCallback(() => {
    setProofs([])
    toast({
      title: "Proofs Cleared",
      description: "All cached proofs have been removed",
    })
  }, [toast])

  /**
   * Clear cached requests
   */
  const clearRequests = useCallback(() => {
    setRequests([])
    toast({
      title: "Requests Cleared",
      description: "All cached requests have been removed",
    })
  }, [toast])

  /**
   * Get proof by ID
   */
  const getProofById = useCallback((proofId: string): SelectiveDisclosureProof | null => {
    return proofs.find(p => p.proofId === proofId) || null
  }, [proofs])

  /**
   * Get request by challenge nonce
   */
  const getRequestByNonce = useCallback((challengeNonce: string): SelectiveDisclosureRequest | null => {
    return requests.find(r => r.challengeNonce === challengeNonce) || null
  }, [requests])

  /**
   * Export proof for sharing
   */
  const exportProof = useCallback((proof: SelectiveDisclosureProof): string => {
    return JSON.stringify({
      proofId: proof.proofId,
      credentialId: proof.credentialId,
      verifierDID: proof.verifierDID,
      claims: proof.claims,
      zkProof: proof.zkProof,
      metadata: proof.metadata
    }, null, 2)
  }, [])

  /**
   * Import proof from JSON
   */
  const importProof = useCallback((proofJson: string): SelectiveDisclosureProof | null => {
    try {
      const proof = JSON.parse(proofJson) as SelectiveDisclosureProof
      
      // Basic validation
      if (!proof.proofId || !proof.zkProof || !proof.claims) {
        throw new Error('Invalid proof format')
      }

      if (cacheProofs) {
        setProofs(prev => [...prev, proof])
      }

      toast({
        title: "Proof Imported",
        description: `Imported proof: ${proof.proofId}`,
      })

      return proof

    } catch (error) {
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : 'Invalid proof format',
        variant: "destructive"
      })
      return null
    }
  }, [cacheProofs, toast])

  return {
    // State
    proofs,
    requests,
    availableCircuits,
    generationState,
    verificationState,

    // Actions
    createPresentationRequest,
    generateProof,
    verifyProof,
    findSuitableCircuit,
    calculatePrivacyScore,
    clearProofs,
    clearRequests,
    getProofById,
    getRequestByNonce,
    exportProof,
    importProof,

    // Computed
    isGenerating: generationState.isGenerating,
    isVerifying: verificationState.isVerifying,
    hasProofs: proofs.length > 0,
    hasRequests: requests.length > 0
  }
}

export type UseSelectiveDisclosureReturn = ReturnType<typeof useSelectiveDisclosure>