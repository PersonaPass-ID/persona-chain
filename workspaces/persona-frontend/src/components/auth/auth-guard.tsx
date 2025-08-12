'use client'

/**
 * Auth Guard Component - Protects routes and components with authentication
 * Provides different guard types and fallback components
 */

import React, { ReactNode } from 'react'
import { usePersonaAuth } from '@/contexts/PersonaAuthContext'
import { useWalletAuth } from '@/hooks/useWalletAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Shield, Wallet, Loader2, AlertTriangle } from 'lucide-react'

interface AuthGuardProps {
  children: ReactNode
  requireAuth?: boolean
  requireWallet?: boolean
  requireBoth?: boolean
  fallback?: ReactNode
  redirectTo?: string
  showError?: boolean
}

interface AuthPromptProps {
  type: 'wallet' | 'auth' | 'both'
  onConnectWallet?: () => void
  onLogin?: () => void
  error?: string | null
}

function AuthPrompt({ type, onConnectWallet, onLogin, error }: AuthPromptProps) {
  const getMessage = () => {
    switch (type) {
      case 'wallet':
        return {
          title: 'Wallet Required',
          description: 'Please connect your wallet to continue',
          action: 'Connect Wallet',
          handler: onConnectWallet
        }
      case 'auth':
        return {
          title: 'Authentication Required',
          description: 'Please authenticate to access this content',
          action: 'Authenticate',
          handler: onLogin
        }
      case 'both':
        return {
          title: 'Full Authentication Required',
          description: 'Please connect your wallet and authenticate to continue',
          action: 'Get Started',
          handler: onConnectWallet
        }
    }
  }

  const { title, description, action, handler } = getMessage()

  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {type === 'wallet' ? (
              <Wallet className="h-12 w-12 text-muted-foreground" />
            ) : type === 'auth' ? (
              <Shield className="h-12 w-12 text-muted-foreground" />
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <Wallet className="h-10 w-10 text-muted-foreground" />
                <Shield className="h-10 w-10 text-muted-foreground" />
              </div>
            )}
          </div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button 
            onClick={handler} 
            className="w-full"
            size="lg"
          >
            {action}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            <p>
              PersonaPass uses blockchain-based authentication for enhanced security and privacy.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
            <div>
              <h3 className="text-lg font-semibold">Loading...</h3>
              <p className="text-sm text-muted-foreground">
                Checking authentication status
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function AuthGuard({
  children,
  requireAuth = false,
  requireWallet = false,
  requireBoth = false,
  fallback,
  redirectTo,
  showError = true
}: AuthGuardProps) {
  const { 
    isAuthenticated, 
    isLoading: authLoading, 
    isInitializing: authInitializing, 
    error: authError 
  } = usePersonaAuth()
  
  const { 
    isAuthenticated: walletConnected, 
    isInitializing: walletInitializing, 
    isConnecting: walletConnecting,
    connectWallet,
    error: walletError
  } = useWalletAuth()

  // Show loading state while initializing
  if (authInitializing || walletInitializing || authLoading || walletConnecting) {
    return fallback || <LoadingState />
  }

  // Determine what authentication is needed
  const needsWallet = (requireWallet || requireBoth) && !walletConnected
  const needsAuth = (requireAuth || requireBoth) && !isAuthenticated
  const error = showError ? (authError || walletError) : null

  // If authentication is required but not present, show appropriate prompt
  if (needsWallet && needsAuth) {
    if (fallback) return <>{fallback}</>
    
    return (
      <AuthPrompt
        type="both"
        onConnectWallet={() => connectWallet('keplr')} // Default to Keplr
        error={error}
      />
    )
  }

  if (needsWallet) {
    if (fallback) return <>{fallback}</>
    
    return (
      <AuthPrompt
        type="wallet"
        onConnectWallet={() => connectWallet('keplr')} // Default to Keplr
        error={error}
      />
    )
  }

  if (needsAuth) {
    if (fallback) return <>{fallback}</>
    
    return (
      <AuthPrompt
        type="auth"
        onLogin={() => {
          if (redirectTo) {
            window.location.href = `/auth/login?redirect=${encodeURIComponent(redirectTo)}`
          } else {
            window.location.href = '/auth/login'
          }
        }}
        error={error}
      />
    )
  }

  // All requirements met, render children
  return <>{children}</>
}

// Convenience components for common use cases
export function WalletGuard({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <AuthGuard requireWallet fallback={fallback}>
      {children}
    </AuthGuard>
  )
}

export function AuthenticationGuard({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <AuthGuard requireAuth fallback={fallback}>
      {children}
    </AuthGuard>
  )
}

export function FullAuthGuard({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <AuthGuard requireBoth fallback={fallback}>
      {children}
    </AuthGuard>
  )
}

// Higher-order component version
export function withAuthGuard<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: Omit<AuthGuardProps, 'children'> = {}
) {
  return function AuthGuardedComponent(props: P) {
    return (
      <AuthGuard {...options}>
        <WrappedComponent {...props} />
      </AuthGuard>
    )
  }
}

export default AuthGuard