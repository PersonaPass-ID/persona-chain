// Test ZK Proof Service using Mock Storage
// Bypasses actual proof generation for testing

import { testIdentityStorage } from './storage/test-identity-storage'
import { ZKProofRequest, ZKProof, ZKVerificationRequest, ZKVerificationResult } from './zk-proofs'
import { StorageResult } from './storage/test-identity-storage'

/**
 * Test ZK Proof Service with Mock Storage
 */
export class TestZKProofService {
  private static readonly PROOF_VERSION = '1.0'
  private static readonly DEFAULT_EXPIRATION_HOURS = 24

  /**
   * Generate a mock ZK proof for selective attribute disclosure
   */
  static async generateSelectiveDisclosureProof(
    request: ZKProofRequest,
    walletAddress: string,
    walletType: string
  ): Promise<StorageResult<ZKProof>> {
    try {
      console.log(`🔐 Test ZK: Generating mock proof for credential: ${request.credentialId}`)

      // Get the credential from test storage
      const credentialResult = await this.getCredentialForProof(
        request.credentialId,
        walletAddress,
        walletType
      )

      if (!credentialResult.success || !credentialResult.credential) {
        return {
          success: false,
          error: credentialResult.error || 'Credential not found in test storage'
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
          error: `Requested attributes not found in credential: ${invalidAttributes.join(', ')}`
        }
      }

      // Create revealed attributes (only requested ones)
      const revealedAttributes: { [key: string]: any } = {}
      for (const attr of request.requestedAttributes) {
        revealedAttributes[attr] = availableAttributes[attr]
      }

      // Generate mock ZK proof
      const proofId = `zk_proof_${Date.now()}_${Math.random().toString(36).slice(2)}`
      const challenge = request.challenge || this.generateChallenge()

      const zkProof: ZKProof = {
        id: proofId,
        proofType: 'selective-disclosure',
        circuitName: 'selective_disclosure_test',
        proofData: {
          proof: 'mock_proof_' + Date.now(),
          publicSignals: request.requestedAttributes.map(attr => revealedAttributes[attr]),
          verificationKey: 'mock_verification_key_' + Date.now()
        },
        commitmentHash: 'mock_commitment_hash_' + Date.now(),
        requestedAttributes: request.requestedAttributes,
        revealedAttributes,
        hiddenAttributes: Object.keys(availableAttributes).filter(
          attr => !request.requestedAttributes.includes(attr)
        ),
        proofPurpose: request.proofPurpose,
        verifierDid: request.verifierDid,
        challenge,
        expirationTime: new Date(Date.now() + this.DEFAULT_EXPIRATION_HOURS * 60 * 60 * 1000).toISOString(),
        metadata: {
          credentialType: credential.type.join(','),
          issuerDid: typeof credential.issuer === 'string' ? credential.issuer : credential.issuer.id,
          subjectDid: credential.credentialSubject.id,
          schemaId: 'test_schema_v1.0',
          proofGenerated: new Date().toISOString()
        }
      }

      // Store proof (in a real implementation, this would be encrypted and stored)
      console.log(`✅ Test ZK: Generated mock proof ${proofId} with ${request.requestedAttributes.length} revealed attributes`)

      return {
        success: true,
        data: zkProof,
        contentHash: 'mock_proof_hash_' + Date.now(),
        message: 'Mock ZK proof generated successfully'
      }

    } catch (error) {
      console.error('❌ Test ZK proof generation failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Proof generation failed'
      }
    }
  }

