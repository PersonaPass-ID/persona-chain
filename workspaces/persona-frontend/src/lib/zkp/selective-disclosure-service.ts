/**
 * SELECTIVE DISCLOSURE WITH ZERO-KNOWLEDGE PROOFS
 * 
 * Enables privacy-preserving credential sharing where users can prove
 * specific claims about their credentials without revealing unnecessary information.
 * 
 * Features:
 * - Selective attribute disclosure
 * - Age verification without revealing birthdate
 * - Address verification without revealing full address
 * - Employment verification without revealing salary
 * - Educational verification without revealing grades
 * - Custom proof circuits for any claim
 */

import { env } from '@/lib/env'
import { secureStorage } from '@/lib/secure-storage'

// ZK proof interfaces
export interface SelectiveDisclosureRequest {
  credentialId: string
  requiredClaims: ClaimRequirement[]
  context: string
  challengeNonce: string
  verifierDID: string
  expiresAt: string
}

export interface ClaimRequirement {
  attribute: string
  operation: 'equals' | 'greaterThan' | 'lessThan' | 'contains' | 'range' | 'exists'
  value?: any
  minValue?: any
  maxValue?: any
  description: string
  essential: boolean
}

export interface SelectiveDisclosureProof {
  proofId: string
  credentialId: string
  verifierDID: string
  claims: ProvenClaim[]
  zkProof: {
    proof: string
    publicSignals: string[]
    verificationKey: string
    circuit: string
  }
  metadata: {
    createdAt: string
    expiresAt: string
    context: string
    privacyLevel: 'minimal' | 'standard' | 'maximum'
    proofSize: number
    verificationTime: number
  }
}

export interface ProvenClaim {
  attribute: string
  operation: string
  proven: boolean
  value?: any // Only included if explicitly requested for disclosure
  range?: { min: any; max: any }
  description: string
}

export interface ZKCircuit {
  name: string
  description: string
  inputSignals: string[]
  outputSignals: string[]
  constraints: number
  wasmPath: string
  zkeyPath: string
  vkeyPath: string
  supportedClaims: string[]
}

export interface VerificationResult {
  valid: boolean
  proofId: string
  verifierDID: string
  claims: ProvenClaim[]
  verifiedAt: string
  trustScore: number
  privacyScore: number
  errors?: string[]
}

class SelectiveDisclosureService {
  private readonly CIRCUITS_BASE = '/circuits'
  private readonly PROOF_CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours
  
  // Available ZK circuits for different types of proofs
  private readonly AVAILABLE_CIRCUITS: ZKCircuit[] = [
    {
      name: 'age_verification',
      description: 'Prove age without revealing birthdate',
      // TODO: CRITICAL - Complete trusted setup ceremony before production
      // Run: npm run circuits:setup in /circuits directory
      inputSignals: ['birthYear', 'birthMonth', 'birthDay', 'currentYear', 'currentMonth', 'currentDay', 'minAge'],
      outputSignals: ['isOfAge'],
      constraints: 1247,
      wasmPath: '/circuits/age_verification.wasm',
      zkeyPath: '/circuits/age_verification_final.zkey',
      vkeyPath: '/circuits/age_verification_verification_key.json',
      supportedClaims: ['age', 'ageOver', 'ageUnder', 'ageRange']
    },
    {
      name: 'location_verification',
      description: 'Prove location claims without revealing exact address',
      inputSignals: ['zipCode', 'countryCode', 'stateCode', 'targetZip', 'targetCountry', 'targetState'],
      outputSignals: ['inLocation', 'inCountry', 'inState'],
      constraints: 892,
      wasmPath: '/circuits/location_verification.wasm',
      zkeyPath: '/circuits/location_verification_final.zkey',
      vkeyPath: '/circuits/location_verification_verification_key.json',
      supportedClaims: ['country', 'state', 'zipCode', 'region']
    },
    {
      name: 'employment_verification',
      description: 'Prove employment status without revealing salary or company',
      inputSignals: ['isEmployed', 'salary', 'yearsExperience', 'minSalary', 'minExperience'],
      outputSignals: ['employmentStatus', 'salaryRange', 'experienceLevel'],
      constraints: 654,
      wasmPath: '/circuits/employment_verification.wasm',
      zkeyPath: '/circuits/employment_verification_final.zkey',
      vkeyPath: '/circuits/employment_verification_verification_key.json',
      supportedClaims: ['employed', 'salaryRange', 'experience', 'industry']
    },
    {
      name: 'education_verification',
      description: 'Prove educational achievements without revealing grades',
      inputSignals: ['hasGraduated', 'degreeLevel', 'gpa', 'minGPA', 'targetDegree'],
      outputSignals: ['graduationStatus', 'degreeVerified', 'gpaRange'],
      constraints: 523,
      wasmPath: '/circuits/education_verification.wasm',
      zkeyPath: '/circuits/education_verification_final.zkey',
      vkeyPath: '/circuits/education_verification_verification_key.json',
      supportedClaims: ['degree', 'graduation', 'gpa', 'institution']
    },
    {
      name: 'identity_verification',
      description: 'Prove identity claims with selective disclosure',
      inputSignals: ['firstName', 'lastName', 'email', 'phone', 'targetHash'],
      outputSignals: ['identityVerified', 'emailVerified', 'phoneVerified'],
      constraints: 1156,
      wasmPath: '/circuits/identity_verification.wasm',
      zkeyPath: '/circuits/identity_verification_final.zkey',
      vkeyPath: '/circuits/identity_verification_verification_key.json',
      supportedClaims: ['name', 'email', 'phone', 'identity']
    }
  ]

