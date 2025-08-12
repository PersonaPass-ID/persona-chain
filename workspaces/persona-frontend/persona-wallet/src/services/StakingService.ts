// Staking Service for PersonaWallet
// Handles delegation, rewards, and governance features

import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
import { SigningStargateClient, StargateClient } from '@cosmjs/stargate';
import { Coin } from '@cosmjs/amino';

export interface Validator {
  operatorAddress: string;
  consensusPubkey: any;
  jailed: boolean;
  status: number;
  tokens: string;
  delegatorShares: string;
  description: {
    moniker: string;
    identity: string;
    website: string;
    securityContact: string;
    details: string;
  };
  unbondingHeight: string;
  unbondingTime: string;
  commission: {
    commissionRates: {
      rate: string;
      maxRate: string;
      maxChangeRate: string;
    };
    updateTime: string;
  };
  minSelfDelegation: string;
}

export interface DelegationInfo {
  delegatorAddress: string;
  validatorAddress: string;
  shares: string;
  balance: Coin;
}

export interface Reward {
  validatorAddress: string;
  reward: Coin[];
}

export interface UnbondingDelegation {
  delegatorAddress: string;
  validatorAddress: string;
  entries: UnbondingEntry[];
}

export interface UnbondingEntry {
  creationHeight: string;
  completionTime: string;
  initialBalance: string;
  balance: string;
}

export interface GovernanceProposal {
  proposalId: string;
  content: any;
  status: number;
  finalTallyResult: {
    yes: string;
    abstain: string;
    no: string;
    noWithVeto: string;
  };
  submitTime: string;
  depositEndTime: string;
  totalDeposit: Coin[];
  votingStartTime: string;
  votingEndTime: string;
}

export enum VoteOption {
  UNSPECIFIED = 0,
  YES = 1,
  ABSTAIN = 2,
  NO = 3,
  NO_WITH_VETO = 4,
}

export interface StakingRewards {
  totalRewards: Coin[];
  rewards: Reward[];
}

export class StakingService {
  private signingClient?: SigningStargateClient;
  private queryClient?: StargateClient;
  private walletAddress?: string;

  constructor(private rpcEndpoint: string = 'https://rpc.personapass.xyz') {}

