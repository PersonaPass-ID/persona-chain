/**
 * WALLET CONNECTION HOOK
 * 
 * React hook for managing wallet connections with support for
 * multiple wallet providers (Keplr, WalletConnect, etc.)
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'

export interface WalletState {
  address: string | null
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  walletType: 'keplr' | 'walletconnect' | null
}

export function useWallet() {
  const [walletState, setWalletState] = useState<WalletState>({
    address: null,
    isConnected: false,
    isConnecting: false,
    error: null,
    walletType: null
  })
  const { toast } = useToast()

  // Check for existing wallet connection on mount
  useEffect(() => {
    checkExistingConnection()
  }, [])

  const checkExistingConnection = async () => {
    try {
      // Check if Keplr is available and connected
      if (typeof window !== 'undefined' && window.keplr) {
        const key = await window.keplr.getKey('persona-testnet')
        if (key) {
          setWalletState({
            address: key.bech32Address,
            isConnected: true,
            isConnecting: false,
            error: null,
            walletType: 'keplr'
          })
        }
      }
    } catch (error) {
      // Silently ignore - no existing connection
      console.log('No existing wallet connection found')
    }
  }

  const connectKeplr = async () => {
    try {
      if (!window.keplr) {
        throw new Error('Keplr wallet not installed')
      }

      // Enable Keplr for PersonaChain
      await window.keplr.enable('persona-testnet')
      
      // Get the key
      const key = await window.keplr.getKey('persona-testnet')
      
      setWalletState({
        address: key.bech32Address,
        isConnected: true,
        isConnecting: false,
        error: null,
        walletType: 'keplr'
      })

      toast({
        title: "Wallet Connected",
        description: `Connected to ${key.bech32Address.slice(0, 10)}...`,
      })

      return key.bech32Address

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect wallet'
      
      setWalletState(prev => ({
        ...prev,
        isConnecting: false,
        error: errorMessage
      }))

      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive"
      })

      throw error
    }
  }

  const connect = useCallback(async () => {
    setWalletState(prev => ({
      ...prev,
      isConnecting: true,
      error: null
    }))

    try {
      // Try Keplr first (primary wallet for PersonaChain)
      return await connectKeplr()
    } catch (error) {
      console.error('Wallet connection failed:', error)
      throw error
    }
  }, [toast])

  const disconnect = useCallback(async () => {
    setWalletState({
      address: null,
      isConnected: false,
      isConnecting: false,
      error: null,
      walletType: null
    })

    toast({
      title: "Wallet Disconnected",
      description: "Successfully disconnected from wallet",
    })
  }, [toast])

  const switchNetwork = useCallback(async (networkId: string) => {
    if (walletState.walletType === 'keplr' && window.keplr) {
      try {
        await window.keplr.enable(networkId)
        toast({
          title: "Network Switched",
          description: `Switched to ${networkId}`,
        })
      } catch (error) {
        toast({
          title: "Network Switch Failed",
          description: error instanceof Error ? error.message : 'Failed to switch network',
          variant: "destructive"
        })
      }
    }
  }, [walletState.walletType, toast])

  const signMessage = useCallback(async (message: string): Promise<string> => {
    if (!walletState.isConnected || !walletState.address) {
      throw new Error('Wallet not connected')
    }

    if (walletState.walletType === 'keplr' && window.keplr) {
      try {
        const signature = await window.keplr.signArbitrary(
          'persona-testnet',
          walletState.address,
          message
        )
        return signature.signature
      } catch (error) {
        throw new Error('Failed to sign message')
      }
    }

    throw new Error('Unsupported wallet for message signing')
  }, [walletState])

  return {
    // State
    address: walletState.address,
    isConnected: walletState.isConnected,
    isConnecting: walletState.isConnecting,
    error: walletState.error,
    walletType: walletState.walletType,

    // Actions
    connect,
    disconnect,
    switchNetwork,
    signMessage,

    // Computed
    shortAddress: walletState.address 
      ? `${walletState.address.slice(0, 6)}...${walletState.address.slice(-4)}`
      : null
  }
}

// Type declarations for Keplr
declare global {
  interface Window {
    keplr?: {
      enable: (chainId: string) => Promise<void>
      getKey: (chainId: string) => Promise<{
        name: string
        algo: string
        pubKey: Uint8Array
        address: Uint8Array
        bech32Address: string
      }>
      signArbitrary: (
        chainId: string,
        signer: string,
        data: string
      ) => Promise<{
        signature: string
        pub_key: {
          type: string
          value: string
        }
      }>
    }
  }
}