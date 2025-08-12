# PersonaPass SDK

Privacy-preserving identity verification infrastructure for Web3 applications. Generate and verify zero-knowledge proofs for age verification, jurisdiction compliance, accredited investor status, and anti-Sybil protection without revealing personal information.

## Features

🔐 **Zero-Knowledge Proofs** - Verify identity attributes without revealing personal data  
🌐 **Multi-Chain Support** - Works across Ethereum, Polygon, Arbitrum, and more  
⚡ **Easy Integration** - Simple SDK with React components and vanilla JS support  
🎯 **Proof Types** - Age verification, jurisdiction, accredited investor, anti-Sybil  
🔒 **Privacy First** - No personal data stored or transmitted  
📦 **Production Ready** - Real Circom circuits and trusted setup  

## Quick Start

### Installation

```bash
npm install @personapass/sdk
# or
yarn add @personapass/sdk
```

### Basic Usage

```typescript
import { PersonaPassSDK } from '@personapass/sdk';

// Initialize SDK
const personaPass = new PersonaPassSDK({
  apiKey: 'your-api-key',
  network: 'mainnet' // or 'testnet', 'development'
});

// Generate age verification proof
const proof = await personaPass.generateProof({
  type: 'age-verification',
  walletAddress: '0x742d35Cc6634C0532925a3b8D2C7C51b45e89C9f',
  purpose: 'Verify 18+ for DeFi platform',
  constraints: { minAge: 18 }
});

console.log('Proof generated:', proof.proofId);
```

### React Integration

```tsx
import React from 'react';
import { PersonaPassProvider, usePersonaPass, IdentityVerificationButton } from '@personapass/sdk';

// Wrap your app with the provider
function App() {
  return (
    <PersonaPassProvider config={{ apiKey: 'your-api-key' }}>
      <MyComponent />
    </PersonaPassProvider>
  );
}

// Use the hook in your components
function MyComponent() {
  const { generateAgeProof, hasCredentials } = usePersonaPass();
  
  return (
    <div>
      <h2>Age Verification</h2>
      {hasCredentials ? (
        <IdentityVerificationButton
          proofType="age-verification"
          walletAddress="0x742d35Cc6634C0532925a3b8D2C7C51b45e89C9f"
          onProofGenerated={(proof) => console.log('Proof:', proof)}
        >
          Prove I'm 18+
        </IdentityVerificationButton>
      ) : (
        <p>Please verify your identity first</p>
      )}
    </div>
  );
}
```

### Vanilla JavaScript Widget

```html
<!DOCTYPE html>
<html>
<head>
  <title>PersonaPass Integration</title>
</head>
<body>
  <div id="verification-widget"></div>
  
  <script type="module">
    import { PersonaPassSDK, PersonaPassWidget } from 'https://unpkg.com/@personapass/sdk';
    
    const sdk = new PersonaPassSDK({
      apiKey: 'your-api-key',
      network: 'mainnet'
    });
    
    const widget = new PersonaPassWidget(sdk, {
      container: '#verification-widget',
      onProofGenerated: (proof) => {
        console.log('Proof generated!', proof);
      }
    });
  </script>
</body>
</html>
```

## Proof Types

### Age Verification
Prove you meet minimum age requirements without revealing your exact age or birth date.

```typescript
const ageProof = await personaPass.generateProof({
  type: 'age-verification',
  walletAddress: userAddress,
  purpose: 'Access 18+ content',
  constraints: { minAge: 18 }
});
```

### Jurisdiction Proof
Prove you're located in allowed regions without revealing your exact location.

```typescript
const jurisdictionProof = await personaPass.generateProof({
  type: 'jurisdiction-proof',
  walletAddress: userAddress,
  purpose: 'Comply with regional restrictions',
  constraints: { allowedRegions: ['US', 'EU', 'UK'] }
});
```

### Accredited Investor
Prove investment eligibility without revealing net worth or financial details.

```typescript
const investorProof = await personaPass.generateProof({
  type: 'accredited-investor',
  walletAddress: userAddress,
  purpose: 'Participate in private sale',
  constraints: { minNetWorth: 1000000 }
});
```

### Anti-Sybil Protection
Prove unique personhood without revealing identity or personal information.

