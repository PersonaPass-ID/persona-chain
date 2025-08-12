'use client'

/**
 * PersonaAuth Context - Unified authentication system for PersonaPass
 * Integrates TOTP, OAuth, and blockchain-based authentication
 */

import React, { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react'
import { AuthService, AuthMethod, AuthSession, AuthUser, DeviceInfo } from '@/lib/auth-service'

// Types
export interface PersonaAuthState {
  // Authentication Status
  isAuthenticated: boolean
  isLoading: boolean
  isInitializing: boolean
  
  // User & Session
  user: AuthUser | null
  session: AuthSession | null
  
  // Authentication Methods
  authMethods: AuthMethod[]
  primaryMethod: AuthMethod | null
  
  // Device & Security
  deviceTrusted: boolean
  deviceInfo: DeviceInfo | null
  
  // Error Handling
  error: string | null
  lastActivity: Date | null
}

export interface PersonaAuthActions {
  // Session Management
  login: (method: 'totp' | 'oauth', credential: string, options?: LoginOptions) => Promise<AuthResult>
  logout: (revokeAll?: boolean) => Promise<void>
  refreshSession: () => Promise<AuthResult>
  
  // TOTP Authentication
  setupTOTP: (did: string, signature: string) => Promise<TOTPSetupResult>
  verifyTOTP: (did: string, code: string, signature: string) => Promise<AuthResult>
  
  // OAuth Authentication
  initiateOAuth: (provider: 'microsoft' | 'google' | 'github', did: string) => Promise<string>
  handleOAuthCallback: (code: string, state: string) => Promise<AuthResult>
  
  // Device Management
  trustDevice: (remember: boolean) => Promise<void>
  revokeTrustedDevice: (deviceToken?: string) => Promise<void>
  
  // Utility
  clearError: () => void
  checkHealth: () => Promise<{ success: boolean; message: string }>
}

export interface LoginOptions {
  rememberDevice?: boolean
  redirectUrl?: string
}

export interface AuthResult {
  success: boolean
  error?: string
  session?: AuthSession
  requiresSetup?: boolean
}

export interface TOTPSetupResult {
  success: boolean
  error?: string
  secret?: string
  qrCode?: string
  backupCodes?: string[]
  methodId?: string
}

// Context
interface PersonaAuthContextValue extends PersonaAuthState, PersonaAuthActions {}

const PersonaAuthContext = createContext<PersonaAuthContextValue | null>(null)

// Reducer
type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_INITIALIZING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_USER'; payload: AuthUser | null }
  | { type: 'SET_SESSION'; payload: AuthSession | null }
  | { type: 'SET_AUTH_METHODS'; payload: AuthMethod[] }
  | { type: 'SET_DEVICE_TRUSTED'; payload: boolean }
  | { type: 'SET_DEVICE_INFO'; payload: DeviceInfo | null }
  | { type: 'UPDATE_LAST_ACTIVITY' }
  | { type: 'RESET_STATE' }

function authReducer(state: PersonaAuthState, action: AuthAction): PersonaAuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    
    case 'SET_INITIALIZING':
      return { ...state, isInitializing: action.payload }
    
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    
    case 'SET_USER':
      return { 
        ...state, 
        user: action.payload,
        isAuthenticated: !!action.payload
      }
    
    case 'SET_SESSION':
      return { 
        ...state, 
        session: action.payload,
        isAuthenticated: !!action.payload
      }
    
    case 'SET_AUTH_METHODS':
      const primaryMethod = action.payload.find(method => method.is_primary) || null
      return { 
        ...state, 
        authMethods: action.payload,
        primaryMethod
      }
    
    case 'SET_DEVICE_TRUSTED':
      return { ...state, deviceTrusted: action.payload }
    
    case 'SET_DEVICE_INFO':
      return { ...state, deviceInfo: action.payload }
    
    case 'UPDATE_LAST_ACTIVITY':
      return { ...state, lastActivity: new Date() }
    
    case 'RESET_STATE':
      return {
        isAuthenticated: false,
        isLoading: false,
        isInitializing: false,
        user: null,
        session: null,
        authMethods: [],
        primaryMethod: null,
        deviceTrusted: false,
        deviceInfo: null,
        error: null,
        lastActivity: null
      }
    
    default:
      return state
  }
}

