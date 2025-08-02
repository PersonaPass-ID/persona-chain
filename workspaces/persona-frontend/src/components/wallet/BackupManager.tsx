'use client'

import { useState, useEffect } from 'react'
import { PersonaBackupManager, RecoveryPhrase, EncryptedBackup } from '@/lib/backup-recovery'

interface BackupManagerProps {
  userDID: string
  userWalletAddress: string
  onComplete?: () => void
}

export default function BackupManager({ userDID, userWalletAddress, onComplete }: BackupManagerProps) {
  const [backupManager] = useState(() => new PersonaBackupManager(userDID, userWalletAddress))
  const [activeTab, setActiveTab] = useState<'recovery-phrase' | 'encrypted-backup' | 'emergency-kit' | 'hardware'>('recovery-phrase')
  
  // Recovery Phrase State
  const [recoveryPhrase, setRecoveryPhrase] = useState<string[]>([])
  const [phraseGenerated, setPhraseGenerated] = useState(false)
  const [phraseConfirmed, setPhraseConfirmed] = useState(false)
  const [confirmationWords, setConfirmationWords] = useState<{ index: number; word: string }[]>([])
  
  // Backup State
  const [backupPassword, setBackupPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [backup, setBackup] = useState<EncryptedBackup | null>(null)
  const [backupCreated, setBackupCreated] = useState(false)
  
  // UI State
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Generate recovery phrase
  const generateRecoveryPhrase = () => {
    const mnemonic = RecoveryPhrase.generateMnemonic()
    setRecoveryPhrase(mnemonic.phrase)
    setPhraseGenerated(true)
    
    // Generate random word positions for confirmation
    const positions = []
    while (positions.length < 3) {
      const pos = Math.floor(Math.random() * 12)
      if (!positions.includes(pos)) {
        positions.push(pos)
      }
    }
    setConfirmationWords(positions.map(pos => ({ index: pos, word: '' })))
  }

  // Confirm recovery phrase
  const confirmRecoveryPhrase = () => {
    const isValid = confirmationWords.every(({ index, word }) => 
      word.toLowerCase().trim() === recoveryPhrase[index].toLowerCase()
    )
    
    if (isValid) {
      setPhraseConfirmed(true)
      setError(null)
    } else {
      setError('Incorrect words. Please check your recovery phrase.')
    }
  }

  // Create encrypted backup
  const createEncryptedBackup = async () => {
    if (backupPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    
    if (backupPassword.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const backupResult = await backupManager.createFullBackup(backupPassword, {
        includeRecoveryPhrase: phraseConfirmed,
        includeSocialRecovery: true,
        includeCredentials: true
      })

      setBackup(backupResult.encryptedBackup)
      setBackupCreated(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create backup')
    } finally {
      setLoading(false)
    }
  }

  // Download backup file
  const downloadBackup = () => {
    if (!backup) return

    const backupData = JSON.stringify(backup, null, 2)
    const blob = new Blob([backupData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = `personapass-backup-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Generate emergency kit
  const generateEmergencyKit = () => {
    const kit = backupManager.generateEmergencyKit()
    
    const kitContent = kit.instructions
    const blob = new Blob([kitContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = `personapass-emergency-kit-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Render recovery phrase tab
  const renderRecoveryPhrase = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Recovery Phrase</h3>
        <p className="text-gray-600">Generate a 12-word phrase to recover your wallet</p>
      </div>

      {!phraseGenerated ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="text-center">
            <div className="text-3xl mb-4">🔑</div>
            <h4 className="font-semibold text-blue-900 mb-2">Create Recovery Phrase</h4>
            <p className="text-sm text-blue-700 mb-4">
              This 12-word phrase can restore your wallet on any device. Keep it safe and private!
            </p>
            <button
              onClick={generateRecoveryPhrase}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700"
            >
              Generate Recovery Phrase
            </button>
          </div>
        </div>
      ) : !phraseConfirmed ? (
        <div className="space-y-6">
          {/* Display phrase */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="text-center mb-4">
              <div className="text-yellow-600 text-sm font-semibold mb-2">⚠️ Write Down These Words</div>
              <p className="text-yellow-700 text-sm">Store them in order in a secure location</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {recoveryPhrase.map((word, index) => (
                <div key={index} className="bg-white border border-yellow-300 rounded-lg p-3 text-center">
                  <div className="text-xs text-gray-500">{index + 1}</div>
                  <div className="font-semibold text-gray-900">{word}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Confirmation */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-4">Confirm Your Recovery Phrase</h4>
            <p className="text-sm text-gray-600 mb-4">Enter the requested words to confirm you've written them down:</p>
            
            <div className="space-y-3">
              {confirmationWords.map(({ index }, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-700 w-16">
                    Word #{index + 1}:
                  </span>
                  <input
                    type="text"
                    value={confirmationWords[i].word}
                    onChange={(e) => {
                      const updated = [...confirmationWords]
                      updated[i].word = e.target.value
                      setConfirmationWords(updated)
                    }}
                    className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter the word"
                  />
                </div>
              ))}
            </div>

            <button
              onClick={confirmRecoveryPhrase}
              disabled={confirmationWords.some(({ word }) => !word.trim())}
              className="w-full mt-4 bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Confirm Recovery Phrase
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <div className="text-3xl mb-4">✅</div>
          <h4 className="font-semibold text-green-900 mb-2">Recovery Phrase Confirmed!</h4>
          <p className="text-green-700 text-sm">
            Your recovery phrase is secured. You can now create additional backups.
          </p>
        </div>
      )}
    </div>
  )

  // Render encrypted backup tab
  const renderEncryptedBackup = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Encrypted Backup</h3>
        <p className="text-gray-600">Create a password-protected backup file</p>
      </div>

      {!backupCreated ? (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Backup Contents</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>✅ Your DID and wallet information</li>
              <li>{phraseConfirmed ? '✅' : '❌'} Recovery phrase (if created)</li>
              <li>✅ Social recovery configuration</li>
              <li>✅ Identity credentials</li>
            </ul>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Backup Password
              </label>
              <input
                type="password"
                value={backupPassword}
                onChange={(e) => setBackupPassword(e.target.value)}
                placeholder="Enter a strong password"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <button
            onClick={createEncryptedBackup}
            disabled={!backupPassword || !confirmPassword || loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Backup...' : 'Create Encrypted Backup'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <div className="text-3xl mb-4">🔒</div>
            <h4 className="font-semibold text-green-900 mb-2">Backup Created Successfully!</h4>
            <p className="text-green-700 text-sm mb-4">
              Your encrypted backup is ready for download and storage.
            </p>
            
            <div className="space-y-3">
              <button
                onClick={downloadBackup}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700"
              >
                📥 Download Backup File
              </button>
              
              <div className="text-xs text-green-600">
                Backup ID: {backup?.id}
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Important Backup Instructions</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Store the backup file in multiple secure locations</li>
              <li>• Remember your backup password - it cannot be recovered</li>
              <li>• Test your backup periodically to ensure it works</li>
              <li>• Keep backups updated when you make account changes</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )

  // Render emergency kit tab
  const renderEmergencyKit = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Emergency Recovery Kit</h3>
        <p className="text-gray-600">Complete recovery package with instructions</p>
      </div>

      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="text-center">
          <div className="text-3xl mb-4">🆘</div>
          <h4 className="font-semibold text-red-900 mb-2">Emergency Recovery Kit</h4>
          <p className="text-sm text-red-700 mb-6">
            Contains everything needed to recover your account in an emergency:
          </p>
          
          <div className="text-left bg-white rounded-lg p-4 mb-6">
            <ul className="text-sm text-red-800 space-y-2">
              <li>🔑 Recovery phrase (12 words)</li>
              <li>🎫 10 backup codes for emergency access</li>
              <li>📋 Step-by-step recovery instructions</li>
              <li>📞 Emergency contact information</li>
              <li>🌐 Recovery website links</li>
            </ul>
          </div>

          <button
            onClick={generateEmergencyKit}
            className="w-full bg-red-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-red-700"
          >
            📄 Generate Emergency Kit
          </button>
          
          <p className="text-xs text-red-600 mt-3">
            Print and store in a secure physical location
          </p>
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-2">Kit Storage Recommendations</h4>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• Print multiple copies and store in different locations</li>
          <li>• Use a fireproof safe or safety deposit box</li>
          <li>• Consider giving a copy to a trusted family member</li>
          <li>• Keep digital copy on encrypted USB drive</li>
        </ul>
      </div>
    </div>
  )

  // Render hardware backup tab
  const renderHardwareBackup = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Hardware Backup</h3>
        <p className="text-gray-600">Secure your recovery keys on hardware devices</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Yubikey */}
        <div className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-blue-300 cursor-pointer">
          <div className="text-center">
            <div className="text-2xl mb-2">🔐</div>
            <h4 className="font-semibold text-gray-900 mb-1">YubiKey</h4>
            <p className="text-sm text-gray-600 mb-4">Hardware security key</p>
            <button className="w-full bg-yellow-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-yellow-700">
              Setup YubiKey
            </button>
          </div>
        </div>

        {/* Ledger */}
        <div className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-blue-300 cursor-pointer">
          <div className="text-center">
            <div className="text-2xl mb-2">💼</div>
            <h4 className="font-semibold text-gray-900 mb-1">Ledger</h4>
            <p className="text-sm text-gray-600 mb-4">Hardware wallet</p>
            <button className="w-full bg-black text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-gray-800">
              Setup Ledger
            </button>
          </div>
        </div>

        {/* Trezor */}
        <div className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-blue-300 cursor-pointer">
          <div className="text-center">
            <div className="text-2xl mb-2">🔒</div>
            <h4 className="font-semibold text-gray-900 mb-1">Trezor</h4>
            <p className="text-sm text-gray-600 mb-4">Hardware wallet</p>
            <button className="w-full bg-green-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-green-700">
              Setup Trezor
            </button>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">Hardware Backup Benefits</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Highest level of security for recovery keys</li>
          <li>• Physical device required for access</li>
          <li>• Protected against malware and phishing</li>
          <li>• Works offline for maximum security</li>
        </ul>
      </div>

      <div className="text-center text-sm text-gray-500">
        <p>Connect your hardware device to get started</p>
      </div>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Backup & Recovery</h2>
        <p className="text-gray-600">Secure your account with multiple backup methods</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-8 bg-gray-100 rounded-lg p-1">
        {[
          { id: 'recovery-phrase', label: 'Recovery Phrase', icon: '🔑' },
          { id: 'encrypted-backup', label: 'Encrypted Backup', icon: '🔒' },
          { id: 'emergency-kit', label: 'Emergency Kit', icon: '🆘' },
          { id: 'hardware', label: 'Hardware', icon: '💼' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-96">
        {activeTab === 'recovery-phrase' && renderRecoveryPhrase()}
        {activeTab === 'encrypted-backup' && renderEncryptedBackup()}
        {activeTab === 'emergency-kit' && renderEmergencyKit()}
        {activeTab === 'hardware' && renderHardwareBackup()}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Complete Button */}
      {(phraseConfirmed || backupCreated) && (
        <div className="mt-8 text-center">
          <button
            onClick={onComplete}
            className="bg-green-600 text-white py-3 px-8 rounded-lg font-semibold hover:bg-green-700"
          >
            Complete Backup Setup
          </button>
        </div>
      )}
    </div>
  )
}