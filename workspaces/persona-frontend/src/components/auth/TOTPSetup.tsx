'use client'

import React, { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Shield, 
  Smartphone, 
  Copy, 
  CheckCircle, 
  AlertTriangle,
  Eye,
  EyeOff
} from 'lucide-react'

export interface TOTPSetupProps {
  did: string
  signature: string
  onComplete: (success: boolean, methodId?: string) => void
  onCancel: () => void
}

export function TOTPSetup({ did, signature, onComplete, onCancel }: TOTPSetupProps) {
  const [step, setStep] = useState<'setup' | 'verify'>('setup')
  const [isLoading, setIsLoading] = useState(false)
  const [setupData, setSetupData] = useState<{
    secret: string
    qrCode: string
    backupCodes: string[]
  } | null>(null)
  const [verificationCode, setVerificationCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [showBackupCodes, setShowBackupCodes] = useState(false)
  const [copiedSecret, setCopiedSecret] = useState(false)
  const [copiedCodes, setCopiedCodes] = useState(false)

  const handleSetupTOTP = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Mock TOTP setup for now since we don't have the backend running
      // In production, this would call the actual API
      const mockSetupData = {
        secret: 'JBSWY3DPEHPK3PXP',
        qrCode: `otpauth://totp/PersonaPass:${did.slice(-8)}?secret=JBSWY3DPEHPK3PXP&issuer=PersonaPass`,
        backupCodes: ['A1B2C3D4', 'E5F6G7H8', 'I9J0K1L2', 'M3N4O5P6', 'Q7R8S9T0', 'U1V2W3X4', 'Y5Z6A7B8', 'C9D0E1F2']
      }
      
      setSetupData(mockSetupData)
      setStep('verify')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'TOTP setup failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyTOTP = async () => {
    if (!/^\d{6}$/.test(verificationCode)) {
      setError('Please enter a valid 6-digit code')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Mock verification for now
      // In production, this would call the verification API
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      onComplete(true, 'mock-method-id')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'TOTP verification failed')
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = async (text: string, type: 'secret' | 'codes') => {
    try {
      await navigator.clipboard.writeText(text)
      if (type === 'secret') {
        setCopiedSecret(true)
        setTimeout(() => setCopiedSecret(false), 2000)
      } else {
        setCopiedCodes(true)
        setTimeout(() => setCopiedCodes(false), 2000)
      }
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
    }
  }

  if (step === 'setup') {
    return (
      <div className="max-w-md mx-auto space-y-6">
        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-xl">Enable Two-Factor Authentication</CardTitle>
            <p className="text-sm text-gray-600">
              Add an extra layer of security to your PersonaPass account with Google Authenticator
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Smartphone className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-blue-900">Before you start</h3>
                  <p className="text-sm text-blue-700">
                    Make sure you have Google Authenticator or another TOTP app installed on your mobile device.
                  </p>
                  <a 
                    href="https://support.google.com/accounts/answer/1066447" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    Download Google Authenticator →
                  </a>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <Button 
                onClick={handleSetupTOTP} 
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? 'Setting up...' : 'Set Up TOTP'}
              </Button>
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (step === 'verify' && setupData) {
    return (
      <div className="max-w-md mx-auto space-y-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Scan QR Code</CardTitle>
            <p className="text-sm text-gray-600">
              Use your authenticator app to scan this QR code
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* QR Code */}
            <div className="flex justify-center p-4 bg-white border rounded-lg">
              <QRCodeSVG 
                value={setupData.qrCode}
                size={200}
                level="M"
                includeMargin={true}
              />
            </div>

            {/* Manual Entry */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Manual entry key:</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(setupData.secret, 'secret')}
                  className="h-8 px-2"
                >
                  {copiedSecret ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <code className="block p-2 bg-gray-100 rounded text-sm break-all">
                {setupData.secret}
              </code>
            </div>

            {/* Verification */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Enter the 6-digit code from your app:
                </label>
                <Input
                  type="text"
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="text-center text-lg tracking-widest"
                  maxLength={6}
                />
              </div>

              <Button 
                onClick={handleVerifyTOTP}
                disabled={isLoading || verificationCode.length !== 6}
                className="w-full"
              >
                {isLoading ? 'Verifying...' : 'Verify & Enable TOTP'}
              </Button>
            </div>

            {/* Backup Codes */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Backup Recovery Codes</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowBackupCodes(!showBackupCodes)}
                  className="h-8"
                >
                  {showBackupCodes ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </Button>
              </div>

              {showBackupCodes && (
                <div className="space-y-3">
                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      Save these codes in a secure place. Each code can only be used once to recover your account.
                    </AlertDescription>
                  </Alert>

                  <div className="bg-gray-50 border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-700">Recovery codes:</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(setupData.backupCodes.join('\n'), 'codes')}
                        className="h-6 px-2"
                      >
                        {copiedCodes ? (
                          <CheckCircle className="w-3 h-3 text-green-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      {setupData.backupCodes.map((code, index) => (
                        <Badge key={index} variant="secondary" className="text-xs justify-center">
                          {code}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}