// Initial state
const initialState: PersonaAuthState = {
  isAuthenticated: false,
  isLoading: false,
  isInitializing: true,
  user: null,
  session: null,
  authMethods: [],
  primaryMethod: null,
  deviceTrusted: false,
  deviceInfo: null,
  error: null,
  lastActivity: null
}

// Provider Props
interface PersonaAuthProviderProps {
  children: ReactNode
  apiBaseUrl?: string
}

// Provider Component
export function PersonaAuthProvider({ 
  children, 
  apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL 
}: PersonaAuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState)
  const authService = new AuthService(apiBaseUrl)

  // Initialize authentication state
  const initialize = useCallback(async () => {
    try {
      dispatch({ type: 'SET_INITIALIZING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })

      // Check for existing session
      const session = authService.getStoredSession()
      if (session) {
        // Validate session
        const validation = await authService.validateSession(session.token)
        if (validation.success && validation.session) {
          dispatch({ type: 'SET_SESSION', payload: validation.session })
          dispatch({ type: 'SET_USER', payload: {
            did: validation.session.did,
            authMethods: validation.session.permissions || []
          }})

          // Load authentication methods
          try {
            const methods = await authService.getAuthMethods(validation.session.did)
            dispatch({ type: 'SET_AUTH_METHODS', payload: methods })
          } catch (error) {
            console.warn('Failed to load auth methods:', error)
          }

          // Check device trust status
          const deviceInfo = authService.getDeviceInfo()
          dispatch({ type: 'SET_DEVICE_INFO', payload: deviceInfo })
          dispatch({ type: 'SET_DEVICE_TRUSTED', payload: authService.isDeviceTrusted() })
        } else {
          // Invalid session, clear it
          authService.clearStoredSession()
        }
      }

    } catch (error) {
      console.error('Authentication initialization failed:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Failed to initialize authentication' })
    } finally {
      dispatch({ type: 'SET_INITIALIZING', payload: false })
    }
  }, [authService])

  // Initialize on mount
  useEffect(() => {
    initialize()
  }, [initialize])

  // Auto-refresh session
  useEffect(() => {
    if (!state.session || !state.isAuthenticated) return

    const refreshInterval = setInterval(async () => {
      try {
        const result = await authService.refreshSession()
        if (result.success && result.session) {
          dispatch({ type: 'SET_SESSION', payload: result.session })
        } else {
          // Session refresh failed, logout
          await logout()
        }
      } catch (error) {
        console.error('Auto-refresh failed:', error)
        await logout()
      }
    }, 30 * 60 * 1000) // Refresh every 30 minutes

    return () => clearInterval(refreshInterval)
  }, [state.session, state.isAuthenticated])

  // Session activity tracking
  useEffect(() => {
    if (!state.isAuthenticated) return

    const handleActivity = () => {
      dispatch({ type: 'UPDATE_LAST_ACTIVITY' })
    }

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart']
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true)
    })

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true)
      })
    }
  }, [state.isAuthenticated])

  // Actions
  const login = useCallback(async (
    method: 'totp' | 'oauth', 
    credential: string, 
    options: LoginOptions = {}
  ): Promise<AuthResult> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })

      const result = await authService.login(method, credential, options)
      
      if (result.success && result.session) {
        dispatch({ type: 'SET_SESSION', payload: result.session })
        dispatch({ type: 'SET_USER', payload: {
          did: result.session.did,
          authMethods: result.session.permissions || []
        }})

        // Load authentication methods
        const methods = await authService.getAuthMethods(result.session.did)
        dispatch({ type: 'SET_AUTH_METHODS', payload: methods })

        // Update device trust if requested
        if (options.rememberDevice) {
          await trustDevice(true)
        }

        return result
      } else {
        dispatch({ type: 'SET_ERROR', payload: result.error || 'Login failed' })
        return result
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed'
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
      return { success: false, error: errorMessage }
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [authService])

  const logout = useCallback(async (revokeAll = false): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      
      if (state.session) {
        await authService.logout(state.session.token, revokeAll)
      }
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      dispatch({ type: 'RESET_STATE' })
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [authService, state.session])

  const refreshSession = useCallback(async (): Promise<AuthResult> => {
    try {
      if (!state.session) {
        return { success: false, error: 'No active session' }
      }

      const result = await authService.refreshSession()
      if (result.success && result.session) {
        dispatch({ type: 'SET_SESSION', payload: result.session })
        return result
      } else {
        await logout()
        return result
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Refresh failed'
      return { success: false, error: errorMessage }
    }
  }, [authService, state.session, logout])

  const setupTOTP = useCallback(async (
    did: string, 
    signature: string
  ): Promise<TOTPSetupResult> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })

      const result = await authService.setupTOTP(did, signature)
      
      if (!result.success) {
        dispatch({ type: 'SET_ERROR', payload: result.error || 'TOTP setup failed' })
      }

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'TOTP setup failed'
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
      return { success: false, error: errorMessage }
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [authService])

  const verifyTOTP = useCallback(async (
    did: string, 
    code: string, 
    signature: string
  ): Promise<AuthResult> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })

      const result = await authService.verifyTOTP(did, code, signature)
      
      if (result.success && result.session) {
        dispatch({ type: 'SET_SESSION', payload: result.session })
        dispatch({ type: 'SET_USER', payload: {
          did: result.session.did,
          authMethods: result.session.permissions || []
        }})

        // Reload authentication methods
        const methods = await authService.getAuthMethods(result.session.did)
        dispatch({ type: 'SET_AUTH_METHODS', payload: methods })
      } else {
        dispatch({ type: 'SET_ERROR', payload: result.error || 'TOTP verification failed' })
      }

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'TOTP verification failed'
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
      return { success: false, error: errorMessage }
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [authService])

  const initiateOAuth = useCallback(async (
    provider: 'microsoft' | 'google' | 'github', 
    did: string
  ): Promise<string> => {
    try {
      return await authService.initiateOAuth(provider, did)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'OAuth initiation failed'
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
      throw error
    }
  }, [authService])

  const handleOAuthCallback = useCallback(async (
    code: string, 
    state: string
  ): Promise<AuthResult> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })

      const result = await authService.handleOAuthCallback(code, state)
      
      if (result.success && result.session) {
        dispatch({ type: 'SET_SESSION', payload: result.session })
        dispatch({ type: 'SET_USER', payload: {
          did: result.session.did,
          authMethods: result.session.permissions || []
        }})

        // Reload authentication methods
        const methods = await authService.getAuthMethods(result.session.did)
        dispatch({ type: 'SET_AUTH_METHODS', payload: methods })
      } else {
        dispatch({ type: 'SET_ERROR', payload: result.error || 'OAuth callback failed' })
      }

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'OAuth callback failed'
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
      return { success: false, error: errorMessage }
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [authService])

  const trustDevice = useCallback(async (remember: boolean): Promise<void> => {
    try {
      if (remember && state.session) {
        await authService.trustCurrentDevice(state.session.did)
        dispatch({ type: 'SET_DEVICE_TRUSTED', payload: true })
      }
    } catch (error) {
      console.error('Failed to trust device:', error)
    }
  }, [authService, state.session])

  const revokeTrustedDevice = useCallback(async (deviceToken?: string): Promise<void> => {
    try {
      await authService.revokeTrustedDevice(deviceToken)
      if (!deviceToken) {
        // Revoking current device
        dispatch({ type: 'SET_DEVICE_TRUSTED', payload: false })
      }
    } catch (error) {
      console.error('Failed to revoke trusted device:', error)
    }
  }, [authService])

  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null })
  }, [])

  const checkHealth = useCallback(async (): Promise<{ success: boolean; message: string }> => {
    return await authService.checkHealth()
  }, [authService])

  const contextValue: PersonaAuthContextValue = {
    // State
    ...state,
    
    // Actions
    login,
    logout,
    refreshSession,
    setupTOTP,
    verifyTOTP,
    initiateOAuth,
    handleOAuthCallback,
    trustDevice,
    revokeTrustedDevice,
    clearError,
    checkHealth
  }

  return (
    <PersonaAuthContext.Provider value={contextValue}>
      {children}
    </PersonaAuthContext.Provider>
  )
}

// Hook to use PersonaAuth context
export function usePersonaAuth(): PersonaAuthContextValue {
  const context = useContext(PersonaAuthContext)
  if (!context) {
    throw new Error('usePersonaAuth must be used within a PersonaAuthProvider')
  }
  return context
}

// Export types
export type { PersonaAuthState, PersonaAuthActions }