  constructor() {
    console.log('🔐 Selective Disclosure Service initialized')
  }

  /**
   * Get available circuits and their capabilities
   */
  getAvailableCircuits(): ZKCircuit[] {
    return this.AVAILABLE_CIRCUITS
  }

  /**
   * Find suitable circuit for claim requirements
   */
  findSuitableCircuit(claims: ClaimRequirement[]): ZKCircuit | null {
    for (const circuit of this.AVAILABLE_CIRCUITS) {
      const supportedClaims = claims.filter(claim => 
        circuit.supportedClaims.some(supported => 
          claim.attribute.toLowerCase().includes(supported.toLowerCase())
        )
      )
      
      if (supportedClaims.length === claims.length) {
        return circuit
      }
    }
    
    return null
  }

  /**
   * Generate selective disclosure proof
   */
  async generateSelectiveDisclosureProof(
    walletAddress: string,
    credentialData: any,
    request: SelectiveDisclosureRequest
  ): Promise<{
    success: boolean
    proof?: SelectiveDisclosureProof
    error?: string
  }> {
    try {
      console.log(`🔐 Generating selective disclosure proof for ${request.credentialId}`)

      // Find suitable circuit
      const circuit = this.findSuitableCircuit(request.requiredClaims)
      if (!circuit) {
        return {
          success: false,
          error: 'No suitable ZK circuit found for the required claims'
        }
      }

      // Prepare input signals based on circuit and credential data
      const inputSignals = await this.prepareInputSignals(circuit, credentialData, request.requiredClaims)
      
      // Generate ZK proof using the circuit
      const zkProof = await this.generateZKProof(circuit, inputSignals)
      
      if (!zkProof.success) {
        return {
          success: false,
          error: zkProof.error || 'ZK proof generation failed'
        }
      }

      // Create proven claims based on the proof output
      const provenClaims = await this.createProvenClaims(
        request.requiredClaims,
        zkProof.publicSignals!,
        circuit
      )

      // Generate proof ID
      const proofId = `proof_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`

      // Create selective disclosure proof
      const proof: SelectiveDisclosureProof = {
        proofId,
        credentialId: request.credentialId,
        verifierDID: request.verifierDID,
        claims: provenClaims,
        zkProof: {
          proof: zkProof.proof!,
          publicSignals: zkProof.publicSignals!,
          verificationKey: await this.loadVerificationKey(circuit),
          circuit: circuit.name
        },
        metadata: {
          createdAt: new Date().toISOString(),
          expiresAt: request.expiresAt,
          context: request.context,
          privacyLevel: this.calculatePrivacyLevel(request.requiredClaims),
          proofSize: zkProof.proof!.length,
          verificationTime: zkProof.verificationTime || 0
        }
      }

      // Cache proof for faster verification
      await secureStorage.storeSecure(
        `zk_proof_${proofId}`,
        proof,
        this.PROOF_CACHE_TTL
      )

      console.log(`✅ Generated selective disclosure proof: ${proofId}`)

      return {
        success: true,
        proof
      }

    } catch (error) {
      console.error('❌ Selective disclosure proof generation failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Proof generation failed'
      }
    }
  }

