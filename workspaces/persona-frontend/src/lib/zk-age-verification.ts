// PersonaPass ZK Age Verification - Industry-Leading Privacy-Preserving Age Proofs
// Uses Groth16 ZK-SNARKs to prove age without revealing birthdate

import { groth16 } from 'snarkjs';

export interface AgeVerificationRequest {
  birthdate: string; // Private input - never leaves user's device
  currentDate: string;
  minimumAge: number; // e.g., 21 for alcohol
}

export interface AgeProof {
  proof: {
    pi_a: string[];
    pi_b: string[][];
    pi_c: string[];
    protocol: string;
  };
  publicSignals: string[]; // [isOverMinimumAge: 1 or 0]
}

export class ZKAgeVerification {
  private wasmPath = '/circuits/age_verification.wasm';
  private zkeyPath = '/circuits/age_verification_0001.zkey';
  private vKeyPath = '/circuits/verification_key.json';

  /**
   * Generate a zero-knowledge proof that user is over minimum age
   * WITHOUT revealing their actual birthdate
   */
  async generateAgeProof(request: AgeVerificationRequest): Promise<AgeProof> {
    console.log('🔐 Generating privacy-preserving age proof...');

    // Calculate age in days (more precise than years)
    const birthDate = new Date(request.birthdate);
    const currentDate = new Date(request.currentDate);
    const ageInDays = Math.floor((currentDate.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24));
    const minimumAgeInDays = request.minimumAge * 365;

    // Circuit inputs (private - never sent to server)
    const input = {
      birthdate: birthDate.getTime(),
      currentDate: currentDate.getTime(),
      ageInDays: ageInDays,
      minimumAgeInDays: minimumAgeInDays
    };

    try {
      // Generate the proof
      const { proof, publicSignals } = await groth16.fullProve(
        input,
        this.wasmPath,
        this.zkeyPath
      );

      // Format proof for on-chain verification
      const formattedProof: AgeProof = {
        proof: {
          pi_a: proof.pi_a.slice(0, 2),
          pi_b: [proof.pi_b[0].slice(0, 2), proof.pi_b[1].slice(0, 2)],
          pi_c: proof.pi_c.slice(0, 2),
          protocol: 'groth16'
        },
        publicSignals: publicSignals // [1] if over age, [0] if not
      };

      console.log('✅ Age proof generated successfully');
      return formattedProof;

    } catch (error) {
      console.error('❌ Failed to generate age proof:', error);
      throw new Error('Age proof generation failed');
    }
  }

  /**
   * Verify an age proof (can be done on-chain or off-chain)
   */
  async verifyAgeProof(proof: AgeProof): Promise<boolean> {
    try {
      console.log('🔍 Verifying age proof...');

      const vKey = await fetch(this.vKeyPath).then(r => r.json());
      
      const isValid = await groth16.verify(
        vKey,
        proof.publicSignals,
        proof.proof
      );

      console.log(`✅ Age proof verification: ${isValid ? 'VALID' : 'INVALID'}`);
      return isValid && proof.publicSignals[0] === '1'; // Must be valid AND over age

    } catch (error) {
      console.error('❌ Age proof verification failed:', error);
      return false;
    }
  }

  /**
   * Get human-readable age verification result
   */
  getVerificationMessage(proof: AgeProof, minimumAge: number): string {
    const isOverAge = proof.publicSignals[0] === '1';
    if (isOverAge) {
      return `✅ User is VERIFIED to be ${minimumAge}+ years old`;
    } else {
      return `❌ User is NOT ${minimumAge}+ years old`;
    }
  }
}

// Singleton instance
export const zkAgeVerifier = new ZKAgeVerification();

// Simple integration for merchants
export async function verifyUserAge(minimumAge: number = 21): Promise<boolean> {
  // This would connect to user's PersonaPass wallet
  // For demo, using mock data
  const mockBirthdate = '1990-01-01'; // User's private data
  
  const proof = await zkAgeVerifier.generateAgeProof({
    birthdate: mockBirthdate,
    currentDate: new Date().toISOString(),
    minimumAge
  });

  return zkAgeVerifier.verifyAgeProof(proof);
}