'use client'

import { usePersonaChain } from '@/hooks/usePersonaChain'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Activity, Coins, Cube, Wifi, WifiOff, Users, Clock, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react'
import { formatDistanceToNow } from '@/lib/utils'
import { useEffect, useState } from 'react'

interface BlockchainHealth {
  status: 'pass' | 'warn' | 'fail'
  message: string
  responseTime: number
  lastChecked: string
  details: {
    configuredChainId: string
    actualChainId: string
    rpcUrl: string
    latestBlock: string
    nodeVersion: string
    peerCount: number
    testResults: Array<{
      test: string
      status: string
      responseTime?: number
      error?: string
    }>
    validationIssues?: string[]
    healthScore: number
  }
}

export function PersonaChainStatus() {
  const {
    isConnected,
    isConnecting,
    address,
    balance,
    blockHeight,
    error,
  } = usePersonaChain()

  const [blockchainHealth, setBlockchainHealth] = useState<BlockchainHealth | null>(null)
  const [healthLoading, setHealthLoading] = useState(false)

  // Fetch comprehensive blockchain health
  const fetchBlockchainHealth = async () => {
    setHealthLoading(true)
    try {
      const response = await fetch('/api/health/detailed')
      const healthData = await response.json()
      
      if (healthData.checks?.personachain) {
        setBlockchainHealth(healthData.checks.personachain)
      }
    } catch (error) {
      console.error('Failed to fetch blockchain health:', error)
    } finally {
      setHealthLoading(false)
    }
  }

  // Fetch health on mount and set up interval
  useEffect(() => {
    fetchBlockchainHealth()
    const interval = setInterval(fetchBlockchainHealth, 30000) // Every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass': return 'text-green-400'
      case 'warn': return 'text-yellow-400' 
      case 'fail': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'warn': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'fail': return <AlertTriangle className="h-4 w-4 text-red-500" />
      default: return <Activity className="h-4 w-4 text-gray-400" />
    }
  }

  return (
    <Card className="bg-gradient-to-br from-indigo-900/10 to-purple-900/10 border-indigo-500/20">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Cube className="h-5 w-5 text-indigo-400" />
            PersonaChain Status
          </span>
          <div className="flex items-center gap-2">
            {blockchainHealth && (
              <Badge variant="outline" className={`${getStatusColor(blockchainHealth.status)} border-current`}>
                {getStatusIcon(blockchainHealth.status)}
                <span className="ml-1">
                  {blockchainHealth.status === 'pass' ? 'Healthy' : 
                   blockchainHealth.status === 'warn' ? 'Degraded' : 'Offline'}
                </span>
              </Badge>
            )}
            <Badge variant={isConnected ? 'success' : isConnecting ? 'secondary' : 'destructive'}>
              {isConnected ? 'Connected' : isConnecting ? 'Connecting...' : 'Disconnected'}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Comprehensive Health Display */}
        {blockchainHealth && (
          <div className="space-y-3">
            {/* Health Score */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                <span>Health Score</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-bold ${getStatusColor(blockchainHealth.status)}`}>
                  {blockchainHealth.details.healthScore}%
                </span>
                <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      blockchainHealth.details.healthScore >= 80 ? 'bg-green-400' :
                      blockchainHealth.details.healthScore >= 60 ? 'bg-yellow-400' : 'bg-red-400'
                    }`}
                    style={{ width: `${blockchainHealth.details.healthScore}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Chain Information */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Cube className="h-4 w-4" />
                <span>Chain ID</span>
              </div>
              <span className="text-sm font-medium font-mono">
                {blockchainHealth.details.actualChainId}
                {blockchainHealth.details.actualChainId !== blockchainHealth.details.configuredChainId && (
                  <span className="text-yellow-400 ml-1">⚠️</span>
                )}
              </span>
            </div>

            {/* Latest Block */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Activity className="h-4 w-4" />
                <span>Latest Block</span>
              </div>
              <span className="text-sm font-medium font-mono">
                #{blockchainHealth.details.latestBlock !== 'unknown' ? 
                  parseInt(blockchainHealth.details.latestBlock).toLocaleString() : 
                  'Unknown'}
              </span>
            </div>

            {/* Peer Count */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>Peer Count</span>
              </div>
              <span className={`text-sm font-medium ${
                blockchainHealth.details.peerCount >= 3 ? 'text-green-400' : 'text-yellow-400'
              }`}>
                {blockchainHealth.details.peerCount} peers
              </span>
            </div>

            {/* Response Time */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Response Time</span>
              </div>
              <span className={`text-sm font-medium ${
                blockchainHealth.responseTime < 1000 ? 'text-green-400' :
                blockchainHealth.responseTime < 3000 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {blockchainHealth.responseTime}ms
              </span>
            </div>

            {/* Node Version */}
            {blockchainHealth.details.nodeVersion !== 'unknown' && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Node Version</span>
                </div>
                <span className="text-sm font-medium font-mono">
                  {blockchainHealth.details.nodeVersion}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {isConnected ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
            <span>Wallet Connection</span>
          </div>
          <span className="text-sm font-medium">
            {isConnected ? 'Connected' : 'Not Connected'}
          </span>
        </div>

        {/* Wallet Address */}
        {address && (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Wallet Address</span>
            </div>
            <code className="text-xs font-mono bg-black/20 p-2 rounded break-all">
              {address}
            </code>
          </div>
        )}

        {/* Balance */}
        {balance && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Coins className="h-4 w-4" />
              <span>Balance</span>
            </div>
            <span className="text-sm font-medium">
              {(parseFloat(balance.amount) / 1_000_000).toFixed(6)} PERSONA
            </span>
          </div>
        )}

        {/* Validation Issues */}
        {blockchainHealth?.details.validationIssues && blockchainHealth.details.validationIssues.length > 0 && (
          <div className="bg-yellow-900/20 border border-yellow-500/20 rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm text-yellow-400 mb-2">
              <AlertTriangle className="h-4 w-4" />
              <span>Validation Issues</span>
            </div>
            <ul className="text-xs text-yellow-300 space-y-1">
              {blockchainHealth.details.validationIssues.map((issue, index) => (
                <li key={index}>• {issue}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-900/20 border border-red-500/20 rounded-lg p-3">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* RPC Test Results */}
        {blockchainHealth?.details.testResults && (
          <div className="bg-gray-900/20 border border-gray-500/20 rounded-lg p-3">
            <div className="text-xs text-gray-300 mb-2">RPC Test Results:</div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {blockchainHealth.details.testResults.map((test, index) => (
                <div key={index} className="flex items-center gap-1">
                  {getStatusIcon(test.status)}
                  <span className="truncate">{test.test}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-indigo-900/20 border border-indigo-500/20 rounded-lg p-3">
          <p className="text-xs text-indigo-300">
            {blockchainHealth ? blockchainHealth.message : 
             'PersonaChain is a Cosmos SDK blockchain for decentralized identity management.'}
            {healthLoading && ' (Checking health...)'}
          </p>
          {blockchainHealth && (
            <p className="text-xs text-indigo-400 mt-1">
              Last checked: {formatDistanceToNow(new Date(blockchainHealth.lastChecked))} ago
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}