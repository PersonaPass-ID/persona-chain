import { createConfig, http } from 'wagmi'
import { 
  mainnet, 
  polygon, 
  optimism, 
  arbitrum,
  sepolia,
  polygonMumbai
} from 'wagmi/chains'
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors'

// Get environment variables
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || ''
const alchemyApiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || ''
const infuraApiKey = process.env.NEXT_PUBLIC_INFURA_API_KEY || ''

// Configure chains
export const chains = [
  mainnet,
  polygon,
  optimism,
  arbitrum,
  ...(process.env.NODE_ENV === 'development' ? [sepolia, polygonMumbai] : [])
] as const

// Create wagmi config
export const wagmiConfig = createConfig({
  chains,
  connectors: [
    // Injected connector for browser wallets
    injected({
      target() {
        return {
          id: 'metamask',
          name: 'MetaMask',
          provider: window.ethereum,
        }
      }
    }),
    
    // WalletConnect for mobile wallets
    walletConnect({
      projectId,
      metadata: {
        name: 'PersonaPass',
        description: 'Privacy-first identity verification',
        url: 'https://personapass.io',
        icons: ['https://personapass.io/icon.png']
      },
      qrModalOptions: {
        themeMode: 'dark',
      }
    }),
    
    // Coinbase Wallet
    coinbaseWallet({
      appName: 'PersonaPass',
      appLogoUrl: 'https://personapass.io/icon.png',
    }),
  ],
  
  // Configure RPC providers
  transports: {
    [mainnet.id]: alchemyApiKey 
      ? http(`https://eth-mainnet.g.alchemy.com/v2/${alchemyApiKey}`)
      : http(),
    [polygon.id]: alchemyApiKey
      ? http(`https://polygon-mainnet.g.alchemy.com/v2/${alchemyApiKey}`)
      : http(),
    [optimism.id]: alchemyApiKey
      ? http(`https://opt-mainnet.g.alchemy.com/v2/${alchemyApiKey}`)
      : http(),
    [arbitrum.id]: alchemyApiKey
      ? http(`https://arb-mainnet.g.alchemy.com/v2/${alchemyApiKey}`)
      : http(),
    [sepolia.id]: infuraApiKey
      ? http(`https://sepolia.infura.io/v3/${infuraApiKey}`)
      : http(),
    [polygonMumbai.id]: alchemyApiKey
      ? http(`https://polygon-mumbai.g.alchemy.com/v2/${alchemyApiKey}`)
      : http(),
  },
})

// Export chain info for UI
export const supportedChains = {
  [mainnet.id]: {
    name: 'Ethereum',
    icon: '⟠',
    color: '#627EEA',
    explorer: 'https://etherscan.io'
  },
  [polygon.id]: {
    name: 'Polygon',
    icon: '⬜',
    color: '#8247E5',
    explorer: 'https://polygonscan.com'
  },
  [optimism.id]: {
    name: 'Optimism',
    icon: '🔴',
    color: '#FF0420',
    explorer: 'https://optimistic.etherscan.io'
  },
  [arbitrum.id]: {
    name: 'Arbitrum',
    icon: '🔵',
    color: '#28A0F0',
    explorer: 'https://arbiscan.io'
  },
  [sepolia.id]: {
    name: 'Sepolia',
    icon: '🧪',
    color: '#FFA500',
    explorer: 'https://sepolia.etherscan.io'
  },
  [polygonMumbai.id]: {
    name: 'Mumbai',
    icon: '🧪',
    color: '#8247E5',
    explorer: 'https://mumbai.polygonscan.com'
  }
}

// Contract addresses per chain
export const contractAddresses = {
  PersonaPassIdentity: {
    [mainnet.id]: '0x0000000000000000000000000000000000000000', // TODO: Deploy
    [polygon.id]: '0x0000000000000000000000000000000000000000', // TODO: Deploy
    [sepolia.id]: '0x0000000000000000000000000000000000000000', // TODO: Deploy
    [polygonMumbai.id]: '0x0000000000000000000000000000000000000000', // TODO: Deploy
  },
  ZKVerifier: {
    [mainnet.id]: '0x0000000000000000000000000000000000000000', // TODO: Deploy
    [polygon.id]: '0x0000000000000000000000000000000000000000', // TODO: Deploy
    [sepolia.id]: '0x0000000000000000000000000000000000000000', // TODO: Deploy
    [polygonMumbai.id]: '0x0000000000000000000000000000000000000000', // TODO: Deploy
  }
} as const