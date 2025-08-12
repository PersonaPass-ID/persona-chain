// 🔐 PersonaPass Universal Wallet Authentication Client
// Production-ready client for Keplr, Leap, Cosmostation, Terra Station

// CosmJS encoding utilities for wallet operations
function toBase64(data: Uint8Array): string {
  return Buffer.from(data).toString('base64')
}

// Wallet authentication types
export interface WalletAuthChallenge {
  message: string
  expiresAt: string
}

export interface WalletAuthRequest {
  address: string
  signature: string
  publicKey: string
  message: string
  walletType: 'keplr' | 'leap' | 'cosmostation' | 'terra-station' | 'custom'
  chainId: string
}

export interface WalletAuthResponse {
  user: {
    id: string
    address: string
    walletType: string
    chainId: string
    isVerified: boolean
    verificationLevel: string
    createdAt: string
    lastLogin: string
  }
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface WalletUser {
  id: string
  address: string
  walletType: string
  chainId: string
  isVerified: boolean
  verificationLevel: string
  createdAt: string
  lastLogin: string
  metadata?: Record<string, unknown>
}

export interface TokenRefreshResponse {
  accessToken: string
  expiresIn: number
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

// PersonaPass wallet types - avoiding global type conflicts
export interface PersonaKeplrWallet extends UniversalWallet {
  experimentalSuggestChain?: (config: unknown) => Promise<void>
}

export interface PersonaLeapWallet extends UniversalWallet {
  experimentalSuggestChain?: (config: unknown) => Promise<void>
}

// Extend window with all supported wallets using safe casting
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

export class PersonaWalletAuthClient {
  private authApiUrl: string
  private accessToken: string | null = null
  private refreshToken: string | null = null

  constructor() {
    let authApiUrl = process.env.NEXT_PUBLIC_AUTH_API_URL || 'https://personapass-api-lb-1061457068.us-east-1.elb.amazonaws.com'
    
    // Ensure HTTPS for production to prevent mixed content errors
    if (typeof window !== 'undefined' && window.location.protocol === 'https:' && authApiUrl.startsWith('http://')) {
      authApiUrl = authApiUrl.replace('http://', 'https://')
      console.log('🔒 Upgraded Auth API URL to HTTPS for production')
    }
    
    this.authApiUrl = authApiUrl
    
    // Load stored tokens
    this.loadStoredTokens()
    
    console.log('🔐 PersonaWalletAuthClient initialized')
    console.log('   🌐 Auth API:', this.authApiUrl)
  }

  /**
   * Load stored authentication tokens from localStorage
   */
  private loadStoredTokens(): void {
    try {
      this.accessToken = localStorage.getItem('persona_wallet_access_token')
      this.refreshToken = localStorage.getItem('persona_wallet_refresh_token')
    } catch (error) {
      console.error('Failed to load stored tokens:', error)
    }
  }

  /**
   * Store authentication tokens in localStorage
   */
  private storeTokens(accessToken: string, refreshToken: string): void {
    try {
      this.accessToken = accessToken
      this.refreshToken = refreshToken
      localStorage.setItem('persona_wallet_access_token', accessToken)
      localStorage.setItem('persona_wallet_refresh_token', refreshToken)
    } catch (error) {
      console.error('Failed to store tokens:', error)
    }
  }

