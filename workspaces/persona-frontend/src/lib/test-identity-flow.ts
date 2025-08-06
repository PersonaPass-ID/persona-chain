// End-to-End Web3 Identity Test Flow
// Tests the complete PersonaPass Web3 identity system

import { TestDIDResolverService, DIDCreationParams } from './test-did-resolver'
import { testIdentityStorage, VerifiableCredential } from './storage/test-identity-storage'
import { TestZKProofService } from './test-zk-proofs'
import { ZKProofRequest } from './zk-proofs'

export interface TestResult {
  success: boolean
  stage: string
  message: string
  data?: any
  error?: string
  timing?: number
}

export interface E2ETestResults {
  success: boolean
  totalTests: number
  passedTests: number
  failedTests: number
  results: TestResult[]
  summary: {
    didCreation: boolean
    credentialIssuance: boolean
    zkProofGeneration: boolean
    zkProofVerification: boolean
    dataEncryption: boolean
    blockchainAnchoring: boolean
  }
}

/**
 * Web3 Identity End-to-End Test Suite
 * Tests the complete hybrid storage architecture
 */
export class IdentityTestFlow {
  private testResults: TestResult[] = []

  /**
   * Run complete end-to-end identity test flow
   */
  async runCompleteTest(): Promise<E2ETestResults> {
    console.log('🧪 Starting Web3 Identity E2E Test Flow')
    this.testResults = []

    // Test data
    const testWallet = {
      address: 'cosmos1test' + Date.now(),
      type: 'keplr' as const,
      firstName: 'Test',
      lastName: 'User'
    }

    try {
      // Stage 1: DID Creation
      await this.testDIDCreation(testWallet)
      
      // Stage 2: Credential Issuance
      const credentialId = await this.testCredentialIssuance(testWallet)
      
      // Stage 3: ZK Proof Generation
      const credential = await this.testZKProofGeneration(testWallet, credentialId)
      
      // Stage 4: ZK Proof Verification
      await this.testZKProofVerification(credential)
      
      // Stage 5: Data Encryption Test
      await this.testDataEncryption(testWallet)
      
      // Stage 6: Blockchain Anchoring Test
      await this.testBlockchainAnchoring()

    } catch (error) {
      this.addResult(false, 'CRITICAL_ERROR', `Critical test failure: ${error}`)
    }

    return this.generateTestResults()
  }

  /**
   * Test DID Creation with hybrid storage
   */
  private async testDIDCreation(testWallet: {
    address: string
    type: 'keplr' | 'leap'
    firstName: string
    lastName: string
  }): Promise<void> {
    const startTime = Date.now()

    try {
      console.log('🆔 Testing DID Creation...')

      const creationParams: DIDCreationParams = {
        walletAddress: testWallet.address,
        walletType: testWallet.type,
        firstName: testWallet.firstName,
        lastName: testWallet.lastName,
        publicKey: 'test-public-key-' + Date.now()
      }

      const result = await TestDIDResolverService.createDID(creationParams)

      if (result.success && result.did) {
        const timing = Date.now() - startTime
        this.addResult(
          true,
          'DID_CREATION',
          `DID created successfully: ${result.did}`,
          { did: result.did, txHash: result.txHash, contentHash: result.contentHash },
          timing
        )
      } else {
        this.addResult(false, 'DID_CREATION', `DID creation failed: ${result.error}`)
      }

    } catch (error) {
      this.addResult(false, 'DID_CREATION', `DID creation error: ${error}`)
    }
  }

