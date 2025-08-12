// 🚀 STATE-OF-THE-ART ONBOARDING HOOK
// Advanced React hook with complete state management and analytics

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import PersonaBlockchain, { 
  OnboardingResult, 
  UserMetadata, 
  PrivacySettings,
  OnboardingStep,
  ONBOARDING_STEPS,
  AuthenticationOption,
  AUTHENTICATION_OPTIONS
} from '../lib/blockchain';

export interface OnboardingState {
  currentStep: number;
  steps: OnboardingStep[];
  userData: Partial<UserMetadata>;
  privacySettings: Partial<PrivacySettings>;
  selectedAuth: AuthenticationOption | null;
  loading: boolean;
  error: string | null;
  progress: number;
  result: OnboardingResult | null;
  isComplete: boolean;
  startTime: number;
  analytics: {
    stepStartTimes: Record<string, number>;
    stepCompletionTimes: Record<string, number>;
    errors: Array<{ step: string; error: string; timestamp: number }>;
    authMethodSelected: string | null;
    totalTime: number | null;
  };
}

export interface OnboardingAnalytics {
  track: (event: string, properties?: Record<string, unknown>) => void;
  timeStep: (stepId: string) => void;
  recordError: (error: string, stepId?: string) => void;
  getMetrics: () => {
    totalTime: number | null;
    stepTimes: Record<string, number>;
    conversionRate: number;
    dropoffPoints: string[];
  };
}