  /**
   * Clear stored authentication tokens
   */
  private clearTokens(): void {
    try {
      this.accessToken = null
      this.refreshToken = null
      localStorage.removeItem('persona_wallet_access_token')
      localStorage.removeItem('persona_wallet_refresh_token')
      localStorage.removeItem('persona_wallet_user')
    } catch (error) {
      console.error('Failed to clear tokens:', error)
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
   * Generate authentication challenge
   */
  async generateChallenge(address: string): Promise<WalletAuthChallenge | null> {
    try {
      const response = await fetch(`${this.authApiUrl}/api/auth/challenge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Failed to generate challenge:', error)
      return null
    }
  }

  /**
   * Sign message with wallet
   */
  async signMessage(
    walletType: 'keplr' | 'leap' | 'cosmostation' | 'terra-station',
    address: string,
    message: string
  ): Promise<{
    success: boolean
    signature?: string
    publicKey?: string
    error?: string
  }> {
    try {
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

      return {
        success: true,
        signature: signResult.signature,
        publicKey: signResult.pub_key.value
      }

    } catch (error) {
      console.error('Failed to sign message:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to sign message'
      }
    }
  }

  /**
   * Authenticate with wallet signature
   */
  async authenticate(authRequest: WalletAuthRequest): Promise<{
    success: boolean
    user?: WalletUser
    error?: string
  }> {
    try {
      const response = await fetch(`${this.authApiUrl}/api/auth/authenticate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(authRequest)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Authentication failed')
      }

      const authData: WalletAuthResponse = await response.json()

      // Store tokens and user data
      this.storeTokens(authData.accessToken, authData.refreshToken)
      localStorage.setItem('persona_wallet_user', JSON.stringify(authData.user))

      return {
        success: true,
        user: authData.user
      }

    } catch (error) {
      console.error('Authentication failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      }
    }
  }

  /**
   * Complete wallet authentication flow
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

      const { address, publicKey } = connection

      if (!address || !publicKey) {
        return {
          success: false,
          error: 'Failed to get wallet information'
        }
      }

      // Step 2: Generate challenge
      const challenge = await this.generateChallenge(address)
      if (!challenge) {
        return {
          success: false,
          error: 'Failed to generate authentication challenge'
        }
      }

      // Step 3: Sign challenge
      const signature = await this.signMessage(walletType, address, challenge.message)
      if (!signature.success) {
        return {
          success: false,
          error: signature.error || 'Failed to sign message'
        }
      }

      // Step 4: Authenticate
      const authRequest: WalletAuthRequest = {
        address,
        signature: signature.signature!,
        publicKey: signature.publicKey!,
        message: challenge.message,
        walletType,
        chainId: PERSONACHAIN_CONFIG.chainId
      }

      return await this.authenticate(authRequest)

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
      if (!this.accessToken) {
        return {
          success: false,
          error: 'No access token available'
        }
      }

      const response = await fetch(`${this.authApiUrl}/api/user/profile`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        if (response.status === 401) {
          // Try to refresh token
          const refreshResult = await this.refreshAccessToken()
          if (refreshResult.success) {
            // Retry with new token
            return this.getUserProfile()
          }
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const user = await response.json()
      return {
        success: true,
        user
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
   * Refresh access token
   */
  async refreshAccessToken(): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      if (!this.refreshToken) {
        return {
          success: false,
          error: 'No refresh token available'
        }
      }

      const response = await fetch(`${this.authApiUrl}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: this.refreshToken
        })
      })

      if (!response.ok) {
        this.clearTokens()
        throw new Error('Token refresh failed')
      }

      const tokenData: TokenRefreshResponse = await response.json()
      
      // Update access token
      this.accessToken = tokenData.accessToken
      localStorage.setItem('persona_wallet_access_token', tokenData.accessToken)

      return {
        success: true
      }

    } catch (error) {
      console.error('Failed to refresh token:', error)
      this.clearTokens()
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Token refresh failed'
      }
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      if (this.refreshToken) {
        await fetch(`${this.authApiUrl}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            refreshToken: this.refreshToken
          })
        })
      }
    } catch (error) {
      console.error('Logout API call failed:', error)
    } finally {
      this.clearTokens()
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.accessToken
  }

  /**
   * Get stored user data
   */
  getStoredUser(): WalletUser | null {
    try {
      const userData = localStorage.getItem('persona_wallet_user')
      return userData ? JSON.parse(userData) : null
    } catch (error) {
      console.error('Failed to get stored user:', error)
      return null
    }
  }

  /**
   * Test authentication API health
   */
  async testAuthAPI(): Promise<{
    success: boolean
    message: string
  }> {
    try {
      const response = await fetch(`${this.authApiUrl}/api/health`, {
        signal: AbortSignal.timeout(5000)
      })

      if (response.ok) {
        const healthData = await response.json()
        return {
          success: true,
          message: `Auth API healthy - ${healthData.service} v${healthData.version}`
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
export const walletAuthClient = new PersonaWalletAuthClient()
export default walletAuthClient