  /**
   * Test Credential Issuance
   */
  private async testCredentialIssuance(testWallet: {
    address: string
    type: 'keplr' | 'leap'
    firstName: string
    lastName: string
  }): Promise<string | null> {
    const startTime = Date.now()

    try {
      console.log('📜 Testing Credential Issuance...')

      // Get the DID that was created
      const did = await testIdentityStorage.getDIDByWallet(testWallet.address)
      
      if (!did) {
        this.addResult(false, 'CREDENTIAL_ISSUANCE', 'No DID found for credential issuance')
        return null
      }

      // Create a test credential
      const testCredential: VerifiableCredential = {
        '@context': [
          'https://www.w3.org/2018/credentials/v1',
          'https://personapass.org/contexts/test/v1'
        ],
        id: `test-cred-${Date.now()}`,
        type: ['VerifiableCredential', 'TestCredential'],
        issuer: 'did:persona:test-issuer',
        issuanceDate: new Date().toISOString(),
        credentialSubject: {
          id: did,
          testAttribute: 'test-value',
          age: 25,
          verified: true
        },
        proof: {
          type: 'Ed25519Signature2018',
          created: new Date().toISOString(),
          proofPurpose: 'assertionMethod',
          verificationMethod: did + '#key-1',
          signature: 'test-signature-' + Date.now()
        }
      }

      const result = await testIdentityStorage.storeVerifiableCredential(
        testCredential,
        testWallet.address,
        testWallet.type
      )

      if (result.success) {
        const timing = Date.now() - startTime
        this.addResult(
          true,
          'CREDENTIAL_ISSUANCE',
          `Test credential issued successfully: ${testCredential.id}`,
          { credentialId: testCredential.id, contentHash: result.contentHash },
          timing
        )
        return testCredential.id
      } else {
        this.addResult(false, 'CREDENTIAL_ISSUANCE', `Credential issuance failed: ${result.error}`)
        return null
      }

    } catch (error) {
      this.addResult(false, 'CREDENTIAL_ISSUANCE', `Credential issuance error: ${error}`)
      return null
    }
  }

  /**
   * Test ZK Proof Generation
   */
  private async testZKProofGeneration(testWallet: {
    address: string
    type: 'keplr' | 'leap'
  }, credentialId: string | null): Promise<any> {
    const startTime = Date.now()

    try {
      console.log('🔐 Testing ZK Proof Generation...')

      if (!credentialId) {
        this.addResult(false, 'ZK_PROOF_GENERATION', 'No credential ID available for proof generation')
        return null
      }

      const zkRequest: ZKProofRequest = {
        credentialId,
        requestedAttributes: ['testAttribute', 'verified'],
        proofPurpose: 'test-verification',
        challenge: 'test-challenge-' + Date.now()
      }

      const result = await TestZKProofService.generateSelectiveDisclosureProof(
        zkRequest,
        testWallet.address,
        testWallet.type
      )

      if (result.success && result.data) {
        const timing = Date.now() - startTime
        this.addResult(
          true,
          'ZK_PROOF_GENERATION',
          `ZK proof generated successfully: ${result.data.id}`,
          { 
            proofId: result.data.id, 
            proofType: result.data.proofType,
            revealedAttributes: result.data.revealedAttributes 
          },
          timing
        )
        return result.data
      } else {
        this.addResult(false, 'ZK_PROOF_GENERATION', `ZK proof generation failed: ${result.error}`)
        return null
      }

    } catch (error) {
      this.addResult(false, 'ZK_PROOF_GENERATION', `ZK proof generation error: ${error}`)
      return null
    }
  }

  /**
   * Test ZK Proof Verification
   */
  private async testZKProofVerification(proof: any): Promise<void> {
    const startTime = Date.now()

    try {
      console.log('🔍 Testing ZK Proof Verification...')

      if (!proof) {
        this.addResult(false, 'ZK_PROOF_VERIFICATION', 'No proof available for verification')
        return
      }

      const verificationRequest = {
        proof,
        verifierDid: 'did:persona:test-verifier'
      }

      const result = await TestZKProofService.verifyProof(verificationRequest)

      if (result.success && result.isValid) {
        const timing = Date.now() - startTime
        this.addResult(
          true,
          'ZK_PROOF_VERIFICATION',
          `ZK proof verified successfully`,
          { 
            proofId: proof.id,
            verifiedAttributes: result.verifiedAttributes,
            verificationTime: result.proofMetadata.verificationTime
          },
          timing
        )
      } else {
        this.addResult(false, 'ZK_PROOF_VERIFICATION', `ZK proof verification failed: ${result.error}`)
      }

    } catch (error) {
      this.addResult(false, 'ZK_PROOF_VERIFICATION', `ZK proof verification error: ${error}`)
    }
  }

