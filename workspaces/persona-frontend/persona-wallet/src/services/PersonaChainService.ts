import { StargateClient, SigningStargateClient, calculateFee, GasPrice } from '@cosmjs/stargate';
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
import { stringToPath } from '@cosmjs/crypto';
import * as bip39 from 'bip39';
import { PERSONACHAIN_CONFIG } from '../config/personachain';
import { Wallet, DIDDocument } from '../types/wallet';

// Import advanced services
import { SecureKeyManager } from './SecureKeyManager';
import { HardwareWalletService } from './HardwareWalletService';
import { MultiSigWallet } from './MultiSigWallet';
import { StakingService } from './StakingService';
import { PortfolioService } from './PortfolioService';

export class PersonaChainService {
  private client?: StargateClient;
  private signingClient?: SigningStargateClient;
  private currentHdWallet?: DirectSecp256k1HdWallet;
  
  // Advanced service instances
  private secureKeyManager = SecureKeyManager.getInstance();
  private hardwareWalletService = new HardwareWalletService();
  private multiSigWallet = new MultiSigWallet();
  private stakingService = new StakingService();
  private portfolioService = new PortfolioService();

  // Service initialization flags
  private servicesInitialized = false;
  
  async connect(): Promise<void> {
    try {
      this.client = await StargateClient.connect(PERSONACHAIN_CONFIG.rpcEndpoint);
      console.log('✅ Connected to PersonaChain:', PERSONACHAIN_CONFIG.chainId);
    } catch (error) {
      console.error('❌ Failed to connect to PersonaChain:', error);
      throw error;
    }
  }

  async createWallet(): Promise<Wallet> {
    // Use secure mnemonic generation
    const mnemonic = await this.secureKeyManager.generateSecureMnemonic();
    
    const wallet = await this.secureKeyManager.createSecureWallet(mnemonic);
    this.currentHdWallet = wallet; // Store HD wallet for multi-sig operations

    const accounts = await wallet.getAccounts();
    const address = accounts[0].address;
    const publicKey = Buffer.from(accounts[0].pubkey).toString('base64');

    // Initialize advanced services with wallet
    await this.initializeAdvancedServices(wallet);

    // Get balance
    const balance = await this.getBalance(address);

    return {
      address,
      mnemonic,
      publicKey,
      balance,
    };
  }

  async importWallet(mnemonic: string): Promise<Wallet> {
    if (!bip39.validateMnemonic(mnemonic)) {
      throw new Error('Invalid mnemonic phrase');
    }

    const wallet = await this.secureKeyManager.createSecureWallet(mnemonic);
    this.currentHdWallet = wallet; // Store HD wallet for multi-sig operations

    const accounts = await wallet.getAccounts();
    const address = accounts[0].address;
    const publicKey = Buffer.from(accounts[0].pubkey).toString('base64');

    // Initialize advanced services with wallet
    await this.initializeAdvancedServices(wallet);

    // Get balance
    const balance = await this.getBalance(address);

    return {
      address,
      mnemonic,
      publicKey,
      balance,
    };
  }

  async getBalance(address: string): Promise<string> {
    if (!this.client) {
      await this.connect();
    }

    try {
      const balance = await this.client!.getBalance(address, PERSONACHAIN_CONFIG.coinMinimalDenom);
      const formattedBalance = (parseInt(balance.amount) / Math.pow(10, PERSONACHAIN_CONFIG.coinDecimals)).toString();
      return formattedBalance;
    } catch (error) {
      console.error('Error fetching balance:', error);
      return '0';
    }
  }

  async createDID(wallet: Wallet): Promise<DIDDocument> {
    const didId = `did:persona:${wallet.address}`;
    
    const didDocument: DIDDocument = {
      '@context': [
        'https://www.w3.org/ns/did/v1',
        'https://w3id.org/security/v1'
      ],
      id: didId,
      authentication: [{
        id: `${didId}#keys-1`,
        type: 'Secp256k1VerificationKey2018',
        controller: didId,
        publicKeyBase58: wallet.publicKey,
      }],
      service: [],
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    };

    // TODO: In production, submit this to PersonaChain's DID registry
    console.log('🆔 DID Document created:', didDocument);
    
    return didDocument;
  }

  async sendTokens(fromWallet: Wallet, toAddress: string, amount: string): Promise<string> {
    if (!this.signingClient) {
      // Create signing client
      const wallet = await DirectSecp256k1HdWallet.fromMnemonic(
        fromWallet.mnemonic!,
        {
          hdPaths: [stringToPath("m/44'/118'/0'/0/0")],
          prefix: PERSONACHAIN_CONFIG.addressPrefix,
        }
      );

      this.signingClient = await SigningStargateClient.connectWithSigner(
        PERSONACHAIN_CONFIG.rpcEndpoint,
        wallet,
        {
          gasPrice: GasPrice.fromString(`0.001${PERSONACHAIN_CONFIG.coinMinimalDenom}`),
        }
      );
    }

    const amountToSend = {
      denom: PERSONACHAIN_CONFIG.coinMinimalDenom,
      amount: (parseFloat(amount) * Math.pow(10, PERSONACHAIN_CONFIG.coinDecimals)).toString(),
    };

    const fee = calculateFee(200000, GasPrice.fromString(`0.001${PERSONACHAIN_CONFIG.coinMinimalDenom}`));

    const result = await this.signingClient.sendTokens(
      fromWallet.address,
      toAddress,
      [amountToSend],
      fee,
      'PersonaWallet transfer'
    );

    return result.transactionHash;
  }

  async getChainInfo() {
    if (!this.client) {
      await this.connect();
    }

    try {
      const chainId = await this.client!.getChainId();
      const height = await this.client!.getHeight();
      
      return {
        chainId,
        height,
        config: PERSONACHAIN_CONFIG,
      };
    } catch (error) {
      console.error('Error fetching chain info:', error);
      throw error;
    }
  }

