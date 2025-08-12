/**
 * Identity Verification Button Component
 * 
 * A ready-to-use React component for triggering identity verification.
 * Handles wallet connection, credential status, and proof generation.
 */

import React, { useState, useCallback } from 'react';
import { usePersonaPass } from './usePersonaPass';
import { ProofType, ProofResponse, PersonaPassTheme } from '../types';

interface IdentityVerificationButtonProps {
  /** Wallet address of the user */
  walletAddress?: string;
  /** Type of proof to generate */
  proofType: ProofType;
  /** Button text */
  children?: React.ReactNode;
  /** Custom styling */
  theme?: PersonaPassTheme;
  /** Additional CSS classes */
  className?: string;
  /** Button styling */
  style?: React.CSSProperties;
  /** Disabled state */
  disabled?: boolean;
  /** Loading state override */
  loading?: boolean;
  /** Purpose of the proof */
  purpose?: string;
  /** Proof constraints */
  constraints?: Record<string, any>;
  /** Callback when proof is generated */
  onProofGenerated?: (proof: ProofResponse) => void;
  /** Callback when verification starts */
  onVerificationStart?: () => void;
  /** Callback for errors */
  onError?: (error: string) => void;
  /** Whether to show detailed status */
  showStatus?: boolean;
  /** Custom button variant */
  variant?: 'primary' | 'secondary' | 'outline';
  /** Button size */
  size?: 'small' | 'medium' | 'large';
}

export const IdentityVerificationButton: React.FC<IdentityVerificationButtonProps> = ({
  walletAddress,
  proofType,
  children,
  theme = {},
  className = '',
  style = {},
  disabled = false,
  loading: loadingOverride,
  purpose,
  constraints,
  onProofGenerated,
  onVerificationStart,
  onError,
  showStatus = false,
  variant = 'primary',
  size = 'medium'
}) => {
  const {
    isInitialized,
    isLoading,
    error,
    credentialStatus,
    hasCredentials,
    generateProof,
    startVerification,
    clearError
  } = usePersonaPass(walletAddress);

  const [localLoading, setLocalLoading] = useState(false);
  const [proofResult, setProofResult] = useState<ProofResponse | null>(null);

  // Combined loading state
  const isGenerating = loadingOverride || isLoading || localLoading;

  // Handle proof generation
  const handleGenerateProof = useCallback(async () => {
    if (!walletAddress) {
      onError?.('Wallet address is required');
      return;
    }

    if (!hasCredentials) {
      // Start verification flow
      try {
        onVerificationStart?.();
        const verificationUrl = await startVerification(walletAddress);
        window.open(verificationUrl, '_blank');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to start verification';
        onError?.(errorMessage);
      }
      return;
    }

    // Generate proof
    try {
      setLocalLoading(true);
      clearError();

      const proof = await generateProof({
        type: proofType,
        walletAddress,
        purpose: purpose || `${proofType} verification`,
        constraints: constraints || getDefaultConstraints(proofType)
      });

      setProofResult(proof);
      onProofGenerated?.(proof);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate proof';
      onError?.(errorMessage);
    } finally {
      setLocalLoading(false);
    }
  }, [
    walletAddress,
    hasCredentials,
    proofType,
    purpose,
    constraints,
    generateProof,
    startVerification,
    onProofGenerated,
    onVerificationStart,
    onError,
    clearError
  ]);

  // Get default constraints based on proof type
  const getDefaultConstraints = (type: ProofType): Record<string, any> => {
    switch (type) {
      case 'age-verification':
        return { minAge: 18 };
      case 'jurisdiction-proof':
        return { allowedRegions: ['US', 'EU'] };
      case 'accredited-investor':
        return { minNetWorth: 1000000 };
      case 'anti-sybil':
        return { uniquenessSet: 'global' };
      default:
        return {};
    }
  };

  // Get button text based on state
  const getButtonText = (): React.ReactNode => {
    if (children) return children;

    if (isGenerating) {
      return (
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Spinner color="currentColor" />
          Generating Proof...
        </span>
      );
    }

    if (proofResult) {
      return '✅ Proof Generated';
    }

    if (!walletAddress) {
      return 'Connect Wallet';
    }

    if (!hasCredentials) {
      return 'Verify Identity';
    }

    const typeLabels: Record<ProofType, string> = {
      'age-verification': 'Prove Age',
      'jurisdiction-proof': 'Prove Location',
      'accredited-investor': 'Prove Accreditation',
      'anti-sybil': 'Prove Personhood',
      'selective-disclosure': 'Generate Proof'
    };

    return typeLabels[proofType] || 'Generate Proof';
  };

  // Get button styles
  const getButtonStyles = (): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      padding: size === 'small' ? '8px 16px' : size === 'large' ? '16px 32px' : '12px 24px',
      fontSize: size === 'small' ? '14px' : size === 'large' ? '18px' : '16px',
      fontWeight: '600',
      borderRadius: theme.borderRadius || '8px',
      border: 'none',
      cursor: disabled || isGenerating ? 'not-allowed' : 'pointer',
      transition: 'all 0.2s ease',
      fontFamily: theme.fontFamily || 'inherit',
      opacity: disabled || isGenerating ? 0.6 : 1,
      ...style
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseStyles,
          background: theme.primaryColor || '#4299e1',
          color: 'white',
        };
      case 'secondary':
        return {
          ...baseStyles,
          background: theme.secondaryColor || '#e2e8f0',
          color: theme.textColor || '#1a202c',
        };
      case 'outline':
        return {
          ...baseStyles,
          background: 'transparent',
          color: theme.primaryColor || '#4299e1',
          border: `2px solid ${theme.primaryColor || '#4299e1'}`,
        };
      default:
        return baseStyles;
    }
  };

  // Don't render if SDK not initialized
  if (!isInitialized) {
    return null;
  }

  return (
    <div className={`personapass-verification-button ${className}`}>
      <button
        style={getButtonStyles()}
        onClick={handleGenerateProof}
        disabled={disabled || isGenerating}
        type="button"
      >
        {getButtonText()}
      </button>

      {showStatus && (
        <div style={{ marginTop: '12px', fontSize: '14px' }}>
          {error && (
            <div style={{ color: '#e53e3e', marginBottom: '8px' }}>
              ❌ {error}
            </div>
          )}
          
          {credentialStatus && (
            <div style={{ color: theme.textColor || '#718096' }}>
              Status: {hasCredentials ? '✅ Verified' : '⚠️ Not Verified'}
            </div>
          )}
          
          {proofResult && (
            <div style={{ color: '#38a169', marginTop: '8px' }}>
              ✅ Proof generated successfully!
              <div style={{ marginTop: '4px' }}>
                <a 
                  href={proofResult.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ 
                    color: theme.primaryColor || '#4299e1',
                    textDecoration: 'underline',
                    marginRight: '12px'
                  }}
                >
                  Download
                </a>
                <a 
                  href={proofResult.verificationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ 
                    color: theme.primaryColor || '#4299e1',
                    textDecoration: 'underline'
                  }}
                >
                  Verify
                </a>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Simple spinner component
const Spinner: React.FC<{ color?: string; size?: number }> = ({ 
  color = '#000', 
  size = 16 
}) => (
  <div
    style={{
      width: size,
      height: size,
      border: `2px solid transparent`,
      borderTop: `2px solid ${color}`,
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
    }}
  />
);

// Add keyframes for spinner
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}