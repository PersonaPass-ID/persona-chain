// Zero-Knowledge Proofs for PersonaPass
// Privacy-preserving credential verification

import { IdentityEncryption, WalletSignatureGenerator } from './encryption'
import { identityStorage, VerifiableCredential, StorageResult } from './storage/identity-storage'
import { blockchainAnchor } from './storage/blockchain-anchor'

export interface ZKProofRequest {
  credentialId: string
  requestedAttributes: string[]
  proofPurpose: string
  verifierDid?: string
  challenge?: string
  minimumAge?: number
  requiredCredentialTypes?: string[]
}

export interface ZKProof {
  id: string
  proofType: 'selective-disclosure' | 'membership' | 'range' | 'existence'
  circuitName: string
  proofData: {
    proof: string
    publicSignals: any[]
    verificationKey: string
  }
  nullifierHash?: string
  commitmentHash: string
  requestedAttributes: string[]
  revealedAttributes: { [key: string]: any }
  hiddenAttributes: string[]
  proofPurpose: string
  verifierDid?: string
  challenge: string
  expirationTime: string
  metadata: {
    credentialType: string
    issuerDid: string
    subjectDid: string
    schemaId: string
    proofGenerated: string
  }
}

export interface ZKVerificationRequest {
  proof: ZKProof
  expectedChallenge?: string
  requiredAttributes?: string[]
  verifierDid: string
}

export interface ZKVerificationResult {
  success: boolean
  isValid: boolean
  verifiedAttributes: { [key: string]: any }
  proofMetadata: {
    verificationTime: string
    verifierDid: string
    nullifierUsed: boolean
    expirationStatus: 'valid' | 'expired' | 'not-yet-valid'
  }
  error?: string
  warnings?: string[]
}

/**
 * Zero-Knowledge Proof Service
 * Generates and verifies privacy-preserving credential proofs
 */
export class ZKProofService {
  private static readonly PROOF_VERSION = '1.0'
  private static readonly DEFAULT_EXPIRATION_HOURS = 24

  /**
   * Generate a ZK proof for selective attribute disclosure
   */
  static async generateSelectiveDisclosureProof(
    request: ZKProofRequest,
    walletAddress: string,
    walletType: string
  ): Promise<StorageResult<ZKProof>> {
    try {
      console.log(`🔐 Generating ZK proof for credential: ${request.credentialId}`)

      // Get the credential from encrypted storage
      const credentialResult = await this.getCredentialForProof(
        request.credentialId,
        walletAddress,
        walletType
      )

      if (!credentialResult.success || !credentialResult.credential) {
        return {
          success: false,
          error: credentialResult.error || 'Credential not found'
        }
      }

      const credential = credentialResult.credential

      // Validate requested attributes exist in credential
      const availableAttributes = this.extractCredentialAttributes(credential)
      const invalidAttributes = request.requestedAttributes.filter(
        attr => !(attr in availableAttributes)
      )

      if (invalidAttributes.length > 0) {
        return {
          success: false,
          error: `Attributes not found in credential: ${invalidAttributes.join(', ')}`
        }
      }

      // Generate proof data (simplified implementation)
      const proofData = await this.generateProofData(
        credential,
        request.requestedAttributes,
        request.challenge || this.generateChallenge()
      )

      // Create revealed vs hidden attributes
      const revealedAttributes: { [key: string]: any } = {}
      const hiddenAttributes: string[] = []

      Object.keys(availableAttributes).forEach(attr => {
        if (request.requestedAttributes.includes(attr)) {
          revealedAttributes[attr] = availableAttributes[attr]
        } else {
          hiddenAttributes.push(attr)
        }
      })

      // Generate nullifier hash for preventing double-spending
      const nullifierHash = await this.generateNullifierHash(
        credential.id,
        request.verifierDid || '',
        request.challenge || ''
      )

      // Create commitment hash
      const commitmentData = {
        credentialId: credential.id,
        subjectDid: credential.credentialSubject.id,
        attributes: availableAttributes,
        nullifier: nullifierHash
      }
      const commitmentHash = await IdentityEncryption.generateContentHash(commitmentData)

      const proof: ZKProof = {
        id: `proof:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`,
        proofType: 'selective-disclosure',
        circuitName: 'selective_disclosure_v1',
        proofData,
        nullifierHash,
        commitmentHash,
        requestedAttributes: request.requestedAttributes,
        revealedAttributes,
        hiddenAttributes,
        proofPurpose: request.proofPurpose,
        verifierDid: request.verifierDid,
        challenge: request.challenge || this.generateChallenge(),
        expirationTime: new Date(
          Date.now() + (this.DEFAULT_EXPIRATION_HOURS * 60 * 60 * 1000)
        ).toISOString(),
        metadata: {
          credentialType: Array.isArray(credential.type) ? credential.type.join(',') : credential.type,
          issuerDid: typeof credential.issuer === 'string' ? credential.issuer : credential.issuer.id,
          subjectDid: credential.credentialSubject.id,
          schemaId: 'https://personapass.org/schemas/identity/v1',
          proofGenerated: new Date().toISOString()
        }
      }

      // Store encrypted proof in blockchain anchor
      const anchorResult = await this.anchorProofOnChain(proof, walletAddress)

      console.log(`✅ ZK proof generated successfully: ${proof.id}`)
      return {
        success: true,
        data: proof,
        contentHash: commitmentHash,
        blockchainAnchor: {
          txHash: anchorResult.txHash,
          network: 'personachain-1'
        }
      }

    } catch (error) {
      console.error('❌ ZK proof generation failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Proof generation failed'
      }
    }
  }

