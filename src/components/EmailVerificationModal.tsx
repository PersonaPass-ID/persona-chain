'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { personaApiClient } from '@/lib/api-client'
import { Loader2, Mail, Shield, CheckCircle, X } from 'lucide-react'

interface EmailVerificationModalProps {
  isOpen: boolean
  onClose: () => void
  onVerified: (email: string, verificationData: { success: boolean; credential?: unknown }) => void
}

export default function EmailVerificationModal({ 
  isOpen, 
  onClose, 
  onVerified 
}: EmailVerificationModalProps) {
  const [step, setStep] = useState<'email' | 'code' | 'success'>('email')
  const [email, setEmail] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(0)

  // Validate email format
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Start verification process
  const startVerification = async () => {
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await personaApiClient.startEmailVerification(email)
      
      if (result.success) {
        setStep('code')
        setCountdown(300) // 5 minutes countdown
      } else {
        setError(result.error || 'Failed to send verification email')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
      console.error('Email verification error:', err)
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
      const result = await personaApiClient.verifyEmailCodeAndIssueVC(
        email,
        verificationCode
      )
      
      if (result.success) {
        setStep('success')
        // Pass the verified data back to the parent
        setTimeout(() => {
          onVerified(email, result)
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
        setStep('email')
        setEmail('')
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
              <div className="bg-gradient-to-r from-green-500 to-teal-600 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                      <Mail className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-semibold">Email Verification</h2>
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
                {step === 'email' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="text-center mb-6">
                      <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                        <Shield className="w-8 h-8 text-green-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Verify Your Email Address
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">
                        We&apos;ll send you a verification code to confirm your email
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="your.email@example.com"
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
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
                        onClick={startVerification}
                        disabled={loading || !email}
                        className="w-full py-3 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-lg font-medium hover:from-green-600 hover:to-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        {loading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          'Send Verification Email'
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
                      <div className="w-16 h-16 bg-teal-100 dark:bg-teal-900/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                        <Mail className="w-8 h-8 text-teal-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Check Your Email
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">
                        We sent a verification code to
                      </p>
                      <p className="text-gray-900 dark:text-white font-medium">
                        {email}
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
                          className="w-full px-4 py-3 text-center text-2xl tracking-widest border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
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
                        className="w-full py-3 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-lg font-medium hover:from-green-600 hover:to-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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
                            Resend email in {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
                          </p>
                        ) : (
                          <button
                            onClick={startVerification}
                            className="text-sm text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                          >
                            Resend email
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
                      Email Verified!
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Your email address has been successfully verified
                    </p>
                  </motion.div>
                )}
              </div>

              {/* Security Notice */}
              <div className="px-6 pb-6">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                  <div className="flex items-start space-x-3">
                    <Shield className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">
                        Secure Email Verification
                      </h4>
                      <p className="text-xs text-green-600 dark:text-green-300">
                        Your email is encrypted and stored securely. We use magic links 
                        for passwordless authentication to keep your account safe.
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