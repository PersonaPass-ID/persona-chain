/**
 * Authentication Components Export Index
 * Provides easy imports for all authentication-related components
 */

export { TOTPSetup } from './totp-setup'
export { TOTPLogin } from './totp-login'
export { OAuthLogin } from './oauth-login'
export { OAuthCallback } from './oauth-callback'
export { 
  AuthGuard,
  WalletGuard,
  AuthenticationGuard,
  FullAuthGuard,
  withAuthGuard
} from './auth-guard'
export { 
  ProtectedRoute,
  AuthenticatedRoute,
  WalletRoute,
  SecureRoute,
  withProtectedRoute
} from './protected-route'
export { AuthStatus } from './auth-status'

// Re-export context and hooks for convenience
export { usePersonaAuth, PersonaAuthProvider } from '@/contexts/PersonaAuthContext'
export { useWalletAuth } from '@/hooks/useWalletAuth'

// Export types
export type {
  PersonaAuthState,
  PersonaAuthActions,
  LoginOptions,
  AuthResult,
  TOTPSetupResult
} from '@/contexts/PersonaAuthContext'

export type {
  WalletAuthState,
  WalletType,
  WalletInfo
} from '@/hooks/useWalletAuth'