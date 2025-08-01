import { http, createConfig } from 'wagmi'
import { mainnet } from 'wagmi/chains'
import { injected, metaMask, walletConnect } from 'wagmi/connectors'

// Get Reown (formerly WalletConnect) project ID from environment
const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || '946b25b33d5bf1a42b32971e742ce05d'

// PersonaChain configuration for Keplr wallet
const personaChain = {
  id: 7777, // Numeric chain ID for PersonaChain
  name: 'PersonaChain',
  nativeCurrency: {
    decimals: 18,
    name: 'Persona',
    symbol: 'PERSONA',
  },
  rpcUrls: {
    public: { http: ['https://personachain-rpc-lb-1471567419.us-east-1.elb.amazonaws.com'] },
    default: { http: ['https://personachain-rpc-lb-1471567419.us-east-1.elb.amazonaws.com'] },
  },
  blockExplorers: {
    default: { name: 'PersonaChain Explorer', url: 'https://personachain-rpc-lb-1471567419.us-east-1.elb.amazonaws.com' },
  },
} as const

export const config = createConfig({
  chains: [mainnet, personaChain],
  connectors: [
    // Generic injected wallet connector (includes Keplr)
    injected({
      shimDisconnect: true
    }),
    // MetaMask for Ethereum-compatible chains
    metaMask({
      dappMetadata: {
        name: 'PersonaPass Identity Platform',
        url: 'https://personapass.xyz',
        iconUrl: 'https://personapass.xyz/favicon.svg'
      },
      logging: {
        developerMode: false,
        sdk: false
      }
    }),
    // WalletConnect for mobile wallet support
    walletConnect({ 
      projectId,
      metadata: {
        name: 'PersonaPass Identity Platform',
        description: 'Zero-knowledge identity verification platform',
        url: 'https://personapass.xyz',
        icons: ['https://personapass.xyz/favicon.svg']
      },
      showQrModal: true,
      qrModalOptions: {
        themeMode: 'light',
        themeVariables: {
          '--wcm-z-index': '1000'
        }
      }
    }),
  ],
  transports: {
    [mainnet.id]: http(),
    [personaChain.id]: http(),
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