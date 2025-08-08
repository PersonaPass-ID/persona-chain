// Reown/WalletConnect Universal Wallet Adapter
// Supports 300+ wallets through WalletConnect protocol

import { createAppKit } from '@reown/appkit/react'
import { EthersAdapter } from '@reown/appkit-adapter-ethers'
import { mainnet, arbitrum, polygon } from '@reown/appkit/networks'

export interface ReownWalletConfig {
  projectId: string
  name: string
  description: string
  url: string
  icons: string[]
}

export class ReownWalletAdapter {
  private appKit: any = null
  private isConnected = false
  private currentAddress: string | null = null
  private currentChainId: string | null = null

  constructor(private config: ReownWalletConfig) {}

  async initialize() {
    if (this.appKit) return

    try {
      // Initialize Reown AppKit with PersonaChain support
      this.appKit = createAppKit({
        adapters: [new EthersAdapter()],
        networks: [
          mainnet,
          arbitrum,
          polygon,
          // Add PersonaChain network
          {
            id: 'personachain-1',
            name: 'PersonaChain',
            nativeCurrency: {
              decimals: 6,
              name: 'PERSONA',
              symbol: 'PERSONA',
            },
            rpcUrls: {
              default: {
                http: [process.env.NEXT_PUBLIC_PERSONACHAIN_RPC || 'http://localhost:26657'],
              },
            },
            blockExplorers: {
              default: {
                name: 'PersonaChain Explorer',
                url: process.env.NEXT_PUBLIC_PERSONACHAIN_EXPLORER || 'http://localhost:3000/explorer',
              },
            },
          }
        ],
        projectId: this.config.projectId,
        metadata: {
          name: this.config.name,
          description: this.config.description,
          url: this.config.url,
          icons: this.config.icons
        },
        features: {
          analytics: true,
          onramp: false,
          swaps: false,
          email: false,
          socials: []
        },
        themeMode: 'auto',
        themeVariables: {
          '--w3m-accent': '#2563eb',
          '--w3m-border-radius-master': '8px'
        }
      })

      // Listen for connection events
      this.appKit.subscribeAccount((account: any) => {
        this.isConnected = account.isConnected
        this.currentAddress = account.address
      })

      this.appKit.subscribeChainId((chainId: any) => {
        this.currentChainId = chainId
      })

    } catch (error) {
      console.error('Failed to initialize Reown AppKit:', error)
      throw error
    }
  }

  async connect(): Promise<{
    success: boolean
    address?: string
    chainId?: string
    error?: string
  }> {
    try {
      if (!this.appKit) {
        await this.initialize()
      }

      // Open wallet selection modal
      this.appKit.open()

      // Wait for connection (polling approach)
      return new Promise((resolve) => {
        let attempts = 0
        const maxAttempts = 30 // 30 seconds timeout

        const checkConnection = () => {
          attempts++
          
          if (this.isConnected && this.currentAddress) {
            resolve({
              success: true,
              address: this.currentAddress,
              chainId: this.currentChainId || undefined
            })
          } else if (attempts >= maxAttempts) {
            resolve({
              success: false,
              error: 'Connection timeout'
            })
          } else {
            setTimeout(checkConnection, 1000)
          }
        }

        checkConnection()
      })

    } catch (error) {
      console.error('Reown connection failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection failed'
      }
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.appKit && this.isConnected) {
        await this.appKit.disconnect()
        this.isConnected = false
        this.currentAddress = null
        this.currentChainId = null
      }
    } catch (error) {
      console.error('Reown disconnect failed:', error)
    }
  }

  async getAddress(): Promise<string | null> {
    return this.currentAddress
  }

  async getChainId(): Promise<string | null> {
    return this.currentChainId
  }

  async switchToPersonaChain(): Promise<boolean> {
    try {
      if (!this.appKit) return false

      // Request chain switch to PersonaChain
      await this.appKit.switchNetwork('personachain-1')
      return true
    } catch (error) {
      console.error('Failed to switch to PersonaChain:', error)
      return false
    }
  }

  async signMessage(message: string): Promise<string> {
    if (!this.appKit || !this.isConnected) {
      throw new Error('Wallet not connected')
    }

    try {
      const signature = await this.appKit.signMessage(message)
      return signature
    } catch (error) {
      console.error('Message signing failed:', error)
      throw error
    }
  }

  async signTransaction(transaction: any): Promise<any> {
    if (!this.appKit || !this.isConnected) {
      throw new Error('Wallet not connected')
    }

    try {
      const signedTx = await this.appKit.sendTransaction(transaction)
      return signedTx
    } catch (error) {
      console.error('Transaction signing failed:', error)
      throw error
    }
  }

  isInstalled(): boolean {
    // Reown is web-based, always "installed"
    return true
  }

  isWalletConnected(): boolean {
    return this.isConnected
  }

  getName(): string {
    return 'Reown (300+ Wallets)'
  }

  getIcon(): string {
    return 'https://avatars.githubusercontent.com/u/37784886?s=200&v=4'
  }

  getSupportedWallets(): string[] {
    return [
      'MetaMask', 'Rainbow', 'Trust Wallet', 'Coinbase Wallet',
      'WalletConnect', 'ImToken', 'TokenPocket', '1inch Wallet',
      'Zerion', 'Argent', 'Gnosis Safe', 'Ledger Live',
      'Trezor', 'MathWallet', 'SafePal', 'Bitkeep',
      // ... and 280+ more wallets
    ]
  }

  // Mobile-specific methods
  async connectMobile(): Promise<boolean> {
    try {
      // Generate WalletConnect URI and show QR code
      if (this.appKit) {
        this.appKit.open({ view: 'Connect' })
        return true
      }
      return false
    } catch (error) {
      console.error('Mobile connection failed:', error)
      return false
    }
  }

  getQRCodeData(): Promise<string | null> {
    return new Promise((resolve) => {
      if (this.appKit) {
        // Get WalletConnect URI for QR code
        this.appKit.subscribeWalletConnectUri((uri: string) => {
          resolve(uri)
        })
      } else {
        resolve(null)
      }
    })
  }
}

// Default configuration
export const defaultReownConfig: ReownWalletConfig = {
  projectId: process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || '946b25b33d5bf1a42b32971e742ce05d',
  name: 'PersonaPass',
  description: 'Universal identity platform powered by PersonaChain',
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://personapass.xyz',
  icons: [
    'https://personapass.xyz/icon-192.png'
  ]
}