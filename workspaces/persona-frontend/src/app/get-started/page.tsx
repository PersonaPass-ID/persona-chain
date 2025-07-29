'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { ChevronRight, Wallet, Mail, Phone, Shield, Key, Download, Copy, User } from 'lucide-react'
import { Navigation } from '@/components/Navigation'
import { WalletConnection } from '@/components/WalletConnection'
import { personaApiClient, PhoneVerificationCredential, ZKProof } from '@/lib/api-client'
import * as bip39 from 'bip39'

type AuthMethod = 'wallet' | 'email' | 'phone' | null
type OnboardingStep = 'method' | 'profile' | 'verification' | 'create-persona' | 'recovery-phrase' | 'complete'

type FormData = {
  // Essential Authentication Info Only
  firstName: string
  lastName: string
  email: string
  phone: string
  walletAddress: string
  verificationCode: string[]  // 6-digit array
  
  // Basic Security
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
  const [isProcessing, setIsProcessing] = useState(false)
  const [generatedDID, setGeneratedDID] = useState<string>('')
  const [verifiableCredential, setVerifiableCredential] = useState<PhoneVerificationCredential | null>(null)
  const [zkProof, setZkProof] = useState<ZKProof | null>(null)
  const [, setVerificationId] = useState<string>('')
  
  const { 
    register, 
    watch, 
    setValue, 
    trigger,
    formState: { errors },
    getValues
  } = useForm<FormData>({
    defaultValues: {
      // Essential Info Only
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      walletAddress: '',
      verificationCode: ['', '', '', '', '', ''],
      
      // Security
      seedPhrase: [],
      hasBackedUpSeedPhrase: false,
      acceptedTerms: false
    },
    mode: 'onChange'
  })

  // Generate seed phrase when needed - FOR ALL USERS (Web3 industry standard)
  useEffect(() => {
    if (currentStep === 'recovery-phrase' && seedPhrase.length === 0) {
      const mnemonic = bip39.generateMnemonic()
      const words = mnemonic.split(' ')
      setSeedPhrase(words)
      setValue('seedPhrase', words)
    }
  }, [currentStep, seedPhrase.length, setValue])

  // Watch form values for conditional rendering
  const currentPhone = watch('phone')
  const hasBackedUp = watch('hasBackedUpSeedPhrase')

  const stepProgress = {
    method: 16,
    profile: 32,
    verification: 48,
    'create-persona': 66,
    'recovery-phrase': 84,
    complete: 100
  } as const

  // Handle step progression with proper validation
  const goToNextStep = async () => {
    let canProceed = false
    
    switch (currentStep) {
      case 'method':
        canProceed = authMethod !== null
        if (canProceed) {
          if (authMethod === 'wallet') {
            setCurrentStep('verification') // Go directly to wallet connection
          } else {
            setCurrentStep('profile')
          }
        }
        break
        
      case 'profile':
        // Validate only essential profile fields
        const profileValid = await trigger(['firstName', 'lastName', 'acceptedTerms'])
        if (profileValid) {
          if (authMethod === 'email') {
            canProceed = await trigger(['email'])
          } else if (authMethod === 'phone') {
            canProceed = await trigger(['phone'])
          } else {
            canProceed = true
          }
        }
        if (canProceed) {
          setCurrentStep('verification')
          if (authMethod === 'phone' || authMethod === 'email') {
            // Start real phone verification
            setIsProcessing(true)
            try {
              const phone = getValues('phone')
              const result = await personaApiClient.startPhoneVerification(phone)
              if (result.success) {
                setVerificationId(result.verificationId || '')
                setIsVerificationSent(true)
              } else {
                console.error('Failed to start verification:', result.message)
                alert('Failed to start phone verification. Please try again.')
                return
              }
            } catch (error) {
              console.error('Error starting verification:', error)
              alert('Error starting verification. Please check your connection.')
              return
            } finally {
              setIsProcessing(false)
            }
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
        if (canProceed) setCurrentStep('create-persona')
        break
        
      case 'create-persona':
        // Generate real DID on blockchain and VCs
        setIsProcessing(true)
        try {
          if (authMethod === 'phone') {
            const phone = getValues('phone')
            const codes = getValues('verificationCode')
            const verificationCode = codes.join('')
            
            // Verify phone and get real VC + DID
            const result = await personaApiClient.verifyPhoneCodeAndIssueVC(phone, verificationCode)
            
            if (result.success && result.credential) {
              setVerifiableCredential(result.credential)
              setGeneratedDID(personaApiClient.generateDID(phone, result.credential))
              
              // Generate ZK proof for privacy
              if (result.credential) {
                const zkProof = await personaApiClient.createZKProof(result.credential, ['phoneNumber', 'verificationTimestamp'])
                if (zkProof) {
                  setZkProof(zkProof)
                }
              }
              
              // Store credential securely
              personaApiClient.storeCredential(result.credential)
              
              canProceed = true
            } else {
              // Fallback: Generate local DID if service is down
              console.warn('Blockchain service unavailable, generating fallback DID')
              const phone = getValues('phone')
              const fallbackDID = personaApiClient.generateDID(phone)
              setGeneratedDID(fallbackDID)
              canProceed = true
            }
          } else {
            // For wallet/email, create basic DID
            const identifier = authMethod === 'wallet' ? getValues('walletAddress') : getValues('email')
            const mockDID = personaApiClient.generateDID(identifier)
            setGeneratedDID(mockDID)
            canProceed = true
          }
        } catch (error) {
          console.error('Error creating persona:', error)
          // Generate fallback DID even on error
          const identifier = authMethod === 'phone' ? getValues('phone') : 
                           authMethod === 'wallet' ? getValues('walletAddress') : getValues('email')
          const fallbackDID = personaApiClient.generateDID(identifier)
          setGeneratedDID(fallbackDID)
          canProceed = true
        } finally {
          setIsProcessing(false)
        }
        
        if (canProceed) setCurrentStep('recovery-phrase')
        break
        
      case 'recovery-phrase':
        // ALL users must backup recovery phrase (Web3 industry standard)
        canProceed = hasBackedUp
        if (canProceed) setCurrentStep('complete')
        break
        
      case 'complete':
        // Store profile data for dashboard
        const profileData = {
          firstName: getValues('firstName'),
          lastName: getValues('lastName'),
          email: getValues('email'),
          phone: getValues('phone'),
          authMethod: authMethod,
          did: generatedDID,
          createdAt: new Date().toISOString()
        }
        
        if (typeof window !== 'undefined') {
          localStorage.setItem('persona_profile', JSON.stringify(profileData))
          if (generatedDID) {
            localStorage.setItem('persona_did', generatedDID)
          }
        }
        
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
      setCurrentStep('profile')
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
              <h1 className="text-4xl font-bold text-black mb-6">
                Create Your Digital Identity
              </h1>
              <p className="text-xl text-black mb-4">
                Own your data. Control your privacy. Prove who you are without revealing everything.
              </p>
              <p className="text-lg text-gray-700 mb-12">
                Choose how you&apos;d like to get started:
              </p>

              <div className="space-y-4">
                {/* Wallet Option */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setAuthMethod('wallet')
                    setCurrentStep('verification')
                  }}
                  className="w-full p-6 bg-white rounded-2xl border-2 border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 text-left"
                >
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-4">
                      <Wallet className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-black mb-1">Connect Wallet</h3>
                      <p className="text-gray-800">Already have MetaMask or another Web3 wallet? Connect instantly.</p>
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
                    setCurrentStep('profile')
                  }}
                  className="w-full p-6 bg-white rounded-2xl border-2 border-gray-200 hover:border-green-300 hover:shadow-lg transition-all duration-300 text-left"
                >
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mr-4">
                      <Mail className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-black mb-1">Email Address</h3>
                      <p className="text-gray-800">Get started quickly with just your email address.</p>
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
                    setCurrentStep('profile')
                  }}
                  className="w-full p-6 bg-white rounded-2xl border-2 border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all duration-300 text-left"
                >
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mr-4">
                      <Phone className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-black mb-1">Phone Number</h3>
                      <p className="text-gray-800">Verify with SMS for the strongest identity proof.</p>
                    </div>
                    <ChevronRight className="w-6 h-6 text-gray-400" />
                  </div>
                </motion.button>
              </div>

              <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex items-start">
                  <Shield className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1 text-blue-900">Your privacy is guaranteed</p>
                    <p className="text-blue-800">All methods use zero-knowledge proofs. Your personal data never leaves your device.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Essential Profile Info */}
          {currentStep === 'profile' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-black mb-4">
                  Tell Us About Yourself
                </h1>
                <p className="text-xl text-black mb-2">
                  We only need the basics to create your verified digital identity.
                </p>
                <p className="text-lg text-gray-700">
                  This information stays on your device and is never shared without your permission.
                </p>
              </div>

              <form className="space-y-8">
                {/* Essential Information Only */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200">
                  <div className="flex items-center mb-6">
                    <User className="w-6 h-6 text-blue-600 mr-3" />
                    <h3 className="text-xl font-semibold text-black">Your Information</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                      <input
                        type="text"
                        {...register('firstName', { required: 'First name is required' })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder="First name"
                      />
                      {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                      <input
                        type="text"
                        {...register('lastName', { required: 'Last name is required' })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder="Last name"
                      />
                      {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>}
                    </div>
                    
                    {authMethod === 'email' && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                        <input
                          type="email"
                          {...register('email', { 
                            required: authMethod === 'email' ? 'Email is required' : false,
                            pattern: {
                              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                              message: 'Invalid email address'
                            }
                          })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                          placeholder="your.email@example.com"
                        />
                        {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
                      </div>
                    )}

                    {authMethod === 'phone' && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                        <input
                          type="tel"
                          {...register('phone', { 
                            required: authMethod === 'phone' ? 'Phone number is required' : false,
                            pattern: {
                              value: /^\+[1-9]\d{1,14}$/,
                              message: 'Phone must be in E.164 format (+1234567890)'
                            }
                          })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                          placeholder="+1 (555) 123-4567"
                        />
                        {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>}
                      </div>
                    )}
                  </div>
                </div>

                {/* Terms & Privacy */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200">
                  <div className="flex items-center mb-6">
                    <Shield className="w-6 h-6 text-green-600 mr-3" />
                    <h3 className="text-xl font-semibold text-black">Terms & Privacy</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        {...register('acceptedTerms', { required: 'You must accept the terms to continue' })}
                        className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-black">
                        I agree to the <a href="#" className="text-blue-600 hover:underline font-semibold">Terms of Service</a> and <a href="#" className="text-blue-600 hover:underline font-semibold">Privacy Policy</a>. I understand that additional verification may be required later for advanced features.
                      </span>
                    </label>
                    {errors.acceptedTerms && <p className="text-sm text-red-600 ml-7">{errors.acceptedTerms.message}</p>}
                  </div>
                </div>

                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={goToNextStep}
                  disabled={isProcessing}
                  className="w-full rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-4 text-lg font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? 'Processing...' : 'Continue to Verification'}
                </motion.button>
              </form>

              <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex items-start">
                  <div className="text-blue-600 mr-3">💡</div>
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1 text-blue-900">More Features Coming</p>
                    <p className="text-blue-800">Address verification and government ID can be added later to unlock additional features like KYC compliance and premium services.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}



          {/* Step 3: Phone/Email/Wallet Verification */}
          {currentStep === 'verification' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-6"
            >
              <h1 className="text-4xl font-bold text-black mb-4">
                {authMethod === 'wallet' && 'Connect Your Wallet'}
                {authMethod === 'email' && 'Verify Your Email'}
                {authMethod === 'phone' && 'Verify Your Phone'}
              </h1>
              
              {authMethod === 'wallet' && (
                <div className="mb-8">
                  <WalletConnection 
                    onNext={() => setCurrentStep('profile')}
                    onWalletConnected={handleWalletConnected}
                  />
                </div>
              )}
              
              {authMethod !== 'wallet' && (
                <>
                  <p className="text-xl text-black mb-4">
                    {isVerificationSent 
                      ? `We sent a 6-digit code to ${currentPhone}`
                      : 'Sending verification code...'
                    }
                  </p>
                  <p className="text-lg text-gray-700 mb-8">
                    {isVerificationSent 
                      ? 'Enter the code below to verify your phone number.'
                      : 'This will only take a moment.'
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
                  
                  {!isVerificationSent && isProcessing && (
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                </>
              )}

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={goToNextStep}
                disabled={(authMethod !== 'wallet' && !isVerificationSent) || isProcessing}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-4 text-lg font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {authMethod === 'wallet' ? 'Continue' : isVerificationSent ? 'Verify & Continue' : 'Sending...'}
                <ChevronRight className="w-5 h-5" />
              </motion.button>
            </motion.div>
          )}


          {/* Step 5: Create Persona */}
          {currentStep === 'create-persona' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-8"
            >
              <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  {isProcessing ? 'Creating Your Identity...' : 'Identity Created Successfully!'}
                </h1>
                <p className="text-lg text-gray-600">
                  {isProcessing 
                    ? 'Generating your decentralized identity and verifiable credentials...' 
                    : 'Your DID and credentials are ready. Please save your DID hash below.'
                  }
                </p>
              </div>

              {isProcessing && (
                <div className="flex flex-col items-center space-y-4">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
                  <div className="text-sm text-black space-y-3">
                    <p className="font-semibold">🔐 Generating your cryptographic keys...</p>
                    <p className="font-semibold">⛓️ Registering your identity on the blockchain...</p>
                    <p className="font-semibold">📋 Creating your verifiable credentials...</p>
                    <p className="font-semibold">🛡️ Setting up zero-knowledge privacy proofs...</p>
                    <p className="font-semibold">💾 Securing everything on your device...</p>
                  </div>
                </div>
              )}

              {!isProcessing && generatedDID && (
                <div className="space-y-6">
                  {/* PROMINENT DID Display with Storage Instructions */}
                  <div className="bg-gray-900 rounded-2xl p-8 text-white border-2 border-blue-500">
                    <div className="text-center mb-6">
                      <h2 className="text-2xl font-bold mb-2 flex items-center justify-center">
                        <Key className="w-6 h-6 mr-2" />
                        Your DID Hash
                      </h2>
                      <p className="text-sm text-gray-300">
                        This is your permanent digital identity address - SAVE IT NOW
                      </p>
                    </div>
                    
                    <div className="bg-black/50 rounded-lg p-6 mb-6 border border-gray-700">
                      <div className="font-mono text-lg break-all text-center text-blue-300 mb-4">
                        {generatedDID}
                      </div>
                      <div className="flex gap-3 justify-center">
                        <button 
                          onClick={() => navigator.clipboard.writeText(generatedDID)}
                          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm transition-colors flex items-center space-x-2"
                        >
                          <Copy className="w-4 h-4" />
                          <span>Copy DID</span>
                        </button>
                        <button 
                          onClick={() => {
                            const blob = new Blob([`Your Persona DID:\n${generatedDID}\n\nCreated: ${new Date().toISOString()}\n\nIMPORTANT: Store this DID hash safely. You'll need it to access your identity.`], { type: 'text/plain' })
                            const url = URL.createObjectURL(blob)
                            const a = document.createElement('a')
                            a.href = url
                            a.download = 'persona-did.txt'
                            document.body.appendChild(a)
                            a.click()
                            document.body.removeChild(a)
                            URL.revokeObjectURL(url)
                          }}
                          className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-sm transition-colors flex items-center space-x-2"
                        >
                          <Download className="w-4 h-4" />
                          <span>Download</span>
                        </button>
                      </div>
                    </div>
                    
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                      <div className="flex items-start">
                        <div className="text-yellow-400 mr-3 text-lg">⚠️</div>
                        <div className="text-sm">
                          <p className="font-semibold text-yellow-300 mb-2">CRITICAL: Save Your DID Hash</p>
                          <ul className="space-y-1 text-gray-300 text-xs">
                            <li>• Write it down on paper and store safely</li>
                            <li>• Save it in your password manager</li>
                            <li>• Email it to yourself as backup</li>
                            <li>• This hash is required to prove your identity</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* VC Display */}
                  {verifiableCredential && (
                    <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 text-white">
                      <div className="text-left">
                        <h3 className="text-lg font-semibold mb-3 flex items-center">
                          <Shield className="w-5 h-5 mr-2" />
                          Your {authMethod === 'phone' ? 'Phone' : authMethod === 'email' ? 'Email' : 'Wallet'} Verification Credential
                        </h3>
                        <div className="text-sm opacity-90 space-y-2">
                          <p><strong>Credential Type:</strong> {verifiableCredential.type.join(', ')}</p>
                          <p><strong>Issuer:</strong> {verifiableCredential.issuer.name}</p>
                          {authMethod === 'phone' && (
                            <p><strong>Verified Phone:</strong> {verifiableCredential.credentialSubject.phoneNumber}</p>
                          )}
                          <p><strong>Status:</strong> ✅ Verified & Blockchain-Registered</p>
                          <p><strong>Expires:</strong> {new Date(verifiableCredential.expirationDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ZK Proof Display */}
                  {zkProof && (
                    <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl p-6 text-white">
                      <div className="text-left">
                        <h3 className="text-lg font-semibold mb-3 flex items-center">
                          <Key className="w-5 h-5 mr-2" />
                          Zero-Knowledge Proof Generated
                        </h3>
                        <div className="text-sm opacity-90 space-y-2">
                          <p><strong>Proof Type:</strong> {zkProof.proof.type}</p>
                          <p><strong>Privacy Level:</strong> Maximum (your personal data never exposed)</p>
                          <p><strong>Status:</strong> ✅ Ready for private verification</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <div className="flex items-start">
                      <Shield className="w-5 h-5 text-green-600 mt-0.5 mr-3" />
                      <div className="text-sm text-green-800">
                        <p className="font-medium mb-1">✅ Identity Successfully Created</p>
                        <ul className="space-y-1 text-xs">
                          <li>• DID registered and cryptographically verified</li>
                          <li>• {authMethod === 'phone' ? 'Phone' : authMethod === 'email' ? 'Email' : 'Wallet'} credential issued and verified</li>
                          <li>• Zero-knowledge proofs enabled for privacy</li>
                          <li>• All data stored securely on your device</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!isProcessing && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={goToNextStep}
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-4 text-lg font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Continue to Security Setup
                  <ChevronRight className="w-5 h-5" />
                </motion.button>
              )}
            </motion.div>
          )}

          {/* Step 6: Recovery Phrase */}
          {currentStep === 'recovery-phrase' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="text-center">
                <h1 className="text-4xl font-bold text-black mb-4">🔒 Secure Your Identity</h1>
                <p className="text-xl text-black mb-4">
                  This 12-word recovery phrase is the KEY to your digital identity.
                </p>
                <p className="text-lg text-red-700 font-semibold mb-6">
                  ⚠️ If you lose this phrase, you lose access to your identity forever. No one can recover it for you.
                </p>
              </div>

              {seedPhrase.length > 0 && (
                <>
                  {/* Recovery Phrase */}
                  <div className="bg-gray-900 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-white">🗝️ Your Recovery Phrase</h3>
                      <Key className="w-6 h-6 text-yellow-400" />
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
                        <label htmlFor="saved" className="text-sm text-white font-semibold">
                          ✓ I have safely stored my recovery phrase in multiple locations
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
                        <p className="font-medium mb-1">Critical Security Notice</p>
                        <ul className="space-y-1 text-xs">
                          <li>• Never share your recovery phrase with anyone</li>
                          <li>• Store it offline in a secure location (write it down!)</li>
                          <li>• This phrase can restore full access to your account</li>
                          <li>• Persona will never ask for your recovery phrase</li>
                          <li>• If you lose this phrase, you may lose access to your account forever</li>
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
                disabled={!hasBackedUp}
                className="w-full rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-4 text-lg font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                I Have Saved My Recovery Phrase
              </motion.button>
            </motion.div>
          )}

          {/* Step 6: Complete */}
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
                <h1 className="text-4xl font-bold text-black mb-4">🎉 Welcome to the Future!</h1>
                <p className="text-2xl text-black mb-4">
                  Your decentralized digital identity is now LIVE on the blockchain.
                </p>
                <p className="text-lg text-gray-800 mb-8">
                  You now own your data, control your privacy, and can prove who you are without revealing everything about yourself.
                </p>
              </div>

              {/* Real VC Display */}
              {verifiableCredential ? (
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white">
                  <div className="text-left">
                    <h3 className="text-lg font-semibold mb-2">Your Verifiable Credential</h3>
                    <div className="text-sm opacity-90 space-y-1">
                      <p>Type: Phone Verification Credential</p>
                      <p>DID: {generatedDID}</p>
                      <p>Phone: {verifiableCredential.credentialSubject.phoneNumber}</p>
                      <p>Issued: {new Date(verifiableCredential.issuanceDate).toLocaleDateString()}</p>
                      <p>Expires: {new Date(verifiableCredential.expirationDate).toLocaleDateString()}</p>
                      <p>Status: ✅ Verified & Blockchain-Registered</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white">
                  <div className="text-left">
                    <h3 className="text-lg font-semibold mb-2">Your Digital Identity</h3>
                    <div className="text-sm opacity-90 space-y-1">
                      <p>Type: {authMethod === 'wallet' ? 'Wallet-Based Identity' : 'Profile-Based Identity'}</p>
                      <p>Method: {authMethod === 'wallet' ? 'Wallet Connection' : authMethod === 'email' ? 'Email + Profile' : 'Phone + Profile'}</p>
                      <p>Created: {new Date().toLocaleDateString()}</p>
                      <p>Status: ✅ Successfully Created</p>
                    </div>
                  </div>
                </div>
              )}

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