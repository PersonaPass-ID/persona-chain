# PersonaPass Smart Contracts

## Overview

PersonaPass smart contracts provide decentralized identity verification and credential management on Ethereum and EVM-compatible chains.

## Contract Architecture

### Core Contracts

1. **PersonaPassIdentity.sol**
   - Main identity registry
   - DID management
   - Credential issuance
   - Zero-knowledge proof verification

2. **CredentialRegistry.sol**
   - Stores credential metadata
   - Manages credential types
   - Handles revocation

3. **ZKVerifier.sol**
   - Verifies zero-knowledge proofs on-chain
   - Age verification without revealing birthdate
   - Membership proofs

4. **PersonaPassGovernance.sol**
   - DAO governance for protocol upgrades
   - Parameter adjustments
   - Treasury management

## Setup

```bash
# Install Hardhat
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox

# Initialize Hardhat
npx hardhat init

# Install OpenZeppelin
npm install @openzeppelin/contracts @openzeppelin/contracts-upgradeable
```

## Testing

```bash
# Run tests
npx hardhat test

# Coverage
npx hardhat coverage

# Gas report
REPORT_GAS=true npx hardhat test
```

## Deployment

```bash
# Deploy to local
npx hardhat run scripts/deploy.js

# Deploy to testnet
npx hardhat run scripts/deploy.js --network sepolia

# Verify contracts
npx hardhat verify --network sepolia DEPLOYED_CONTRACT_ADDRESS
```

## Security

All contracts follow:
- OpenZeppelin security patterns
- Checks-Effects-Interactions pattern
- Reentrancy guards
- Access control
- Pausable functionality

## Audit Status

⚠️ Contracts pending security audit before mainnet deployment