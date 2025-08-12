import { useState, useEffect, useCallback } from 'react';
import { Wallet, DIDDocument } from '../types/wallet';
import { personaChainService } from '../services/PersonaChainService';
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';

export const useWallet = () => {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [hdWallet, setHdWallet] = useState<DirectSecp256k1HdWallet | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [didDocument, setDidDocument] = useState<DIDDocument | null>(null);

  // Load wallet from localStorage on mount
  useEffect(() => {
    const savedWallet = localStorage.getItem('persona-wallet');
    if (savedWallet) {
      try {
        const parsedWallet = JSON.parse(savedWallet);
        setWallet(parsedWallet);
      } catch (error) {
        console.error('Error parsing saved wallet:', error);
        localStorage.removeItem('persona-wallet');
      }
    }
  }, []);

  const createWallet = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const newWallet = await personaChainService.createWallet();
      setWallet(newWallet);
      
      // Get HD wallet for multi-sig operations
      const hdWallet = personaChainService.getCurrentHdWallet();
      setHdWallet(hdWallet);
      
      // Save to localStorage (note: in production, consider more secure storage)
      localStorage.setItem('persona-wallet', JSON.stringify({
        ...newWallet,
        mnemonic: undefined, // Don't save mnemonic to localStorage for security
      }));
      
      return newWallet;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create wallet';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const importWallet = useCallback(async (mnemonic: string) => {
    setLoading(true);
    setError(null);
    try {
      const importedWallet = await personaChainService.importWallet(mnemonic);
      setWallet(importedWallet);
      
      // Get HD wallet for multi-sig operations
      const hdWallet = personaChainService.getCurrentHdWallet();
      setHdWallet(hdWallet);
      
      // Save to localStorage (note: in production, consider more secure storage)
      localStorage.setItem('persona-wallet', JSON.stringify({
        ...importedWallet,
        mnemonic: undefined, // Don't save mnemonic to localStorage for security
      }));
      
      return importedWallet;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to import wallet';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const createDID = useCallback(async () => {
    if (!wallet) {
      throw new Error('No wallet available');
    }

    setLoading(true);
    setError(null);
    try {
      const did = await personaChainService.createDID(wallet);
      setDidDocument(did);
      
      // Update wallet with DID
      const updatedWallet = { ...wallet, did: did.id };
      setWallet(updatedWallet);
      
      // Update localStorage
      localStorage.setItem('persona-wallet', JSON.stringify({
        ...updatedWallet,
        mnemonic: undefined,
      }));
      
      return did;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create DID';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [wallet]);

  const refreshBalance = useCallback(async () => {
    if (!wallet) return;
    
    try {
      const newBalance = await personaChainService.getBalance(wallet.address);
      setWallet(prev => prev ? { ...prev, balance: newBalance } : null);
    } catch (error) {
      console.error('Error refreshing balance:', error);
    }
  }, [wallet]);

  const sendTokens = useCallback(async (toAddress: string, amount: string) => {
    if (!wallet) {
      throw new Error('No wallet available');
    }

    setLoading(true);
    setError(null);
    try {
      const txHash = await personaChainService.sendTokens(wallet, toAddress, amount);
      
      // Refresh balance after sending
      await refreshBalance();
      
      return txHash;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send tokens';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [wallet, refreshBalance]);

  const logout = useCallback(() => {
    setWallet(null);
    setHdWallet(null);
    setDidDocument(null);
    localStorage.removeItem('persona-wallet');
  }, []);

  return {
    wallet,
    hdWallet,
    didDocument,
    loading,
    error,
    createWallet,
    importWallet,
    createDID,
    sendTokens,
    refreshBalance,
    logout,
  };
};