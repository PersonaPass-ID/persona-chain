'use client'

/**
 * OAuth Login Component - Handles OAuth provider authentication
 * Supports Microsoft, Google, and GitHub OAuth flows
 */

import React, { useState, useCallback, useEffect } from 'react'
import { usePersonaAuth } from '@/contexts/PersonaAuthContext'
import { useWalletAuth } from '@/hooks/useWalletAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ExternalLink, AlertTriangle, CheckCircle, Github } from 'lucide-react'

// OAuth Provider Icons
const MicrosoftIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11 11H0V0h11v11z" fill="#F25022"/>
    <path d="M23 11H12V0h11v11z" fill="#7FBA00"/>
    <path d="M11 23H0V12h11v11z" fill="#00A4EF"/>
    <path d="M23 23H12V12h11v11z" fill="#FFB900"/>
  </svg>
)

const GoogleIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)

interface OAuthLoginProps {
  onSuccess?: () => void
  onCancel?: () => void
  rememberDevice?: boolean
}

type OAuthProvider = 'microsoft' | 'google' | 'github'

export function OAuthLogin({ onSuccess, onCancel, rememberDevice = false }: OAuthLoginProps) {
  const { initiateOAuth, error, clearError } = usePersonaAuth()
  const { user: walletUser } = useWalletAuth()
  
  const [selectedProvider, setSelectedProvider] = useState<OAuthProvider | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [authUrl, setAuthUrl] = useState<string | null>(null)

  const providers = [
    {
      id: 'microsoft' as const,
      name: 'Microsoft',
      icon: MicrosoftIcon,
      description: 'Sign in with your Microsoft account',
      color: 'bg-blue-500 hover:bg-blue-600',
      available: !!process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID
    },
    {
      id: 'google' as const,
      name: 'Google',
      icon: GoogleIcon,
      description: 'Sign in with your Google account',
      color: 'bg-red-500 hover:bg-red-600',
      available: !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    },
    {
      id: 'github' as const,
      name: 'GitHub',
      icon: Github,
      description: 'Sign in with your GitHub account',
      color: 'bg-gray-800 hover:bg-gray-900',
      available: !!process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID
    }
  ]

  // Clear errors when component mounts
  useEffect(() => {
    clearError()
  }, [clearError])

  const handleProviderSelect = useCallback(async (provider: OAuthProvider) => {
    if (!walletUser?.did) {
      console.error('No wallet user or DID available')
      return
    }

    try {
      setIsConnecting(true)
      setSelectedProvider(provider)
      clearError()

      const url = await initiateOAuth(provider, walletUser.did)
      setAuthUrl(url)

      // Open OAuth URL in new window
      const authWindow = window.open(
        url,
        'oauth-auth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      )

      if (!authWindow) {
        throw new Error('Failed to open authentication window. Please allow popups for this site.')
      }

      // Listen for the OAuth callback
      const messageListener = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) {
          return
        }

        if (event.data.type === 'oauth-success') {
          authWindow.close()
          window.removeEventListener('message', messageListener)
          setIsConnecting(false)
          onSuccess?.()
        } else if (event.data.type === 'oauth-error') {
          authWindow.close()
          window.removeEventListener('message', messageListener)
          setIsConnecting(false)
          console.error('OAuth error:', event.data.error)
        }
      }

      window.addEventListener('message', messageListener)

      // Cleanup if window is closed manually
      const checkClosed = setInterval(() => {
        if (authWindow.closed) {
          clearInterval(checkClosed)
          window.removeEventListener('message', messageListener)
          setIsConnecting(false)
          setSelectedProvider(null)
        }
      }, 1000)

    } catch (error) {
      console.error('OAuth initiation failed:', error)
      setIsConnecting(false)
      setSelectedProvider(null)
    }
  }, [walletUser?.did, initiateOAuth, clearError, onSuccess])

  if (!walletUser) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>OAuth Authentication</CardTitle>
          <CardDescription>
            Please connect your wallet to access OAuth authentication
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const availableProviders = providers.filter(p => p.available)

  if (availableProviders.length === 0) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>OAuth Authentication</CardTitle>
          <CardDescription>
            No OAuth providers are currently configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Please contact your administrator to configure OAuth providers.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>OAuth Authentication</CardTitle>
        <CardDescription>
          Sign in with your preferred OAuth provider
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="bg-muted p-3 rounded-lg">
          <div className="text-xs text-muted-foreground mb-1">DID Identity</div>
          <code className="text-xs break-all">{walletUser.did}</code>
        </div>

        <div className="space-y-3">
          <div className="text-sm font-medium">Choose a provider:</div>
          
          {availableProviders.map((provider) => {
            const Icon = provider.icon
            const isSelected = selectedProvider === provider.id
            const isLoading = isConnecting && isSelected

            return (
              <Button
                key={provider.id}
                variant="outline"
                onClick={() => handleProviderSelect(provider.id)}
                disabled={isConnecting}
                className={`w-full h-12 justify-start space-x-3 relative ${
                  isSelected && isConnecting ? 'bg-muted' : ''
                }`}
              >
                <div className={`p-1.5 rounded ${provider.color.replace('hover:', '')} text-white`}>
                  <Icon />
                </div>
                <div className="flex flex-col items-start">
                  <div className="font-medium">{provider.name}</div>
                  <div className="text-xs text-muted-foreground">{provider.description}</div>
                </div>
                {isLoading && (
                  <div className="absolute right-3">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  </div>
                )}
                {!isLoading && (
                  <ExternalLink className="h-4 w-4 ml-auto" />
                )}
              </Button>
            )
          })}
        </div>

        {isConnecting && (
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <span>Opening {selectedProvider} authentication...</span>
            </div>
            <p className="text-xs text-muted-foreground">
              A new window will open for authentication. Please complete the process in that window.
            </p>
          </div>
        )}

        {rememberDevice && (
          <>
            <Separator />
            <div className="flex items-center justify-center">
              <Badge variant="secondary" className="text-xs">
                This device will be remembered
              </Badge>
            </div>
          </>
        )}
      </CardContent>

      {onCancel && (
        <div className="p-6 pt-0">
          <Button variant="outline" onClick={onCancel} disabled={isConnecting} className="w-full">
            Cancel
          </Button>
        </div>
      )}
    </Card>
  )
}