  /**
   * Test Data Encryption
   */
  private async testDataEncryption(testWallet: { address: string }): Promise<void> {
    const startTime = Date.now()

    try {
      console.log('🔐 Testing Data Encryption...')

      const testData = {
        sensitiveInfo: 'This is secret data',
        personalDetails: {
          name: 'Test User',
          age: 30,
          verified: true
        },
        timestamp: Date.now()
      }

      const testSignature = 'test-signature-' + Date.now()

      // Test encryption
      const { IdentityEncryption } = require('./encryption')
      const encryptedData = await IdentityEncryption.encryptData(testData, testSignature)

      if (!encryptedData.encryptedContent || !encryptedData.iv || !encryptedData.salt) {
        this.addResult(false, 'DATA_ENCRYPTION', 'Encryption failed to produce required components')
        return
      }

      // Test decryption
      const decryptionResult = await IdentityEncryption.decryptData(encryptedData, testSignature)

      if (decryptionResult.success && decryptionResult.data) {
        // Verify data integrity
        const isDataIntact = JSON.stringify(decryptionResult.data) === JSON.stringify(testData)
        
        if (isDataIntact) {
          const timing = Date.now() - startTime
          this.addResult(
            true,
            'DATA_ENCRYPTION',
            'Encryption/decryption test passed with data integrity verification',
            { 
              encryptedLength: encryptedData.encryptedContent.length,
              algorithm: 'AES-GCM',
              keyDerivation: 'PBKDF2'
            },
            timing
          )
        } else {
          this.addResult(false, 'DATA_ENCRYPTION', 'Data integrity check failed after decryption')
        }
      } else {
        this.addResult(false, 'DATA_ENCRYPTION', `Decryption failed: ${decryptionResult.error}`)
      }

    } catch (error) {
      this.addResult(false, 'DATA_ENCRYPTION', `Data encryption error: ${error}`)
    }
  }

  /**
   * Test Blockchain Anchoring
   */
  private async testBlockchainAnchoring(): Promise<void> {
    const startTime = Date.now()

    try {
      console.log('⚓ Testing Blockchain Anchoring...')

      const { blockchainAnchor } = require('./storage/blockchain-anchor')
      
      const testDid = 'did:persona:test-anchor'
      const testWalletAddress = 'cosmos1testanchor' + Date.now()
      const testContentHash = 'test-hash-' + Date.now()
      const testDocument = { test: true, timestamp: Date.now() }

      const result = await blockchainAnchor.anchorDIDCreation(
        testDid,
        testWalletAddress,
        testContentHash,
        testDocument
      )

      if (result.success && result.txHash) {
        const timing = Date.now() - startTime
        this.addResult(
          true,
          'BLOCKCHAIN_ANCHORING',
          `Blockchain anchoring successful`,
          { 
            txHash: result.txHash,
            network: result.network,
            blockHeight: result.blockHeight
          },
          timing
        )
      } else {
        this.addResult(false, 'BLOCKCHAIN_ANCHORING', `Blockchain anchoring failed: ${result.error}`)
      }

    } catch (error) {
      this.addResult(false, 'BLOCKCHAIN_ANCHORING', `Blockchain anchoring error: ${error}`)
    }
  }

  /**
   * Add test result
   */
  private addResult(success: boolean, stage: string, message: string, data?: any, timing?: number): void {
    const result: TestResult = {
      success,
      stage,
      message,
      data,
      timing
    }

    if (!success) {
      result.error = message
    }

    this.testResults.push(result)
    
    const statusIcon = success ? '✅' : '❌'
    const timingText = timing ? ` (${timing}ms)` : ''
    console.log(`${statusIcon} ${stage}: ${message}${timingText}`)
  }

  /**
   * Generate final test results
   */
  private generateTestResults(): E2ETestResults {
    const passedTests = this.testResults.filter(r => r.success).length
    const failedTests = this.testResults.filter(r => !r.success).length
    const totalTests = this.testResults.length

    const summary = {
      didCreation: this.testResults.some(r => r.stage === 'DID_CREATION' && r.success),
      credentialIssuance: this.testResults.some(r => r.stage === 'CREDENTIAL_ISSUANCE' && r.success),
      zkProofGeneration: this.testResults.some(r => r.stage === 'ZK_PROOF_GENERATION' && r.success),
      zkProofVerification: this.testResults.some(r => r.stage === 'ZK_PROOF_VERIFICATION' && r.success),
      dataEncryption: this.testResults.some(r => r.stage === 'DATA_ENCRYPTION' && r.success),
      blockchainAnchoring: this.testResults.some(r => r.stage === 'BLOCKCHAIN_ANCHORING' && r.success)
    }

    const overallSuccess = failedTests === 0 && totalTests > 0

    console.log('\n🧪 Web3 Identity E2E Test Results:')
    console.log(`Tests: ${passedTests}/${totalTests} passed`)
    console.log(`Overall: ${overallSuccess ? '✅ PASSED' : '❌ FAILED'}`)
    
    return {
      success: overallSuccess,
      totalTests,
      passedTests,
      failedTests,
      results: this.testResults,
      summary
    }
  }
}

// Export for convenience
export const testIdentityFlow = new IdentityTestFlow()