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

// PersonaChain configuration
const PERSONACHAIN_CONFIG = {
  chainId: 'personachain-1',
  chainName: 'PersonaChain',
  rpc: 'https://rpc.personapass.xyz',
  rest: 'https://api.personapass.xyz',
  bip44: { coinType: 118 },
  bech32Config: {
    bech32PrefixAccAddr: 'persona',
    bech32PrefixAccPub: 'personapub',
    bech32PrefixValAddr: 'personavaloper',
    bech32PrefixValPub: 'personavaloperpub',
    bech32PrefixConsAddr: 'personavalcons',
    bech32PrefixConsPub: 'personavalconspub',
  },
  currencies: [{
    coinDenom: 'PERSONA',
    coinMinimalDenom: 'upersona',
    coinDecimals: 6,
  }],
  feeCurrencies: [{
    coinDenom: 'PERSONA',
    coinMinimalDenom: 'upersona',
    coinDecimals: 6,
    gasPriceStep: { low: 0.01, average: 0.025, high: 0.04 },
  }],
  stakeCurrency: {
    coinDenom: 'PERSONA',
    coinMinimalDenom: 'upersona',
    coinDecimals: 6,
  },
}

export class PersonaWalletAuthClientV2 {
  private currentUser: WalletUser | null = null

  constructor() {
    // Check for existing session
    this.checkSession()
    console.log('🔐 PersonaWalletAuthClient V2 initialized (SIWE)')
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
    type: 'keplr' | 'leap' | 'cosmostation' | 'terra-station'
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
      }
    ]
  }

  /**
   * Connect to a specific wallet
   */
  async connectWallet(walletType: 'keplr' | 'leap' | 'cosmostation' | 'terra-station'): Promise<{
    success: boolean
    address?: string
    publicKey?: string
    error?: string
  }> {
    try {
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
  async authenticateWithWallet(walletType: 'keplr' | 'leap' | 'cosmostation' | 'terra-station'): Promise<{
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

      // Step 3: Create custom authentication message for Cosmos wallets
      const domain = window.location.host
      const origin = window.location.origin
      const statement = 'Sign in to PersonaPass to access your digital identity'
      const issuedAt = new Date().toISOString()
      
      // Create a custom message format that works with Cosmos addresses
      const message = `${domain} wants you to sign in with your Cosmos account:
${address}

${statement}

URI: ${origin}
Version: 1
Chain ID: ${PERSONACHAIN_CONFIG.chainId}
Nonce: ${nonce}
Issued At: ${issuedAt}`

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

      // Step 5: Send signature to backend for verification
      const authResponse = await fetch('/api/auth/wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          signature: signResult.signature
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
  isAuthenticated(): boolean {
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
}

// Export singleton instance
export const walletAuthClient = new PersonaWalletAuthClientV2()
export default walletAuthClient