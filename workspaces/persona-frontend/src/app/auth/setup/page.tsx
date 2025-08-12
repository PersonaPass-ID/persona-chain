'use client'

/**
 * Authentication Setup Page - Initial setup for new users
 * Guides users through TOTP setup and initial authentication configuration
 */

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { usePersonaAuth } from '@/contexts/PersonaAuthContext'
import { useWalletAuth } from '@/hooks/useWalletAuth'
import { TOTPSetup } from '@/components/auth/totp-setup'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Shield, Wallet, CheckCircle, ArrowLeft, ArrowRight } from 'lucide-react'

type SetupStep = 'welcome' | 'totp-setup' | 'complete'

function SetupContent() {
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
  
  const [currentStep, setCurrentStep] = useState<SetupStep>('welcome')
  const [setupProgress, setSetupProgress] = useState(0)
  
  const redirectTo = searchParams.get('redirect') || '/dashboard'

  // Update progress based on current step
  useEffect(() => {
    switch (currentStep) {
      case 'welcome':
        setSetupProgress(0)
        break
      case 'totp-setup':
        setSetupProgress(50)
        break
      case 'complete':
        setSetupProgress(100)
        break
    }
  }, [currentStep])

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && walletConnected) {
      router.push(redirectTo)
    }
  }, [isAuthenticated, walletConnected, router, redirectTo])

  const handleConnectWallet = async () => {
    const firstWallet = availableWallets.find(w => w.isInstalled)
    if (firstWallet) {
      await connectWallet(firstWallet.type)
    } else {
      await connectWallet('keplr')
    }
  }

  const handleTOTPSetupComplete = (success: boolean) => {
    if (success) {
      setCurrentStep('complete')
    }
  }

  const handleComplete = () => {
    router.push(redirectTo)
  }

  // Welcome Step
  if (currentStep === 'welcome') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-lg mx-auto space-y-6">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Setup Progress</span>
              <span>{setupProgress}%</span>
            </div>
            <Progress value={setupProgress} className="w-full" />
          </div>

          {/* Welcome Card */}
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>Welcome to PersonaPass</CardTitle>
              <CardDescription>
                Let's set up your secure blockchain-based authentication
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Step 1: Wallet Connection */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center">
                    1
                  </span>
                  Connect Your Wallet
                </h3>
                
                {!walletConnected ? (
                  <div className="ml-8 space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Connect your PersonaChain wallet to establish your blockchain identity.
                    </p>
                    <Button 
                      onClick={handleConnectWallet}
                      disabled={isConnecting}
                      className="w-full"
                    >
                      <Wallet className="h-4 w-4 mr-2" />
                      {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                    </Button>
                    {availableWallets.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Detected: {availableWallets.filter(w => w.isInstalled).map(w => w.name).join(', ')}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="ml-8 space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-sm text-green-700">Wallet Connected</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <div>Type: {walletUser?.walletType}</div>
                      <div className="font-mono break-all">{walletUser?.did}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Step 2: Authentication Setup */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-full text-sm flex items-center justify-center ${
                    walletConnected 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    2
                  </span>
                  Set Up Two-Factor Authentication
                </h3>
                <div className="ml-8">
                  <p className="text-sm text-muted-foreground">
                    Configure TOTP (Time-based One-Time Password) for secure authentication.
                  </p>
                </div>
              </div>

              {/* Continue Button */}
              {walletConnected && (
                <Button 
                  onClick={() => setCurrentStep('totp-setup')}
                  className="w-full"
                  size="lg"
                >
                  Continue Setup
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}

              {/* Help Text */}
              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground text-center">
                  Need help? Visit our <a href="/docs/setup" className="text-primary hover:underline">setup guide</a>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Back Button */}
          <div className="text-center">
            <Button
              variant="outline"
              onClick={() => router.push('/auth/login')}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Login
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // TOTP Setup Step
  if (currentStep === 'totp-setup') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-lg mx-auto space-y-6">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Setup Progress</span>
              <span>{setupProgress}%</span>
            </div>
            <Progress value={setupProgress} className="w-full" />
          </div>

          {/* TOTP Setup */}
          <TOTPSetup 
            onComplete={handleTOTPSetupComplete}
            onCancel={() => setCurrentStep('welcome')}
          />
        </div>
      </div>
    )
  }

  // Completion Step
  if (currentStep === 'complete') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md mx-auto space-y-6">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Setup Complete!</span>
              <span>{setupProgress}%</span>
            </div>
            <Progress value={setupProgress} className="w-full" />
          </div>

          {/* Success Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <CheckCircle className="h-16 w-16 mx-auto text-green-600" />
                <div>
                  <h3 className="text-xl font-semibold text-green-600">Setup Complete!</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Your PersonaPass authentication is now configured and ready to use.
                  </p>
                </div>

                <div className="bg-muted p-4 rounded-lg text-left space-y-2">
                  <h4 className="text-sm font-semibold">What's Next:</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Use your authenticator app for secure login</li>
                    <li>• Keep your backup codes in a safe place</li>
                    <li>• Explore PersonaPass features and credentials</li>
                  </ul>
                </div>

                <Button 
                  onClick={handleComplete}
                  className="w-full"
                  size="lg"
                >
                  Get Started
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return null
}

export default function AuthSetupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <SetupContent />
    </Suspense>
  )
}