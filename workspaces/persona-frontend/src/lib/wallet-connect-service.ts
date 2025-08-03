// PersonaPass Wallet Connection Service
// Simplified wallet connection for production deployment

export interface WalletInfo {
  address: string;
  chainId: string;
  isConnected: boolean;
  provider: 'keplr' | 'cosmostation' | 'leap';
}

export class WalletConnectService {
  private readonly CHAIN_ID = 'persona-testnet';
  private readonly RPC_ENDPOINT = process.env.NEXT_PUBLIC_RPC_URL || 'https://personachain-rpc-lb-1471567419.us-east-1.elb.amazonaws.com';

  constructor() {
    // Initialize service
  }

  /**
   * Connect to any available Cosmos wallet
   */
  async connectWallet(): Promise<WalletInfo | null> {
    try {
      // Try Keplr first
      if (typeof window !== 'undefined' && window.keplr) {
        await window.keplr.enable(this.CHAIN_ID);
        const offlineSigner = window.keplr.getOfflineSigner(this.CHAIN_ID);
        const accounts = await offlineSigner.getAccounts();
        
        if (accounts.length > 0) {
          return {
            address: accounts[0].address,
            chainId: this.CHAIN_ID,
            isConnected: true,
            provider: 'keplr'
          };
        }
      }

      // Try Cosmostation
      if (typeof window !== 'undefined' && window.cosmostation) {
        const account = await window.cosmostation.cosmos.request({
          method: 'cosmos_requestAccount',
          params: { chainName: this.CHAIN_ID }
        });
        
        if (account) {
          return {
            address: account.address,
            chainId: this.CHAIN_ID,
            isConnected: true,
            provider: 'cosmostation'
          };
        }
      }

      // Try Leap wallet
      if (typeof window !== 'undefined' && window.leap) {
        await window.leap.enable(this.CHAIN_ID);
        const offlineSigner = window.leap.getOfflineSigner(this.CHAIN_ID);
        const accounts = await offlineSigner.getAccounts();
        
        if (accounts.length > 0) {
          return {
            address: accounts[0].address,
            chainId: this.CHAIN_ID,
            isConnected: true,
            provider: 'leap'
          };
        }
      }

      throw new Error('No compatible wallet found');
    } catch (error) {
      console.error('Wallet connection error:', error);
      throw error;
    }
  }

  /**
   * Get currently connected wallet info
   */
  async getConnectedWallet(): Promise<WalletInfo | null> {
    try {
      // Check Keplr
      if (typeof window !== 'undefined' && window.keplr) {
        const key = await window.keplr.getKey(this.CHAIN_ID);
        if (key) {
          return {
            address: key.bech32Address,
            chainId: this.CHAIN_ID,
            isConnected: true,
            provider: 'keplr'
          };
        }
      }

      // Check Cosmostation
      if (typeof window !== 'undefined' && window.cosmostation) {
        try {
          const account = await window.cosmostation.cosmos.request({
            method: 'cosmos_getAccount',
            params: { chainName: this.CHAIN_ID }
          });
          
          if (account) {
            return {
              address: account.address,
              chainId: this.CHAIN_ID,
              isConnected: true,
              provider: 'cosmostation'
            };
          }
        } catch (err) {
          // Not connected to Cosmostation
        }
      }

      // Check Leap
      if (typeof window !== 'undefined' && window.leap) {
        try {
          const key = await window.leap.getKey(this.CHAIN_ID);
          if (key) {
            return {
              address: key.bech32Address,
              chainId: this.CHAIN_ID,
              isConnected: true,
              provider: 'leap'
            };
          }
        } catch (err) {
          // Not connected to Leap
        }
      }

      return null;
    } catch (error) {
      console.error('Error checking wallet connection:', error);
      return null;
    }
  }

  /**
   * Disconnect wallet
   */
  async disconnectWallet(): Promise<void> {
    // Most wallets don't have programmatic disconnect
    // User needs to disconnect from wallet extension
    console.log('Please disconnect from your wallet extension');
  }

  /**
   * Listen for wallet account changes
   */
  onAccountChange(callback: (wallet: WalletInfo | null) => void): () => void {
    const checkAccount = async () => {
      const wallet = await this.getConnectedWallet();
      callback(wallet);
    };

    // Listen for Keplr changes
    const keplrListener = () => checkAccount();
    if (typeof window !== 'undefined') {
      window.addEventListener('keplr_keystorechange', keplrListener);
    }

    // Cleanup function
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('keplr_keystorechange', keplrListener);
      }
    };
  }
}

// Type declarations for wallet extensions
declare global {
  interface Window {
    keplr?: {
      enable: (chainId: string) => Promise<void>;
      getOfflineSigner: (chainId: string) => {
        getAccounts: () => Promise<Array<{ address: string }>>;
      };
      getKey: (chainId: string) => Promise<{ bech32Address: string }>;
    };
    cosmostation?: {
      cosmos: {
        request: (params: { method: string; params?: any }) => Promise<any>;
      };
    };
    leap?: {
      enable: (chainId: string) => Promise<void>;
      getOfflineSigner: (chainId: string) => {
        getAccounts: () => Promise<Array<{ address: string }>>;
      };
      getKey: (chainId: string) => Promise<{ bech32Address: string }>;
    };
  }
}