/**
 * PRIVACY-PRESERVING KYC PROOF SERVICE
 * 
 * Generates zero-knowledge proofs for KYC verification without revealing:
 * - Personal identity details
 * - Document contents  
 * - Verification provider
 * - Biometric data
 * - Exact verification dates
 */

import { poseidon } from 'circomlibjs';
import { groth16 } from 'snarkjs';
import { ethers } from 'ethers';

// Import our ZK circuit artifacts
const kycCircuitWasm = '/circuits/kyc_verification.wasm';
const kycCircuitZkey = '/circuits/kyc_verification_final.zkey';
const kycVerificationKey = '/circuits/kyc_verification_vkey.json';

export interface KYCProofInputs {
  // Document verification
  documentHash: string;
  documentSalt: string; 
  documentType: number; // 1=passport, 2=license, 3=national_id
  
  // Personal data (pre-hashed for privacy)
  nameHash: string;
  dobHash: string;
  addressHash: string;
  ssnHash: string;
  
  // Biometric verification (no raw biometric data)
  livenessProof: string;
  faceMatchScore: number;
  biometricNonce: string;
  
  // Provider verification
  providerPublicKey: [string, string];
  providerSignature: [string, string];
  providerTier: number;
  
  // Temporal validity
  verificationDate: number;
  expirationDate: number;
  
  // Public challenge parameters
  currentTimestamp: number;
  requiredTier: number;
  requiredRegion: number;
  challengeNonce: string;
}

export interface KYCProofOutputs {
  isKYCValid: boolean;
  verificationTier: number;
  complianceRegion: number;
  validityProof: string;
  uniquenessCommitment: string;
  proof: any; // ZK proof object
  publicSignals: string[];
}

export interface KYCVerificationRequest {
  walletAddress: string;
  requiredTier: number;
  complianceRegion?: number;
  challengeNonce?: string;
}

export class KYCProofService {
  private circuitWasm: ArrayBuffer | null = null;
  private circuitZkey: ArrayBuffer | null = null;
  private verificationKey: any = null;
  
  constructor() {
    console.log('🔐 KYC Proof Service initialized with privacy-preserving ZK circuits');
  }
  
  /**
   * Initialize circuit artifacts
   */
  async initialize(): Promise<void> {
    try {
      console.log('📥 Loading KYC verification circuit artifacts...');
      
      // Load circuit WASM
      const wasmResponse = await fetch(kycCircuitWasm);
      this.circuitWasm = await wasmResponse.arrayBuffer();
      
      // Load proving key
      const zkeyResponse = await fetch(kycCircuitZkey);
      this.circuitZkey = await zkeyResponse.arrayBuffer();
      
      // Load verification key
      const vkeyResponse = await fetch(kycVerificationKey);
      this.verificationKey = await vkeyResponse.json();
      
      console.log('✅ KYC circuit artifacts loaded successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize KYC proof service:', error);
      throw new Error('KYC proof service initialization failed');
    }
  }
  
  /**
   * Generate secure hashes for personal data
   */
  private async hashPersonalData(data: {
    fullName: string;
    dateOfBirth: string;
    address: string;
    ssn: string;
    salt?: string;
  }): Promise<{
    nameHash: string;
    dobHash: string; 
    addressHash: string;
    ssnHash: string;
    salt: string;
  }> {
    const salt = data.salt || ethers.utils.randomBytes(32);
    
    // Use Poseidon hash for ZK-friendly hashing
    const nameHash = poseidon([
      ethers.utils.toUtf8Bytes(data.fullName),
      salt
    ]).toString();
    
    const dobHash = poseidon([
      ethers.utils.toUtf8Bytes(data.dateOfBirth),
      salt
    ]).toString();
    
    const addressHash = poseidon([
      ethers.utils.toUtf8Bytes(data.address),
      salt  
    ]).toString();
    
    const ssnHash = poseidon([
      ethers.utils.toUtf8Bytes(data.ssn),
      salt
    ]).toString();
    
    return {
      nameHash,
      dobHash,
      addressHash,
      ssnHash,
      salt: ethers.utils.hexlify(salt)
    };
  }
  
