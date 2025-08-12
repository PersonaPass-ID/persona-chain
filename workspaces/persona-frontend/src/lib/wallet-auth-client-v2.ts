// 🔐 PersonaPass Wallet Authentication Client V2 - Custom Cosmos Auth
// Uses SIWE-inspired pattern specifically designed for Cosmos wallets

// CosmJS encoding utilities for wallet operations
function toBase64(data: Uint8Array): string {
  return Buffer.from(data).toString('base64')
}

// Wallet authentication types
export interface WalletUser {
  address: string
  did: string
  createdAt?: string
  credentialCount?: number
}

// Universal wallet interface for cross-wallet compatibility
export interface UniversalWallet {
  enable: (chainId: string) => Promise<void>
  getKey: (chainId: string) => Promise<{
    name: string
    address: string
    bech32Address: string
    pubKey: Uint8Array
    isNanoLedger?: boolean
  }>
  signArbitrary: (chainId: string, signer: string, data: string | Uint8Array) => Promise<{
    signature: string
    pub_key: {
      type: string
      value: string
    }
  }>
  getOfflineSigner: (chainId: string) => unknown
  experimentalSuggestChain?: (config: unknown) => Promise<void>
}

// PersonaPass wallet types
export interface PersonaKeplrWallet extends UniversalWallet {
  experimentalSuggestChain?: (config: unknown) => Promise<void>
}

export interface PersonaLeapWallet extends UniversalWallet {
  experimentalSuggestChain?: (config: unknown) => Promise<void>
}

// Extend window with all supported wallets
declare global {
  interface Window {
    keplr?: unknown
    leap?: unknown
    cosmostation?: {
      cosmos: unknown
    }
    station?: unknown
  }
}

// PersonaChain configuration - WORKING PERSONACHAIN!
const PERSONACHAIN_CONFIG = {
  chainId: 'personachain-1', // Your actual PersonaChain network!
  chainName: 'PersonaChain Identity Network', 
  rpc: 'http://13.221.89.96:26657', // Working validator RPC (updated IP)
  rest: 'http://13.221.89.96:1317', // Working REST API (updated IP)
  bip44: { coinType: 118 },
  bech32Config: {
    bech32PrefixAccAddr: 'cosmos', // Using cosmos prefix - your chain uses this
    bech32PrefixAccPub: 'cosmospub',
    bech32PrefixValAddr: 'cosmosvaloper',
    bech32PrefixValPub: 'cosmosvaloperpub',
    bech32PrefixConsAddr: 'cosmosvalcons',
    bech32PrefixConsPub: 'cosmosvalconspub',
  },
  currencies: [{
    coinDenom: 'ID', // PersonaChain native ID token
    coinMinimalDenom: 'uid',
    coinDecimals: 6,
    coinImageUrl: 'https://personapass.xyz/logo.png'
  }],
  feeCurrencies: [{
    coinDenom: 'ID',
    coinMinimalDenom: 'uid', 
    coinDecimals: 6,
    gasPriceStep: { 
      low: 0.001,
      average: 0.002,
      high: 0.005
    },
  }],
  stakeCurrency: {
    coinDenom: 'ID',
    coinMinimalDenom: 'uid',
    coinDecimals: 6,
  },
  features: ['ibc-transfer', 'ibc-go']
}

export class PersonaWalletAuthClientV2 {
  private currentUser: WalletUser | null = null
  private isInitialized: boolean = false
  private initializationPromise: Promise<void> | null = null

  constructor() {
    console.log('🔐 PersonaWalletAuthClient V2 initialized (SIWE)')
  }

