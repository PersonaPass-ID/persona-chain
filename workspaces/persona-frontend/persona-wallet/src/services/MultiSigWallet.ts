// Multi-Signature Wallet Implementation for PersonaWallet
// Supports threshold signatures and collaborative transaction management

import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
import { SigningStargateClient } from '@cosmjs/stargate';
import { stringToPath } from '@cosmjs/crypto';

export interface MultiSigConfig {
  threshold: number;           // Required signatures (e.g., 2 of 3)
  signers: string[];          // Public keys of all signers
  timeout: number;            // Transaction timeout in seconds
  description?: string;       // Optional description
}

export interface TransactionProposal {
  id: string;
  multiSigAddress: string;
  transaction: any;
  proposer: string;
  signatures: SignatureInfo[];
  threshold: number;
  status: 'pending' | 'approved' | 'executed' | 'expired';
  createdAt: Date;
  expiresAt: Date;
}

export interface SignatureInfo {
  signer: string;
  signature: string;
  publicKey: string;
  timestamp: Date;
}

export class MultiSigWallet {
  private signingClient?: SigningStargateClient;
  private proposals: Map<string, TransactionProposal> = new Map();

  constructor(private rpcEndpoint: string = 'http://personachain-rpc-lb-463662045.us-east-1.elb.amazonaws.com') {}

  /**
   * Initialize multi-sig wallet service
   */
  async initialize(wallet: DirectSecp256k1HdWallet): Promise<void> {
    this.signingClient = await SigningStargateClient.connectWithSigner(
      this.rpcEndpoint,
      wallet
    );
  }

