'use client'

/**
 * Authentication Service - Client-side service for PersonaPass authentication
 * Integrates with backend Lambda functions for TOTP, OAuth, and session management
 */

import crypto from 'crypto-js'

// Types
export interface AuthMethod {
  id: string
  did: string
  method_type: string
  method_id: string
  oauth_provider?: string
  oauth_user_id?: string
  oauth_email?: string
  oauth_name?: string
  public_key_hash: string
  attestation?: string
  blockchain_tx_hash?: string
  blockchain_block_height?: number
  is_active: boolean
  is_primary: boolean
  last_used_at?: string
  created_at?: string
  updated_at?: string
}

export interface AuthSession {
  token: string
  did: string
  method_id: string
  method_type: string
  expires_at: number
  permissions: string[]
  device_token?: string
}

export interface AuthUser {
  did: string
  authMethods: string[]
}

export interface DeviceInfo {
  fingerprint: string
  userAgent: string
  trusted: boolean
  createdAt: Date
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

// Storage keys
const STORAGE_KEYS = {
  SESSION: 'persona_auth_session',
  DEVICE_INFO: 'persona_device_info',
  DEVICE_TOKEN: 'persona_device_token'
} as const

export class AuthService {
  private apiBaseUrl: string

  constructor(apiBaseUrl?: string) {
    this.apiBaseUrl = apiBaseUrl || process.env.NEXT_PUBLIC_API_BASE_URL || ''
    if (!this.apiBaseUrl) {
      console.warn('No API base URL configured for AuthService')
    }
  }

  // Device fingerprinting
  private generateDeviceFingerprint(): string {
    const components = [
      navigator.userAgent,
      navigator.language,
      navigator.platform,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset().toString(),
      navigator.hardwareConcurrency || '0'
    ]
    
    const fingerprint = components.join('|')
    return crypto.SHA256(fingerprint).toString()
  }

  private getDeviceInfo(): DeviceInfo {
    const stored = localStorage.getItem(STORAGE_KEYS.DEVICE_INFO)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        return {
          ...parsed,
          createdAt: new Date(parsed.createdAt)
        }
      } catch (error) {
        console.error('Failed to parse stored device info:', error)
      }
    }

    const deviceInfo: DeviceInfo = {
      fingerprint: this.generateDeviceFingerprint(),
      userAgent: navigator.userAgent,
      trusted: false,
      createdAt: new Date()
    }

