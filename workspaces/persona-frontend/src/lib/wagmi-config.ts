import { http, createConfig } from 'wagmi'
import { mainnet, base, optimism, arbitrum, polygon } from 'wagmi/chains'
import { injected, metaMask, safe, walletConnect, coinbaseWallet } from 'wagmi/connectors'

// Get WalletConnect project ID from environment (you'll need to add this to .env.local)
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo-project-id'

export const config = createConfig({
  chains: [mainnet, base, optimism, arbitrum, polygon],
  connectors: [
    injected(),
    metaMask(),
    walletConnect({ 
      projectId,
      metadata: {
        name: 'Persona Identity Platform',
        description: 'Zero-knowledge identity verification platform',
        url: 'https://persona.example.com',
        icons: ['https://persona.example.com/icon.png']
      }
    }),
    coinbaseWallet({
      appName: 'Persona Identity Platform'
    }),
    safe(),
  ],
  transports: {
    [mainnet.id]: http(),
    [base.id]: http(),
    [optimism.id]: http(),
    [arbitrum.id]: http(),
    [polygon.id]: http(),
  },
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}