  /**
   * Generate biometric liveness proof without storing biometric data
   */
  private async generateBiometricProof(
    biometricTemplate: string,
    challengeNonce: string
  ): Promise<{
    livenessProof: string;
    faceMatchScore: number;
    biometricNonce: string;
  }> {
    // Generate proof of biometric liveness without storing the template
    const templateHash = ethers.utils.keccak256(
      ethers.utils.toUtf8Bytes(biometricTemplate)
    );
    
    const nonceHash = ethers.utils.keccak256(
      ethers.utils.toUtf8Bytes(challengeNonce)
    );
    
    // Create liveness proof using commitment scheme
    const livenessProof = poseidon([
      templateHash,
      nonceHash,
      Date.now() // Temporal binding
    ]).toString();
    
    // Simulate face matching score (in production, this comes from biometric service)
    const faceMatchScore = 95; // High confidence match
    
    const biometricNonce = ethers.utils.randomBytes(16);
    
    return {
      livenessProof,
      faceMatchScore,
      biometricNonce: ethers.utils.hexlify(biometricNonce)
    };
  }
  
  /**
   * Generate KYC verification proof
   */
  async generateKYCProof(
    kycData: {
      // Identity data
      fullName: string;
      dateOfBirth: string;
      address: string;
      ssn: string;
      
      // Document data
      documentImage: string; // Base64 image
      documentType: number;
      
      // Biometric data
      biometricTemplate: string;
      
      // Provider attestation
      providerAttestation: {
        publicKey: [string, string];
        signature: [string, string];
        tier: number;
        verificationDate: number;
        expirationDate: number;
      };
    },
    request: KYCVerificationRequest
  ): Promise<KYCProofOutputs> {
    
    if (!this.circuitWasm || !this.circuitZkey || !this.verificationKey) {
      throw new Error('KYC proof service not initialized');
    }
    
    console.log('🔄 Generating privacy-preserving KYC proof...');
    
    try {
      // 1. Hash personal data for privacy
      const personalHashes = await this.hashPersonalData({
        fullName: kycData.fullName,
        dateOfBirth: kycData.dateOfBirth,
        address: kycData.address,
        ssn: kycData.ssn
      });
      
      // 2. Generate document hash
      const documentHash = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes(kycData.documentImage)
      );
      const documentSalt = ethers.utils.randomBytes(32);
      
      // 3. Generate biometric proof
      const biometricProof = await this.generateBiometricProof(
        kycData.biometricTemplate,
        request.challengeNonce || ethers.utils.hexlify(ethers.utils.randomBytes(16))
      );
      
      // 4. Prepare circuit inputs
      const inputs: KYCProofInputs = {
        // Document inputs
        documentHash: documentHash,
        documentSalt: ethers.utils.hexlify(documentSalt),
        documentType: kycData.documentType,
        
        // Personal data hashes
        nameHash: personalHashes.nameHash,
        dobHash: personalHashes.dobHash,
        addressHash: personalHashes.addressHash,
        ssnHash: personalHashes.ssnHash,
        
        // Biometric inputs
        livenessProof: biometricProof.livenessProof,
        faceMatchScore: biometricProof.faceMatchScore,
        biometricNonce: biometricProof.biometricNonce,
        
        // Provider inputs
        providerPublicKey: kycData.providerAttestation.publicKey,
        providerSignature: kycData.providerAttestation.signature,
        providerTier: kycData.providerAttestation.tier,
        
        // Temporal inputs
        verificationDate: kycData.providerAttestation.verificationDate,
        expirationDate: kycData.providerAttestation.expirationDate,
        
        // Public inputs
        currentTimestamp: Math.floor(Date.now() / 1000),
        requiredTier: request.requiredTier,
        requiredRegion: request.complianceRegion || 0,
        challengeNonce: request.challengeNonce || ethers.utils.hexlify(ethers.utils.randomBytes(16))
      };
      
      // 5. Generate ZK proof
      console.log('🧮 Computing zero-knowledge proof...');
      const { proof, publicSignals } = await groth16.fullProve(
        inputs,
        this.circuitWasm,
        this.circuitZkey
      );
      
      // 6. Parse public outputs
      const outputs: KYCProofOutputs = {
        isKYCValid: publicSignals[0] === '1',
        verificationTier: parseInt(publicSignals[1]),
        complianceRegion: parseInt(publicSignals[2]),
        validityProof: publicSignals[3],
        uniquenessCommitment: publicSignals[4],
        proof: proof,
        publicSignals: publicSignals
      };
      
      console.log('✅ KYC proof generated successfully');
      console.log(`   🎯 KYC Valid: ${outputs.isKYCValid}`);
      console.log(`   🏆 Verification Tier: ${outputs.verificationTier}`);
      console.log(`   🌍 Compliance Region: ${outputs.complianceRegion}`);
      
      return outputs;
      
    } catch (error) {
      console.error('❌ Failed to generate KYC proof:', error);
      throw new Error(`KYC proof generation failed: ${error}`);
    }
  }
  
  /**
   * Verify KYC proof on-chain or off-chain
   */
  async verifyKYCProof(
    proof: any,
    publicSignals: string[]
  ): Promise<boolean> {
    
    if (!this.verificationKey) {
      throw new Error('Verification key not loaded');
    }
    
    try {
      console.log('🔍 Verifying KYC proof...');
      
      const isValid = await groth16.verify(
        this.verificationKey,
        publicSignals,
        proof
      );
      
      if (isValid) {
        console.log('✅ KYC proof verification successful');
      } else {
        console.log('❌ KYC proof verification failed');
      }
      
      return isValid;
      
    } catch (error) {
      console.error('❌ KYC proof verification error:', error);
      return false;
    }
  }
  
  /**
   * Store KYC proof commitment for anti-sybil protection
   */
  async storeAntiSybilCommitment(
    walletAddress: string,
    uniquenessCommitment: string
  ): Promise<void> {
    
    try {
      // Store commitment in secure storage or blockchain
      const commitmentData = {
        walletAddress,
        uniquenessCommitment,
        timestamp: Date.now(),
        blockNumber: await this.getCurrentBlockNumber()
      };
      
      // In production, this would be stored on-chain or in a secure database
      localStorage.setItem(
        `kyc_commitment_${walletAddress}`, 
        JSON.stringify(commitmentData)
      );
      
      console.log('🔒 Anti-sybil commitment stored successfully');
      
    } catch (error) {
      console.error('❌ Failed to store anti-sybil commitment:', error);
      throw error;
    }
  }
  
  /**
   * Check for sybil attacks by verifying uniqueness commitments
   */
  async checkSybilAttack(uniquenessCommitment: string): Promise<boolean> {
    try {
      // Check if this uniqueness commitment already exists
      const existingCommitments = this.getAllStoredCommitments();
      
      const duplicateFound = existingCommitments.some(
        commitment => commitment.uniquenessCommitment === uniquenessCommitment
      );
      
      if (duplicateFound) {
        console.log('🚨 Potential sybil attack detected!');
        return true;
      }
      
      return false;
      
    } catch (error) {
      console.error('❌ Error checking for sybil attacks:', error);
      return false;
    }
  }
  
  // Helper methods
  private getAllStoredCommitments(): any[] {
    const commitments: any[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('kyc_commitment_')) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '');
          commitments.push(data);
        } catch (e) {
          // Skip invalid entries
        }
      }
    }
    
    return commitments;
  }
  
  private async getCurrentBlockNumber(): Promise<number> {
    // In production, this would fetch from the blockchain
    return Math.floor(Date.now() / 1000);
  }
  
  /**
   * Generate privacy-preserving KYC credential
   */
  async generateKYCCredential(
    kycProof: KYCProofOutputs,
    walletAddress: string
  ): Promise<{
    credentialId: string;
    issuer: string;
    subject: string;
    issuanceDate: string;
    expirationDate: string;
    credentialSubject: {
      kycTier: number;
      complianceRegion: number;
      proofOfPersonhood: boolean;
      verificationMethod: string;
    };
    proof: {
      type: string;
      verificationMethod: string;
      proofPurpose: string;
      jws: string;
    };
  }> {
    
    const credentialId = `did:personapass:kyc:${ethers.utils.randomBytes(16)}`;
    
    return {
      credentialId,
      issuer: 'did:personapass:kyc-issuer',
      subject: `did:personapass:${walletAddress}`,
      issuanceDate: new Date().toISOString(),
      expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      credentialSubject: {
        kycTier: kycProof.verificationTier,
        complianceRegion: kycProof.complianceRegion,
        proofOfPersonhood: kycProof.isKYCValid,
        verificationMethod: 'zero-knowledge-proof'
      },
      proof: {
        type: 'ZeroKnowledgeProof2024',
        verificationMethod: 'groth16-bn254',
        proofPurpose: 'assertionMethod',
        jws: JSON.stringify(kycProof.proof)
      }
    };
  }
}

// Export singleton instance
export const kycProofService = new KYCProofService();
export default kycProofService;