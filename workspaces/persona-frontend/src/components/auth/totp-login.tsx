'use client'

/**
 * TOTP Login Component - Handles TOTP-based authentication
 * Provides 6-digit code input with backup code option
 */

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { usePersonaAuth } from '@/contexts/PersonaAuthContext'
import { useWalletAuth } from '@/hooks/useWalletAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Shield, Smartphone, Key, AlertTriangle, Clock, CheckCircle } from 'lucide-react'

interface TOTPLoginProps {
  onSuccess?: () => void
  onCancel?: () => void
  rememberDevice?: boolean
}

export function TOTPLogin({ onSuccess, onCancel, rememberDevice = false }: TOTPLoginProps) {
  const { login, isLoading, error, clearError } = usePersonaAuth()
  const { user: walletUser } = useWalletAuth()
  
  const [verificationCode, setVerificationCode] = useState('')
  const [backupCode, setBackupCode] = useState('')
  const [useBackup, setUseBackup] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(30)
  const [isSuccess, setIsSuccess] = useState(false)
  
  const inputRef = useRef<HTMLInputElement>(null)
  
  // Auto-focus input when component mounts or switches tabs
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [useBackup])

  // Clear errors when input changes
  useEffect(() => {
    if (error) {
      clearError()
    }
  }, [verificationCode, backupCode, clearError])

  // TOTP timer (30-second countdown)
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          return 30 // Reset to 30 seconds
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Auto-submit when 6 digits are entered for TOTP
  useEffect(() => {
    if (!useBackup && verificationCode.length === 6 && !isLoading) {
      handleLogin()
    }
  }, [verificationCode, useBackup, isLoading])

  const handleLogin = useCallback(async () => {
    const credential = useBackup ? backupCode : verificationCode
    
    if (!credential) {
      return
    }

    try {
      const result = await login('totp', credential, {
        rememberDevice,
        redirectUrl: window.location.pathname
      })
      
      if (result.success) {
        setIsSuccess(true)
        setTimeout(() => {
          onSuccess?.()
        }, 1500) // Brief success animation
      }
    } catch (error) {
      console.error('TOTP login failed:', error)
    }
  }, [login, verificationCode, backupCode, useBackup, rememberDevice, onSuccess])

  const handleCodeChange = useCallback((value: string) => {
    // Only allow digits for TOTP codes
    const cleaned = value.replace(/\D/g, '').slice(0, 6)
    setVerificationCode(cleaned)
  }, [])

  const handleBackupCodeChange = useCallback((value: string) => {
    // Allow alphanumeric for backup codes
    const cleaned = value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 12)
    setBackupCode(cleaned)
  }, [])

  if (!walletUser) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            TOTP Login
          </CardTitle>
          <CardDescription>
            Please connect your wallet to access TOTP authentication
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (isSuccess) {
    return (
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
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Two-Factor Authentication
        </CardTitle>
        <CardDescription>
          Enter your authentication code to continue
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

        <Tabs value={useBackup ? 'backup' : 'totp'} onValueChange={(value) => setUseBackup(value === 'backup')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="totp" className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              Authenticator
            </TabsTrigger>
            <TabsTrigger value="backup" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              Backup Code
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="totp" className="space-y-4 mt-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Verification Code</label>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {timeRemaining}s
                </div>
              </div>
              <Input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => handleCodeChange(e.target.value)}
                className="text-center text-2xl tracking-[0.5em] font-mono h-14"
                maxLength={6}
                autoComplete="one-time-code"
              />
              <p className="text-xs text-muted-foreground text-center">
                Enter the 6-digit code from your authenticator app
              </p>
            </div>

            <div className="flex justify-center">
              <div className="flex space-x-1">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-1 rounded-full transition-colors ${
                      i < verificationCode.length
                        ? 'bg-primary'
                        : 'bg-muted'
                    }`}
                  />
                ))}
              </div>
            </div>

            {verificationCode.length < 6 && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Code will be submitted automatically when complete
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="backup" className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Backup Code</label>
              <Input
                ref={inputRef}
                type="text"
                placeholder="Enter backup code"
                value={backupCode}
                onChange={(e) => handleBackupCodeChange(e.target.value)}
                className="text-center text-lg font-mono h-12 tracking-widest"
                maxLength={12}
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground text-center">
                Enter one of your saved backup codes
              </p>
            </div>

            <Alert>
              <Key className="h-4 w-4" />
              <AlertDescription>
                <strong>Note:</strong> Each backup code can only be used once. Make sure to cross it off your list after use.
              </AlertDescription>
            </Alert>

            <Button 
              onClick={handleLogin}
              disabled={isLoading || !backupCode}
              className="w-full"
            >
              {isLoading ? 'Verifying...' : 'Login with Backup Code'}
            </Button>
          </TabsContent>
        </Tabs>

        {isLoading && (
          <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span>Verifying your code...</span>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between">
        {onCancel && (
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
        )}
        
        <div className="text-xs text-muted-foreground ml-auto">
          {rememberDevice && "This device will be remembered"}
        </div>
      </CardFooter>
    </Card>
  )
}