  // Advanced service integration methods

  /**
   * Initialize all advanced services with wallet
   */
  private async initializeAdvancedServices(wallet: DirectSecp256k1HdWallet): Promise<void> {
    if (this.servicesInitialized) return;

    try {
      await Promise.all([
        this.multiSigWallet.initialize(wallet),
        this.stakingService.initialize(wallet),
        this.portfolioService.initialize(wallet)
      ]);
      
      this.servicesInitialized = true;
      console.log('✅ All advanced services initialized');
    } catch (error) {
      console.error('❌ Error initializing advanced services:', error);
      throw error;
    }
  }

  /**
   * Get secure key manager instance
   */
  getSecureKeyManager(): SecureKeyManager {
    return this.secureKeyManager;
  }

  /**
   * Get hardware wallet service
   */
  getHardwareWalletService(): HardwareWalletService {
    return this.hardwareWalletService;
  }

  /**
   * Get multi-sig wallet service
   */
  getMultiSigWallet(): MultiSigWallet {
    return this.multiSigWallet;
  }

  /**
   * Get staking service
   */
  getStakingService(): StakingService {
    return this.stakingService;
  }

  /**
   * Get portfolio service
   */
  getPortfolioService(): PortfolioService {
    return this.portfolioService;
  }

  /**
   * Enhanced transaction validation using security manager
   */
  async validateTransaction(transaction: any): Promise<{ isValid: boolean; warnings: string[] }> {
    return this.secureKeyManager.validateTransaction(transaction);
  }

  /**
   * Start secure session with auto-lock
   */
  startSecureSession(timeout?: number): void {
    this.secureKeyManager.startSecureSession(timeout);
  }

  /**
   * Lock wallet and clear sensitive data
   */
  lockWallet(): void {
    this.secureKeyManager.lockWallet();
  }

  /**
   * Check if wallet is locked
   */
  isWalletLocked(): boolean {
    return this.secureKeyManager.isWalletLocked();
  }

  /**
   * Get complete portfolio overview
   */
  async getPortfolio() {
    if (!this.servicesInitialized) {
      throw new Error('Services not initialized. Please create or import a wallet first.');
    }
    return await this.portfolioService.getPortfolio();
  }

  /**
   * Delegate tokens to validator
   */
  async delegateTokens(validatorAddress: string, amount: string): Promise<string> {
    if (!this.servicesInitialized) {
      throw new Error('Services not initialized. Please create or import a wallet first.');
    }
    return await this.stakingService.delegate(validatorAddress, amount);
  }

  /**
   * Get all validators
   */
  async getValidators(status?: 'bonded' | 'unbonded' | 'unbonding') {
    if (!this.servicesInitialized) {
      throw new Error('Services not initialized. Please create or import a wallet first.');
    }
    return await this.stakingService.getValidators(status);
  }

  /**
   * Get staking rewards
   */
  async getStakingRewards() {
    if (!this.servicesInitialized) {
      throw new Error('Services not initialized. Please create or import a wallet first.');
    }
    return await this.stakingService.getRewards();
  }

  /**
   * Withdraw staking rewards
   */
  async withdrawStakingRewards(validatorAddress?: string): Promise<string> {
    if (!this.servicesInitialized) {
      throw new Error('Services not initialized. Please create or import a wallet first.');
    }
    return await this.stakingService.withdrawRewards(validatorAddress);
  }

  /**
   * Create multi-signature wallet
   */
  async createMultiSigWallet(config: any): Promise<string> {
    if (!this.servicesInitialized) {
      throw new Error('Services not initialized. Please create or import a wallet first.');
    }
    return await this.multiSigWallet.createMultiSig(config);
  }

  /**
   * Detect connected hardware wallets
   */
  async detectHardwareWallets() {
    return await this.hardwareWalletService.detectHardwareWallets();
  }

  /**
   * Connect to hardware wallet
   */
  async connectHardwareWallet(type: 'ledger' | 'trezor') {
    if (type === 'ledger') {
      return await this.hardwareWalletService.connectLedger();
    } else {
      return await this.hardwareWalletService.connectTrezor();
    }
  }

  /**
   * Export portfolio data
   */
  async exportPortfolioData(format: 'json' | 'csv' = 'json'): Promise<string> {
    if (!this.servicesInitialized) {
      throw new Error('Services not initialized. Please create or import a wallet first.');
    }
    return await this.portfolioService.exportPortfolioData(format);
  }

  /**
   * Generate secure backup
   */
  async generateSecureBackup(password: string) {
    return await this.secureKeyManager.generateSecureBackup(password);
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(limit?: number, offset?: number) {
    if (!this.servicesInitialized) {
      throw new Error('Services not initialized. Please create or import a wallet first.');
    }
    return await this.portfolioService.getTransactionHistory(limit, offset);
  }

  /**
   * Vote on governance proposal
   */
  async voteOnProposal(proposalId: string, option: number): Promise<string> {
    if (!this.servicesInitialized) {
      throw new Error('Services not initialized. Please create or import a wallet first.');
    }
    return await this.stakingService.vote(proposalId, option);
  }

  /**
   * Get governance proposals
   */
  async getGovernanceProposals(status?: number) {
    if (!this.servicesInitialized) {
      throw new Error('Services not initialized. Please create or import a wallet first.');
    }
    return await this.stakingService.getProposals(status);
  }

  /**
   * Get current HD wallet for multi-signature operations
   */
  getCurrentHdWallet(): DirectSecp256k1HdWallet | null {
    return this.currentHdWallet || null;
  }
}

export const personaChainService = new PersonaChainService();