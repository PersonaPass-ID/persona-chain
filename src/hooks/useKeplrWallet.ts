'use client'

import { useState, useEffect } from 'react'

// Keplr wallet types
declare global {
  interface Window {
    keplr?: {
      enable: (chainId: string) => Promise<void>
      getKey: (chainId: string) => Promise<{
        name: string
        address: string
        bech32Address: string
        isNanoLedger: boolean
      }>
      getOfflineSigner: (chainId: string) => unknown
      experimentalSuggestChain: (chain: unknown) => Promise<void>
    }
  }
}

const PERSONACHAIN_CONFIG = {
  chainId: 'personachain-1',
  chainName: 'PersonaChain',
  rpc: 'http://3.95.230.14:26657',
  rest: 'http://3.95.230.14:1317',
  bip44: {
    coinType: 118,
  },
  bech32Config: {
    bech32PrefixAccAddr: 'persona',
    bech32PrefixAccPub: 'personapub',
    bech32PrefixValAddr: 'personavaloper',
    bech32PrefixValPub: 'personavaloperpub',
    bech32PrefixConsAddr: 'personavalcons',
    bech32PrefixConsPub: 'personavalconspub',
  },
  currencies: [
    {
      coinDenom: 'PERSONA',
      coinMinimalDenom: 'upersona',
      coinDecimals: 6,
    },
  ],
  feeCurrencies: [
    {
      coinDenom: 'PERSONA',
      coinMinimalDenom: 'upersona',
      coinDecimals: 6,
      gasPriceStep: {
        low: 0.01,
        average: 0.025,
        high: 0.04,
      },
    },
  ],
  stakeCurrency: {
    coinDenom: 'PERSONA',
    coinMinimalDenom: 'upersona',
    coinDecimals: 6,
  },
}

export function useKeplrWallet() {
  const [isConnected, setIsConnected] = useState(false)
  const [address, setAddress] = useState<string>('')
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string>('')

  // Check if Keplr is available
  const isKeplrAvailable = typeof window !== 'undefined' && !!window.keplr

  // Check connection status on mount
  useEffect(() => {
    if (isKeplrAvailable) {
      checkConnection()
    }
  }, [isKeplrAvailable])

  const checkConnection = async () => {
    if (!window.keplr) return

    try {
      const key = await window.keplr.getKey(PERSONACHAIN_CONFIG.chainId)
      setAddress(key.bech32Address)
      setIsConnected(true)
    } catch (error) {
      // Not connected or chain not added
      setIsConnected(false)
      setAddress('')
    }
  }

  const connectKeplr = async () => {
    if (!window.keplr) {
      setError('Keplr wallet is not installed. Please install Keplr extension.')
      return false
    }

    setIsConnecting(true)
    setError('')

    try {
      // Suggest the PersonaChain to Keplr
      await window.keplr.experimentalSuggestChain(PERSONACHAIN_CONFIG)
      
      // Enable the chain
      await window.keplr.enable(PERSONACHAIN_CONFIG.chainId)
      
      // Get the address
      const key = await window.keplr.getKey(PERSONACHAIN_CONFIG.chainId)
      
      setAddress(key.bech32Address)
      setIsConnected(true)
      return true
    } catch (error: unknown) {
      console.error('Failed to connect Keplr:', error)
      setError(error instanceof Error ? error.message : 'Failed to connect to Keplr wallet')
      return false
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnectKeplr = () => {
    setIsConnected(false)
    setAddress('')
    setError('')
  }

  return {
    isKeplrAvailable,
    isConnected,
    address,
    isConnecting,
    error,
    connectKeplr,
    disconnectKeplr,
    checkConnection,
  }
}