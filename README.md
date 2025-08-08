<<<<<<< HEAD
# Persona Identity Platform

A cutting-edge digital identity verification platform built with Next.js 15, featuring zero-knowledge proofs, Web3 wallet integration, and industry-leading onboarding flows.

## 🚀 Features

### 🔐 Multi-Authentication System
- **Web3 Wallets**: MetaMask, WalletConnect, Coinbase Wallet, Safe, and more
- **Email Verification**: Traditional email-based authentication
- **Phone Verification**: SMS-based authentication for mobile users

### 🛡️ Zero-Knowledge Security
- **Privacy-First**: Personal data never leaves your device
- **BIP-39 Seed Phrases**: Industry-standard recovery phrase generation
- **End-to-End Encryption**: AES-256 encryption for all data transmission
- **Verifiable Credentials**: First VC generated upon onboarding completion

### 🎨 Modern UI/UX
- **Framer Motion Animations**: Smooth, professional animations throughout
- **Responsive Design**: Optimized for desktop and mobile
- **Company Logos**: Authentic wallet provider logos (MetaMask, Coinbase, etc.)
- **Progress Tracking**: Real-time onboarding progress visualization

### 🌐 Industry Applications
- Financial Services (KYC/AML compliance)
- Healthcare (HIPAA-compliant identity verification)
- Education (Academic credential verification)
- Government (Digital voting and citizen services)
- Real Estate (Property transaction verification)
- Entertainment (Age verification for platforms)

## 🛠️ Tech Stack

- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS v4 with PostCSS
- **Animations**: Framer Motion
- **Web3**: Wagmi for wallet connections
- **TypeScript**: Full type safety
- **Blockchain**: Multi-chain support (Ethereum, Base, Optimism, Arbitrum, Polygon)

## 🚀 Getting Started

### Frontend Application

```bash
cd workspaces/persona-frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### Full Infrastructure Setup

See [workspaces/persona-frontend/INFRASTRUCTURE.md](workspaces/persona-frontend/INFRASTRUCTURE.md) for complete deployment guide including:
- AWS services integration
- Digital Ocean blockchain node setup
- Vercel deployment with personapass.xyz domain
- Production security hardening

## 📁 Project Structure

```
workspaces/
├── persona-frontend/        # Next.js frontend application
├── issuer-service/         # Backend issuer service
├── persona-wallet/         # Wallet integration
└── ...
```

## 🌐 Live Demo

Visit [personapass.xyz](https://personapass.xyz) to see the live application.
=======
# PersonaChain - Production Blockchain Infrastructure

**Decentralized Identity Verification Blockchain**  
Built on Cosmos SDK v0.50.8 with Tendermint consensus

## 🌟 Overview

PersonaChain is a specialized blockchain for decentralized identity (DID) management and verifiable credentials (VC). It provides secure, private identity verification using zero-knowledge proofs while maintaining full user control over personal data.

## 🏗️ Architecture

- **Blockchain**: Cosmos SDK v0.50.8 with Tendermint BFT consensus
- **Network**: Single validator production setup with comprehensive security hardening
- **Consensus**: 67% Byzantine fault tolerance ready (expandable to 3+ validators)
- **Identity Standard**: W3C DID and Verifiable Credentials specification

## 🛡️ Production Security Features

### SSL/HTTPS Encryption
- Self-signed certificates with 4096-bit RSA encryption
- HTTPS redirect enforced for all connections
- TLS 1.2+ required for all communications

### AWS WAF Protection
- DDoS protection and rate limiting (1000 requests per 5 minutes)
- SQL injection and XSS attack prevention
- IP-based blocking for malicious traffic
- CloudWatch metrics integration

### Monitoring & Observability
- **Prometheus**: Metrics collection and storage
- **Grafana**: Real-time dashboards and visualization
- **AlertManager**: Critical alert notifications
- **Health Checks**: Automated validator status monitoring

### Backup & Recovery
- Automated EBS snapshots every 6 hours
- 7-day snapshot retention policy
- Cross-AZ backup replication
- Disaster recovery procedures documented

## 🚀 Quick Start

### Prerequisites
- AWS CLI configured with appropriate permissions
- Terraform v1.0+ installed
- Basic understanding of blockchain concepts

### Deployment

1. **Clone Repository**
   ```bash
   git clone https://github.com/PersonaPass-ID/persona-chain.git
   cd persona-chain
   ```

2. **Initialize Infrastructure**
   ```bash
   cd aws-infrastructure
   terraform init
   terraform plan
   terraform apply
   ```

3. **Start Validator**
   ```bash
   # SSH into validator instance
   ssh -i persona-keypair.pem ubuntu@<validator-ip>
   
   # Start PersonaChain
   sudo systemctl start personachain
   sudo systemctl enable personachain
   ```

4. **Verify Operation**
   ```bash
   # Check validator status
   curl https://personachain-rpc-lb-1471567419.us-east-1.elb.amazonaws.com/status
   
   # View latest blocks
   curl https://personachain-rpc-lb-1471567419.us-east-1.elb.amazonaws.com/blockchain
   ```

## 📡 Network Information

### MainNet Production
- **Chain ID**: `personachain-1`
- **RPC Endpoint**: `https://personachain-rpc-lb-1471567419.us-east-1.elb.amazonaws.com`
- **REST API**: `https://personachain-rpc-lb-1471567419.us-east-1.elb.amazonaws.com:1317`
- **WebSocket**: `wss://personachain-rpc-lb-1471567419.us-east-1.elb.amazonaws.com/websocket`

