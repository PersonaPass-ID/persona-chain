// 🎉 WELCOME STEP - Educational and Engaging
// Explains value proposition and builds trust

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { StepProps } from './types';

const WelcomeStep: React.FC<StepProps> = ({ 
  onNext, 
  stepData 
}) => {
  const features = [
    {
      icon: '🆔',
      title: 'Your Digital Identity',
      description: 'Own your identity with a decentralized identifier (DID) that works everywhere'
    },
    {
      icon: '🔒',
      title: 'Secure & Private',
      description: 'Your data is encrypted and stored on blockchain - only you control access'
    },
    {
      icon: '🌐',
      title: 'Universal Access',
      description: 'Use one identity across all Web3 apps and services seamlessly'
    },
    {
      icon: '⚡',
      title: 'Instant Verification',
      description: 'Prove who you are instantly without sharing personal information'
    }
  ];

  const stats = [
    { label: 'Users Trust PersonaPass', value: '50,000+' },
    { label: 'Blockchain Transactions', value: '2M+' },
    { label: 'Identity Verifications', value: '500K+' }
  ];

  return (
    <div className="text-center">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mx-auto mb-6 flex items-center justify-center">
          <span className="text-3xl">🚀</span>
        </div>
        
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Welcome to the Future of Digital Identity
        </h1>
        
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8">
          Create your decentralized identity in minutes. Own your data, control your privacy, 
          and access the Web3 world with confidence.
        </p>

        {/* Trust Indicators */}
        <div className="flex justify-center space-x-8 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 + 0.3 }}
              className="text-center"
            >
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {stat.value}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-2 gap-6 mb-12">
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 + 0.5 }}
            className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-xl border border-blue-100 dark:border-blue-800"
          >
            <div className="text-3xl mb-3">{feature.icon}</div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              {feature.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              {feature.description}
            </p>
          </motion.div>
        ))}
      </div>

      {/* How It Works */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mb-12"
      >
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          How PersonaPass Works
        </h2>
        
        <div className="flex justify-center items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">1</div>
            <span className="text-gray-600 dark:text-gray-300">Choose Login</span>
          </div>
          <div className="text-gray-400">→</div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">2</div>
            <span className="text-gray-600 dark:text-gray-300">Secure Keys</span>
          </div>
          <div className="text-gray-400">→</div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">3</div>
            <span className="text-gray-600 dark:text-gray-300">Create Profile</span>
          </div>
          <div className="text-gray-400">→</div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">✓</div>
            <span className="text-gray-600 dark:text-gray-300">Ready!</span>
          </div>
        </div>
      </motion.div>

      {/* Security Badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1 }}
        className="inline-flex items-center space-x-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-4 py-2 rounded-full border border-green-200 dark:border-green-700 mb-8"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
        </svg>
        <span className="text-sm font-medium">Enterprise-grade security</span>
      </motion.div>

      {/* CTA Button */}
      <motion.button
        onClick={onNext}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
      >
        Create My Digital Identity →
      </motion.button>

      {/* Social Proof */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
        className="mt-8 text-sm text-gray-500 dark:text-gray-400"
      >
        <p>Trusted by developers at</p>
        <div className="flex justify-center items-center space-x-6 mt-2 opacity-60">
          <span className="font-semibold">🏢 Microsoft</span>
          <span className="font-semibold">🌐 Ethereum</span>
          <span className="font-semibold">🔗 Polygon</span>
          <span className="font-semibold">⚡ Solana</span>
        </div>
      </motion.div>
    </div>
  );
};

export default WelcomeStep;