# PersonaChain Identity Module

## Overview

The Identity module provides decentralized identity (DID) management and verifiable credential functionality for PersonaChain.

## Features

- **DID Management**: Create and manage W3C-compliant DIDs
- **Verifiable Credentials**: Issue, verify, and revoke credentials
- **Zero-Knowledge Proofs**: Privacy-preserving verification
- **On-chain Storage**: Immutable credential records

## Messages

### MsgCreateIdentity
Creates a new DID for a wallet address.

```protobuf
message MsgCreateIdentity {
  string creator = 1;
  string did_document = 2;
}
```

### MsgIssueCredential
Issues a verifiable credential to a DID.

```protobuf
message MsgIssueCredential {
  string issuer = 1;
  string subject_did = 2;
  string credential_type = 3;
  string credential_data = 4;
  int64 expiry = 5;
}
```

### MsgVerifyCredential
Verifies a credential with zero-knowledge proof.

```protobuf
message MsgVerifyCredential {
  string verifier = 1;
  string credential_id = 2;
  string proof_data = 3;
}
```

### MsgRevokeCredential
Revokes an issued credential.

```protobuf
message MsgRevokeCredential {
  string issuer = 1;
  string credential_id = 2;
  string reason = 3;
}
```

## Queries

- `QueryIdentity`: Get DID document by address
- `QueryCredentials`: List credentials for a DID
- `QueryCredential`: Get specific credential details
- `QueryVerifications`: Get verification history

## Events

- `EventIdentityCreated`
- `EventCredentialIssued`
- `EventCredentialVerified`
- `EventCredentialRevoked`

## Parameters

- `max_credentials_per_did`: Maximum credentials per identity (default: 100)
- `credential_fee`: Fee for credential operations (default: 1 PERSONA)
- `verification_fee`: Fee for verification (default: 0.1 PERSONA)