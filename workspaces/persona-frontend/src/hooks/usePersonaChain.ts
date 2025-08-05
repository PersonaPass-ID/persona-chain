// React hook for PersonaChain integration
import { useState, useEffect, useCallback } from 'react'
import { personaChainClient } from '@/lib/personachain/client'
import { useWallet } from './useWallet'

export interface PersonaChainState {
  isConnected: boolean
  isConnecting: boolean
  address: string | null
  balance: { amount: string; denom: string } | null
  blockHeight: number | null
  error: string | null
}

export interface UsePersonaChainReturn extends PersonaChainState {
  connect: () => Promise<void>
  connectWallet: (mnemonic: string) => Promise<string>
  createIdentity: (didDocument: any) => Promise<string>
  issueCredential: (
    subjectDID: string,
    credentialType: string,
    credentialData: any,
    expiryDays?: number
  ) => Promise<{ txHash: string; credentialId?: string }>
  verifyCredential: (
    credentialId: string,
    proofData: any
  ) => Promise<{ txHash: string; verified: boolean }>
  revokeCredential: (credentialId: string, reason: string) => Promise<string>
  queryIdentity: (address: string) => Promise<any>
  queryCredentials: (subjectDID: string) => Promise<any[]>
  refreshBalance: () => Promise<void>
  disconnect: () => void
}

export function usePersonaChain(): UsePersonaChainReturn {
  const { address: walletAddress } = useWallet()
  
  const [state, setState] = useState<PersonaChainState>({
    isConnected: false,
    isConnecting: false,
    address: null,
    balance: null,
    blockHeight: null,
    error: null,
  })

  // Connect to PersonaChain (read-only)
  const connect = useCallback(async () => {
    setState(prev => ({ ...prev, isConnecting: true, error: null }))
    
    try {
      await personaChainClient.connect()
      const height = await personaChainClient.getHeight()
      
      setState(prev => ({
        ...prev,
        isConnected: true,
        isConnecting: false,
        blockHeight: height,
      }))
    } catch (error) {
      setState(prev => ({
        ...prev,
        isConnected: false,
        isConnecting: false,
        error: error instanceof Error ? error.message : 'Failed to connect',
      }))
    }
  }, [])

  // Connect with wallet for signing
  const connectWallet = useCallback(async (mnemonic: string) => {
    setState(prev => ({ ...prev, isConnecting: true, error: null }))
    
    try {
      const address = await personaChainClient.connectWithWallet(mnemonic)
      const balance = await personaChainClient.getBalance()
      const height = await personaChainClient.getHeight()
      
      setState(prev => ({
        ...prev,
        isConnected: true,
        isConnecting: false,
        address,
        balance,
        blockHeight: height,
      }))
      
      return address
    } catch (error) {
      setState(prev => ({
        ...prev,
        isConnected: false,
        isConnecting: false,
        error: error instanceof Error ? error.message : 'Failed to connect wallet',
      }))
      throw error
    }
  }, [])

  // Refresh balance
  const refreshBalance = useCallback(async () => {
    if (!state.address) return
    
    try {
      const balance = await personaChainClient.getBalance()
      setState(prev => ({ ...prev, balance }))
    } catch (error) {
      console.error('Failed to refresh balance:', error)
    }
  }, [state.address])

  // Create DID on chain
  const createIdentity = useCallback(async (didDocument: any) => {
    if (!state.isConnected || !state.address) {
      throw new Error('Wallet not connected to PersonaChain')
    }
    
    try {
      const txHash = await personaChainClient.createIdentity(didDocument)
      await refreshBalance()
      return txHash
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to create identity',
      }))
      throw error
    }
  }, [state.isConnected, state.address, refreshBalance])

  // Issue credential
  const issueCredential = useCallback(async (
    subjectDID: string,
    credentialType: string,
    credentialData: any,
    expiryDays?: number
  ) => {
    if (!state.isConnected || !state.address) {
      throw new Error('Wallet not connected to PersonaChain')
    }
    
    try {
      const result = await personaChainClient.issueCredential(
        subjectDID,
        credentialType,
        credentialData,
        expiryDays
      )
      await refreshBalance()
      return result
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to issue credential',
      }))
      throw error
    }
  }, [state.isConnected, state.address, refreshBalance])

  // Verify credential
  const verifyCredential = useCallback(async (
    credentialId: string,
    proofData: any
  ) => {
    if (!state.isConnected || !state.address) {
      throw new Error('Wallet not connected to PersonaChain')
    }
    
    try {
      const result = await personaChainClient.verifyCredential(credentialId, proofData)
      await refreshBalance()
      return result
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to verify credential',
      }))
      throw error
    }
  }, [state.isConnected, state.address, refreshBalance])

  // Revoke credential
  const revokeCredential = useCallback(async (
    credentialId: string,
    reason: string
  ) => {
    if (!state.isConnected || !state.address) {
      throw new Error('Wallet not connected to PersonaChain')
    }
    
    try {
      const txHash = await personaChainClient.revokeCredential(credentialId, reason)
      await refreshBalance()
      return txHash
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to revoke credential',
      }))
      throw error
    }
  }, [state.isConnected, state.address, refreshBalance])

  // Query identity
  const queryIdentity = useCallback(async (address: string) => {
    if (!state.isConnected) {
      await connect()
    }
    
    return personaChainClient.queryIdentity(address)
  }, [state.isConnected, connect])

  // Query credentials
  const queryCredentials = useCallback(async (subjectDID: string) => {
    if (!state.isConnected) {
      await connect()
    }
    
    return personaChainClient.queryCredentials(subjectDID)
  }, [state.isConnected, connect])

  // Disconnect
  const disconnect = useCallback(() => {
    personaChainClient.disconnect()
    setState({
      isConnected: false,
      isConnecting: false,
      address: null,
      balance: null,
      blockHeight: null,
      error: null,
    })
  }, [])

  // Auto-connect on mount
  useEffect(() => {
    connect()
  }, [connect])

  // Update block height periodically
  useEffect(() => {
    if (!state.isConnected) return

    const interval = setInterval(async () => {
      try {
        const height = await personaChainClient.getHeight()
        setState(prev => ({ ...prev, blockHeight: height }))
      } catch (error) {
        console.error('Failed to update block height:', error)
      }
    }, 6000) // Every 6 seconds (block time)

    return () => clearInterval(interval)
  }, [state.isConnected])

  return {
    ...state,
    connect,
    connectWallet,
    createIdentity,
    issueCredential,
    verifyCredential,
    revokeCredential,
    queryIdentity,
    queryCredentials,
    refreshBalance,
    disconnect,
  }
}