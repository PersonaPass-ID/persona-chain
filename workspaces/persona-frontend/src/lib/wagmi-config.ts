import { http, createConfig } from 'wagmi'
import { mainnet, base, optimism, arbitrum, polygon } from 'wagmi/chains'
import { injected, metaMask, safe, walletConnect, coinbaseWallet } from 'wagmi/connectors'

// Get Reown (formerly WalletConnect) project ID from environment
const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || '946b25b33d5bf1a42b32971e742ce05d'

export const config = createConfig({
  chains: [mainnet, base, optimism, arbitrum, polygon],
  connectors: [
    injected(),
    metaMask({
      dappMetadata: {
        name: 'Persona Identity Platform',
        url: 'https://personapass.xyz',
      },
    }),
    walletConnect({ 
      projectId,
      metadata: {
        name: 'Persona Identity Platform',
        description: 'Zero-knowledge identity verification platform',
        url: 'https://personapass.xyz',
        icons: ['https://personapass.xyz/icon.png']
      }
    }),
    coinbaseWallet({
      appName: 'Persona Identity Platform',
      appLogoUrl: 'https://personapass.xyz/icon.png',
      preference: 'smartWalletOnly',
      enableMobileWalletLink: true
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