/**
 * 🆓 KYC Verification Step - FREE Didit Integration
 * Post-authentication KYC verification to earn 100 free ID tokens
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { StepProps } from './types';
import KYCVerificationFlow from '../../KYCVerificationFlow';
import { useWalletAuth } from '@/hooks/useWalletAuth';

const KYCStep: React.FC<StepProps> = ({ 
  onNext,
  onPrev,
  stepData 
}) => {
  const { user } = useWalletAuth();

  const handleVerificationComplete = (verificationData: any) => {
    console.log('🎉 KYC verification completed:', verificationData);
    
    // Store verification result in stepData for later use
    if (stepData) {
      stepData.kycVerification = {
        status: 'completed',
        provider: 'didit',
        tokensAwarded: verificationData.awards?.id_tokens || 100,
        completedAt: new Date().toISOString(),
        data: verificationData
      };
    }

    // Automatically advance to next step after verification
    setTimeout(() => {
      onNext();
    }, 2000);
  };

  const handleVerificationSkip = () => {
    console.log('⏭️ User skipped KYC verification');
    
    // Mark as skipped in stepData
    if (stepData) {
      stepData.kycVerification = {
        status: 'skipped',
        skippedAt: new Date().toISOString()
      };
    }

    // Advance to next step
    onNext();
  };

  const userAddress = user?.address || user?.walletAddress || 'unknown';
  const userEmail = user?.email || stepData?.profile?.email;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full mx-auto mb-6 flex items-center justify-center">
          <span className="text-2xl">🎁</span>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Claim Your Free ID Tokens
        </h1>
        
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Complete our FREE identity verification to unlock 100 ID tokens and join the PersonaPass ecosystem.
          No monthly fees, unlimited verifications!
        </p>
      </motion.div>

      {/* KYC Verification Flow */}
      <KYCVerificationFlow
        userAddress={userAddress}
        userEmail={userEmail}
        onVerificationComplete={handleVerificationComplete}
        onVerificationSkip={handleVerificationSkip}
        className="mb-8"
      />

      {/* Back Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center"
      >
        <button
          onClick={onPrev}
          className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-sm font-medium inline-flex items-center"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Authentication
        </button>
      </motion.div>

      {/* Progress Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="mt-12 text-center"
      >
        <div className="flex items-center justify-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span>Authentication</span>
          <div className="w-6 h-0.5 bg-gray-300 dark:bg-gray-600"></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <span className="text-blue-500 font-medium">Identity Verification</span>
          <div className="w-6 h-0.5 bg-gray-300 dark:bg-gray-600"></div>
          <div className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
          <span>Complete Setup</span>
        </div>
      </motion.div>
    </div>
  );
};

export default KYCStep;