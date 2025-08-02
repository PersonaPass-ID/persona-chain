// React Hook for Wallet DID Recognition
// Provides easy-to-use hook for components

import { useState, useEffect } from 'react';
import { AuthRouter, AuthRouteResult } from '../lib/wallet-did-recognition';

export interface UseWalletDIDRecognitionResult {
  routeResult: AuthRouteResult | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useWalletDIDRecognition = (): UseWalletDIDRecognitionResult => {
  const [routeResult, setRouteResult] = useState<AuthRouteResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const determineRoute = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const authRouter = new AuthRouter();
      const result = await authRouter.determineUserRoute();
      
      setRouteResult(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to determine user route';
      setError(errorMessage);
      console.error('❌ Wallet DID recognition failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    determineRoute();
  }, []);

  const refresh = async () => {
    await determineRoute();
  };

  return {
    routeResult,
    isLoading,
    error,
    refresh
  };
};