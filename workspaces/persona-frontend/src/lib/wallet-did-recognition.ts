// PersonaPass Wallet-DID Recognition System
// Automatically detects if connected wallet already has a DID and routes appropriately

import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate';

export interface WalletInfo {
  address: string;
  chainId: string;
  isConnected: boolean;
  provider: 'keplr' | 'cosmostation' | 'leap';
}

export interface DIDInfo {
  did: string;
  address: string;
  createdAt: string;
  isActive: boolean;
  hasCredentials: boolean;
  lastUsed: string;
}

export interface AuthRouteResult {
  route: 'signup' | 'login' | 'dashboard' | 'onboarding';
  didInfo?: DIDInfo;
  message?: string;
}

/**
 * Service for detecting wallet connections and managing DID lookups
 */
export class WalletService {
  private client: CosmWasmClient | null = null;
  private readonly RPC_ENDPOINT = process.env.NEXT_PUBLIC_PERSONACHAIN_RPC || 'http://localhost:26657';
  private readonly DID_CONTRACT = process.env.NEXT_PUBLIC_DID_CONTRACT;

  constructor() {
    this.initializeClient();
  }

  private async initializeClient(): Promise<void> {
    try {
      this.client = await CosmWasmClient.connect(this.RPC_ENDPOINT);
      console.log('✅ Connected to PersonaChain RPC');
    } catch (error) {
      console.error('❌ Failed to connect to PersonaChain:', error);
    }
  }

  /**
   * Get currently connected wallet information
   */
  async getConnectedWallet(): Promise<WalletInfo | null> {
    try {
      // Check Keplr wallet first
      if (window.keplr) {
        const chainId = await window.keplr.getChainId();
        const offlineSigner = window.keplr.getOfflineSigner(chainId);
        const accounts = await offlineSigner.getAccounts();
        
        if (accounts.length > 0) {
          return {
            address: accounts[0].address,
            chainId,
            isConnected: true,
            provider: 'keplr'
          };
        }
      }

      // Check Cosmostation
      if (window.cosmostation) {
        const account = await window.cosmostation.cosmos.request({
          method: 'cosmos_getAccount',
        });
        
        if (account) {
          return {
            address: account.address,
            chainId: account.chainId,
            isConnected: true,
            provider: 'cosmostation'
          };
        }
      }

      // Check Leap wallet
      if (window.leap) {
        const chainId = await window.leap.getChainId();
        const offlineSigner = window.leap.getOfflineSigner(chainId);
        const accounts = await offlineSigner.getAccounts();
        
        if (accounts.length > 0) {
          return {
            address: accounts[0].address,
            chainId,
            isConnected: true,
            provider: 'leap'
          };
        }
      }

      return null;
    } catch (error) {
      console.error('Error getting wallet info:', error);
      return null;
    }
  }

  /**
   * Check if any wallet is currently connected
   */
  async isWalletConnected(): Promise<boolean> {
    const wallet = await this.getConnectedWallet();
    return wallet !== null;
  }

  /**
   * Get the current wallet address
   */
  async getCurrentAddress(): Promise<string | null> {
    const wallet = await this.getConnectedWallet();
    return wallet?.address || null;
  }

  /**
   * Listen for wallet connection changes
   */
  onWalletChange(callback: (wallet: WalletInfo | null) => void): () => void {
    const checkWallet = async () => {
      const wallet = await this.getConnectedWallet();
      callback(wallet);
    };

    // Listen for Keplr account changes
    const keplrListener = () => checkWallet();
    window.addEventListener('keplr_keystorechange', keplrListener);

    // Listen for Cosmostation changes
    const cosmostationListener = () => checkWallet();
    window.addEventListener('cosmostation_keystorechange', cosmostationListener);

    // Cleanup function
    return () => {
      window.removeEventListener('keplr_keystorechange', keplrListener);
      window.removeEventListener('cosmostation_keystorechange', cosmostationListener);
    };
  }
}

/**
 * Service for looking up DIDs associated with wallet addresses
 */
export class DIDLookupService {
  private client: CosmWasmClient | null = null;
  private readonly DID_CONTRACT = process.env.NEXT_PUBLIC_DID_CONTRACT;
  private cache: Map<string, DIDInfo | null> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(client: CosmWasmClient | null = null) {
    this.client = client;
  }

  /**
   * Find DID associated with a wallet address
   */
  async findDIDByWallet(address: string): Promise<DIDInfo | null> {
    try {
      // Check cache first
      const cacheKey = `did:${address}`;
      const cached = this.cache.get(cacheKey);
      if (cached !== undefined) {
        return cached;
      }

      if (!this.client || !this.DID_CONTRACT) {
        console.warn('DID lookup not available - client or contract not configured');
        return null;
      }

      // Query the DID contract
      const query = {
        get_did_by_address: {
          address: address
        }
      };

      const result = await this.client.queryContractSmart(this.DID_CONTRACT, query);
      
      if (result && result.did) {
        const didInfo: DIDInfo = {
          did: result.did,
          address: address,
          createdAt: result.created_at,
          isActive: result.is_active,
          hasCredentials: result.credentials_count > 0,
          lastUsed: result.last_used
        };

        // Cache the result
        this.cache.set(cacheKey, didInfo);
        setTimeout(() => this.cache.delete(cacheKey), this.CACHE_TTL);

        return didInfo;
      }

      // Cache null result to avoid repeated queries
      this.cache.set(cacheKey, null);
      setTimeout(() => this.cache.delete(cacheKey), this.CACHE_TTL);

      return null;
    } catch (error) {
      console.error('Error looking up DID:', error);
      return null;
    }
  }