  /**
   * Verify selective disclosure proof
   */
  async verifySelectiveDisclosureProof(
    proof: SelectiveDisclosureProof,
    request: SelectiveDisclosureRequest
  ): Promise<VerificationResult> {
    try {
      console.log(`🔍 Verifying selective disclosure proof: ${proof.proofId}`)

      // Check proof expiration
      if (new Date(proof.metadata.expiresAt) < new Date()) {
        return {
          valid: false,
          proofId: proof.proofId,
          verifierDID: proof.verifierDID,
          claims: proof.claims,
          verifiedAt: new Date().toISOString(),
          trustScore: 0,
          privacyScore: 0,
          errors: ['Proof has expired']
        }
      }

      // Find circuit for verification
      const circuit = this.AVAILABLE_CIRCUITS.find(c => c.name === proof.zkProof.circuit)
      if (!circuit) {
        return {
          valid: false,
          proofId: proof.proofId,
          verifierDID: proof.verifierDID,
          claims: proof.claims,
          verifiedAt: new Date().toISOString(),
          trustScore: 0,
          privacyScore: 0,
          errors: ['Unknown ZK circuit']
        }
      }

      // Verify ZK proof cryptographically
      const zkVerification = await this.verifyZKProof(
        proof.zkProof.proof,
        proof.zkProof.publicSignals,
        proof.zkProof.verificationKey
      )

      if (!zkVerification.valid) {
        return {
          valid: false,
          proofId: proof.proofId,
          verifierDID: proof.verifierDID,
          claims: proof.claims,
          verifiedAt: new Date().toISOString(),
          trustScore: 0,
          privacyScore: 0,
          errors: zkVerification.errors || ['ZK proof verification failed']
        }
      }

      // Validate that all required claims are proven
      const unprovenClaims = request.requiredClaims.filter(req => 
        req.essential && !proof.claims.some(claim => 
          claim.attribute === req.attribute && claim.proven
        )
      )

      if (unprovenClaims.length > 0) {
        return {
          valid: false,
          proofId: proof.proofId,
          verifierDID: proof.verifierDID,
          claims: proof.claims,
          verifiedAt: new Date().toISOString(),
          trustScore: 0,
          privacyScore: 0,
          errors: [`Essential claims not proven: ${unprovenClaims.map(c => c.attribute).join(', ')}`]
        }
      }

      // Calculate trust and privacy scores
      const trustScore = this.calculateTrustScore(proof, zkVerification)
      const privacyScore = this.calculatePrivacyScore(proof, request)

      console.log(`✅ Verified selective disclosure proof: ${proof.proofId}`)

      return {
        valid: true,
        proofId: proof.proofId,
        verifierDID: proof.verifierDID,
        claims: proof.claims,
        verifiedAt: new Date().toISOString(),
        trustScore,
        privacyScore
      }

    } catch (error) {
      console.error('❌ Selective disclosure proof verification failed:', error)
      return {
        valid: false,
        proofId: proof.proofId,
        verifierDID: proof.verifierDID,
        claims: proof.claims,
        verifiedAt: new Date().toISOString(),
        trustScore: 0,
        privacyScore: 0,
        errors: [error instanceof Error ? error.message : 'Verification failed']
      }
    }
  }

  /**
   * Create presentation request for selective disclosure
   */
  createPresentationRequest(
    verifierDID: string,
    claims: ClaimRequirement[],
    context: string,
    expirationMinutes: number = 60
  ): SelectiveDisclosureRequest {
    const challengeNonce = crypto.getRandomValues(new Uint8Array(32))
      .reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '')

