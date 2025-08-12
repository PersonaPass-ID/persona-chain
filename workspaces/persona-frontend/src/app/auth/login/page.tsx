'use client'

/**
 * Login Page - Main authentication entry point
 * Provides options for TOTP and OAuth authentication methods
 */

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { usePersonaAuth } from '@/contexts/PersonaAuthContext'
import { useWalletAuth } from '@/hooks/useWalletAuth'
import { TOTPLogin } from '@/components/auth/totp-login'
import { OAuthLogin } from '@/components/auth/oauth-login'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Shield, Wallet, ArrowLeft, CheckCircle } from 'lucide-react'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated } = usePersonaAuth()
  const { 
    isAuthenticated: walletConnected, 
    user: walletUser,
    connectWallet,
    availableWallets,
    isConnecting 
  } = useWalletAuth()
  
  const [selectedMethod, setSelectedMethod] = useState<'totp' | 'oauth'>('totp')
  const [rememberDevice, setRememberDevice] = useState(false)
  
  const redirectTo = searchParams.get('redirect') || '/dashboard'

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && walletConnected) {
      router.push(redirectTo)
    }
  }, [isAuthenticated, walletConnected, router, redirectTo])

  const handleAuthSuccess = () => {
    router.push(redirectTo)
  }

  const handleConnectWallet = async () => {
    // Try to connect with the first available wallet
    const firstWallet = availableWallets.find(w => w.isInstalled)
    if (firstWallet) {
      await connectWallet(firstWallet.type)
    } else {
      // Fallback to Keplr if no wallets are detected
      await connectWallet('keplr')
    }
  }

  // Show wallet connection step if not connected
  if (!walletConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <Wallet className="h-12 w-12 text-muted-foreground" />
            </div>
            <CardTitle>Connect Your Wallet</CardTitle>
            <CardDescription>
              Connect your PersonaChain wallet to continue with authentication
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                PersonaPass uses blockchain-based authentication for enhanced security.
                You'll need to connect your wallet first.
              </p>
            </div>

            <Button 
              onClick={handleConnectWallet}
              disabled={isConnecting}
              className="w-full"
              size="lg"
            >
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </Button>

            {availableWallets.length > 0 && (
              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  Detected wallets: {availableWallets.filter(w => w.isInstalled).map(w => w.name).join(', ')}
                </p>
              </div>
            )}

            <Separator />

            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Don't have a wallet? <a href="/wallet/install" className="text-primary hover:underline">Install one here</a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show success message if authenticated but processing redirect
  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle className="h-16 w-16 mx-auto text-green-600" />
              <div>
                <h3 className="text-lg font-semibold text-green-600">Authentication Successful!</h3>
                <p className="text-sm text-muted-foreground">Redirecting you now...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md mx-auto space-y-4">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">PersonaPass Authentication</h1>
          <p className="text-sm text-muted-foreground">
            Secure your identity with blockchain-based authentication
          </p>
        </div>

        {/* Wallet Status */}
        {walletUser && (
          <Alert>
            <Wallet className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <div>Wallet connected: <strong>{walletUser.walletType}</strong></div>
                <div className="text-xs font-mono break-all">{walletUser.did}</div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Authentication Methods */}
        <Card>
          <CardHeader>
            <CardTitle>Choose Authentication Method</CardTitle>
            <CardDescription>
              Select your preferred authentication method to continue
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs value={selectedMethod} onValueChange={(value) => setSelectedMethod(value as 'totp' | 'oauth')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="totp">TOTP</TabsTrigger>
                <TabsTrigger value="oauth">OAuth</TabsTrigger>
              </TabsList>
              
              <TabsContent value="totp" className="mt-4">
                <TOTPLogin 
                  onSuccess={handleAuthSuccess}
                  rememberDevice={rememberDevice}
                />
              </TabsContent>
              
              <TabsContent value="oauth" className="mt-4">
                <OAuthLogin 
                  onSuccess={handleAuthSuccess}
                  rememberDevice={rememberDevice}
                />
              </TabsContent>
            </Tabs>

            {/* Remember Device Option */}
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="remember-device"
                  checked={rememberDevice}
                  onChange={(e) => setRememberDevice(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="remember-device" className="text-sm">
                  Remember this device for 30 days
                </label>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Skip authentication on this device for trusted sessions
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center space-y-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Go Back
          </Button>
          
          <p className="text-xs text-muted-foreground">
            New to PersonaPass? <a href="/auth/setup" className="text-primary hover:underline">Set up your account</a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}