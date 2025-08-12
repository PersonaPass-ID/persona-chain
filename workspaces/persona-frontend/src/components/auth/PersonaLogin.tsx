/**
 * PersonaPass Login Component - PRODUCTION READY
 * Enforces Google Authenticator for ALL logins
 */

import React, { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Alert, AlertDescription } from '../ui/alert'
import { Separator } from '../ui/separator'
import { personaChainService } from '../../lib/personachain-service'
import { usePersonaAuth } from '../../contexts/PersonaAuthContext'

interface PersonaLoginProps {
  onLoginSuccess: (session: any) => void
  onNeedSetup: (did: string) => void
}

export function PersonaLogin({ onLoginSuccess, onNeedSetup }: PersonaLoginProps) {
  const [loginMethod, setLoginMethod] = useState<'totp' | 'oauth' | null>(null)
  const [totpCode, setTotpCode] = useState('')
  const [did, setDid] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [networkStatus, setNetworkStatus] = useState<any>(null)
  
  const { login } = usePersonaAuth()

  /**
   * Check PersonaChain network status on component mount
   */
  useEffect(() => {
    checkNetworkStatus()
  }, [])

  const checkNetworkStatus = async () => {
    try {
      const status = await personaChainService.getNetworkStatus()
      setNetworkStatus(status)
      console.log('📡 PersonaChain Status:', status)
    } catch (err) {
      console.error('❌ Failed to check network status:', err)
    }
  }

  /**
   * Handle TOTP login with Google Authenticator
   */
  const handleTOTPLogin = async () => {
    if (!did || !totpCode) {
      setError('Please enter your DID and Google Authenticator code')
      return
    }

    if (totpCode.length !== 6) {
      setError('Google Authenticator code must be 6 digits')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      console.log('🔐 Attempting TOTP login for DID:', did)

      // Verify DID exists on PersonaChain
      const didDocument = await personaChainService.resolveDID(did)
      if (!didDocument) {
        throw new Error('DID not found on PersonaChain. Please create your PersonaPass account first.')
      }

      // Attempt login with TOTP
      const loginResult = await login('totp', totpCode, {
        did: did,
        deviceFingerprint: await generateDeviceFingerprint()
      })

      if (loginResult.success && loginResult.session) {
        console.log('✅ TOTP login successful')
        onLoginSuccess(loginResult.session)
      } else {
        throw new Error(loginResult.error || 'Login failed')
      }

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'TOTP login failed'
      
      // Check if user needs to set up TOTP
      if (errorMsg.includes('TOTP not configured')) {
        console.log('🔧 User needs TOTP setup')
        onNeedSetup(did)
      } else {
        setError(errorMsg)
        console.error('❌ TOTP login failed:', err)
      }
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Handle OAuth login (Microsoft, Google, GitHub)
   */
  const handleOAuthLogin = async (provider: 'microsoft' | 'google' | 'github') => {
    if (!did) {
      setError('Please enter your DID first')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      console.log(`🌐 Initiating OAuth login with ${provider} for DID:`, did)

      // Verify DID exists on PersonaChain
      const didDocument = await personaChainService.resolveDID(did)
      if (!didDocument) {
        throw new Error('DID not found on PersonaChain. Please create your PersonaPass account first.')
      }

      // Get OAuth URL from our auth service
      const response = await fetch('/api/auth/oauth/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: provider,
          did: did,
          state: `login_${Date.now()}`
        })
      })

      if (!response.ok) {
        throw new Error(`OAuth initiation failed: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success || !data.authUrl) {
        throw new Error(data.message || 'Failed to initiate OAuth')
      }

      // Redirect to OAuth provider
      window.location.href = data.authUrl

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'OAuth login failed'
      setError(errorMsg)
      console.error('❌ OAuth login failed:', err)
      setIsLoading(false)
    }
  }

  /**
   * Generate device fingerprint for security
   */
  const generateDeviceFingerprint = async (): Promise<string> => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    ctx?.fillText('PersonaPass Device Fingerprint', 0, 10)
    
    const fingerprint = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screen: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      canvas: canvas.toDataURL()
    }
    
    return btoa(JSON.stringify(fingerprint))
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-center mb-6">
        🔐 PersonaPass Login
      </h2>

      {/* Network Status */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between text-sm">
          <span>PersonaChain Network:</span>
          <span className={`font-semibold ${networkStatus?.online ? 'text-green-600' : 'text-red-600'}`}>
            {networkStatus?.online ? '🟢 Online' : '🔴 Offline'}
          </span>
        </div>
        {networkStatus?.blockHeight && (
          <div className="text-xs text-gray-500 mt-1">
            Block Height: {networkStatus.blockHeight.toLocaleString()}
          </div>
        )}
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* DID Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          PersonaChain DID
        </label>
        <Input
          type="text"
          placeholder="did:persona:personachain-1:..."
          value={did}
          onChange={(e) => setDid(e.target.value)}
          className="font-mono text-sm"
        />
        <p className="text-xs text-gray-500 mt-1">
          Your PersonaChain Decentralized Identifier
        </p>
      </div>

      {/* Login Method Selection */}
      {!loginMethod && (
        <div className="space-y-3">
          <Button
            onClick={() => setLoginMethod('totp')}
            className="w-full"
            variant="default"
          >
            🔐 Login with Google Authenticator
          </Button>
          
          <Separator className="my-4" />
          
          <div className="space-y-2">
            <Button
              onClick={() => handleOAuthLogin('microsoft')}
              disabled={isLoading || !did}
              className="w-full"
              variant="outline"
            >
              {isLoading ? 'Redirecting...' : '🏢 Login with Microsoft'}
            </Button>
            
            <Button
              onClick={() => handleOAuthLogin('google')}
              disabled={isLoading || !did}
              className="w-full"
              variant="outline"
            >
              {isLoading ? 'Redirecting...' : '🌐 Login with Google'}
            </Button>
            
            <Button
              onClick={() => handleOAuthLogin('github')}
              disabled={isLoading || !did}
              className="w-full"
              variant="outline"
            >
              {isLoading ? 'Redirecting...' : '🐙 Login with GitHub'}
            </Button>
          </div>
        </div>
      )}

      {/* TOTP Login Form */}
      {loginMethod === 'totp' && (
        <div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Google Authenticator Code
            </label>
            <Input
              type="text"
              placeholder="000000"
              maxLength={6}
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
              className="text-center text-2xl font-mono"
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter the 6-digit code from your Google Authenticator app
            </p>
          </div>

          <div className="space-y-2">
            <Button
              onClick={handleTOTPLogin}
              disabled={isLoading || !did || totpCode.length !== 6}
              className="w-full"
            >
              {isLoading ? 'Logging in...' : 'Login with TOTP'}
            </Button>
            
            <Button
              onClick={() => setLoginMethod(null)}
              variant="outline"
              className="w-full"
            >
              ← Back to Login Options
            </Button>
          </div>
        </div>
      )}

      {/* Security Notice */}
      <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-xs text-blue-800 text-center">
          🔒 All logins require Google Authenticator or OAuth verification
        </p>
        <p className="text-xs text-blue-600 text-center mt-1">
          Your identity is secured by PersonaChain blockchain
        </p>
      </div>

      <div className="mt-4 text-xs text-center text-gray-500">
        <p>New to PersonaPass? <a href="/signup" className="text-blue-600 hover:underline">Create Account</a></p>
      </div>
    </div>
  )
}