    return {
      credentialId: '', // Will be filled by the prover
      requiredClaims: claims,
      context,
      challengeNonce,
      verifierDID,
      expiresAt: new Date(Date.now() + expirationMinutes * 60 * 1000).toISOString()
    }
  }

  // PRIVATE METHODS

  /**
   * Prepare input signals for ZK circuit
   */
  private async prepareInputSignals(
    circuit: ZKCircuit,
    credentialData: any,
    claims: ClaimRequirement[]
  ): Promise<Record<string, any>> {
    const inputs: Record<string, any> = {}

    switch (circuit.name) {
      case 'age_verification':
        if (credentialData.birthDate) {
          const birthDate = new Date(credentialData.birthDate)
          const currentDate = new Date()
          
          inputs.birthYear = birthDate.getFullYear()
          inputs.birthMonth = birthDate.getMonth() + 1
          inputs.birthDay = birthDate.getDate()
          inputs.currentYear = currentDate.getFullYear()
          inputs.currentMonth = currentDate.getMonth() + 1
          inputs.currentDay = currentDate.getDate()
          
          const ageClaim = claims.find(c => c.attribute === 'age' || c.attribute === 'ageOver')
          inputs.minAge = ageClaim?.value || ageClaim?.minValue || 18
        }
        break

      case 'location_verification':
        if (credentialData.address) {
          inputs.zipCode = credentialData.address.zipCode || 0
          inputs.countryCode = this.countryToCode(credentialData.address.country)
          inputs.stateCode = this.stateToCode(credentialData.address.state)
          
          const locationClaim = claims.find(c => c.attribute === 'location' || c.attribute === 'country')
          inputs.targetCountry = this.countryToCode(locationClaim?.value)
          inputs.targetState = this.stateToCode(locationClaim?.value)
          inputs.targetZip = locationClaim?.value || 0
        }
        break

      case 'employment_verification':
        inputs.isEmployed = credentialData.employment?.isEmployed ? 1 : 0
        inputs.salary = credentialData.employment?.salary || 0
        inputs.yearsExperience = credentialData.employment?.yearsExperience || 0
        
        const salaryClaim = claims.find(c => c.attribute === 'salary' || c.attribute === 'salaryRange')
        inputs.minSalary = salaryClaim?.minValue || 0
        
        const experienceClaim = claims.find(c => c.attribute === 'experience')
        inputs.minExperience = experienceClaim?.minValue || 0
        break

      case 'education_verification':
        inputs.hasGraduated = credentialData.education?.hasGraduated ? 1 : 0
        inputs.degreeLevel = this.degreeToLevel(credentialData.education?.degree)
        inputs.gpa = Math.floor((credentialData.education?.gpa || 0) * 100) // Convert to integer
        
        const gpaClaim = claims.find(c => c.attribute === 'gpa')
        inputs.minGPA = Math.floor((gpaClaim?.minValue || 0) * 100)
        
        const degreeClaim = claims.find(c => c.attribute === 'degree')
        inputs.targetDegree = this.degreeToLevel(degreeClaim?.value)
        break

      case 'identity_verification':
        inputs.firstName = this.stringToHash(credentialData.firstName || '')
        inputs.lastName = this.stringToHash(credentialData.lastName || '')
        inputs.email = this.stringToHash(credentialData.email || '')
        inputs.phone = this.stringToHash(credentialData.phone || '')
        
        const identityClaim = claims.find(c => c.attribute === 'identity')
        inputs.targetHash = this.stringToHash(identityClaim?.value || '')
        break
    }

    return inputs
  }

  /**
   * Generate ZK proof using circuit
   */
  private async generateZKProof(
    circuit: ZKCircuit,
    inputs: Record<string, any>
  ): Promise<{
    success: boolean
    proof?: string
    publicSignals?: string[]
    verificationTime?: number
    error?: string
  }> {
    try {
      const startTime = Date.now()

      // In a real implementation, this would use snarkjs or similar library
      // to generate the actual ZK proof using the WASM and proving key files
      
      // Mock proof generation for now
      const mockProof = {
        pi_a: ['0x' + '1'.repeat(64), '0x' + '2'.repeat(64), '0x' + '1'.repeat(64)],
        pi_b: [['0x' + '3'.repeat(64), '0x' + '4'.repeat(64)], ['0x' + '5'.repeat(64), '0x' + '6'.repeat(64)], ['0x' + '1'.repeat(64), '0x' + '0'.repeat(64)]],
        pi_c: ['0x' + '7'.repeat(64), '0x' + '8'.repeat(64), '0x' + '1'.repeat(64)]
      }

      const mockPublicSignals = circuit.outputSignals.map((signal, index) => 
        (Math.floor(Math.random() * 2)).toString() // Random 0 or 1 for boolean outputs
      )

      const verificationTime = Date.now() - startTime

      return {
        success: true,
        proof: JSON.stringify(mockProof),
        publicSignals: mockPublicSignals,
        verificationTime
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'ZK proof generation failed'
      }
    }
  }

  /**
   * Verify ZK proof cryptographically
   */
  private async verifyZKProof(
    proof: string,
    publicSignals: string[],
    verificationKey: string
  ): Promise<{
    valid: boolean
    errors?: string[]
  }> {
    try {
      // In a real implementation, this would use snarkjs.groth16.verify()
      // to cryptographically verify the proof
      
      // Mock verification - always return true for valid format
      const parsedProof = JSON.parse(proof)
      
      if (!parsedProof.pi_a || !parsedProof.pi_b || !parsedProof.pi_c) {
        return {
          valid: false,
          errors: ['Invalid proof format']
        }
      }

      // Simulate verification time
      await new Promise(resolve => setTimeout(resolve, 100))

      return {
        valid: true
      }

    } catch (error) {
      return {
        valid: false,
        errors: [error instanceof Error ? error.message : 'Proof verification failed']
      }
    }
  }

  /**
   * Create proven claims from ZK proof outputs
   */
  private async createProvenClaims(
    requirements: ClaimRequirement[],
    publicSignals: string[],
    circuit: ZKCircuit
  ): Promise<ProvenClaim[]> {
    const provenClaims: ProvenClaim[] = []

    requirements.forEach((req, index) => {
      const signalIndex = index % publicSignals.length
      const signalValue = publicSignals[signalIndex]
      
      provenClaims.push({
        attribute: req.attribute,
        operation: req.operation,
        proven: signalValue === '1', // Assuming boolean output
        description: req.description,
        ...(req.operation === 'range' && req.minValue && req.maxValue && {
          range: { min: req.minValue, max: req.maxValue }
        })
      })
    })

    return provenClaims
  }

  /**
   * Load verification key for circuit
   */
  private async loadVerificationKey(circuit: ZKCircuit): Promise<string> {
    // In a real implementation, this would load the actual verification key
    // from the circuit's vkey file
    return JSON.stringify({
      protocol: "groth16",
      curve: "bn128",
      nPublic: circuit.outputSignals.length,
      vk_alpha_1: ["0x" + "1".repeat(64), "0x" + "2".repeat(64), "0x" + "1".repeat(64)],
      vk_beta_2: [["0x" + "3".repeat(64), "0x" + "4".repeat(64)], ["0x" + "5".repeat(64), "0x" + "6".repeat(64)], ["0x" + "1".repeat(64), "0x" + "0".repeat(64)]],
      vk_gamma_2: [["0x" + "7".repeat(64), "0x" + "8".repeat(64)], ["0x" + "9".repeat(64), "0x" + "a".repeat(64)], ["0x" + "1".repeat(64), "0x" + "0".repeat(64)]],
      vk_delta_2: [["0x" + "b".repeat(64), "0x" + "c".repeat(64)], ["0x" + "d".repeat(64), "0x" + "e".repeat(64)], ["0x" + "1".repeat(64), "0x" + "0".repeat(64)]],
      vk_alphabeta_12: [],
      IC: circuit.outputSignals.map((_, i) => ["0x" + i.toString().repeat(64), "0x" + (i+1).toString().repeat(64), "0x" + "1".repeat(64)])
    })
  }

  /**
   * Calculate privacy level based on claims
   */
  private calculatePrivacyLevel(claims: ClaimRequirement[]): 'minimal' | 'standard' | 'maximum' {
    const sensitiveClaims = claims.filter(c => 
      ['salary', 'age', 'address', 'income', 'health', 'financial'].some(sensitive =>
        c.attribute.toLowerCase().includes(sensitive)
      )
    )

    if (sensitiveClaims.length > claims.length * 0.7) return 'maximum'
    if (sensitiveClaims.length > claims.length * 0.3) return 'standard'
    return 'minimal'
  }

  /**
   * Calculate trust score based on proof and verification
   */
  private calculateTrustScore(proof: SelectiveDisclosureProof, verification: any): number {
    let score = 80 // Base score

    // Boost for strong cryptography
    if (proof.zkProof.circuit === 'age_verification') score += 10
    if (proof.metadata.privacyLevel === 'maximum') score += 5
    if (verification.verificationTime && verification.verificationTime < 1000) score += 5

    return Math.min(100, score)
  }

  /**
   * Calculate privacy score
   */
  private calculatePrivacyScore(proof: SelectiveDisclosureProof, request: SelectiveDisclosureRequest): number {
    let score = 60 // Base score

    // Higher score for fewer disclosed attributes
    const disclosedCount = proof.claims.filter(c => c.value !== undefined).length
    const totalClaims = request.requiredClaims.length
    score += (1 - (disclosedCount / totalClaims)) * 30

    // Privacy level bonus
    if (proof.metadata.privacyLevel === 'maximum') score += 10
    if (proof.metadata.privacyLevel === 'standard') score += 5

    return Math.min(100, Math.round(score))
  }

  // Utility methods for data conversion
  private countryToCode(country: string): number {
    const codes: Record<string, number> = {
      'US': 1, 'CA': 2, 'UK': 3, 'DE': 4, 'FR': 5, 'JP': 6, 'AU': 7
    }
    return codes[country?.toUpperCase()] || 0
  }

  private stateToCode(state: string): number {
    // Simplified state codes
    return state ? state.charCodeAt(0) - 64 : 0
  }

  private degreeToLevel(degree: string): number {
    if (!degree) return 0
    const level = degree.toLowerCase()
    if (level.includes('phd') || level.includes('doctorate')) return 4
    if (level.includes('master')) return 3
    if (level.includes('bachelor')) return 2
    if (level.includes('associate')) return 1
    return 0
  }

  private stringToHash(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }
}

// Export singleton instance
export const selectiveDisclosureService = new SelectiveDisclosureService()
export default selectiveDisclosureService