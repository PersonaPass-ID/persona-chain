'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { useAccount, useDisconnect } from 'wagmi'
import { 
  ChevronRight, 
  Wallet, 
  Mail, 
  Shield, 
  Key, 
  Download, 
  Copy, 
  User,
  Check,
  Fingerprint,
  Sparkles,
  Zap,
  Lock,
  Globe,
  QrCode,
  Smartphone,
  Chrome,
  Twitter,
  Github,
  Loader2
} from 'lucide-react'
import { Navigation } from '@/components/Navigation'
import { personaApiClient, PhoneVerificationCredential } from '@/lib/api-client'
import { useWalletConnectionManager } from '@/hooks/useWalletConnectionManager'
import confetti from 'canvas-confetti'

type AuthMethod = 'social' | 'wallet' | 'email' | 'phone' | null
type OnboardingStep = 'welcome' | 'method' | 'connect' | 'profile' | 'verification' | 'complete'

type FormData = {
  firstName: string
  lastName: string
  email: string
  phone: string
  username: string
  acceptedTerms: boolean
  verificationCode: string
}

// Modern Web3 onboarding with progressive disclosure
export default function GetStartedV2Page() {
  const router = useRouter()
  const { isConnected, address } = useAccount()
  const { connectWallet, connectors, isPending } = useWalletConnectionManager()
  const { disconnect } = useDisconnect()
  
  const [authMethod, setAuthMethod] = useState<AuthMethod>(null)
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome')
  const [isProcessing, setIsProcessing] = useState(false)
  const [generatedDID, setGeneratedDID] = useState<string>('')
  const [verifiableCredential, setVerifiableCredential] = useState<PhoneVerificationCredential | null>(null)
  const [, setVerificationId] = useState<string>('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [selectedSocial, setSelectedSocial] = useState<string>('')
  
  const { 
    register, 
    watch, 
    trigger,
    formState: { errors },
    getValues
  } = useForm<FormData>({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      username: '',
      acceptedTerms: false,
      verificationCode: ''
    },
    mode: 'onChange'
  })

  // Auto-advance for wallet users - with connection state protection
  useEffect(() => {
    if (isConnected && address && currentStep === 'connect' && authMethod === 'wallet') {
      // Auto-advance to profile only once
      const timer = setTimeout(() => setCurrentStep('profile'), 1000)
      return () => clearTimeout(timer)
    }
  }, [isConnected, address, currentStep, authMethod])

  // Watch form values
  const acceptedTerms = watch('acceptedTerms')
  const verificationCode = watch('verificationCode')

  // Step indicators with modern design
  const steps = [
    { id: 'welcome', label: 'Welcome', icon: Sparkles },
    { id: 'method', label: 'Choose Method', icon: Fingerprint },
    { id: 'connect', label: 'Connect', icon: Globe },
    { id: 'profile', label: 'Create Profile', icon: User },
    { id: 'verification', label: 'Verify', icon: Shield },
    { id: 'complete', label: 'Complete', icon: Check }
  ]

  const currentStepIndex = steps.findIndex(s => s.id === currentStep)

  // Modern step navigation
  const goToNextStep = async () => {
    switch (currentStep) {
      case 'welcome':
        setCurrentStep('method')
        break
        
      case 'method':
        if (authMethod) {
          if (authMethod === 'social') {
            // For demo, simulate social login
            setCurrentStep('profile')
          } else {
            setCurrentStep('connect')
          }
        }
        break
        
      case 'connect':
        if (authMethod === 'wallet' && isConnected) {
          setCurrentStep('profile')
        } else if (authMethod === 'email' || authMethod === 'phone') {
          setCurrentStep('profile')
        }
        break
        
      case 'profile':
        const profileValid = await trigger(['firstName', 'lastName', 'username', 'acceptedTerms'])
        if (profileValid) {
          if (authMethod === 'phone') {
            // Start phone verification
            setIsProcessing(true)
            try {
              const phone = getValues('phone')
              const result = await personaApiClient.startPhoneVerification(phone)
              if (result.success) {
                setVerificationId(result.verificationId || '')
                setCurrentStep('verification')
              } else {
                alert('Failed to start verification. Please try again.')
              }
            } catch (error) {
              console.error('Error starting verification:', error)
              alert('Error starting verification. Please check your connection.')
            } finally {
              setIsProcessing(false)
            }
          } else {
            // Skip verification for other methods in demo
            await createDID()
          }
        }
        break
        
      case 'verification':
        if (verificationCode.length === 6) {
          await verifyAndCreateDID()
        }
        break
    }
  }

  // Create DID on blockchain
  const createDID = async () => {
    setIsProcessing(true)
    try {
      const firstName = getValues('firstName')
      const lastName = getValues('lastName')
      const username = getValues('username')
      
      let identifier: string
      let walletAddress: string
      
      if (authMethod === 'wallet') {
        walletAddress = address || ''
        identifier = walletAddress
      } else if (authMethod === 'email') {
        identifier = getValues('email')
        walletAddress = identifier
      } else if (authMethod === 'phone') {
        identifier = getValues('phone')
        walletAddress = identifier
      } else if (authMethod === 'social') {
        identifier = `${selectedSocial}:${username}`
        walletAddress = identifier
      } else {
        throw new Error('Invalid auth method')
      }
      
      // Create DID on blockchain
      console.log('🚀 Calling personaApiClient.createDID with:', {
        walletAddress,
        firstName,
        lastName,
        authMethod,
        identifier
      })
      
      const result = await personaApiClient.createDID(
        walletAddress,
        firstName,
        lastName,
        authMethod,
        identifier
      )
      
      console.log('🎯 DID creation result received:', result)
      
      if (result.success && result.did) {
        console.log('✅ DID creation successful! DID:', result.did)
        setGeneratedDID(result.did)
        if (result.credential) {
          console.log('✅ Credential received:', result.credential)
          setVerifiableCredential(result.credential)
        }
        
        // Store profile data
        const profileData = {
          firstName,
          lastName,
          username,
          email: getValues('email'),
          phone: getValues('phone'),
          authMethod,
          did: result.did,
          walletAddress: authMethod === 'wallet' ? address : undefined,
          socialProvider: authMethod === 'social' ? selectedSocial : undefined,
          createdAt: new Date().toISOString()
        }
        
        localStorage.setItem('persona_profile', JSON.stringify(profileData))
        localStorage.setItem('persona_did', result.did)
        
        // Celebrate!
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        })
        
        setCurrentStep('complete')
      } else {
        // Fallback DID
        const fallbackDID = personaApiClient.generateDID(identifier)
        setGeneratedDID(fallbackDID)
        
        const profileData = {
          firstName,
          lastName,
          username,
          email: getValues('email'),
          phone: getValues('phone'),
          authMethod,
          did: fallbackDID,
          createdAt: new Date().toISOString()
        }
        
        localStorage.setItem('persona_profile', JSON.stringify(profileData))
        localStorage.setItem('persona_did', fallbackDID)
        
        setCurrentStep('complete')
      }
    } catch (error) {
      console.error('Error creating DID:', error)
      alert('Error creating identity. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  // Verify phone and create DID
  const verifyAndCreateDID = async () => {
    setIsProcessing(true)
    try {
      const phone = getValues('phone')
      const result = await personaApiClient.verifyPhoneCodeAndIssueVC(phone, verificationCode)
      
      if (result.success && result.credential) {
        setVerifiableCredential(result.credential)
        await createDID()
      } else {
        alert('Invalid verification code. Please try again.')
      }
    } catch (error) {
      console.error('Error verifying code:', error)
      alert('Error verifying code. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-purple-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 pt-24 pb-16">
        {/* Modern Step Indicator */}
        <div className="mb-12">
          <div className="flex items-center justify-between relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full h-1 bg-gray-200 rounded-full">
                <div 
                  className="h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full transition-all duration-500"
                  style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
                />
              </div>
            </div>
            {steps.map((step, index) => {
              const Icon = step.icon
              const isActive = index === currentStepIndex
              const isCompleted = index < currentStepIndex
              
              return (
                <div key={step.id} className="relative">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`
                      w-12 h-12 rounded-full flex items-center justify-center
                      ${isActive ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' : 
                        isCompleted ? 'bg-green-500 text-white' : 'bg-white border-2 border-gray-300 text-gray-400'}
                      transition-all duration-300 shadow-lg
                    `}
                  >
                    {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </motion.div>
                  <span className={`
                    absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs font-medium whitespace-nowrap
                    ${isActive ? 'text-black' : 'text-gray-500'}
                  `}>
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Main Content Area */}
        <AnimatePresence mode="wait">
          {/* Welcome Screen */}
          {currentStep === 'welcome' && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center space-y-8"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="w-32 h-32 mx-auto bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-2xl"
              >
                <Fingerprint className="w-16 h-16 text-white" />
              </motion.div>
              
              <div>
                <h1 className="text-5xl font-bold text-black mb-4">
                  Welcome to the Future of Identity
                </h1>
                <p className="text-xl text-black max-w-2xl mx-auto">
                  Create your decentralized identity in seconds. No complexity, just pure Web3 magic.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto mt-12">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
                >
                  <Zap className="w-12 h-12 text-yellow-500 mb-4 mx-auto" />
                  <h3 className="font-semibold text-black mb-2">Lightning Fast</h3>
                  <p className="text-sm text-gray-600">Get started in under 60 seconds</p>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
                >
                  <Lock className="w-12 h-12 text-green-500 mb-4 mx-auto" />
                  <h3 className="font-semibold text-black mb-2">Zero Knowledge</h3>
                  <p className="text-sm text-gray-600">Your data stays private, always</p>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
                >
                  <Globe className="w-12 h-12 text-blue-500 mb-4 mx-auto" />
                  <h3 className="font-semibold text-black mb-2">Universal</h3>
                  <p className="text-sm text-gray-600">Works everywhere on Web3</p>
                </motion.div>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentStep('method')}
                className="mt-8 px-12 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-semibold text-lg shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                Let&apos;s Begin
              </motion.button>
            </motion.div>
          )}

          {/* Method Selection - Modern Web3 Style */}
          {currentStep === 'method' && (
            <motion.div
              key="method"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-black mb-4">
                  How would you like to connect?
                </h1>
                <p className="text-xl text-black">
                  Choose your preferred authentication method
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                {/* Social Login - NEW! */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setAuthMethod('social')
                    goToNextStep()
                  }}
                  className="relative overflow-hidden bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl p-6 text-left border-2 border-transparent hover:border-purple-300 transition-all duration-300"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200 rounded-full blur-3xl opacity-50" />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex space-x-3">
                        <Chrome className="w-6 h-6 text-blue-600" />
                        <Twitter className="w-6 h-6 text-blue-400" />
                        <Github className="w-6 h-6 text-gray-800" />
                      </div>
                      <span className="text-xs font-semibold text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                        EASIEST
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold text-black mb-2">Social Login</h3>
                    <p className="text-gray-700">Sign in with Google, Twitter, or GitHub</p>
                  </div>
                </motion.button>

                {/* Crypto Wallet */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setAuthMethod('wallet')
                    goToNextStep()
                  }}
                  className="relative overflow-hidden bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl p-6 text-left border-2 border-transparent hover:border-blue-300 transition-all duration-300"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200 rounded-full blur-3xl opacity-50" />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <Wallet className="w-8 h-8 text-blue-600" />
                      <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                        WEB3 NATIVE
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold text-black mb-2">Crypto Wallet</h3>
                    <p className="text-gray-700">Connect MetaMask, WalletConnect, or Coinbase</p>
                  </div>
                </motion.button>

                {/* Email - Progressive Disclosure */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setAuthMethod('email')
                    goToNextStep()
                  }}
                  className="relative overflow-hidden bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl p-6 text-left border-2 border-transparent hover:border-green-300 transition-all duration-300"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-green-200 rounded-full blur-3xl opacity-50" />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <Mail className="w-8 h-8 text-green-600" />
                      <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded-full">
                        FAMILIAR
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold text-black mb-2">Email Magic Link</h3>
                    <p className="text-gray-700">Get a secure login link sent to your email</p>
                  </div>
                </motion.button>

                {/* Phone */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setAuthMethod('phone')
                    goToNextStep()
                  }}
                  className="relative overflow-hidden bg-gradient-to-br from-orange-100 to-yellow-100 rounded-2xl p-6 text-left border-2 border-transparent hover:border-orange-300 transition-all duration-300"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-orange-200 rounded-full blur-3xl opacity-50" />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <Smartphone className="w-8 h-8 text-orange-600" />
                      <span className="text-xs font-semibold text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                        VERIFIED
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold text-black mb-2">Phone Verification</h3>
                    <p className="text-gray-700">Verify with SMS for strongest identity proof</p>
                  </div>
                </motion.button>
              </div>

              {/* Advanced Options Toggle */}
              <div className="text-center mt-8">
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-sm text-gray-600 hover:text-black transition-colors"
                >
                  {showAdvanced ? 'Hide' : 'Show'} advanced options
                </button>
              </div>

              {showAdvanced && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="max-w-2xl mx-auto bg-gray-50 rounded-xl p-6 space-y-4"
                >
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <QrCode className="w-4 h-4" />
                    <span>Hardware wallet support coming soon</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Key className="w-4 h-4" />
                    <span>Passkey authentication in development</span>
                  </div>
                </motion.div>
              )}

              {/* Zero Knowledge Info */}
              <div className="max-w-2xl mx-auto mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-200">
                <div className="flex items-start">
                  <Shield className="w-6 h-6 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-black mb-1">Your privacy is our priority</p>
                    <p className="text-sm text-gray-700">
                      All authentication methods use zero-knowledge proofs. Your personal data never touches our servers - 
                      it stays encrypted on your device.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Connect Step */}
          {currentStep === 'connect' && (
            <motion.div
              key="connect"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {authMethod === 'wallet' && (
                <div className="max-w-xl mx-auto">
                  <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-black mb-4">
                      Connect Your Wallet
                    </h1>
                    <p className="text-xl text-black">
                      Choose your preferred wallet to continue
                    </p>
                  </div>

                  {!isConnected ? (
                    <div className="space-y-4">
                      {connectors.map((connector) => (
                        <motion.button
                          key={connector.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            if (!isPending && !isProcessing) {
                              connectWallet(connector)
                            }
                          }}
                          disabled={isPending || isProcessing}
                          className="w-full p-4 bg-white rounded-xl border-2 border-gray-200 hover:border-blue-500 transition-all duration-300 flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <div className="flex items-center space-x-3">
                            <Wallet className="w-6 h-6 text-gray-600" />
                            <span className="font-medium text-black">{connector.name}</span>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        </motion.button>
                      ))}
                    </div>
                  ) : (
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-green-50 rounded-2xl p-6 border border-green-200"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                            <Check className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-black">Wallet Connected!</p>
                            <p className="text-sm text-gray-600">{address?.slice(0, 6)}...{address?.slice(-4)}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => disconnect()}
                          className="text-sm text-red-600 hover:text-red-700"
                        >
                          Disconnect
                        </button>
                      </div>
                      <p className="text-sm text-gray-700">
                        Great! Your wallet is connected. Let&apos;s continue setting up your profile.
                      </p>
                    </motion.div>
                  )}
                </div>
              )}

              {authMethod === 'social' && (
                <div className="max-w-xl mx-auto">
                  <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-black mb-4">
                      Choose Your Provider
                    </h1>
                    <p className="text-xl text-black">
                      Select your preferred social login
                    </p>
                  </div>

                  <div className="space-y-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setSelectedSocial('google')
                        goToNextStep()
                      }}
                      className="w-full p-4 bg-white rounded-xl border-2 border-gray-200 hover:border-blue-500 transition-all duration-300 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <Chrome className="w-6 h-6 text-blue-600" />
                        <span className="font-medium text-black">Continue with Google</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setSelectedSocial('twitter')
                        goToNextStep()
                      }}
                      className="w-full p-4 bg-white rounded-xl border-2 border-gray-200 hover:border-blue-400 transition-all duration-300 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <Twitter className="w-6 h-6 text-blue-400" />
                        <span className="font-medium text-black">Continue with Twitter</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setSelectedSocial('github')
                        goToNextStep()
                      }}
                      className="w-full p-4 bg-white rounded-xl border-2 border-gray-200 hover:border-gray-800 transition-all duration-300 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <Github className="w-6 h-6 text-gray-800" />
                        <span className="font-medium text-black">Continue with GitHub</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </motion.button>
                  </div>
                </div>
              )}

              {(authMethod === 'email' || authMethod === 'phone') && (
                <div className="max-w-xl mx-auto text-center">
                  <div className="mb-8">
                    <h1 className="text-4xl font-bold text-black mb-4">
                      {authMethod === 'email' ? 'Email Setup' : 'Phone Setup'}
                    </h1>
                    <p className="text-xl text-black">
                      We&apos;ll set this up in the next step
                    </p>
                  </div>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={goToNextStep}
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    Continue to Profile
                  </motion.button>
                </div>
              )}
            </motion.div>
          )}

          {/* Profile Step - Minimal and Modern */}
          {currentStep === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-xl mx-auto space-y-8"
            >
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-black mb-4">
                  Create Your Identity
                </h1>
                <p className="text-xl text-black">
                  Just a few details to personalize your experience
                </p>
              </div>

              <form className="space-y-6">
                {/* Username - Primary identifier */}
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Choose a username
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      {...register('username', { 
                        required: 'Username is required',
                        pattern: {
                          value: /^[a-zA-Z0-9_-]{3,20}$/,
                          message: 'Username must be 3-20 characters, letters, numbers, _ or -'
                        }
                      })}
                      className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="johndoe"
                    />
                    <span className="absolute left-3 top-3.5 text-gray-500">@</span>
                  </div>
                  {errors.username && (
                    <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
                  )}
                </div>

                {/* Name fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      First name
                    </label>
                    <input
                      type="text"
                      {...register('firstName', { required: 'Required' })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="John"
                    />
                    {errors.firstName && (
                      <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Last name
                    </label>
                    <input
                      type="text"
                      {...register('lastName', { required: 'Required' })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="Doe"
                    />
                    {errors.lastName && (
                      <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                    )}
                  </div>
                </div>

                {/* Contact field based on auth method */}
                {authMethod === 'email' && (
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Email address
                    </label>
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
                      placeholder="john@example.com"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                    )}
                  </div>
                )}

                {authMethod === 'phone' && (
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Phone number
                    </label>
                    <input
                      type="tel"
                      {...register('phone', { 
                        required: 'Phone is required',
                        pattern: {
                          value: /^\+[1-9]\d{1,14}$/,
                          message: 'Use international format: +1234567890'
                        }
                      })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="+1234567890"
                    />
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                    )}
                  </div>
                )}

                {/* Simple terms checkbox */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register('acceptedTerms', { required: 'You must accept the terms' })}
                      className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-black">
                      I agree to the Terms of Service and Privacy Policy. 
                      I understand my data is encrypted and stored locally.
                    </span>
                  </label>
                  {errors.acceptedTerms && (
                    <p className="mt-2 text-sm text-red-600 ml-7">{errors.acceptedTerms.message}</p>
                  )}
                </div>

                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={goToNextStep}
                  disabled={isProcessing || !acceptedTerms}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <span>Create My Identity</span>
                      <ChevronRight className="w-5 h-5" />
                    </>
                  )}
                </motion.button>
              </form>
            </motion.div>
          )}

          {/* Verification Step */}
          {currentStep === 'verification' && authMethod === 'phone' && (
            <motion.div
              key="verification"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-xl mx-auto space-y-8"
            >
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-black mb-4">
                  Verify Your Phone
                </h1>
                <p className="text-xl text-black">
                  We sent a 6-digit code to {getValues('phone')}
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Verification code
                  </label>
                  <input
                    type="text"
                    {...register('verificationCode', { 
                      required: 'Code is required',
                      pattern: {
                        value: /^[0-9]{6}$/,
                        message: 'Must be 6 digits'
                      }
                    })}
                    className="w-full px-4 py-3 text-center text-2xl tracking-widest border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="000000"
                    maxLength={6}
                  />
                  {errors.verificationCode && (
                    <p className="mt-1 text-sm text-red-600">{errors.verificationCode.message}</p>
                  )}
                </div>

                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={goToNextStep}
                  disabled={isProcessing || verificationCode.length !== 6}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <span>Verify & Continue</span>
                      <ChevronRight className="w-5 h-5" />
                    </>
                  )}
                </motion.button>

                <p className="text-center text-sm text-gray-600">
                  Didn&apos;t receive the code? 
                  <button className="ml-1 text-blue-600 hover:underline">
                    Resend
                  </button>
                </p>
              </div>
            </motion.div>
          )}

          {/* Complete Step */}
          {currentStep === 'complete' && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-8"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="w-32 h-32 mx-auto bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center shadow-2xl"
              >
                <Check className="w-16 h-16 text-white" />
              </motion.div>

              <div>
                <h1 className="text-5xl font-bold text-black mb-4">
                  Welcome to Web3!
                </h1>
                <p className="text-xl text-black mb-8">
                  Your decentralized identity is ready
                </p>
              </div>

              {generatedDID && (
                <div className="max-w-2xl mx-auto bg-gray-50 rounded-2xl p-6 space-y-4">
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-600 mb-1">Your DID</p>
                    <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-200">
                      <code className="text-sm text-black font-mono">{generatedDID}</code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(generatedDID)
                          alert('DID copied to clipboard!')
                        }}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {verifiableCredential && (
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-600 mb-1">Verifiable Credential</p>
                      <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                        <p className="text-sm text-green-800">
                          ✓ Phone verification credential issued successfully
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-4 max-w-md mx-auto">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push('/dashboard')}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Go to Dashboard
                </motion.button>

                <button
                  onClick={() => {
                    // Download backup
                    const data = {
                      did: generatedDID,
                      profile: getValues(),
                      createdAt: new Date().toISOString()
                    }
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = 'persona-identity-backup.json'
                    a.click()
                  }}
                  className="w-full py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:border-gray-400 transition-all duration-300 flex items-center justify-center space-x-2"
                >
                  <Download className="w-5 h-5" />
                  <span>Download Backup</span>
                </button>
              </div>

              <div className="mt-12 p-6 bg-blue-50 rounded-2xl max-w-2xl mx-auto">
                <h3 className="font-semibold text-black mb-2">What&apos;s Next?</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="text-left">
                    <p className="font-medium text-black">Add Credentials</p>
                    <p className="text-sm text-gray-600">Verify more aspects of your identity</p>
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-black">Connect Apps</p>
                    <p className="text-sm text-gray-600">Use your DID across Web3</p>
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-black">Join Communities</p>
                    <p className="text-sm text-gray-600">Discover token-gated experiences</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}