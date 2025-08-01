// 🚀 STATE-OF-THE-ART ONBOARDING WIZARD
// Modern, accessible, mobile-first React component with animations

'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnboarding } from '../../hooks/useOnboarding';
import { OnboardingResult } from '../../lib/blockchain';

// Step Components
import WelcomeStep from './steps/WelcomeStep';
import AuthStep from './steps/AuthStep';
import KeysStep from './steps/KeysStep';
import ProfileStep from './steps/ProfileStep';
import PrivacyStep from './steps/PrivacyStep';
import CompleteStep from './steps/CompleteStep';

export interface OnboardingWizardProps {
  onComplete?: (result: OnboardingResult) => void;
  onError?: (error: string, step: string) => void;
  enableAnalytics?: boolean;
  theme?: 'light' | 'dark' | 'auto';
  className?: string;
}

const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  onComplete,
  onError,
  enableAnalytics = true,
  theme = 'auto',
  className = ''
}) => {
  const {
    currentStep,
    steps,
    loading,
    error,
    progress,
    isComplete,
    result,
    nextStep,
    prevStep,
    skipStep,
    canGoNext,
    canGoPrev,
    currentStepData,
    isFirstStep,
    isLastStep,
    userData,
    privacySettings,
    selectedAuth,
    authOptions,
    updateUserData,
    updatePrivacySettings,
    selectAuth,
    completeOnboarding,
    resetOnboarding,
    analytics
  } = useOnboarding(enableAnalytics, onComplete, onError);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    analytics.track('onboarding_wizard_loaded');
  }, [analytics]);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-blue-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const stepComponents = {
    welcome: WelcomeStep,
    auth: AuthStep,
    keys: KeysStep,
    profile: ProfileStep,
    privacy: PrivacyStep,
    complete: CompleteStep
  };

  const CurrentStepComponent = stepComponents[currentStepData?.id as keyof typeof stepComponents];

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900 ${className}`}>
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gray-200 dark:bg-gray-700 z-50">
        <motion.div
          className="h-full bg-gradient-to-r from-blue-500 to-indigo-600"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      {/* Main Container */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xl">P</span>
            </div>
            <h1 className="ml-3 text-2xl font-bold text-gray-900 dark:text-white">
              PersonaPass
            </h1>
          </div>
          
          {!isComplete && (
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
              <span>Step {currentStep + 1} of {steps.length}</span>
              <span>•</span>
              <span>{currentStepData?.title}</span>
            </div>
          )}
        </motion.div>

        {/* Step Indicators */}
        {!isComplete && (
          <div className="flex justify-center mb-8">
            <div className="flex space-x-2">
              {steps.map((step, index) => (
                <motion.div
                  key={step.id}
                  className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                    step.completed 
                      ? 'bg-green-500' 
                      : step.current
                      ? 'bg-blue-500'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                  initial={{ scale: 0 }}
                  animate={{ 
                    scale: 1,
                    backgroundColor: step.completed 
                      ? '#10b981' 
                      : step.current
                      ? '#3b82f6'
                      : '#d1d5db'
                  }}
                  transition={{ delay: index * 0.1 }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg"
            >
              <div className="flex items-center">
                <div className="text-red-500 mr-3">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                    Something went wrong
                  </h3>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    {error}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step Content */}
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="p-8 min-h-[500px]">
            <AnimatePresence mode="wait">
              {CurrentStepComponent && (
                <motion.div
                  key={currentStepData?.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <CurrentStepComponent
                    userData={userData}
                    privacySettings={privacySettings}
                    selectedAuth={selectedAuth}
                    authOptions={authOptions}
                    loading={loading}
                    result={result}
                    onUpdateUserData={updateUserData}
                    onUpdatePrivacySettings={updatePrivacySettings}
                    onSelectAuth={selectAuth}
                    onNext={nextStep}
                    onPrevious={prevStep}
                    onSkip={skipStep}
                    onComplete={completeOnboarding}
                    onReset={resetOnboarding}
                    canGoNext={canGoNext}
                    canGoPrev={canGoPrev}
                    isFirstStep={isFirstStep}
                    isLastStep={isLastStep}
                    stepData={currentStepData}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Navigation Footer */}
          {!isComplete && currentStepData?.id !== 'complete' && (
            <div className="bg-gray-50 dark:bg-gray-700/50 px-8 py-4 flex justify-between items-center">
              <button
                onClick={prevStep}
                disabled={!canGoPrev || loading}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  canGoPrev && !loading
                    ? 'text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                    : 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                }`}
              >
                ← Previous
              </button>

              <div className="flex space-x-3">
                {currentStepData?.optional && (
                  <button
                    onClick={skipStep}
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition-colors"
                  >
                    Skip
                  </button>
                )}

                <button
                  onClick={currentStepData?.id === 'keys' ? completeOnboarding : nextStep}
                  disabled={!canGoNext || loading}
                  className={`px-6 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    canGoNext && !loading
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                      : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Creating...</span>
                    </div>
                  ) : currentStepData?.id === 'keys' ? (
                    'Create My Identity'
                  ) : (
                    'Continue →'
                  )}
                </button>
              </div>
            </div>
          )}
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-8 text-sm text-gray-500 dark:text-gray-400"
        >
          <p>
            Powered by blockchain technology • Your data is encrypted and secure
          </p>
          <div className="flex justify-center space-x-4 mt-2">
            <a href="#" className="hover:text-blue-500 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-blue-500 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-blue-500 transition-colors">Support</a>
          </div>
        </motion.div>
      </div>

      {/* Background Effects */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default OnboardingWizard;