```typescript
const sybilProof = await personaPass.generateProof({
  type: 'anti-sybil',
  walletAddress: userAddress,
  purpose: 'Prevent multiple accounts',
  constraints: { uniquenessSet: 'campaign-123' }
});
```

## API Reference

### PersonaPassSDK

Main SDK class for generating and verifying proofs.

#### Constructor

```typescript
new PersonaPassSDK(config: PersonaPassConfig)
```

**PersonaPassConfig:**
- `apiKey` (string) - Your PersonaPass API key
- `baseUrl` (string, optional) - Custom API base URL
- `network` ('mainnet' | 'testnet' | 'development') - Network environment
- `debug` (boolean, optional) - Enable debug logging
- `theme` (PersonaPassTheme, optional) - Custom styling for widgets

#### Methods

##### generateProof(request, options?)
Generate a zero-knowledge proof for identity verification.

```typescript
generateProof(
  request: ProofRequest,
  options?: ProofGenerationOptions
): Promise<ProofResponse>
```

##### verifyProof(proofId)
Verify a zero-knowledge proof.

```typescript
verifyProof(proofId: string): Promise<VerificationResult>
```

##### getCredentialStatus(walletAddress)
Get user's credential verification status.

```typescript
getCredentialStatus(walletAddress: string): Promise<CredentialStatus>
```

##### startVerification(walletAddress, redirectUrl?)
Start identity verification flow.

```typescript
startVerification(
  walletAddress: string,
  redirectUrl?: string
): Promise<string>
```

### React Components

#### PersonaPassProvider
Context provider for React applications.

```tsx
<PersonaPassProvider config={personaPassConfig}>
  {children}
</PersonaPassProvider>
```

#### IdentityVerificationButton
Ready-to-use verification button component.

```tsx
<IdentityVerificationButton
  proofType="age-verification"
  walletAddress="0x..."
  purpose="Age verification"
  onProofGenerated={(proof) => handleProof(proof)}
  variant="primary"
  size="medium"
/>
```

#### usePersonaPass Hook
Main React hook for PersonaPass integration.

```tsx
const {
  generateProof,
  verifyProof,
  hasCredentials,
  isLoading,
  error
} = usePersonaPass(walletAddress);
```

### PersonaPassWidget
Embeddable vanilla JavaScript widget.

```typescript
new PersonaPassWidget(sdk, {
  container: '#widget-container',
  onProofGenerated: (proof) => console.log(proof),
  onError: (error) => console.error(error)
});
```

## Error Handling

The SDK provides comprehensive error handling with specific error codes:

```typescript
try {
  const proof = await personaPass.generateProof(request);
} catch (error) {
  if (error.code === 'PROOF_GENERATION_FAILED') {
    console.log('Proof generation failed:', error.message);
  } else if (error.code === 'CREDENTIAL_NOT_FOUND') {
    console.log('User needs to verify identity first');
  }
}
```

Common error codes:
- `PROOF_GENERATION_FAILED` - ZK proof generation failed
- `VERIFICATION_FAILED` - Proof verification failed  
- `CREDENTIAL_NOT_FOUND` - No verified credentials for wallet
- `INVALID_CONSTRAINTS` - Invalid proof constraints provided
- `NETWORK_ERROR` - API network error

## Events

Subscribe to SDK events for real-time updates:

```typescript
// Listen for proof generation events
personaPass.on('proof_generated', (event) => {
  console.log('Proof generated:', event.data.proof);
});

// Listen for verification events
personaPass.on('proof_verified', (event) => {
  console.log('Verification result:', event.data.result);
});

// Listen for errors
personaPass.on('error', (event) => {
  console.error('SDK error:', event.data.error);
});
```

## Configuration

### Network Configuration

```typescript
// Production
const mainnetConfig = {
  apiKey: 'your-api-key',
  network: 'mainnet',
  baseUrl: 'https://api.personapass.me'
};

// Testing
const testnetConfig = {
  apiKey: 'your-test-key',
  network: 'testnet',
  baseUrl: 'https://testnet-api.personapass.me'
};

// Development
const devConfig = {
  apiKey: 'dev-key',
  network: 'development',
  baseUrl: 'http://localhost:3000',
  debug: true
};
```

### Theme Customization

