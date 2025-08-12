/**
 * React Hook for WebAuthn/FIDO2 Biometric Authentication
 * 
 * Provides easy integration with WebAuthn service for React components
 */

import { useState, useEffect, useCallback } from 'react'
import { webAuthnService, type BiometricCredential, type AuthenticationResult, type RegistrationResult } from '@/lib/webauthn/webauthn-service'

export interface UseWebAuthnReturn {
  // State
  isSupported: boolean
  isRegistering: boolean
  isAuthenticating: boolean
  credentials: BiometricCredential[]
  error: string | null
  lastAuthentication: AuthenticationResult | null
  
  // Authenticator capabilities
  platformAuthenticatorAvailable: boolean
  conditionalMediationAvailable: boolean
  
  // Actions
  register: (userId: string, walletAddress: string, friendlyName: string, options?: {
    authenticatorSelection?: {
      authenticatorAttachment?: 'platform' | 'cross-platform'
      userVerification?: 'required' | 'preferred' | 'discouraged'
      requireResidentKey?: boolean
    }
    attestation?: 'none' | 'indirect' | 'direct'
  }) => Promise<RegistrationResult>
  
  authenticate: (walletAddress: string, options?: {
    userVerification?: 'required' | 'preferred' | 'discouraged'
    timeout?: number
    allowCredentials?: string[]
  }) => Promise<AuthenticationResult>
  
  loadCredentials: (walletAddress: string) => Promise<void>
  removeCredential: (walletAddress: string, credentialId: string) => Promise<boolean>
  clearError: () => void
  
  // Utility functions
  getCredentialSecurityInfo: (credential: BiometricCredential) => {
    securityLevel: 'high' | 'medium' | 'low'
    factors: string[]
    recommendations: string[]
  }
}

export function useWebAuthn(): UseWebAuthnReturn {
  // State
  const [isSupported, setIsSupported] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [credentials, setCredentials] = useState<BiometricCredential[]>([])
  const [error, setError] = useState<string | null>(null)
  const [lastAuthentication, setLastAuthentication] = useState<AuthenticationResult | null>(null)
  
  // Authenticator capabilities
  const [platformAuthenticatorAvailable, setPlatformAuthenticatorAvailable] = useState(false)
  const [conditionalMediationAvailable, setConditionalMediationAvailable] = useState(false)

  // Initialize WebAuthn support check
  useEffect(() => {
    const checkSupport = async () => {
      const supported = webAuthnService.isSupported()
      setIsSupported(supported)
      
      if (supported) {
        try {
          const authenticatorInfo = await webAuthnService.getAuthenticatorInfo()
          setPlatformAuthenticatorAvailable(authenticatorInfo.platformAuthenticatorAvailable)
          setConditionalMediationAvailable(authenticatorInfo.conditionalMediationAvailable)
          
          console.log('🔐 WebAuthn capabilities:', authenticatorInfo)
        } catch (error) {
          console.warn('⚠️ Error checking WebAuthn capabilities:', error)
        }
      }
    }
    
    checkSupport()
  }, [])

  // Register new biometric credential
  const register = useCallback(async (
    userId: string,
    walletAddress: string,
    friendlyName: string,
    options: {
      authenticatorSelection?: {
        authenticatorAttachment?: 'platform' | 'cross-platform'
        userVerification?: 'required' | 'preferred' | 'discouraged'
        requireResidentKey?: boolean
      }
      attestation?: 'none' | 'indirect' | 'direct'
    } = {}
  ): Promise<RegistrationResult> => {
    if (!isSupported) {
      const result: RegistrationResult = {
        success: false,
        error: 'WebAuthn not supported in this browser'
      }
      setError(result.error!)
      return result
    }

    setIsRegistering(true)
    setError(null)

    try {
      console.log(`🔐 Registering biometric credential for user: ${userId}`)
      
      const result = await webAuthnService.registerCredential(
        userId,
        walletAddress,
        friendlyName,
        options
      )

      if (result.success && result.credential) {
        // Add new credential to state
        setCredentials(prev => [...prev, result.credential!])
        console.log('✅ Biometric credential registered successfully')
      } else {
        setError(result.error || 'Registration failed')
        console.error('❌ Registration failed:', result.error)
      }

      return result

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed'
      setError(errorMessage)
      console.error('❌ Registration error:', error)
      
      return {
        success: false,
        error: errorMessage
      }
    } finally {
      setIsRegistering(false)
    }
  }, [isSupported])

  // Authenticate using biometric credential
  const authenticate = useCallback(async (
    walletAddress: string,
    options: {
      userVerification?: 'required' | 'preferred' | 'discouraged'
      timeout?: number
      allowCredentials?: string[]
    } = {}
  ): Promise<AuthenticationResult> => {
    if (!isSupported) {
      const result: AuthenticationResult = {
        success: false,
        error: 'WebAuthn not supported in this browser',
        userVerified: false
      }
      setError(result.error!)
      return result
    }

    setIsAuthenticating(true)
    setError(null)

    try {
      console.log(`🔐 Authenticating with biometric for wallet: ${walletAddress}`)
      
      const result = await webAuthnService.authenticate(walletAddress, options)

      if (result.success) {
        setLastAuthentication(result)
        console.log('✅ Biometric authentication successful')
        
        // Update last used time for the credential
        await loadCredentials(walletAddress)
      } else {
        setError(result.error || 'Authentication failed')
        console.error('❌ Authentication failed:', result.error)
      }

      return result

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed'
      setError(errorMessage)
      console.error('❌ Authentication error:', error)
      
      return {
        success: false,
        error: errorMessage,
        userVerified: false
      }
    } finally {
      setIsAuthenticating(false)
    }
  }, [isSupported])

  // Load stored credentials for wallet
  const loadCredentials = useCallback(async (walletAddress: string): Promise<void> => {
    try {
      const storedCredentials = await webAuthnService.getStoredCredentials(walletAddress)
      setCredentials(storedCredentials)
      console.log(`📋 Loaded ${storedCredentials.length} biometric credentials`)
    } catch (error) {
      console.error('❌ Error loading credentials:', error)
      setError('Failed to load credentials')
    }
  }, [])

  // Remove a biometric credential
  const removeCredential = useCallback(async (
    walletAddress: string,
    credentialId: string
  ): Promise<boolean> => {
    try {
      const success = await webAuthnService.removeCredential(walletAddress, credentialId)
      
      if (success) {
        // Remove from state
        setCredentials(prev => prev.filter(cred => cred.credentialId !== credentialId))
        console.log(`🗑️ Removed biometric credential: ${credentialId.slice(0, 8)}...`)
      }
      
      return success
    } catch (error) {
      console.error('❌ Error removing credential:', error)
      setError('Failed to remove credential')
      return false
    }
  }, [])

  // Clear error state
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Get credential security information
  const getCredentialSecurityInfo = useCallback((credential: BiometricCredential) => {
    return webAuthnService.getCredentialSecurityInfo(credential)
  }, [])

  return {
    // State
    isSupported,
    isRegistering,
    isAuthenticating,
    credentials,
    error,
    lastAuthentication,
    
    // Capabilities
    platformAuthenticatorAvailable,
    conditionalMediationAvailable,
    
    // Actions
    register,
    authenticate,
    loadCredentials,
    removeCredential,
    clearError,
    
    // Utilities
    getCredentialSecurityInfo
  }
}