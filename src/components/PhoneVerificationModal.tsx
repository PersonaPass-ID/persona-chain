'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { personaApiClient } from '@/lib/api-client'
import { Loader2, Phone, Shield, CheckCircle, X } from 'lucide-react'

interface PhoneVerificationModalProps {
  isOpen: boolean
  onClose: () => void
  onVerified: (phoneNumber: string, verificationData: { success: boolean; credential?: unknown }) => void
}

export default function PhoneVerificationModal({ 
  isOpen, 
  onClose, 
  onVerified 
}: PhoneVerificationModalProps) {
  const [step, setStep] = useState<'phone' | 'code' | 'success'>('phone')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(0)

  // Format phone number as user types
  const formatPhoneNumber = (value: string) => {
    const phoneNumber = value.replace(/[^\d]/g, '')
    const phoneNumberLength = phoneNumber.length

    if (phoneNumberLength < 4) return phoneNumber
    if (phoneNumberLength < 7) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`
    }
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`
  }

  // Handle phone number input
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    if (formatted.replace(/[^\d]/g, '').length <= 10) {
      setPhoneNumber(formatted)
    }
  }

  // Start verification process
  const startVerification = async () => {
    const cleanPhone = phoneNumber.replace(/[^\d]/g, '')
    if (cleanPhone.length !== 10) {
      setError('Please enter a valid 10-digit phone number')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await personaApiClient.startPhoneVerification(`+1${cleanPhone}`)
      
      if (result.success) {
        setStep('code')
        setCountdown(120) // 2 minutes countdown
      } else {
        setError(result.error || 'Failed to send verification code')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
      console.error('Phone verification error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Verify the code
  const verifyCode = async () => {
    if (verificationCode.length !== 6) {
      setError('Please enter a 6-digit code')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const cleanPhone = phoneNumber.replace(/[^\d]/g, '')
      const result = await personaApiClient.verifyPhoneCodeAndIssueVC(
        `+1${cleanPhone}`,
        verificationCode
      )
      
      if (result.success) {
        setStep('success')
        // Pass the verified data back to the parent
        setTimeout(() => {
          onVerified(`+1${cleanPhone}`, result)
        }, 2000)
      } else {
        setError(result.error || 'Invalid verification code')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
      console.error('Code verification error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  // Reset modal when closed
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep('phone')
        setPhoneNumber('')
        setVerificationCode('')
        setError(null)
        setCountdown(0)
      }, 300)
    }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                      <Phone className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-semibold">Phone Verification</h2>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {step === 'phone' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="text-center mb-6">
                      <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                        <Shield className="w-8 h-8 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Verify Your Phone Number
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">
                        We&apos;ll send you a verification code to confirm your identity
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Phone Number
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 dark:text-gray-400">+1</span>
                          </div>
                          <input
                            type="tel"
                            value={phoneNumber}
                            onChange={handlePhoneChange}
                            placeholder="(555) 123-4567"
                            className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                      </div>

                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg"
                        >
                          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                        </motion.div>
                      )}

                      <button
                        onClick={startVerification}
                        disabled={loading || phoneNumber.replace(/[^\d]/g, '').length !== 10}
                        className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        {loading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          'Send Verification Code'
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}

                {step === 'code' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="text-center mb-6">
                      <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                        <Phone className="w-8 h-8 text-green-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Enter Verification Code
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">
                        We sent a code to {phoneNumber}
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          6-Digit Code
                        </label>
                        <input
                          type="text"
                          value={verificationCode}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^\d]/g, '')
                            if (value.length <= 6) setVerificationCode(value)
                          }}
                          placeholder="000000"
                          className="w-full px-4 py-3 text-center text-2xl tracking-widest border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        />
                      </div>

                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg"
                        >
                          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                        </motion.div>
                      )}

                      <button
                        onClick={verifyCode}
                        disabled={loading || verificationCode.length !== 6}
                        className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        {loading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          'Verify Code'
                        )}
                      </button>

                      <div className="text-center">
                        {countdown > 0 ? (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Resend code in {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
                          </p>
                        ) : (
                          <button
                            onClick={startVerification}
                            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            Resend code
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 'success' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-8"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: 'spring' }}
                      className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full mx-auto mb-4 flex items-center justify-center"
                    >
                      <CheckCircle className="w-10 h-10 text-green-600" />
                    </motion.div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      Phone Verified!
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Your phone number has been successfully verified
                    </p>
                  </motion.div>
                )}
              </div>

              {/* Security Notice */}
              <div className="px-6 pb-6">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                  <div className="flex items-start space-x-3">
                    <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                        Your Privacy Matters
                      </h4>
                      <p className="text-xs text-blue-600 dark:text-blue-300">
                        Your phone number is encrypted and will only be used for verification. 
                        We never share your personal information with third parties.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}