```typescript
const customTheme = {
  primaryColor: '#6366f1',
  secondaryColor: '#8b5cf6',
  backgroundColor: '#ffffff',
  textColor: '#1f2937',
  borderRadius: '12px',
  fontFamily: 'Inter, sans-serif'
};

const personaPass = new PersonaPassSDK({
  apiKey: 'your-api-key',
  theme: customTheme
});
```

## Security

### Production Security Checklist

✅ **API Key Security** - Store API keys in environment variables, never in client code  
✅ **HTTPS Only** - All API calls use HTTPS in production  
✅ **Input Validation** - All inputs are validated and sanitized  
✅ **Rate Limiting** - Built-in rate limiting prevents abuse  
✅ **Trusted Setup** - Production circuits use proper trusted setup ceremony  
✅ **Audit Ready** - All cryptographic operations are auditable  

### Privacy Guarantees

- **Zero Knowledge** - Personal data never leaves user's device
- **Unlinkability** - Proofs cannot be linked to identity
- **Selective Disclosure** - Only prove what's necessary
- **Forward Secrecy** - Past proofs remain private even if keys are compromised

## Examples

### DeFi Platform Integration

```typescript
// Age verification for DeFi trading
async function verifyTraderAge(walletAddress: string) {
  try {
    const proof = await personaPass.generateProof({
      type: 'age-verification',
      walletAddress,
      purpose: 'DeFi trading access',
      constraints: { minAge: 18 }
    });
    
    // Store proof for compliance
    await storeComplianceProof(proof);
    return true;
  } catch (error) {
    console.error('Age verification failed:', error);
    return false;
  }
}
```

### DAO Governance

```typescript
// Anti-Sybil protection for DAO voting
async function verifyVoterUniqueness(walletAddress: string, daoId: string) {
  const proof = await personaPass.generateProof({
    type: 'anti-sybil',
    walletAddress,
    purpose: `DAO ${daoId} voting`,
    constraints: { 
      uniquenessSet: `dao-${daoId}`,
      confidenceThreshold: 90 
    }
  });
  
  return proof.proof.publicInputs.isValid;
}
```

### NFT Marketplace

```typescript
// Jurisdiction compliance for NFT trading
async function verifyTradeCompliance(walletAddress: string, nftContract: string) {
  const proof = await personaPass.generateProof({
    type: 'jurisdiction-proof',
    walletAddress,
    purpose: `NFT trading: ${nftContract}`,
    constraints: { 
      allowedRegions: ['US', 'EU', 'UK', 'CA'] 
    }
  });
  
  // Verify proof before allowing trade
  const verification = await personaPass.verifyProof(proof.proofId);
  return verification.valid;
}
```

## Migration Guide

### From v0.x to v1.0

Major changes in v1.0:
- Real zero-knowledge proofs replace mocks
- New React hooks and components
- Improved error handling
- Updated API endpoints

```typescript
// v0.x (deprecated)
const mockProof = await personaPass.generateMockProof(type, wallet);

// v1.0 (current)
const realProof = await personaPass.generateProof({
  type,
  walletAddress: wallet,
  purpose: 'Identity verification'
});
```

## Troubleshooting

### Common Issues

**"SDK not initialized"**
```typescript
// Make sure to initialize the SDK before use
const personaPass = new PersonaPassSDK({ apiKey: 'your-key' });
```

**"No verified credentials"**
```typescript
// User needs to complete identity verification first
const verificationUrl = await personaPass.startVerification(walletAddress);
window.open(verificationUrl, '_blank');
```

**"Proof generation timeout"**
```typescript
// Increase timeout for complex proofs
const proof = await personaPass.generateProof(request, { 
  timeout: 30000 // 30 seconds
});
```

### Debug Mode

Enable debug logging to troubleshoot issues:

```typescript
const personaPass = new PersonaPassSDK({
  apiKey: 'your-key',
  debug: true
});
```

## Support

- **Documentation**: https://docs.personapass.me
- **API Reference**: https://api.personapass.me/docs  
- **Discord**: https://discord.gg/personapass
- **Email**: developers@personapass.me
- **GitHub Issues**: https://github.com/persona-hq/persona-frontend/issues

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

---

**PersonaPass** - Privacy-first identity verification for the decentralized web.