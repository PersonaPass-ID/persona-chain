import { http, createConfig } from 'wagmi'
import { mainnet, base, optimism, arbitrum, polygon } from 'wagmi/chains'
import { injected, metaMask, safe, walletConnect, coinbaseWallet } from 'wagmi/connectors'

// Get Reown (formerly WalletConnect) project ID from environment
const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || '946b25b33d5bf1a42b32971e742ce05d'

export const config = createConfig({
  chains: [mainnet, base, optimism, arbitrum, polygon],
  connectors: [
    // Injected connector for general browser wallets
    injected({
      shimDisconnect: true
    }),
    // MetaMask with enhanced configuration for error handling
    metaMask({
      dappMetadata: {
        name: 'Persona Identity Platform',
        url: 'https://personapass.xyz',
        iconUrl: 'https://personapass.xyz/favicon.svg'
      },
      // Enable logging for debugging connection issues
      logging: {
        developerMode: false, // Keep false for production
        sdk: false
      }
    }),
    // WalletConnect with enhanced configuration
    walletConnect({ 
      projectId,
      metadata: {
        name: 'Persona Identity Platform',
        description: 'Zero-knowledge identity verification platform',
        url: 'https://personapass.xyz',
        icons: ['https://personapass.xyz/favicon.svg']
      },
      // Configure for better reconnection handling
      showQrModal: true,
      // Handle stale chains properly
      isNewChainsStale: false
    }),
    // Coinbase Wallet with latest configuration
    coinbaseWallet({
      appName: 'Persona Identity Platform',
      appLogoUrl: 'https://personapass.xyz/favicon.svg',
      preference: 'smartWalletOnly'
    }),
    // Safe wallet connector
    safe({
      shimDisconnect: true
    }),
  ],
  transports: {
    [mainnet.id]: http(),
    [base.id]: http(),
    [optimism.id]: http(),
    [arbitrum.id]: http(),
    [polygon.id]: http(),
  },
  // Configure for better connection handling
  ssr: false, // Disable SSR for better client-side wallet detection
  // Handle reconnection more gracefully
  multiInjectedProviderDiscovery: true
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}