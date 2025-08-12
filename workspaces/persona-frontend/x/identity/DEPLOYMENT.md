# PersonaChain Identity Module Deployment Guide

## Overview

This guide explains how to deploy the Identity module to your PersonaChain blockchain.

## Prerequisites

- PersonaChain source code
- Go 1.21+
- Protocol Buffers compiler (protoc)
- Access to PersonaChain validator node

## Deployment Steps

### 1. Copy Module to PersonaChain

```bash
# From this directory
cp -r ../x/identity ~/persona-chain/x/
```

### 2. Update PersonaChain app.go

Add the identity module to your chain's `app.go`:

```go
import (
    // ... other imports
    identity "github.com/PersonaPass-ID/persona-chain/x/identity"
    identitykeeper "github.com/PersonaPass-ID/persona-chain/x/identity/keeper"
    identitytypes "github.com/PersonaPass-ID/persona-chain/x/identity/types"
)

// In App struct, add:
type App struct {
    // ... other keepers
    IdentityKeeper identitykeeper.Keeper
}

// In NewApp function:
func NewApp(...) *App {
    // ... other initialization
    
    // Add identity store key
    keys := sdk.NewKVStoreKeys(
        // ... other keys
        identitytypes.StoreKey,
    )
    
    // Initialize identity keeper
    app.IdentityKeeper = identitykeeper.NewKeeper(
        appCodec,
        keys[identitytypes.StoreKey],
        keys[identitytypes.MemStoreKey],
        app.GetSubspace(identitytypes.ModuleName),
    )
    
    // Add to module manager
    app.mm = module.NewManager(
        // ... other modules
        identity.NewAppModule(appCodec, app.IdentityKeeper, app.AccountKeeper, app.BankKeeper),
    )
    
    // Set module order
    app.mm.SetOrderBeginBlockers(
        // ... other modules
        identitytypes.ModuleName,
    )
    
    app.mm.SetOrderEndBlockers(
        // ... other modules
        identitytypes.ModuleName,
    )
    
    app.mm.SetOrderInitGenesis(
        // ... other modules
        identitytypes.ModuleName,
    )
}
```

### 3. Register Module Codec

In `app/encoding.go` or similar:

```go
import (
    identitytypes "github.com/PersonaPass-ID/persona-chain/x/identity/types"
)

func MakeEncodingConfig() params.EncodingConfig {
    // ... existing code
    
    // Register identity interfaces
    identitytypes.RegisterInterfaces(interfaceRegistry)
    
    return encodingConfig
}
```

### 4. Update Genesis

Add identity module to your genesis file:

```json
{
  "app_state": {
    "identity": {
      "params": {
        "max_credentials_per_did": 100,
        "credential_fee": {
          "denom": "upersona",
          "amount": "1000000"
        },
        "verification_fee": {
          "denom": "upersona",
          "amount": "100000"
        }
      },
      "identities": [],
      "credentials": [],
      "revocations": [],
      "verifications": []
    }
  }
}
```

### 5. Build and Deploy

```bash
# In PersonaChain directory
make install

# Test the module
personachaind tx identity create-identity '{"@context":["https://www.w3.org/ns/did/v1"],"id":"did:persona:test123"}' \
  --from validator \
  --chain-id personachain-1 \
  --fees 1000upersona
```

### 6. Verify Deployment

```bash
# Query module params
personachaind query identity params

# Check if identity creation works
personachaind query identity identity <your-address>
```

## Frontend Integration

The frontend is already configured to interact with the identity module through:
- `/src/lib/personachain/client.ts` - CosmJS client
- `/src/hooks/usePersonaChain.ts` - React hook
- `/src/components/PersonaChainStatus.tsx` - Status component

## Module Endpoints

### REST API
- GET `/personachain/identity/identity/{address}` - Query identity
- GET `/personachain/identity/credential/{credential_id}` - Query credential
- GET `/personachain/identity/credentials/{subject_did}` - List credentials
- GET `/personachain/identity/verifications/{credential_id}` - List verifications
- GET `/personachain/identity/params` - Query module parameters

### CLI Commands
```bash
# Transaction commands
personachaind tx identity create-identity [did-document] --from [key]
personachaind tx identity issue-credential [subject-did] [type] [data] [expiry] --from [key]
personachaind tx identity verify-credential [credential-id] [proof] --from [key]
personachaind tx identity revoke-credential [credential-id] [reason] --from [key]

# Query commands
personachaind query identity identity [address]
personachaind query identity credential [credential-id]
personachaind query identity credentials [subject-did]
personachaind query identity verifications [credential-id]
personachaind query identity params
```

## Troubleshooting

### Module not found error
Ensure the module is properly imported in `app.go` and the import path matches your module structure.

### Genesis validation error
Check that all required fields in the genesis state are properly formatted.

### Transaction fails
- Ensure the account has enough PERSONA tokens for fees
- Check that the DID document is valid JSON
- Verify the chain ID matches

## Security Considerations

1. **Key Management**: Store validator keys securely
2. **Access Control**: Only authorized issuers should issue credentials
3. **Fee Configuration**: Set appropriate fees to prevent spam
4. **Backup**: Regular backups of chain data

## Next Steps

1. Deploy smart contract integration
2. Set up monitoring for the identity module
3. Configure frontend to use mainnet RPC
4. Implement credential verification UI