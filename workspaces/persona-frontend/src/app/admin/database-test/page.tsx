'use client'

/**
 * DATABASE TESTING PAGE
 * For verifying DID-authentication linkage
 * WARNING: Remove this page in production!
 */

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Database, Search, User, Shield, Wallet, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

export default function DatabaseTestPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState('')
  const [searchParams, setSearchParams] = useState({
    action: 'list-recent',
    email: '',
    did: '',
    wallet: ''
  })

  const runTest = async () => {
    setIsLoading(true)
    setError('')
    setResults(null)

    try {
      const params = new URLSearchParams()
      params.append('action', searchParams.action)
      
      if (searchParams.email) params.append('email', searchParams.email)
      if (searchParams.did) params.append('did', searchParams.did)
      if (searchParams.wallet) params.append('wallet', searchParams.wallet)

      const response = await fetch(`/api/admin/test-database?${params.toString()}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Test failed')
      }

      setResults(data)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const StatusIcon = ({ condition }: { condition: boolean | null }) => {
    if (condition === null) return <AlertCircle className="w-4 h-4 text-yellow-400" />
    return condition ? <CheckCircle className="w-4 h-4 text-green-400" /> : <XCircle className="w-4 h-4 text-red-400" />
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <Database className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Database Testing</h1>
          <p className="text-gray-400">Verify DID-Authentication linkage</p>
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 mt-4">
            <p className="text-red-400 text-sm">⚠️ WARNING: Remove this page in production!</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Test Controls */}
          <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
              <Search className="w-5 h-5 mr-2" />
              Database Queries
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Test Action</label>
                <select
                  value={searchParams.action}
                  onChange={(e) => setSearchParams(prev => ({ ...prev, action: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                >
                  <option value="list-recent">List Recent Records</option>
                  <option value="check-user">Check User by Email</option>
                  <option value="check-did">Check DID Record</option>
                  <option value="check-wallet">Check Wallet Address</option>
                </select>
              </div>

              {searchParams.action === 'check-user' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                  <input
                    type="email"
                    value={searchParams.email}
                    onChange={(e) => setSearchParams(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="test@example.com"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400"
                  />
                </div>
              )}

              {searchParams.action === 'check-did' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">DID</label>
                  <input
                    type="text"
                    value={searchParams.did}
                    onChange={(e) => setSearchParams(prev => ({ ...prev, did: e.target.value }))}
                    placeholder="did:persona:personachain-1:..."
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400"
                  />
                </div>
              )}

              {searchParams.action === 'check-wallet' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Wallet Address</label>
                  <input
                    type="text"
                    value={searchParams.wallet}
                    onChange={(e) => setSearchParams(prev => ({ ...prev, wallet: e.target.value }))}
                    placeholder="persona1..."
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400"
                  />
                </div>
              )}

              <button
                onClick={runTest}
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Running Test...' : 'Run Test'}
              </button>
            </div>
          </div>

          {/* Results */}
          <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-6">Test Results</h2>

            {error && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-4">
                <p className="text-red-400">{error}</p>
              </div>
            )}

            {results && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Success Status */}
                <div className="flex items-center space-x-2 mb-4">
                  <StatusIcon condition={results.success} />
                  <span className={results.success ? 'text-green-400' : 'text-red-400'}>
                    {results.success ? 'Test Completed' : 'Test Failed'}
                  </span>
                </div>

                {/* User Check Results */}
                {searchParams.action === 'check-user' && results.user && (
                  <div className="space-y-3">
                    <div className="bg-gray-700/50 rounded-lg p-4">
                      <h3 className="font-medium text-white mb-3 flex items-center">
                        <User className="w-4 h-4 mr-2" />
                        User Record
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Email:</span>
                          <span className="text-white font-mono">{results.user.email}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">DID:</span>
                          <span className="text-white font-mono text-xs">{results.user.did || 'None'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Auth Method:</span>
                          <span className="text-white">{results.user.auth_method}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Verified:</span>
                          <StatusIcon condition={results.user.is_verified} />
                        </div>
                      </div>
                    </div>

                    {results.linkage && (
                      <div className="bg-gray-700/50 rounded-lg p-4">
                        <h3 className="font-medium text-white mb-3 flex items-center">
                          <Shield className="w-4 h-4 mr-2" />
                          Linkage Status
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400">User has DID:</span>
                            <StatusIcon condition={results.linkage.user_has_did} />
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400">DID record exists:</span>
                            <StatusIcon condition={results.linkage.did_record_exists} />
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400">Wallet addresses match:</span>
                            <StatusIcon condition={results.linkage.wallet_addresses_match} />
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400">DID values match:</span>
                            <StatusIcon condition={results.linkage.did_values_match} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Recent Records */}
                {searchParams.action === 'list-recent' && (
                  <div className="space-y-4">
                    <div className="bg-gray-700/50 rounded-lg p-4">
                      <h3 className="font-medium text-white mb-3">Recent Users ({results.user_count})</h3>
                      {results.recent_users?.length > 0 ? (
                        <div className="space-y-2">
                          {results.recent_users.slice(0, 5).map((user: any, index: number) => (
                            <div key={index} className="text-xs border-l-2 border-blue-500 pl-3">
                              <div className="text-white">{user.email}</div>
                              <div className="text-gray-400">DID: {user.did ? user.did.slice(0, 30) + '...' : 'None'}</div>
                              <div className="text-gray-500">{new Date(user.created_at).toLocaleString()}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-400 text-sm">No users found</p>
                      )}
                    </div>

                    <div className="bg-gray-700/50 rounded-lg p-4">
                      <h3 className="font-medium text-white mb-3">Recent DIDs ({results.did_count})</h3>
                      {results.recent_dids?.length > 0 ? (
                        <div className="space-y-2">
                          {results.recent_dids.slice(0, 5).map((did: any, index: number) => (
                            <div key={index} className="text-xs border-l-2 border-purple-500 pl-3">
                              <div className="text-white font-mono">{did.did.slice(0, 40)}...</div>
                              <div className="text-gray-400">Wallet: {did.wallet_address.slice(0, 20)}...</div>
                              <div className="text-gray-500">{new Date(did.created_at).toLocaleString()}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-400 text-sm">No DIDs found</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Raw Data */}
                <details className="bg-gray-700/30 rounded-lg p-3">
                  <summary className="text-gray-400 text-sm cursor-pointer">Raw Response Data</summary>
                  <pre className="text-xs text-gray-300 mt-2 overflow-auto">
                    {JSON.stringify(results, null, 2)}
                  </pre>
                </details>
              </motion.div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-900/20 border border-blue-500/30 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-400 mb-3">Testing Instructions</h3>
          <div className="space-y-2 text-sm text-gray-300">
            <p><strong>1. Create a DID:</strong> Go through the onboarding flow to create a new DID</p>
            <p><strong>2. Complete Account Setup:</strong> Set up password and TOTP authentication</p>
            <p><strong>3. Test Linkage:</strong> Use "Check User by Email" to verify the DID is linked to authentication</p>
            <p><strong>4. Verify Data:</strong> Ensure wallet addresses and DID values match between tables</p>
          </div>
        </div>
      </div>
    </div>
  )
}