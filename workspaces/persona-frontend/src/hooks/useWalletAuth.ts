'use client'

import { useState, useEffect, useCallback } from 'react'
import { walletAuthClient, WalletUser } from '@/lib/wallet-auth-client-v2'

export type WalletType = 'keplr' | 'leap' | 'cosmostation' | 'terra-station' | 'reown'

export interface WalletInfo {
  type: WalletType
  name: string
  isInstalled: boolean
}

export interface WalletAuthState {
  isAuthenticated: boolean
  user: WalletUser | null
  isConnecting: boolean
  isInitializing: boolean
  error: string | null
  availableWallets: WalletInfo[]
}

export function useWalletAuth() {
  const [state, setState] = useState<WalletAuthState>({
    isAuthenticated: false,
    user: null,
    isConnecting: false,
    isInitializing: true,
    error: null,
    availableWallets: []
  })

  // Initialize state on mount
  useEffect(() => {
    initializeAuth()
  }, [])

  const initializeAuth = useCallback(async () => {
    try {
      // Initialize the wallet auth client first
      await walletAuthClient.initialize()

      // Get available wallets
      const wallets = walletAuthClient.getAvailableWallets().map(w => ({
        type: w.type,
        name: w.name,
        isInstalled: w.isInstalled
      }))

      // Check if user is already authenticated (now properly async)
      const isAuthenticated = await walletAuthClient.isAuthenticated()
      let user: WalletUser | null = null

      if (isAuthenticated) {
        // Try to get user profile
        const profileResult = await walletAuthClient.getUserProfile()
        if (profileResult.success) {
          user = profileResult.user || null
        } else {
          // If profile fetch fails, user might not be properly authenticated
          await walletAuthClient.logout()
        }
      } else {
        // Check for stored user data even if not authenticated (for display purposes)
        user = walletAuthClient.getStoredUser()
        if (user && !isAuthenticated) {
          // Clear stale user data
          user = null
          await walletAuthClient.logout()
        }
      }

      setState(prev => ({
        ...prev,
        isAuthenticated: isAuthenticated && !!user,
        user,
        availableWallets: wallets,
        isInitializing: false,
        error: null
      }))

    } catch (error) {
      console.error('Failed to initialize wallet auth:', error)
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Initialization failed',
        isInitializing: false,
        availableWallets: walletAuthClient.getAvailableWallets().map(w => ({
          type: w.type,
          name: w.name,
          isInstalled: w.isInstalled
        }))
      }))
    }
  }, [])

  const connectWallet = useCallback(async (walletType: WalletType): Promise<{
    success: boolean
    error?: string
  }> => {
    setState(prev => ({ ...prev, isConnecting: true, error: null }))

    try {
      const result = await walletAuthClient.authenticateWithWallet(walletType)
      
      if (result.success && result.user) {
        setState(prev => ({
          ...prev,
          isAuthenticated: true,
          user: result.user!,
          isConnecting: false,
          error: null
        }))
        return { success: true }
      } else {
        setState(prev => ({
          ...prev,
          isConnecting: false,
          error: result.error || 'Authentication failed'
        }))
        return {
          success: false,
          error: result.error || 'Authentication failed'
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection failed'
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: errorMessage
      }))
      return {
        success: false,
        error: errorMessage
      }
    }
  }, [])

  const disconnect = useCallback(async (): Promise<void> => {
    try {
      await walletAuthClient.logout()
      setState(prev => ({
        ...prev,
        isAuthenticated: false,
        user: null,
        error: null
      }))
    } catch (error) {
      console.error('Failed to disconnect:', error)
      // Still clear the state even if logout fails
      setState(prev => ({
        ...prev,
        isAuthenticated: false,
        user: null,
        error: null
      }))
    }
  }, [])

  const refreshAuth = useCallback(async (): Promise<{
    success: boolean
    error?: string
  }> => {
    try {
      const refreshResult = await walletAuthClient.refreshAccessToken()
      
      if (refreshResult.success) {
        // Re-fetch user profile
        const profileResult = await walletAuthClient.getUserProfile()
        if (profileResult.success && profileResult.user) {
          setState(prev => ({
            ...prev,
            user: profileResult.user!,
            error: null
          }))
          return { success: true }
        }
      }
      
      // If refresh failed, logout
      await disconnect()
      return {
        success: false,
        error: refreshResult.error || 'Token refresh failed'
      }
      
    } catch (error) {
      await disconnect()
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Refresh failed'
      }
    }
  }, [disconnect])

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  const checkAuthHealth = useCallback(async (): Promise<{
    success: boolean
    message: string
  }> => {
    return await walletAuthClient.testAuthAPI()
  }, [])

  // Auto-refresh token when it's about to expire
  useEffect(() => {
    if (!state.isAuthenticated) return

    const interval = setInterval(async () => {
      try {
        await refreshAuth()
      } catch (error) {
        console.error('Auto-refresh failed:', error)
      }
    }, 45 * 60 * 1000) // Refresh every 45 minutes (tokens expire in 1 hour)

    return () => clearInterval(interval)
  }, [state.isAuthenticated, refreshAuth])

  const signMessage = useCallback(async (message: string): Promise<string | null> => {
    try {
      return await walletAuthClient.signMessage(message)
    } catch (error) {
      console.error('Failed to sign message:', error)
      return null
    }
  }, [])

  return {
    // State
    ...state,
    
    // Actions
    connectWallet,
    disconnect,
    refreshAuth,
    clearError,
    checkAuthHealth,
    signMessage,
    
    // Utils
    getInstalledWallets: () => state.availableWallets.filter(w => w.isInstalled),
    getMissingWallets: () => state.availableWallets.filter(w => !w.isInstalled),
    hasWalletsInstalled: () => state.availableWallets.some(w => w.isInstalled),
    
    // Computed properties
    isReady: !state.isInitializing && state.availableWallets.length > 0,
    connectionStatus: state.isInitializing ? 'initializing' :
                    state.isConnecting ? 'connecting' : 
                    state.isAuthenticated ? 'connected' : 
                    'disconnected' as const
  }
}