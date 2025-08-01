'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useAccount, Connector } from 'wagmi'
import { ChevronRight, CheckCircle, AlertTriangle, Loader2, RefreshCw } from 'lucide-react'
import Image from 'next/image'
import { useWalletConnectionManager } from '@/hooks/useWalletConnectionManager'

interface WalletConnectionProps {
  onNext: () => void
  onWalletConnected: (address: string) => void
}

export function WalletConnection({ onNext, onWalletConnected }: WalletConnectionProps) {
  const { connectWallet, disconnectWallet, connectors, isPending, error, isConnected } = useWalletConnectionManager()
  const { address } = useAccount()
  const [selectedConnector, setSelectedConnector] = useState<Connector | null>(null)

  // Handle successful connection
  useEffect(() => {
    if (isConnected && address) {
      onWalletConnected(address)
      setTimeout(() => {
        onNext()
      }, 1500)
    }
  }, [isConnected, address, onWalletConnected, onNext])

  const handleConnect = async (connector: Connector) => {
    setSelectedConnector(connector)
    console.log(`Attempting to connect with ${connector.name}...`)
    
    const result = await connectWallet(connector)
    
    if (!result.success) {
      console.error(`${connector.name} connection failed:`, result.error)
      setSelectedConnector(null)
    } else {
      console.log(`${connector.name} connected successfully!`)
    }
  }

  const handleRetry = async () => {
    if (selectedConnector) {
      await handleConnect(selectedConnector)
    }
  }

  const getWalletIcon = (connectorName: string) => {
    const icons: { [key: string]: string } = {
      'MetaMask': '/logos/metamask.svg',
      'WalletConnect': '/logos/walletconnect.svg',
      'Coinbase Wallet': '/logos/coinbase.svg',
      'Safe': '/logos/safe.svg',
      'Injected': '/logos/wallet.svg'
    }
    return icons[connectorName] || '/logos/wallet.svg'
  }

  const getWalletDescription = (connectorName: string) => {
    const descriptions: { [key: string]: string } = {
      'MetaMask': 'Most popular Ethereum wallet',
      'WalletConnect': 'Connect with mobile wallets',
      'Coinbase Wallet': 'Coinbase\'s secure wallet solution',
      'Safe': 'Multi-signature security wallet',
      'Injected': 'Browser extension wallet'
    }
    return descriptions[connectorName] || 'Web3 wallet connection'
  }

  const isPopularWallet = (connectorName: string) => {
    return ['MetaMask', 'WalletConnect', 'Coinbase Wallet'].includes(connectorName)
  }

  // Success state
  if (isConnected && address) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-6"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto"
        >
          <CheckCircle className="w-8 h-8 text-green-600" />
        </motion.div>
        
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Wallet Connected!</h3>
          <p className="text-gray-600 text-sm break-all font-mono bg-gray-50 p-2 rounded">{address}</p>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => disconnectWallet()}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Disconnect wallet
        </motion.button>
      </motion.div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-50 border border-red-200 rounded-xl"
        >
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="text-sm text-red-800">
                <p className="font-medium">Connection Failed</p>
                <p className="mt-1">{error.message}</p>
              </div>
              
              <button
                onClick={handleRetry}
                className="mt-3 flex items-center gap-2 text-xs bg-red-100 hover:bg-red-200 text-red-700 px-3 py-2 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Wallet Options */}
      <div className="grid grid-cols-1 gap-3">
        {connectors.map((connector) => {
          const isConnecting = isPending && selectedConnector?.uid === connector.uid
          
          return (
            <motion.button
              key={connector.uid}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleConnect(connector)}
              disabled={isPending}
              className="w-full p-4 bg-white rounded-xl border-2 border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center">
                <div className="w-10 h-10 mr-4 flex items-center justify-center">
                  <Image 
                    src={getWalletIcon(connector.name)} 
                    alt={`${connector.name} logo`}
                    width={40}
                    height={40}
                    className="w-10 h-10 object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.parentElement!.innerHTML = connector.name === 'MetaMask' ? '🦊' : 
                                                       connector.name === 'WalletConnect' ? '🔗' :
                                                       connector.name === 'Coinbase Wallet' ? '🔵' :
                                                       connector.name === 'Safe' ? '🛡️' : '💼';
                    }}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className="font-semibold text-gray-900">{connector.name}</span>
                    {isPopularWallet(connector.name) && (
                      <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                        Popular
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{getWalletDescription(connector.name)}</p>
                </div>
                {isConnecting ? (
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </motion.button>
          )
        })}
      </div>

      {/* Help Section */}
      <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
        <div className="flex items-start">
          <div className="text-blue-600 mr-3 text-lg">💡</div>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">New to crypto wallets?</p>
            <p>We recommend <strong>MetaMask</strong> for beginners. It&apos;s secure, user-friendly, and works great with PersonaPass.</p>
            <a 
              href="https://metamask.io" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block mt-2 text-blue-600 hover:text-blue-700 font-medium underline"
            >
              Download MetaMask →
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}