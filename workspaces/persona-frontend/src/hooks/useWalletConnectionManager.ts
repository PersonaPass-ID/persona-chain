'use client'

import { useRef, useCallback } from 'react'
import { useConnect, useAccount } from 'wagmi'
import type { Connector } from 'wagmi'

// Global connection state to prevent duplicate requests across components
let globalConnectionAttempt = false

export function useWalletConnectionManager() {
  const { connect, connectors, isPending, error } = useConnect()
  const { isConnected } = useAccount()
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const connectWallet = useCallback(async (connector: Connector) => {
    // Prevent duplicate connection attempts globally
    if (isPending || isConnected || globalConnectionAttempt) {
      console.log('⚠️ Connection attempt blocked - already connecting or connected')
      return { success: false, reason: 'Connection already in progress or connected' }
    }

    try {
      globalConnectionAttempt = true
      console.log('🔗 Starting wallet connection:', connector.name)
      
      await connect({ connector })
      
      console.log('✅ Wallet connection initiated successfully')
      return { success: true }
    } catch (err) {
      console.error('❌ Wallet connection failed:', err)
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Connection failed' 
      }
    } finally {
      // Reset global connection flag after delay
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      timeoutRef.current = setTimeout(() => {
        globalConnectionAttempt = false
        console.log('🔄 Connection attempt flag reset')
      }, 3000) // 3 second cooldown
    }
  }, [connect, isPending, isConnected])

  const isConnectionBlocked = () => {
    return isPending || isConnected || globalConnectionAttempt
  }

  return {
    connectWallet,
    connectors,
    isPending,
    error,
    isConnected,
    isConnectionBlocked: isConnectionBlocked()
  }
}