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

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

---

Built with ❤️ by the Persona team
