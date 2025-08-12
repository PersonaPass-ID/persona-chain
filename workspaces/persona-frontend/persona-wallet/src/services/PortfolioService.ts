// Portfolio Service for PersonaWallet
// Comprehensive portfolio analytics and transaction tracking

import { SigningStargateClient, StargateClient } from '@cosmjs/stargate';
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
import { Coin } from '@cosmjs/amino';

export interface Portfolio {
  totalValue: number;
  totalValueChange24h: number;
  totalValueChangePercent24h: number;
  tokens: TokenBalance[];
  staking: StakingPortfolio;
  nfts: NFTCollection[];
  performance: PerformanceMetrics;
  lastUpdated: Date;
}

export interface TokenBalance {
  denom: string;
  amount: string;
  decimals: number;
  symbol: string;
  name: string;
  price: number;
  priceChange24h: number;
  value: number;
  valueChange24h: number;
}

export interface StakingPortfolio {
  totalStaked: string;
  totalRewards: string;
  apr: number;
  validators: ValidatorStakeInfo[];
}

export interface ValidatorStakeInfo {
  validatorAddress: string;
  validatorName: string;
  stakedAmount: string;
  pendingRewards: string;
  apr: number;
  commission: number;
}

export interface NFTCollection {
  collectionName: string;
  collectionAddress: string;
  floorPrice: number;
  items: NFTItem[];
}

export interface NFTItem {
  tokenId: string;
  name: string;
  image: string;
  attributes: NFTAttribute[];
  lastSalePrice?: number;
  estimatedValue?: number;
}

export interface NFTAttribute {
  traitType: string;
  value: string;
  rarity?: number;
}

export interface PerformanceMetrics {
  totalReturn: number;
  totalReturnPercent: number;
  dayReturn: number;
  dayReturnPercent: number;
  weekReturn: number;
  weekReturnPercent: number;
  monthReturn: number;
  monthReturnPercent: number;
  yearReturn: number;
  yearReturnPercent: number;
  bestDay: { date: string; return: number };
  worstDay: { date: string; return: number };
}

export interface TransactionHistory {
  transactions: TransactionRecord[];
  totalCount: number;
  hasMore: boolean;
}

export interface TransactionRecord {
  txHash: string;
  type: 'send' | 'receive' | 'delegate' | 'undelegate' | 'reward' | 'vote' | 'multisig' | 'did';
  amount: string;
  denom: string;
  fee: string;
  from: string;
  to: string;
  timestamp: Date;
  status: 'success' | 'failed' | 'pending';
  memo?: string;
  blockHeight?: number;
  gasUsed?: number;
  gasWanted?: number;
}

export interface PriceData {
  denom: string;
  price: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  volume24h: number;
  marketCap: number;
  lastUpdated: Date;
}

export class PortfolioService {
  private queryClient?: StargateClient;
  private walletAddress?: string;
  private priceCache = new Map<string, PriceData>();
  private portfolioCache?: Portfolio;
  private lastCacheUpdate = 0;
  private readonly CACHE_TTL = 60000; // 1 minute

  constructor(private rpcEndpoint: string = 'http://personachain-rpc-lb-463662045.us-east-1.elb.amazonaws.com') {}

  /**
   * Initialize portfolio service
   */
  async initialize(wallet: DirectSecp256k1HdWallet): Promise<void> {
    this.queryClient = await StargateClient.connect(this.rpcEndpoint);
    const [{ address }] = await wallet.getAccounts();
    this.walletAddress = address;

    // Pre-load price data
    await this.updatePriceData();
  }

