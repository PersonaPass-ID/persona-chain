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

### Prerequisites
- Node.js 20+ 
- npm or yarn
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/PersonaPass-ID/persona-website.git
   cd persona-website/workspaces/persona-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Update `.env.local` with your WalletConnect Project ID:
   ```env
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
src/
├── app/
│   ├── get-started/          # Onboarding flow
│   ├── layout.tsx           # Root layout with Web3Provider
│   └── page.tsx             # Landing page
├── components/
│   ├── Navigation.tsx       # Main navigation component
│   ├── WagmiProvider.tsx    # Web3 provider wrapper
│   └── WalletConnection.tsx # Wallet connection UI
├── lib/
│   └── wagmi-config.ts      # Web3 configuration
public/
└── logos/                   # Wallet provider logos
    ├── metamask.svg
    ├── walletconnect.svg
    ├── coinbase.svg
    └── ...
```

## 🌐 Deployment

### Vercel Deployment (Recommended)

1. **Connect to Vercel**
   - Import your GitHub repository to Vercel
   - Set the root directory to `workspaces/persona-frontend`

2. **Environment Variables**
   Add these environment variables in Vercel dashboard:
   ```
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
   ```

3. **Custom Domain**
   - Add `personapass.xyz` as a custom domain in Vercel
   - Update DNS records to point to Vercel

### Manual Deployment

```bash
# Build the application
npm run build

# Start production server
npm start
```

## 🔧 Configuration

### WalletConnect Setup
1. Visit [WalletConnect Cloud](https://cloud.walletconnect.com/)
2. Create a new project
3. Get your Project ID
4. Add it to your environment variables

### Blockchain Networks
The app supports multiple networks by default:
- Ethereum Mainnet
- Base
- Optimism
- Arbitrum
- Polygon

## 🚨 Security Considerations

### Production Checklist
- [ ] Replace demo WalletConnect Project ID with real one
- [ ] Implement real email/SMS verification services
- [ ] Set up proper error monitoring (Sentry)
- [ ] Configure CSP headers
- [ ] Enable HTTPS everywhere
- [ ] Implement rate limiting
- [ ] Add proper logging

### Web3 Security
- All wallet connections use official provider libraries
- No private keys are stored or transmitted
- Zero-knowledge proofs ensure privacy
- Recovery phrases are generated client-side only

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@personapass.xyz or join our Discord community.

## 🗺️ Roadmap

- [ ] Dashboard page for verified users
- [ ] Multi-language support
- [ ] Advanced ZK-proof implementations
- [ ] Mobile app (React Native)
- [ ] Enterprise SSO integration
- [ ] API for third-party integrations

---

Built with ❤️ by the Persona team