  /**
   * Initialize the client and check for existing session
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return
    if (this.initializationPromise) return this.initializationPromise

    this.initializationPromise = this.checkSession()
    await this.initializationPromise
    this.isInitialized = true
  }

  /**
   * Check if user has existing session
   */
  private async checkSession(): Promise<void> {
    try {
      const response = await fetch('/api/auth/profile')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.user) {
          this.currentUser = data.user
          console.log('✅ Existing session found:', data.user.did)
        }
      }
    } catch (error) {
      console.log('No existing session found')
    }
  }

  /**
   * Get available wallets
   */
  getAvailableWallets(): Array<{
    type: 'keplr' | 'leap' | 'cosmostation' | 'terra-station' | 'reown'
    name: string
    isInstalled: boolean
    wallet?: UniversalWallet
  }> {
    return [
      {
        type: 'keplr',
        name: 'Keplr',
        isInstalled: !!window.keplr,
        wallet: window.keplr as UniversalWallet
      },
      {
        type: 'leap',
        name: 'Leap',
        isInstalled: !!window.leap,
        wallet: window.leap as UniversalWallet
      },
      {
        type: 'cosmostation',
        name: 'Cosmostation',
        isInstalled: !!window.cosmostation?.cosmos,
        wallet: window.cosmostation?.cosmos as UniversalWallet
      },
      {
        type: 'terra-station',
        name: 'Terra Station',
        isInstalled: !!window.station,
        wallet: window.station as UniversalWallet
      },
      {
        type: 'reown',
        name: 'Reown (300+ Wallets)',
        isInstalled: true, // Always available (web-based)
        wallet: undefined // Handled separately
      }
    ]
  }

  /**
   * Connect to a specific wallet
   */
  async connectWallet(walletType: 'keplr' | 'leap' | 'cosmostation' | 'terra-station' | 'reown'): Promise<{
    success: boolean
    address?: string
    publicKey?: string
    error?: string
  }> {
    try {
      // Handle Reown separately
      if (walletType === 'reown') {
        const { ReownWalletAdapter, defaultReownConfig } = await import('../lib/wallet-adapters/reown-adapter')
        const reownAdapter = new ReownWalletAdapter(defaultReownConfig)
        
        const result = await reownAdapter.connect()
        if (result.success && result.address) {
          return {
            success: true,
            address: result.address,
            publicKey: 'reown-wallet-key' // Placeholder - will handle properly later
          }
        } else {
          return {
            success: false,
            error: result.error || 'Reown connection failed'
          }
        }
      }

      const wallets = this.getAvailableWallets()
      const selectedWallet = wallets.find(w => w.type === walletType)

      if (!selectedWallet?.isInstalled || !selectedWallet.wallet) {
        return {
          success: false,
          error: `${selectedWallet?.name || walletType} wallet is not installed`
        }
      }

      const wallet = selectedWallet.wallet

      // Suggest PersonaChain if using Keplr or Leap
      if (walletType === 'keplr' || walletType === 'leap') {
        try {
          await (wallet as PersonaKeplrWallet | PersonaLeapWallet).experimentalSuggestChain?.(PERSONACHAIN_CONFIG)
        } catch (error) {
          console.log('Chain suggestion failed (may already be added):', error)
        }
      }

      // Enable the wallet for PersonaChain
      await wallet.enable(PERSONACHAIN_CONFIG.chainId)

      // Get wallet key information
      const key = await wallet.getKey(PERSONACHAIN_CONFIG.chainId)

      return {
        success: true,
        address: key.bech32Address,
        publicKey: toBase64(key.pubKey)
      }

    } catch (error) {
      console.error(`Failed to connect ${walletType}:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to connect wallet'
      }
    }
  }

  /**
   * Complete wallet authentication flow using SIWE pattern
   */
  async authenticateWithWallet(walletType: 'keplr' | 'leap' | 'cosmostation' | 'terra-station' | 'reown'): Promise<{
    success: boolean
    user?: WalletUser
    error?: string
  }> {
    try {
      // Step 1: Connect wallet
      const connection = await this.connectWallet(walletType)
      if (!connection.success) {
        return connection
      }

      const { address } = connection

      if (!address) {
        return {
          success: false,
          error: 'Failed to get wallet address'
        }
      }

      // Step 2: Get nonce from server
      const nonceResponse = await fetch('/api/auth/wallet')
      if (!nonceResponse.ok) {
        throw new Error('Failed to get authentication nonce')
      }

      const { nonce } = await nonceResponse.json()

      // Step 3: Create PersonaChain authentication message
      const domain = window.location.host
      const origin = window.location.origin
      const statement = 'Sign in to PersonaPass to access your PersonaChain digital identity'
      const issuedAt = new Date().toISOString()
      
      // Create a simple authentication message that works with any Cosmos wallet
      const message = `PersonaPass Authentication Challenge

Wallet: ${address}
Nonce: ${nonce}
Timestamp: ${Date.now()}
Domain: ${origin}

By signing this message, you authenticate with PersonaPass.
This signature cannot be used to authorize transactions.

⚠️ Only sign this message on the official PersonaPass website.`

      console.log('🎯 Generated auth challenge for:', address.slice(0, 10) + '...' + address.slice(-10))

      // Step 4: Sign the message
      const wallets = this.getAvailableWallets()
      const selectedWallet = wallets.find(w => w.type === walletType)
      
      if (!selectedWallet?.wallet) {
        return {
          success: false,
          error: 'Wallet not available'
        }
      }

      const wallet = selectedWallet.wallet

      // Sign the message
      const signResult = await wallet.signArbitrary(
        PERSONACHAIN_CONFIG.chainId,
        address,
        message
      )

      console.log('✅ Wallet signed message successfully')

      // Step 5: Send signature to backend for verification
      const authResponse = await fetch('/api/auth/wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address,
          message,
          signature: JSON.stringify(signResult), // Send full signature object
          walletType: walletType
        })
      })

      if (!authResponse.ok) {
        const errorData = await authResponse.json()
        throw new Error(errorData.error || 'Authentication failed')
      }

      const authData = await authResponse.json()

      if (authData.success && authData.user) {
        this.currentUser = authData.user
        return {
          success: true,
          user: authData.user
        }
      }

      return {
        success: false,
        error: 'Authentication failed'
      }

    } catch (error) {
      console.error('Wallet authentication failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Wallet authentication failed'
      }
    }
  }

  /**
   * Get current user profile
   */
  async getUserProfile(): Promise<{
    success: boolean
    user?: WalletUser
    error?: string
  }> {
    try {
      const response = await fetch('/api/auth/profile')

      if (!response.ok) {
        if (response.status === 401) {
          this.currentUser = null
          return {
            success: false,
            error: 'Not authenticated'
          }
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success && data.user) {
        this.currentUser = data.user
        return {
          success: true,
          user: data.user
        }
      }

      return {
        success: false,
        error: 'Failed to get user profile'
      }

    } catch (error) {
      console.error('Failed to get user profile:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get user profile'
      }
    }
  }

  /**
   * Refresh access token (handled by session cookies)
   */
  async refreshAccessToken(): Promise<{
    success: boolean
    error?: string
  }> {
    // With iron-session, refresh is handled automatically
    // This method is kept for compatibility
    return { success: true }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await fetch('/api/auth/wallet', {
        method: 'DELETE'
      })
    } catch (error) {
      console.error('Logout API call failed:', error)
    } finally {
      this.currentUser = null
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    await this.initialize()
    return !!this.currentUser
  }

  /**
   * Check if user is authenticated (synchronous version for compatibility)
   */
  isAuthenticatedSync(): boolean {
    return !!this.currentUser
  }

  /**
   * Get stored user data
   */
  getStoredUser(): WalletUser | null {
    return this.currentUser
  }

  /**
   * Test authentication API health
   */
  async testAuthAPI(): Promise<{
    success: boolean
    message: string
  }> {
    try {
      // Test the auth endpoint
      const response = await fetch('/api/auth/wallet', {
        signal: AbortSignal.timeout(5000)
      })

      if (response.ok) {
        return {
          success: true,
          message: 'Auth API healthy - SIWE implementation active'
        }
      } else {
        return {
          success: false,
          message: `Auth API error: ${response.status} ${response.statusText}`
        }
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Auth API unavailable'
      }
    }
  }

  /**
   * Sign a message with the currently connected wallet
   */
  async signMessage(message: string): Promise<string | null> {
    try {
      if (!this.currentUser?.address) {
        console.error('🚨 No authenticated user for message signing')
        return null
      }

      // Find the currently connected wallet
      const wallets = this.getAvailableWallets()
      const connectedWallet = wallets.find(w => w.isInstalled && w.wallet)

      if (!connectedWallet?.wallet) {
        console.error('🚨 No wallet available for signing')
        return null
      }

      const wallet = connectedWallet.wallet
      
      console.log('📝 Requesting signature from wallet...')
      
      // Use signArbitrary to sign the message
      const signResult = await wallet.signArbitrary(
        PERSONACHAIN_CONFIG.chainId,
        this.currentUser.address,
        message
      )

      if (!signResult?.signature) {
        console.error('🚨 Wallet signing failed - no signature returned')
        return null
      }

      console.log('✅ Message signed successfully')
      return signResult.signature

    } catch (error) {
      console.error('🚨 Message signing error:', error)
      return null
    }
  }
}

// Export singleton instance
export const walletAuthClient = new PersonaWalletAuthClientV2()
export default walletAuthClient