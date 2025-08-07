/**
 * PersonaPass React Provider
 * 
 * React context provider for PersonaPass SDK integration.
 * Provides SDK instance and state management for React applications.
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { PersonaPassSDK } from '../PersonaPassSDK';
import {
  PersonaPassConfig,
  CredentialStatus,
  EventHandler,
  EventType,
  ProofResponse,
  VerificationResult
} from '../types';

interface PersonaPassContextValue {
  sdk: PersonaPassSDK | null;
  isInitialized: boolean;
  credentialStatus: CredentialStatus | null;
  isLoading: boolean;
  error: string | null;
  // Helper methods
  generateProof: PersonaPassSDK['generateProof'];
  verifyProof: PersonaPassSDK['verifyProof'];
  getCredentialStatus: PersonaPassSDK['getCredentialStatus'];
  startVerification: PersonaPassSDK['startVerification'];
  // Event subscription
  on: PersonaPassSDK['on'];
  off: PersonaPassSDK['off'];
}

const PersonaPassContext = createContext<PersonaPassContextValue | null>(null);

interface PersonaPassProviderProps {
  config: PersonaPassConfig;
  walletAddress?: string;
  autoLoadStatus?: boolean;
  children: ReactNode;
}

export const PersonaPassProvider: React.FC<PersonaPassProviderProps> = ({
  config,
  walletAddress,
  autoLoadStatus = true,
  children
}) => {
  const [sdk, setSdk] = useState<PersonaPassSDK | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [credentialStatus, setCredentialStatus] = useState<CredentialStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize SDK
  useEffect(() => {
    try {
      const sdkInstance = new PersonaPassSDK(config);
      setSdk(sdkInstance);
      setIsInitialized(true);
      setError(null);

      // Subscribe to SDK events
      const handleError: EventHandler = (event) => {
        setError(event.data.error?.message || 'An error occurred');
        setIsLoading(false);
      };

      const handleProofGenerated: EventHandler = (event) => {
        setIsLoading(false);
      };

      const handleVerificationComplete: EventHandler = (event) => {
        setIsLoading(false);
      };

      sdkInstance.on('error', handleError);
      sdkInstance.on('proof_generated', handleProofGenerated);
      sdkInstance.on('verification_completed', handleVerificationComplete);

      return () => {
        sdkInstance.off('error', handleError);
        sdkInstance.off('proof_generated', handleProofGenerated);
        sdkInstance.off('verification_completed', handleVerificationComplete);
      };

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize PersonaPass SDK');
      setIsInitialized(false);
    }
  }, [config]);

  // Auto-load credential status
  useEffect(() => {
    if (sdk && walletAddress && autoLoadStatus) {
      loadCredentialStatus(walletAddress);
    }
  }, [sdk, walletAddress, autoLoadStatus]);

  const loadCredentialStatus = async (address: string) => {
    if (!sdk) return;

    setIsLoading(true);
    setError(null);

    try {
      const status = await sdk.getCredentialStatus(address);
      setCredentialStatus(status);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load credential status');
    } finally {
      setIsLoading(false);
    }
  };

  // Wrapped SDK methods with loading states
  const generateProof: PersonaPassSDK['generateProof'] = async (request, options) => {
    if (!sdk) throw new Error('PersonaPass SDK not initialized');
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await sdk.generateProof(request, options);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Proof generation failed';
      setError(error);
      throw err;
    }
  };

  const verifyProof: PersonaPassSDK['verifyProof'] = async (proofId) => {
    if (!sdk) throw new Error('PersonaPass SDK not initialized');
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await sdk.verifyProof(proofId);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Proof verification failed';
      setError(error);
      throw err;
    }
  };

  const getCredentialStatus: PersonaPassSDK['getCredentialStatus'] = async (address) => {
    if (!sdk) throw new Error('PersonaPass SDK not initialized');
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await sdk.getCredentialStatus(address);
      setCredentialStatus(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to get credential status';
      setError(error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const startVerification: PersonaPassSDK['startVerification'] = async (address, redirectUrl) => {
    if (!sdk) throw new Error('PersonaPass SDK not initialized');
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await sdk.startVerification(address, redirectUrl);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to start verification';
      setError(error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const on: PersonaPassSDK['on'] = (eventType, handler) => {
    if (!sdk) throw new Error('PersonaPass SDK not initialized');
    return sdk.on(eventType, handler);
  };

  const off: PersonaPassSDK['off'] = (eventType, handler) => {
    if (!sdk) throw new Error('PersonaPass SDK not initialized');
    return sdk.off(eventType, handler);
  };

  const contextValue: PersonaPassContextValue = {
    sdk,
    isInitialized,
    credentialStatus,
    isLoading,
    error,
    generateProof,
    verifyProof,
    getCredentialStatus,
    startVerification,
    on,
    off
  };

  return (
    <PersonaPassContext.Provider value={contextValue}>
      {children}
    </PersonaPassContext.Provider>
  );
};

export const usePersonaPassContext = (): PersonaPassContextValue => {
  const context = useContext(PersonaPassContext);
  if (!context) {
    throw new Error('usePersonaPassContext must be used within a PersonaPassProvider');
  }
  return context;
};