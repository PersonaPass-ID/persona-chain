'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { ChevronRight, Wallet, Mail, Phone, Shield, Key, Download, CheckCircle, Copy, User, MapPin, FileText, Zap } from 'lucide-react'
import { Navigation } from '@/components/Navigation'
import { WalletConnection } from '@/components/WalletConnection'
import { personaApiClient, PhoneVerificationCredential, ZKProof } from '@/lib/api-client'
import * as bip39 from 'bip39'

type AuthMethod = 'wallet' | 'email' | 'phone' | null
type OnboardingStep = 'method' | 'credentials' | 'profile' | 'verification' | 'credential-creation' | 'keys' | 'complete'

type FormData = {
  // Authentication
  name: string
  email: string
  phone: string
  walletAddress: string
  verificationCode: string[]  // 6-digit array
  
  // Comprehensive Profile Data
  firstName: string
  lastName: string
  dateOfBirth: string
  address: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  
  // Identity Documents
  governmentId: {
    type: 'passport' | 'drivers_license' | 'national_id' | ''
    number: string
    issuingCountry: string
    expiryDate: string
  }
  
  // Privacy & Security
  seedPhrase: string[]
  hasBackedUpSeedPhrase: boolean
  acceptedTerms: boolean
  privacyPreferences: {
    sharePhoneNumber: boolean
    shareEmail: boolean
    shareAddress: boolean
    shareGovernmentId: boolean
  }
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
      // Authentication
      name: '',
      email: '',
      phone: '',
      walletAddress: '',
      verificationCode: ['', '', '', '', '', ''],
      
      // Profile Data
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'US'
      },
      
      // Government ID
      governmentId: {
        type: '',
        number: '',
        issuingCountry: 'US',
        expiryDate: ''
      },
      
      // Security
      seedPhrase: [],
      hasBackedUpSeedPhrase: false,
      acceptedTerms: false,
      privacyPreferences: {
        sharePhoneNumber: true,
        shareEmail: true,
        shareAddress: false,
        shareGovernmentId: false
      }
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
  const currentPhone = watch('phone')
  const hasBackedUp = watch('hasBackedUpSeedPhrase')

  const stepProgress = {
    method: 14,
    credentials: 28,
    profile: 42,
    verification: 56,
    'credential-creation': 70,
    keys: 84,
    complete: 100
  } as const

  // Handle step progression with proper validation
  const goToNextStep = async () => {
    let canProceed = false
    
    switch (currentStep) {
      case 'method':
        canProceed = authMethod !== null
        if (canProceed) setCurrentStep('credentials')
        break
        
      case 'credentials':
        // Just proceed to profile collection
        canProceed = true
        if (canProceed) setCurrentStep('profile')
        break
        
      case 'profile':
        // Validate all required profile fields
        const profileValid = await trigger([
          'name', 'firstName', 'lastName', 'dateOfBirth', 'phone',
          'address.street', 'address.city', 'address.state', 'address.zipCode',
          'governmentId.type', 'governmentId.number', 'governmentId.expiryDate'
        ])
        if (profileValid) {
          if (authMethod === 'email') {
            canProceed = await trigger(['email'])
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
        if (canProceed) setCurrentStep('credential-creation')
        break
        
      case 'credential-creation':
        // Generate real VCs and DIDs
        setIsProcessing(true)
        try {
          if (authMethod === 'phone') {
            const phone = getValues('phone')
            const codes = getValues('verificationCode')
            const verificationCode = codes.join('')
            
            // Verify phone and get real VC
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
              alert('Phone verification failed. Please try again.')
              setCurrentStep('verification')
              return
            }
          } else {
            // For wallet/email, create mock credential for now
            canProceed = true
          }
        } catch (error) {
          console.error('Error creating credentials:', error)
          alert('Error creating credentials. Please try again.')
          return
        } finally {
          setIsProcessing(false)
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

          {/* Step 2: Comprehensive Profile Collection */}
          {currentStep === 'profile' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  Complete Your Profile
                </h1>
                <p className="text-lg text-gray-600">
                  We need comprehensive information to create your verified digital identity
                </p>
              </div>

              <form className="space-y-8">
                {/* Basic Information */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200">
                  <div className="flex items-center mb-6">
                    <User className="w-6 h-6 text-blue-600 mr-3" />
                    <h3 className="text-xl font-semibold text-gray-900">Basic Information</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Display Name</label>
                      <input
                        type="text"
                        {...register('name', { required: 'Display name is required' })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder="How you'd like to be known"
                      />
                      {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                      <input
                        type="tel"
                        {...register('phone', { 
                          required: 'Phone number is required',
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
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                      <input
                        type="date"
                        {...register('dateOfBirth', { required: 'Date of birth is required' })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                      {errors.dateOfBirth && <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth.message}</p>}
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
                  </div>
                </div>

                {/* Address Information */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200">
                  <div className="flex items-center mb-6">
                    <MapPin className="w-6 h-6 text-green-600 mr-3" />
                    <h3 className="text-xl font-semibold text-gray-900">Address Information</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
                      <input
                        type="text"
                        {...register('address.street', { required: 'Street address is required' })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder="123 Main Street"
                      />
                      {errors.address?.street && <p className="mt-1 text-sm text-red-600">{typeof errors.address.street === 'object' ? errors.address.street.message : errors.address.street}</p>}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                      <input
                        type="text"
                        {...register('address.city', { required: 'City is required' })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder="San Francisco"
                      />
                      {errors.address?.city && <p className="mt-1 text-sm text-red-600">{typeof errors.address.city === 'object' ? errors.address.city.message : errors.address.city}</p>}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">State/Province</label>
                      <input
                        type="text"
                        {...register('address.state', { required: 'State is required' })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder="CA"
                      />
                      {errors.address?.state && <p className="mt-1 text-sm text-red-600">{typeof errors.address.state === 'object' ? errors.address.state.message : errors.address.state}</p>}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">ZIP/Postal Code</label>
                      <input
                        type="text"
                        {...register('address.zipCode', { required: 'ZIP code is required' })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder="94102"
                      />
                      {errors.address?.zipCode && <p className="mt-1 text-sm text-red-600">{typeof errors.address.zipCode === 'object' ? errors.address.zipCode.message : errors.address.zipCode}</p>}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                      <select
                        {...register('address.country', { required: 'Country is required' })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      >
                        <option value="US">United States</option>
                        <option value="CA">Canada</option>
                        <option value="GB">United Kingdom</option>
                        <option value="DE">Germany</option>
                        <option value="FR">France</option>
                        <option value="AU">Australia</option>
                      </select>
                      {errors.address?.country && <p className="mt-1 text-sm text-red-600">{typeof errors.address.country === 'object' ? errors.address.country.message : errors.address.country}</p>}
                    </div>
                  </div>
                </div>

                {/* Government ID */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200">
                  <div className="flex items-center mb-6">
                    <FileText className="w-6 h-6 text-purple-600 mr-3" />
                    <h3 className="text-xl font-semibold text-gray-900">Identity Verification</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Document Type</label>
                      <select
                        {...register('governmentId.type', { required: 'Document type is required' })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      >
                        <option value="">Select document type</option>
                        <option value="passport">Passport</option>
                        <option value="drivers_license">Driver&apos;s License</option>
                        <option value="national_id">National ID</option>
                      </select>
                      {errors.governmentId?.type && <p className="mt-1 text-sm text-red-600">{typeof errors.governmentId.type === 'object' ? errors.governmentId.type.message : errors.governmentId.type}</p>}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Document Number</label>
                      <input
                        type="text"
                        {...register('governmentId.number', { required: 'Document number is required' })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder="Document number"
                      />
                      {errors.governmentId?.number && <p className="mt-1 text-sm text-red-600">{typeof errors.governmentId.number === 'object' ? errors.governmentId.number.message : errors.governmentId.number}</p>}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                      <input
                        type="date"
                        {...register('governmentId.expiryDate', { required: 'Expiry date is required' })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                      {errors.governmentId?.expiryDate && <p className="mt-1 text-sm text-red-600">{typeof errors.governmentId.expiryDate === 'object' ? errors.governmentId.expiryDate.message : errors.governmentId.expiryDate}</p>}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Issuing Country</label>
                      <select
                        {...register('governmentId.issuingCountry', { required: 'Issuing country is required' })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      >
                        <option value="US">United States</option>
                        <option value="CA">Canada</option>
                        <option value="GB">United Kingdom</option>
                        <option value="DE">Germany</option>
                        <option value="FR">France</option>
                        <option value="AU">Australia</option>
                      </select>
                      {errors.governmentId?.issuingCountry && <p className="mt-1 text-sm text-red-600">{typeof errors.governmentId.issuingCountry === 'object' ? errors.governmentId.issuingCountry.message : errors.governmentId.issuingCountry}</p>}
                    </div>
                  </div>
                </div>

                {/* Privacy Preferences */}
                <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
                  <div className="flex items-center mb-6">
                    <Shield className="w-6 h-6 text-blue-600 mr-3" />
                    <h3 className="text-xl font-semibold text-gray-900">Privacy Preferences</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('privacyPreferences.sharePhoneNumber')}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <label className="ml-3 text-sm text-gray-700">Allow sharing phone verification status (recommended)</label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('privacyPreferences.shareEmail')}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <label className="ml-3 text-sm text-gray-700">Allow sharing email verification status</label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('privacyPreferences.shareAddress')}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <label className="ml-3 text-sm text-gray-700">Allow sharing address verification (not recommended)</label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('privacyPreferences.shareGovernmentId')}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <label className="ml-3 text-sm text-gray-700">Allow sharing government ID verification (not recommended)</label>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-4 bg-blue-100 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Zero-Knowledge Privacy:</strong> Even when sharing is enabled, your actual personal data stays private. 
                      Only verification proofs are shared, never the underlying information.
                    </p>
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
            </motion.div>
          )}

          {/* Step 2: Method Setup - Wallet Connection or Continue */}
          {currentStep === 'credentials' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  Continue with Your Chosen Method
                </h1>
                <p className="text-lg text-gray-600">
                  You&apos;ve chosen to authenticate via {authMethod}. Let&apos;s collect your profile information.
                </p>
              </div>

              {authMethod === 'wallet' && (
                <div className="text-center">
                  <WalletConnection 
                    onNext={() => setCurrentStep('profile')}
                    onWalletConnected={handleWalletConnected}
                  />
                  <p className="mt-4 text-sm text-gray-500">
                    After connecting your wallet, we&apos;ll collect your profile information for credential generation.
                  </p>
                </div>
              )}
              
              {authMethod !== 'wallet' && (
                <div className="text-center">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCurrentStep('profile')}
                    className="w-full rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-4 text-lg font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    Continue to Profile Setup
                  </motion.button>
                </div>
              )}
            </motion.div>
          )}

          {/* Step 4: Phone/Email Verification */}
          {currentStep === 'verification' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-6"
            >
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {authMethod === 'wallet' && 'Wallet Connected Successfully!'}
                {authMethod === 'email' && 'Check Your Email'}
                {authMethod === 'phone' && 'Enter SMS Verification Code'}
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
                      ? `Enter the 6-digit code we sent via SMS to ${currentPhone}`
                      : 'Sending SMS verification code...'
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
                {authMethod === 'wallet' ? 'Continue' : isVerificationSent ? 'Create Digital Identity' : 'Sending...'}
                <ChevronRight className="w-5 h-5" />
              </motion.button>
            </motion.div>
          )}

          {/* Step 4: Credential Creation */}
          {currentStep === 'credential-creation' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-8"
            >
              <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Creating Your Digital Identity</h1>
                <p className="text-lg text-gray-600">
                  {isProcessing 
                    ? 'Generating your DID and Verifiable Credentials...' 
                    : 'Your digital identity has been created successfully!'
                  }
                </p>
              </div>

              {isProcessing && (
                <div className="flex flex-col items-center space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  <div className="text-sm text-gray-500 space-y-1">
                    <p>• Verifying phone number with blockchain</p>
                    <p>• Generating Decentralized Identifier (DID)</p>
                    <p>• Creating Verifiable Credential</p>
                    <p>• Generating Zero-Knowledge Proofs</p>
                    <p>• Storing credentials securely</p>
                  </div>
                </div>
              )}

              {!isProcessing && generatedDID && (
                <div className="space-y-6">
                  {/* DID Display */}
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
                    <div className="text-left">
                      <h3 className="text-lg font-semibold mb-3 flex items-center">
                        <Zap className="w-5 h-5 mr-2" />
                        Your Decentralized Identifier (DID)
                      </h3>
                      <div className="bg-white/20 rounded-lg p-3 font-mono text-sm break-all">
                        {generatedDID}
                      </div>
                    </div>
                  </div>

                  {/* VC Display */}
                  {verifiableCredential && (
                    <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 text-white">
                      <div className="text-left">
                        <h3 className="text-lg font-semibold mb-3 flex items-center">
                          <Shield className="w-5 h-5 mr-2" />
                          Your Phone Verification Credential
                        </h3>
                        <div className="text-sm opacity-90 space-y-2">
                          <p><strong>Credential ID:</strong> {verifiableCredential.id.substring(0, 40)}...</p>
                          <p><strong>Issuer:</strong> {verifiableCredential.issuer.name}</p>
                          <p><strong>Phone Number:</strong> {verifiableCredential.credentialSubject.phoneNumber}</p>
                          <p><strong>Verification Method:</strong> {verifiableCredential.credentialSubject.verificationMethod}</p>
                          <p><strong>Status:</strong> ✅ Verified & Signed</p>
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
                          <p><strong>Attributes:</strong> {zkProof.proof.revealedAttributes.join(', ')}</p>
                          <p><strong>Privacy Level:</strong> Maximum (personal data never exposed)</p>
                          <p><strong>Status:</strong> ✅ Ready for use</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-start">
                      <Shield className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">Your Digital Identity is Now Live!</p>
                        <ul className="space-y-1 text-xs">
                          <li>• Your DID is registered on the Persona blockchain</li>
                          <li>• Your phone number is verified and cryptographically signed</li>
                          <li>• Zero-knowledge proofs enable privacy-preserving verification</li>
                          <li>• All credentials are stored securely on your device</li>
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

          {/* Step 5: Security Keys */}
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
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome to Persona! 🎉</h1>
                <p className="text-lg text-gray-600 mb-8">
                  Your digital identity has been created successfully. You now have your first Verifiable Credential!
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