export const useOnboarding = (
  enableAnalytics: boolean = true,
  onComplete?: (result: OnboardingResult) => void,
  onError?: (error: string, step: string) => void
) => {
  const blockchain = useRef(new PersonaBlockchain()).current;
  const startTimeRef = useRef(Date.now());

  const [state, setState] = useState<OnboardingState>({
    currentStep: 0,
    steps: [...ONBOARDING_STEPS],
    userData: {},
    privacySettings: {
      visibility: 'public',
      shareEmail: false,
      shareLocation: false,
      shareConnections: true,
    },
    selectedAuth: null,
    loading: false,
    error: null,
    progress: 0,
    result: null,
    isComplete: false,
    startTime: Date.now(),
    analytics: {
      stepStartTimes: {},
      stepCompletionTimes: {},
      errors: [],
      authMethodSelected: null,
      totalTime: null,
    }
  });

  // 📊 Analytics tracking functions
  const trackEvent = useCallback((event: string, properties?: Record<string, unknown>) => {
    if (!enableAnalytics) return;
    
    console.log('📊 Analytics:', event, properties);
    
    // Send to your analytics service (PostHog, Mixpanel, etc.)
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as unknown as { gtag: (...args: unknown[]) => void }).gtag('event', event, {
        ...properties,
        page_title: 'PersonaPass Onboarding',
        page_location: window.location.href,
      });
    }
  }, [enableAnalytics]);

  const timeStep = useCallback((stepId: string) => {
    const now = Date.now();
    setState(prev => ({
      ...prev,
      analytics: {
        ...prev.analytics,
        stepStartTimes: {
          ...prev.analytics.stepStartTimes,
          [stepId]: now
        }
      }
    }));
  }, []);

  const recordError = useCallback((error: string, stepId?: string) => {
    setState(prev => ({
      ...prev,
      analytics: {
        ...prev.analytics,
        errors: [
          ...prev.analytics.errors,
          {
            step: stepId || prev.steps[prev.currentStep]?.id || 'unknown',
            error,
            timestamp: Date.now()
          }
        ]
      }
    }));
    
    trackEvent('onboarding_error', {
      error,
      step: stepId,
      timestamp: Date.now()
    });
  }, [trackEvent]);

  const getMetrics = useCallback(() => {
    const { stepStartTimes, stepCompletionTimes, totalTime } = state.analytics;
    const stepTimes: Record<string, number> = {};
    
    Object.keys(stepCompletionTimes).forEach(stepId => {
      const start = stepStartTimes[stepId];
      const end = stepCompletionTimes[stepId];
      if (start && end) {
        stepTimes[stepId] = end - start;
      }
    });

    return {
      totalTime,
      stepTimes,
      conversionRate: state.isComplete ? 100 : (state.currentStep / state.steps.length) * 100,
      dropoffPoints: state.analytics.errors.map(e => e.step)
    };
  }, [state.analytics, state.currentStep, state.steps.length, state.isComplete]);

  // 📊 Analytics object using useMemo to prevent circular dependencies
  const analytics: OnboardingAnalytics = useMemo(() => ({
    track: trackEvent,
    timeStep,
    recordError,
    getMetrics
  }), [trackEvent, timeStep, recordError, getMetrics]);

  // 🏥 Check blockchain health on mount
  useEffect(() => {
    const checkHealth = async () => {
      const isHealthy = await blockchain.checkHealth();
      if (!isHealthy) {
        setState(prev => ({
          ...prev,
          error: 'Blockchain connection failed. Please try again later.'
        }));
        recordError('blockchain_health_check_failed', 'initialization');
      } else {
        trackEvent('blockchain_connected');
      }
    };

    checkHealth();
  }, [blockchain, recordError, trackEvent]);

  // ⏭️ Navigate to next step
  const nextStep = useCallback(() => {
    setState(prev => {
      const currentStepId = prev.steps[prev.currentStep]?.id;
      const nextStepIndex = prev.currentStep + 1;
      
      // Complete current step
      const updatedSteps = prev.steps.map((step, index) => {
        if (index === prev.currentStep) {
          return { ...step, completed: true, current: false };
        }
        if (index === nextStepIndex) {
          return { ...step, current: true };
        }
        return { ...step, current: false };
      });

      // Record step completion
      const now = Date.now();
      const newAnalytics = {
        ...prev.analytics,
        stepCompletionTimes: {
          ...prev.analytics.stepCompletionTimes,
          [currentStepId]: now,
        }
      };

      trackEvent('onboarding_step_completed', {
        step: currentStepId,
        step_number: prev.currentStep + 1,
        time_spent: now - (prev.analytics.stepStartTimes[currentStepId] || now)
      });

      // Start timing next step
      if (nextStepIndex < prev.steps.length) {
        const nextStepId = prev.steps[nextStepIndex]?.id;
        newAnalytics.stepStartTimes = {
          ...newAnalytics.stepStartTimes,
          [nextStepId]: now
        };
      }

      return {
        ...prev,
        currentStep: nextStepIndex,
        steps: updatedSteps,
        progress: ((nextStepIndex) / prev.steps.length) * 100,
        analytics: newAnalytics
      };
    });
  }, [trackEvent]);

  // ⏮️ Navigate to previous step
  const prevStep = useCallback(() => {
    setState(prev => {
      if (prev.currentStep <= 0) return prev;
      
      const prevStepIndex = prev.currentStep - 1;
      const updatedSteps = prev.steps.map((step, index) => {
        if (index === prevStepIndex) {
          return { ...step, current: true, completed: false };
        }
        return { ...step, current: false };
      });

      return {
        ...prev,
        currentStep: prevStepIndex,
        steps: updatedSteps,
        progress: (prevStepIndex / prev.steps.length) * 100,
      };
    });

    trackEvent('onboarding_step_back', {
      from_step: state.currentStep,
      to_step: state.currentStep - 1
    });
  }, [trackEvent, state.currentStep]);

  // 📝 Update user data
  const updateUserData = useCallback((data: Partial<UserMetadata>) => {
    setState(prev => ({
      ...prev,
      userData: { ...prev.userData, ...data }
    }));

    trackEvent('onboarding_data_updated', {
      fields: Object.keys(data),
      step: state.steps[state.currentStep]?.id
    });
  }, [trackEvent, state.steps, state.currentStep]);

  // 🔒 Update privacy settings
  const updatePrivacySettings = useCallback((settings: Partial<PrivacySettings>) => {
    setState(prev => ({
      ...prev,
      privacySettings: { ...prev.privacySettings, ...settings }
    }));

    trackEvent('privacy_settings_updated', {
      settings: Object.keys(settings),
      values: settings
    });
  }, [trackEvent]);

  // 🔐 Select authentication method
  const selectAuth = useCallback((auth: AuthenticationOption) => {
    setState(prev => ({
      ...prev,
      selectedAuth: auth,
      analytics: {
        ...prev.analytics,
        authMethodSelected: auth.id
      }
    }));

    trackEvent('auth_method_selected', {
      method: auth.id,
      type: auth.type,
      provider: auth.provider
    });
  }, [trackEvent]);

  // 🚀 Complete the onboarding process
  const completeOnboarding = useCallback(async () => {
    if (!state.userData.name || !state.userData.email) {
      const error = 'Name and email are required';
      setState(prev => ({ ...prev, error }));
      recordError(error, 'profile');
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));
    trackEvent('onboarding_completion_started');

    try {
      const result = await blockchain.completeAdvancedOnboarding(
        state.userData as UserMetadata,
        state.privacySettings as PrivacySettings,
        state.selectedAuth?.id || 'email'
      );

      const totalTime = Date.now() - startTimeRef.current;

      setState(prev => ({
        ...prev,
        loading: false,
        result,
        isComplete: true,
        progress: 100,
        analytics: {
          ...prev.analytics,
          totalTime
        }
      }));

      trackEvent('onboarding_completed', {
        total_time: totalTime,
        auth_method: state.selectedAuth?.id,
        did: result.did,
        tx_hashes: {
          did: result.didTxHash,
          identity: result.identityTxHash,
          credential: result.credentialTxHash
        },
        reputation_score: result.reputationScore
      });

      onComplete?.(result);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      recordError(errorMessage, 'completion');
      onError?.(errorMessage, 'completion');
    }
  }, [
    state.userData, 
    state.privacySettings, 
    state.selectedAuth, 
    blockchain, 
    trackEvent,
    recordError,
    onComplete, 
    onError
  ]);

  // 🔄 Reset onboarding
  const resetOnboarding = useCallback(() => {
    setState({
      currentStep: 0,
      steps: [...ONBOARDING_STEPS],
      userData: {},
      privacySettings: {
        visibility: 'public',
        shareEmail: false,
        shareLocation: false,
        shareConnections: true,
      },
      selectedAuth: null,
      loading: false,
      error: null,
      progress: 0,
      result: null,
      isComplete: false,
      startTime: Date.now(),
      analytics: {
        stepStartTimes: {},
        stepCompletionTimes: {},
        errors: [],
        authMethodSelected: null,
        totalTime: null,
      }
    });

    startTimeRef.current = Date.now();
    trackEvent('onboarding_reset');
  }, [trackEvent]);

  // 🎯 Skip optional step
  const skipStep = useCallback(() => {
    const currentStep = state.steps[state.currentStep];
    if (currentStep?.optional) {
      trackEvent('onboarding_step_skipped', {
        step: currentStep.id,
        step_number: state.currentStep + 1
      });
      nextStep();
    }
  }, [state.steps, state.currentStep, trackEvent, nextStep]);

  // 🔍 Validate current step
  const validateCurrentStep = useCallback((): boolean => {
    const currentStepId = state.steps[state.currentStep]?.id;
    
    switch (currentStepId) {
      case 'welcome':
        return true;
      case 'auth':
        return !!state.selectedAuth;
      case 'keys':
        return true; // Keys are generated automatically
      case 'profile':
        return !!(state.userData.name && state.userData.email);
      case 'privacy':
        return true; // Privacy settings have defaults
      case 'complete':
        return state.isComplete;
      default:
        return false;
    }
  }, [state.steps, state.currentStep, state.selectedAuth, state.userData, state.isComplete]);

  return {
    // State
    ...state,
    
    // Available options
    authOptions: AUTHENTICATION_OPTIONS.filter(option => option.available),
    
    // Navigation
    nextStep,
    prevStep,
    skipStep,
    canGoNext: validateCurrentStep(),
    canGoPrev: state.currentStep > 0,
    
    // Data updates
    updateUserData,
    updatePrivacySettings,
    selectAuth,
    
    // Actions
    completeOnboarding,
    resetOnboarding,
    
    // Utilities
    validateCurrentStep,
    blockchain,
    analytics,
    
    // Computed values
    currentStepData: state.steps[state.currentStep],
    isFirstStep: state.currentStep === 0,
    isLastStep: state.currentStep === state.steps.length - 1,
    completedSteps: state.steps.filter(step => step.completed).length,
    remainingSteps: state.steps.length - state.currentStep - 1,
  };
};

export default useOnboarding;