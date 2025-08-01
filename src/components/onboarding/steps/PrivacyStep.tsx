// 🔒 PRIVACY STEP - Privacy Controls and Data Sharing
// Comprehensive privacy dashboard with granular controls

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StepProps } from './types';
import { PrivacySettings } from '../../../lib/blockchain';

interface PrivacySetting {
  id: keyof PrivacySettings;
  title: string;
  description: string;
  category: 'profile' | 'data' | 'communication' | 'blockchain';
  type: 'boolean' | 'select';
  defaultValue: string | boolean;
  options?: Array<{ value: string | boolean; label: string; description?: string }>;
  recommended?: string | boolean;
  impact: 'low' | 'medium' | 'high';
  icon: string;
}

const PRIVACY_SETTINGS: PrivacySetting[] = [
  // Profile Visibility
  {
    id: 'visibility',
    title: 'Profile Visibility',
    description: 'Who can view your profile information',
    category: 'profile',
    type: 'select',
    defaultValue: 'public',
    recommended: 'connections',
    impact: 'high',
    icon: '👁️',
    options: [
      { 
        value: 'public', 
        label: 'Public', 
        description: 'Anyone can view your profile' 
      },
      { 
        value: 'connections', 
        label: 'Connections Only', 
        description: 'Only people you\'re connected with can view your profile' 
      },
      { 
        value: 'private', 
        label: 'Private', 
        description: 'Only you can view your profile' 
      }
    ]
  },
  
  // Data Sharing
  {
    id: 'shareEmail',
    title: 'Share Email Address',
    description: 'Allow others to see your email address',
    category: 'data',
    type: 'boolean',
    defaultValue: false,
    recommended: false,
    impact: 'medium',
    icon: '📧'
  },
  {
    id: 'shareLocation',
    title: 'Share Location',
    description: 'Show your location on your profile',
    category: 'data',
    type: 'boolean',
    defaultValue: false,
    recommended: false,
    impact: 'medium',
    icon: '📍'
  },
  {
    id: 'shareConnections',
    title: 'Share Connections',
    description: 'Allow others to see who you\'re connected with',
    category: 'data',
    type: 'boolean',
    defaultValue: true,
    recommended: true,
    impact: 'low',
    icon: '🤝'
  },
  
  // Communication
  {
    id: 'allowMessages',
    title: 'Allow Messages',
    description: 'Let others send you direct messages',
    category: 'communication',
    type: 'select',
    defaultValue: 'connections',
    recommended: 'connections',
    impact: 'medium',
    icon: '💬',
    options: [
      { value: 'everyone', label: 'Everyone', description: 'Anyone can message you' },
      { value: 'connections', label: 'Connections Only', description: 'Only your connections can message you' },
      { value: 'nobody', label: 'Nobody', description: 'No one can message you' }
    ]
  },
  {
    id: 'emailNotifications',
    title: 'Email Notifications',
    description: 'Receive email notifications for important updates',
    category: 'communication',
    type: 'boolean',
    defaultValue: true,
    recommended: true,
    impact: 'low',
    icon: '🔔'
  },
  
  // Blockchain & Analytics
  {
    id: 'analyticsOptIn',
    title: 'Analytics & Insights',
    description: 'Help improve the platform by sharing anonymous usage data',
    category: 'blockchain',
    type: 'boolean',
    defaultValue: true,
    recommended: true,
    impact: 'low',
    icon: '📊'
  },
  {
    id: 'showActivity',
    title: 'Show Activity',
    description: 'Display your recent blockchain activity on your profile',
    category: 'blockchain',
    type: 'boolean',
    defaultValue: true,
    recommended: true,
    impact: 'low',
    icon: '⚡'
  },
  {
    id: 'showReputation',
    title: 'Show Reputation Score',
    description: 'Display your reputation score publicly',
    category: 'blockchain',
    type: 'boolean',
    defaultValue: true,
    recommended: true,
    impact: 'medium',
    icon: '⭐'
  }
];

