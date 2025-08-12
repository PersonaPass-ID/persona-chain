'use client'

/**
 * Protected Route Component - Higher-order component for route protection
 * Provides declarative route protection with authentication requirements
 */

import React, { ReactNode, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { usePersonaAuth } from '@/contexts/PersonaAuthContext'
import { useWalletAuth } from '@/hooks/useWalletAuth'
import { AuthGuard } from './auth-guard'

interface ProtectedRouteProps {
  children: ReactNode
  requireAuth?: boolean
  requireWallet?: boolean
  requireBoth?: boolean
  redirectTo?: string
  fallback?: ReactNode
  allowPartial?: boolean // Allow access with only wallet or only auth (not both)
}

export function ProtectedRoute({
  children,
  requireAuth = false,
  requireWallet = false,
  requireBoth = false,
  redirectTo,
  fallback,
  allowPartial = false
}: ProtectedRouteProps) {
  const router = useRouter()
  const pathname = usePathname()
  
  const { 
    isAuthenticated, 
    isInitializing: authInitializing,
    session 
  } = usePersonaAuth()
  
  const { 
    isAuthenticated: walletConnected, 
    isInitializing: walletInitializing 
  } = useWalletAuth()

  // Wait for initialization to complete
  if (authInitializing || walletInitializing) {
    return fallback || <AuthGuard>{children}</AuthGuard>
  }

  // Determine authentication requirements
  const needsWallet = (requireWallet || requireBoth) && !walletConnected
  const needsAuth = (requireAuth || requireBoth) && !isAuthenticated
  
  // Handle redirects for missing authentication
  useEffect(() => {
    if (!redirectTo) return

    const shouldRedirect = () => {
      if (requireBoth) {
        return !isAuthenticated || !walletConnected
      }
      if (requireAuth && requireWallet) {
        if (allowPartial) {
          return !isAuthenticated && !walletConnected
        }
        return !isAuthenticated || !walletConnected
      }
      if (requireAuth) {
        return !isAuthenticated
      }
      if (requireWallet) {
        return !walletConnected
      }
      return false
    }

    if (shouldRedirect()) {
      const currentPath = encodeURIComponent(pathname)
      const redirectUrl = redirectTo.includes('?') 
        ? `${redirectTo}&redirect=${currentPath}`
        : `${redirectTo}?redirect=${currentPath}`
      
      router.push(redirectUrl)
    }
  }, [
    isAuthenticated, 
    walletConnected, 
    requireAuth, 
    requireWallet, 
    requireBoth, 
    allowPartial,
    redirectTo, 
    router, 
    pathname
  ])

  // Use AuthGuard for UI-based protection
  return (
    <AuthGuard
      requireAuth={requireAuth}
      requireWallet={requireWallet}
      requireBoth={requireBoth}
      fallback={fallback}
      showError={!redirectTo} // Don't show error if we're redirecting
    >
      {children}
    </AuthGuard>
  )
}

// Convenience components for common protection patterns
export function AuthenticatedRoute({ 
  children, 
  redirectTo = '/auth/login',
  fallback
}: { 
  children: ReactNode
  redirectTo?: string
  fallback?: ReactNode 
}) {
  return (
    <ProtectedRoute 
      requireAuth 
      redirectTo={redirectTo}
      fallback={fallback}
    >
      {children}
    </ProtectedRoute>
  )
}

export function WalletRoute({ 
  children, 
  redirectTo = '/wallet/connect',
  fallback
}: { 
  children: ReactNode
  redirectTo?: string
  fallback?: ReactNode 
}) {
  return (
    <ProtectedRoute 
      requireWallet 
      redirectTo={redirectTo}
      fallback={fallback}
    >
      {children}
    </ProtectedRoute>
  )
}

export function SecureRoute({ 
  children, 
  redirectTo = '/auth/login',
  fallback
}: { 
  children: ReactNode
  redirectTo?: string
  fallback?: ReactNode 
}) {
  return (
    <ProtectedRoute 
      requireBoth 
      redirectTo={redirectTo}
      fallback={fallback}
    >
      {children}
    </ProtectedRoute>
  )
}

// Higher-order component version
export function withProtectedRoute<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: Omit<ProtectedRouteProps, 'children'> = {}
) {
  return function ProtectedRouteComponent(props: P) {
    return (
      <ProtectedRoute {...options}>
        <WrappedComponent {...props} />
      </ProtectedRoute>
    )
  }
}

export default ProtectedRoute