  /**
   * Verify a ZK proof
   */
  static async verifyProof(request: ZKVerificationRequest): Promise<ZKVerificationResult> {
    try {
      console.log(`🔍 Verifying ZK proof: ${request.proof.id}`)

      const proof = request.proof
      const now = new Date()
      const expirationTime = new Date(proof.expirationTime)

      // Check expiration
      let expirationStatus: 'valid' | 'expired' | 'not-yet-valid' = 'valid'
      if (now > expirationTime) {
        expirationStatus = 'expired'
      }

      // Validate challenge if provided
      if (request.expectedChallenge && request.expectedChallenge !== proof.challenge) {
        return {
          success: true,
          isValid: false,
          verifiedAttributes: {},
          proofMetadata: {
            verificationTime: now.toISOString(),
            verifierDid: request.verifierDid,
            nullifierUsed: false,
            expirationStatus
          },
          error: 'Challenge mismatch'
        }
      }

      // Check nullifier hash hasn't been used before
      const nullifierUsed = await this.checkNullifierUsage(
        proof.nullifierHash,
        request.verifierDid
      )

      // Verify proof cryptographically (simplified)
      const cryptographicVerification = await this.verifyCryptographicProof(proof)

      const isValid = cryptographicVerification && 
                     expirationStatus === 'valid' && 
                     !nullifierUsed

      // Mark nullifier as used if verification successful
      if (isValid && proof.nullifierHash) {
        await this.markNullifierUsed(proof.nullifierHash, request.verifierDid)
      }

      const warnings: string[] = []
      if (expirationStatus === 'expired') {
        warnings.push('Proof has expired')
      }
      if (nullifierUsed) {
        warnings.push('Proof has already been used (replay attack detected)')
      }

      console.log(`✅ ZK proof verification complete: ${isValid ? 'VALID' : 'INVALID'}`)
      return {
        success: true,
        isValid,
        verifiedAttributes: proof.revealedAttributes,
        proofMetadata: {
          verificationTime: now.toISOString(),
          verifierDid: request.verifierDid,
          nullifierUsed,
          expirationStatus
        },
        warnings: warnings.length > 0 ? warnings : undefined
      }

    } catch (error) {
      console.error('❌ ZK proof verification failed:', error)
      return {
        success: false,
        isValid: false,
        verifiedAttributes: {},
        proofMetadata: {
          verificationTime: new Date().toISOString(),
          verifierDid: request.verifierDid,
          nullifierUsed: false,
          expirationStatus: 'valid'
        },
        error: error instanceof Error ? error.message : 'Verification failed'
      }
    }
  }