const CATEGORIES = [
  { id: 'profile', name: 'Profile', icon: '👤', description: 'Control who can see your profile' },
  { id: 'data', name: 'Data Sharing', icon: '📋', description: 'Manage what information is shared' },
  { id: 'communication', name: 'Communication', icon: '💬', description: 'Control how others can contact you' },
  { id: 'blockchain', name: 'Blockchain', icon: '🔗', description: 'Manage your on-chain presence' }
];

const PrivacyStep: React.FC<StepProps> = ({
  privacySettings,
  onUpdatePrivacySettings,
  onNext,
  loading,
  stepData
}) => {
  const [settings, setSettings] = useState<Partial<PrivacySettings>>(privacySettings);
  const [activeCategory, setActiveCategory] = useState<string>('profile');
  const [showRecommended, setShowRecommended] = useState(false);

  // Update settings when props change
  useEffect(() => {
    setSettings(privacySettings);
  }, [privacySettings]);

  const handleSettingChange = (settingId: keyof PrivacySettings, value: string | boolean) => {
    const newSettings = { ...settings, [settingId]: value };
    setSettings(newSettings);
    onUpdatePrivacySettings(newSettings);
  };

  const applyRecommendedSettings = () => {
    const recommendedSettings: Partial<PrivacySettings> = {};
    
    PRIVACY_SETTINGS.forEach(setting => {
      if (setting.recommended !== undefined) {
        // @ts-expect-error - Type assertion needed for dynamic property assignment
        recommendedSettings[setting.id] = setting.recommended;
      }
    });
    
    setSettings(prev => ({ ...prev, ...recommendedSettings }));
    onUpdatePrivacySettings({ ...settings, ...recommendedSettings });
  };

  const getPrivacyScore = (): { score: number; level: string; color: string } => {
    let score = 0;
    let totalWeight = 0;
    
    PRIVACY_SETTINGS.forEach(setting => {
      const weight = setting.impact === 'high' ? 3 : setting.impact === 'medium' ? 2 : 1;
      totalWeight += weight;
      
      const currentValue = settings[setting.id];
      let settingScore = 0;
      
      if (setting.type === 'boolean') {
        // For boolean settings, privacy-focused = higher score
        settingScore = currentValue ? 0 : 1;
        if (setting.id === 'shareConnections' || setting.id === 'analyticsOptIn' || setting.id === 'emailNotifications') {
          settingScore = currentValue ? 1 : 0; // These are beneficial when enabled
        }
      } else {
        // For select settings
        if (setting.id === 'visibility') {
          settingScore = currentValue === 'private' ? 1 : currentValue === 'connections' ? 0.7 : 0.3;
        } else if (setting.id === 'allowMessages') {
          settingScore = currentValue === 'nobody' ? 1 : currentValue === 'connections' ? 0.7 : 0.3;
        }
      }
      
      score += settingScore * weight;
    });
    
    const normalizedScore = Math.round((score / totalWeight) * 100);
    
    let level: string;
    let color: string;
    
    if (normalizedScore >= 80) {
      level = 'High Privacy';
      color = 'text-green-600';
    } else if (normalizedScore >= 60) {
      level = 'Balanced';
      color = 'text-blue-600';
    } else if (normalizedScore >= 40) {
      level = 'Open';
      color = 'text-yellow-600';
    } else {
      level = 'Very Open';
      color = 'text-orange-600';
    }
    
    return { score: normalizedScore, level, color };
  };

  const privacyScore = getPrivacyScore();
  const filteredSettings = PRIVACY_SETTINGS.filter(setting => setting.category === activeCategory);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full mx-auto mb-6 flex items-center justify-center">
          <span className="text-2xl">🔒</span>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Configure Your Privacy
        </h1>
        
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
          Take control of your data and decide how you want to interact with the PersonaPass community.
        </p>

        {/* Privacy Score */}
        <div className="max-w-md mx-auto">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Privacy Level
              </h3>
              <span className={`font-bold ${privacyScore.color}`}>
                {privacyScore.level}
              </span>
            </div>
            
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-2">
              <motion.div
                className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${privacyScore.score}%` }}
                transition={{ duration: 0.8 }}
              />
            </div>
            
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {privacyScore.score}/100 Privacy Score
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Category Navigation */}
        <div className="lg:col-span-1">
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Categories</h3>
              <button
                onClick={() => setShowRecommended(!showRecommended)}
                className="text-blue-500 hover:text-blue-600 text-sm font-medium"
              >
                {showRecommended ? 'Hide' : 'Show'} Tips
              </button>
            </div>
            
            {CATEGORIES.map((category) => (
              <motion.button
                key={category.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveCategory(category.id)}
                className={`w-full text-left p-4 rounded-lg transition-all duration-200 ${
                  activeCategory === category.id
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500'
                    : 'bg-gray-50 dark:bg-gray-700 border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-xl">{category.icon}</span>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {category.name}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      {category.description}
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}

            {/* Quick Actions */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={applyRecommendedSettings}
                className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-lg font-medium transition-colors mb-3"
              >
                ✨ Apply Recommended
              </button>
              
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Applies our recommended privacy settings for the best balance of security and functionality.
              </div>
            </div>
          </div>
        </div>

        {/* Settings Panel */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {CATEGORIES.find(c => c.id === activeCategory)?.name} Settings
                </h2>
                
                {showRecommended && (
                  <div className="text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full">
                    💡 Recommended settings highlighted
                  </div>
                )}
              </div>

              {filteredSettings.map((setting, index) => {
                const currentValue = settings[setting.id];
                const isRecommended = currentValue === setting.recommended;

                return (
                  <motion.div
                    key={setting.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-6 rounded-xl border-2 transition-all duration-200 ${
                      isRecommended && showRecommended
                        ? 'border-green-300 bg-green-50 dark:bg-green-900/20 dark:border-green-700'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="text-2xl">{setting.icon}</div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {setting.title}
                            </h3>
                            
                            {setting.impact === 'high' && (
                              <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                                High Impact
                              </span>
                            )}
                            
                            {isRecommended && showRecommended && (
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                ⭐ Recommended
                              </span>
                            )}
                          </div>
                          
                          <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                            {setting.description}
                          </p>

                          {/* Control */}
                          {setting.type === 'boolean' ? (
                            <label className="flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={(currentValue as boolean) || false}
                                onChange={(e) => handleSettingChange(setting.id, e.target.checked)}
                                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                              <span className="ml-3 text-sm font-medium text-gray-900 dark:text-white">
                                {currentValue ? 'Enabled' : 'Disabled'}
                              </span>
                            </label>
                          ) : (
                            <select
                              value={(currentValue as string) || (setting.defaultValue as string)}
                              onChange={(e) => handleSettingChange(setting.id, e.target.value)}
                              className="w-full max-w-xs px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                            >
                              {setting.options?.map((option) => (
                                <option key={String(option.value)} value={String(option.value)}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          )}

                          {/* Option Description */}
                          {setting.type === 'select' && setting.options && (
                            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                              {setting.options.find(opt => opt.value === currentValue)?.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Continue Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="text-center mt-12"
      >
        <button
          onClick={onNext}
          disabled={loading}
          className={`px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 ${
            !loading
              ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white hover:from-green-600 hover:to-blue-600 shadow-lg hover:shadow-xl transform hover:-translate-y-1'
              : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
          }`}
        >
          {loading ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Creating Identity...</span>
            </div>
          ) : (
            'Create My Digital Identity 🚀'
          )}
        </button>
        
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
          You can change these settings anytime from your account dashboard
        </p>
      </motion.div>
    </div>
  );
};

export default PrivacyStep;