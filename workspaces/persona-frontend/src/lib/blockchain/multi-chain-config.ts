/**
 * Multi-Chain Blockchain Configuration
 * Handles PersonaChain downtime with automatic fallback to Polygon/Arbitrum
 */

import { Chain } from '@rainbow-me/rainbowkit'

export interface ChainConfig {
  id: number
  name: string
  network: string
  nativeCurrency: {
    name: string
    symbol: string
    decimals: number
  }
  rpcUrls: string[]
  blockExplorers: {
    name: string
    url: string
  }[]
  testnet: boolean
  contracts?: {
    personaRegistry?: string
    idToken?: string
    zkVerifier?: string
  }
}

/**
 * PersonaChain Configuration (Currently Down)
 */
export const personaChain: ChainConfig = {
  id: 123456, // Custom chain ID
  name: 'PersonaChain',
  network: 'personachain',
  nativeCurrency: {
    name: 'PERSONA',
    symbol: 'ID',
    decimals: 18,
  },
  rpcUrls: [
    'https://personachain-rpc-lb-1471567419.us-east-1.elb.amazonaws.com', // Down
    'http://161.35.2.88:26657', // Backup (also down)
  ],
  blockExplorers: [
    {
      name: 'PersonaChain Explorer',
      url: 'https://explorer.personachain.io',
    },
  ],
  testnet: false,
  contracts: {
    personaRegistry: '0x...', // To be deployed
    idToken: '0x...', // To be deployed
    zkVerifier: '0x...', // To be deployed
  },
}

/**
 * Polygon Mainnet (Primary Fallback)
 */
export const polygonConfig: ChainConfig = {
  id: 137,
  name: 'Polygon',
  network: 'polygon',
  nativeCurrency: {
    name: 'MATIC',
    symbol: 'MATIC',
    decimals: 18,
  },
  rpcUrls: [
    'https://polygon-rpc.com',
    'https://rpc-mainnet.matic.network',
    'https://matic-mainnet.chainstacklabs.com',
    'https://polygon-mainnet.g.alchemy.com/v2/demo',
    'https://polygon-mainnet.infura.io/v3/YOUR_INFURA_KEY',
  ],
  blockExplorers: [
    {
      name: 'PolygonScan',
      url: 'https://polygonscan.com',
    },
  ],
  testnet: false,
  contracts: {
    personaRegistry: process.env.NEXT_PUBLIC_POLYGON_REGISTRY_ADDRESS,
    idToken: process.env.NEXT_PUBLIC_POLYGON_ID_TOKEN_ADDRESS,
    zkVerifier: process.env.NEXT_PUBLIC_POLYGON_ZK_VERIFIER_ADDRESS,
  },
}

/**
 * Arbitrum One (Secondary Fallback)
 */
export const arbitrumConfig: ChainConfig = {
  id: 42161,
  name: 'Arbitrum One',
  network: 'arbitrum',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: [
    'https://arb1.arbitrum.io/rpc',
    'https://arbitrum-mainnet.infura.io/v3/YOUR_INFURA_KEY',
    'https://arbitrum.blockpi.network/v1/rpc/public',
  ],
  blockExplorers: [
    {
      name: 'Arbiscan',
      url: 'https://arbiscan.io',
    },
  ],
  testnet: false,
  contracts: {
    personaRegistry: process.env.NEXT_PUBLIC_ARBITRUM_REGISTRY_ADDRESS,
    idToken: process.env.NEXT_PUBLIC_ARBITRUM_ID_TOKEN_ADDRESS,
    zkVerifier: process.env.NEXT_PUBLIC_ARBITRUM_ZK_VERIFIER_ADDRESS,
  },
}

/**
 * Base Mainnet (Low-cost alternative)
 */
export const baseConfig: ChainConfig = {
  id: 8453,
  name: 'Base',
  network: 'base',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: [
    'https://mainnet.base.org',
    'https://base-mainnet.g.alchemy.com/v2/demo',
  ],
  blockExplorers: [
    {
      name: 'BaseScan',
      url: 'https://basescan.org',
    },
  ],
  testnet: false,
  contracts: {
    personaRegistry: process.env.NEXT_PUBLIC_BASE_REGISTRY_ADDRESS,
    idToken: process.env.NEXT_PUBLIC_BASE_ID_TOKEN_ADDRESS,
    zkVerifier: process.env.NEXT_PUBLIC_BASE_ZK_VERIFIER_ADDRESS,
  },
}

/**
 * Optimism Mainnet
 */
export const optimismConfig: ChainConfig = {
  id: 10,
  name: 'Optimism',
  network: 'optimism',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: [
    'https://mainnet.optimism.io',
    'https://optimism-mainnet.infura.io/v3/YOUR_INFURA_KEY',
  ],
  blockExplorers: [
    {
      name: 'Optimistic Etherscan',
      url: 'https://optimistic.etherscan.io',
    },
  ],
  testnet: false,
  contracts: {
    personaRegistry: process.env.NEXT_PUBLIC_OPTIMISM_REGISTRY_ADDRESS,
    idToken: process.env.NEXT_PUBLIC_OPTIMISM_ID_TOKEN_ADDRESS,
    zkVerifier: process.env.NEXT_PUBLIC_OPTIMISM_ZK_VERIFIER_ADDRESS,
  },
}

