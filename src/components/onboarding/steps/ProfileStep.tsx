// 👤 PROFILE STEP - User Information Collection
// Comprehensive profile builder with validation

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StepProps, FormFieldProps } from './types';
import { UserMetadata } from '../../../lib/blockchain';

interface ProfileField {
  id: keyof UserMetadata;
  label: string;
  type: 'text' | 'email' | 'textarea' | 'select' | 'url';
  placeholder: string;
  required: boolean;
  validation?: (value: string) => string | null;
  options?: Array<{ value: string; label: string }>;
  description?: string;
}

const PROFILE_FIELDS: ProfileField[] = [
  {
    id: 'name',
    label: 'Full Name',
    type: 'text',
    placeholder: 'Enter your full name',
    required: true,
    validation: (value) => {
      if (!value.trim()) return 'Name is required';
      if (value.trim().length < 2) return 'Name must be at least 2 characters';
      if (!/^[a-zA-Z\s]+$/.test(value)) return 'Name can only contain letters and spaces';
      return null;
    }
  },
  {
    id: 'email',
    label: 'Email Address',
    type: 'email',
    placeholder: 'your.email@example.com',
    required: true,
    validation: (value) => {
      if (!value.trim()) return 'Email is required';
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) return 'Please enter a valid email address';
      return null;
    }
  },
  {
    id: 'username',
    label: 'Username',
    type: 'text',
    placeholder: 'Choose a unique username',
    required: false,
    validation: (value) => {
      if (!value.trim()) return null;
      if (value.length < 3) return 'Username must be at least 3 characters';
      if (!/^[a-zA-Z0-9_-]+$/.test(value)) return 'Username can only contain letters, numbers, hyphens, and underscores';
      return null;
    },
    description: 'This will be your unique identifier across the platform'
  },
  {
    id: 'bio',
    label: 'Bio',
    type: 'textarea',
    placeholder: 'Tell us about yourself...',
    required: false,
    validation: (value) => {
      if (value && value.length > 500) return 'Bio must be less than 500 characters';
      return null;
    },
    description: 'A brief description about yourself (optional)'
  },
  {
    id: 'location',
    label: 'Location',
    type: 'text',
    placeholder: 'City, Country',
    required: false,
    description: 'Your general location (optional)'
  },
  {
    id: 'website',
    label: 'Website',
    type: 'url',
    placeholder: 'https://your-website.com',
    required: false,
    validation: (value) => {
      if (!value.trim()) return null;
      try {
        new URL(value);
        return null;
      } catch {
        return 'Please enter a valid URL (including https://)';
      }
    },
    description: 'Your personal website or portfolio'
  },
  {
    id: 'occupation',
    label: 'Occupation',
    type: 'select',
    placeholder: 'Select your occupation',
    required: false,
    options: [
      { value: '', label: 'Select occupation...' },
      { value: 'developer', label: 'Software Developer' },
      { value: 'designer', label: 'Designer' },
      { value: 'entrepreneur', label: 'Entrepreneur' },
      { value: 'student', label: 'Student' },
      { value: 'researcher', label: 'Researcher' },
      { value: 'consultant', label: 'Consultant' },
      { value: 'manager', label: 'Manager' },
      { value: 'freelancer', label: 'Freelancer' },
      { value: 'artist', label: 'Artist' },
      { value: 'writer', label: 'Writer' },
      { value: 'other', label: 'Other' }
    ]
  }
];

const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  type = 'text',
  placeholder,
  required = false,
  disabled = false,
  value,
  onChange,
  error,
  helperText,
  options,
  className = ''
}) => {
  const baseClasses = `w-full px-4 py-3 border rounded-lg transition-colors duration-200 ${
    error
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
      : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500'
  } bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${className}`;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      {type === 'textarea' ? (
        <textarea
          name={name}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          className={baseClasses}
        />
      ) : type === 'select' ? (
        <select
          name={name}
          required={required}
          disabled={disabled}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={baseClasses}
        >
          {options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          name={name}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={baseClasses}
        />
      )}
      
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-500 text-sm flex items-center space-x-1"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </motion.div>
      )}
      
      {helperText && !error && (
        <div className="text-gray-500 dark:text-gray-400 text-sm">
          {helperText}
        </div>
      )}
    </div>
  );
};

