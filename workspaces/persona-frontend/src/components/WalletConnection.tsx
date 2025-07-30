'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useAccount, useDisconnect, Connector } from 'wagmi'
import { ChevronRight, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { useWalletConnectionManager } from '@/hooks/useWalletConnectionManager'

interface WalletConnectionProps {
  onNext: () => void
  onWalletConnected: (address: string) => void
}

export function WalletConnection({ onNext, onWalletConnected }: WalletConnectionProps) {
  const { connectWallet, connectors, isPending, error, isConnectionBlocked } = useWalletConnectionManager()
  const { isConnected, address } = useAccount()
  const { disconnect } = useDisconnect()
  const [selectedConnector, setSelectedConnector] = useState<Connector | null>(null)

  // Handle successful connection
  useEffect(() => {
    if (isConnected && address) {
      onWalletConnected(address)
      setTimeout(() => {
        onNext()
      }, 1500) // Small delay to show success state
    }
  }, [isConnected, address, onWalletConnected, onNext])

  const handleConnect = async (connector: Connector) => {
    if (isConnectionBlocked) {
      return
    }
    
    setSelectedConnector(connector)
    const result = await connectWallet(connector)
    
    if (!result.success) {
      setSelectedConnector(null)
    }
  }

  const getWalletIcon = (connectorName: string) => {
    // Return actual company logos as SVG or image URLs
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
      'MetaMask': 'Popular browser wallet',
      'WalletConnect': 'Connect mobile wallets',
      'Coinbase Wallet': 'Coinbase\'s secure wallet',
      'Safe': 'Multi-signature wallet',
      'Injected': 'Browser extension wallet'
    }
    return descriptions[connectorName] || 'Web3 wallet'
  }

  const isPopularWallet = (connectorName: string) => {
    return ['MetaMask', 'WalletConnect', 'Coinbase Wallet'].includes(connectorName)
  }

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
          <p className="text-gray-600 break-all">{address}</p>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => disconnect()}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Disconnect wallet
        </motion.button>
      </motion.div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start"
        >
          <AlertCircle className="w-5 h-5 text-red-500 mr-3 mt-0.5" />
          <div className="text-sm text-red-800">
            <p className="font-medium">Connection failed</p>
            <p>{error.message}</p>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 gap-3">
        {connectors.map((connector) => {
          const isConnecting = isPending && selectedConnector?.uid === connector.uid
          
          return (
            <motion.button
              key={connector.uid}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleConnect(connector)}
              disabled={isConnectionBlocked}
              className="w-full p-4 bg-white rounded-xl border-2 border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center">
                <div className="w-8 h-8 mr-3 flex items-center justify-center">
                  <Image 
                    src={getWalletIcon(connector.name)} 
                    alt={`${connector.name} logo`}
                    width={32}
                    height={32}
                    className="w-8 h-8 object-contain"
                    onError={(e) => {
                      // Fallback to emoji if image fails to load
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
                  <p className="text-sm text-gray-600">{getWalletDescription(connector.name)}</p>
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

      <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
        <div className="flex items-start">
          <div className="text-blue-600 mr-3">ℹ️</div>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">New to wallets?</p>
            <p>We recommend MetaMask for its ease of use and security. You can download it from metamask.io</p>
          </div>
        </div>
      </div>
    </div>
  )
}