// Real Multi-signature Implementation for PersonaWallet
// Supports Cosmos SDK multi-sig accounts and transactions

import { SigningStargateClient, StargateClient } from '@cosmjs/stargate';
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
import { MultisigThresholdPubkey, pubkeyToAddress, encodeSecp256k1Pubkey } from '@cosmjs/amino';
import { toBase64, fromBase64 } from '@cosmjs/encoding';
import { Uint53, Decimal } from '@cosmjs/math';
import { coins, parseCoins } from '@cosmjs/stargate';
import { TxRaw } from 'cosmjs-types/cosmos/tx/v1beta1/tx';
import { PERSONACHAIN_CONFIG, PERSONAPASS_CONFIG } from '../config/personachain';
import { MultisigValidator } from '../utils/multisig-validator';

export interface MultisigAccount {
  id: string;
  address: string;
  threshold: number;
  pubkeys: {
    address: string;
    pubkey: string;
    name?: string;
  }[];
  balance?: {
    denom: string;
    amount: string;
  }[];
  createdAt: Date;
  lastActivity?: Date;
}

export interface MultisigTransaction {
  id: string;
  multisigAddress: string;
  type: 'send' | 'delegate' | 'vote' | 'custom';
  recipients?: {
    address: string;
    amount: {
      denom: string;
      amount: string;
    }[];
  }[];
  validatorAddress?: string;
  proposalId?: string;
  vote?: 'yes' | 'no' | 'abstain' | 'no_with_veto';
  memo?: string;
  fee: {
    amount: {
      denom: string;
      amount: string;
    }[];
    gas: string;
  };
  signatures: {
    address: string;
    signature?: string;
    signed: boolean;
    signedAt?: Date;
  }[];
  status: 'pending' | 'ready' | 'broadcast' | 'confirmed' | 'failed';
  txHash?: string;
  createdAt: Date;
  expiresAt?: Date;
  rawTx?: string; // Base64 encoded TxRaw
}

export interface MultisigProposal {
  id: string;
  multisigAddress: string;
  title: string;
  description: string;
  proposer: string;
  type: 'add_member' | 'remove_member' | 'change_threshold' | 'transfer_ownership';
  newMember?: {
    address: string;
    pubkey: string;
    name?: string;
  };
  removeMember?: string;
  newThreshold?: number;
  newOwner?: string;
  votes: {
    address: string;
    vote: 'yes' | 'no' | 'abstain';
    votedAt: Date;
  }[];
  status: 'active' | 'passed' | 'rejected' | 'executed';
  createdAt: Date;
  expiresAt: Date;
}

export class MultisigService {
  private stargateClient: StargateClient | null = null;
  private multisigAccounts: Map<string, MultisigAccount> = new Map();
  private pendingTransactions: Map<string, MultisigTransaction> = new Map();
  private proposals: Map<string, MultisigProposal> = new Map();

  constructor() {
    this.loadFromLocalStorage();
  }

  /**
   * Initialize connection to PersonaChain
   */
  async initialize(): Promise<void> {
    try {
      this.stargateClient = await StargateClient.connect(PERSONACHAIN_CONFIG.rpcEndpoint);
      console.log('MultisigService initialized with PersonaChain connection');
    } catch (error) {
      console.error('Failed to initialize MultisigService:', error);
      throw new Error(`MultisigService initialization failed: ${error}`);
    }
  }

