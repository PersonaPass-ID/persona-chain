/**
 * Cross-Platform Bridge React Hook
 * 
 * Provides React integration for cross-platform identity bridging functionality.
 * Handles bridging credentials across blockchain networks and traditional identity systems.
 */

'use client';

import { useState, useCallback } from 'react';
import { PlatformType, PlatformCredential, UniversalCredential, BridgeResult } from '@/lib/cross-platform-bridge';

interface BridgePlatform {
  type: PlatformType;
  name: string;
  category: 'blockchain' | 'identity_provider' | 'web2_integration' | 'other';
  status: 'active' | 'available' | 'unavailable';
  capabilities: string[];
  authentication: {
    type: string;
    description: string;
  };
  features: string[];
}

interface BridgeState {
  isLoading: boolean;
  error: string | null;
  result: BridgeResult | null;
}

interface VerificationState {
  isLoading: boolean;
  error: string | null;
  results: Record<PlatformType, boolean> | null;
}

interface ResolveState {
  isLoading: boolean;
  error: string | null;
  credentials: UniversalCredential[] | null;
  summary: {
    totalCredentials: number;
    credentialTypes: string[];
    platforms: string[];
    platformCount: number;
    confidenceScore: number;
  } | null;
}

interface PlatformsState {
  isLoading: boolean;
  error: string | null;
  platforms: BridgePlatform[] | null;
  platformsByCategory: Record<string, BridgePlatform[]> | null;
}

export function useCrossPlatformBridge() {
  // Bridge operation state
  const [bridgeState, setBridgeState] = useState<BridgeState>({
    isLoading: false,
    error: null,
    result: null
  });

  // Verification state
  const [verificationState, setVerificationState] = useState<VerificationState>({
    isLoading: false,
    error: null,
    results: null
  });

  // Identity resolution state
  const [resolveState, setResolveState] = useState<ResolveState>({
    isLoading: false,
    error: null,
    credentials: null,
    summary: null
  });

  // Platforms state
  const [platformsState, setPlatformsState] = useState<PlatformsState>({
    isLoading: false,
    error: null,
    platforms: null,
    platformsByCategory: null
  });

  /**
   * Bridge a credential to other platforms
   */
  const bridgeCredential = useCallback(async (
    credential: PlatformCredential,
    targetPlatforms: PlatformType[]
  ): Promise<BridgeResult | null> => {
    setBridgeState({ isLoading: true, error: null, result: null });

    try {
      const response = await fetch('/api/bridge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          credential,
          targetPlatforms
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Bridge operation failed');
      }

      setBridgeState({
        isLoading: false,
        error: null,
        result: data.data
      });

      return data.data;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setBridgeState({
        isLoading: false,
        error: errorMessage,
        result: null
      });
      return null;
    }
  }, []);

  /**
   * Verify a credential across multiple platforms
   */
  const verifyCredentialAcrossPlatforms = useCallback(async (
    credentialId: string,
    platforms?: PlatformType[]
  ): Promise<Record<PlatformType, boolean> | null> => {
    setVerificationState({ isLoading: true, error: null, results: null });

    try {
      const params = new URLSearchParams({ credentialId });
      if (platforms) {
        params.append('platforms', platforms.join(','));
      }

      const response = await fetch(`/api/bridge/verify?${params}`, {
        method: 'GET'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Verification failed');
      }

      setVerificationState({
        isLoading: false,
        error: null,
        results: data.data.verificationResults
      });

      return data.data.verificationResults;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setVerificationState({
        isLoading: false,
        error: errorMessage,
        results: null
      });
      return null;
    }
  }, []);

  /**
   * Resolve universal identity across platforms
   */
  const resolveIdentity = useCallback(async (
    identifier: string,
    includeExpired: boolean = false
  ): Promise<UniversalCredential[] | null> => {
    setResolveState({ 
      isLoading: true, 
      error: null, 
      credentials: null, 
      summary: null 
    });

    try {
      const response = await fetch('/api/bridge/resolve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          identifier,
          includeExpired
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Identity resolution failed');
      }

      setResolveState({
        isLoading: false,
        error: null,
        credentials: data.data.credentials,
        summary: data.data.summary
      });

      return data.data.credentials;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setResolveState({
        isLoading: false,
        error: errorMessage,
        credentials: null,
        summary: null
      });
      return null;
    }
  }, []);

  /**
   * Get all supported platforms
   */
  const getSupportedPlatforms = useCallback(async (): Promise<BridgePlatform[] | null> => {
    setPlatformsState({ 
      isLoading: true, 
      error: null, 
      platforms: null, 
      platformsByCategory: null 
    });

    try {
      const response = await fetch('/api/bridge/platforms', {
        method: 'GET'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get platforms');
      }

      setPlatformsState({
        isLoading: false,
        error: null,
        platforms: data.data.platforms,
        platformsByCategory: data.data.platformsByCategory
      });

      return data.data.platforms;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setPlatformsState({
        isLoading: false,
        error: errorMessage,
        platforms: null,
        platformsByCategory: null
      });
      return null;
    }
  }, []);

  /**
   * Clear all states
   */
  const clearStates = useCallback(() => {
    setBridgeState({ isLoading: false, error: null, result: null });
    setVerificationState({ isLoading: false, error: null, results: null });
    setResolveState({ 
      isLoading: false, 
      error: null, 
      credentials: null, 
      summary: null 
    });
  }, []);

  /**
   * Get platform status summary
   */
  const getPlatformSummary = useCallback(() => {
    if (!platformsState.platforms) return null;

    const total = platformsState.platforms.length;
    const active = platformsState.platforms.filter(p => p.status === 'active').length;
    const blockchain = platformsState.platforms.filter(p => p.category === 'blockchain').length;
    const identityProviders = platformsState.platforms.filter(p => p.category === 'identity_provider').length;

    return {
      total,
      active,
      blockchain,
      identityProviders,
      availability: Math.round((active / total) * 100)
    };
  }, [platformsState.platforms]);

  return {
    // Bridge operations
    bridgeCredential,
    bridgeState,
    
    // Verification operations
    verifyCredentialAcrossPlatforms,
    verificationState,
    
    // Identity resolution
    resolveIdentity,
    resolveState,
    
    // Platform management
    getSupportedPlatforms,
    platformsState,
    getPlatformSummary,
    
    // Utilities
    clearStates,
    
    // Computed states
    isAnyLoading: bridgeState.isLoading || verificationState.isLoading || 
                  resolveState.isLoading || platformsState.isLoading,
    hasAnyError: !!(bridgeState.error || verificationState.error || 
                   resolveState.error || platformsState.error)
  };
}