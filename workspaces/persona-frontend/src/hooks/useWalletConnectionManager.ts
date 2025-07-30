'use client'

import { useConnect, useAccount, useDisconnect } from 'wagmi'
import { useCallback, useRef } from 'react'
import type { Connector } from 'wagmi'

// Extend Window interface for MetaMask
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
      isMetaMask?: boolean
    }
  }
}

/**
 * Enhanced wallet connection manager with MetaMask error handling
 * Implements request deduplication and state clearing for robust connections
 */
export function useWalletConnectionManager() {
  const { connect, connectors, isPending, error } = useConnect()
  const { isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const connectionAttemptRef = useRef<Promise<{ success: boolean; error?: string }> | null>(null)

  const clearMetaMaskState = useCallback(async () => {
    try {
      // Clear any pending MetaMask requests
      if (typeof window !== 'undefined' && window.ethereum?.isMetaMask) {
        console.debug('Clearing MetaMask state...')
        
        // Try multiple approaches to clear MetaMask state
        try {
          // First, try to get current accounts to clear pending state
          await window.ethereum.request({ method: 'eth_accounts' }).catch(() => {})
          
          // Wait a bit longer for MetaMask to process the state clearing
          await new Promise(resolve => setTimeout(resolve, 200))
          
          // Try to clear any cached permissions
          if ('permissions' in window.ethereum) {
            await window.ethereum.request({ method: 'wallet_getPermissions' }).catch(() => {})
          }
        } catch (error) {
          console.debug('MetaMask state clearing completed with minor errors:', error)
        }
        
        console.debug('MetaMask state clearing completed')
      }
    } catch {
      // Silently ignore clearing errors - MetaMask state clearing is best effort
    }
  }, [])

  const connectWallet = useCallback(async (connector: Connector) => {
    // Prevent duplicate connection attempts
    if (connectionAttemptRef.current) {
      console.debug('Connection already in progress, waiting...')
      try {
        return await connectionAttemptRef.current
      } catch {
        // If previous attempt failed, continue with new attempt
        connectionAttemptRef.current = null
      }
    }

    const attemptConnection = async (): Promise<{ success: boolean; error?: string }> => {
      try {
        // Clear MetaMask state for MetaMask connections
        if (connector.name.toLowerCase().includes('metamask')) {
          await clearMetaMaskState()
        }

        // Attempt connection
        await connect({ connector })
        return { success: true }
      } catch (err: unknown) {
        console.error('Wallet connection failed:', err)
        
        // Handle specific MetaMask "Already processing" error
        if (err instanceof Error && err.message.includes('Already processing eth_requestAccounts')) {
          console.debug('MetaMask already processing, clearing state and retrying...')
          
          // More aggressive retry logic for MetaMask
          for (let retryCount = 0; retryCount < 3; retryCount++) {
            await clearMetaMaskState()
            
            // Progressive delay - wait longer on each retry
            const delay = 300 + (retryCount * 200)
            await new Promise(resolve => setTimeout(resolve, delay))
            
            try {
              console.debug(`MetaMask retry attempt ${retryCount + 1}/3`)
              await connect({ connector })
              console.debug('MetaMask retry successful!')
              return { success: true }
            } catch (retryErr) {
              console.debug(`MetaMask retry ${retryCount + 1} failed:`, retryErr)
              if (retryCount === 2) {
                // Final retry failed
                return { 
                  success: false, 
                  error: `MetaMask connection failed after 3 attempts: ${retryErr instanceof Error ? retryErr.message : 'Connection failed'}` 
                }
              }
            }
          }
        }

        // Handle other errors
        return { 
          success: false, 
          error: err instanceof Error ? err.message : 'Connection failed' 
        }
      }
    }

    // Store the connection attempt
    connectionAttemptRef.current = attemptConnection()
    
    try {
      const result = await connectionAttemptRef.current
      return result
    } finally {
      connectionAttemptRef.current = null
    }
  }, [connect, clearMetaMaskState])

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