  /**
   * Create a new multi-signature account
   */
  async createMultisigAccount(
    threshold: number,
    pubkeys: { address: string; pubkey: string; name?: string }[]
  ): Promise<MultisigAccount> {
    // Comprehensive security validation
    const validation = MultisigValidator.validateMultisigCreation(threshold, pubkeys);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join('; ')}`);
    }

    // Rate limiting check
    if (!MultisigValidator.checkRateLimit('create_multisig', 300000, 5)) { // 5 per 5 minutes
      throw new Error('Rate limit exceeded. Please wait before creating another multi-signature account.');
    }

    try {
      // Create Cosmos multi-signature public key
      const cosmosPublicKeys = pubkeys.map(pk => encodeSecp256k1Pubkey(fromBase64(pk.pubkey)));
      
      const multisigPubkey: MultisigThresholdPubkey = {
        type: 'tendermint/PubKeyMultisigThreshold',
        value: {
          threshold: threshold.toString(),
          pubkeys: cosmosPublicKeys
        }
      };

      // Generate multi-signature address
      const multisigAddress = pubkeyToAddress(multisigPubkey, 'persona');

      // Create multi-sig account object with sanitized data
      const multisigAccount: MultisigAccount = {
        id: `multisig_${Date.now()}`,
        address: multisigAddress,
        threshold,
        pubkeys: pubkeys.map(pk => ({
          address: pk.address,
          pubkey: pk.pubkey,
          name: pk.name ? MultisigValidator.sanitizeString(pk.name, 50) : undefined
        })),
        createdAt: new Date()
      };

      // Store account
      this.multisigAccounts.set(multisigAccount.id, multisigAccount);
      this.saveToLocalStorage();

      // Refresh balance
      await this.refreshMultisigBalance(multisigAccount.id);

      console.log(`Created multi-signature account: ${multisigAddress}`);
      return multisigAccount;

    } catch (error) {
      console.error('Error creating multi-signature account:', error);
      throw new Error(`Failed to create multi-signature account: ${error}`);
    }
  }

  /**
   * Get multi-signature account by ID
   */
  getMultisigAccount(id: string): MultisigAccount | null {
    return this.multisigAccounts.get(id) || null;
  }

  /**
   * List all multi-signature accounts
   */
  listMultisigAccounts(): MultisigAccount[] {
    return Array.from(this.multisigAccounts.values());
  }

  /**
   * Refresh balance for a multi-signature account
   */
  async refreshMultisigBalance(multisigId: string): Promise<void> {
    const account = this.multisigAccounts.get(multisigId);
    if (!account || !this.stargateClient) return;

    try {
      const balance = await this.stargateClient.getAllBalances(account.address);
      account.balance = balance.map(coin => ({ denom: coin.denom, amount: coin.amount }));
      account.lastActivity = new Date();
      
      this.multisigAccounts.set(multisigId, account);
      this.saveToLocalStorage();
    } catch (error) {
      console.error('Error refreshing multi-signature balance:', error);
    }
  }

  /**
   * Create a multi-signature transaction
   */
  async createMultisigTransaction(
    multisigId: string,
    type: 'send' | 'delegate' | 'vote' | 'custom',
    params: {
      recipients?: { address: string; amount: { denom: string; amount: string }[] }[];
      validatorAddress?: string;
      proposalId?: string;
      vote?: 'yes' | 'no' | 'abstain' | 'no_with_veto';
      memo?: string;
      customMsgs?: any[];
    }
  ): Promise<MultisigTransaction> {
    // Validate account ID
    if (!MultisigValidator.validateAccountId(multisigId)) {
      throw new Error('Invalid multi-signature account ID format');
    }

    // Rate limiting for transaction creation
    if (!MultisigValidator.checkRateLimit(`create_tx_${multisigId}`, 60000, 10)) { // 10 per minute
      throw new Error('Transaction creation rate limit exceeded. Please wait before creating another transaction.');
    }

    // Validate memo if provided
    if (params.memo && !MultisigValidator.validateMemo(params.memo)) {
      throw new Error('Invalid memo: contains potentially dangerous content or exceeds length limit');
    }

    // Validate recipient addresses and amounts
    if (params.recipients) {
      for (const recipient of params.recipients) {
        if (!MultisigValidator.validateBech32Address(recipient.address)) {
          throw new Error(`Invalid recipient address: ${recipient.address}`);
        }
        for (const amount of recipient.amount) {
          if (!MultisigValidator.validateAmount(amount.amount, amount.denom)) {
            throw new Error(`Invalid amount: ${amount.amount} ${amount.denom}`);
          }
        }
      }
    }

    // Validate validator address for delegation
    if (type === 'delegate' && params.validatorAddress && 
        !MultisigValidator.validateBech32Address(params.validatorAddress, 'personavaloper')) {
      throw new Error('Invalid validator address format');
    }
    const account = this.multisigAccounts.get(multisigId);
    if (!account) {
      throw new Error('Multi-signature account not found');
    }

    try {
      // Build transaction messages based on type
      let msgs: any[] = [];
      
      switch (type) {
        case 'send':
          if (!params.recipients || params.recipients.length === 0) {
            throw new Error('Recipients required for send transaction');
          }
          msgs = params.recipients.map(recipient => ({
            typeUrl: '/cosmos.bank.v1beta1.MsgSend',
            value: {
              fromAddress: account.address,
              toAddress: recipient.address,
              amount: recipient.amount
            }
          }));
          break;

        case 'delegate':
          if (!params.validatorAddress) {
            throw new Error('Validator address required for delegate transaction');
          }
          msgs = [{
            typeUrl: '/cosmos.staking.v1beta1.MsgDelegate',
            value: {
              delegatorAddress: account.address,
              validatorAddress: params.validatorAddress,
              amount: params.recipients?.[0]?.amount?.[0] || { denom: 'upersona', amount: '1000000' }
            }
          }];
          break;

        case 'vote':
          if (!params.proposalId || !params.vote) {
            throw new Error('Proposal ID and vote required for vote transaction');
          }
          msgs = [{
            typeUrl: '/cosmos.gov.v1beta1.MsgVote',
            value: {
              proposalId: params.proposalId,
              voter: account.address,
              option: this.getVoteOption(params.vote)
            }
          }];
          break;

        case 'custom':
          if (!params.customMsgs || params.customMsgs.length === 0) {
            throw new Error('Custom messages required for custom transaction');
          }
          msgs = params.customMsgs;
          break;

        default:
          throw new Error(`Unsupported transaction type: ${type}`);
      }

      // Calculate fee (basic estimation)
      const gasLimit = msgs.length * 200000; // Base gas per message
      const fee = {
        amount: [{ denom: 'upersona', amount: Math.ceil(gasLimit * 0.025).toString() }],
        gas: gasLimit.toString()
      };

      // Create transaction object
      const transaction: MultisigTransaction = {
        id: `tx_${Date.now()}`,
        multisigAddress: account.address,
        type,
        recipients: params.recipients,
        validatorAddress: params.validatorAddress,
        proposalId: params.proposalId,
        vote: params.vote,
        memo: params.memo ? MultisigValidator.sanitizeString(params.memo, 512) : '',
        fee,
        signatures: account.pubkeys.map(pk => ({
          address: pk.address,
          signed: false
        })),
        status: 'pending',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      };

      // Store pending transaction
      this.pendingTransactions.set(transaction.id, transaction);
      this.saveToLocalStorage();

      console.log(`Created multi-signature transaction: ${transaction.id}`);
      return transaction;

    } catch (error) {
      console.error('Error creating multi-signature transaction:', error);
      throw new Error(`Failed to create multi-signature transaction: ${error}`);
    }
  }

  /**
   * Sign a multi-signature transaction
   */
  async signMultisigTransaction(
    transactionId: string,
    signerWallet: DirectSecp256k1HdWallet
  ): Promise<void> {
    // Validate transaction ID format
    if (!MultisigValidator.validateTransactionId(transactionId)) {
      throw new Error('Invalid transaction ID format');
    }

    // Rate limiting for signing
    if (!MultisigValidator.checkRateLimit(`sign_tx_${transactionId}`, 30000, 5)) { // 5 per 30 seconds
      throw new Error('Transaction signing rate limit exceeded. Please wait before signing again.');
    }

    const transaction = this.pendingTransactions.get(transactionId);
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (transaction.status !== 'pending') {
      throw new Error(`Cannot sign transaction with status: ${transaction.status}`);
    }

    try {
      // Get signer address
      const [signerAccount] = await signerWallet.getAccounts();
      const signerAddress = signerAccount.address;

      // Check if signer is authorized
      const signerInfo = transaction.signatures.find(sig => sig.address === signerAddress);
      if (!signerInfo) {
        throw new Error('Signer is not authorized for this multi-signature account');
      }

      if (signerInfo.signed) {
        throw new Error('Transaction already signed by this address');
      }

      // Create signing client
      const signingClient = await SigningStargateClient.connectWithSigner(
        PERSONACHAIN_CONFIG.rpcEndpoint,
        signerWallet
      );

      // Build transaction messages
      const msgs = await this.buildTransactionMessages(transaction);

      // Get account info for sequence number
      const account = await signingClient.getAccount(transaction.multisigAddress);
      if (!account) {
        throw new Error('Multi-signature account not found on chain');
      }

      // Sign transaction
      const signerData = {
        accountNumber: account.accountNumber,
        sequence: account.sequence,
        chainId: PERSONACHAIN_CONFIG.chainId
      };

      const txRaw = await signingClient.sign(
        signerAddress,
        msgs,
        transaction.fee,
        transaction.memo || '',
        signerData
      );

      // Extract signature
      const signature = txRaw.signatures[0];

      // Update transaction with signature
      signerInfo.signature = toBase64(signature);
      signerInfo.signed = true;
      signerInfo.signedAt = new Date();

      // Check if ready for broadcast
      const signedCount = transaction.signatures.filter(sig => sig.signed).length;
      const multisigAccount = Array.from(this.multisigAccounts.values())
        .find(acc => acc.address === transaction.multisigAddress);
      
      if (multisigAccount && signedCount >= multisigAccount.threshold) {
        transaction.status = 'ready';
        transaction.rawTx = toBase64(TxRaw.encode(txRaw).finish());
      }

      // Save updated transaction
      this.pendingTransactions.set(transactionId, transaction);
      this.saveToLocalStorage();

      console.log(`Transaction signed by ${signerAddress}. Status: ${transaction.status}`);

    } catch (error) {
      console.error('Error signing multi-signature transaction:', error);
      throw new Error(`Failed to sign transaction: ${error}`);
    }
  }

  /**
   * Broadcast a ready multi-signature transaction
   */
  async broadcastMultisigTransaction(transactionId: string): Promise<string> {
    const transaction = this.pendingTransactions.get(transactionId);
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (transaction.status !== 'ready') {
      throw new Error(`Cannot broadcast transaction with status: ${transaction.status}`);
    }

    if (!transaction.rawTx) {
      throw new Error('Transaction not properly signed');
    }

    if (!this.stargateClient) {
      await this.initialize();
    }

    try {
      // Decode and broadcast transaction
      const txBytes = fromBase64(transaction.rawTx);
      const result = await this.stargateClient!.broadcastTx(txBytes);

      if (result.code !== 0) {
        throw new Error(`Transaction failed: ${result.rawLog}`);
      }

      // Update transaction status
      transaction.status = 'broadcast';
      transaction.txHash = result.transactionHash;

      // Save updated transaction
      this.pendingTransactions.set(transactionId, transaction);
      this.saveToLocalStorage();

      console.log(`Multi-signature transaction broadcast: ${result.transactionHash}`);
      return result.transactionHash;

    } catch (error) {
      transaction.status = 'failed';
      this.pendingTransactions.set(transactionId, transaction);
      this.saveToLocalStorage();

      console.error('Error broadcasting multi-signature transaction:', error);
      throw new Error(`Failed to broadcast transaction: ${error}`);
    }
  }

  /**
   * Get pending transactions for a multi-signature account
   */
  getPendingTransactions(multisigAddress?: string): MultisigTransaction[] {
    const transactions = Array.from(this.pendingTransactions.values());
    
    if (multisigAddress) {
      return transactions.filter(tx => tx.multisigAddress === multisigAddress);
    }
    
    return transactions;
  }

  /**
   * Get transaction by ID
   */
  getTransaction(id: string): MultisigTransaction | null {
    return this.pendingTransactions.get(id) || null;
  }

  /**
   * Create a governance proposal for multi-sig account changes
   */
  async createMultisigProposal(
    multisigId: string,
    proposal: {
      title: string;
      description: string;
      type: 'add_member' | 'remove_member' | 'change_threshold' | 'transfer_ownership';
      newMember?: { address: string; pubkey: string; name?: string };
      removeMember?: string;
      newThreshold?: number;
      newOwner?: string;
    },
    proposerAddress: string
  ): Promise<MultisigProposal> {
    // Validate inputs
    if (!MultisigValidator.validateAccountId(multisigId)) {
      throw new Error('Invalid multi-signature account ID format');
    }

    if (!MultisigValidator.validateBech32Address(proposerAddress)) {
      throw new Error('Invalid proposer address format');
    }

    if (!MultisigValidator.validateProposalText(proposal.title, 100)) {
      throw new Error('Invalid proposal title: contains dangerous content or exceeds length limit');
    }

    if (!MultisigValidator.validateProposalText(proposal.description, 1000)) {
      throw new Error('Invalid proposal description: contains dangerous content or exceeds length limit');
    }

    // Rate limiting for proposal creation
    if (!MultisigValidator.checkRateLimit(`create_proposal_${multisigId}`, 600000, 3)) { // 3 per 10 minutes
      throw new Error('Proposal creation rate limit exceeded. Please wait before creating another proposal.');
    }

    // Validate proposal-specific data
    if (proposal.newMember) {
      const memberValidation = MultisigValidator.validateMember(proposal.newMember);
      if (!memberValidation.valid) {
        throw new Error(`Invalid new member: ${memberValidation.errors.join('; ')}`);
      }
    }

    if (proposal.removeMember && !MultisigValidator.validateBech32Address(proposal.removeMember)) {
      throw new Error('Invalid remove member address format');
    }

    if (proposal.newOwner && !MultisigValidator.validateBech32Address(proposal.newOwner)) {
      throw new Error('Invalid new owner address format');
    }
    const account = this.multisigAccounts.get(multisigId);
    if (!account) {
      throw new Error('Multi-signature account not found');
    }

    // Validate proposer is a member
    if (!account.pubkeys.some(pk => pk.address === proposerAddress)) {
      throw new Error('Only multi-signature account members can create proposals');
    }

    const multisigProposal: MultisigProposal = {
      id: `prop_${Date.now()}`,
      multisigAddress: account.address,
      title: MultisigValidator.sanitizeString(proposal.title, 100),
      description: MultisigValidator.sanitizeString(proposal.description, 1000),
      proposer: proposerAddress,
      type: proposal.type,
      newMember: proposal.newMember ? {
        ...proposal.newMember,
        name: proposal.newMember.name ? MultisigValidator.sanitizeString(proposal.newMember.name, 50) : undefined
      } : undefined,
      removeMember: proposal.removeMember,
      newThreshold: proposal.newThreshold,
      newOwner: proposal.newOwner,
      votes: [],
      status: 'active',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    };

    this.proposals.set(multisigProposal.id, multisigProposal);
    this.saveToLocalStorage();

    return multisigProposal;
  }

  /**
   * Vote on a multi-signature proposal
   */
  async voteOnProposal(
    proposalId: string,
    voterAddress: string,
    vote: 'yes' | 'no' | 'abstain'
  ): Promise<void> {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) {
      throw new Error('Proposal not found');
    }

    if (proposal.status !== 'active') {
      throw new Error(`Cannot vote on proposal with status: ${proposal.status}`);
    }

    if (new Date() > proposal.expiresAt) {
      proposal.status = 'rejected';
      this.proposals.set(proposalId, proposal);
      this.saveToLocalStorage();
      throw new Error('Proposal has expired');
    }

    // Validate voter is a member
    const account = Array.from(this.multisigAccounts.values())
      .find(acc => acc.address === proposal.multisigAddress);
    
    if (!account || !account.pubkeys.some(pk => pk.address === voterAddress)) {
      throw new Error('Only multi-signature account members can vote');
    }

    // Remove previous vote if exists
    proposal.votes = proposal.votes.filter(v => v.address !== voterAddress);

    // Add new vote
    proposal.votes.push({
      address: voterAddress,
      vote,
      votedAt: new Date()
    });

    // Check if proposal should pass
    const yesVotes = proposal.votes.filter(v => v.vote === 'yes').length;
    if (yesVotes >= account.threshold) {
      proposal.status = 'passed';
    }

    this.proposals.set(proposalId, proposal);
    this.saveToLocalStorage();
  }

  /**
   * Execute a passed multi-signature proposal
   */
  async executeProposal(proposalId: string): Promise<void> {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) {
      throw new Error('Proposal not found');
    }

    if (proposal.status !== 'passed') {
      throw new Error('Proposal has not passed');
    }

    const account = Array.from(this.multisigAccounts.values())
      .find(acc => acc.address === proposal.multisigAddress);
    
    if (!account) {
      throw new Error('Multi-signature account not found');
    }

    try {
      // Execute proposal based on type
      switch (proposal.type) {
        case 'add_member':
          if (!proposal.newMember) {
            throw new Error('New member information missing');
          }
          account.pubkeys.push(proposal.newMember);
          break;

        case 'remove_member':
          if (!proposal.removeMember) {
            throw new Error('Member to remove not specified');
          }
          account.pubkeys = account.pubkeys.filter(pk => pk.address !== proposal.removeMember);
          if (account.pubkeys.length < account.threshold) {
            account.threshold = account.pubkeys.length;
          }
          break;

        case 'change_threshold':
          if (!proposal.newThreshold) {
            throw new Error('New threshold not specified');
          }
          if (proposal.newThreshold > account.pubkeys.length || proposal.newThreshold <= 0) {
            throw new Error('Invalid threshold value');
          }
          account.threshold = proposal.newThreshold;
          break;

        case 'transfer_ownership':
          // This would require creating a new multi-sig account
          throw new Error('Transfer ownership not yet implemented');

        default:
          throw new Error(`Unknown proposal type: ${proposal.type}`);
      }

      // Update account
      this.multisigAccounts.set(
        Array.from(this.multisigAccounts.entries())
          .find(([_, acc]) => acc.address === account.address)?.[0] || '',
        account
      );

      // Mark proposal as executed
      proposal.status = 'executed';
      this.proposals.set(proposalId, proposal);
      this.saveToLocalStorage();

      console.log(`Executed proposal: ${proposalId}`);

    } catch (error) {
      console.error('Error executing proposal:', error);
      throw new Error(`Failed to execute proposal: ${error}`);
    }
  }

  /**
   * Get proposals for a multi-signature account
   */
  getProposals(multisigAddress?: string): MultisigProposal[] {
    const proposals = Array.from(this.proposals.values());
    
    if (multisigAddress) {
      return proposals.filter(prop => prop.multisigAddress === multisigAddress);
    }
    
    return proposals;
  }

  // Private helper methods

  private async buildTransactionMessages(transaction: MultisigTransaction): Promise<any[]> {
    switch (transaction.type) {
      case 'send':
        return transaction.recipients?.map(recipient => ({
          typeUrl: '/cosmos.bank.v1beta1.MsgSend',
          value: {
            fromAddress: transaction.multisigAddress,
            toAddress: recipient.address,
            amount: recipient.amount
          }
        })) || [];

      case 'delegate':
        return [{
          typeUrl: '/cosmos.staking.v1beta1.MsgDelegate',
          value: {
            delegatorAddress: transaction.multisigAddress,
            validatorAddress: transaction.validatorAddress,
            amount: transaction.recipients?.[0]?.amount?.[0] || { denom: 'upersona', amount: '1000000' }
          }
        }];

      case 'vote':
        return [{
          typeUrl: '/cosmos.gov.v1beta1.MsgVote',
          value: {
            proposalId: transaction.proposalId,
            voter: transaction.multisigAddress,
            option: this.getVoteOption(transaction.vote || 'yes')
          }
        }];

      default:
        return [];
    }
  }

  private getVoteOption(vote: string): number {
    switch (vote) {
      case 'yes': return 1;
      case 'abstain': return 2;
      case 'no': return 3;
      case 'no_with_veto': return 4;
      default: return 1;
    }
  }

  private saveToLocalStorage(): void {
    try {
      const data = {
        multisigAccounts: Array.from(this.multisigAccounts.entries()),
        pendingTransactions: Array.from(this.pendingTransactions.entries()),
        proposals: Array.from(this.proposals.entries())
      };
      localStorage.setItem('personaWallet_multisig', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save multi-signature data to localStorage:', error);
    }
  }

  private loadFromLocalStorage(): void {
    try {
      const data = localStorage.getItem('personaWallet_multisig');
      if (data) {
        const parsed = JSON.parse(data);
        
        if (parsed.multisigAccounts) {
          this.multisigAccounts = new Map(parsed.multisigAccounts);
        }
        
        if (parsed.pendingTransactions) {
          this.pendingTransactions = new Map(parsed.pendingTransactions);
        }
        
        if (parsed.proposals) {
          this.proposals = new Map(parsed.proposals);
        }
      }
    } catch (error) {
      console.error('Failed to load multi-signature data from localStorage:', error);
    }
  }

  /**
   * Clean up expired transactions and proposals
   */
  async cleanup(): Promise<void> {
    const now = new Date();
    
    // Clean up expired transactions
    const transactionEntries = Array.from(this.pendingTransactions.entries());
    for (const [id, transaction] of transactionEntries) {
      if (transaction.expiresAt && now > transaction.expiresAt) {
        this.pendingTransactions.delete(id);
      }
    }
    
    // Clean up expired proposals
    const proposalEntries = Array.from(this.proposals.entries());
    for (const [id, proposal] of proposalEntries) {
      if (now > proposal.expiresAt && proposal.status === 'active') {
        proposal.status = 'rejected';
        this.proposals.set(id, proposal);
      }
    }
    
    this.saveToLocalStorage();
  }
}

// Export singleton instance
export const multisigService = new MultisigService();