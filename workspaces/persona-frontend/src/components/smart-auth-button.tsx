// Smart Authentication Button - Automatically routes based on wallet DID status
// Replaces the "Get Started" button with intelligent routing

'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWalletDIDRecognition } from '../hooks/useWalletDIDRecognition';
import { AuthRouter, DIDInfo } from '../lib/wallet-did-recognition';

interface SmartAuthButtonProps {
  className?: string;
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'white';
  size?: 'sm' | 'md' | 'lg';
}

export const SmartAuthButton: React.FC<SmartAuthButtonProps> = ({
  className = '',
  children,
  variant = 'primary',
  size = 'md'
}) => {
  const router = useRouter();
  const { isLoading, routeResult, error, refresh } = useWalletDIDRecognition();
  const [isProcessing, setIsProcessing] = useState(false);
  const [multipleDIDs, setMultipleDIDs] = useState<DIDInfo[]>([]);
  const [showDIDSelector, setShowDIDSelector] = useState(false);

  // Button styling based on variant and size
  const getButtonClasses = () => {
    const baseClasses = 'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variantClasses = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
      secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
      outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white focus:ring-blue-500',
      white: 'bg-white text-black hover:bg-gray-100 focus:ring-gray-500'
    };

    const sizeClasses = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-6 py-3 text-base',
      lg: 'px-8 py-4 text-lg'
    };

    return `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;
  };

  // Handle the main button click
  const handleSmartAuth = async () => {
    try {
      setIsProcessing(true);

      if (!routeResult) {
        // Force a recheck if no route result
        await refresh();
        return;
      }

      // Handle different routing scenarios
      switch (routeResult.route) {
        case 'signup':
          router.push('/auth/signup');
          break;

        case 'login':
          router.push('/auth/login');
          break;

        case 'dashboard':
          // Log analytics for returning user
          logAnalytics('returning_user_login', {
            did: routeResult.didInfo?.did,
            lastUsed: routeResult.didInfo?.lastUsed
          });
          router.push('/dashboard');
          break;

        case 'onboarding':
          router.push('/onboarding');
          break;

        default:
          router.push('/auth/signup');
      }

    } catch (error) {
      console.error('Error during smart auth:', error);
      // Fallback to signup on error
      router.push('/auth/signup');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle multiple DIDs scenario
  const handleMultipleDIDs = async (address: string) => {
    try {
      const authRouter = new AuthRouter();
      const dids = await authRouter.handleMultipleDIDs(address);
      if (dids.length > 1) {
        setMultipleDIDs(dids);
        setShowDIDSelector(true);
      }
    } catch (error) {
      console.error('Error handling multiple DIDs:', error);
    }
  };

  // Select a specific DID from multiple options
  const selectDID = async (didInfo: DIDInfo, address: string) => {
    try {
      setIsProcessing(true);
      const authRouter = new AuthRouter();
      const result = await authRouter.verifyAndRoute(didInfo.did, address);
      
      if (result.route === 'dashboard') {
        router.push('/dashboard');
      } else {
        router.push('/auth/login');
      }
    } catch (error) {
      console.error('Error selecting DID:', error);
      router.push('/auth/signup');
    } finally {
      setIsProcessing(false);
      setShowDIDSelector(false);
    }
  };

  // Analytics logging
  const logAnalytics = (event: string, data: any) => {
    try {
      // Log to your analytics service
      if (window.gtag) {
        window.gtag('event', event, data);
      }
      
      // Log to your backend
      fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, data, timestamp: new Date().toISOString() })
      }).catch(console.error);
    } catch (error) {
      console.error('Analytics logging failed:', error);
    }
  };

  // Get button text based on current state
  const getButtonText = () => {
    if (children) return children;
    
    if (isLoading) return 'Checking account...';
    if (isProcessing) return 'Redirecting...';
    if (error) return 'Try again';
    
    if (!routeResult) return 'Get Started';
    
    switch (routeResult.route) {
      case 'signup':
        return 'Create Account';
      case 'login':
        return 'Sign In';
      case 'dashboard':
        return 'Go to Dashboard';
      case 'onboarding':
        return 'Complete Setup';
      default:
        return 'Get Started';
    }
  };

  // Get status message for user feedback
  const getStatusMessage = () => {
    if (error) return `Error: ${error}`;
    if (routeResult?.message) return routeResult.message;
    return null;
  };

  return (
    <div className="flex flex-col items-center space-y-2">
      {/* Main Smart Auth Button */}
      <button
        onClick={handleSmartAuth}
        disabled={isLoading || isProcessing}
        className={getButtonClasses()}
        aria-label={isLoading ? 'Checking wallet status' : getButtonText().toString()}
      >
        {(isLoading || isProcessing) && (
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {getButtonText()}
      </button>

      {/* Status Message */}
      {getStatusMessage() && (
        <p className="text-sm text-gray-600 text-center max-w-xs">
          {getStatusMessage()}
        </p>
      )}

      {/* DID Selection Modal (for multiple DIDs edge case) */}
      {showDIDSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Multiple Accounts Found</h3>
            <p className="text-gray-600 mb-4">
              You have multiple PersonaPass accounts. Please select which one to use:
            </p>
            
            <div className="space-y-2">
              {multipleDIDs.map((didInfo, index) => (
                <button
                  key={didInfo.did}
                  onClick={() => selectDID(didInfo, didInfo.address)}
                  className="w-full text-left p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={isProcessing}
                >
                  <div className="font-medium">Account {index + 1}</div>
                  <div className="text-sm text-gray-500">
                    Created: {new Date(didInfo.createdAt).toLocaleDateString()}
                  </div>
                  <div className="text-sm text-gray-500">
                    Last used: {new Date(didInfo.lastUsed).toLocaleDateString()}
                  </div>
                  {didInfo.hasCredentials && (
                    <div className="text-xs text-green-600">✓ Has credentials</div>
                  )}
                </button>
              ))}
            </div>

            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={() => setShowDIDSelector(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                onClick={() => router.push('/auth/signup')}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                disabled={isProcessing}
              >
                Create New Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Debug Info (only in development) */}
      {process.env.NODE_ENV === 'development' && routeResult && (
        <details className="mt-4 text-xs text-gray-500">
          <summary className="cursor-pointer">Debug Info</summary>
          <pre className="mt-2 p-2 bg-gray-100 rounded">
            {JSON.stringify(routeResult, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
};

// Alternative export for different use cases
export const SmartGetStartedButton: React.FC<Omit<SmartAuthButtonProps, 'children'>> = (props) => (
  <SmartAuthButton {...props}>Get Started</SmartAuthButton>
);

export const SmartLoginButton: React.FC<Omit<SmartAuthButtonProps, 'children'>> = (props) => (
  <SmartAuthButton {...props} variant="outline">Sign In</SmartAuthButton>
);

export default SmartAuthButton;