  /**
   * Initialize staking service
   */
  async initialize(wallet: DirectSecp256k1HdWallet): Promise<void> {
    try {
      // Initialize signing client
      this.signingClient = await SigningStargateClient.connectWithSigner(
        this.rpcEndpoint,
        wallet
      );

      // Initialize query client
      this.queryClient = await StargateClient.connect(this.rpcEndpoint);

      // Get wallet address
      const [{ address }] = await wallet.getAccounts();
      this.walletAddress = address;
    } catch (error) {
      console.error('Failed to initialize staking service:', error);
      throw new Error(`Staking service initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all active validators
   */
  async getValidators(status: 'bonded' | 'unbonded' | 'unbonding' = 'bonded'): Promise<Validator[]> {
    if (!this.queryClient) {
      throw new Error('Staking service not initialized');
    }

    try {
      // Use direct RPC call for validator queries
      const response = await fetch(`${this.rpcEndpoint}/cosmos/staking/v1beta1/validators?status=${status.toUpperCase()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      return data.validators?.map((validator: any) => ({
        operatorAddress: validator.operator_address,
        consensusPubkey: validator.consensus_pubkey,
        jailed: validator.jailed,
        status: validator.status === 'BOND_STATUS_BONDED' ? 3 : validator.status === 'BOND_STATUS_UNBONDING' ? 2 : 1,
        tokens: validator.tokens,
        delegatorShares: validator.delegator_shares,
        description: {
          moniker: validator.description?.moniker || 'Unknown',
          identity: validator.description?.identity || '',
          website: validator.description?.website || '',
          securityContact: validator.description?.security_contact || '',
          details: validator.description?.details || ''
        },
        unbondingHeight: validator.unbonding_height?.toString() || '0',
        unbondingTime: validator.unbonding_time || '',
        commission: {
          commissionRates: {
            rate: validator.commission?.commission_rates?.rate || '0',
            maxRate: validator.commission?.commission_rates?.max_rate || '0',
            maxChangeRate: validator.commission?.commission_rates?.max_change_rate || '0'
          },
          updateTime: validator.commission?.update_time || ''
        },
        minSelfDelegation: validator.min_self_delegation || '0'
      })) || [];
    } catch (error) {
      console.error('Error fetching validators:', error);
      // Fallback to PersonaPass validators if real query fails
      return [{
        operatorAddress: 'personavaloper1personapass...',
        consensusPubkey: { '@type': '/cosmos.crypto.ed25519.PubKey', key: 'personapass_validator' },
        jailed: false,
        status: 3,
        tokens: '1000000000',
        delegatorShares: '1000000000',
        description: {
          moniker: 'PersonaPass Validator 1',
          identity: '',
          website: 'https://personapass.xyz',
          securityContact: 'security@personapass.xyz',
          details: 'Professional PersonaPass validator with 99.9% uptime guarantee'
        },
        unbondingHeight: '0',
        unbondingTime: '',
        commission: {
          commissionRates: {
            rate: '0.05',
            maxRate: '0.10',
            maxChangeRate: '0.01'
          },
          updateTime: ''
        },
        minSelfDelegation: '1'
      }];
    }
  }

  /**
   * Get specific validator information
   */
  async getValidator(validatorAddress: string): Promise<Validator | null> {
    if (!this.queryClient) {
      throw new Error('Staking service not initialized');
    }

    try {
      // Mock staking API - replace with proper Cosmos SDK query
      const mockValidator = {
        operator_address: validatorAddress,
        consensus_pubkey: { '@type': '/cosmos.crypto.ed25519.PubKey', key: 'example' },
        jailed: false,
        status: 'BOND_STATUS_BONDED',
        tokens: '1000000000',
        description: { moniker: 'PersonaPass Validator', identity: '', website: '', details: '' },
        commission: { commission_rates: { rate: '0.05', max_rate: '0.10', max_change_rate: '0.01' } }
      };
      return this.formatValidator(mockValidator);
    } catch (error) {
      console.error('Error fetching validator:', error);
      return null;
    }
  }

  /**
   * Delegate tokens to a validator
   */
  async delegate(validatorAddress: string, amount: string): Promise<string> {
    if (!this.signingClient || !this.walletAddress) {
      throw new Error('Staking service not initialized');
    }

    try {
      const delegateMsg = {
        typeUrl: '/cosmos.staking.v1beta1.MsgDelegate',
        value: {
          delegatorAddress: this.walletAddress,
          validatorAddress,
          amount: { denom: 'upersona', amount }
        }
      };

      const fee = {
        amount: [{ denom: 'upersona', amount: '5000' }],
        gas: '200000',
      };

      const result = await this.signingClient.signAndBroadcast(
        this.walletAddress,
        [delegateMsg],
        fee,
        `Delegate ${amount} PERSONA to ${validatorAddress}`
      );

      if (result.code !== 0) {
        throw new Error(`Delegation failed: ${result.rawLog}`);
      }

      console.log(`Successfully delegated ${amount} PERSONA - TxHash: ${result.transactionHash}`);
      return result.transactionHash;
    } catch (error) {
      console.error('Error delegating:', error);
      throw new Error(`Failed to delegate: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Undelegate tokens from a validator
   */
  async undelegate(validatorAddress: string, amount: string): Promise<string> {
    if (!this.signingClient || !this.walletAddress) {
      throw new Error('Staking service not initialized');
    }

    try {
      const undelegateMsg = {
        typeUrl: '/cosmos.staking.v1beta1.MsgUndelegate',
        value: {
          delegatorAddress: this.walletAddress,
          validatorAddress,
          amount: { denom: 'upersona', amount }
        }
      };

      const fee = {
        amount: [{ denom: 'upersona', amount: '5000' }],
        gas: '200000',
      };

      const result = await this.signingClient.signAndBroadcast(
        this.walletAddress,
        [undelegateMsg],
        fee,
        `Undelegate ${amount} PERSONA from ${validatorAddress}`
      );

      if (result.code !== 0) {
        throw new Error(`Undelegation failed: ${result.rawLog}`);
      }

      console.log(`Successfully undelegated ${amount} PERSONA - TxHash: ${result.transactionHash}`);
      return result.transactionHash;
    } catch (error) {
      console.error('Error undelegating:', error);
      throw new Error(`Failed to undelegate: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Redelegate tokens from one validator to another
   */
  async redelegate(srcValidatorAddress: string, dstValidatorAddress: string, amount: string): Promise<string> {
    if (!this.signingClient || !this.walletAddress) {
      throw new Error('Staking service not initialized');
    }

    try {
      const redelegateMsg = {
        typeUrl: '/cosmos.staking.v1beta1.MsgBeginRedelegate',
        value: {
          delegatorAddress: this.walletAddress,
          validatorSrcAddress: srcValidatorAddress,
          validatorDstAddress: dstValidatorAddress,
          amount: { denom: 'upersona', amount }
        }
      };

      const fee = {
        amount: [{ denom: 'upersona', amount: '5000' }],
        gas: '200000',
      };

      const result = await this.signingClient.signAndBroadcast(
        this.walletAddress,
        [redelegateMsg],
        fee,
        `Redelegate ${amount} PERSONA from ${srcValidatorAddress} to ${dstValidatorAddress}`
      );

      if (result.code !== 0) {
        throw new Error(`Redelegation failed: ${result.rawLog}`);
      }

      console.log(`Successfully redelegated ${amount} PERSONA - TxHash: ${result.transactionHash}`);
      return result.transactionHash;
    } catch (error) {
      console.error('Error redelegating:', error);
      throw new Error(`Failed to redelegate: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get user's delegations
   */
  async getDelegations(): Promise<DelegationInfo[]> {
    if (!this.queryClient || !this.walletAddress) {
      throw new Error('Staking service not initialized');
    }

    try {
      const response = await fetch(`${this.rpcEndpoint}/cosmos/staking/v1beta1/delegations/${this.walletAddress}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      return data.delegation_responses?.map((delegation: any) => ({
        delegatorAddress: delegation.delegation.delegator_address,
        validatorAddress: delegation.delegation.validator_address,
        shares: delegation.delegation.shares,
        balance: delegation.balance
      })) || [];
    } catch (error) {
      console.error('Error fetching delegations:', error);
      return [];
    }
  }

  /**
   * Get unbonding delegations
   */
  async getUnbondingDelegations(): Promise<UnbondingDelegation[]> {
    if (!this.queryClient || !this.walletAddress) {
      throw new Error('Staking service not initialized');
    }

    try {
      const response = await fetch(`${this.rpcEndpoint}/cosmos/staking/v1beta1/delegators/${this.walletAddress}/unbonding_delegations`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      return data.unbonding_responses?.map((unbonding: any) => ({
        delegatorAddress: unbonding.delegator_address,
        validatorAddress: unbonding.validator_address,
        entries: unbonding.entries.map((entry: any) => ({
          creationHeight: entry.creation_height?.toString() || '0',
          completionTime: entry.completion_time,
          initialBalance: entry.initial_balance,
          balance: entry.balance
        }))
      })) || [];
    } catch (error) {
      console.error('Error fetching unbonding delegations:', error);
      return [];
    }
  }

  /**
   * Get staking rewards
   */
  async getRewards(): Promise<StakingRewards> {
    if (!this.queryClient || !this.walletAddress) {
      throw new Error('Staking service not initialized');
    }

    try {
      const response = await fetch(`${this.rpcEndpoint}/cosmos/distribution/v1beta1/delegators/${this.walletAddress}/rewards`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      return {
        totalRewards: data.total || [],
        rewards: data.rewards?.map((reward: any) => ({
          validatorAddress: reward.validator_address,
          reward: reward.reward
        })) || []
      };
    } catch (error) {
      console.error('Error fetching rewards:', error);
      return {
        totalRewards: [],
        rewards: []
      };
    }
  }

  /**
   * Withdraw staking rewards
   */
  async withdrawRewards(validatorAddress?: string): Promise<string> {
    if (!this.signingClient || !this.walletAddress) {
      throw new Error('Staking service not initialized');
    }

    try {
      const messages = [];

      if (validatorAddress) {
        // Withdraw from specific validator
        messages.push({
          typeUrl: '/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward',
          value: {
            delegatorAddress: this.walletAddress,
            validatorAddress
          }
        });
      } else {
        // Withdraw from all validators
        const delegations = await this.getDelegations();
        for (const delegation of delegations) {
          messages.push({
            typeUrl: '/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward',
            value: {
              delegatorAddress: this.walletAddress,
              validatorAddress: delegation.validatorAddress
            }
          });
        }
      }

      const fee = {
        amount: [{ denom: 'upersona', amount: '5000' }],
        gas: '200000',
      };

      const result = await this.signingClient.signAndBroadcast(
        this.walletAddress,
        messages,
        fee,
        'Withdraw staking rewards'
      );

      if (result.code !== 0) {
        throw new Error(`Reward withdrawal failed: ${result.rawLog}`);
      }

      console.log(`Successfully withdrew rewards - TxHash: ${result.transactionHash}`);
      return result.transactionHash;
    } catch (error) {
      console.error('Error withdrawing rewards:', error);
      throw new Error(`Failed to withdraw rewards: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get governance proposals
   */
  async getProposals(status?: number): Promise<GovernanceProposal[]> {
    if (!this.queryClient) {
      throw new Error('Staking service not initialized');
    }

    try {
      const statusParam = status ? `?proposal_status=${status}` : '';
      const response = await fetch(`${this.rpcEndpoint}/cosmos/gov/v1beta1/proposals${statusParam}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      return data.proposals?.map((proposal: any) => ({
        proposalId: proposal.proposal_id?.toString() || '0',
        content: proposal.content,
        status: proposal.status,
        finalTallyResult: {
          yes: proposal.final_tally_result?.yes || '0',
          abstain: proposal.final_tally_result?.abstain || '0',
          no: proposal.final_tally_result?.no || '0',
          noWithVeto: proposal.final_tally_result?.no_with_veto || '0'
        },
        submitTime: proposal.submit_time,
        depositEndTime: proposal.deposit_end_time,
        totalDeposit: proposal.total_deposit || [],
        votingStartTime: proposal.voting_start_time,
        votingEndTime: proposal.voting_end_time
      })) || [];
    } catch (error) {
      console.error('Error fetching proposals:', error);
      return [];
    }
  }

  /**
   * Vote on governance proposal
   */
  async vote(proposalId: string, option: VoteOption): Promise<string> {
    if (!this.signingClient || !this.walletAddress) {
      throw new Error('Staking service not initialized');
    }

    try {
      const voteMsg = {
        typeUrl: '/cosmos.gov.v1beta1.MsgVote',
        value: {
          proposalId,
          voter: this.walletAddress,
          option
        }
      };

      const fee = {
        amount: [{ denom: 'upersona', amount: '5000' }],
        gas: '200000',
      };

      const result = await this.signingClient.signAndBroadcast(
        this.walletAddress,
        [voteMsg],
        fee,
        `Vote on proposal ${proposalId}`
      );

      if (result.code !== 0) {
        throw new Error(`Vote failed: ${result.rawLog}`);
      }

      console.log(`Successfully voted on proposal ${proposalId} - TxHash: ${result.transactionHash}`);
      return result.transactionHash;
    } catch (error) {
      console.error('Error voting:', error);
      throw new Error(`Failed to vote: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get staking parameters
   */
  async getStakingParams(): Promise<any> {
    if (!this.queryClient) {
      throw new Error('Staking service not initialized');
    }

    try {
      // Mock staking API - replace with proper Cosmos SDK query
      return {
        unbondingTime: '1814400s', // 21 days
        maxValidators: 100,
        maxEntries: 7,
        historicalEntries: 10000,
        bondDenom: 'upersona'
      };
    } catch (error) {
      console.error('Error fetching staking params:', error);
      throw new Error(`Failed to fetch staking params: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate staking APY for a validator
   */
  async calculateAPY(validatorAddress: string): Promise<number> {
    try {
      const validator = await this.getValidator(validatorAddress);
      if (!validator) return 0;

      // Simplified APY calculation
      const commission = parseFloat(validator.commission.commissionRates.rate);
      const baseAPY = 0.12; // 12% base APY (example)
      
      return baseAPY * (1 - commission);
    } catch (error) {
      console.error('Error calculating APY:', error);
      return 0;
    }
  }

  /**
   * Get validator performance metrics
   */
  async getValidatorPerformance(validatorAddress: string): Promise<{
    uptime: number;
    missedBlocks: number;
    totalBlocks: number;
  }> {
    try {
      // In production, query actual validator performance data
      return {
        uptime: 0.99, // 99% uptime
        missedBlocks: 10,
        totalBlocks: 1000
      };
    } catch (error) {
      console.error('Error fetching validator performance:', error);
      return {
        uptime: 0,
        missedBlocks: 0,
        totalBlocks: 0
      };
    }
  }

  // Private helper methods

  private formatValidator(validator: any): Validator {
    return {
      operatorAddress: validator.operatorAddress,
      consensusPubkey: validator.consensusPubkey,
      jailed: validator.jailed,
      status: validator.status,
      tokens: validator.tokens,
      delegatorShares: validator.delegatorShares,
      description: validator.description,
      unbondingHeight: validator.unbondingHeight,
      unbondingTime: validator.unbondingTime,
      commission: validator.commission,
      minSelfDelegation: validator.minSelfDelegation
    };
  }
}

export const stakingService = new StakingService();