### Network Stats
- **Block Time**: ~6 seconds
- **Validators**: 1 (expandable to 3+ for full BFT)
- **Max Validators**: 100
- **Unbonding Period**: 21 days
- **Governance**: On-chain parameter changes

## 🔧 Configuration

### Validator Configuration
```toml
# ~/.personachain/config/config.toml
chain_id = "personachain-1"
moniker = "personachain-validator-1"

[rpc]
laddr = "tcp://0.0.0.0:26657"
cors_allowed_origins = ["*"]

[p2p]
laddr = "tcp://0.0.0.0:26656"
external_address = "tcp://3.95.230.14:26656"
```

### Genesis Configuration
```json
{
  "chain_id": "personachain-1",
  "initial_height": "1",
  "consensus_params": {
    "block": {
      "max_bytes": "22020096",
      "max_gas": "10000000"
    },
    "evidence": {
      "max_age_num_blocks": "100000"
    }
  }
}
```

## 🧪 Testing & Validation

### Health Checks
```bash
# Validator health
curl -s https://personachain-rpc-lb-1471567419.us-east-1.elb.amazonaws.com/health

# Block production
curl -s https://personachain-rpc-lb-1471567419.us-east-1.elb.amazonaws.com/status | jq .result.sync_info

# Network info
curl -s https://personachain-rpc-lb-1471567419.us-east-1.elb.amazonaws.com/net_info
```

### Stress Testing
```bash
# Run included stress test
./scripts/stress-test.sh

# Performance benchmarks
./scripts/performance-benchmark.sh
```

## 🔐 Security Considerations

### Validator Security
- Private keys stored in encrypted format
- Multi-signature support for governance
- Hardware security module (HSM) compatible
- Regular security audits and updates

### Network Security
- Byzantine fault tolerance up to 33% malicious validators
- Economic incentives align with network security
- Slashing conditions for malicious behavior
- Double-sign protection mechanisms

## 📊 Monitoring & Metrics

### Grafana Dashboards
- Validator performance metrics
- Network health indicators
- Transaction throughput graphs
- Resource utilization monitoring

### Alert Conditions
- Validator downtime > 5 minutes
- Block production delays > 30 seconds
- Memory usage > 80%
- Disk space < 10% remaining

## 🛠️ Development

### Building from Source
```bash
# Clone PersonaChain
git clone https://github.com/PersonaPass-ID/persona-chain.git
cd persona-chain

# Install dependencies
make install

# Run tests
make test

# Build binaries
make build
```

### Custom Modules
- **Identity Module**: DID creation and management
- **Credential Module**: Verifiable credential issuance
- **ZK Module**: Zero-knowledge proof verification
- **Governance Module**: Network parameter changes

## 🌐 Integration

### Frontend Integration
```javascript
// Connect to PersonaChain
const rpcUrl = 'https://personachain-rpc-lb-1471567419.us-east-1.elb.amazonaws.com'
const client = await CosmWasmClient.connect(rpcUrl)

// Query chain info
const chainInfo = await client.getChainId()
console.log('Connected to:', chainInfo)
```

### API Integration
```bash
# REST API examples
curl -X GET "https://personachain-rpc-lb-1471567419.us-east-1.elb.amazonaws.com/cosmos/bank/v1beta1/balances/persona1..."

# WebSocket real-time updates
wscat -c "wss://personachain-rpc-lb-1471567419.us-east-1.elb.amazonaws.com/websocket"
```

## 📚 Documentation

- [Setup Guide](./docs/setup.md)
- [API Reference](./docs/api.md)
- [Security Audit](./docs/security.md)
- [Troubleshooting](./docs/troubleshooting.md)
>>>>>>> c9a6c36f0864bb647f6813c0e2e9dd15acb81923

## 🤝 Contributing

1. Fork the repository
<<<<<<< HEAD
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

---

Built with ❤️ by the Persona team
=======
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License. See [LICENSE](./LICENSE) for details.

## 🏆 Production Status

✅ **Single Validator**: Healthy and producing blocks  
✅ **SSL/HTTPS**: Full encryption enabled  
✅ **WAF Protection**: DDoS and attack prevention  
✅ **Monitoring**: Comprehensive observability stack  
✅ **Backups**: Automated disaster recovery  
✅ **Performance**: Sub-6 second block times  

---

**PersonaChain** - Securing Digital Identity on the Blockchain  
Built with ❤️ by the PersonaPass team
>>>>>>> c9a6c36f0864bb647f6813c0e2e9dd15acb81923
