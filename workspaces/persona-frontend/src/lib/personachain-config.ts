/**
 * PersonaChain Configuration for Wallet Integration
 * Automatically suggests PersonaChain to Keplr, Leap, and other wallets
 */

export const PERSONACHAIN_NETWORK_CONFIG = {
  chainId: 'personachain-1', // Your actual working PersonaChain
  chainName: 'PersonaChain Identity Network',
  rpc: 'http://personachain-alb-37941478.us-east-1.elb.amazonaws.com:26657', // PersonaChain ALB RPC
  rest: 'http://personachain-alb-37941478.us-east-1.elb.amazonaws.com:1317', // PersonaChain ALB REST
  bip44: {
    coinType: 118, // Standard Cosmos coin type
  },
  bech32Config: {
    bech32PrefixAccAddr: 'cosmos', // Your chain uses cosmos prefix
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
    coinImageUrl: 'https://personapass.xyz/logo.png',
  }],
  feeCurrencies: [{
    coinDenom: 'ID',
    coinMinimalDenom: 'uid',
    coinDecimals: 6,
    gasPriceStep: {
      low: 0.001,
      average: 0.002,
      high: 0.005,
    },
    coinImageUrl: 'https://personapass.xyz/logo.png',
  }],
  stakeCurrency: {
    coinDenom: 'ID',
    coinMinimalDenom: 'uid',
    coinDecimals: 6,
    coinImageUrl: 'https://personapass.xyz/logo.png',
  },
  features: ['ibc-transfer', 'ibc-go', 'cosmwasm', 'wasmd_0.24+'],
}

/**
 * Add PersonaChain to wallet
 */
export async function addPersonaChainToWallet(walletType: 'keplr' | 'leap' | 'cosmostation'): Promise<{
  success: boolean
  error?: string
}> {
  try {
    switch (walletType) {
      case 'keplr':
        if (!window.keplr) {
          return { success: false, error: 'Keplr wallet not installed' }
        }
        await window.keplr.experimentalSuggestChain(PERSONACHAIN_NETWORK_CONFIG)
        return { success: true }
        
      case 'leap':
        if (!window.leap) {
          return { success: false, error: 'Leap wallet not installed' }
        }
        await window.leap.experimentalSuggestChain(PERSONACHAIN_NETWORK_CONFIG)
        return { success: true }
        
      case 'cosmostation':
        // Cosmostation typically requires manual addition through their interface
        return { 
          success: false, 
          error: 'Please add PersonaChain manually in Cosmostation settings' 
        }
        
      default:
        return { success: false, error: 'Unsupported wallet type' }
    }
  } catch (error) {
    console.error('Failed to add PersonaChain to wallet:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add chain to wallet'
    }
  }
}

/**
 * Check if PersonaChain is already added to wallet
 */
export async function isPersonaChainSupported(walletType: 'keplr' | 'leap'): Promise<boolean> {
  try {
    switch (walletType) {
      case 'keplr':
        if (!window.keplr) return false
        await window.keplr.enable('personachain-1')
        return true
        
      case 'leap':
        if (!window.leap) return false
        await window.leap.enable('personachain-1')
        return true
        
      default:
        return false
    }
  } catch {
    return false
  }
}

/**
 * Auto-setup PersonaChain for wallet connection
 */
export async function setupPersonaChain(walletType: 'keplr' | 'leap' | 'cosmostation'): Promise<{
  success: boolean
  error?: string
}> {
  console.log(`🔗 Setting up PersonaChain for ${walletType}...`)
  
  // First check if chain is already supported
  if (walletType !== 'cosmostation') {
    const isSupported = await isPersonaChainSupported(walletType as 'keplr' | 'leap')
    if (isSupported) {
      console.log('✅ PersonaChain already supported')
      return { success: true }
    }
  }
  
  // Add the chain to wallet
  const result = await addPersonaChainToWallet(walletType)
  
  if (result.success) {
    console.log('✅ PersonaChain added to wallet successfully')
  } else {
    console.error('❌ Failed to add PersonaChain:', result.error)
  }
  
  return result
}

declare global {
  interface Window {
    keplr?: {
      enable: (chainId: string) => Promise<void>
      experimentalSuggestChain: (config: any) => Promise<void>
    }
    leap?: {
      enable: (chainId: string) => Promise<void>
      experimentalSuggestChain: (config: any) => Promise<void>
    }
  }
}