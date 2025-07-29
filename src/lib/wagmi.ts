'use client'

import { http, createConfig } from 'wagmi'
import { mainnet, base, sepolia } from 'wagmi/chains'
import { injected, metaMask, walletConnect } from 'wagmi/connectors'

// WalletConnect Project ID - for production, replace with your actual project ID
const projectId = '3fcc6bba6f1de962d911bb5b5c3dba68'

export const config = createConfig({
  chains: [mainnet, base, sepolia],
  connectors: [
    injected(),
    metaMask(),
    walletConnect({ projectId }),
  ],
  transports: {
    [mainnet.id]: http(),
    [base.id]: http(),
    [sepolia.id]: http(),
  },
  ssr: false,
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}