/**
 * Get all supported chains
 */
export const supportedChains: ChainConfig[] = [
  polygonConfig,  // Primary
  arbitrumConfig, // Secondary
  baseConfig,     // Low-cost
  optimismConfig, // Alternative
  // personaChain - Currently disabled due to connectivity issues
]

/**
 * Chain health checker with automatic fallback
 */
export class ChainHealthChecker {
  private healthStatus: Map<number, boolean> = new Map()
  private lastCheck: Map<number, number> = new Map()
  private readonly CHECK_INTERVAL = 60000 // 1 minute

  /**
   * Check if a chain is healthy
   */
  async isChainHealthy(chainId: number): Promise<boolean> {
    const now = Date.now()
    const lastCheckTime = this.lastCheck.get(chainId) || 0

    // Use cached result if recent
    if (now - lastCheckTime < this.CHECK_INTERVAL) {
      return this.healthStatus.get(chainId) || false
    }

    // Perform health check
    const chain = supportedChains.find(c => c.id === chainId)
    if (!chain) return false

    for (const rpcUrl of chain.rpcUrls) {
      try {
        const response = await fetch(rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_blockNumber',
            params: [],
            id: 1,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          if (data.result) {
            this.healthStatus.set(chainId, true)
            this.lastCheck.set(chainId, now)
            return true
          }
        }
      } catch (error) {
        console.warn(`RPC ${rpcUrl} failed:`, error)
      }
    }

    this.healthStatus.set(chainId, false)
    this.lastCheck.set(chainId, now)
    return false
  }

  /**
   * Get the first healthy chain
   */
  async getHealthyChain(): Promise<ChainConfig | null> {
    for (const chain of supportedChains) {
      if (await this.isChainHealthy(chain.id)) {
        console.log(`✅ Using ${chain.name} (Chain ID: ${chain.id})`)
        return chain
      }
    }

    console.error('❌ No healthy chains available!')
    return null
  }

  /**
   * Get chain with lowest gas fees
   */
  async getCheapestChain(): Promise<ChainConfig | null> {
    const gasPrices: { chain: ChainConfig; gasPrice: bigint }[] = []

    for (const chain of supportedChains) {
      if (!(await this.isChainHealthy(chain.id))) continue

      try {
        const response = await fetch(chain.rpcUrls[0], {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_gasPrice',
            params: [],
            id: 1,
          }),
        })

        const data = await response.json()
        if (data.result) {
          gasPrices.push({
            chain,
            gasPrice: BigInt(data.result),
          })
        }
      } catch (error) {
        console.warn(`Failed to get gas price for ${chain.name}`)
      }
    }

    if (gasPrices.length === 0) return null

    // Sort by gas price and return cheapest
    gasPrices.sort((a, b) => 
      a.gasPrice < b.gasPrice ? -1 : 
      a.gasPrice > b.gasPrice ? 1 : 0
    )

    const cheapest = gasPrices[0]
    console.log(`💰 Cheapest chain: ${cheapest.chain.name} (Gas: ${cheapest.gasPrice.toString()})`)
    return cheapest.chain
  }
}

/**
 * RPC Connection Manager with failover
 */
export class RPCConnectionManager {
  private currentRPCIndex: Map<number, number> = new Map()

  /**
   * Get working RPC endpoint for a chain
   */
  async getWorkingRPC(chainId: number): Promise<string | null> {
    const chain = supportedChains.find(c => c.id === chainId)
    if (!chain) return null

    const startIndex = this.currentRPCIndex.get(chainId) || 0

    for (let i = 0; i < chain.rpcUrls.length; i++) {
      const index = (startIndex + i) % chain.rpcUrls.length
      const rpcUrl = chain.rpcUrls[index]

      try {
        const response = await fetch(rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_chainId',
            params: [],
            id: 1,
          }),
          signal: AbortSignal.timeout(5000), // 5 second timeout
        })

        if (response.ok) {
          const data = await response.json()
          if (data.result) {
            this.currentRPCIndex.set(chainId, index)
            console.log(`✅ Connected to ${chain.name} via ${rpcUrl}`)
            return rpcUrl
          }
        }
      } catch (error) {
        console.warn(`RPC ${rpcUrl} failed, trying next...`)
      }
    }

    console.error(`❌ No working RPC for ${chain.name}`)
    return null
  }

  /**
   * Switch to best available chain
   */
  async switchToBestChain(preferLowFees: boolean = false): Promise<ChainConfig | null> {
    const healthChecker = new ChainHealthChecker()
    
    if (preferLowFees) {
      const cheapest = await healthChecker.getCheapestChain()
      if (cheapest) return cheapest
    }

    return await healthChecker.getHealthyChain()
  }
}

// Export singleton instances
export const chainHealthChecker = new ChainHealthChecker()
export const rpcManager = new RPCConnectionManager()

// Default chain configuration
export const getDefaultChain = async (): Promise<ChainConfig> => {
  // Try PersonaChain first (when it's back online)
  if (await chainHealthChecker.isChainHealthy(personaChain.id)) {
    return personaChain
  }

  // Fallback to Polygon
  if (await chainHealthChecker.isChainHealthy(polygonConfig.id)) {
    return polygonConfig
  }

  // Last resort: Arbitrum
  return arbitrumConfig
}