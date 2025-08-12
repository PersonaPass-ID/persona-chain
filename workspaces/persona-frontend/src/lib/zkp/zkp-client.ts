/**
 * CLIENT-SIDE ZKP UTILITIES
 * 
 * Helper functions for generating zero-knowledge proofs on the client side
 * These can be used in React components for privacy-preserving verification
 */

import { zkp, SchnorrProof, MerkleProof, RangeProof } from './zero-knowledge-proof';

export interface ZKPClientConfig {
  apiEndpoint?: string;
  cacheProofs?: boolean;
  proofExpiry?: number; // milliseconds
}

export class ZKPClient {
  private config: Required<ZKPClientConfig>;
  private proofCache: Map<string, { proof: any; expires: number }> = new Map();

  constructor(config: ZKPClientConfig = {}) {
    this.config = {
      apiEndpoint: config.apiEndpoint || '/api/auth/zkp-verify',
      cacheProofs: config.cacheProofs ?? true,
      proofExpiry: config.proofExpiry || 5 * 60 * 1000 // 5 minutes
    };
  }

  /**
   * Generate and verify age proof
   */
  async proveAndVerifyAge(
    birthYear: number,
    minimumAge: number
  ): Promise<{
    success: boolean;
    proof?: RangeProof;
    verified?: boolean;
    message?: string;
  }> {
    try {
      // Check cache first
      const cacheKey = `age:${birthYear}:${minimumAge}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return { success: true, proof: cached, verified: true, message: 'Cached proof' };
      }

      // Generate age proof
      const proof = await zkp.proveAge(birthYear, minimumAge);

      // Cache the proof
      if (this.config.cacheProofs) {
        this.addToCache(cacheKey, proof);
      }

      // Verify with server
      const verified = await this.verifyWithServer('age', proof, { minimumAge });

      return {
        success: true,
        proof,
        verified: verified.verified,
        message: verified.message
      };
    } catch (error) {
      console.error('Age proof error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to generate age proof'
      };
    }
  }

  /**
   * Generate and verify credential ownership proof
   */
  async proveAndVerifyCredential(
    credentialId: string,
    allCredentialIds: string[],
    credentialType?: string
  ): Promise<{
    success: boolean;
    proof?: MerkleProof;
    verified?: boolean;
    message?: string;
  }> {
    try {
      // Check cache
      const cacheKey = `credential:${credentialId}:${allCredentialIds.join(',')}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return { success: true, proof: cached, verified: true, message: 'Cached proof' };
      }

      // Generate credential proof
      const proof = await zkp.proveCredential(credentialId, allCredentialIds);

      // Cache the proof
      if (this.config.cacheProofs) {
        this.addToCache(cacheKey, proof);
      }

      // Verify with server
      const verified = await this.verifyWithServer('credential', proof, { credentialType });

      return {
        success: true,
        proof,
        verified: verified.verified,
        message: verified.message
      };
    } catch (error) {
      console.error('Credential proof error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to generate credential proof'
      };
    }
  }

  /**
   * Generate and verify key ownership proof
   */
  async proveAndVerifyKeyOwnership(
    privateKey: string,
    message?: string
  ): Promise<{
    success: boolean;
    proof?: SchnorrProof;
    verified?: boolean;
    message?: string;
  }> {
    try {
      // Never cache key ownership proofs for security
      
      // Generate key proof
      const proof = await zkp.proveKeyOwnership(privateKey, message);

      // Verify with server
      const verified = await this.verifyWithServer('key', proof);

      return {
        success: true,
        proof,
        verified: verified.verified,
        message: verified.message
      };
    } catch (error) {
      console.error('Key proof error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to generate key proof'
      };
    }
  }

  /**
   * Verify proof with server
   */
  private async verifyWithServer(
    proofType: 'age' | 'credential' | 'key',
    proof: any,
    requirements?: any
  ): Promise<{ verified: boolean; message: string }> {
    try {
      const response = await fetch(this.config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Include cookies
        body: JSON.stringify({
          proofType,
          proof,
          requirements
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'Verification failed');
      }

      return {
        verified: result.verified || false,
        message: result.message || 'Verification complete'
      };
    } catch (error) {
      console.error('Server verification error:', error);
      throw error;
    }
  }

  /**
   * Get proof from cache
   */
  private getFromCache(key: string): any | null {
    if (!this.config.cacheProofs) return null;

    const cached = this.proofCache.get(key);
    if (!cached) return null;

    if (Date.now() > cached.expires) {
      this.proofCache.delete(key);
      return null;
    }

    return cached.proof;
  }

  /**
   * Add proof to cache
   */
  private addToCache(key: string, proof: any): void {
    if (!this.config.cacheProofs) return;

    this.proofCache.set(key, {
      proof,
      expires: Date.now() + this.config.proofExpiry
    });

    // Clean up expired entries
    this.cleanupCache();
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, value] of this.proofCache.entries()) {
      if (now > value.expires) {
        this.proofCache.delete(key);
      }
    }
  }

  /**
   * Clear all cached proofs
   */
  clearCache(): void {
    this.proofCache.clear();
  }
}

// Export singleton instance
export const zkpClient = new ZKPClient();

// React Hook for ZKP
export function useZKP(config?: ZKPClientConfig) {
  const client = config ? new ZKPClient(config) : zkpClient;

  return {
    proveAge: client.proveAndVerifyAge.bind(client),
    proveCredential: client.proveAndVerifyCredential.bind(client),
    proveKeyOwnership: client.proveAndVerifyKeyOwnership.bind(client),
    clearCache: client.clearCache.bind(client)
  };
}

// Example usage in React component:
/*
import { useZKP } from '@/lib/zkp/zkp-client';

function AgeVerificationComponent() {
  const { proveAge } = useZKP();
  
  const handleVerify = async () => {
    const result = await proveAge(1990, 18);
    if (result.success && result.verified) {
      console.log('Age verified!');
    }
  };
  
  return <button onClick={handleVerify}>Verify Age (18+)</button>;
}
*/