    localStorage.setItem(STORAGE_KEYS.DEVICE_INFO, JSON.stringify(deviceInfo))
    return deviceInfo
  }

  getDeviceInfo(): DeviceInfo {
    return this.getDeviceInfo()
  }

  isDeviceTrusted(): boolean {
    const deviceToken = localStorage.getItem(STORAGE_KEYS.DEVICE_TOKEN)
    return !!deviceToken
  }

  // Session management
  getStoredSession(): AuthSession | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SESSION)
      if (stored) {
        const session = JSON.parse(stored)
        
        // Check if session is expired
        if (Date.now() > session.expires_at) {
          this.clearStoredSession()
          return null
        }
        
        return session
      }
    } catch (error) {
      console.error('Failed to parse stored session:', error)
      this.clearStoredSession()
    }
    return null
  }

  private storeSession(session: AuthSession): void {
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session))
  }

  clearStoredSession(): void {
    localStorage.removeItem(STORAGE_KEYS.SESSION)
  }

  // API calls
  private async makeApiCall<T>(
    endpoint: string, 
    method: 'GET' | 'POST' = 'POST',
    body?: any,
    headers: Record<string, string> = {}
  ): Promise<T> {
    const url = `${this.apiBaseUrl}${endpoint}`
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: body ? JSON.stringify(body) : undefined
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API call failed: ${response.status} ${errorText}`)
    }

    return response.json()
  }

  // TOTP Authentication
  async setupTOTP(did: string, signature: string): Promise<TOTPSetupResult> {
    try {
      const response = await this.makeApiCall<{
        success: boolean
        data?: {
          secret: string
          qr_code: string
          backup_codes: string[]
          verification_required: boolean
        }
        message?: string
      }>('/totp-setup', 'POST', {
        did,
        signature
      })

      if (response.success && response.data) {
        return {
          success: true,
          secret: response.data.secret,
          qrCode: response.data.qr_code,
          backupCodes: response.data.backup_codes
        }
      } else {
        return {
          success: false,
          error: response.message || 'TOTP setup failed'
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'TOTP setup failed'
      }
    }
  }

  async verifyTOTP(did: string, code: string, signature: string): Promise<AuthResult> {
    try {
      const response = await this.makeApiCall<{
        success: boolean
        method_id?: string
        blockchain_tx?: string
        message?: string
      }>('/totp-verify-setup', 'POST', {
        did,
        code,
        signature
      })

      if (response.success) {
        // TOTP verification doesn't return a session directly
        // User needs to log in after verification
        return {
          success: true,
          requiresSetup: false
        }
      } else {
        return {
          success: false,
          error: response.message || 'TOTP verification failed'
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'TOTP verification failed'
      }
    }
  }

  // OAuth Authentication
  async initiateOAuth(provider: 'microsoft' | 'google' | 'github', did: string): Promise<string> {
    const state = btoa(JSON.stringify({
      did,
      nonce: crypto.lib.WordArray.random(16).toString(),
      timestamp: Date.now(),
      provider,
      redirect_url: window.location.origin + '/auth/callback'
    }))

    const clientIds = {
      microsoft: process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID,
      google: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      github: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID
    }

    const redirectUris = {
      microsoft: `${this.apiBaseUrl}/oauth-callback/microsoft`,
      google: `${this.apiBaseUrl}/oauth-callback/google`,
      github: `${this.apiBaseUrl}/oauth-callback/github`
    }

    const authUrls = {
      microsoft: `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientIds.microsoft}&response_type=code&redirect_uri=${encodeURIComponent(redirectUris.microsoft!)}&scope=openid+profile+email&state=${state}`,
      google: `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientIds.google}&response_type=code&redirect_uri=${encodeURIComponent(redirectUris.google!)}&scope=openid+profile+email&state=${state}`,
      github: `https://github.com/login/oauth/authorize?client_id=${clientIds.github}&redirect_uri=${encodeURIComponent(redirectUris.github!)}&scope=user:email&state=${state}`
    }

    return authUrls[provider]
  }

  async handleOAuthCallback(code: string, state: string): Promise<AuthResult> {
    try {
      const response = await this.makeApiCall<{
        success: boolean
        data?: {
          session_token: string
          method_id: string
          blockchain_tx: string
          redirect_url?: string
        }
        message?: string
      }>('/oauth-callback', 'POST', {
        code,
        state
      })

      if (response.success && response.data) {
        // Parse the session token to get session details
        const sessionData = this.parseSessionToken(response.data.session_token)
        
        const session: AuthSession = {
          token: response.data.session_token,
          did: sessionData.did,
          method_id: response.data.method_id,
          method_type: sessionData.method_type,
          expires_at: sessionData.expires_at,
          permissions: []
        }

        this.storeSession(session)

        return {
          success: true,
          session
        }
      } else {
        return {
          success: false,
          error: response.message || 'OAuth callback failed'
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'OAuth callback failed'
      }
    }
  }

  // Session Management
  async login(method: 'totp' | 'oauth', credential: string, options: LoginOptions = {}): Promise<AuthResult> {
    try {
      // For TOTP, we need the DID as well
      // This is a simplified version - in reality, you'd need the DID from context
      const body: any = {
        method_type: method === 'totp' ? 'totp' : 'oauth_microsoft', // Simplified
        credential,
        remember_device: options.rememberDevice
      }

      const response = await this.makeApiCall<{
        success: boolean
        data?: {
          session_token: string
          expires_at: number
          method_id: string
          permissions: string[]
          device_token?: string
        }
        message?: string
      }>('/session-create', 'POST', body)

      if (response.success && response.data) {
        const sessionData = this.parseSessionToken(response.data.session_token)
        
        const session: AuthSession = {
          token: response.data.session_token,
          did: sessionData.did,
          method_id: response.data.method_id,
          method_type: sessionData.method_type,
          expires_at: response.data.expires_at,
          permissions: response.data.permissions,
          device_token: response.data.device_token
        }

        this.storeSession(session)

        // Store device token if provided
        if (response.data.device_token) {
          localStorage.setItem(STORAGE_KEYS.DEVICE_TOKEN, response.data.device_token)
        }

        return {
          success: true,
          session
        }
      } else {
        return {
          success: false,
          error: response.message || 'Login failed'
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed'
      }
    }
  }

  async logout(sessionToken?: string, revokeAll = false): Promise<void> {
    try {
      const token = sessionToken || this.getStoredSession()?.token
      if (!token) return

      await this.makeApiCall('/session-revoke', 'POST', {
        session_token: token,
        revoke_all: revokeAll,
        device_token: localStorage.getItem(STORAGE_KEYS.DEVICE_TOKEN)
      })
    } catch (error) {
      console.error('Logout API call failed:', error)
    } finally {
      this.clearStoredSession()
      localStorage.removeItem(STORAGE_KEYS.DEVICE_TOKEN)
    }
  }

  async validateSession(sessionToken: string): Promise<AuthResult> {
    try {
      const response = await this.makeApiCall<{
        success: boolean
        data?: {
          valid: boolean
          did: string
          method_id: string
          method_type: string
          expires_at: number
          permissions: string[]
          new_token?: string
        }
        message?: string
      }>('/session-validate', 'POST', {
        session_token: sessionToken,
        refresh: true
      })

      if (response.success && response.data?.valid) {
        const session: AuthSession = {
          token: response.data.new_token || sessionToken,
          did: response.data.did,
          method_id: response.data.method_id,
          method_type: response.data.method_type,
          expires_at: response.data.expires_at,
          permissions: response.data.permissions
        }

        // Update stored session if token was refreshed
        if (response.data.new_token) {
          this.storeSession(session)
        }

        return {
          success: true,
          session
        }
      } else {
        return {
          success: false,
          error: response.message || 'Session invalid'
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Session validation failed'
      }
    }
  }

  async refreshSession(): Promise<AuthResult> {
    const currentSession = this.getStoredSession()
    if (!currentSession) {
      return { success: false, error: 'No active session' }
    }

    return this.validateSession(currentSession.token)
  }

  // Device Management
  async trustCurrentDevice(did: string): Promise<void> {
    const deviceInfo = this.getDeviceInfo()
    // This would typically be handled during login with remember_device flag
    // Here we're just marking it locally
    localStorage.setItem(STORAGE_KEYS.DEVICE_TOKEN, crypto.lib.WordArray.random(16).toString())
  }

  async revokeTrustedDevice(deviceToken?: string): Promise<void> {
    const token = deviceToken || localStorage.getItem(STORAGE_KEYS.DEVICE_TOKEN)
    if (!token) return

    try {
      await this.makeApiCall('/session-revoke', 'POST', {
        device_token: token
      })
    } finally {
      if (!deviceToken) {
        // Revoking current device
        localStorage.removeItem(STORAGE_KEYS.DEVICE_TOKEN)
      }
    }
  }

  // Utility methods
  async getAuthMethods(did: string): Promise<AuthMethod[]> {
    try {
      // This would be a separate endpoint in a full implementation
      // For now, return empty array
      return []
    } catch (error) {
      console.error('Failed to get auth methods:', error)
      return []
    }
  }

  async checkHealth(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.makeApiCall<{
        success: boolean
        message: string
      }>('/health', 'GET')

      return response
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Health check failed'
      }
    }
  }

  // Helper methods
  private parseSessionToken(token: string): any {
    try {
      // Simple JWT-style parsing (not secure, just for demo)
      const parts = token.split('.')
      const payload = parts[0]
      const decoded = atob(payload)
      return JSON.parse(decoded)
    } catch (error) {
      console.error('Failed to parse session token:', error)
      return {}
    }
  }
}