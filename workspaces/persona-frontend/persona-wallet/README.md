# PersonaWallet 👛

**The Ultimate Sovereign Digital Identity Wallet**

PersonaWallet is the official wallet application for PersonaChain, providing users with complete control over their digital identity and assets.

## 🌟 Features

### Core Wallet Functions
- **HD Wallet Generation**: Secure 24-word mnemonic generation
- **Wallet Import/Export**: Import existing wallets with recovery phrases
- **Balance Management**: View and manage PERSONA token balances
- **Transaction Management**: Send and receive PERSONA tokens
- **Real-time Updates**: Auto-refresh balances and transaction status

### Digital Identity (DID)
- **DID Creation**: Generate decentralized identifiers on PersonaChain
- **Identity Management**: Full control over your digital identity
- **Credential Support**: Ready for verifiable credentials integration
- **Privacy-First**: Zero-knowledge proofs and privacy preservation

### Security Features
- **HD Wallet Architecture**: Hierarchical deterministic wallet generation
- **Secure Storage**: Client-side key management (no keys sent to servers)
- **Recovery Phrases**: Standard BIP-39 mnemonic phrases
- **Address Validation**: Prevent sending to invalid addresses

### User Experience
- **Modern UI**: Clean, intuitive interface built with Chakra UI
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Real-time Feedback**: Toast notifications and loading states
- **Error Handling**: Graceful error recovery and user feedback

## 🚀 Getting Started

### Prerequisites
- Node.js 16+
- npm or yarn
- Access to PersonaChain RPC endpoint

### Installation
```bash
# Navigate to the wallet directory
cd /home/rocz/persona-hq/workspaces/persona-frontend/persona-wallet

# Install dependencies
npm install

# Start development server
npm start
```

### Configuration
The wallet connects to PersonaChain automatically using:
- **Chain ID**: `personachain-1`
- **RPC Endpoint**: `http://personachain-rpc-lb-463662045.us-east-1.elb.amazonaws.com`
- **Address Prefix**: `persona`
- **Native Token**: PERSONA (6 decimals)

## 🏗️ Architecture

### Components
- **WalletSetup**: Initial wallet creation and import interface
- **WalletDashboard**: Main wallet interface with balance and actions
- **Services**: PersonaChain and WalletConnect integration services
- **Hooks**: Custom React hooks for wallet management

### Services
- **PersonaChainService**: Direct blockchain integration using CosmJS
- **WalletConnectService**: Cross-wallet connectivity (coming soon)

### State Management
- **useWallet Hook**: Centralized wallet state management
- **Local Storage**: Persistent wallet storage (addresses only, no keys)

## 🔒 Security

### Key Management
- Private keys never leave your device
- Mnemonic phrases are generated using secure randomness
- Recovery phrases are not stored in localStorage
- All cryptographic operations happen client-side

### Best Practices
- Always verify recipient addresses before sending
- Keep your recovery phrase secure and offline
- Never share your private keys or recovery phrase
- Use the wallet in a secure environment

## 🌐 PersonaChain Integration

### Direct Connection
- Native integration with PersonaChain blockchain
- Real-time balance and transaction updates
- Support for all PersonaChain features

### Token Support
- **PERSONA**: Native governance and utility token
- **DID Operations**: Decentralized identifier management
- **Future**: Support for additional tokens and NFTs

## 🛣️ Roadmap

### Phase 1 (Current)
- ✅ Basic wallet functionality
- ✅ PERSONA token support
- ✅ DID creation
- ✅ Modern React UI

### Phase 2 (Coming Soon)
- 🔄 WalletConnect integration
- 🔄 Mobile app (React Native)
- 🔄 Browser extension
- 🔄 Hardware wallet support

### Phase 3 (Future)
- 🔄 Advanced DID features
- 🔄 Verifiable credentials management
- 🔄 Cross-chain bridges
- 🔄 DeFi integrations

## 🔧 Development

### Scripts
```bash
npm start          # Start development server
npm run build      # Build for production
npm test           # Run tests
npm run eject      # Eject from Create React App
```

### Technologies
- **React 18**: Modern React with hooks
- **TypeScript**: Type-safe development
- **Chakra UI**: Component library and design system
- **CosmJS**: Cosmos SDK JavaScript library
- **BIP39**: Mnemonic phrase generation
- **WalletConnect**: Cross-wallet connectivity

## 📱 Usage

### Creating a New Wallet
1. Click "Create New Wallet"
2. Securely store your 24-word recovery phrase
3. Your wallet is ready to use!

### Importing an Existing Wallet
1. Click "Import Existing Wallet"
2. Enter your recovery phrase
3. Your wallet will be restored with full access

### Creating a DID
1. Click "Create DID" in your dashboard
2. Your decentralized identifier will be generated
3. Use your DID for identity verification and credentials

### Sending Tokens
1. Click "Send PERSONA"
2. Enter recipient address and amount
3. Confirm transaction
4. Track transaction status

## 🌍 Ecosystem Integration

PersonaWallet is part of the complete PersonaChain ecosystem:
- **PersonaChain**: Layer 1 blockchain for digital identity
- **PersonaPass**: Enterprise identity solutions
- **PERSONA Token**: Governance and utility token
- **DID Registry**: Decentralized identifier management

## 🤝 Contributing

PersonaWallet is part of the PersonaChain project. For contributions and development:
1. Follow the existing code style
2. Add tests for new features
3. Update documentation
4. Submit pull requests

## 📄 License

PersonaWallet is part of the PersonaChain ecosystem. See project license for details.

## 🆘 Support

For support and questions:
- PersonaChain documentation
- Developer community
- GitHub issues

---

**PersonaWallet** - Your gateway to digital sovereignty! 🚀