const ProfileStep: React.FC<StepProps> = ({
  userData,
  onUpdateUserData,
  onNext,
  loading,
  stepData
}) => {
  const [formData, setFormData] = useState<Partial<UserMetadata>>(userData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isValidating, setIsValidating] = useState(false);

  // Update form data when userData changes
  useEffect(() => {
    setFormData(userData);
  }, [userData]);

  const handleFieldChange = (fieldId: keyof UserMetadata, value: string) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
    
    // Clear error when user starts typing
    if (errors[fieldId]) {
      setErrors(prev => ({ ...prev, [fieldId]: '' }));
    }
    
    // Real-time validation for email
    if (fieldId === 'email' && value) {
      const field = PROFILE_FIELDS.find(f => f.id === fieldId);
      const error = field?.validation?.(value);
      if (error) {
        setErrors(prev => ({ ...prev, [fieldId]: error }));
      }
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    PROFILE_FIELDS.forEach(field => {
      const value = formData[field.id] as string || '';
      const error = field.validation?.(value);
      
      if (error) {
        newErrors[field.id] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    setIsValidating(true);
    
    if (validateForm()) {
      // Update parent component with form data
      onUpdateUserData(formData);
      
      // Simulate async validation (checking username availability, etc.)
      await new Promise(resolve => setTimeout(resolve, 500));
      
      onNext();
    }
    
    setIsValidating(false);
  };

  const requiredFields = PROFILE_FIELDS.filter(field => field.required);
  const requiredFieldsComplete = requiredFields.every(field => {
    const value = formData[field.id] as string;
    return value && value.trim() && !errors[field.id];
  });

  const completionPercentage = Math.round(
    (PROFILE_FIELDS.filter(field => {
      const value = formData[field.id] as string;
      return value && value.trim();
    }).length / PROFILE_FIELDS.length) * 100
  );

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full mx-auto mb-6 flex items-center justify-center">
          <span className="text-2xl">👤</span>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Complete Your Profile
        </h1>
        
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">
          Help others recognize and connect with you by completing your profile.
        </p>

        {/* Progress Indicator */}
        <div className="max-w-xs mx-auto">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>Profile Completion</span>
            <span>{completionPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <motion.div
              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${completionPercentage}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </motion.div>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-6 mb-8"
      >
        {PROFILE_FIELDS.map((field, index) => (
          <motion.div
            key={field.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 + 0.3 }}
          >
            <FormField
              label={field.label}
              name={field.id}
              type={field.type}
              placeholder={field.placeholder}
              required={field.required}
              disabled={loading}
              value={(formData[field.id] as string) || ''}
              onChange={(value) => handleFieldChange(field.id, value)}
              error={errors[field.id]}
              helperText={field.description}
              options={field.options}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Required Fields Notice */}
      {!requiredFieldsComplete && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg"
        >
          <div className="flex items-start space-x-3">
            <div className="text-amber-500 mt-0.5">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-amber-800 dark:text-amber-200 mb-1">
                Complete Required Fields
              </h3>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Please fill in all required fields (marked with *) to continue.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Success Message */}
      <AnimatePresence>
        {requiredFieldsComplete && Object.keys(errors).length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg"
          >
            <div className="flex items-center space-x-3">
              <div className="text-green-500">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-green-800 dark:text-green-200">
                  Profile Ready!
                </h3>
                <p className="text-sm text-green-700 dark:text-green-300">
                  All required information has been provided. You can continue to the next step.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Continue Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="text-center"
      >
        <button
          onClick={handleSubmit}
          disabled={!requiredFieldsComplete || isValidating || loading}
          className={`px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 ${
            requiredFieldsComplete && !isValidating && !loading
              ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600 shadow-lg hover:shadow-xl transform hover:-translate-y-1'
              : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
          }`}
        >
          {isValidating || loading ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Validating...</span>
            </div>
          ) : (
            'Continue to Privacy Settings →'
          )}
        </button>
      </motion.div>

      {/* Privacy Notice */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400"
      >
        <div className="flex items-center justify-center space-x-2 mb-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          <span>Your information is encrypted and secure</span>
        </div>
        <p>
          You control who can see your profile information. 
          Configure your privacy settings in the next step.
        </p>
      </motion.div>
    </div>
  );
};

export default ProfileStep;