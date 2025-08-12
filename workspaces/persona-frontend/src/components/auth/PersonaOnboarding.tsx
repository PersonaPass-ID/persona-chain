/**
 * PersonaPass Onboarding Component - PRODUCTION READY
 * Complete onboarding flow: DID creation + TOTP setup + PersonaChain integration
 */

import React, { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Alert, AlertDescription } from '../ui/alert'
import { Progress } from '../ui/progress'
import { Separator } from '../ui/separator'
import { personaChainService, generatePersonaWallet } from '../../lib/personachain-service'
import { GoogleAuthenticatorSetup } from './GoogleAuthenticatorSetup'

interface PersonaOnboardingProps {
  onComplete: (userData: {
    did: string
    walletAddress: string
    mnemonic: string
    backupCodes: string[]
  }) => void
}

interface WalletData {
  address: string
  mnemonic: string
  publicKey: string
}

export function PersonaOnboarding({ onComplete }: PersonaOnboardingProps) {
  const [step, setStep] = useState<'welcome' | 'wallet' | 'did' | 'totp' | 'complete'>('welcome')
  const [walletData, setWalletData] = useState<WalletData | null>(null)
  const [didData, setDidData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [networkStatus, setNetworkStatus] = useState<any>(null)

  useEffect(() => {
    checkNetworkStatus()
  }, [])

  const checkNetworkStatus = async () => {
    try {
      const status = await personaChainService.getNetworkStatus()
      setNetworkStatus(status)
      console.log('📡 PersonaChain Status:', status)
    } catch (err) {
      console.error('❌ Failed to check network status:', err)
    }
  }

  /**
   * Step 1: Generate PersonaChain Wallet
   */
  const generateWallet = async () => {
    setIsLoading(true)
    setError('')

    try {
      console.log('👛 Generating PersonaChain wallet...')
      
      const wallet = await generatePersonaWallet()
      
      setWalletData(wallet)
      setStep('did')
      
      console.log('✅ Wallet generated:', wallet.address)
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to generate wallet'
      setError(errorMsg)
      console.error('❌ Wallet generation failed:', err)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Step 2: Create DID on PersonaChain
   */
  const createDID = async () => {
    if (!walletData) {
      setError('Wallet data not available')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      console.log('🆔 Creating DID on PersonaChain...')
      
      // Create DID on PersonaChain blockchain
      const didResult = await personaChainService.createDID(
        walletData.publicKey,
        walletData.mnemonic
      )
      
      setDidData(didResult)
      setStep('totp')
      
      console.log('✅ DID created:', didResult.did)
      console.log('📄 Transaction Hash:', didResult.txHash)
      console.log('🧱 Block Height:', didResult.blockHeight)
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create DID'
      setError(errorMsg)
      console.error('❌ DID creation failed:', err)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Step 3: Handle TOTP Setup Completion
   */
  const handleTOTPComplete = (codes: string[]) => {
    setBackupCodes(codes)
    setStep('complete')
  }

  /**
   * Complete onboarding
   */
  const completeOnboarding = () => {
    if (!walletData || !didData) {
      setError('Missing required data')
      return
    }

    onComplete({
      did: didData.did,
      walletAddress: walletData.address,
      mnemonic: walletData.mnemonic,
      backupCodes: backupCodes
    })
  }

  const progressValue = {
    welcome: 0,
    wallet: 25,
    did: 50,
    totp: 75,
    complete: 100
  }[step]

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-center mb-8">
        🚀 Welcome to PersonaPass
      </h1>

      <Progress value={progressValue} className="mb-8" />

      {/* Network Status */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="font-medium">PersonaChain Network Status:</span>
          <span className={`font-semibold ${networkStatus?.online ? 'text-green-600' : 'text-red-600'}`}>
            {networkStatus?.online ? '🟢 Online' : '🔴 Offline'}
          </span>
        </div>
        {networkStatus?.blockHeight && (
          <div className="text-sm text-gray-500 mt-1">
            Latest Block: {networkStatus.blockHeight.toLocaleString()} | Chain ID: {networkStatus.chainId}
          </div>
        )}
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Welcome Step */}
      {step === 'welcome' && (
        <div className="text-center">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Create Your Digital Identity</h2>
            <p className="text-gray-600 mb-6">
              PersonaPass creates a decentralized identity (DID) on PersonaChain blockchain, 
              secured with Google Authenticator for maximum security.
            </p>
            
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl mb-2">🆔</div>
                <h3 className="font-semibold mb-2">Decentralized Identity</h3>
                <p className="text-sm text-gray-600">
                  Your identity is stored on PersonaChain blockchain, giving you full control
                </p>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-2xl mb-2">🔐</div>
                <h3 className="font-semibold mb-2">Google Authenticator</h3>
                <p className="text-sm text-gray-600">
                  Secure 2FA authentication required for all logins
                </p>
              </div>
              
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl mb-2">🌐</div>
                <h3 className="font-semibold mb-2">Cross-Platform</h3>
                <p className="text-sm text-gray-600">
                  Use your identity across all PersonaPass services
                </p>
              </div>
            </div>
          </div>

          <Button 
            onClick={() => setStep('wallet')}
            className="px-8 py-3 text-lg"
            disabled={!networkStatus?.online}
          >
            {networkStatus?.online ? 'Start Setup →' : 'Waiting for PersonaChain...'}
          </Button>
        </div>
      )}

      {/* Wallet Generation Step */}
      {step === 'wallet' && (
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Step 1: Generate Wallet</h2>
          <p className="text-gray-600 mb-6">
            First, we'll create a secure PersonaChain wallet for your digital identity.
          </p>

          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mb-6">
            <p className="text-sm text-yellow-800 font-semibold">🔐 Security Notice</p>
            <p className="text-sm text-yellow-700 mt-1">
              Your wallet will be generated with a 24-word recovery phrase. 
              Keep this phrase secure - it's the only way to recover your identity.
            </p>
          </div>

          <Button 
            onClick={generateWallet}
            disabled={isLoading}
            className="px-8 py-3"
          >
            {isLoading ? 'Generating Secure Wallet...' : 'Generate Wallet'}
          </Button>
        </div>
      )}

      {/* DID Creation Step */}
      {step === 'did' && walletData && (
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Step 2: Create Digital Identity</h2>
          <p className="text-gray-600 mb-6">
            Now we'll create your DID (Decentralized Identifier) on PersonaChain blockchain.
          </p>

          <div className="bg-white p-4 rounded-lg border mb-6">
            <h3 className="font-semibold mb-2">Your Wallet Address</h3>
            <p className="font-mono text-sm bg-gray-100 p-2 rounded break-all">
              {walletData.address}
            </p>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
            <p className="text-sm text-blue-800 font-semibold">⛓️ Blockchain Transaction</p>
            <p className="text-sm text-blue-700 mt-1">
              This will create a transaction on PersonaChain to register your DID.
              Transaction fees are paid automatically.
            </p>
          </div>

          <Button 
            onClick={createDID}
            disabled={isLoading}
            className="px-8 py-3"
          >
            {isLoading ? 'Creating DID on PersonaChain...' : 'Create Digital Identity'}
          </Button>
        </div>
      )}

      {/* TOTP Setup Step */}
      {step === 'totp' && didData && (
        <div>
          <h2 className="text-2xl font-semibold text-center mb-4">Step 3: Security Setup</h2>
          
          <div className="bg-white p-4 rounded-lg border mb-6">
            <h3 className="font-semibold mb-2">✅ DID Created Successfully</h3>
            <div className="text-sm space-y-1">
              <p><strong>DID:</strong> <span className="font-mono">{didData.did}</span></p>
              <p><strong>Transaction:</strong> <span className="font-mono">{didData.txHash}</span></p>
              <p><strong>Block Height:</strong> {didData.blockHeight}</p>
            </div>
          </div>

          <GoogleAuthenticatorSetup
            did={didData.did}
            onSetupComplete={handleTOTPComplete}
            onError={setError}
          />
        </div>
      )}

      {/* Completion Step */}
      {step === 'complete' && didData && walletData && (
        <div className="text-center">
          <div className="text-green-600 text-6xl mb-6">🎉</div>
          <h2 className="text-2xl font-semibold mb-4">PersonaPass Setup Complete!</h2>
          
          <div className="bg-green-50 p-6 rounded-lg border border-green-200 mb-6">
            <h3 className="font-semibold text-green-800 mb-4">Your PersonaPass Identity</h3>
            <div className="text-left space-y-2 text-sm">
              <p><strong>DID:</strong> <span className="font-mono">{didData.did}</span></p>
              <p><strong>Wallet:</strong> <span className="font-mono">{walletData.address}</span></p>
              <p><strong>Security:</strong> Google Authenticator Enabled ✅</p>
              <p><strong>Blockchain:</strong> PersonaChain Block #{didData.blockHeight}</p>
            </div>
          </div>

          {backupCodes.length > 0 && (
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mb-6">
              <p className="text-sm font-semibold text-yellow-800 mb-2">
                🔑 Important: Save Your Recovery Information
              </p>
              <p className="text-xs text-yellow-700 mb-3">
                Store these securely - they're the only way to recover your account
              </p>
              <Button
                onClick={() => {
                  const data = {
                    did: didData.did,
                    wallet: walletData.address,
                    mnemonic: walletData.mnemonic,
                    backupCodes: backupCodes
                  }
                  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `personapass-recovery-${Date.now()}.json`
                  a.click()
                }}
                variant="outline"
                className="mb-4"
              >
                📥 Download Recovery File
              </Button>
            </div>
          )}

          <Button 
            onClick={completeOnboarding}
            className="px-8 py-3 text-lg"
          >
            Enter PersonaPass →
          </Button>
        </div>
      )}
    </div>
  )
}