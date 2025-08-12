'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Shield, Key, Smartphone, Eye, EyeOff, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

export default function AccountSetupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState<'password' | 'totp' | 'complete'>('password')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Form state
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
    totpCode: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState({ isValid: false, errors: [] as string[] })
  
  // TOTP setup state
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [secret, setSecret] = useState('')

  // Get user data from URL params
  const walletAddress = searchParams.get('address') || ''
  const email = searchParams.get('email') || ''
  const did = searchParams.get('did') || ''

  useEffect(() => {
    // Redirect if missing required data
    if (!walletAddress || !email) {
      router.push('/get-started')
      return
    }
  }, [walletAddress, email, router])

  // Real-time password validation
  useEffect(() => {
    if (formData.password) {
      setPasswordStrength(validatePassword(formData.password))
    } else {
      setPasswordStrength({ isValid: false, errors: [] })
    }
  }, [formData.password])

  const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = []
    
    if (password.length < 12) {
      errors.push('Must be at least 12 characters long')
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Must contain at least one uppercase letter')
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Must contain at least one lowercase letter')
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Must contain at least one number')
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Must contain at least one special character')
    }
    if (/(.)\1{2,}/.test(password)) {
      errors.push('Cannot contain 3 or more repeated characters')
    }
    if (/^[a-zA-Z]+$/.test(password) || /^[0-9]+$/.test(password)) {
      errors.push('Cannot be only letters or only numbers')
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate password strength
    const passwordValidation = validatePassword(formData.password)
    if (!passwordValidation.isValid) {
      setError(passwordValidation.errors[0]) // Show first error
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsLoading(true)

    try {
      // First check if email already exists
      const emailCheckResponse = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const emailCheckResult = await emailCheckResponse.json()
      
      if (emailCheckResult.exists) {
        throw new Error('An account with this email already exists. Please use a different email or try logging in.')
      }

      // Create account with password
      const response = await fetch('/api/auth/create-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress,
          email,
          password: formData.password,
          did
        })
      })

      const result = await response.json()

      if (!result.success) {
        if (result.error?.includes('already exists') || result.error?.includes('duplicate')) {
          throw new Error('An account with this email already exists. Please use a different email.')
        }
        throw new Error(result.error || 'Failed to create account')
      }

      // Generate TOTP setup
      const totpResponse = await fetch('https://api.personapass.xyz/api/auth/totp-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          walletAddress
        })
      })

      const totpResult = await totpResponse.json()

      if (!totpResult.success) {
        throw new Error(totpResult.error || 'Failed to setup TOTP')
      }

      setQrCodeUrl(totpResult.qrCodeUrl)
      setSecret(totpResult.secret)
      setStep('totp')

    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTotpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.totpCode || formData.totpCode.length !== 6) {
      setError('Please enter a 6-digit TOTP code')
      return
    }

    setIsLoading(true)

    try {
      // Verify TOTP code
      const response = await fetch('https://api.personapass.xyz/api/auth/totp-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          totpCode: formData.totpCode,
          walletAddress
        })
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Invalid TOTP code')
      }

      setStep('complete')

    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleComplete = () => {
    router.push('/auth/login?setup=complete')
  }

  if (!walletAddress || !email) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-gray-400">Redirecting...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Complete Your Account</h1>
          <p className="text-gray-400">Secure your PersonaPass identity</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            {['password', 'totp', 'complete'].map((stepName, index) => {
              const isActive = step === stepName
              const isCompleted = ['password', 'totp', 'complete'].indexOf(step) > index
              
              return (
                <React.Fragment key={stepName}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    isCompleted ? 'bg-green-500 text-white' :
                    isActive ? 'bg-purple-600 text-white' :
                    'bg-gray-700 text-gray-400'
                  }`}>
                    {isCompleted ? <CheckCircle className="w-4 h-4" /> : index + 1}
                  </div>
                  {index < 2 && (
                    <div className={`w-8 h-0.5 ${
                      isCompleted ? 'bg-green-500' : 'bg-gray-700'
                    }`} />
                  )}
                </React.Fragment>
              )
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
          {step === 'password' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="text-center">
                <Key className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                <h2 className="text-xl font-semibold text-white mb-2">Create Password</h2>
                <p className="text-gray-400 text-sm">Choose a strong password for your account</p>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  
                  {/* Password Requirements */}
                  <div className="mt-3 space-y-2">
                    <div className="text-xs text-gray-400">Password Requirements:</div>
                    <div className="grid grid-cols-1 gap-1 text-xs">
                      <div className={`flex items-center space-x-2 ${formData.password.length >= 12 ? 'text-green-400' : 'text-gray-500'}`}>
                        <span>{formData.password.length >= 12 ? '✓' : '○'}</span>
                        <span>At least 12 characters</span>
                      </div>
                      <div className={`flex items-center space-x-2 ${/[A-Z]/.test(formData.password) ? 'text-green-400' : 'text-gray-500'}`}>
                        <span>{/[A-Z]/.test(formData.password) ? '✓' : '○'}</span>
                        <span>Uppercase letter</span>
                      </div>
                      <div className={`flex items-center space-x-2 ${/[a-z]/.test(formData.password) ? 'text-green-400' : 'text-gray-500'}`}>
                        <span>{/[a-z]/.test(formData.password) ? '✓' : '○'}</span>
                        <span>Lowercase letter</span>
                      </div>
                      <div className={`flex items-center space-x-2 ${/[0-9]/.test(formData.password) ? 'text-green-400' : 'text-gray-500'}`}>
                        <span>{/[0-9]/.test(formData.password) ? '✓' : '○'}</span>
                        <span>Number</span>
                      </div>
                      <div className={`flex items-center space-x-2 ${/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password) ? 'text-green-400' : 'text-gray-500'}`}>
                        <span>{/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password) ? '✓' : '○'}</span>
                        <span>Special character (!@#$%^&*)</span>
                      </div>
                      <div className={`flex items-center space-x-2 ${!/(.)\1{2,}/.test(formData.password) && formData.password ? 'text-green-400' : 'text-gray-500'}`}>
                        <span>{!/(.)\1{2,}/.test(formData.password) && formData.password ? '✓' : '○'}</span>
                        <span>No repeated characters (aaa)</span>
                      </div>
                    </div>
                    
                    {/* Password Strength Bar */}
                    {formData.password && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-400">Password Strength</span>
                          <span className={passwordStrength.isValid ? 'text-green-400' : 'text-yellow-400'}>
                            {passwordStrength.isValid ? 'Strong' : `${6 - passwordStrength.errors.length}/6 requirements met`}
                          </span>
                        </div>
                        <div className="w-full bg-gray-600 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              passwordStrength.isValid ? 'bg-green-500' : 
                              passwordStrength.errors.length <= 3 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.max(10, ((6 - passwordStrength.errors.length) / 6) * 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Confirm your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center space-x-2 text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-lg font-medium hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <Loader2 className="animate-spin w-4 h-4 mr-2" />
                      Creating Account...
                    </span>
                  ) : (
                    'Continue'
                  )}
                </button>
              </form>
            </motion.div>
          )}

          {step === 'totp' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="text-center">
                <Smartphone className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                <h2 className="text-xl font-semibold text-white mb-2">Setup 2FA</h2>
                <p className="text-gray-400 text-sm">Scan the QR code with Google Authenticator</p>
              </div>

              {qrCodeUrl && (
                <div className="bg-white p-4 rounded-lg text-center">
                  <img src={qrCodeUrl} alt="TOTP QR Code" className="mx-auto" />
                </div>
              )}

              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="text-sm font-medium text-white mb-2">Manual Setup</h3>
                <p className="text-xs text-gray-400 mb-2">If you can't scan the QR code, enter this secret manually:</p>
                <code className="text-xs text-green-400 break-all">{secret}</code>
              </div>

              <form onSubmit={handleTotpSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    value={formData.totpCode}
                    onChange={(e) => setFormData(prev => ({ ...prev, totpCode: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-center text-lg tracking-widest"
                    placeholder="000000"
                    maxLength={6}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the 6-digit code from Google Authenticator
                  </p>
                </div>

                {error && (
                  <div className="flex items-center space-x-2 text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || formData.totpCode.length !== 6}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-lg font-medium hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <Loader2 className="animate-spin w-4 h-4 mr-2" />
                      Verifying...
                    </span>
                  ) : (
                    'Verify & Complete'
                  )}
                </button>
              </form>
            </motion.div>
          )}

          {step === 'complete' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6"
            >
              <div className="w-20 h-20 bg-green-500 rounded-full mx-auto flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Account Setup Complete!</h2>
                <p className="text-gray-400">Your PersonaPass identity is now secure</p>
              </div>

              <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                <h3 className="text-green-400 font-medium mb-2">✅ Setup Summary</h3>
                <div className="space-y-1 text-sm text-gray-300">
                  <p>• DID created: {did.slice(0, 30)}...</p>
                  <p>• Password authentication enabled</p>
                  <p>• 2FA (TOTP) protection active</p>
                  <p>• Account ready for login</p>
                </div>
              </div>

              <button
                onClick={handleComplete}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 rounded-lg font-medium hover:from-green-600 hover:to-emerald-600 transition-all duration-200"
              >
                Go to Login
              </button>
            </motion.div>
          )}
        </div>

        {/* Account Info */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Setting up account for: {email}</p>
          <p className="text-xs mt-1">Wallet: {walletAddress.slice(0, 8)}...{walletAddress.slice(-6)}</p>
        </div>
      </div>
    </div>
  )
}