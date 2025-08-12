'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { TOTPSetup } from './TOTPSetup'
import { TOTPLogin } from './TOTPLogin'
import { BackupCodeLogin } from './BackupCodeLogin'
import { 
  Shield, 
  Smartphone, 
  Key,
  Plus,
  AlertTriangle,
  CheckCircle,
  Chrome,
  Github
} from 'lucide-react'

export interface AuthenticationFlowProps {
  did: string
  signature: string
  availableMethods: Array<{
    type: 'totp' | 'oauth_google' | 'oauth_github' | 'oauth_microsoft'
    provider?: string
    isSetup: boolean
    isPrimary: boolean
  }>
  onAuthSuccess: (session: any) => void
  onCancel: () => void
}

type FlowStep = 'select' | 'totp-setup' | 'totp-login' | 'backup-login' | 'oauth'

export function AuthenticationFlow({ 
  did, 
  signature, 
  availableMethods, 
  onAuthSuccess, 
  onCancel 
}: AuthenticationFlowProps) {
  const [currentStep, setCurrentStep] = useState<FlowStep>('select')
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check what methods are available
  const totpMethod = availableMethods.find(m => m.type === 'totp')
  const oauthMethods = availableMethods.filter(m => m.type.startsWith('oauth_'))
  const hasAnySetupMethods = availableMethods.some(m => m.isSetup)

  const handleMethodSelect = (methodType: string) => {
    setSelectedMethod(methodType)
    setError(null)

    switch (methodType) {
      case 'totp':
        if (totpMethod?.isSetup) {
          setCurrentStep('totp-login')
        } else {
          setCurrentStep('totp-setup')
        }
        break
      case 'oauth_google':
      case 'oauth_github': 
      case 'oauth_microsoft':
        setCurrentStep('oauth')
        handleOAuthLogin(methodType)
        break
      default:
        setError('Unsupported authentication method')
    }
  }

  const handleTOTPSetupComplete = (success: boolean, methodId?: string) => {
    if (success) {
      setCurrentStep('totp-login')
      // Refresh available methods to show TOTP as setup
    } else {
      setCurrentStep('select')
      setError('TOTP setup failed')
    }
  }

  const handleTOTPLogin = async (code: string, rememberDevice?: boolean) => {
    setIsLoading(true)
    try {
      // Mock successful login for demo
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockSession = {
        token: 'mock-session-token',
        did,
        method_id: 'mock-totp-method',
        method_type: 'totp',
        expires_at: Date.now() + 3600000,
        permissions: ['read', 'write']
      }
      
      onAuthSuccess(mockSession)
      return { success: true }
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Login failed' 
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackupCodeLogin = async (code: string) => {
    setIsLoading(true)
    try {
      // Mock successful login for demo
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockSession = {
        token: 'mock-session-token',
        did,
        method_id: 'mock-totp-method',
        method_type: 'totp',
        expires_at: Date.now() + 3600000,
        permissions: ['read', 'write']
      }
      
      onAuthSuccess(mockSession)
      return { success: true }
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Login failed' 
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleOAuthLogin = async (provider: string) => {
    setIsLoading(true)
    try {
      // Mock OAuth flow for demo
      const authUrl = `https://accounts.${provider.replace('oauth_', '')}.com/oauth/authorize?client_id=mock&redirect_uri=${encodeURIComponent(window.location.origin)}/auth/callback&response_type=code&scope=openid%20profile%20email&state=${did}`
      
      // In a real implementation, you would redirect to the OAuth provider
      console.log('Would redirect to:', authUrl)
      
      // For demo, simulate successful OAuth
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const mockSession = {
        token: 'mock-session-token',
        did,
        method_id: `mock-${provider}-method`,
        method_type: provider,
        expires_at: Date.now() + 3600000,
        permissions: ['read', 'write']
      }
      
      onAuthSuccess(mockSession)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OAuth authentication failed')
      setCurrentStep('select')
    } finally {
      setIsLoading(false)
    }
  }

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'oauth_google':
        return <Chrome className="w-5 h-5" />
      case 'oauth_github':
        return <Github className="w-5 h-5" />
      case 'oauth_microsoft':
        return <div className="w-5 h-5 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">M</div>
      default:
        return <Key className="w-5 h-5" />
    }
  }

  const getProviderName = (provider: string) => {
    switch (provider) {
      case 'oauth_google': return 'Google'
      case 'oauth_github': return 'GitHub' 
      case 'oauth_microsoft': return 'Microsoft'
      default: return provider
    }
  }

  // Render current step
  switch (currentStep) {
    case 'totp-setup':
      return (
        <TOTPSetup
          did={did}
          signature={signature}
          onComplete={handleTOTPSetupComplete}
          onCancel={() => setCurrentStep('select')}
        />
      )

    case 'totp-login':
      return (
        <TOTPLogin
          did={did}
          onLogin={handleTOTPLogin}
          onCancel={() => setCurrentStep('select')}
          onUseBackupCode={() => setCurrentStep('backup-login')}
          isLoading={isLoading}
        />
      )

    case 'backup-login':
      return (
        <BackupCodeLogin
          did={did}
          onLogin={handleBackupCodeLogin}
          onCancel={() => setCurrentStep('select')}
          onBackToTOTP={() => setCurrentStep('totp-login')}
          isLoading={isLoading}
        />
      )

    case 'oauth':
      return (
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                {getProviderIcon(selectedMethod || '')}
              </div>
              <CardTitle>
                Redirecting to {getProviderName(selectedMethod || '')}
              </CardTitle>
              <p className="text-sm text-gray-600">
                Please complete authentication with your OAuth provider
              </p>
            </CardHeader>
            <CardContent className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <Button variant="outline" onClick={() => setCurrentStep('select')}>
                Cancel
              </Button>
            </CardContent>
          </Card>
        </div>
      )

    case 'select':
    default:
      return (
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-indigo-600" />
              </div>
              <CardTitle className="text-xl">Choose Authentication Method</CardTitle>
              <p className="text-sm text-gray-600">
                Select how you want to authenticate with PersonaPass
              </p>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* DID Display */}
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <Key className="w-4 h-4 text-gray-500" />
                  <span className="text-xs text-gray-600">Authenticating DID:</span>
                </div>
                <code className="text-sm font-mono text-gray-800 break-all">
                  {did}
                </code>
              </div>

              {/* Error Message */}
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* No methods warning */}
              {!hasAnySetupMethods && (
                <Alert>
                  <Smartphone className="h-4 w-4" />
                  <AlertDescription>
                    No authentication methods are set up yet. You'll need to set up at least one method to secure your account.
                  </AlertDescription>
                </Alert>
              )}

              {/* TOTP Method */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Time-based One-Time Password (TOTP)</h3>
                <Button
                  variant={totpMethod?.isSetup ? "default" : "outline"}
                  onClick={() => handleMethodSelect('totp')}
                  disabled={isLoading}
                  className="w-full justify-start"
                >
                  <Smartphone className="w-4 h-4 mr-3" />
                  <span className="flex-1 text-left">Google Authenticator</span>
                  <div className="flex items-center space-x-2">
                    {totpMethod?.isSetup ? (
                      <Badge variant="default" className="text-xs">Configured</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        <Plus className="w-3 h-3 mr-1" />
                        Setup
                      </Badge>
                    )}
                    {totpMethod?.isPrimary && (
                      <Badge variant="outline" className="text-xs">Primary</Badge>
                    )}
                  </div>
                </Button>
              </div>

              {/* OAuth Methods */}
              {oauthMethods.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Social Authentication</h3>
                  <div className="space-y-2">
                    {oauthMethods.map((method) => (
                      <Button
                        key={method.type}
                        variant={method.isSetup ? "default" : "outline"}
                        onClick={() => handleMethodSelect(method.type)}
                        disabled={isLoading}
                        className="w-full justify-start"
                      >
                        {getProviderIcon(method.type)}
                        <span className="flex-1 text-left ml-3">
                          {getProviderName(method.type)}
                        </span>
                        <div className="flex items-center space-x-2">
                          {method.isSetup ? (
                            <Badge variant="default" className="text-xs">Connected</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              <Plus className="w-3 h-3 mr-1" />
                              Connect
                            </Badge>
                          )}
                          {method.isPrimary && (
                            <Badge variant="outline" className="text-xs">Primary</Badge>
                          )}
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Cancel Button */}
              <div className="pt-4 border-t">
                <Button variant="ghost" onClick={onCancel} className="w-full">
                  Cancel Authentication
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
  }
}