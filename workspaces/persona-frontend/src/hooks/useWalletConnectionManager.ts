'use client'

import { useConnect, useAccount, useDisconnect } from 'wagmi'
import { useCallback } from 'react'
import type { Connector } from 'wagmi'

/**
 * Simplified, robust wallet connection manager following wagmi best practices
 * Removes complex state management and lets wagmi handle connection state properly
 */
export function useWalletConnectionManager() {
  const { connect, connectors, isPending, error } = useConnect()
  const { isConnected } = useAccount()
  const { disconnect } = useDisconnect()

  const connectWallet = useCallback(async (connector: Connector) => {
    try {
      // Simple, direct connection using wagmi's built-in handling
      await connect({ connector })
      return { success: true }
    } catch (err) {
      console.error('Wallet connection failed:', err)
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Connection failed' 
      }
    }
  }, [connect])

  const disconnectWallet = useCallback(async () => {
    try {
      disconnect()
      return { success: true }
    } catch (err) {
      console.error('Wallet disconnection failed:', err)
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Disconnection failed' 
      }
    }
  }, [disconnect])

  return {
    connectWallet,
    disconnectWallet,
    connectors,
    isPending,
    error,
    isConnected
  }
}