  /**
   * Get complete portfolio overview
   */
  async getPortfolio(): Promise<Portfolio> {
    if (!this.queryClient || !this.walletAddress) {
      throw new Error('Portfolio service not initialized');
    }

    // Check cache
    if (this.portfolioCache && Date.now() - this.lastCacheUpdate < this.CACHE_TTL) {
      return this.portfolioCache;
    }

    try {
      // Get all balances
      const tokens = await this.getAllBalances();
      
      // Get staking information
      const staking = await this.getStakingPortfolio();
      
      // Get NFTs (placeholder for now)
      const nfts = await this.getNFTs();
      
      // Calculate performance metrics
      const performance = await this.getPerformanceMetrics();
      
      // Calculate total portfolio value
      const totalValue = this.calculateTotalValue(tokens, staking);
      const totalValueChange24h = this.calculateTotalValueChange24h(tokens);
      const totalValueChangePercent24h = totalValue > 0 ? (totalValueChange24h / (totalValue - totalValueChange24h)) * 100 : 0;

      const portfolio: Portfolio = {
        totalValue,
        totalValueChange24h,
        totalValueChangePercent24h,
        tokens,
        staking,
        nfts,
        performance,
        lastUpdated: new Date()
      };

      // Cache portfolio
      this.portfolioCache = portfolio;
      this.lastCacheUpdate = Date.now();

      return portfolio;
    } catch (error) {
      console.error('Error getting portfolio:', error);
      throw new Error(`Failed to get portfolio: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all token balances with price information
   */
  async getAllBalances(): Promise<TokenBalance[]> {
    if (!this.queryClient || !this.walletAddress) {
      throw new Error('Portfolio service not initialized');
    }

    try {
      const balances = await this.queryClient.getAllBalances(this.walletAddress);
      const tokenBalances: TokenBalance[] = [];

      for (const balance of balances) {
        const priceData = this.priceCache.get(balance.denom);
        const tokenInfo = this.getTokenInfo(balance.denom);
        
        tokenBalances.push({
          denom: balance.denom,
          amount: balance.amount,
          decimals: tokenInfo.decimals,
          symbol: tokenInfo.symbol,
          name: tokenInfo.name,
          price: priceData?.price || 0,
          priceChange24h: priceData?.priceChange24h || 0,
          value: this.calculateTokenValue(balance.amount, tokenInfo.decimals, priceData?.price || 0),
          valueChange24h: this.calculateValueChange24h(balance.amount, tokenInfo.decimals, priceData)
        });
      }

      return tokenBalances.sort((a, b) => b.value - a.value);
    } catch (error) {
      console.error('Error getting balances:', error);
      throw new Error(`Failed to get balances: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get staking portfolio information
   */
  async getStakingPortfolio(): Promise<StakingPortfolio> {
    if (!this.queryClient || !this.walletAddress) {
      throw new Error('Portfolio service not initialized');
    }

    try {
      // Mock implementation - no staking data currently
      const totalStaked = '0';
      const totalRewards = '0';
      const validators: ValidatorStakeInfo[] = [];

      const averageAPR = validators.length > 0 
        ? validators.reduce((sum, v) => sum + v.apr, 0) / validators.length 
        : 0;

      return {
        totalStaked,
        totalRewards,
        apr: averageAPR,
        validators
      };
    } catch (error) {
      console.error('Error getting staking portfolio:', error);
      return {
        totalStaked: '0',
        totalRewards: '0',
        apr: 0,
        validators: []
      };
    }
  }

  /**
   * Get NFT collections (placeholder implementation)
   */
  async getNFTs(): Promise<NFTCollection[]> {
    // Placeholder - in production would query actual NFT data
    return [];
  }

  /**
   * Get detailed transaction history
   */
  async getTransactionHistory(limit: number = 100, offset: number = 0): Promise<TransactionHistory> {
    if (!this.queryClient || !this.walletAddress) {
      throw new Error('Portfolio service not initialized');
    }

    try {
      // In production, this would use an indexer service
      // For now, we'll return mock data structure
      const transactions: TransactionRecord[] = [];
      
      // Get recent transactions from local storage or indexer
      const storedTxs = this.getStoredTransactions();
      
      return {
        transactions: storedTxs.slice(offset, offset + limit),
        totalCount: storedTxs.length,
        hasMore: offset + limit < storedTxs.length
      };
    } catch (error) {
      console.error('Error getting transaction history:', error);
      return {
        transactions: [],
        totalCount: 0,
        hasMore: false
      };
    }
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    try {
      // In production, calculate from historical data
      return {
        totalReturn: 1250.50,
        totalReturnPercent: 15.5,
        dayReturn: 45.20,
        dayReturnPercent: 2.1,
        weekReturn: 125.80,
        weekReturnPercent: 6.2,
        monthReturn: 380.40,
        monthReturnPercent: 12.8,
        yearReturn: 1250.50,
        yearReturnPercent: 15.5,
        bestDay: { date: '2024-01-15', return: 8.5 },
        worstDay: { date: '2024-01-22', return: -3.2 }
      };
    } catch (error) {
      console.error('Error calculating performance metrics:', error);
      return {
        totalReturn: 0,
        totalReturnPercent: 0,
        dayReturn: 0,
        dayReturnPercent: 0,
        weekReturn: 0,
        weekReturnPercent: 0,
        monthReturn: 0,
        monthReturnPercent: 0,
        yearReturn: 0,
        yearReturnPercent: 0,
        bestDay: { date: '', return: 0 },
        worstDay: { date: '', return: 0 }
      };
    }
  }

  /**
   * Update price data for tokens
   */
  async updatePriceData(): Promise<void> {
    try {
      // In production, fetch from price APIs like CoinGecko
      const mockPrices = {
        'persona': { price: 0.85, priceChange24h: 0.07, priceChangePercent24h: 8.9, volume24h: 125000, marketCap: 85000000 },
        'upersona': { price: 0.000085, priceChange24h: 0.000007, priceChangePercent24h: 8.9, volume24h: 125000, marketCap: 85000000 }
      };

      for (const [denom, data] of Object.entries(mockPrices)) {
        this.priceCache.set(denom, {
          denom,
          ...data,
          lastUpdated: new Date()
        });
      }
    } catch (error) {
      console.error('Error updating price data:', error);
    }
  }

  /**
   * Export portfolio data
   */
  async exportPortfolioData(format: 'json' | 'csv' = 'json'): Promise<string> {
    const portfolio = await this.getPortfolio();
    const transactionHistory = await this.getTransactionHistory(1000);

    const exportData = {
      portfolio,
      transactionHistory,
      exportedAt: new Date().toISOString()
    };

    if (format === 'json') {
      return JSON.stringify(exportData, null, 2);
    } else {
      // Convert to CSV format
      return this.convertToCSV(exportData);
    }
  }

  // Private helper methods

  private getTokenInfo(denom: string): { decimals: number; symbol: string; name: string } {
    const tokenMap: Record<string, any> = {
      'persona': { decimals: 6, symbol: 'PERSONA', name: 'Persona Token' },
      'upersona': { decimals: 6, symbol: 'PERSONA', name: 'Persona Token' }
    };

    return tokenMap[denom] || { decimals: 6, symbol: denom.toUpperCase(), name: denom };
  }

  private calculateTokenValue(amount: string, decimals: number, price: number): number {
    const tokenAmount = parseFloat(amount) / Math.pow(10, decimals);
    return tokenAmount * price;
  }

  private calculateValueChange24h(amount: string, decimals: number, priceData?: PriceData): number {
    if (!priceData) return 0;
    
    const tokenAmount = parseFloat(amount) / Math.pow(10, decimals);
    return tokenAmount * priceData.priceChange24h;
  }

  private calculateTotalValue(tokens: TokenBalance[], staking: StakingPortfolio): number {
    const tokenValue = tokens.reduce((sum, token) => sum + token.value, 0);
    const stakingValue = this.calculateTokenValue(staking.totalStaked, 6, this.priceCache.get('persona')?.price || 0);
    const rewardsValue = this.calculateTokenValue(staking.totalRewards, 6, this.priceCache.get('persona')?.price || 0);
    
    return tokenValue + stakingValue + rewardsValue;
  }

  private calculateTotalValueChange24h(tokens: TokenBalance[]): number {
    return tokens.reduce((sum, token) => sum + token.valueChange24h, 0);
  }

  private async calculateValidatorAPR(validatorAddress: string): Promise<number> {
    try {
      // In production, calculate actual APR based on validator performance
      return 12.5; // 12.5% APR
    } catch {
      return 0;
    }
  }

  private addAmounts(amount1: string, amount2: string): string {
    return (BigInt(amount1) + BigInt(amount2)).toString();
  }

  private getStoredTransactions(): TransactionRecord[] {
    try {
      const stored = localStorage.getItem(`transactions_${this.walletAddress}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private convertToCSV(data: any): string {
    // Simple CSV conversion for transactions
    const transactions = data.transactionHistory.transactions;
    const headers = ['Date', 'Type', 'Amount', 'Denom', 'From', 'To', 'Fee', 'Status', 'TxHash'];
    
    const csvData = [
      headers.join(','),
      ...transactions.map((tx: TransactionRecord) => [
        tx.timestamp.toISOString(),
        tx.type,
        tx.amount,
        tx.denom,
        tx.from,
        tx.to,
        tx.fee,
        tx.status,
        tx.txHash
      ].join(','))
    ];

    return csvData.join('\n');
  }

  /**
   * Add transaction to history
   */
  addTransactionToHistory(transaction: TransactionRecord): void {
    try {
      const transactions = this.getStoredTransactions();
      transactions.unshift(transaction);
      
      // Keep only last 1000 transactions
      if (transactions.length > 1000) {
        transactions.splice(1000);
      }
      
      localStorage.setItem(`transactions_${this.walletAddress}`, JSON.stringify(transactions));
    } catch (error) {
      console.error('Error storing transaction:', error);
    }
  }

  /**
   * Get portfolio summary for quick overview
   */
  async getPortfolioSummary(): Promise<{
    totalValue: number;
    totalChange24h: number;
    tokenCount: number;
    stakingAPR: number;
  }> {
    try {
      const portfolio = await this.getPortfolio();
      
      return {
        totalValue: portfolio.totalValue,
        totalChange24h: portfolio.totalValueChangePercent24h,
        tokenCount: portfolio.tokens.length,
        stakingAPR: portfolio.staking.apr
      };
    } catch (error) {
      console.error('Error getting portfolio summary:', error);
      return {
        totalValue: 0,
        totalChange24h: 0,
        tokenCount: 0,
        stakingAPR: 0
      };
    }
  }
}

export const portfolioService = new PortfolioService();