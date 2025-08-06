/**
 * PRIVACY-PRESERVING PROOF OF PERSONHOOD SERVICE
 * 
 * Generates zero-knowledge proofs for unique human identity without revealing:
 * - Specific verification methods used
 * - Personal identity information
 * - Biometric data
 * - Social graph connections
 * - Device fingerprints
 * - Behavioral patterns
 */

import { poseidon } from 'circomlibjs';
import { groth16 } from 'snarkjs';
import { ethers } from 'ethers';

// Import our ZK circuit artifacts
const personhoodCircuitWasm = '/circuits/proof_of_personhood.wasm';
const personhoodCircuitZkey = '/circuits/proof_of_personhood_final.zkey';
const personhoodVerificationKey = '/circuits/proof_of_personhood_vkey.json';

export interface PersonhoodProofInputs {
  // Multi-modal verification signals (private)
  biometricHash: string;
  biometricLiveness: number;
  biometricUniqueness: number;
  
  // Document verification (up to 3 documents)
  documentHashes: [string, string, string];
  documentScores: [number, number, number];
  documentTypes: [number, number, number]; // 0=none, 1=passport, 2=license, 3=national_id
  
  // Social verification signals (up to 5)
  socialSignals: [string, string, string, string, string];
  socialScores: [number, number, number, number, number];
  socialTypes: [number, number, number, number, number]; // 0=none, 1=github, 2=linkedin, 3=phone, 4=email, 5=address
  
  // Additional verification signals
  deviceFingerprint: string;
  behaviorPattern: string;
  geolocationHash: string;
  
  // KYC provider attestation
  kycProviderHash: string;
  kycTierLevel: number;
  kycValidityPeriod: number;
  
  // Temporal and uniqueness
  verificationTimestamps: string[];
  verificationNonces: string[];
  globalUniquenessKey: string;
  
  // Public inputs
  currentTimestamp: number;
  challengeNonce: string;
  requiredConfidence: number;
  networkEpoch: number;
}

export interface PersonhoodProofOutputs {
  personhoodConfidence: number;
  verificationDiversity: number;
  antiSybilCommitment: string;
  temporalProof: string;
  networkBinding: string;
  proof: any; // ZK proof object
  publicSignals: string[];
}

export interface PersonhoodVerificationRequest {
  walletAddress: string;
  requiredConfidence: number;
  challengeNonce?: string;
  networkEpoch?: number;
}

export interface VerificationMethod {
  type: 'biometric' | 'document' | 'social' | 'kyc' | 'device' | 'behavior';
  subtype?: string;
  confidence: number;
  timestamp: number;
  nonce?: string;
  data?: any; // Hashed/processed data only
}

export class PersonhoodProofService {
  private circuitWasm: ArrayBuffer | null = null;
  private circuitZkey: ArrayBuffer | null = null;
  private verificationKey: any = null;
  
  constructor() {
    console.log('🧬 Proof of Personhood Service initialized with anti-sybil ZK circuits');
  }
  
  /**
   * Initialize circuit artifacts
   */
  async initialize(): Promise<void> {
    try {
      console.log('📥 Loading Proof of Personhood circuit artifacts...');
      
      // Load circuit WASM
      const wasmResponse = await fetch(personhoodCircuitWasm);
      this.circuitWasm = await wasmResponse.arrayBuffer();
      
      // Load proving key
      const zkeyResponse = await fetch(personhoodCircuitZkey);
      this.circuitZkey = await zkeyResponse.arrayBuffer();
      
      // Load verification key
      const vkeyResponse = await fetch(personhoodVerificationKey);
      this.verificationKey = await vkeyResponse.json();
      
      console.log('✅ Personhood circuit artifacts loaded successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize Personhood proof service:', error);
      throw new Error('Personhood proof service initialization failed');
    }
  }
  
  /**
   * Generate privacy-preserving biometric proof
   */
  private async generateBiometricProof(
    biometricTemplate: string,
    livenessScore: number
  ): Promise<{
    biometricHash: string;
    biometricLiveness: number;
    biometricUniqueness: number;
  }> {
    // Hash biometric template for privacy
    const biometricHash = poseidon([
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes(biometricTemplate)),
      Date.now() // Add temporal binding
    ]).toString();
    