  /**
   * Generate membership proof (proves user belongs to a group without revealing identity)
   */
  static async generateMembershipProof(
    groupCredentialId: string,
    groupId: string,
    walletAddress: string,
    walletType: string,
    challenge?: string
  ): Promise<StorageResult<ZKProof>> {
    try {
      console.log(`🔐 Generating membership proof for group: ${groupId}`)

      const credentialResult = await this.getCredentialForProof(
        groupCredentialId,
        walletAddress,
        walletType
      )

      if (!credentialResult.success || !credentialResult.credential) {
        return {
          success: false,
          error: 'Group credential not found'
        }
      }

      const credential = credentialResult.credential

      // Generate membership proof data
      const proofData = await this.generateMembershipProofData(
        credential,
        groupId,
        challenge || this.generateChallenge()
      )

      const nullifierHash = await this.generateNullifierHash(
        credential.id,
        groupId,
        challenge || ''
      )

      const commitmentHash = await IdentityEncryption.generateContentHash({
        credentialId: credential.id,
        groupId,
        membershipProof: true,
        timestamp: Date.now()
      })

      const proof: ZKProof = {
        id: `membership:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`,
        proofType: 'membership',
        circuitName: 'group_membership_v1',
        proofData,
        nullifierHash,
        commitmentHash,
        requestedAttributes: ['membership'],
        revealedAttributes: { 
          isMember: true,
          groupId: groupId
        },
        hiddenAttributes: ['identity', 'memberDetails'],
        proofPurpose: 'group-membership-verification',
        challenge: challenge || this.generateChallenge(),
        expirationTime: new Date(
          Date.now() + (this.DEFAULT_EXPIRATION_HOURS * 60 * 60 * 1000)
        ).toISOString(),
        metadata: {
          credentialType: 'GroupMembership',
          issuerDid: typeof credential.issuer === 'string' ? credential.issuer : credential.issuer.id,
          subjectDid: credential.credentialSubject.id,
          schemaId: 'https://personapass.org/schemas/membership/v1',
          proofGenerated: new Date().toISOString()
        }
      }

      console.log(`✅ Membership proof generated: ${proof.id}`)
      return {
        success: true,
        data: proof,
        contentHash: commitmentHash
      }

    } catch (error) {
      console.error('❌ Membership proof generation failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Membership proof failed'
      }
    }
  }

