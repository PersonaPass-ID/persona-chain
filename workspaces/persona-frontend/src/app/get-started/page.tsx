'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { ChevronRight, Wallet, Mail, Phone, Shield, Key, Download, CheckCircle, Copy } from 'lucide-react'
import { Navigation } from '@/components/Navigation'
import { WalletConnection } from '@/components/WalletConnection'
import * as bip39 from 'bip39'

type AuthMethod = 'wallet' | 'email' | 'phone' | null
type OnboardingStep = 'method' | 'credentials' | 'verification' | 'keys' | 'complete'

type FormData = {
  name: string
  email: string
  phone: string
  walletAddress: string
  verificationCode: string[]  // 6-digit array
  seedPhrase: string[]
  hasBackedUpSeedPhrase: boolean
  acceptedTerms: boolean
}

export default function GetStartedPage() {
  const router = useRouter()
  const [authMethod, setAuthMethod] = useState<AuthMethod>(null)
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('method')
  const [isVerificationSent, setIsVerificationSent] = useState(false)
  const [seedPhrase, setSeedPhrase] = useState<string[]>([])
  
  const { 
    register, 
    handleSubmit, 
    watch, 
    setValue, 
    trigger,
    formState: { errors, isValid },
    getValues
  } = useForm<FormData>({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      walletAddress: '',
      verificationCode: ['', '', '', '', '', ''],
      seedPhrase: [],
      hasBackedUpSeedPhrase: false,
      acceptedTerms: false
    },
    mode: 'onChange'
  })

  // Generate seed phrase when needed
  useEffect(() => {
    if (currentStep === 'keys' && seedPhrase.length === 0 && authMethod !== 'wallet') {
      const mnemonic = bip39.generateMnemonic()
      const words = mnemonic.split(' ')
      setSeedPhrase(words)
      setValue('seedPhrase', words)
    }
  }, [currentStep, authMethod, seedPhrase.length, setValue])

  // Watch form values for conditional rendering
  const watchedValues = watch()
  const currentName = watch('name')
  const currentEmail = watch('email')
  const currentPhone = watch('phone')
  const hasBackedUp = watch('hasBackedUpSeedPhrase')

  const stepProgress = {
    method: 20,
    credentials: 40,
    verification: 60,
    keys: 80,
    complete: 100
  }

  // Handle step progression with proper validation
  const goToNextStep = async () => {
    let canProceed = false
    
    switch (currentStep) {
      case 'method':
        canProceed = authMethod !== null
        if (canProceed) setCurrentStep('credentials')
        break
        
      case 'credentials':
        if (authMethod === 'wallet') {
          canProceed = !!watchedValues.walletAddress
        } else if (authMethod === 'email') {
          canProceed = await trigger(['name', 'email'])
        } else if (authMethod === 'phone') {
          canProceed = await trigger(['name', 'phone'])
        }
        if (canProceed) {
          setCurrentStep('verification')
          if (authMethod !== 'wallet') {
            // Simulate sending verification code
            setTimeout(() => setIsVerificationSent(true), 1000)
          }
        }
        break
        
      case 'verification':
        if (authMethod === 'wallet') {
          canProceed = true  // Wallet connection is verification
        } else {
          // Check if all 6 digits are filled
          const codes = getValues('verificationCode')
          canProceed = codes.every(code => code && code.length === 1)
        }
        if (canProceed) setCurrentStep('keys')
        break
        
      case 'keys':
        if (authMethod === 'wallet') {
          canProceed = true  // Wallet manages keys
        } else {
          canProceed = hasBackedUp
        }
        if (canProceed) setCurrentStep('complete')
        break
        
      case 'complete':
        // Navigate to dashboard
        router.push('/dashboard')
        break
    }
  }

  // Handle wallet connection success
  const handleWalletConnected = (address: string) => {
    setValue('walletAddress', address)
    // Auto-advance after wallet connection
    setTimeout(() => {
      setCurrentStep('verification')
    }, 1500)
  }

  // Handle verification code input
  const handleVerificationInput = (index: number, value: string) => {
    const codes = [...getValues('verificationCode')]
    codes[index] = value.slice(-1) // Only keep last character
    setValue('verificationCode', codes)
    
    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.querySelector(`input[name="verificationCode.${index + 1}"]`) as HTMLInputElement
      nextInput?.focus()
    }
  }

  // Download seed phrase as text file
  const downloadSeedPhrase = () => {
    const content = seedPhrase.join(' ')
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'persona-recovery-phrase.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Copy seed phrase to clipboard
  const copySeedPhrase = async () => {
    const content = seedPhrase.join(' ')
    await navigator.clipboard.writeText(content)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      <Navigation />
      
      {/* Progress Bar */}
      <div className="fixed top-16 left-0 right-0 z-40 bg-white/80 backdrop-blur-sm border-b border-gray-200/50">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Create Your Persona</span>
            <span>{stepProgress[currentStep]}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div 
              className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full"
              initial={{ width: '20%' }}
              animate={{ width: `${stepProgress[currentStep]}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>

      <div className="pt-32 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          
          {/* Step 1: Choose Authentication Method */}
          {currentStep === 'method' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                How would you like to get started?
              </h1>
              <p className="text-lg text-gray-600 mb-12">
                Choose your preferred method to create your secure digital identity
              </p>

              <div className="space-y-4">
                {/* Wallet Option */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setAuthMethod('wallet')
                    setCurrentStep('credentials')
                  }}
                  className="w-full p-6 bg-white rounded-2xl border-2 border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 text-left"
                >
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-4">
                      <Wallet className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-1">Connect Wallet</h3>
                      <p className="text-gray-600">Use MetaMask, WalletConnect, or any Web3 wallet</p>
                    </div>
                    <ChevronRight className="w-6 h-6 text-gray-400" />
                  </div>
                </motion.button>

                {/* Email Option */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setAuthMethod('email')
                    setCurrentStep('credentials')
                  }}
                  className="w-full p-6 bg-white rounded-2xl border-2 border-gray-200 hover:border-green-300 hover:shadow-lg transition-all duration-300 text-left"
                >
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mr-4">
                      <Mail className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-1">Email Address</h3>
                      <p className="text-gray-600">Quick setup with email verification</p>
                    </div>
                    <ChevronRight className="w-6 h-6 text-gray-400" />
                  </div>
                </motion.button>

                {/* Phone Option */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setAuthMethod('phone')
                    setCurrentStep('credentials')
                  }}
                  className="w-full p-6 bg-white rounded-2xl border-2 border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all duration-300 text-left"
                >
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mr-4">
                      <Phone className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-1">Phone Number</h3>
                      <p className="text-gray-600">Verify with SMS code for instant access</p>
                    </div>
                    <ChevronRight className="w-6 h-6 text-gray-400" />
                  </div>
                </motion.button>
              </div>

              <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex items-start">
                  <Shield className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Your privacy is guaranteed</p>
                    <p>All methods use zero-knowledge proofs. Your personal data never leaves your device.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Enter Credentials */}
          {currentStep === 'credentials' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  {authMethod === 'wallet' && 'Connect Your Wallet'}
                  {authMethod === 'email' && 'Enter Your Email'}
                  {authMethod === 'phone' && 'Enter Your Phone Number'}
                </h1>
                <p className="text-lg text-gray-600">
                  {authMethod === 'wallet' && 'Choose from supported wallets to connect securely'}
                  {authMethod === 'email' && 'We&apos;ll send you a verification code'}
                  {authMethod === 'phone' && 'We&apos;ll send you an SMS verification code'}
                </p>
              </div>

              {authMethod === 'wallet' && (
                <WalletConnection 
                  onNext={goToNextStep}
                  onWalletConnected={handleWalletConnected}
                />
              )}

              {authMethod === 'email' && (
                <form className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      {...register('name', { 
                        required: 'Full name is required',
                        minLength: { value: 2, message: 'Name must be at least 2 characters' }
                      })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="Enter your full name"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                    <input
                      type="email"
                      {...register('email', { 
                        required: 'Email is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address'
                        }
                      })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="Enter your email address"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                    )}
                  </div>

                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={goToNextStep}
                    disabled={!currentName || !currentEmail || !!errors.name || !!errors.email}
                    className="w-full rounded-full bg-gradient-to-r from-green-600 to-emerald-600 px-8 py-4 text-lg font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Send Verification Code
                  </motion.button>
                </form>
              )}

              {authMethod === 'phone' && (
                <form className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      {...register('name', { 
                        required: 'Full name is required',
                        minLength: { value: 2, message: 'Name must be at least 2 characters' }
                      })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="Enter your full name"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      {...register('phone', { 
                        required: 'Phone number is required',
                        pattern: {
                          value: /^[+]?[1-9]\d{1,14}$/,
                          message: 'Invalid phone number format'
                        }
                      })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="+1 (555) 123-4567"
                    />
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                    )}
                  </div>

                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={goToNextStep}
                    disabled={!currentName || !currentPhone || !!errors.name || !!errors.phone}
                    className="w-full rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-4 text-lg font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Send SMS Code
                  </motion.button>
                </form>
              )}
            </motion.div>
          )}

          {/* Step 3: Verification */}
          {currentStep === 'verification' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-6"
            >
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {authMethod === 'wallet' && 'Wallet Connected Successfully!'}
                {authMethod === 'email' && 'Check Your Email'}
                {authMethod === 'phone' && 'Enter Verification Code'}
              </h1>
              
              {authMethod === 'wallet' && (
                <div className="flex justify-center mb-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center"
                  >
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </motion.div>
                </div>
              )}
              
              {authMethod !== 'wallet' && (
                <>
                  <p className="text-lg text-gray-600 mb-8">
                    {isVerificationSent 
                      ? `Enter the 6-digit code we sent to ${currentEmail || currentPhone}`
                      : 'Sending verification code...'
                    }
                  </p>
                  
                  {isVerificationSent && (
                    <div className="flex justify-center space-x-3 mb-8">
                      {[...Array(6)].map((_, index) => (
                        <input
                          key={index}
                          type="text"
                          name={`verificationCode.${index}`}
                          maxLength={1}
                          className="w-12 h-12 text-center text-xl font-bold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                          onChange={(e) => handleVerificationInput(index, e.target.value)}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={goToNextStep}
                disabled={authMethod !== 'wallet' && !isVerificationSent}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-4 text-lg font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {authMethod === 'wallet' ? 'Continue' : isVerificationSent ? 'Verify Code' : 'Sending...'}
                <ChevronRight className="w-5 h-5" />
              </motion.button>
            </motion.div>
          )}

          {/* Step 4: Security Keys */}
          {currentStep === 'keys' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Secure Your Account</h1>
                <p className="text-lg text-gray-600">
                  {authMethod === 'wallet' 
                    ? 'Your wallet already manages your keys securely'
                    : 'Save your recovery phrase to restore access if needed'
                  }
                </p>
              </div>

              {authMethod !== 'wallet' && seedPhrase.length > 0 && (
                <>
                  {/* Recovery Phrase */}
                  <div className="bg-gray-900 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white">Your Recovery Phrase</h3>
                      <Key className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="grid grid-cols-3 gap-3 mb-6">
                      {seedPhrase.map((word, index) => (
                        <div key={index} className="bg-gray-800 rounded-lg p-3 text-center">
                          <span className="text-xs text-gray-400 block">{index + 1}</span>
                          <span className="text-white font-mono text-sm">{word}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex gap-3">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={downloadSeedPhrase}
                          className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </motion.button>
                        
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={copySeedPhrase}
                          className="flex-1 flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-lg transition-colors"
                        >
                          <Copy className="w-4 h-4" />
                          Copy
                        </motion.button>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id="saved"
                          {...register('hasBackedUpSeedPhrase', { required: 'You must backup your recovery phrase' })}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="saved" className="text-sm text-gray-300">
                          I have safely stored my recovery phrase
                        </label>
                      </div>
                      {errors.hasBackedUpSeedPhrase && (
                        <p className="text-sm text-red-400">{errors.hasBackedUpSeedPhrase.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="flex items-start">
                      <div className="text-red-400 mr-3">⚠️</div>
                      <div className="text-sm text-red-800">
                        <p className="font-medium mb-1">Important Security Notice</p>
                        <ul className="space-y-1 text-xs">
                          <li>• Never share your recovery phrase with anyone</li>
                          <li>• Store it offline in a secure location</li>
                          <li>• This phrase can restore full access to your account</li>
                          <li>• Persona will never ask for your recovery phrase</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={goToNextStep}
                disabled={authMethod !== 'wallet' && !hasBackedUp}
                className="w-full rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-4 text-lg font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {authMethod === 'wallet' ? 'Continue to Dashboard' : 'Create My Digital Identity'}
              </motion.button>
            </motion.div>
          )}

          {/* Step 5: Complete */}
          {currentStep === 'complete' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-8"
            >
              <div className="w-24 h-24 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="text-white text-4xl"
                >
                  ✓
                </motion.div>
              </div>

              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome to Persona! 🎉</h1>
                <p className="text-lg text-gray-600 mb-8">
                  Your digital identity has been created successfully. You now have your first Verifiable Credential!
                </p>
              </div>

              {/* First VC Display */}
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white">
                <div className="text-left">
                  <h3 className="text-lg font-semibold mb-2">Your First Verifiable Credential</h3>
                  <div className="text-sm opacity-90 space-y-1">
                    <p>Type: Identity Verification</p>
                    <p>Method: {authMethod === 'wallet' ? 'Wallet Connection' : authMethod === 'email' ? 'Email Verification' : 'Phone Verification'}</p>
                    <p>Issued: {new Date().toLocaleDateString()}</p>
                    <p>Status: ✅ Verified</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push('/dashboard')}
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-4 text-lg font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Go to Dashboard
                  <ChevronRight className="w-5 h-5" />
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center gap-2 rounded-full border-2 border-gray-300 px-8 py-4 text-lg font-semibold text-gray-700 hover:bg-gray-50 transition-all duration-300"
                >
                  View Credential
                </motion.button>
              </div>
            </motion.div>
          )}

        </div>
      </div>
    </div>
  )
}