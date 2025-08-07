/**
 * PersonaPass SDK React Integration Examples
 * 
 * Complete examples showing how to integrate PersonaPass with React applications.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  PersonaPassProvider,
  usePersonaPass,
  IdentityVerificationButton,
  ProofResponse,
  VerificationResult
} from '@personapass/sdk';

// Example 1: Basic App Setup with Provider
export function App() {
  return (
    <PersonaPassProvider 
      config={{
        apiKey: process.env.REACT_APP_PERSONAPASS_API_KEY || 'your-api-key',
        network: 'testnet',
        debug: true,
        theme: {
          primaryColor: '#6366f1',
          secondaryColor: '#8b5cf6',
          borderRadius: '12px',
          fontFamily: 'Inter, sans-serif'
        }
      }}
      walletAddress="0x742d35Cc6634C0532925a3b8D2C7C51b45e89C9f"
      autoLoadStatus={true}
    >
      <div className="app">
        <header className="app-header">
          <h1>PersonaPass Integration Demo</h1>
          <p>Privacy-preserving identity verification</p>
        </header>
        
        <main>
          <AgeVerificationDemo />
          <JurisdictionProofDemo />
          <AntiSybilDemo />
          <ProofManagementDemo />
        </main>
      </div>
    </PersonaPassProvider>
  );
}

// Example 2: Age Verification Component
export function AgeVerificationDemo() {
  const [proofResult, setProofResult] = useState<ProofResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { generateAgeProof, hasCredentials, isLoading } = usePersonaPass();

  const handleAgeVerification = async () => {
    try {
      setError(null);
      const proof = await generateAgeProof(
        '0x742d35Cc6634C0532925a3b8D2C7C51b45e89C9f',
        18,
        'Verify 18+ for DeFi trading'
      );
      setProofResult(proof);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Age verification failed');
    }
  };

  return (
    <div className="demo-section">
      <h2>🎂 Age Verification</h2>
      <p>Prove you're over 18 without revealing your exact age.</p>
      
      {!hasCredentials ? (
        <div className="warning">
          ⚠️ You need to verify your identity first before generating proofs.
        </div>
      ) : (
        <>
          <button 
            onClick={handleAgeVerification}
            disabled={isLoading}
            className="verify-button"
          >
            {isLoading ? 'Generating Proof...' : 'Prove I\'m 18+'}
          </button>
          
          {error && (
            <div className="error">❌ {error}</div>
          )}
          
          {proofResult && (
            <div className="proof-result">
              <h3>✅ Proof Generated Successfully!</h3>
              <div className="proof-details">
                <p><strong>Proof ID:</strong> {proofResult.proofId}</p>
                <p><strong>Type:</strong> {proofResult.proof.type}</p>
                <p><strong>Generated:</strong> {new Date(proofResult.proof.metadata.timestamp).toLocaleString()}</p>
                <div className="proof-actions">
                  <a href={proofResult.downloadUrl} target="_blank" rel="noopener noreferrer">
                    Download Proof
                  </a>
                  <a href={proofResult.verificationUrl} target="_blank" rel="noopener noreferrer">
                    Verify Proof
                  </a>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Example 3: Using the Pre-built Button Component
export function JurisdictionProofDemo() {
  const [proofs, setProofs] = useState<ProofResponse[]>([]);

  const handleProofGenerated = useCallback((proof: ProofResponse) => {
    setProofs(prev => [...prev, proof]);
  }, []);

  const handleError = useCallback((error: string) => {
    console.error('Jurisdiction proof error:', error);
    alert(`Error: ${error}`);
  }, []);

  return (
    <div className="demo-section">
      <h2>🌍 Jurisdiction Compliance</h2>
      <p>Prove you're in an allowed region without revealing your exact location.</p>
      
      <IdentityVerificationButton
        proofType="jurisdiction-proof"
        walletAddress="0x742d35Cc6634C0532925a3b8D2C7C51b45e89C9f"
        purpose="NFT marketplace compliance"
        constraints={{ allowedRegions: ['US', 'EU', 'UK', 'CA'] }}
        onProofGenerated={handleProofGenerated}
        onError={handleError}
        variant="primary"
        size="medium"
        showStatus={true}
      >
        Verify Location Compliance
      </IdentityVerificationButton>

      {proofs.length > 0 && (
        <div className="proofs-list">
          <h3>Generated Proofs ({proofs.length})</h3>
          {proofs.map((proof, index) => (
            <div key={proof.proofId} className="proof-item">
              <span>#{index + 1} - {proof.proofId}</span>
              <a href={proof.verificationUrl} target="_blank" rel="noopener noreferrer">
                Verify
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Example 4: Anti-Sybil Protection with Custom Logic
export function AntiSybilDemo() {
  const [isUnique, setIsUnique] = useState<boolean | null>(null);
  const [campaignId, setCampaignId] = useState('dao-vote-2024');
  const { generateAntiSybilProof, verifyProof, isLoading, error } = usePersonaPass();

  const handleUniquePersonVerification = async () => {
    try {
      // Generate anti-Sybil proof
      const proof = await generateAntiSybilProof(
        '0x742d35Cc6634C0532925a3b8D2C7C51b45e89C9f',
        campaignId,
        `Unique person verification for ${campaignId}`
      );

      // Immediately verify the proof
      const verification = await verifyProof(proof.proofId);
      setIsUnique(verification.valid);

    } catch (err) {
      console.error('Anti-Sybil verification failed:', err);
      setIsUnique(false);
    }
  };

  return (
    <div className="demo-section">
      <h2>👤 Anti-Sybil Protection</h2>
      <p>Prove you're a unique person without revealing your identity.</p>
      
      <div className="input-group">
        <label htmlFor="campaign-id">Campaign ID:</label>
        <input
          id="campaign-id"
          type="text"
          value={campaignId}
          onChange={(e) => setCampaignId(e.target.value)}
          placeholder="Enter campaign identifier"
        />
      </div>

      <button 
        onClick={handleUniquePersonVerification}
        disabled={isLoading || !campaignId}
        className="verify-button"
      >
        {isLoading ? 'Verifying Uniqueness...' : 'Prove I\'m Unique'}
      </button>

      {error && (
        <div className="error">❌ {error}</div>
      )}

      {isUnique !== null && (
        <div className={`result ${isUnique ? 'success' : 'failure'}`}>
          {isUnique ? (
            <>✅ Unique person verified! You can participate in {campaignId}.</>
          ) : (
            <>❌ Uniqueness verification failed. You may have already participated.</>
          )}
        </div>
      )}
    </div>
  );
}

// Example 5: Proof Management Dashboard
export function ProofManagementDemo() {
  const [proofs, setProofs] = useState<ProofResponse[]>([]);
  const [verificationResults, setVerificationResults] = useState<Record<string, VerificationResult>>({});
  const { 
    sdk, 
    credentialStatus,
    isLoading,
    onProofGenerated,
    onProofVerified 
  } = usePersonaPass();

  // Listen for proof events
  useEffect(() => {
    const unsubscribeGenerated = onProofGenerated((event) => {
      setProofs(prev => [...prev, event.data.proof]);
    });

    const unsubscribeVerified = onProofVerified((event) => {
      const { result } = event.data;
      setVerificationResults(prev => ({
        ...prev,
        [result.proofType]: result
      }));
    });

    return () => {
      unsubscribeGenerated();
      unsubscribeVerified();
    };
  }, [onProofGenerated, onProofVerified]);

  const verifyProof = async (proofId: string) => {
    if (!sdk) return;
    
    try {
      const result = await sdk.verifyProof(proofId);
      setVerificationResults(prev => ({
        ...prev,
        [proofId]: result
      }));
    } catch (error) {
      console.error('Proof verification failed:', error);
    }
  };

  const clearProofs = () => {
    setProofs([]);
    setVerificationResults({});
  };

  return (
    <div className="demo-section">
      <h2>📊 Proof Management Dashboard</h2>
      
      {/* Credential Status */}
      <div className="status-panel">
        <h3>Identity Status</h3>
        {credentialStatus ? (
          <div>
            <p><strong>Has Credentials:</strong> {credentialStatus.hasCredentials ? '✅ Yes' : '❌ No'}</p>
            <p><strong>Credential Types:</strong> {credentialStatus.credentialTypes.join(', ') || 'None'}</p>
            <p><strong>Last Verified:</strong> {credentialStatus.lastVerified || 'Never'}</p>
          </div>
        ) : (
          <p>Loading credential status...</p>
        )}
      </div>

      {/* Generated Proofs */}
      <div className="proofs-panel">
        <div className="panel-header">
          <h3>Generated Proofs ({proofs.length})</h3>
          {proofs.length > 0 && (
            <button onClick={clearProofs} className="clear-button">
              Clear All
            </button>
          )}
        </div>

        {proofs.length === 0 ? (
          <p>No proofs generated yet. Use the verification buttons above to create proofs.</p>
        ) : (
          <div className="proofs-table">
            {proofs.map((proof, index) => {
              const verification = verificationResults[proof.proofId];
              
              return (
                <div key={proof.proofId} className="proof-row">
                  <div className="proof-info">
                    <div className="proof-id">#{index + 1} - {proof.proofId.substring(0, 12)}...</div>
                    <div className="proof-type">{proof.proof.type}</div>
                    <div className="proof-timestamp">
                      {new Date(proof.proof.metadata.timestamp).toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="proof-actions">
                    <button
                      onClick={() => verifyProof(proof.proofId)}
                      disabled={isLoading}
                      className="verify-small-button"
                    >
                      {verification ? (verification.valid ? '✅' : '❌') : 'Verify'}
                    </button>
                    
                    <a 
                      href={proof.downloadUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="download-link"
                    >
                      📥
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// Example 6: Custom Hook for Specific Use Cases
export function useCustomAgeVerification(minAge: number = 18) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isAgeVerified, setIsAgeVerified] = useState<boolean | null>(null);
  const [proofId, setProofId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { generateAgeProof, verifyProof } = usePersonaPass();

  const verifyAge = useCallback(async (walletAddress: string) => {
    setIsVerifying(true);
    setError(null);
    setIsAgeVerified(null);

    try {
      // Generate age proof
      const proof = await generateAgeProof(
        walletAddress,
        minAge,
        `Age verification (${minAge}+)`
      );

      // Verify the proof
      const verification = await verifyProof(proof.proofId);

      setProofId(proof.proofId);
      setIsAgeVerified(verification.valid);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Age verification failed');
      setIsAgeVerified(false);
    } finally {
      setIsVerifying(false);
    }
  }, [generateAgeProof, verifyProof, minAge]);

  const reset = useCallback(() => {
    setIsVerifying(false);
    setIsAgeVerified(null);
    setProofId(null);
    setError(null);
  }, []);

  return {
    verifyAge,
    reset,
    isVerifying,
    isAgeVerified,
    proofId,
    error
  };
}

// Example 7: Component Using Custom Hook
export function CustomAgeVerificationDemo() {
  const [walletAddress] = useState('0x742d35Cc6634C0532925a3b8D2C7C51b45e89C9f');
  const [minAge, setMinAge] = useState(21);
  
  const { 
    verifyAge, 
    reset, 
    isVerifying, 
    isAgeVerified, 
    proofId, 
    error 
  } = useCustomAgeVerification(minAge);

  return (
    <div className="demo-section">
      <h2>🎯 Custom Age Verification Hook</h2>
      <p>Example of creating custom hooks for specific use cases.</p>

      <div className="input-group">
        <label htmlFor="min-age">Minimum Age:</label>
        <input
          id="min-age"
          type="number"
          value={minAge}
          onChange={(e) => setMinAge(parseInt(e.target.value) || 18)}
          min="13"
          max="99"
        />
      </div>

      <button
        onClick={() => verifyAge(walletAddress)}
        disabled={isVerifying}
        className="verify-button"
      >
        {isVerifying ? 'Verifying Age...' : `Verify I'm ${minAge}+`}
      </button>

      {error && (
        <div className="error">❌ {error}</div>
      )}

      {isAgeVerified !== null && (
        <div className={`result ${isAgeVerified ? 'success' : 'failure'}`}>
          {isAgeVerified ? (
            <>
              ✅ Age verification successful!
              {proofId && <div className="proof-id-small">Proof ID: {proofId}</div>}
            </>
          ) : (
            <>❌ Age verification failed</>
          )}
        </div>
      )}

      {(isAgeVerified !== null || error) && (
        <button onClick={reset} className="reset-button">
          Reset
        </button>
      )}
    </div>
  );
}