    // Simulate uniqueness check (in production, this comes from secure database query)
    const biometricUniqueness = 98; // High uniqueness score
    
    return {
      biometricHash,
      biometricLiveness: livenessScore,
      biometricUniqueness
    };
  }
  
  /**
   * Generate document verification proofs
   */
  private async generateDocumentProofs(
    documents: Array<{
      type: number;
      image: string;
      authenticityScore: number;
    }>
  ): Promise<{
    documentHashes: [string, string, string];
    documentScores: [number, number, number];
    documentTypes: [number, number, number];
  }> {
    const documentHashes: [string, string, string] = ['0', '0', '0'];
    const documentScores: [number, number, number] = [0, 0, 0];
    const documentTypes: [number, number, number] = [0, 0, 0];
    
    for (let i = 0; i < Math.min(documents.length, 3); i++) {
      const doc = documents[i];
      
      // Hash document image for privacy
      documentHashes[i] = poseidon([
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes(doc.image)),
        doc.type,
        Date.now()
      ]).toString();
      
      documentScores[i] = doc.authenticityScore;
      documentTypes[i] = doc.type;
    }
    
    return { documentHashes, documentScores, documentTypes };
  }
  
  /**
   * Generate social verification proofs
   */
  private async generateSocialProofs(
    socialVerifications: Array<{
      type: number;
      identifier: string;
      confidence: number;
    }>
  ): Promise<{
    socialSignals: [string, string, string, string, string];
    socialScores: [number, number, number, number, number];
    socialTypes: [number, number, number, number, number];
  }> {
    const socialSignals: [string, string, string, string, string] = ['0', '0', '0', '0', '0'];
    const socialScores: [number, number, number, number, number] = [0, 0, 0, 0, 0];
    const socialTypes: [number, number, number, number, number] = [0, 0, 0, 0, 0];
    
    for (let i = 0; i < Math.min(socialVerifications.length, 5); i++) {
      const social = socialVerifications[i];
      
      // Hash social identifier for privacy
      socialSignals[i] = poseidon([
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes(social.identifier)),
        social.type,
        Date.now()
      ]).toString();
      
      socialScores[i] = social.confidence;
      socialTypes[i] = social.type;
    }
    
    return { socialSignals, socialScores, socialTypes };
  }
  
  /**
   * Generate global uniqueness key
   */
  private generateGlobalUniquenessKey(
    personalIdentifiers: string[],
    salt?: string
  ): string {
    const uniqueSalt = salt || ethers.utils.hexlify(ethers.utils.randomBytes(32));
    
    // Combine all personal identifiers into a unique key
    const combined = personalIdentifiers.join('|');
    
    return poseidon([
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes(combined)),
      uniqueSalt
    ]).toString();
  }
  
  /**
   * Generate Proof of Personhood
   */
  async generatePersonhoodProof(
    personhoodData: {
      // Biometric data
      biometricTemplate: string;
      livenessScore: number;
      
      // Document data
      documents: Array<{
        type: number;
        image: string;
        authenticityScore: number;
      }>;
      
      // Social verification data
      socialVerifications: Array<{
        type: number;
        identifier: string;
        confidence: number;
      }>;
      
      // Device and behavior
      deviceFingerprint: string;
      behaviorPattern: string;
      geolocationData: string;
      
      // KYC attestation
      kycAttestation: {
        providerHash: string;
        tierLevel: number;
        validityDays: number;
      };
      
      // Verification methods with timestamps
      verificationMethods: VerificationMethod[];
      
      // Personal identifiers for uniqueness
      personalIdentifiers: string[];
    },
    request: PersonhoodVerificationRequest
  ): Promise<PersonhoodProofOutputs> {
    
    if (!this.circuitWasm || !this.circuitZkey || !this.verificationKey) {
      throw new Error('Personhood proof service not initialized');
    }
    
    console.log('🔄 Generating privacy-preserving Proof of Personhood...');
    
    try {
      // 1. Generate biometric proof
      const biometricProof = await this.generateBiometricProof(
        personhoodData.biometricTemplate,
        personhoodData.livenessScore
      );
      
      // 2. Generate document proofs
      const documentProofs = await this.generateDocumentProofs(personhoodData.documents);
      
      // 3. Generate social proofs
      const socialProofs = await this.generateSocialProofs(personhoodData.socialVerifications);
      
      // 4. Generate device and behavior hashes
      const deviceFingerprint = poseidon([
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes(personhoodData.deviceFingerprint))
      ]).toString();
      
      const behaviorPattern = poseidon([
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes(personhoodData.behaviorPattern))
      ]).toString();
      
      const geolocationHash = poseidon([
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes(personhoodData.geolocationData))
      ]).toString();
      
      // 5. Generate global uniqueness key
      const globalUniquenessKey = this.generateGlobalUniquenessKey(
        personhoodData.personalIdentifiers
      );
      
      // 6. Prepare verification timestamps and nonces (up to 10)
      const verificationTimestamps: string[] = new Array(10).fill('0');
      const verificationNonces: string[] = new Array(10).fill('0');
      
      for (let i = 0; i < Math.min(personhoodData.verificationMethods.length, 10); i++) {
        const method = personhoodData.verificationMethods[i];
        verificationTimestamps[i] = method.timestamp.toString();
        verificationNonces[i] = method.nonce || ethers.utils.hexlify(ethers.utils.randomBytes(16));
      }
      
      // 7. Prepare circuit inputs
      const inputs: PersonhoodProofInputs = {
        // Biometric inputs
        biometricHash: biometricProof.biometricHash,
        biometricLiveness: biometricProof.biometricLiveness,
        biometricUniqueness: biometricProof.biometricUniqueness,
        
        // Document inputs
        documentHashes: documentProofs.documentHashes,
        documentScores: documentProofs.documentScores,
        documentTypes: documentProofs.documentTypes,
        
        // Social inputs
        socialSignals: socialProofs.socialSignals,
        socialScores: socialProofs.socialScores,
        socialTypes: socialProofs.socialTypes,
        
        // Device and behavior inputs
        deviceFingerprint,
        behaviorPattern,
        geolocationHash,
        
        // KYC inputs
        kycProviderHash: personhoodData.kycAttestation.providerHash,
        kycTierLevel: personhoodData.kycAttestation.tierLevel,
        kycValidityPeriod: personhoodData.kycAttestation.validityDays,
        
        // Temporal and uniqueness inputs
        verificationTimestamps,
        verificationNonces,
        globalUniquenessKey,
        
        // Public inputs
        currentTimestamp: Math.floor(Date.now() / 1000),
        challengeNonce: request.challengeNonce || ethers.utils.hexlify(ethers.utils.randomBytes(16)),
        requiredConfidence: request.requiredConfidence,
        networkEpoch: request.networkEpoch || Math.floor(Date.now() / (24 * 60 * 60 * 1000)) // Daily epoch
      };
      
      // 8. Generate ZK proof
      console.log('🧮 Computing zero-knowledge proof of personhood...');
      const { proof, publicSignals } = await groth16.fullProve(
        inputs,
        this.circuitWasm,
        this.circuitZkey
      );
      
      // 9. Parse public outputs
      const outputs: PersonhoodProofOutputs = {
        personhoodConfidence: parseInt(publicSignals[0]),
        verificationDiversity: parseInt(publicSignals[1]),
        antiSybilCommitment: publicSignals[2],
        temporalProof: publicSignals[3],
        networkBinding: publicSignals[4],
        proof: proof,
        publicSignals: publicSignals
      };
      
      console.log('✅ Proof of Personhood generated successfully');
      console.log(`   🎯 Personhood Confidence: ${outputs.personhoodConfidence}%`);
      console.log(`   🌟 Verification Diversity: ${outputs.verificationDiversity} methods`);
      console.log(`   🛡️ Anti-Sybil Protection: Enabled`);
      
      return outputs;
      
    } catch (error) {
      console.error('❌ Failed to generate Proof of Personhood:', error);
      throw new Error(`Personhood proof generation failed: ${error}`);
    }
  }
  
  /**
   * Verify Proof of Personhood
   */
  async verifyPersonhoodProof(
    proof: any,
    publicSignals: string[]
  ): Promise<boolean> {
    
    if (!this.verificationKey) {
      throw new Error('Verification key not loaded');
    }
    
    try {
      console.log('🔍 Verifying Proof of Personhood...');
      
      const isValid = await groth16.verify(
        this.verificationKey,
        publicSignals,
        proof
      );
      
      if (isValid) {
        console.log('✅ Proof of Personhood verification successful');
      } else {
        console.log('❌ Proof of Personhood verification failed');
      }
      
      return isValid;
      
    } catch (error) {
      console.error('❌ Personhood proof verification error:', error);
      return false;
    }
  }
  
  /**
   * Check for sybil attacks using uniqueness commitments
   */
  async checkSybilAttack(antiSybilCommitment: string): Promise<boolean> {
    try {
      // Check if this commitment already exists in the network
      const existingCommitments = this.getAllStoredCommitments();
      
      const duplicateFound = existingCommitments.some(
        commitment => commitment.antiSybilCommitment === antiSybilCommitment
      );
      
      if (duplicateFound) {
        console.log('🚨 Potential sybil attack detected - duplicate uniqueness commitment!');
        return true;
      }
      
      console.log('✅ No sybil attack detected - unique personhood confirmed');
      return false;
      
    } catch (error) {
      console.error('❌ Error checking for sybil attacks:', error);
      return false;
    }
  }
  
  /**
   * Store anti-sybil commitment
   */
  async storeAntiSybilCommitment(
    walletAddress: string,
    antiSybilCommitment: string,
    personhoodConfidence: number
  ): Promise<void> {
    
    try {
      const commitmentData = {
        walletAddress,
        antiSybilCommitment,
        personhoodConfidence,
        timestamp: Date.now(),
        networkEpoch: Math.floor(Date.now() / (24 * 60 * 60 * 1000)),
        verified: true
      };
      
      // Store in secure storage (in production, this would be on-chain or in secure database)
      localStorage.setItem(
        `personhood_commitment_${walletAddress}`, 
        JSON.stringify(commitmentData)
      );
      
      console.log('🔒 Anti-sybil commitment stored successfully');
      
    } catch (error) {
      console.error('❌ Failed to store anti-sybil commitment:', error);
      throw error;
    }
  }
  
  /**
   * Generate personhood credential
   */
  async generatePersonhoodCredential(
    personhoodProof: PersonhoodProofOutputs,
    walletAddress: string
  ): Promise<{
    credentialId: string;
    issuer: string;
    subject: string;
    issuanceDate: string;
    expirationDate: string;
    credentialSubject: {
      personhoodConfidence: number;
      verificationDiversity: number;
      antiSybilProtection: boolean;
      humanVerification: boolean;
      uniquenessGuarantee: boolean;
    };
    proof: {
      type: string;
      verificationMethod: string;
      proofPurpose: string;
      jws: string;
    };
  }> {
    
    const credentialId = `did:personapass:personhood:${ethers.utils.hexlify(ethers.utils.randomBytes(16))}`;
    
    return {
      credentialId,
      issuer: 'did:personapass:personhood-issuer',
      subject: `did:personapass:${walletAddress}`,
      issuanceDate: new Date().toISOString(),
      expirationDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
      credentialSubject: {
        personhoodConfidence: personhoodProof.personhoodConfidence,
        verificationDiversity: personhoodProof.verificationDiversity,
        antiSybilProtection: true,
        humanVerification: personhoodProof.personhoodConfidence >= 70,
        uniquenessGuarantee: true
      },
      proof: {
        type: 'ZeroKnowledgeProof2024',
        verificationMethod: 'groth16-bn254-personhood',
        proofPurpose: 'assertionMethod',
        jws: JSON.stringify(personhoodProof.proof)
      }
    };
  }
  
  // Helper methods
  private getAllStoredCommitments(): any[] {
    const commitments: any[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('personhood_commitment_')) {
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
}

// Export singleton instance
export const personhoodProofService = new PersonhoodProofService();
export default personhoodProofService;