  /**
   * Create a new multi-signature wallet
   */
  async createMultiSig(config: MultiSigConfig): Promise<string> {
    try {
      // Validate configuration
      this.validateMultiSigConfig(config);

      // Generate multi-sig address using PersonaChain's multi-sig module
      const multiSigAddress = await this.generateMultiSigAddress(config);

      // Store multi-sig configuration
      await this.storeMultiSigConfig(multiSigAddress, config);

      // Deploy multi-sig contract if needed
      await this.deployMultiSigContract(multiSigAddress, config);

      console.log(`Multi-sig wallet created: ${multiSigAddress}`);
      return multiSigAddress;
    } catch (error) {
      console.error('Error creating multi-sig wallet:', error);
      throw new Error(`Failed to create multi-sig wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Propose a new transaction
   */
  async proposeTransaction(
    multiSigAddress: string,
    transaction: any,
    description?: string
  ): Promise<string> {
    try {
      const proposalId = this.generateProposalId();
      const config = await this.getMultiSigConfig(multiSigAddress);

      if (!config) {
        throw new Error('Multi-sig wallet not found');
      }

      // Create proposal
      const proposal: TransactionProposal = {
        id: proposalId,
        multiSigAddress,
        transaction,
        proposer: transaction.sender || '',
        signatures: [],
        threshold: config.threshold,
        status: 'pending',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + config.timeout * 1000)
      };

      // Store proposal
      this.proposals.set(proposalId, proposal);
      await this.storeProposal(proposal);

      // Notify other signers
      await this.notifySigners(config.signers, proposal);

      console.log(`Transaction proposed: ${proposalId}`);
      return proposalId;
    } catch (error) {
      console.error('Error proposing transaction:', error);
      throw new Error(`Failed to propose transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Sign a pending proposal
   */
  async signProposal(
    proposalId: string,
    wallet: DirectSecp256k1HdWallet
  ): Promise<void> {
    try {
      const proposal = await this.getProposal(proposalId);

      if (!proposal) {
        throw new Error('Proposal not found');
      }

      if (proposal.status !== 'pending') {
        throw new Error('Proposal is no longer pending');
      }

      if (new Date() > proposal.expiresAt) {
        proposal.status = 'expired';
        throw new Error('Proposal has expired');
      }

      // Check if signer is authorized
      const config = await this.getMultiSigConfig(proposal.multiSigAddress);
      const [{ address: signerAddress }] = await wallet.getAccounts();

      if (!config?.signers.includes(signerAddress)) {
        throw new Error('Unauthorized signer');
      }

      // Check if already signed
      const existingSignature = proposal.signatures.find(
        sig => sig.signer === signerAddress
      );

      if (existingSignature) {
        throw new Error('Already signed by this signer');
      }

      // Create signature
      const signature = await this.createSignature(wallet, proposal.transaction);

      // Add signature to proposal
      proposal.signatures.push({
        signer: signerAddress,
        signature: signature.signature,
        publicKey: signature.publicKey,
        timestamp: new Date()
      });

      // Check if threshold reached
      if (proposal.signatures.length >= proposal.threshold) {
        proposal.status = 'approved';
        
        // Automatically execute if all signatures collected
        if (proposal.signatures.length === config.signers.length) {
          await this.executeProposal(proposal);
        }
      }

      // Update proposal
      await this.updateProposal(proposal);

      console.log(`Proposal signed: ${proposalId} (${proposal.signatures.length}/${proposal.threshold})`);
    } catch (error) {
      console.error('Error signing proposal:', error);
      throw new Error(`Failed to sign proposal: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Execute an approved proposal
   */
  async executeProposal(proposal: TransactionProposal): Promise<string> {
    try {
      if (proposal.status !== 'approved') {
        throw new Error('Proposal not approved');
      }

      if (!this.signingClient) {
        throw new Error('Signing client not initialized');
      }

      // Prepare multi-sig transaction
      const multiSigTx = await this.prepareMultiSigTransaction(proposal);

      // Broadcast transaction
      const result = await this.signingClient.broadcastTx(multiSigTx);

      if (result.code !== 0) {
        throw new Error(`Transaction failed: ${result.rawLog}`);
      }

      // Update proposal status
      proposal.status = 'executed';
      await this.updateProposal(proposal);

      console.log(`Proposal executed: ${proposal.id} - TxHash: ${result.transactionHash}`);
      return result.transactionHash;
    } catch (error) {
      console.error('Error executing proposal:', error);
      throw new Error(`Failed to execute proposal: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get pending proposals for a signer
   */
  async getPendingProposals(signerAddress: string): Promise<TransactionProposal[]> {
    const pending = Array.from(this.proposals.values()).filter(proposal => {
      if (proposal.status !== 'pending') return false;
      if (new Date() > proposal.expiresAt) {
        proposal.status = 'expired';
        return false;
      }

      // Check if signer is authorized and hasn't signed yet
      const alreadySigned = proposal.signatures.some(sig => sig.signer === signerAddress);
      return !alreadySigned;
    });

    return pending;
  }

  /**
   * Get multi-sig wallet information
   */
  async getMultiSigInfo(multiSigAddress: string): Promise<{
    config: MultiSigConfig;
    balance: string;
    pendingProposals: number;
  } | null> {
    try {
      const config = await this.getMultiSigConfig(multiSigAddress);
      if (!config) return null;

      // Get balance
      const balance = await this.getBalance(multiSigAddress);

      // Count pending proposals
      const pendingProposals = Array.from(this.proposals.values())
        .filter(p => p.multiSigAddress === multiSigAddress && p.status === 'pending')
        .length;

      return {
        config,
        balance: balance.amount,
        pendingProposals
      };
    } catch (error) {
      console.error('Error getting multi-sig info:', error);
      return null;
    }
  }

  // Private helper methods

  private validateMultiSigConfig(config: MultiSigConfig): void {
    if (config.threshold <= 0 || config.threshold > config.signers.length) {
      throw new Error('Invalid threshold: must be between 1 and number of signers');
    }

    if (config.signers.length < 2) {
      throw new Error('Multi-sig requires at least 2 signers');
    }

    if (config.timeout <= 0) {
      throw new Error('Timeout must be positive');
    }

    // Validate unique signers
    const uniqueSigners = new Set(config.signers);
    if (uniqueSigners.size !== config.signers.length) {
      throw new Error('Duplicate signers not allowed');
    }
  }

  private async generateMultiSigAddress(config: MultiSigConfig): Promise<string> {
    // Generate deterministic multi-sig address
    const sorted = [...config.signers].sort();
    const data = `${sorted.join('')}${config.threshold}`;
    
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data));
    const hashArray = Array.from(new Uint8Array(hash));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return `persona1multisig${hashHex.substring(0, 38)}`;
  }

  private async storeMultiSigConfig(address: string, config: MultiSigConfig): Promise<void> {
    const key = `multisig_config_${address}`;
    localStorage.setItem(key, JSON.stringify({
      ...config,
      address,
      createdAt: new Date().toISOString()
    }));
  }

  private async getMultiSigConfig(address: string): Promise<MultiSigConfig | null> {
    const key = `multisig_config_${address}`;
    const stored = localStorage.getItem(key);
    
    if (!stored) return null;
    
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }

  private async deployMultiSigContract(address: string, config: MultiSigConfig): Promise<void> {
    // In production, this would deploy actual multi-sig contract
    console.log(`Deploying multi-sig contract for ${address} with config:`, config);
  }

  private generateProposalId(): string {
    return `prop_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  private async getProposal(proposalId: string): Promise<TransactionProposal | null> {
    // Check memory first
    let proposal: TransactionProposal | undefined | null = this.proposals.get(proposalId);
    
    if (!proposal) {
      // Load from storage
      proposal = await this.loadProposal(proposalId);
      if (proposal) {
        this.proposals.set(proposalId, proposal);
      }
    }

    return proposal || null;
  }

  private async storeProposal(proposal: TransactionProposal): Promise<void> {
    const key = `proposal_${proposal.id}`;
    localStorage.setItem(key, JSON.stringify(proposal));
  }

  private async loadProposal(proposalId: string): Promise<TransactionProposal | null> {
    const key = `proposal_${proposalId}`;
    const stored = localStorage.getItem(key);
    
    if (!stored) return null;
    
    try {
      const data = JSON.parse(stored);
      return {
        ...data,
        createdAt: new Date(data.createdAt),
        expiresAt: new Date(data.expiresAt),
        signatures: data.signatures.map((sig: any) => ({
          ...sig,
          timestamp: new Date(sig.timestamp)
        }))
      };
    } catch {
      return null;
    }
  }

  private async updateProposal(proposal: TransactionProposal): Promise<void> {
    this.proposals.set(proposal.id, proposal);
    await this.storeProposal(proposal);
  }

  private async notifySigners(signers: string[], proposal: TransactionProposal): Promise<void> {
    // In production, send notifications to other signers
    console.log(`Notifying ${signers.length} signers about proposal ${proposal.id}`);
  }

  private async createSignature(
    wallet: DirectSecp256k1HdWallet, 
    transaction: any
  ): Promise<{ signature: string; publicKey: string }> {
    // Create signature for transaction
    const message = new TextEncoder().encode(JSON.stringify(transaction));
    const [{ address }] = await wallet.getAccounts();
    
    // In production, use proper signing
    const signature = await crypto.subtle.digest('SHA-256', message);
    const publicKey = address; // Simplified for demo
    
    return {
      signature: Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join(''),
      publicKey
    };
  }

  private async prepareMultiSigTransaction(proposal: TransactionProposal): Promise<Uint8Array> {
    // Prepare actual multi-sig transaction with all signatures
    // This is simplified - in production would use proper Cosmos SDK multi-sig
    return new TextEncoder().encode(JSON.stringify({
      ...proposal.transaction,
      signatures: proposal.signatures
    }));
  }

  private async getBalance(address: string): Promise<{ amount: string; denom: string }> {
    if (!this.signingClient) {
      return { amount: '0', denom: 'persona' };
    }

    try {
      const balance = await this.signingClient.getBalance(address, 'persona');
      return balance || { amount: '0', denom: 'persona' };
    } catch {
      return { amount: '0', denom: 'persona' };
    }
  }

  /**
   * Remove expired proposals
   */
  async cleanupExpiredProposals(): Promise<void> {
    const now = new Date();
    const expired = Array.from(this.proposals.entries())
      .filter(([_, proposal]) => now > proposal.expiresAt && proposal.status === 'pending')
      .map(([id, proposal]) => ({ id, proposal }));

    for (const { id, proposal } of expired) {
      proposal.status = 'expired';
      await this.updateProposal(proposal);
    }

    console.log(`Cleaned up ${expired.length} expired proposals`);
  }

  /**
   * Get multi-sig transaction history
   */
  async getTransactionHistory(multiSigAddress: string): Promise<TransactionProposal[]> {
    return Array.from(this.proposals.values())
      .filter(proposal => proposal.multiSigAddress === multiSigAddress)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}

export const multiSigWallet = new MultiSigWallet();