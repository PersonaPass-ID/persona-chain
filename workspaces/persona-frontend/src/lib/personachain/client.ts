// PersonaChain Client using CosmJS
import { SigningStargateClient, StargateClient } from '@cosmjs/stargate'
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing'
import { GasPrice } from '@cosmjs/stargate'
import { coins } from '@cosmjs/amino'

// PersonaChain configuration
const CHAIN_ID = 'personachain-1'
const RPC_ENDPOINT = 'http://98.86.107.175:26657'
const DENOM = 'upersona'
const PREFIX = 'persona'

// Message type URLs for PersonaChain identity module
const MSG_CREATE_IDENTITY = '/personachain.identity.MsgCreateIdentity'
const MSG_ISSUE_CREDENTIAL = '/personachain.identity.MsgIssueCredential'
const MSG_VERIFY_CREDENTIAL = '/personachain.identity.MsgVerifyCredential'
const MSG_REVOKE_CREDENTIAL = '/personachain.identity.MsgRevokeCredential'

export interface PersonaChainConfig {
  rpcEndpoint?: string
  chainId?: string
  gasPrice?: string
  prefix?: string
}

export class PersonaChainClient {
  private client: StargateClient | null = null
  private signingClient: SigningStargateClient | null = null
  private wallet: DirectSecp256k1HdWallet | null = null
  private address: string | null = null
  
  constructor(private config: PersonaChainConfig = {}) {
    this.config = {
      rpcEndpoint: config.rpcEndpoint || RPC_ENDPOINT,
      chainId: config.chainId || CHAIN_ID,
      gasPrice: config.gasPrice || '0.025upersona',
      prefix: config.prefix || PREFIX,
    }
  }

  /**
   * Connect to PersonaChain (read-only)
   */
  async connect(): Promise<void> {
    try {
      this.client = await StargateClient.connect(this.config.rpcEndpoint!)
      console.log('🚀 Connected to PersonaChain')
      
      const chainId = await this.client.getChainId()
      console.log('⛓️ Chain ID:', chainId)
      
      const height = await this.client.getHeight()
      console.log('📦 Current block height:', height)
    } catch (error) {
      console.error('❌ Failed to connect to PersonaChain:', error)
      throw error
    }
  }

  /**
   * Connect with a wallet for signing transactions
   */
  async connectWithWallet(mnemonic: string): Promise<string> {
    try {
      // Create wallet from mnemonic
      this.wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
        prefix: this.config.prefix,
      })
      
      // Get the first account
      const [firstAccount] = await this.wallet.getAccounts()
      this.address = firstAccount.address
      
      // Create signing client
      this.signingClient = await SigningStargateClient.connectWithSigner(
        this.config.rpcEndpoint!,
        this.wallet,
        {
          gasPrice: GasPrice.fromString(this.config.gasPrice!),
        }
      )
      
