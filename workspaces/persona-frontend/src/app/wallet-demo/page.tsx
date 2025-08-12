'use client'

import { useState } from 'react'
import { useWalletAuth } from '@/hooks/useWalletAuth'
import WalletAuthButton from '@/components/WalletAuthButton'
import WalletAuthModal from '@/components/WalletAuthModal'

export default function WalletDemoPage() {
  const {
    isAuthenticated,
    user,
    isConnecting,
    error,
    availableWallets,
    disconnect,
    refreshAuth,
    checkAuthHealth,
    isReady,
    connectionStatus,
    getInstalledWallets,
    getMissingWallets,
    hasWalletsInstalled
  } = useWalletAuth()

  const [showModal, setShowModal] = useState(false)
  const [apiTestResult, setApiTestResult] = useState<string>('')
  const [healthResult, setHealthResult] = useState<string>('')

  const handleWalletSuccess = (userData: unknown) => {
    console.log('Wallet connected successfully:', userData)
    setShowModal(false)
  }

  const testApiHealth = async () => {
    const result = await checkAuthHealth()
    setHealthResult(result.success ? `✅ ${result.message}` : `❌ ${result.message}`)
  }

  const testTokenRefresh = async () => {
    if (!isAuthenticated) {
      setApiTestResult('❌ Not authenticated')
      return
    }
    
    const result = await refreshAuth()
    setApiTestResult(result.success ? '✅ Token refreshed successfully' : `❌ ${result.error}`)
  }

  const installedWallets = getInstalledWallets()
  const missingWallets = getMissingWallets()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Wallet Authentication Demo
            </h1>
            <p className="text-lg text-gray-600">
              Test the universal Cosmos wallet authentication system
            </p>
          </div>

          {/* Wallet Status Card */}
          <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Connection Status
              </h2>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                connectionStatus === 'connected' 
                  ? 'bg-green-100 text-green-800'
                  : connectionStatus === 'connecting'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {connectionStatus}
              </span>
            </div>

            {isAuthenticated && user ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Wallet Type:</span>
                    <p className="font-medium text-gray-900">{user.walletType}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Chain:</span>
                    <p className="font-medium text-gray-900">{user.chainId}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Address:</span>
                    <p className="font-mono text-sm text-gray-900">{user.address}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Verified:</span>
                    <p className="font-medium text-gray-900">{user.isVerified ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">User ID:</span>
                    <p className="font-mono text-sm text-gray-900">{user.id}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Last Login:</span>
                    <p className="text-sm text-gray-900">{new Date(user.lastLogin).toLocaleString()}</p>
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={disconnect}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    Disconnect Wallet
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <p className="text-gray-600 mb-4">No wallet connected</p>
                <div className="space-x-4">
                  <WalletAuthButton onSuccess={handleWalletSuccess}>
                    Connect Wallet
                  </WalletAuthButton>
                  <button
                    onClick={() => setShowModal(true)}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                  >
                    Open Modal
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">
                  <strong>Error:</strong> {error}
                </p>
              </div>
            )}
          </div>

          {/* Wallet Detection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Installed Wallets ({installedWallets.length})
              </h3>
              {installedWallets.length > 0 ? (
                <div className="space-y-2">
                  {installedWallets.map((wallet) => (
                    <div key={wallet.type} className="flex items-center space-x-3 p-2 bg-white rounded-lg">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <span className="text-green-600 font-bold text-sm">
                          {wallet.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{wallet.name}</p>
                        <p className="text-xs text-green-600">Installed</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No wallets detected</p>
              )}
            </div>

            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Available Wallets ({missingWallets.length})
              </h3>
              {missingWallets.length > 0 ? (
                <div className="space-y-2">
                  {missingWallets.map((wallet) => (
                    <div key={wallet.type} className="flex items-center justify-between p-2 bg-white rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                          <span className="text-gray-500 font-bold text-sm">
                            {wallet.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{wallet.name}</p>
                          <p className="text-xs text-gray-500">Not installed</p>
                        </div>
                      </div>
                      <a
                        href={`https://chrome.google.com/webstore/detail/${wallet.type}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-colors"
                      >
                        Install
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">All wallets installed</p>
              )}
            </div>
          </div>

          {/* API Testing */}
          <div className="bg-gray-50 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              API Testing
            </h3>
            <div className="space-y-4">
              <div className="flex space-x-4">
                <button
                  onClick={testApiHealth}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Test API Health
                </button>
                <button
                  onClick={testTokenRefresh}
                  disabled={!isAuthenticated}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  Test Token Refresh
                </button>
              </div>
              
              {healthResult && (
                <div className="p-3 bg-white rounded-lg">
                  <p className="text-sm font-mono">{healthResult}</p>
                </div>
              )}
              
              {apiTestResult && (
                <div className="p-3 bg-white rounded-lg">
                  <p className="text-sm font-mono">{apiTestResult}</p>
                </div>
              )}
            </div>
          </div>

          {/* Debug Info */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Debug Information
            </h3>
            <div className="space-y-2 text-sm font-mono">
              <div><span className="text-gray-600">Ready:</span> {isReady ? 'true' : 'false'}</div>
              <div><span className="text-gray-600">Connecting:</span> {isConnecting ? 'true' : 'false'}</div>
              <div><span className="text-gray-600">Authenticated:</span> {isAuthenticated ? 'true' : 'false'}</div>
              <div><span className="text-gray-600">Has Wallets:</span> {hasWalletsInstalled() ? 'true' : 'false'}</div>
              <div><span className="text-gray-600">Available Wallets:</span> {availableWallets.length}</div>
              <div><span className="text-gray-600">Connection Status:</span> {connectionStatus}</div>
            </div>
          </div>

          {/* Modal */}
          <WalletAuthModal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            onSuccess={handleWalletSuccess}
            title="Demo Wallet Connection"
            subtitle="This is a demo of the wallet authentication modal"
          />
        </div>
      </div>
    </div>
  )
}