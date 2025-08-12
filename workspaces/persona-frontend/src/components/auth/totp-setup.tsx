'use client'

/**
 * TOTP Setup Component - Handles initial TOTP authentication method setup
 * Provides QR code display, manual secret entry, and backup codes
 */

import React, { useState, useCallback, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { usePersonaAuth } from '@/contexts/PersonaAuthContext'
import { useWalletAuth } from '@/hooks/useWalletAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Copy, Check, Eye, EyeOff, Shield, Smartphone, AlertTriangle } from 'lucide-react'

interface TOTPSetupProps {
  onComplete?: (success: boolean) => void
  onCancel?: () => void
}

export function TOTPSetup({ onComplete, onCancel }: TOTPSetupProps) {
  const { setupTOTP, verifyTOTP, isLoading, error, clearError } = usePersonaAuth()
  const { user: walletUser, signMessage } = useWalletAuth()
  
  const [step, setStep] = useState<'setup' | 'verify' | 'backup'>('setup')
  const [setupResult, setSetupResult] = useState<{
    secret?: string
    qrCode?: string
    backupCodes?: string[]
  } | null>(null)
  const [verificationCode, setVerificationCode] = useState('')
  const [manualSecret, setManualSecret] = useState('')
  const [showSecret, setShowSecret] = useState(false)
  const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set())
  const [savedBackupCodes, setSavedBackupCodes] = useState(false)

  // Clear errors when component mounts or step changes
  useEffect(() => {
    clearError()
  }, [step, clearError])

  const handleSetupTOTP = useCallback(async () => {
    if (!walletUser?.did) {
      console.error('No wallet user or DID available')
      return
    }

    try {
      // Sign a message to authorize TOTP setup
      const message = `Setup TOTP for PersonaPass DID: ${walletUser.did} at ${new Date().toISOString()}`
      const signature = await signMessage(message)
      
      if (!signature) {
        throw new Error('Failed to sign authorization message')
      }

      const result = await setupTOTP(walletUser.did, signature)
      
      if (result.success) {
        setSetupResult({
          secret: result.secret,
          qrCode: result.qrCode,
          backupCodes: result.backupCodes
        })
        setManualSecret(result.secret || '')
        setStep('verify')
      }
    } catch (error) {
      console.error('TOTP setup failed:', error)
    }
  }, [walletUser?.did, signMessage, setupTOTP])

  const handleVerifyTOTP = useCallback(async () => {
    if (!walletUser?.did || !verificationCode) {
      return
    }

    try {
      // Sign a message to authorize TOTP verification
      const message = `Verify TOTP for PersonaPass DID: ${walletUser.did} at ${new Date().toISOString()}`
      const signature = await signMessage(message)
      
      if (!signature) {
        throw new Error('Failed to sign verification message')
      }

      const result = await verifyTOTP(walletUser.did, verificationCode, signature)
      
      if (result.success) {
        setStep('backup')
      }
    } catch (error) {
      console.error('TOTP verification failed:', error)
    }
  }, [walletUser?.did, verificationCode, signMessage, verifyTOTP])

  const copyToClipboard = useCallback(async (text: string, item: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedItems(prev => new Set([...prev, item]))
      setTimeout(() => {
        setCopiedItems(prev => {
          const newSet = new Set(prev)
          newSet.delete(item)
          return newSet
        })
      }, 2000)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }, [])

  const handleComplete = useCallback(() => {
    onComplete?.(step === 'backup' && savedBackupCodes)
  }, [step, savedBackupCodes, onComplete])

  if (!walletUser) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            TOTP Setup
          </CardTitle>
          <CardDescription>
            Please connect your wallet to set up TOTP authentication
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Two-Factor Authentication Setup
        </CardTitle>
        <CardDescription>
          Secure your PersonaPass account with time-based one-time passwords
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Step 1: Setup */}
        {step === 'setup' && (
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <Smartphone className="h-12 w-12 mx-auto text-muted-foreground" />
              <h3 className="text-lg font-semibold">Get Started</h3>
              <p className="text-sm text-muted-foreground">
                You'll need an authenticator app like Google Authenticator, Authy, or 1Password
              </p>
            </div>
            
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">DID Identity</h4>
              <code className="text-xs break-all bg-background px-2 py-1 rounded">
                {walletUser.did}
              </code>
            </div>

            <Button 
              onClick={handleSetupTOTP} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Setting up...' : 'Begin TOTP Setup'}
            </Button>
          </div>
        )}

        {/* Step 2: Verify */}
        {step === 'verify' && setupResult && (
          <div className="space-y-4">
            <Tabs defaultValue="qr" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="qr">QR Code</TabsTrigger>
                <TabsTrigger value="manual">Manual Entry</TabsTrigger>
              </TabsList>
              
              <TabsContent value="qr" className="space-y-4">
                <div className="text-center space-y-4">
                  <h3 className="text-lg font-semibold">Scan QR Code</h3>
                  <div className="flex justify-center p-4 bg-white rounded-lg">
                    {setupResult.qrCode && (
                      <QRCodeSVG value={setupResult.qrCode} size={200} />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Open your authenticator app and scan this QR code
                  </p>
                </div>
              </TabsContent>
              
              <TabsContent value="manual" className="space-y-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Manual Entry</h3>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Secret Key</label>
                    <div className="flex items-center space-x-2">
                      <Input
                        type={showSecret ? 'text' : 'password'}
                        value={manualSecret}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowSecret(!showSecret)}
                      >
                        {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(manualSecret, 'secret')}
                      >
                        {copiedItems.has('secret') ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Enter this secret key manually in your authenticator app
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Verification Code</label>
                <Input
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="mt-1 font-mono text-center text-lg tracking-widest"
                  maxLength={6}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter the 6-digit code from your authenticator app
                </p>
              </div>

              <Button 
                onClick={handleVerifyTOTP}
                disabled={isLoading || verificationCode.length !== 6}
                className="w-full"
              >
                {isLoading ? 'Verifying...' : 'Verify & Continue'}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Backup Codes */}
        {step === 'backup' && setupResult?.backupCodes && (
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <Shield className="h-12 w-12 mx-auto text-green-600" />
              <h3 className="text-lg font-semibold">TOTP Setup Complete!</h3>
              <p className="text-sm text-muted-foreground">
                Save these backup codes in a secure location
              </p>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Important:</strong> Save these backup codes now. They can be used if you lose access to your authenticator app.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Backup Codes</label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(setupResult.backupCodes!.join('\n'), 'backup-codes')}
                >
                  {copiedItems.has('backup-codes') ? (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-1" />
                      Copy All
                    </>
                  )}
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                {setupResult.backupCodes.map((code, index) => (
                  <div key={index} className="bg-muted p-2 rounded text-center">
                    <code className="text-sm">{code}</code>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="backup-saved"
                checked={savedBackupCodes}
                onChange={(e) => setSavedBackupCodes(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="backup-saved" className="text-sm">
                I have safely saved my backup codes
              </label>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        
        {step === 'backup' && (
          <Button 
            onClick={handleComplete}
            disabled={!savedBackupCodes}
            className="ml-auto"
          >
            Complete Setup
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}