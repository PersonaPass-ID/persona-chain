// 🎉 COMPLETE STEP - Success Celebration and Next Steps
// Achievement celebration with sharing and onboarding completion

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StepProps } from './types';

interface ShareOption {
  id: string;
  name: string;
  icon: string;
  color: string;
  action: (did: string, qrCode: string) => void;
}

const CompleteStep: React.FC<StepProps> = ({
  result,
  userData,
  privacySettings,
  selectedAuth,
  onReset,
  stepData
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);
  const [celebrating, setCelebrating] = useState(true);

  useEffect(() => {
    // Stop celebration animation after 3 seconds
    const timer = setTimeout(() => setCelebrating(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!result) {
    return (
      <div className="text-center">
        <div className="text-red-500 text-4xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Onboarding Incomplete
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-8">
          There was an issue completing your onboarding. Please try again.
        </p>
        <button
          onClick={onReset}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          Start Over
        </button>
      </div>
    );
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOptions: ShareOption[] = [
    {
      id: 'twitter',
      name: 'Twitter',
      icon: '🐦',
      color: 'bg-blue-500 hover:bg-blue-600',
      action: (did: string) => {
        const text = `🎉 Just created my decentralized digital identity on PersonaPass! My DID: ${did.slice(0, 20)}... #Web3 #DigitalIdentity #Blockchain`;
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
      }
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: '💼',
      color: 'bg-blue-700 hover:bg-blue-800',
      action: (did: string) => {
        const text = `Excited to share that I've just created my decentralized digital identity on PersonaPass! This is the future of secure, user-controlled identity management. #Web3 #DigitalIdentity`;
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=https://personapass.io&summary=${encodeURIComponent(text)}`, '_blank');
      }
    },
    {
      id: 'telegram',
      name: 'Telegram',
      icon: '📱',
      color: 'bg-blue-400 hover:bg-blue-500',
      action: (did: string) => {
        const text = `🚀 Check out my new decentralized identity on PersonaPass! DID: ${did}`;
        window.open(`https://t.me/share/url?url=https://personapass.io&text=${encodeURIComponent(text)}`, '_blank');
      }
    },
    {
      id: 'discord',
      name: 'Discord',
      icon: '🎮',
      color: 'bg-indigo-500 hover:bg-indigo-600',
      action: (did: string) => {
        copyToClipboard(`🎉 Just created my decentralized identity on PersonaPass! DID: ${did}`);
        alert('Text copied to clipboard! Paste it in your Discord channel.');
      }
    }
  ];

  const nextSteps = [
    {
      icon: '🔗',
      title: 'Connect with Others',
      description: 'Find and connect with other PersonaPass users',
      action: 'Browse Community'
    },
    {
      icon: '📱',
      title: 'Download Mobile App',
      description: 'Access your identity on the go',
      action: 'Get App'
    },
    {
      icon: '🛡️',
      title: 'Verify Your Identity',
      description: 'Add additional verification for higher trust',
      action: 'Start Verification'
    },
    {
      icon: '🎯',
      title: 'Explore Features',
      description: 'Discover what you can do with your digital identity',
      action: 'Take Tour'
    }
  ];

  const stats = [
    { label: 'Your DID', value: result.did?.slice(0, 20) + '...', copyable: result.did },
    { label: 'Auth Method', value: selectedAuth?.name || 'Email' },
    { label: 'Reputation Score', value: result.reputationScore?.toString() || '100' },
    { label: 'Network', value: 'PersonaChain Mainnet' }
  ];

  return (
    <div className="max-w-4xl mx-auto text-center">
      {/* Celebration Animation */}
      <AnimatePresence>
        {celebrating && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-10"
          >
            {/* Confetti */}
            {[...Array(50)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-gradient-to-r from-yellow-400 to-red-500 rounded"
                initial={{
                  x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
                  y: -10,
                  rotate: 0
                }}
                animate={{
                  y: (typeof window !== 'undefined' ? window.innerHeight : 1000) + 10,
                  rotate: 360
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  delay: Math.random() * 2
                }}
                style={{
                  left: Math.random() * 100 + '%',
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Success Message */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mb-8"
      >
        <motion.div
          animate={celebrating ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 2, repeat: celebrating ? Infinity : 0 }}
          className="w-24 h-24 bg-gradient-to-r from-green-400 to-blue-500 rounded-full mx-auto mb-6 flex items-center justify-center"
        >
          <span className="text-4xl">🎉</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-4xl font-bold text-gray-900 dark:text-white mb-4"
        >
          Welcome to Web3, {userData.name}! 🚀
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-xl text-gray-600 dark:text-gray-300 mb-8"
        >
          Your decentralized digital identity has been successfully created and secured on the blockchain.
        </motion.p>

        {/* Success Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-wrap justify-center gap-4 mb-8"
        >
          <div className="flex items-center space-x-2 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 px-4 py-2 rounded-full">
            <span>✅</span>
            <span className="font-medium">Identity Created</span>
          </div>
          <div className="flex items-center space-x-2 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 px-4 py-2 rounded-full">
            <span>🔐</span>
            <span className="font-medium">Keys Secured</span>
          </div>
          <div className="flex items-center space-x-2 bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-200 px-4 py-2 rounded-full">
            <span>🌐</span>
            <span className="font-medium">Blockchain Verified</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Identity Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-8 mb-8 border border-blue-200 dark:border-blue-700"
      >
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Your Digital Identity Summary
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1 + index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-4 border"
            >
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                {stat.label}
              </div>
              <div className="font-semibold text-gray-900 dark:text-white flex items-center">
                <span className="truncate">{stat.value}</span>
                {stat.copyable && (
                  <button
                    onClick={() => copyToClipboard(stat.copyable)}
                    className="ml-2 text-blue-500 hover:text-blue-600 text-sm"
                    title="Copy full value"
                  >
                    📋
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* QR Code */}
        <div className="flex justify-center mb-6">
          <button
            onClick={() => setShowQR(!showQR)}
            className="bg-white dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 hover:border-blue-500 transition-colors"
          >
            {showQR ? (
              <div className="text-center">
                <div className="w-32 h-32 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <span className="text-white text-xs font-mono break-all p-2">
                    {result.qrCode || 'QR_CODE_DATA'}
                  </span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Your Identity QR Code
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-3xl mb-2">📱</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Click to show QR Code
                </div>
              </div>
            )}
          </button>
        </div>

        {/* Technical Details Toggle */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
        >
          {showDetails ? 'Hide' : 'Show'} Technical Details
        </button>

        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-left"
            >
              <div className="grid gap-4 text-sm font-mono">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">DID:</span>
                  <div className="break-all bg-white dark:bg-gray-800 p-2 rounded mt-1">
                    {result.did}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Transaction Hashes:</span>
                  <div className="space-y-2 mt-1">
                    <div className="bg-white dark:bg-gray-800 p-2 rounded">
                      <div className="text-xs text-gray-500 mb-1">DID Creation:</div>
                      <div className="break-all">{result.didTxHash}</div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-2 rounded">
                      <div className="text-xs text-gray-500 mb-1">Identity Profile:</div>
                      <div className="break-all">{result.identityTxHash}</div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-2 rounded">
                      <div className="text-xs text-gray-500 mb-1">Credential:</div>
                      <div className="break-all">{result.credentialTxHash}</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Share Your Achievement */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        className="mb-8"
      >
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Share Your Achievement 🎊
        </h2>
        
        <div className="flex flex-wrap justify-center gap-4">
          {shareOptions.map((option, index) => (
            <motion.button
              key={option.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.4 + index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => option.action(result.did || '', result.qrCode || '')}
              className={`${option.color} text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2`}
            >
              <span>{option.icon}</span>
              <span>{option.name}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Next Steps */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.6 }}
        className="mb-8"
      >
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          What&apos;s Next? 🚀
        </h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          {nextSteps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.8 + index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 transition-colors cursor-pointer group"
            >
              <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">
                {step.icon}
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                {step.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                {step.description}
              </p>
              <button className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium text-sm">
                {step.action} →
              </button>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2 }}
        className="flex flex-col sm:flex-row gap-4 justify-center"
      >
        <button
          onClick={() => window.location.href = '/dashboard'}
          className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
        >
          Go to Dashboard 🏠
        </button>
        
        <button
          onClick={() => window.location.href = '/explore'}
          className="border-2 border-blue-500 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200"
        >
          Explore Community 🌐
        </button>
      </motion.div>

      {/* Footer Message */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.2 }}
        className="mt-12 text-center text-gray-500 dark:text-gray-400"
      >
        <p className="mb-2">
          🎉 Congratulations on joining the future of digital identity! 
        </p>
        <p className="text-sm">
          Your identity is now secured on the blockchain and ready to use across Web3.
        </p>
      </motion.div>

      {/* Copied Notification */}
      <AnimatePresence>
        {copied && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.8 }}
            animate={{ opacity: 1, y: -20, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.8 }}
            className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50"
          >
            <div className="flex items-center space-x-2">
              <span>✅</span>
              <span>Copied to clipboard!</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CompleteStep;