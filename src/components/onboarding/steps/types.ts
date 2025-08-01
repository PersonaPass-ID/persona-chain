// 📝 SHARED TYPES FOR ONBOARDING STEPS
// Type definitions for all step components

import { 
  UserMetadata, 
  PrivacySettings, 
  AuthenticationOption, 
  OnboardingResult,
  OnboardingStep 
} from '../../../lib/blockchain';

export interface StepProps {
  // Data
  userData: Partial<UserMetadata>;
  privacySettings: Partial<PrivacySettings>;
  selectedAuth: AuthenticationOption | null;
  authOptions: AuthenticationOption[];
  loading: boolean;
  result: OnboardingResult | null;
  
  // Callbacks
  onUpdateUserData: (data: Partial<UserMetadata>) => void;
  onUpdatePrivacySettings: (settings: Partial<PrivacySettings>) => void;
  onSelectAuth: (auth: AuthenticationOption) => void;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  onComplete: () => Promise<void>;
  onReset: () => void;
  
  // State
  canGoNext: boolean;
  canGoPrev: boolean;
  isFirstStep: boolean;
  isLastStep: boolean;
  stepData: OnboardingStep | undefined;
}

export interface FormFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'password' | 'textarea' | 'select' | 'url';
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  helperText?: string;
  options?: Array<{ value: string; label: string }>;
  className?: string;
}

export interface SecurityIndicatorProps {
  level: 'low' | 'medium' | 'high' | 'maximum';
  features: string[];
  className?: string;
}

export interface ProgressIndicatorProps {
  steps: string[];
  currentStep: number;
  completedSteps: number[];
  className?: string;
}