      console.log('🔐 Connected with wallet:', this.address)
      return this.address
    } catch (error) {
      console.error('❌ Failed to connect wallet:', error)
      throw error
    }
  }

  /**
   * Create a new DID on PersonaChain
   */
  async createIdentity(didDocument: any): Promise<string> {
    if (!this.signingClient || !this.address) {
      throw new Error('Wallet not connected')
    }

    const msg = {
      typeUrl: MSG_CREATE_IDENTITY,
      value: {
        creator: this.address,
        didDocument: JSON.stringify(didDocument),
      },
    }

    try {
      const result = await this.signingClient.signAndBroadcast(
        this.address,
        [msg],
        'auto',
        'Create DID on PersonaChain'
      )

      if (result.code !== 0) {
        throw new Error(`Transaction failed: ${result.rawLog}`)
      }

      console.log('✅ DID created on PersonaChain')
      console.log('🔗 Tx hash:', result.transactionHash)
      return result.transactionHash
    } catch (error) {
      console.error('❌ Failed to create identity:', error)
      throw error
    }
  }

  /**
   * Issue a verifiable credential on PersonaChain
   */
  async issueCredential(
    subjectDID: string,
    credentialType: string,
    credentialData: any,
    expiryDays: number = 365
  ): Promise<{ txHash: string; credentialId?: string }> {
    if (!this.signingClient || !this.address) {
      throw new Error('Wallet not connected')
    }

    const expiry = Math.floor(Date.now() / 1000) + (expiryDays * 24 * 60 * 60)

    const msg = {
      typeUrl: MSG_ISSUE_CREDENTIAL,
      value: {
        issuer: this.address,
        subjectDid: subjectDID,
        credentialType: credentialType,
        credentialData: JSON.stringify(credentialData),
        expiry: expiry,
      },
    }

    try {
      const result = await this.signingClient.signAndBroadcast(
        this.address,
        [msg],
        'auto',
        'Issue Verifiable Credential'
      )

      if (result.code !== 0) {
        throw new Error(`Transaction failed: ${result.rawLog}`)
      }

      console.log('✅ Credential issued on PersonaChain')
      console.log('🔗 Tx hash:', result.transactionHash)

      // Extract credential ID from events if available
      const credentialIdEvent = result.events.find(
        e => e.type === 'credential_issued'
      )
      const credentialId = credentialIdEvent?.attributes.find(
        a => a.key === 'credential_id'
      )?.value

      return {
        txHash: result.transactionHash,
        credentialId,
      }
    } catch (error) {
      console.error('❌ Failed to issue credential:', error)
      throw error
    }
  }

  /**
   * Verify a credential with ZK proof
   */
  async verifyCredential(
    credentialId: string,
    proofData: any
  ): Promise<{ txHash: string; verified: boolean }> {
    if (!this.signingClient || !this.address) {
      throw new Error('Wallet not connected')
    }

    const msg = {
      typeUrl: MSG_VERIFY_CREDENTIAL,
      value: {
        verifier: this.address,
        credentialId: credentialId,
        proofData: JSON.stringify(proofData),
      },
    }

    try {
      const result = await this.signingClient.signAndBroadcast(
        this.address,
        [msg],
        'auto',
        'Verify Credential with ZK Proof'
      )

      if (result.code !== 0) {
        throw new Error(`Transaction failed: ${result.rawLog}`)
      }

      console.log('✅ Credential verified on PersonaChain')
      console.log('🔗 Tx hash:', result.transactionHash)

      return {
        txHash: result.transactionHash,
        verified: true,
      }
    } catch (error) {
      console.error('❌ Failed to verify credential:', error)
      throw error
    }
  }

  /**
   * Revoke a credential
   */
  async revokeCredential(
    credentialId: string,
    reason: string
  ): Promise<string> {
    if (!this.signingClient || !this.address) {
      throw new Error('Wallet not connected')
    }

    const msg = {
      typeUrl: MSG_REVOKE_CREDENTIAL,
      value: {
        issuer: this.address,
        credentialId: credentialId,
        reason: reason,
      },
    }

    try {
      const result = await this.signingClient.signAndBroadcast(
        this.address,
        [msg],
        'auto',
        'Revoke Credential'
      )

      if (result.code !== 0) {
        throw new Error(`Transaction failed: ${result.rawLog}`)
      }

      console.log('✅ Credential revoked on PersonaChain')
      console.log('🔗 Tx hash:', result.transactionHash)
      return result.transactionHash
    } catch (error) {
      console.error('❌ Failed to revoke credential:', error)
      throw error
    }
  }

  /**
   * Query identity by address
   */
  async queryIdentity(address: string): Promise<any> {
    if (!this.client) {
      await this.connect()
    }

    try {
      const query = `/personachain/identity/identity/${address}`
      const response = await this.client!.queryAbci(query, new Uint8Array())
      return response
    } catch (error) {
      console.error('❌ Failed to query identity:', error)
      throw error
    }
  }

  /**
   * Query credentials for a DID
   */
  async queryCredentials(subjectDID: string): Promise<any[]> {
    if (!this.client) {
      await this.connect()
    }

    try {
      const query = `/personachain/identity/credentials/${subjectDID}`
      const response = await this.client!.queryAbci(query, new Uint8Array())
      return response
    } catch (error) {
      console.error('❌ Failed to query credentials:', error)
      throw error
    }
  }

  /**
   * Get account balance
   */
  async getBalance(address?: string): Promise<{ amount: string; denom: string }> {
    if (!this.client) {
      await this.connect()
    }

    const addr = address || this.address
    if (!addr) {
      throw new Error('No address provided')
    }

    try {
      const balance = await this.client!.getBalance(addr, DENOM)
      return balance
    } catch (error) {
      console.error('❌ Failed to get balance:', error)
      throw error
    }
  }

  /**
   * Get current block height
   */
  async getHeight(): Promise<number> {
    if (!this.client) {
      await this.connect()
    }

    return await this.client!.getHeight()
  }

  /**
   * Disconnect from PersonaChain
   */
  disconnect(): void {
    if (this.client) {
      this.client.disconnect()
      this.client = null
    }
    if (this.signingClient) {
      this.signingClient.disconnect()
      this.signingClient = null
    }
    this.wallet = null
    this.address = null
    console.log('👋 Disconnected from PersonaChain')
  }
}

// Export singleton instance
export const personaChainClient = new PersonaChainClient()

// Convenience functions
export const connectToPersonaChain = () => personaChainClient.connect()
export const connectWalletToPersonaChain = (mnemonic: string) => 
  personaChainClient.connectWithWallet(mnemonic)
export const createDIDOnChain = (didDocument: any) => 
  personaChainClient.createIdentity(didDocument)
export const issueCredentialOnChain = (
  subjectDID: string,
  credentialType: string,
  credentialData: any,
  expiryDays?: number
) => personaChainClient.issueCredential(subjectDID, credentialType, credentialData, expiryDays)