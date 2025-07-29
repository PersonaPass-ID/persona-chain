'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { ChevronRight, Wallet, Mail, Phone, Shield, Key, Download } from 'lucide-react'
import { Navigation } from '@/components/Navigation'
import { WalletConnection } from '@/components/WalletConnection'

type AuthMethod = 'wallet' | 'email' | 'phone' | null
type OnboardingStep = 'method' | 'credentials' | 'verification' | 'keys' | 'complete'

export default function GetStartedPage() {
  const [authMethod, setAuthMethod] = useState<AuthMethod>(null)
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('method')
  const [userData, setUserData] = useState({
    email: '',
    phone: '',
    walletAddress: '',
    name: '',
    verificationCode: ''
  })

  const stepProgress = {
    method: 20,
    credentials: 40,
    verification: 60,
    keys: 80,
    complete: 100
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
                  onNext={() => setCurrentStep('verification')}
                  onWalletConnected={(address) => setUserData({...userData, walletAddress: address})}
                />
              )}

              {authMethod === 'email' && (
                <EmailSignupComponent 
                  onNext={() => setCurrentStep('verification')}
                  userData={userData}
                  setUserData={setUserData}
                />
              )}

              {authMethod === 'phone' && (
                <PhoneSignupComponent 
                  onNext={() => setCurrentStep('verification')}
                  userData={userData}
                  setUserData={setUserData}
                />
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
              
              {authMethod !== 'wallet' && (
                <>
                  <p className="text-lg text-gray-600 mb-8">
                    Enter the 6-digit code we sent to {userData.email || userData.phone}
                  </p>
                  
                  <div className="flex justify-center space-x-3 mb-8">
                    {[...Array(6)].map((_, index) => (
                      <input
                        key={index}
                        type="text"
                        maxLength={1}
                        className="w-12 h-12 text-center text-xl font-bold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                        onChange={(e) => {
                          if (e.target.value && index < 5) {
                            const nextInput = e.target.nextElementSibling as HTMLInputElement
                            nextInput?.focus()
                          }
                        }}
                      />
                    ))}
                  </div>
                </>
              )}

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentStep('keys')}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-4 text-lg font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {authMethod === 'wallet' ? 'Continue' : 'Verify Code'}
                <ChevronRight className="w-5 h-5" />
              </motion.button>
            </motion.div>
          )}

          {/* Step 4: Security Keys */}
          {currentStep === 'keys' && (
            <SecurityKeysComponent 
              authMethod={authMethod}
              onNext={() => setCurrentStep('complete')}
            />
          )}

          {/* Step 5: Complete */}
          {currentStep === 'complete' && (
            <CompletionComponent authMethod={authMethod} />
          )}

        </div>
      </div>
    </div>
  )
}


// Email Signup Component
function EmailSignupComponent({ onNext, userData, setUserData }: {
  onNext: () => void
  userData: any
  setUserData: (data: any) => void
}) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
        <input
          type="text"
          value={userData.name}
          onChange={(e) => setUserData({...userData, name: e.target.value})}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          placeholder="Enter your full name"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
        <input
          type="email"
          value={userData.email}
          onChange={(e) => setUserData({...userData, email: e.target.value})}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          placeholder="Enter your email address"
        />
      </div>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onNext}
        disabled={!userData.email || !userData.name}
        className="w-full rounded-full bg-gradient-to-r from-green-600 to-emerald-600 px-8 py-4 text-lg font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Send Verification Code
      </motion.button>
    </div>
  )
}

// Phone Signup Component
function PhoneSignupComponent({ onNext, userData, setUserData }: {
  onNext: () => void
  userData: any
  setUserData: (data: any) => void
}) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
        <input
          type="text"
          value={userData.name}
          onChange={(e) => setUserData({...userData, name: e.target.value})}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          placeholder="Enter your full name"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
        <input
          type="tel"
          value={userData.phone}
          onChange={(e) => setUserData({...userData, phone: e.target.value})}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          placeholder="+1 (555) 123-4567"
        />
      </div>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onNext}
        disabled={!userData.phone || !userData.name}
        className="w-full rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-4 text-lg font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Send SMS Code
      </motion.button>
    </div>
  )
}

// Security Keys Component
function SecurityKeysComponent({ authMethod, onNext }: { 
  authMethod: AuthMethod
  onNext: () => void 
}) {
  const [seedPhrase] = useState(() => {
    // Generate a mock 12-word seed phrase (in production, this would be cryptographically generated)
    const words = [
      'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract',
      'absurd', 'abuse', 'access', 'accident', 'account', 'accuse', 'achieve', 'acid'
    ]
    return Array.from({ length: 12 }, () => words[Math.floor(Math.random() * words.length)])
  })

  const [hasDownloaded, setHasDownloaded] = useState(false)
  const [hasVerified, setHasVerified] = useState(false)

  return (
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

      {authMethod !== 'wallet' && (
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
                  <span className="text-white font-mono">{word}</span>
                </div>
              ))}
            </div>
            
            <div className="space-y-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setHasDownloaded(true)}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                Download Recovery File
              </motion.button>
              
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="saved"
                  checked={hasVerified}
                  onChange={(e) => setHasVerified(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="saved" className="text-sm text-gray-300">
                  I have safely stored my recovery phrase
                </label>
              </div>
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
                </ul>
              </div>
            </div>
          </div>
        </>
      )}

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onNext}
        disabled={authMethod !== 'wallet' && (!hasDownloaded || !hasVerified)}
        className="w-full rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-4 text-lg font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Continue to Dashboard
      </motion.button>
    </motion.div>
  )
}

// Completion Component  
function CompletionComponent({ authMethod }: { authMethod: AuthMethod }) {
  return (
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
  )
}