  /**
   * Generate range proof (proves a value is within a range without revealing the value)
   */
  static async generateRangeProof(
    credentialId: string,
    attribute: string,
    minValue: number,
    maxValue: number,
    walletAddress: string,
    walletType: string
  ): Promise<StorageResult<ZKProof>> {
    try {
      console.log(`🔐 Generating range proof for ${attribute}: ${minValue}-${maxValue}`)

      const credentialResult = await this.getCredentialForProof(
        credentialId,
        walletAddress,
        walletType
      )

      if (!credentialResult.success || !credentialResult.credential) {
        return {
          success: false,
          error: 'Credential not found'
        }
      }

      const credential = credentialResult.credential
      const attributes = this.extractCredentialAttributes(credential)
      
      if (!(attribute in attributes)) {
        return {
          success: false,
          error: `Attribute '${attribute}' not found in credential`
        }
      }

      const actualValue = attributes[attribute]
      const isInRange = actualValue >= minValue && actualValue <= maxValue

      if (!isInRange) {
        return {
          success: false,
          error: `Attribute value not in specified range`
        }
      }

      const proofData = await this.generateRangeProofData(
        actualValue,
        minValue,
        maxValue,
        this.generateChallenge()
      )

      const proof: ZKProof = {
        id: `range:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`,
        proofType: 'range',
        circuitName: 'range_proof_v1',
        proofData,
        commitmentHash: await IdentityEncryption.generateContentHash({
          attribute,
          range: [minValue, maxValue],
          credentialId,
          timestamp: Date.now()
        }),
        requestedAttributes: [attribute],
        revealedAttributes: {
          attributeName: attribute,
          isInRange: true,
          minValue,
          maxValue
        },
        hiddenAttributes: [attribute + '_actual_value'],
        proofPurpose: 'range-verification',
        challenge: this.generateChallenge(),
        expirationTime: new Date(
          Date.now() + (this.DEFAULT_EXPIRATION_HOURS * 60 * 60 * 1000)
        ).toISOString(),
        metadata: {
          credentialType: 'RangeProof',
          issuerDid: typeof credential.issuer === 'string' ? credential.issuer : credential.issuer.id,
          subjectDid: credential.credentialSubject.id,
          schemaId: 'https://personapass.org/schemas/range/v1',
          proofGenerated: new Date().toISOString()
        }
      }

      console.log(`✅ Range proof generated: ${proof.id}`)
      return {
        success: true,
        data: proof,
        contentHash: proof.commitmentHash
      }

    } catch (error) {
      console.error('❌ Range proof generation failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Range proof failed'
      }
    }
  }

  // Private utility methods

