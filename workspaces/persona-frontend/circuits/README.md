# PersonaPass Zero-Knowledge Circuits

Privacy-preserving age verification using zk-SNARKs.

## Overview

PersonaPass uses zero-knowledge proofs to verify age without revealing personal information. Users prove they are over a certain age without disclosing their actual birthdate.

## How It Works

1. **User provides**: Birthdate (private)
2. **Circuit proves**: Age >= Minimum Age
3. **Output**: Boolean (true/false)
4. **Privacy**: Birthdate never leaves user's device

## Building the Circuits

### Prerequisites

```bash
# Install circom compiler
npm install -g circom

# Install snarkjs
npm install -g snarkjs
```

### Compilation

```bash
# Run the build script
./build.sh
```

This will:
- Compile the circom circuit to WASM
- Generate proving and verification keys
- Output files to `/public/circuits/`

## Circuit Details

### age_verification.circom

**Inputs:**
- `birthdate` (private): Unix timestamp in milliseconds
- `currentDate` (private): Unix timestamp in milliseconds  
- `minimumAgeInDays` (public): Required age in days

**Output:**
- `isOverMinimumAge`: 1 if age requirement met, 0 otherwise

### Security

- Uses Groth16 proving system
- 128-bit security level
- Trusted setup required (use ceremony for production)

## Integration Example

```javascript
import { groth16 } from 'snarkjs';

// Generate proof
const { proof, publicSignals } = await groth16.fullProve(
  {
    birthdate: Date.parse('1990-01-01'),
    currentDate: Date.now(),
    minimumAgeInDays: 21 * 365
  },
  '/circuits/age_verification.wasm',
  '/circuits/age_verification_0001.zkey'
);

// Verify proof
const vKey = await fetch('/circuits/verification_key.json').then(r => r.json());
const isValid = await groth16.verify(vKey, publicSignals, proof);
```

## Production Considerations

1. **Trusted Setup**: Run a proper ceremony with multiple contributors
2. **Circuit Audit**: Have circuits audited by ZK experts
3. **Key Management**: Secure storage of proving keys
4. **Performance**: Consider using plonk for faster verification

## Testing

```bash
# Generate test proof
node test/generate_proof.js

# Verify test proof
node test/verify_proof.js
```