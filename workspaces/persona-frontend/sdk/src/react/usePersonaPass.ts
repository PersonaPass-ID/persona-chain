/**
 * PersonaPass React Hook
 * 
 * Main React hook for PersonaPass integration.
 * Provides access to SDK methods and state management.
 */

import { useEffect, useState, useCallback } from 'react';
import { usePersonaPassContext } from './PersonaPassProvider';
import {
  ProofRequest,
  ProofResponse,
  VerificationResult,
  CredentialStatus,
  ProofGenerationOptions,
  ProofType,
  EventHandler
} from '../types';

interface UsePersonaPassReturn {
  // SDK instance and status
  sdk: ReturnType<typeof usePersonaPassContext>['sdk'];
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Credential status
  credentialStatus: CredentialStatus | null;
  hasCredentials: boolean;
  
  // Core methods
  generateProof: (request: ProofRequest, options?: ProofGenerationOptions) => Promise<ProofResponse>;
  verifyProof: (proofId: string) => Promise<VerificationResult>;
  refreshCredentialStatus: (walletAddress: string) => Promise<void>;
  startVerification: (walletAddress: string, redirectUrl?: string) => Promise<string>;
  
  // Convenience methods for specific proof types
  generateAgeProof: (walletAddress: string, minAge: number, purpose?: string) => Promise<ProofResponse>;
  generateJurisdictionProof: (walletAddress: string, allowedRegions: string[], purpose?: string) => Promise<ProofResponse>;
  generateAccreditedInvestorProof: (walletAddress: string, minNetWorth?: number, purpose?: string) => Promise<ProofResponse>;
  generateAntiSybilProof: (walletAddress: string, uniquenessSet?: string, purpose?: string) => Promise<ProofResponse>;
  
  // Event handling
  onProofGenerated: (handler: EventHandler) => () => void;
  onProofVerified: (handler: EventHandler) => () => void;
  onError: (handler: EventHandler) => () => void;
  
  // Utility methods
  clearError: () => void;
}

export const usePersonaPass = (walletAddress?: string): UsePersonaPassReturn => {
  const context = usePersonaPassContext();
  const [localError, setLocalError] = useState<string | null>(null);
  
  const {
    sdk,
    isInitialized,
    credentialStatus,
    isLoading,
    error: contextError,
    generateProof: contextGenerateProof,
    verifyProof: contextVerifyProof,
    getCredentialStatus,
    startVerification: contextStartVerification,
    on,
    off
  } = context;

  // Combined error state (context error + local error)
  const error = contextError || localError;

  // Derived state
  const hasCredentials = credentialStatus?.hasCredentials || false;

  // Clear error method
  const clearError = useCallback(() => {
    setLocalError(null);
  }, []);

  // Refresh credential status
  const refreshCredentialStatus = useCallback(async (address: string) => {
    if (!sdk) {
      setLocalError('PersonaPass SDK not initialized');
      return;
    }
    
    try {
      await getCredentialStatus(address);
      setLocalError(null);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to refresh credential status');
    }
  }, [sdk, getCredentialStatus]);

  // Enhanced generate proof with error handling
  const generateProof = useCallback(async (
    request: ProofRequest,
    options?: ProofGenerationOptions
  ): Promise<ProofResponse> => {
    if (!sdk) {
      throw new Error('PersonaPass SDK not initialized');
    }

    try {
      const result = await contextGenerateProof(request, options);
      setLocalError(null);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Proof generation failed';
      setLocalError(errorMessage);
      throw err;
    }
  }, [sdk, contextGenerateProof]);

  // Enhanced verify proof with error handling
  const verifyProof = useCallback(async (proofId: string): Promise<VerificationResult> => {
    if (!sdk) {
      throw new Error('PersonaPass SDK not initialized');
    }

    try {
      const result = await contextVerifyProof(proofId);
      setLocalError(null);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Proof verification failed';
      setLocalError(errorMessage);
      throw err;
    }
  }, [sdk, contextVerifyProof]);

  // Enhanced start verification with error handling
  const startVerification = useCallback(async (
    address: string,
    redirectUrl?: string
  ): Promise<string> => {
    if (!sdk) {
      throw new Error('PersonaPass SDK not initialized');
    }

    try {
      const result = await contextStartVerification(address, redirectUrl);
      setLocalError(null);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start verification';
      setLocalError(errorMessage);
      throw err;
    }
  }, [sdk, contextStartVerification]);

  // Convenience methods for specific proof types
  const generateAgeProof = useCallback(async (
    address: string,
    minAge: number,
    purpose = 'Age verification'
  ): Promise<ProofResponse> => {
    return generateProof({
      type: 'age-verification',
      walletAddress: address,
      purpose,
      constraints: { minAge }
    });
  }, [generateProof]);

  const generateJurisdictionProof = useCallback(async (
    address: string,
    allowedRegions: string[],
    purpose = 'Jurisdiction verification'
  ): Promise<ProofResponse> => {
    return generateProof({
      type: 'jurisdiction-proof',
      walletAddress: address,
      purpose,
      constraints: { allowedRegions }
    });
  }, [generateProof]);

  const generateAccreditedInvestorProof = useCallback(async (
    address: string,
    minNetWorth = 1000000,
    purpose = 'Accredited investor verification'
  ): Promise<ProofResponse> => {
    return generateProof({
      type: 'accredited-investor',
      walletAddress: address,
      purpose,
      constraints: { minNetWorth }
    });
  }, [generateProof]);

  const generateAntiSybilProof = useCallback(async (
    address: string,
    uniquenessSet = 'global',
    purpose = 'Proof of personhood'
  ): Promise<ProofResponse> => {
    return generateProof({
      type: 'anti-sybil',
      walletAddress: address,
      purpose,
      constraints: { uniquenessSet }
    });
  }, [generateProof]);

  // Event handling with cleanup
  const onProofGenerated = useCallback((handler: EventHandler) => {
    if (!sdk) return () => {};
    
    on('proof_generated', handler);
    return () => off('proof_generated', handler);
  }, [sdk, on, off]);

  const onProofVerified = useCallback((handler: EventHandler) => {
    if (!sdk) return () => {};
    
    on('proof_verified', handler);
    return () => off('proof_verified', handler);
  }, [sdk, on, off]);

  const onError = useCallback((handler: EventHandler) => {
    if (!sdk) return () => {};
    
    on('error', handler);
    return () => off('error', handler);
  }, [sdk, on, off]);

  // Auto-refresh credential status when wallet changes
  useEffect(() => {
    if (walletAddress && isInitialized) {
      refreshCredentialStatus(walletAddress);
    }
  }, [walletAddress, isInitialized, refreshCredentialStatus]);

  return {
    // SDK instance and status
    sdk,
    isInitialized,
    isLoading,
    error,
    
    // Credential status
    credentialStatus,
    hasCredentials,
    
    // Core methods
    generateProof,
    verifyProof,
    refreshCredentialStatus,
    startVerification,
    
    // Convenience methods
    generateAgeProof,
    generateJurisdictionProof,
    generateAccreditedInvestorProof,
    generateAntiSybilProof,
    
    // Event handling
    onProofGenerated,
    onProofVerified,
    onError,
    
    // Utility methods
    clearError
  };
};