// 🔐 AUTHENTICATION STEP - Multiple Options
// Social, biometric, email, and wallet authentication

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StepProps } from './types';
import { AuthenticationOption } from '../../../lib/blockchain';
import WalletAuthModal from '../../WalletAuthModal';
import { useWalletAuth } from '@/hooks/useWalletAuth';

const AuthStep: React.FC<StepProps> = ({ 
  selectedAuth,
  authOptions,
  onSelectAuth,
  onNext,
  stepData 
}) => {
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  
  const { isAuthenticated, user } = useWalletAuth();

  // Auto-advance when auth is selected
  useEffect(() => {
    if (selectedAuth) {
      const timer = setTimeout(() => {
        onNext();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [selectedAuth, onNext]);

  const getAuthIcon = (option: AuthenticationOption) => {
    const icons = {
      google: (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
      ),
      github: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.341-3.369-1.341-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
        </svg>
      ),
      apple: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
        </svg>
      ),
      phone: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
        </svg>
      )
    };
    return icons[option.provider as keyof typeof icons] || icons[option.id as keyof typeof icons] || <span className="text-2xl">{option.icon}</span>;
  };

  const getAuthDescription = (option: AuthenticationOption) => {
    const descriptions = {
      google: 'Sign in with your Google account for quick and secure access',
      github: 'Use your GitHub account to create your developer identity',
      apple: 'Sign in with Apple ID for enhanced privacy and security',
      biometric: 'Use your fingerprint or face recognition for secure access',
      email: 'Create an account with your email address and password',
      phone: 'Verify your phone number with a one-time code',
      wallet: 'Connect your Web3 wallet (MetaMask, WalletConnect, etc.)'
    };
    return descriptions[option.id as keyof typeof descriptions] || option.name;
  };

  const getSecurityLevel = (option: AuthenticationOption) => {
    const levels = {
      biometric: { level: 'Maximum', color: 'text-green-600' },
      wallet: { level: 'High', color: 'text-blue-600' },
      google: { level: 'High', color: 'text-blue-600' },
      github: { level: 'High', color: 'text-blue-600' },
      apple: { level: 'High', color: 'text-blue-600' },
      phone: { level: 'High', color: 'text-blue-600' },
      email: { level: 'Medium', color: 'text-yellow-600' }
    };
    return levels[option.id as keyof typeof levels] || { level: 'Medium', color: 'text-yellow-600' };
  };

  const handleWalletSuccess = (walletUser: unknown) => {
    // Type guard to safely access wallet user properties
    const user = walletUser as { walletType?: string; address?: string } | null;
    
    // Create a wallet authentication option and select it
    const walletAuthOption: AuthenticationOption = {
      id: 'wallet',
      name: 'Cosmos Wallet',
      type: 'wallet',
      provider: user?.walletType || 'wallet',
      available: true,
      icon: '🌌'
    };
    onSelectAuth(walletAuthOption);
    setShowWalletModal(false);
  };

  const handleWalletOptionClick = (option: AuthenticationOption) => {
    if (option.id === 'wallet') {
      setShowWalletModal(true);
    } else {
      onSelectAuth(option);
    }
  };

  // Check if user is already authenticated with wallet
  useEffect(() => {
    if (isAuthenticated && user && !selectedAuth) {
      handleWalletSuccess(user);
    }
  }, [isAuthenticated, user, selectedAuth, handleWalletSuccess]);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full mx-auto mb-6 flex items-center justify-center">
          <span className="text-2xl">🔐</span>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Choose Your Authentication Method
        </h1>
        
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Select how you&apos;d like to secure and access your PersonaPass identity. 
          All methods provide enterprise-grade security.
        </p>
      </motion.div>

      {/* Authentication Options */}
      <div className="space-y-4 mb-8">
        {authOptions.map((option, index) => {
          const security = getSecurityLevel(option);
          const isSelected = selectedAuth?.id === option.id;
          const isHovered = hoveredOption === option.id;

          return (
            <motion.button
              key={option.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => handleWalletOptionClick(option)}
              onMouseEnter={() => setHoveredOption(option.id)}
              onMouseLeave={() => setHoveredOption(null)}
              disabled={!option.available}
              className={`w-full p-6 rounded-xl border-2 transition-all duration-300 text-left ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : isHovered
                  ? 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              } ${
                !option.available 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'cursor-pointer transform hover:scale-[1.02]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-lg ${
                    isSelected 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                  }`}>
                    {getAuthIcon(option)}
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                      {option.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
                      {getAuthDescription(option)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <div className={`text-sm font-medium ${security.color}`}>
                      {security.level} Security
                    </div>
                    {option.type === 'biometric' && (
                      <div className="text-xs text-green-600 dark:text-green-400">
                        Most Secure
                      </div>
                    )}
                  </div>

                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center"
                    >
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Success Animation */}
      <AnimatePresence>
        {selectedAuth && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="text-center p-6 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-700"
          >
            <div className="w-12 h-12 bg-green-500 rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            
            <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
              Great Choice!
            </h3>
            <p className="text-green-600 dark:text-green-300 text-sm">
              You&apos;ve selected {selectedAuth.name}. Moving to the next step...
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Security Info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700"
      >
        <div className="flex items-start space-x-3">
          <div className="text-blue-500 mt-0.5">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-1">
              Your Security is Our Priority
            </h4>
            <p className="text-blue-600 dark:text-blue-300 text-sm">
              All authentication methods use enterprise-grade encryption. Your private keys are generated 
              locally and never leave your device. We use zero-knowledge proofs to verify your identity 
              without exposing personal information.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Help Button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        onClick={() => setShowDetails(!showDetails)}
        className="mt-6 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium flex items-center mx-auto"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Need help choosing?
      </motion.button>

      {/* Wallet Authentication Modal */}
      <WalletAuthModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        onSuccess={handleWalletSuccess}
        title="Connect Your Cosmos Wallet"
        subtitle="Authenticate with your preferred Cosmos wallet for secure access"
      />
    </div>
  );
};

export default AuthStep;