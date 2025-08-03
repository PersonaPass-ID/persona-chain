// Credential Management Page
// Comprehensive credential lifecycle management with history, analytics, and renewals

'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { WalletConnectService } from '@/lib/wallet-connect-service'
import { personaChainService } from '@/lib/personachain-service'
import { credentialManagementService } from '@/lib/credential-management-service'
import type { PersonaChainCredential } from '@/lib/personachain-service'
import type { CredentialInsights, CredentialHistory, RenewalStatus } from '@/lib/credential-management-service'

export default function CredentialManagementPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [walletInfo, setWalletInfo] = useState<any>(null)
  const [credentials, setCredentials] = useState<PersonaChainCredential[]>([])
  const [insights, setInsights] = useState<CredentialInsights | null>(null)
  const [selectedCredential, setSelectedCredential] = useState<PersonaChainCredential | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRenewing, setIsRenewing] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'analytics' | 'renewals'>('overview')

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/')
      return
    }

    loadWalletInfo()
  }, [session, status, router])

  useEffect(() => {
    if (walletInfo?.address) {
      loadCredentials()
      loadInsights()
    }
  }, [walletInfo])

  const loadWalletInfo = async () => {
    try {
      const walletService = new WalletConnectService()
      const wallet = await walletService.getConnectedWallet()
      setWalletInfo(wallet)
    } catch (error) {
      console.error('Failed to load wallet info:', error)
    }
  }

  const loadCredentials = async () => {
    try {
      if (!walletInfo?.address) return

      const chainCredentials = await personaChainService.getCredentials(walletInfo.address)
      setCredentials(chainCredentials)
      
      if (chainCredentials.length > 0 && !selectedCredential) {
        setSelectedCredential(chainCredentials[0])
      }
    } catch (error) {
      console.error('Failed to load credentials:', error)
    }
  }

  const loadInsights = async () => {
    try {
      if (!walletInfo?.address) return

      const credInsights = await credentialManagementService.getCredentialInsights(walletInfo.address)
      setInsights(credInsights)
      setIsLoading(false)
    } catch (error) {
      console.error('Failed to load insights:', error)
      setIsLoading(false)
    }
  }

  const handleRenewCredential = async (renewal: RenewalStatus) => {
    try {
      if (!walletInfo?.address) return

      setIsRenewing(true)
      const renewedCredential = await credentialManagementService.renewCredential(
        walletInfo.address,
        renewal.credentialId,
        renewal.renewalReason
      )

      // Reload credentials and insights
      await loadCredentials()
      await loadInsights()

      alert('Credential renewed successfully!')
    } catch (error) {
      console.error('Failed to renew credential:', error)
      alert('Failed to renew credential. Please try again.')
    } finally {
      setIsRenewing(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getActionIcon = (action: CredentialHistory['action']) => {
    const icons = {
      created: '🎉',
      renewed: '🔄',
      shared: '📤',
      verified: '✅',
      revoked: '❌',
      expired: '⏰'
    }
    return icons[action] || '📝'
  }

  const getActionColor = (action: CredentialHistory['action']) => {
    const colors = {
      created: 'text-green-600',
      renewed: 'text-blue-600',
      shared: 'text-purple-600',
      verified: 'text-green-600',
      revoked: 'text-red-600',
      expired: 'text-orange-600'
    }
    return colors[action] || 'text-gray-600'
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Credential Management</h1>
              <p className="text-sm text-gray-600 mt-1">Manage, analyze, and renew your verifiable credentials</p>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="text-blue-600 hover:text-blue-800 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Stats */}
        {insights && (
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-600">Active Credentials</h3>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{insights.activeCredentials}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-600">Total Shares</h3>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{insights.totalShares}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-600">Trust Score</h3>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{insights.averageTrustScore}%</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-600">Success Rate</h3>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{insights.performanceMetrics.verificationSuccessRate}%</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-2 px-6 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`py-2 px-6 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'history'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                History
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`py-2 px-6 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'analytics'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Analytics
              </button>
              <button
                onClick={() => setActiveTab('renewals')}
                className={`py-2 px-6 border-b-2 font-medium text-sm transition-colors relative ${
                  activeTab === 'renewals'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Renewals
                {insights && insights.renewalAlerts.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Credentials</h3>
                
                {credentials.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">No credentials found. Create your first credential to get started.</p>
                    <button
                      onClick={() => router.push('/login')}
                      className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Create Credential
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {credentials.map((credential) => {
                      const analytics = insights ? 
                        credentialManagementService.getCredentialAnalytics(walletInfo.address, credential.id) : 
                        null

                      return (
                        <div
                          key={credential.id}
                          className={`border rounded-lg p-6 cursor-pointer transition-colors ${
                            selectedCredential?.id === credential.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => setSelectedCredential(credential)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center">
                              <div className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center mr-4">
                                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                                </svg>
                              </div>
                              <div>
                                <h4 className="text-lg font-semibold text-gray-900">
                                  GitHub Developer Credential
                                </h4>
                                <p className="text-sm text-gray-600">
                                  @{credential.credentialData.credentialSubject.githubUsername}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Created: {formatDate(credential.timestamp)}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                credential.status === 'active' 
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}>
                                {credential.status}
                              </span>
                              {analytics && (
                                <div className="mt-2 text-sm text-gray-600">
                                  <p>Trust: {analytics.trustScore}%</p>
                                  <p>Shares: {analytics.totalShares}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && insights && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity History</h3>
                
                {insights.recentActivity.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">No activity recorded yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {insights.recentActivity.map((event) => (
                      <div key={event.id} className="flex items-start space-x-3">
                        <div className="flex-shrink-0 text-2xl">
                          {getActionIcon(event.action)}
                        </div>
                        <div className="flex-1">
                          <p className={`font-medium ${getActionColor(event.action)}`}>
                            {event.description}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            {formatDate(event.timestamp)}
                          </p>
                          {event.metadata.txHash && (
                            <p className="text-xs text-gray-400 mt-1 font-mono">
                              Tx: {event.metadata.txHash.slice(0, 20)}...
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && selectedCredential && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Credential Analytics</h3>
                
                {(() => {
                  const analytics = credentialManagementService.getCredentialAnalytics(
                    walletInfo.address,
                    selectedCredential.id
                  )
                  
                  return (
                    <div className="space-y-6">
                      {/* Usage Stats */}
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-gray-600 mb-2">Total Shares</h4>
                          <p className="text-2xl font-bold text-gray-900">{analytics.totalShares}</p>
                          {analytics.lastShared && (
                            <p className="text-xs text-gray-500 mt-1">
                              Last: {formatDate(analytics.lastShared)}
                            </p>
                          )}
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-gray-600 mb-2">Verifications</h4>
                          <p className="text-2xl font-bold text-gray-900">{analytics.totalVerifications}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Success: {analytics.successfulVerifications}/{analytics.totalVerifications}
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-gray-600 mb-2">Usage Pattern</h4>
                          <p className="text-2xl font-bold text-gray-900 capitalize">{analytics.usagePattern}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Popularity: {analytics.popularityScore}/100
                          </p>
                        </div>
                      </div>

                      {/* Recommendations */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                        <h4 className="font-semibold text-blue-900 mb-3">💡 Recommendations</h4>
                        <ul className="space-y-2">
                          {analytics.recommendations.map((rec, index) => (
                            <li key={index} className="text-sm text-blue-800 flex items-start">
                              <span className="mr-2">•</span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Trust Score Visualization */}
                      <div className="bg-gray-50 rounded-lg p-6">
                        <h4 className="font-medium text-gray-900 mb-4">Trust Score Analysis</h4>
                        <div className="relative pt-1">
                          <div className="flex mb-2 items-center justify-between">
                            <div>
                              <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                                Trust Level
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-semibold inline-block text-blue-600">
                                {analytics.trustScore}%
                              </span>
                            </div>
                          </div>
                          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
                            <div
                              style={{ width: `${analytics.trustScore}%` }}
                              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-500"
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </div>
            )}

            {/* Renewals Tab */}
            {activeTab === 'renewals' && insights && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Renewal Management</h3>
                
                {insights.renewalAlerts.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-gray-600">All credentials are up to date!</p>
                    <p className="text-sm text-gray-500 mt-2">No renewals required at this time.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {insights.renewalAlerts.map((renewal) => {
                      const credential = credentials.find(c => c.id === renewal.credentialId)
                      if (!credential) return null

                      return (
                        <div key={renewal.credentialId} className="border border-orange-200 bg-orange-50 rounded-lg p-6">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">
                                Renewal Recommended: @{credential.credentialData.credentialSubject.githubUsername}
                              </h4>
                              <p className="text-sm text-gray-600 mb-3">
                                Reason: {renewal.renewalReason.replace('_', ' ').charAt(0).toUpperCase() + 
                                renewal.renewalReason.replace('_', ' ').slice(1)}
                              </p>
                              {renewal.daysUntilExpiry && (
                                <p className="text-sm text-orange-600 font-medium mb-3">
                                  Expires in {renewal.daysUntilExpiry} days
                                </p>
                              )}
                              <div className="mb-4">
                                <h5 className="text-sm font-medium text-gray-700 mb-2">Benefits of renewal:</h5>
                                <ul className="text-sm text-gray-600 space-y-1">
                                  {renewal.benefits.map((benefit, index) => (
                                    <li key={index} className="flex items-start">
                                      <span className="text-green-500 mr-2">✓</span>
                                      {benefit}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                            <button
                              onClick={() => handleRenewCredential(renewal)}
                              disabled={isRenewing || !renewal.isEligible}
                              className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isRenewing ? 'Renewing...' : 'Renew Now'}
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Renewal Policy */}
                <div className="mt-8 bg-gray-50 rounded-lg p-6">
                  <h4 className="font-medium text-gray-900 mb-3">📋 Renewal Policy</h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p><strong>GitHub Credentials:</strong> Recommended renewal every 90 days to ensure data freshness</p>
                    <p><strong>Security Updates:</strong> Mandatory renewal when critical security updates are available</p>
                    <p><strong>Cost:</strong> All renewals are currently free of charge</p>
                    <p><strong>Process:</strong> Renewal fetches latest data and creates a new version of your credential</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}