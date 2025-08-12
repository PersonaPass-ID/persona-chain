'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Shield, 
  AlertTriangle,
  RefreshCw,
  Key,
  ArrowLeft
} from 'lucide-react'

export interface BackupCodeLoginProps {
  did: string
  onLogin: (code: string) => Promise<{ success: boolean; error?: string }>
  onCancel: () => void
  onBackToTOTP?: () => void
  isLoading?: boolean
}

export function BackupCodeLogin({ 
  did, 
  onLogin, 
  onCancel, 
  onBackToTOTP, 
  isLoading = false 
}: BackupCodeLoginProps) {
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!/^[A-F0-9]{8}$/i.test(code)) {
      setError('Please enter a valid 8-character backup code')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const result = await onLogin(code.toUpperCase())
      
      if (!result.success) {
        setError(result.error || 'Invalid backup code')
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
    // Only allow alphanumeric characters and limit to 8 characters
    const cleanValue = value.replace(/[^A-F0-9]/gi, '').slice(0, 8).toUpperCase()
    setCode(cleanValue)
    setError(null) // Clear error when user starts typing
  }

  const isProcessing = isLoading || isSubmitting

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-orange-600" />
          </div>
          <CardTitle className="text-xl">Use Backup Code</CardTitle>
          <p className="text-sm text-gray-600">
            Enter one of your 8-character backup recovery codes
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

            {/* Backup Code Input */}
            <div className="space-y-2">
              <label className="block text-sm font-medium">
                Backup Recovery Code
              </label>
              <Input
                ref={inputRef}
                type="text"
                placeholder="A1B2C3D4"
                value={code}
                onChange={(e) => handleCodeChange(e.target.value)}
                className="text-center text-xl tracking-[0.25em] font-mono"
                maxLength={8}
                disabled={isProcessing}
              />
              <p className="text-xs text-gray-500">
                Enter the 8-character code exactly as shown in your backup codes
              </p>
            </div>

            {/* Warning */}
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>Important:</strong> Each backup code can only be used once. 
                After using a code, it will be permanently invalidated.
              </AlertDescription>
            </Alert>

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
                disabled={code.length !== 8 || isProcessing}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Sign In with Backup Code'
                )}
              </Button>

              <div className="flex space-x-2">
                {onBackToTOTP && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={onBackToTOTP}
                    disabled={isProcessing}
                    className="flex-1 text-sm"
                  >
                    <ArrowLeft className="w-3 h-3 mr-1" />
                    Back to authenticator
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isProcessing}
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
              <p>• Backup codes are 8-character alphanumeric codes</p>
              <p>• Each code can only be used once</p>
              <p>• You should have received 8 backup codes during setup</p>
              <p>• After login, consider generating new backup codes</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}