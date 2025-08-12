'use client'

/**
 * OAuth Callback Component - Handles OAuth provider callback and token exchange
 * Processes the authorization code and completes the authentication flow
 */

import React, { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { usePersonaAuth } from '@/contexts/PersonaAuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, AlertTriangle, Loader2 } from 'lucide-react'

interface OAuthCallbackProps {
  redirectTo?: string
}

export function OAuthCallback({ redirectTo = '/' }: OAuthCallbackProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { handleOAuthCallback, error } = usePersonaAuth()
  
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const processCallback = async () => {
      try {
        const code = searchParams.get('code')
        const state = searchParams.get('state')
        const error = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')

        // Check for OAuth errors
        if (error) {
          setStatus('error')
          setMessage(errorDescription || `OAuth error: ${error}`)
          
          // Send error message to parent window
          if (window.opener) {
            window.opener.postMessage({
              type: 'oauth-error',
              error: errorDescription || `OAuth error: ${error}`
            }, window.location.origin)
          }
          return
        }

        // Check for required parameters
        if (!code || !state) {
          setStatus('error')
          setMessage('Missing required OAuth parameters')
          
          if (window.opener) {
            window.opener.postMessage({
              type: 'oauth-error',
              error: 'Missing required OAuth parameters'
            }, window.location.origin)
          }
          return
        }

        // Parse state to validate the request
        try {
          const stateData = JSON.parse(atob(state))
          console.log('OAuth callback state:', stateData)
        } catch (error) {
          console.error('Invalid state parameter:', error)
          setStatus('error')
          setMessage('Invalid OAuth state parameter')
          
          if (window.opener) {
            window.opener.postMessage({
              type: 'oauth-error',
              error: 'Invalid OAuth state parameter'
            }, window.location.origin)
          }
          return
        }

        setMessage('Processing authentication...')

        // Handle the OAuth callback
        const result = await handleOAuthCallback(code, state)

        if (result.success) {
          setStatus('success')
          setMessage('Authentication successful!')
          
          // Send success message to parent window
          if (window.opener) {
            window.opener.postMessage({
              type: 'oauth-success',
              session: result.session
            }, window.location.origin)
            
            // Close this popup window
            setTimeout(() => {
              window.close()
            }, 1500)
          } else {
            // If not in popup, redirect to the specified URL
            setTimeout(() => {
              router.push(redirectTo)
            }, 2000)
          }
        } else {
          setStatus('error')
          setMessage(result.error || 'Authentication failed')
          
          if (window.opener) {
            window.opener.postMessage({
              type: 'oauth-error',
              error: result.error || 'Authentication failed'
            }, window.location.origin)
          }
        }

      } catch (error) {
        console.error('OAuth callback processing failed:', error)
        setStatus('error')
        setMessage(error instanceof Error ? error.message : 'Authentication failed')
        
        if (window.opener) {
          window.opener.postMessage({
            type: 'oauth-error',
            error: error instanceof Error ? error.message : 'Authentication failed'
          }, window.location.origin)
        }
      }
    }

    processCallback()
  }, [searchParams, handleOAuthCallback, router, redirectTo])

  const getIcon = () => {
    switch (status) {
      case 'processing':
        return <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      case 'success':
        return <CheckCircle className="h-8 w-8 text-green-600" />
      case 'error':
        return <AlertTriangle className="h-8 w-8 text-red-600" />
    }
  }

  const getTitle = () => {
    switch (status) {
      case 'processing':
        return 'Processing Authentication...'
      case 'success':
        return 'Authentication Successful!'
      case 'error':
        return 'Authentication Failed'
    }
  }

  const getDescription = () => {
    switch (status) {
      case 'processing':
        return 'Please wait while we complete your authentication'
      case 'success':
        return 'You have been successfully authenticated with PersonaPass'
      case 'error':
        return 'There was a problem completing your authentication'
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <div className="flex flex-col items-center space-y-2">
            {getIcon()}
            <CardTitle className="text-center">{getTitle()}</CardTitle>
            <CardDescription className="text-center">
              {getDescription()}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {message && (
            <div className="text-center">
              <p className={`text-sm ${
                status === 'success' ? 'text-green-700' :
                status === 'error' ? 'text-red-700' :
                'text-blue-700'
              }`}>
                {message}
              </p>
            </div>
          )}

          {error && status === 'error' && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {status === 'processing' && (
            <div className="space-y-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
              </div>
              <p className="text-xs text-center text-muted-foreground">
                Exchanging authorization code for access token...
              </p>
            </div>
          )}

          {status === 'success' && !window.opener && (
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Redirecting you in a moment...
              </p>
            </div>
          )}

          {status === 'success' && window.opener && (
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                This window will close automatically...
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center space-y-2">
              <p className="text-xs text-muted-foreground">
                You can close this window and try again.
              </p>
              {window.opener && (
                <button
                  onClick={() => window.close()}
                  className="text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  Close Window
                </button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}