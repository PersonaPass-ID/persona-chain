'use client'

import { useState, useEffect } from 'react'
import { SocialRecoveryManager, Guardian, SocialRecoveryConfig } from '@/lib/social-recovery'

interface SocialRecoverySetupProps {
  userDID: string
  userWalletAddress: string
  onComplete?: () => void
}

export default function SocialRecoverySetup({ userDID, userWalletAddress, onComplete }: SocialRecoverySetupProps) {
  const [socialRecovery] = useState(() => new SocialRecoveryManager(userDID, userWalletAddress))
  const [config, setConfig] = useState<SocialRecoveryConfig | null>(null)
  const [guardians, setGuardians] = useState<Omit<Guardian, 'id' | 'encryptedKeyShare' | 'addedAt' | 'status'>[]>([])
  const [threshold, setThreshold] = useState(2)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'setup' | 'guardians' | 'confirm' | 'complete'>('setup')

  // Load existing configuration
  useEffect(() => {
    async function loadConfig() {
      const existingConfig = await socialRecovery.loadSocialRecoveryConfig()
      if (existingConfig) {
        setConfig(existingConfig)
        setStep('complete')
      }
    }
    loadConfig()
  }, [socialRecovery])

  // Add guardian form
  const [newGuardian, setNewGuardian] = useState({
    walletAddress: '',
    publicKey: '',
    name: '',
    relationship: 'friend' as 'friend' | 'family' | 'colleague' | 'other'
  })

  const addGuardian = () => {
    if (!newGuardian.walletAddress || !newGuardian.name) {
      setError('Please fill in all required fields')
      return
    }

    if (guardians.some(g => g.walletAddress === newGuardian.walletAddress)) {
      setError('Guardian wallet address already added')
      return
    }

    setGuardians([...guardians, {
      ...newGuardian,
      publicKey: newGuardian.publicKey || newGuardian.walletAddress // Simplified for demo
    }])

    setNewGuardian({
      walletAddress: '',
      publicKey: '',
      name: '',
      relationship: 'friend'
    })
    setError(null)
  }

  const removeGuardian = (walletAddress: string) => {
    setGuardians(guardians.filter(g => g.walletAddress !== walletAddress))
  }

  const setupSocialRecovery = async () => {
    if (guardians.length < 2) {
      setError('You need at least 2 guardians for social recovery')
      return
    }

    if (threshold > guardians.length) {
      setError('Threshold cannot be higher than number of guardians')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const newConfig = await socialRecovery.initializeSocialRecovery(guardians, threshold)
      setConfig(newConfig)
      setStep('complete')
      onComplete?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to setup social recovery')
    } finally {
      setLoading(false)
    }
  }

  // Render setup explanation
  const renderSetup = () => (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="text-center mb-6">
        <div className="text-4xl mb-4">👥</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Social Recovery Setup</h2>
        <p className="text-gray-600">Add trusted friends and family who can help you recover your account</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-blue-900 mb-2">How Social Recovery Works</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Your recovery key is split into multiple pieces using cryptography</li>
          <li>• Each guardian gets one encrypted piece of your recovery key</li>
          <li>• If you lose access, guardians can help you recover your account</li>
          <li>• Multiple guardians must agree (e.g., 2 out of 3) for security</li>
          <li>• 48-hour time delay prevents immediate attacks</li>
        </ul>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <div className="text-yellow-500 mr-2">⚠️</div>
          <div>
            <p className="text-sm font-semibold text-yellow-800">Choose Guardians Carefully</p>
            <p className="text-sm text-yellow-700">
              Select people you trust completely. They will be able to help recover your account if you lose access.
            </p>
          </div>
        </div>
      </div>

      <button 
        onClick={() => setStep('guardians')}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700"
      >
        Add Guardians
      </button>
    </div>
  )

  // Render guardian management
  const renderGuardians = () => (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Add Recovery Guardians</h2>
        <p className="text-gray-600">Add trusted people who can help you recover your account</p>
      </div>

      {/* Add Guardian Form */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Add New Guardian</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Guardian Name *
            </label>
            <input
              type="text"
              value={newGuardian.name}
              onChange={(e) => setNewGuardian({ ...newGuardian, name: e.target.value })}
              placeholder="Enter guardian's name"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Wallet Address *
            </label>
            <input
              type="text"
              value={newGuardian.walletAddress}
              onChange={(e) => setNewGuardian({ ...newGuardian, walletAddress: e.target.value })}
              placeholder="persona1xyz... or 0x123abc..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Relationship
            </label>
            <select
              value={newGuardian.relationship}
              onChange={(e) => setNewGuardian({ ...newGuardian, relationship: e.target.value as any })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="friend">Friend</option>
              <option value="family">Family</option>
              <option value="colleague">Colleague</option>
              <option value="other">Other</option>
            </select>
          </div>

          <button
            onClick={addGuardian}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700"
          >
            Add Guardian
          </button>
        </div>
      </div>

      {/* Current Guardians */}
      {guardians.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Current Guardians ({guardians.length})</h3>
          <div className="space-y-3">
            {guardians.map((guardian, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">{guardian.name}</div>
                    <div className="text-sm text-gray-500">
                      {guardian.walletAddress.substring(0, 20)}...
                    </div>
                    <div className="text-xs text-gray-400 capitalize">
                      {guardian.relationship}
                    </div>
                  </div>
                  <button
                    onClick={() => removeGuardian(guardian.walletAddress)}
                    className="text-red-600 hover:text-red-800 font-medium"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Threshold Setting */}
      {guardians.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-3">Recovery Threshold</h3>
          <p className="text-sm text-blue-700 mb-4">
            How many guardians must approve to recover your account?
          </p>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-blue-900">Guardians needed:</span>
            <select
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="p-2 border border-blue-300 rounded-lg bg-white"
            >
              {Array.from({ length: guardians.length }, (_, i) => i + 1).map(num => (
                <option key={num} value={num}>
                  {num} of {guardians.length}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <div className="flex space-x-3">
        <button 
          onClick={() => setStep('setup')}
          className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-300"
        >
          Back
        </button>
        
        <button 
          onClick={() => setStep('confirm')}
          disabled={guardians.length < 2}
          className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    </div>
  )

  // Render confirmation
  const renderConfirm = () => (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Confirm Social Recovery Setup</h2>
        <p className="text-gray-600">Review your guardian configuration</p>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Recovery Configuration</h3>
        
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Total Guardians:</span>
            <span className="font-semibold">{guardians.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Required for Recovery:</span>
            <span className="font-semibold">{threshold} of {guardians.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Time Lock:</span>
            <span className="font-semibold">48 hours</span>
          </div>
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <h4 className="font-semibold text-green-900 mb-2">Your Guardians</h4>
        <div className="space-y-2">
          {guardians.map((guardian, index) => (
            <div key={index} className="flex items-center justify-between">
              <div>
                <span className="font-medium text-green-800">{guardian.name}</span>
                <span className="text-sm text-green-600 ml-2">({guardian.relationship})</span>
              </div>
              <span className="text-xs text-green-600">
                {guardian.walletAddress.substring(0, 8)}...
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <div className="text-yellow-500 mr-2">📋</div>
          <div>
            <p className="text-sm font-semibold text-yellow-800">What Happens Next</p>
            <ul className="text-sm text-yellow-700 mt-1 space-y-1">
              <li>• Your recovery key will be split into {guardians.length} encrypted pieces</li>
              <li>• Each guardian will receive their encrypted piece</li>
              <li>• Guardians will be notified and can confirm their role</li>
              <li>• Your social recovery will be active immediately</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex space-x-3">
        <button 
          onClick={() => setStep('guardians')}
          className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-300"
        >
          Back
        </button>
        
        <button 
          onClick={setupSocialRecovery}
          disabled={loading}
          className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Setting Up...' : 'Setup Social Recovery'}
        </button>
      </div>
    </div>
  )

  // Render completion
  const renderComplete = () => (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="text-center mb-6">
        <div className="text-4xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Social Recovery Active!</h2>
        <p className="text-gray-600">Your account is now protected by social recovery</p>
      </div>

      {config && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-green-900 mb-3">Recovery Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-green-700">Guardians:</span>
              <span className="font-semibold text-green-800">{config.guardians.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-700">Threshold:</span>
              <span className="font-semibold text-green-800">{config.threshold} of {config.guardians.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-700">Status:</span>
              <span className="font-semibold text-green-800">Active</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-700">Created:</span>
              <span className="font-semibold text-green-800">
                {new Date(config.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h4 className="font-semibold text-blue-900 mb-2">Important Notes</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Your guardians have been notified via their wallets</li>
          <li>• Keep your guardian list updated as relationships change</li>
          <li>• Recovery requests have a 48-hour time delay for security</li>
          <li>• You can modify your guardians anytime in account settings</li>
        </ul>
      </div>

      <button 
        onClick={onComplete}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700"
      >
        Continue to Dashboard
      </button>
    </div>
  )

  // Main render logic
  switch (step) {
    case 'setup':
      return renderSetup()
    case 'guardians':
      return renderGuardians()
    case 'confirm':
      return renderConfirm()
    case 'complete':
      return renderComplete()
    default:
      return renderSetup()
  }
}