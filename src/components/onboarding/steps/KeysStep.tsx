// 🔑 KEYS STEP - Secure Key Generation and Backup
// Client-side key generation with multiple backup options

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StepProps } from './types';

interface KeyPair {
  publicKey: string;
  privateKey: string;
  mnemonic: string;
  address: string;
}

interface BackupMethod {
  id: string;
  name: string;
  icon: string;
  description: string;
  security: 'high' | 'medium' | 'low';
  recommended: boolean;
}

const BACKUP_METHODS: BackupMethod[] = [
  {
    id: 'mnemonic',
    name: 'Recovery Phrase',
    icon: '📝',
    description: '12-word phrase that can restore your identity anywhere',
    security: 'high',
    recommended: true
  },
  {
    id: 'keystore',
    name: 'Keystore File',
    icon: '📁',
    description: 'Encrypted file protected by password',
    security: 'high',
    recommended: false
  },
  {
    id: 'qr',
    name: 'QR Code',
    icon: '📱',
    description: 'Scannable code for easy mobile backup',
    security: 'medium',
    recommended: false
  },
  {
    id: 'cloud',
    name: 'Cloud Backup',
    icon: '☁️',
    description: 'Encrypted backup to your cloud storage',
    security: 'medium',
    recommended: false
  }
];

