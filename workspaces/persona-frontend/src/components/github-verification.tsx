// GitHub Developer Verification Component
// Simple UI for GitHub credential generation

import React, { useState } from 'react';
import { GitHubVerificationRequest, GitHubVerificationResponse } from '../pages/api/github/verify';

interface GitHubVerificationProps {
  userId: string;
  onSuccess?: (credential: any) => void;
  onError?: (error: string) => void;
}

export const GitHubVerification: React.FC<GitHubVerificationProps> = ({
  userId,
  onSuccess,
  onError
}) => {
  const [githubUsername, setGithubUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['contributions', 'repositories']);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const credentialOptions = [
    { id: 'contributions', label: 'Contributions & Commits', description: 'Prove coding activity' },
    { id: 'repositories', label: 'Repository Stats', description: 'Show repo count and stars' },
    { id: 'languages', label: 'Programming Languages', description: 'Demonstrate language expertise' },
    { id: 'organizations', label: 'Organization Membership', description: 'Verify company/org affiliations' }
  ];

  const handleVerification = async () => {
    if (!githubUsername.trim()) {
      setError('Please enter your GitHub username');
      return;
    }

    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      const request: GitHubVerificationRequest = {
        githubUsername: githubUsername.trim(),
        userId,
        credentialTypes: selectedTypes as any[]
      };

      const response = await fetch('/api/github/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      const data: GitHubVerificationResponse = await response.json();

      if (data.success && data.credential) {
        setResult(data.credential);
        onSuccess?.(data.credential);
        
        // Show success message
        setError('');
      } else {
        setError(data.error || 'Verification failed');
        onError?.(data.error || 'Verification failed');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Network error occurred';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCredentialType = (type: string) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const formatCredentialData = (credential: any) => {
    const subject = credential.credentialSubject;
    return {
      'GitHub Username': subject.githubUsername,
      'Account Age': `${subject.accountAgeMonths} months`,
      'Total Repositories': subject.totalRepositories,
      'Total Stars': subject.totalStars,
      'Total Commits': subject.totalCommits,
      'Contributions (365d)': subject.contributions365Days,
      'Organizations': subject.organizations?.join(', ') || 'None',
      'Top Languages': Object.keys(subject.topLanguages || {}).slice(0, 3).join(', ')
    };
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          💻 GitHub Developer Verification
        </h2>
        <p className="text-gray-600">
          Verify your developer credentials using your GitHub profile. This creates a privacy-preserving 
          credential that proves your coding experience without revealing specific details.
        </p>
      </div>

      {/* GitHub Username Input */}
      <div className="mb-6">
        <label htmlFor="githubUsername" className="block text-sm font-medium text-gray-700 mb-2">
          GitHub Username
        </label>
        <div className="flex">
          <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
            github.com/
          </span>
          <input
            type="text"
            id="githubUsername"
            value={githubUsername}
            onChange={(e) => setGithubUsername(e.target.value)}
            placeholder="your-username"
            className="flex-1 rounded-none rounded-r-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Credential Type Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          What would you like to verify?
        </label>
        <div className="space-y-3">
          {credentialOptions.map((option) => (
            <label key={option.id} className="flex items-start">
              <input
                type="checkbox"
                checked={selectedTypes.includes(option.id)}
                onChange={() => toggleCredentialType(option.id)}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                disabled={isLoading}
              />
              <div className="ml-3">
                <div className="text-sm font-medium text-gray-900">{option.label}</div>
                <div className="text-sm text-gray-500">{option.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Verification Button */}
      <button
        onClick={handleVerification}
        disabled={isLoading || !githubUsername.trim() || selectedTypes.length === 0}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Verifying GitHub Profile...
          </div>
        ) : (
          `Verify Developer Credentials ($0.05)`
        )}
      </button>

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Verification Failed</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Success Display */}
      {result && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-green-800">✅ Verification Successful!</h3>
              <div className="mt-2 text-sm text-green-700">
                Your GitHub developer credential has been created and stored securely.
              </div>
              
              {/* Credential Details */}
              <details className="mt-3">
                <summary className="text-sm font-medium text-green-800 cursor-pointer">
                  View Credential Details
                </summary>
                <div className="mt-2 bg-white p-3 rounded border">
                  <dl className="grid grid-cols-1 gap-2 text-xs">
                    {Object.entries(formatCredentialData(result)).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <dt className="font-medium text-gray-600">{key}:</dt>
                        <dd className="text-gray-900">{value || 'N/A'}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </details>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Note */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="text-sm text-blue-800">
          <strong>💰 Cost:</strong> $0.05 per verification
          <br />
          <strong>🔒 Privacy:</strong> Your data never leaves your device - only cryptographic proofs are shared
          <br />
          <strong>⏱️ Validity:</strong> Credentials expire after 3 months for security
        </div>
      </div>
    </div>
  );
};

export default GitHubVerification;