  private static async getCredentialForProof(
    credentialId: string,
    walletAddress: string,
    walletType: string
  ): Promise<{ success: boolean; credential?: VerifiableCredential; error?: string }> {
    try {
      // First get the DID for the wallet
      const did = await identityStorage.getDIDByWallet(walletAddress)
      if (!did) {
        return { success: false, error: 'DID not found for wallet' }
      }

      // Get all credentials for the DID
      const credentialsResult = await identityStorage.getVerifiableCredentials(
        did,
        walletAddress,
        walletType
      )

      if (!credentialsResult.success || !credentialsResult.data) {
        return { success: false, error: 'No credentials found' }
      }

      // Find the specific credential
      const credential = credentialsResult.data.find(cred => cred.id === credentialId)
      
      if (!credential) {
        return { success: false, error: 'Credential not found' }
      }

      return { success: true, credential }

    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Credential lookup failed'
      }
    }
  }

  private static extractCredentialAttributes(credential: VerifiableCredential): { [key: string]: any } {
    const attributes: { [key: string]: any } = {}
    
    // Extract from credentialSubject
    Object.keys(credential.credentialSubject).forEach(key => {
      if (key !== 'id') { // Skip the DID
        attributes[key] = credential.credentialSubject[key]
      }
    })

    return attributes
  }

  private static async generateProofData(
    credential: VerifiableCredential,
    requestedAttributes: string[],
    challenge: string
  ): Promise<{ proof: string; publicSignals: any[]; verificationKey: string }> {
    // Simplified proof generation (in production, use actual ZK circuits)
    const proofContent = {
      credential: credential.id,
      attributes: requestedAttributes,
      challenge,
      timestamp: Date.now()
    }

    const proof = await IdentityEncryption.generateContentHash(proofContent)
    
    return {
      proof,
      publicSignals: [challenge, requestedAttributes.length],
      verificationKey: 'vk_' + proof.slice(0, 16)
    }
  }

  private static async generateMembershipProofData(
    credential: VerifiableCredential,
    groupId: string,
    challenge: string
  ): Promise<{ proof: string; publicSignals: any[]; verificationKey: string }> {
    const proofContent = {
      credentialId: credential.id,
      groupId,
      challenge,
      membershipType: 'group',
      timestamp: Date.now()
    }

    const proof = await IdentityEncryption.generateContentHash(proofContent)
    
    return {
      proof,
      publicSignals: [challenge, groupId],
      verificationKey: 'vk_membership_' + proof.slice(0, 12)
    }
  }

  private static async generateRangeProofData(
    value: number,
    minValue: number,
    maxValue: number,
    challenge: string
  ): Promise<{ proof: string; publicSignals: any[]; verificationKey: string }> {
    const proofContent = {
      valueInRange: true,
      range: [minValue, maxValue],
      challenge,
      timestamp: Date.now()
    }

    const proof = await IdentityEncryption.generateContentHash(proofContent)
    
    return {
      proof,
      publicSignals: [challenge, minValue, maxValue, 1], // 1 indicates in range
      verificationKey: 'vk_range_' + proof.slice(0, 12)
    }
  }

  private static async generateNullifierHash(
    credentialId: string,
    verifier: string,
    challenge: string
  ): Promise<string> {
    const nullifierData = {
      credentialId,
      verifier,
      challenge,
      purpose: 'nullifier'
    }
    return await IdentityEncryption.generateContentHash(nullifierData)
  }

  private static generateChallenge(): string {
    return Math.random().toString(36) + Date.now().toString(36)
  }

  private static async verifyCryptographicProof(proof: ZKProof): Promise<boolean> {
    // Simplified verification (in production, use actual ZK verification)
    try {
      const expectedProofStructure = proof.proofData.proof && 
                                   proof.proofData.publicSignals && 
                                   proof.proofData.verificationKey
      return expectedProofStructure && proof.proofData.proof.length > 0
    } catch {
      return false
    }
  }

  private static async checkNullifierUsage(
    nullifierHash?: string,
    verifierDid?: string
  ): Promise<boolean> {
    if (!nullifierHash) return false
    
    // In production, check against database of used nullifiers
    // For now, simulate check
    const usedNullifiers = new Set<string>()
    return usedNullifiers.has(nullifierHash + verifierDid)
  }

  private static async markNullifierUsed(
    nullifierHash: string,
    verifierDid: string
  ): Promise<void> {
    // In production, store in database to prevent replay attacks
    console.log(`🔒 Nullifier marked as used: ${nullifierHash.slice(0, 8)}... for ${verifierDid}`)
  }

  private static async anchorProofOnChain(
    proof: ZKProof,
    walletAddress: string
  ): Promise<{ success: boolean; txHash?: string }> {
    try {
      // Anchor proof commitment on PersonaChain
      const anchorResult = await blockchainAnchor.anchorCredentialIssuance(
        proof.id,
        proof.metadata.issuerDid,
        proof.metadata.subjectDid,
        proof.commitmentHash
      )

      return {
        success: true,
        txHash: anchorResult.txHash
      }
    } catch (error) {
      console.warn('⚠️ Proof anchoring failed, continuing without blockchain anchor:', error)
      return { success: false }
    }
  }

  /**
   * Batch verify multiple proofs efficiently
   */
  static async batchVerifyProofs(
    requests: ZKVerificationRequest[]
  ): Promise<ZKVerificationResult[]> {
    console.log(`🔍 Batch verifying ${requests.length} ZK proofs`)
    
    // Process verifications in parallel for efficiency
    const verificationPromises = requests.map(request => this.verifyProof(request))
    
    try {
      const results = await Promise.all(verificationPromises)
      const validCount = results.filter(r => r.isValid).length
      
      console.log(`✅ Batch verification complete: ${validCount}/${requests.length} valid`)
      return results
    } catch (error) {
      console.error('❌ Batch verification failed:', error)
      // Return error results for all requests
      return requests.map(request => ({
        success: false,
        isValid: false,
        verifiedAttributes: {},
        proofMetadata: {
          verificationTime: new Date().toISOString(),
          verifierDid: request.verifierDid,
          nullifierUsed: false,
          expirationStatus: 'valid' as const
        },
        error: 'Batch verification failed'
      }))
    }
  }
}

// Export for convenience
export const zkProofs = ZKProofService