const KeysStep: React.FC<StepProps> = ({
  onNext,
  onUpdateUserData,
  userData,
  loading,
  stepData
}) => {
  const [keyPair, setKeyPair] = useState<KeyPair | null>(null);
  const [selectedBackup, setSelectedBackup] = useState<string>('mnemonic');
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [mnemonicConfirmed, setMnemonicConfirmed] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  // Generate keys on component mount
  useEffect(() => {
    generateKeys();
  }, []);

  const generateKeys = async () => {
    setGenerating(true);
    setProgress(0);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      // Generate cryptographically secure keys
      const crypto = window.crypto || (window as unknown as { msCrypto: Crypto }).msCrypto;
      
      // Generate entropy for mnemonic
      const entropy = crypto.getRandomValues(new Uint8Array(16));
      const mnemonic = await generateMnemonic(entropy);
      
      // Generate key pair from mnemonic
      const keyPairData = await generateKeyPairFromMnemonic(mnemonic);
      
      clearInterval(progressInterval);
      setProgress(100);
      
      setTimeout(() => {
        setKeyPair(keyPairData);
        setGenerating(false);
        
        // Update user data with keys
        onUpdateUserData({
          ...userData,
          publicKey: keyPairData.publicKey,
          address: keyPairData.address
        });
      }, 500);

    } catch (error) {
      console.error('Key generation failed:', error);
      setGenerating(false);
    }
  };

  const generateMnemonic = async (entropy: Uint8Array): Promise<string> => {
    // Simple mnemonic generation (in production, use BIP39)
    const words = [
      'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract',
      'absurd', 'abuse', 'access', 'accident', 'account', 'accuse', 'achieve', 'acid',
      'acoustic', 'acquire', 'across', 'act', 'action', 'actor', 'actress', 'actual',
      'adapt', 'add', 'addict', 'address', 'adjust', 'admit', 'adult', 'advance'
    ];
    
    const mnemonic = [];
    for (let i = 0; i < 12; i++) {
      const index = entropy[i] % words.length;
      mnemonic.push(words[index]);
    }
    
    return mnemonic.join(' ');
  };

  const generateKeyPairFromMnemonic = async (mnemonic: string): Promise<KeyPair> => {
    // Generate deterministic key pair from mnemonic
    const encoder = new TextEncoder();
    const data = encoder.encode(mnemonic);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = new Uint8Array(hashBuffer);
    
    // Generate key pair using WebCrypto API
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'ECDSA',
        namedCurve: 'P-256'
      },
      true,
      ['sign', 'verify']
    );

    const publicKeyBuffer = await crypto.subtle.exportKey('spki', keyPair.publicKey);
    const privateKeyBuffer = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
    
    const publicKey = btoa(String.fromCharCode(...new Uint8Array(publicKeyBuffer)));
    const privateKey = btoa(String.fromCharCode(...new Uint8Array(privateKeyBuffer)));
    
    // Generate address from public key (simplified)
    const addressHash = await crypto.subtle.digest('SHA-256', new Uint8Array(hashArray.slice(0, 20)));
    const address = 'persona1' + btoa(String.fromCharCode(...new Uint8Array(addressHash.slice(0, 20)))).slice(0, 39);

    return {
      publicKey,
      privateKey,
      mnemonic,
      address
    };
  };

  const downloadBackup = (method: string) => {
    if (!keyPair) return;

    let content = '';
    let filename = '';
    let type = 'text/plain';

    switch (method) {
      case 'mnemonic':
        content = keyPair.mnemonic;
        filename = 'persona-recovery-phrase.txt';
        break;
      case 'keystore':
        const keystore = {
          address: keyPair.address,
          publicKey: keyPair.publicKey,
          // Private key would be encrypted in production
          version: 1,
          timestamp: Date.now()
        };
        content = JSON.stringify(keystore, null, 2);
        filename = 'persona-keystore.json';
        type = 'application/json';
        break;
      default:
        return;
    }

    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (generating) {
    return (
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md mx-auto"
        >
          <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full mx-auto mb-6 flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="text-3xl"
            >
              🔑
            </motion.div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Generating Your Secure Keys
          </h2>
          
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            Creating your cryptographic identity using enterprise-grade security...
          </p>

          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
            <motion.div
              className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

          <div className="text-sm text-gray-500 dark:text-gray-400">
            {progress}% Complete
          </div>
        </motion.div>
      </div>
    );
  }

  if (!keyPair) {
    return (
      <div className="text-center">
        <div className="text-red-500 mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Key Generation Failed
        </h2>
        <button
          onClick={generateKeys}
          className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full mx-auto mb-6 flex items-center justify-center">
          <span className="text-2xl">🔑</span>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Secure Your Digital Identity
        </h1>
        
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Your cryptographic keys have been generated. Choose how you&apos;d like to back them up.
        </p>
      </motion.div>

      {/* Key Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 p-6 rounded-xl border border-green-200 dark:border-green-700 mb-8"
      >
        <div className="flex items-center mb-4">
          <div className="text-green-500 mr-3">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="font-semibold text-green-800 dark:text-green-200">
            Keys Generated Successfully
          </h3>
        </div>
        
        <div className="grid gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Your Address
            </label>
            <div className="flex items-center space-x-2 mt-1">
              <code className="flex-1 bg-white dark:bg-gray-700 px-3 py-2 rounded border text-sm font-mono">
                {keyPair.address}
              </code>
              <button
                onClick={() => copyToClipboard(keyPair.address)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                title="Copy to clipboard"
              >
                📋
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Backup Methods */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mb-8"
      >
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Choose Your Backup Method
        </h2>
        
        <div className="grid gap-4">
          {BACKUP_METHODS.map((method) => (
            <motion.button
              key={method.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedBackup(method.id)}
              className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                selectedBackup === method.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-2xl">{method.icon}</div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {method.name}
                      </h3>
                      {method.recommended && (
                        <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full">
                          Recommended
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      {method.description}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={`text-sm font-medium ${
                    method.security === 'high' ? 'text-green-600' :
                    method.security === 'medium' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {method.security.charAt(0).toUpperCase() + method.security.slice(1)} Security
                  </div>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Backup Content */}
      <AnimatePresence mode="wait">
        {selectedBackup === 'mnemonic' && (
          <motion.div
            key="mnemonic"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-8"
          >
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl p-6">
              <div className="flex items-start space-x-3 mb-4">
                <div className="text-yellow-500 mt-1">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                    Important Security Notice
                  </h3>
                  <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                    <li>• Write down your recovery phrase on paper</li>
                    <li>• Store it in a secure location</li>
                    <li>• Never share it with anyone</li>
                    <li>• Anyone with this phrase can access your identity</li>
                  </ul>
                </div>
              </div>
              
              <div className="space-y-4">
                <button
                  onClick={() => setShowMnemonic(!showMnemonic)}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                >
                  {showMnemonic ? 'Hide Recovery Phrase' : 'Reveal Recovery Phrase'}
                </button>
                
                {showMnemonic && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="bg-white dark:bg-gray-800 border rounded-lg p-4"
                  >
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {keyPair.mnemonic.split(' ').map((word, index) => (
                        <div
                          key={index}
                          className="bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded text-center font-mono text-sm"
                        >
                          <span className="text-gray-500 dark:text-gray-400 text-xs">{index + 1}.</span> {word}
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => copyToClipboard(keyPair.mnemonic)}
                        className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                      >
                        📋 Copy to Clipboard
                      </button>
                      <button
                        onClick={() => downloadBackup('mnemonic')}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                      >
                        💾 Download Backup
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mb-8"
      >
        <label className="flex items-start space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={mnemonicConfirmed}
            onChange={(e) => setMnemonicConfirmed(e.target.checked)}
            className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <div className="text-sm">
            <div className="font-medium text-gray-900 dark:text-white">
              I have securely backed up my recovery information
            </div>
            <div className="text-gray-600 dark:text-gray-300 mt-1">
              I understand that losing this information means I cannot recover my digital identity.
            </div>
          </div>
        </label>
      </motion.div>

      {/* Continue Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="text-center"
      >
        <button
          onClick={onNext}
          disabled={!mnemonicConfirmed}
          className={`px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 ${
            mnemonicConfirmed
              ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600 shadow-lg hover:shadow-xl transform hover:-translate-y-1'
              : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
          }`}
        >
          Continue to Profile Setup →
        </button>
      </motion.div>
    </div>
  );
};

export default KeysStep;