  /**
   * Verify a mock ZK proof
   */
  static async verifyProof(request: ZKVerificationRequest): Promise<ZKVerificationResult> {
    try {
      console.log(`🔍 Test ZK: Verifying mock proof ${request.proof.id}`)

      const proof = request.proof

      // Basic validation
      if (!proof.id || !proof.proofData || !proof.commitmentHash) {
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
          error: 'Invalid proof structure'
        }
      }

      // Check expiration
      const now = new Date()
      const expiration = new Date(proof.expirationTime)
      const expirationStatus = expiration < now ? 'expired' : 
                              expiration > new Date(now.getTime() + 24 * 60 * 60 * 1000) ? 'not-yet-valid' : 
                              'valid'

      // Check challenge if provided
      if (request.expectedChallenge && request.expectedChallenge !== proof.challenge) {
        return {
          success: true,
          isValid: false,
          verifiedAttributes: {},
          proofMetadata: {
            verificationTime: new Date().toISOString(),
            verifierDid: request.verifierDid,
            nullifierUsed: false,
            expirationStatus
          },
          error: 'Challenge mismatch'
        }
      }

      // Mock verification always passes for test proofs
      const isValid = expirationStatus === 'valid'

      console.log(`${isValid ? '✅' : '❌'} Test ZK: Proof verification ${isValid ? 'passed' : 'failed'}`)

      return {
        success: true,
        isValid,
        verifiedAttributes: proof.revealedAttributes,
        proofMetadata: {
          verificationTime: new Date().toISOString(),
          verifierDid: request.verifierDid,
          nullifierUsed: false,
          expirationStatus
        },
        warnings: expirationStatus !== 'valid' ? [`Proof is ${expirationStatus}`] : undefined
      }

    } catch (error) {
      console.error('❌ Test ZK proof verification failed:', error)
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
   * Generate mock membership proof
   */
  static async generateMembershipProof(
    credentialId: string,
    groupId: string,
    walletAddress: string,
    walletType: string,
    challenge?: string
  ): Promise<StorageResult<ZKProof>> {
    // For testing, generate a simple membership proof
    const mockProof: ZKProof = {
      id: `membership_proof_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      proofType: 'membership',
      circuitName: 'membership_test',
      proofData: {
        proof: 'mock_membership_proof_' + Date.now(),
        publicSignals: [groupId],
        verificationKey: 'mock_membership_key_' + Date.now()
      },
      commitmentHash: 'mock_membership_commitment_' + Date.now(),
      requestedAttributes: ['membership'],
      revealedAttributes: { groupId },
      hiddenAttributes: ['membershipDetails'],
      proofPurpose: 'group-membership-verification',
      challenge: challenge || this.generateChallenge(),
      expirationTime: new Date(Date.now() + this.DEFAULT_EXPIRATION_HOURS * 60 * 60 * 1000).toISOString(),
      metadata: {
        credentialType: 'GroupMembershipCredential',
        issuerDid: 'did:persona:group-issuer',
        subjectDid: 'test-subject-did',
        schemaId: 'membership_schema_v1.0',
        proofGenerated: new Date().toISOString()
      }
    }

    return {
      success: true,
      data: mockProof,
      message: 'Mock membership proof generated'
    }
  }

  /**
   * Generate mock range proof
   */
  static async generateRangeProof(
    credentialId: string,
    attribute: string,
    minValue: number,
    maxValue: number,
    walletAddress: string,
    walletType: string
  ): Promise<StorageResult<ZKProof>> {
    // For testing, generate a simple range proof
    const mockProof: ZKProof = {
      id: `range_proof_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      proofType: 'range',
      circuitName: 'range_test',
      proofData: {
        proof: 'mock_range_proof_' + Date.now(),
        publicSignals: [minValue, maxValue],
        verificationKey: 'mock_range_key_' + Date.now()
      },
      commitmentHash: 'mock_range_commitment_' + Date.now(),
      requestedAttributes: [attribute],
      revealedAttributes: { [`${attribute}_in_range`]: true },
      hiddenAttributes: [attribute],
      proofPurpose: 'range-verification',
      challenge: this.generateChallenge(),
      expirationTime: new Date(Date.now() + this.DEFAULT_EXPIRATION_HOURS * 60 * 60 * 1000).toISOString(),
      metadata: {
        credentialType: 'RangeCredential',
        issuerDid: 'did:persona:range-issuer',
        subjectDid: 'test-subject-did',
        schemaId: 'range_schema_v1.0',
        proofGenerated: new Date().toISOString()
      }
    }

    return {
      success: true,
      data: mockProof,
      message: 'Mock range proof generated'
    }
  }

  /**
   * Get credential for proof generation using test storage
   */
  private static async getCredentialForProof(
    credentialId: string,
    walletAddress: string,
    walletType: string
  ): Promise<{ success: boolean; credential?: any; error?: string }> {
    try {
      // First get the DID for the wallet
      const did = await testIdentityStorage.getDIDByWallet(walletAddress)
      if (!did) {
        return { success: false, error: 'DID not found for wallet' }
      }

      // Get all credentials for the DID
      const credentialsResult = await testIdentityStorage.getVerifiableCredentials(
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
        return { success: false, error: 'Specified credential not found' }
      }

      return { success: true, credential }

    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Credential lookup failed' }
    }
  }

  /**
   * Extract credential attributes for proof generation
   */
  private static extractCredentialAttributes(credential: any): { [key: string]: any } {
    return {
      ...credential.credentialSubject,
      issuer: typeof credential.issuer === 'string' ? credential.issuer : credential.issuer.id,
      type: credential.type.join(','),
      issuanceDate: credential.issuanceDate,
      expirationDate: credential.expirationDate
    }
  }

  /**
   * Generate a random challenge string
   */
  private static generateChallenge(): string {
    return 'challenge_' + Date.now() + '_' + Math.random().toString(36).slice(2)
  }
}

// Export singleton for convenience
export const testZKProof = new TestZKProofService()