# PersonaChain - Decentralized Identity Blockchain

The PersonaChain blockchain built with Cosmos SDK for decentralized identity management, verifiable credentials, and zero-knowledge proofs.

## Features

- **DID Module**: Create and manage decentralized identifiers (DIDs)
- **Credential Module**: Issue and store verifiable credentials
- **ZK Proof Module**: Generate and verify zero-knowledge proofs
- **Oracle Module**: External data integration
- **Registry Module**: Identity registry management
- **Revocation Module**: Credential revocation mechanisms
- **Schema Module**: Credential schema management
- **Token Module**: PERSONA token economics

## Architecture

PersonaChain is built on Cosmos SDK v0.50 with the following custom modules:

- `x/did` - Decentralized identifier management
- `x/credential` - Verifiable credentials
- `x/zkproof` - Zero-knowledge proof verification
- `x/oracle` - External data feeds
- `x/registry` - Identity registry
- `x/revocation` - Credential revocation
- `x/schema` - Schema management
- `x/token` - Token economics

## Production Deployment

PersonaChain is deployed on AWS EC2 with the following configuration:

- **Instance Type**: t3.large (2 vCPU, 8 GB RAM)
- **Storage**: 100GB EBS gp3
- **Network**: Public subnet with security groups for RPC, API, and P2P
- **Services**: RPC (26657), API (1317), gRPC (9090), P2P (26656)

### Current Production Node

```
RPC: http://54.84.36.16:26657
API: http://54.84.36.16:1317
gRPC: 54.84.36.16:9090
Chain ID: personachain-1
Denom: upersona
```

## Building

```bash
# Install Go 1.21+
# Clone repository
git clone https://github.com/PersonaPass-ID/persona-chain.git
cd persona-chain

# Build binary
go mod download
go build -o personachaind ./cmd/personachaind

# Initialize node
./personachaind init mynode --chain-id personachain-1

# Start node
./personachaind start
```

## Development

```bash
# Install Ignite CLI
curl https://get.ignite.com/cli | bash

# Serve development chain
ignite chain serve

# Add new modules
ignite scaffold module modulename

# Generate types
ignite generate proto-go
```

## Testing

```bash
# Run tests
go test ./...

# Test specific module
go test ./x/did/...
```

## License

MIT License - See LICENSE file for details.

## Production Status

✅ **DEPLOYED**: Production PersonaChain running on AWS EC2
✅ **MODULES**: All DID/VC/ZK modules implemented and working
✅ **INTEGRATION**: Connected to PersonaPass wallet frontend
🔄 **TESTING**: Complete end-to-end testing in progress