  /**
   * Verify that a DID is owned by the specified address
   */
  async verifyDIDOwnership(did: string, address: string): Promise<boolean> {
    try {
      if (!this.client || !this.DID_CONTRACT) {
        return false;
      }

      const query = {
        verify_ownership: {
          did: did,
          address: address
        }
      };

      const result = await this.client.queryContractSmart(this.DID_CONTRACT, query);
      return result?.is_owner === true;
    } catch (error) {
      console.error('Error verifying DID ownership:', error);
      return false;
    }
  }

  /**
   * Get multiple DIDs associated with an address (edge case handling)
   */
  async getAllDIDsByWallet(address: string): Promise<DIDInfo[]> {
    try {
      if (!this.client || !this.DID_CONTRACT) {
        return [];
      }

      const query = {
        list_dids_by_address: {
          address: address,
          limit: 10
        }
      };

      const result = await this.client.queryContractSmart(this.DID_CONTRACT, query);
      return result?.dids || [];
    } catch (error) {
      console.error('Error getting all DIDs:', error);
      return [];
    }
  }

  /**
   * Clear the DID cache (useful after wallet changes)
   */
  clearCache(): void {
    this.cache.clear();
  }
}

/**
 * Smart routing service that determines where to send users
 */
export class AuthRouter {
  private walletService: WalletService;
  private didLookupService: DIDLookupService;

  constructor() {
    this.walletService = new WalletService();
    this.didLookupService = new DIDLookupService();
  }

  /**
   * Main function to determine where to route the user
   */
  async determineUserRoute(): Promise<AuthRouteResult> {
    try {
      // Step 1: Check if wallet is connected
      const wallet = await this.walletService.getConnectedWallet();
      
      if (!wallet) {
        return {
          route: 'signup',
          message: 'Please connect your wallet to continue'
        };
      }

      // Step 2: Look up DID for this wallet
      const didInfo = await this.didLookupService.findDIDByWallet(wallet.address);

      if (!didInfo) {
        return {
          route: 'signup',
          message: 'No PersonaPass account found. Let\'s create one!'
        };
      }

      // Step 3: Check DID status and determine appropriate route
      if (!didInfo.isActive) {
        return {
          route: 'onboarding',
          didInfo,
          message: 'Your account needs to be reactivated'
        };
      }

      if (!didInfo.hasCredentials) {
        return {
          route: 'onboarding',
          didInfo,
          message: 'Complete your profile setup'
        };
      }

      // User has active DID with credentials - go to dashboard
      return {
        route: 'dashboard',
        didInfo,
        message: `Welcome back! Last used: ${new Date(didInfo.lastUsed).toLocaleDateString()}`
      };

    } catch (error) {
      console.error('Error determining user route:', error);
      return {
        route: 'signup',
        message: 'Unable to verify account status. Please try again.'
      };
    }
  }

  /**
   * Handle the case where user has multiple DIDs
   */
  async handleMultipleDIDs(address: string): Promise<DIDInfo[]> {
    return await this.didLookupService.getAllDIDsByWallet(address);
  }

  /**
   * Verify user owns the DID before proceeding
   */
  async verifyAndRoute(did: string, address: string): Promise<AuthRouteResult> {
    const isOwner = await this.didLookupService.verifyDIDOwnership(did, address);
    
    if (!isOwner) {
      return {
        route: 'signup',
        message: 'DID ownership verification failed'
      };
    }

    const didInfo = await this.didLookupService.findDIDByWallet(address);
    return {
      route: 'dashboard',
      didInfo: didInfo!,
      message: 'Account verified successfully'
    };
  }
}

/**
 * React hook for wallet-DID recognition
 */
export function useWalletDIDRecognition() {
  // Note: This would need React import in actual usage
  const [isLoading, setIsLoading] = React.useState(true);
  const [routeResult, setRouteResult] = React.useState<AuthRouteResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const authRouter = React.useMemo(() => new AuthRouter(), []);

  const checkWalletAndRoute = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await authRouter.determineUserRoute();
      setRouteResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setRouteResult({
        route: 'signup',
        message: 'Error checking account status'
      });
    } finally {
      setIsLoading(false);
    }
  }, [authRouter]);

  React.useEffect(() => {
    checkWalletAndRoute();
  }, [checkWalletAndRoute]);

  return {
    isLoading,
    routeResult,
    error,
    recheckRoute: checkWalletAndRoute
  };
}

// Export singleton instances for convenience
export const walletService = new WalletService();
export const didLookupService = new DIDLookupService();
export const authRouter = new AuthRouter();