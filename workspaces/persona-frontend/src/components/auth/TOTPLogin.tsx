'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Shield, 
  Smartphone, 
  AlertTriangle,
  RefreshCw,
  Clock,
  Key
} from 'lucide-react'

export interface TOTPLoginProps {
  did: string
  onLogin: (code: string, rememberDevice?: boolean) => Promise<{ success: boolean; error?: string }>
  onCancel: () => void
  onUseBackupCode?: () => void
  isLoading?: boolean
}

export function TOTPLogin({ did, onLogin, onCancel, onUseBackupCode, isLoading = false }: TOTPLoginProps) {
  const [code, setCode] = useState('')
  const [rememberDevice, setRememberDevice] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [countdown, setCountdown] = useState(30)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Countdown timer for next code
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          return 30 // Reset to 30 seconds
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!/^\d{6}$/.test(code)) {
      setError('Please enter a valid 6-digit code')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const result = await onLogin(code, rememberDevice)
      
      if (!result.success) {
        setError(result.error || 'Authentication failed')
        setCode('') // Clear the code on failure
        inputRef.current?.focus()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed')
      setCode('')
      inputRef.current?.focus()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCodeChange = (value: string) => {
    // Only allow digits and limit to 6 characters
    const cleanValue = value.replace(/\D/g, '').slice(0, 6)
    setCode(cleanValue)
    setError(null) // Clear error when user starts typing
  }

  const isLogouting = isLoading || isSubmitting

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-xl">Two-Factor Authentication</CardTitle>
          <p className="text-sm text-gray-600">
            Enter the 6-digit code from your authenticator app
          </p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* DID Display */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <Key className="w-4 h-4 text-gray-500" />
                <span className="text-xs text-gray-600">Signing in as:</span>
              </div>
              <code className="text-sm font-mono text-gray-800 break-all">
                {did}
              </code>
            </div>

            {/* TOTP Code Input */}
            <div className="space-y-2">
              <label className="block text-sm font-medium">
                Authentication Code
              </label>
              <Input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                placeholder="000000"
                value={code}
                onChange={(e) => handleCodeChange(e.target.value)}
                className="text-center text-2xl tracking-[0.5em] font-mono"
                maxLength={6}
                disabled={isLogouting}
              />
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center space-x-1">
                  <Smartphone className="w-3 h-3" />
                  <span>From your authenticator app</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>New code in {countdown}s</span>
                </div>
              </div>
            </div>

            {/* Remember Device */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember-device"
                checked={rememberDevice}
                onCheckedChange={(checked) => setRememberDevice(checked as boolean)}
                disabled={isLogouting}
              />
              <label 
                htmlFor="remember-device"
                className="text-sm text-gray-600 cursor-pointer"
              >
                Trust this device for 30 days
              </label>
            </div>

            {/* Error Message */}
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button 
                type="submit"
                disabled={code.length !== 6 || isLogouting}
                className="w-full"
              >
                {isLogouting ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>

              <div className="flex space-x-2">
                {onUseBackupCode && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={onUseBackupCode}
                    disabled={isLogouting}
                    className="flex-1 text-sm"
                  >
                    Use backup code
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isLogouting}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </form>

          {/* Help Text */}
          <div className="mt-6 pt-4 border-t">
            <div className="text-xs text-gray-500 space-y-1">
              <p>• Codes are time-based and change every 30 seconds</p>
              <p>• Use Google Authenticator, Authy, or similar TOTP apps</p>
              <p>• Each code can only be used once</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}