'use client'

import { useRef, useCallback, useEffect } from 'react'
import { useConnect, useAccount } from 'wagmi'
import type { Connector } from 'wagmi'

// Global connection state to prevent duplicate requests across components
let globalConnectionAttempt = false
let lastConnectionTime = 0

export function useWalletConnectionManager() {
  const { connect, connectors, isPending, error } = useConnect()
  const { isConnected } = useAccount()
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Reset global flag when actually connected
  useEffect(() => {
    if (isConnected) {
      globalConnectionAttempt = false
      console.log('✅ Wallet connected - resetting global flag')
    }
  }, [isConnected])

  const connectWallet = useCallback(async (connector: Connector) => {
    const now = Date.now()
    
    console.log('🚀 ConnectWallet called with state:', {
      connectorName: connector.name,
      isConnected,
      isPending,
      globalConnectionAttempt,
      timeSinceLastAttempt: now - lastConnectionTime
    })
    
    // Only block if already connected
    if (isConnected) {
      console.log('⚠️ Already connected to wallet')
      return { success: false, reason: 'Already connected' }
    }

    // Only block if wagmi says connection is pending
    if (isPending) {
      console.log('⚠️ Wagmi connection already pending')
      return { success: false, reason: 'Connection pending' }
    }

    // Minimal debounce to prevent rapid clicks
    if (now - lastConnectionTime < 100) {
      console.log('⚠️ Connection attempt too rapid')
      return { success: false, reason: 'Too rapid' }
    }

    // TEMPORARILY DISABLED: Global attempt blocking for debugging
    // if (globalConnectionAttempt) {
    //   console.log('⚠️ Global connection attempt in progress')
    //   return { success: false, reason: 'Global connection in progress' }
    // }

    try {
      globalConnectionAttempt = true
      lastConnectionTime = now
      
      console.log('🔗 Starting wallet connection:', connector.name)
      console.log('🔍 Connector details:', {
        id: connector.id,
        name: connector.name,
        type: connector.type,
        uid: connector.uid
      })
      
      // This should trigger the MetaMask popup
      console.log('📞 Calling connect() function...')
      const result = await connect({ connector })
      console.log('📞 Connect() returned:', result)
      
      console.log('✅ Connect function completed successfully')
      return { success: true }
    } catch (err) {
      console.error('❌ Wallet connection failed:', err)
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Connection failed' 
      }
    } finally {
      // Reset global connection flag after a brief delay
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      
      timeoutRef.current = setTimeout(() => {
        globalConnectionAttempt = false
        console.log('🔄 Global connection flag reset')
      }, 200) // Very short delay
    }
  }, [connect, isPending, isConnected])

  const isConnectionBlocked = () => {
    // Simplified blocking - only block if actually connected or wagmi is pending
    return isPending || isConnected
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