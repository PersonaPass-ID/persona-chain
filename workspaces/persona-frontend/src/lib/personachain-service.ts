/**
 * PersonaChain Service - REAL blockchain integration
 * Connects to actual PersonaChain network for DID and VC operations
 */

import { SigningCosmWasmClient, CosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { GasPrice, StargateClient } from "@cosmjs/stargate";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { stringToPath } from "@cosmjs/crypto";
import type { VerifiableCredential } from './github-verification'

export interface PersonaChainCredential {
  id: string
  credentialId: string
  issuer: string
  subject: string
  credentialData: VerifiableCredential
  blockHeight: number
  txHash: string
  timestamp: string
  status: 'active' | 'revoked' | 'expired'
}

export interface PersonaChainResult {
  success: boolean
  data?: PersonaChainCredential
  txHash?: string
  error?: string
  blockHeight?: number
}

export interface DIDDocument {
  id: string;
  context: string[];
  verificationMethod: Array<{
    id: string;
    type: string;
    controller: string;
    publicKeyMultibase: string;
  }>;
  authentication: string[];
  assertionMethod: string[];
  created: string;
  updated: string;
}

export interface DIDCreateResult {
  did: string;
  document: DIDDocument;
  txHash: string;
  blockHeight: number;
}

export class PersonaChainService {
  private readonly RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'http://54.92.180.187:26657'
  private readonly CHAIN_ID = 'personachain-1'
  private readonly DENOM = 'upersona'
  private readonly GAS_PRICE = '0.025upersona'
  private client: CosmWasmClient | null = null
  private signingClient: SigningCosmWasmClient | null = null

  constructor() {
    console.log(`🔗 PersonaChain Service initialized`)
    console.log(`📡 RPC URL: ${this.RPC_URL}`)
    console.log(`⛓️ Chain ID: ${this.CHAIN_ID}`)
    this.initializeClient()
  }

  private async initializeClient() {
    try {
      this.client = await CosmWasmClient.connect(this.RPC_URL)
      console.log(`✅ PersonaChain client connected`)
    } catch (error) {
      console.error(`❌ Failed to connect to PersonaChain:`, error)
    }
  }

  /**
   * Create a DID on PersonaChain
   */
  async createDID(publicKey: string, mnemonic?: string): Promise<DIDCreateResult> {
    try {
      console.log(`🆔 Creating DID on PersonaChain`)
      
      if (!this.client) {
        await this.initializeClient()
      }

      // Generate wallet from mnemonic or create new one
      let wallet: DirectSecp256k1HdWallet
      if (mnemonic) {
        wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
          prefix: "persona"
        })
      } else {
        wallet = await DirectSecp256k1HdWallet.generate(24, {
          prefix: "persona"
        })
      }

      const accounts = await wallet.getAccounts()
      const address = accounts[0].address
      
      // Create signing client
      this.signingClient = await SigningCosmWasmClient.connectWithSigner(
        this.RPC_URL,
        wallet,
        {
          gasPrice: GasPrice.fromString(this.GAS_PRICE)
        }
      )

      const did = `did:persona:${this.CHAIN_ID}:${address}`
      const timestamp = new Date().toISOString()

      // Create DID document
      const didDocument: DIDDocument = {
        id: did,
        context: [
          "https://www.w3.org/ns/did/v1",
          "https://w3id.org/security/suites/secp256k1-2019/v1"
        ],
        verificationMethod: [{
          id: `${did}#key-1`,
          type: "EcdsaSecp256k1VerificationKey2019",
          controller: did,
          publicKeyMultibase: publicKey
        }],
        authentication: [`${did}#key-1`],
        assertionMethod: [`${did}#key-1`],
        created: timestamp,
        updated: timestamp
      }

      // Store DID on PersonaChain
      const msg = {
        typeUrl: "/personachain.did.MsgCreateDID",
        value: {
          creator: address,
          did: did,
          document: JSON.stringify(didDocument)
        }
      }

      const fee = {
        amount: [{ denom: this.DENOM, amount: "5000" }],
        gas: "200000"
      }

      const result = await this.signingClient.signAndBroadcast(address, [msg], fee)
      
      if (result.code !== 0) {
        throw new Error(`Transaction failed: ${result.rawLog}`)
      }

      console.log(`✅ DID created successfully: ${did}`)
      
      return {
        did,
        document: didDocument,
        txHash: result.transactionHash,
        blockHeight: result.height
      }

    } catch (error) {
      console.error('❌ DID creation failed:', error)
      throw error
    }
  }

  /**
   * Store a verifiable credential on PersonaChain
   */
  async storeCredential(
    did: string,
    credential: VerifiableCredential,
    mnemonic: string
  ): Promise<PersonaChainResult> {
    try {
      console.log(`📝 Storing credential on PersonaChain for DID: ${did}`)
      
      if (!this.client) {
        await this.initializeClient()
      }

      // Create wallet from mnemonic
      const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
        prefix: "persona"
      })

      const accounts = await wallet.getAccounts()
      const address = accounts[0].address
      
      // Create signing client
      this.signingClient = await SigningCosmWasmClient.connectWithSigner(
        this.RPC_URL,
        wallet,
        {
          gasPrice: GasPrice.fromString(this.GAS_PRICE)
        }
      )

      // Store credential on PersonaChain
      const msg = {
        typeUrl: "/personachain.vc.MsgStoreCredential",
        value: {
          creator: address,
          credentialId: credential.credentialSubject.id,
          credential: JSON.stringify(credential),
          credentialType: credential.type[1] || "VerifiableCredential",
          issuer: credential.issuer,
          subject: did
        }
      }

      const fee = {
        amount: [{ denom: this.DENOM, amount: "10000" }],
        gas: "300000"
      }

      const result = await this.signingClient.signAndBroadcast(address, [msg], fee)
      
      if (result.code !== 0) {
        throw new Error(`Transaction failed: ${result.rawLog}`)
      }

      console.log(`✅ Credential stored successfully`)
      
      const credentialData: PersonaChainCredential = {
        id: `${result.transactionHash}_${Date.now()}`,
        credentialId: credential.credentialSubject.id,
        issuer: credential.issuer,
        subject: did,
        credentialData: credential,
        blockHeight: result.height,
        txHash: result.transactionHash,
        timestamp: new Date().toISOString(),
        status: 'active'
      }

      return {
        success: true,
        data: credentialData,
        txHash: result.transactionHash,
        blockHeight: result.height
      }

    } catch (error) {
      console.error('❌ PersonaChain storage error:', error)
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to store credential',
        data: undefined
      }
    }
  }

  /**
   * Store credential via PersonaChain API Gateway
   */
  private async storeViaAPI(
    walletAddress: string,
    credential: VerifiableCredential
  ): Promise<PersonaChainResult> {
    try {
      const payload = {
        wallet: walletAddress,
        credential: credential,
        type: 'verifiable_credential',
        action: 'store'
      }

      console.log(`🌐 Attempting API storage:`, payload)

      // Use our API route to avoid CORS
      const response = await fetch(`/api/personachain/credentials/${walletAddress}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      console.log(`✅ API storage successful:`, result)

      return {
        success: true,
        data: {
          id: result.id || `api_${Date.now()}`,
          credentialId: credential.credentialSubject.id,
          issuer: credential.issuer,
          subject: walletAddress,
          credentialData: credential,
          blockHeight: result.blockHeight || 0,
          txHash: result.txHash || 'pending',
          timestamp: new Date().toISOString(),
          status: 'active'
        },
        txHash: result.txHash,
        blockHeight: result.blockHeight
      }

    } catch (error) {
      console.error('❌ API storage failed:', error)
      return {
        success: false,
        error: 'PersonaChain API requires authentication - please configure API credentials',
        data: undefined
      }
    }
  }

  /**
   * Store credential via direct RPC call (real implementation needed)
   */
  private async storeViaRPC(
    walletAddress: string,
    credential: VerifiableCredential,
    _walletService?: unknown
  ): Promise<PersonaChainResult> {
    try {
      console.log(`⛓️ Direct RPC storage not yet implemented`)

      // Create transaction message for PersonaChain
      const msg = {
        type: 'persona/StoreCredential',
        value: {
          creator: walletAddress,
          credential_id: credential.credentialSubject.id,
          credential_data: JSON.stringify(credential),
          credential_type: 'GitHubDeveloperCredential'
        }
      }

      console.log(`📡 RPC message would be:`, msg)
      
      // TODO: Real implementation would:
      // 1. Sign the transaction with the connected wallet
      // 2. Broadcast to PersonaChain RPC endpoint
      // 3. Wait for confirmation and return real txHash/blockHeight
      
      console.log(`❌ Direct RPC storage not implemented yet`)

      return {
        success: false,
        error: 'Direct RPC storage not implemented - use PersonaChain API instead'
      }

    } catch (error) {
      console.error('❌ RPC storage failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'RPC storage failed'
      }
    }
  }

  /**
   * Query credentials by DID from PersonaChain
   */
  async getCredentials(did: string): Promise<PersonaChainCredential[]> {
    try {
      console.log(`🔍 Querying credentials for DID: ${did}`)

      if (!this.client) {
        await this.initializeClient()
      }

      if (!this.client) {
        throw new Error('Failed to connect to PersonaChain')
      }

      // Query credentials by subject DID
      const query = `/personachain.vc.Query/CredentialsBySubject`
      const queryData = {
        subject: did
      }

      const response = await this.client.queryContractSmart(query, queryData)
      
      if (response && response.credentials) {
        const credentials: PersonaChainCredential[] = response.credentials.map((cred: any) => ({
          id: cred.id,
          credentialId: cred.credentialId,
          issuer: cred.issuer,
          subject: cred.subject,
          credentialData: JSON.parse(cred.credential),
          blockHeight: cred.blockHeight,
          txHash: cred.txHash,
          timestamp: cred.createdAt,
          status: cred.status || 'active'
        }))

        console.log(`✅ Retrieved ${credentials.length} credentials from PersonaChain`)
        return credentials
      }

      return []

    } catch (error) {
      console.error('❌ Error retrieving credentials from PersonaChain:', error)
      return []
    }
  }

  /**
   * Resolve DID document from PersonaChain
   */
  async resolveDID(did: string): Promise<DIDDocument | null> {
    try {
      console.log(`🔍 Resolving DID: ${did}`)

      if (!this.client) {
        await this.initializeClient()
      }

      if (!this.client) {
        throw new Error('Failed to connect to PersonaChain')
      }

      // Query DID document
      const query = `/personachain.did.Query/DID`
      const queryData = {
        did: did
      }

      const response = await this.client.queryContractSmart(query, queryData)
      
      if (response && response.didDocument) {
        const document = JSON.parse(response.didDocument.document)
        console.log(`✅ DID resolved successfully`)
        return document
      }

      return null

    } catch (error) {
      console.error('❌ Error resolving DID:', error)
      return null
    }
  }

  /**
   * Verify credential exists on PersonaChain
   */
  async verifyCredential(credentialId: string): Promise<boolean> {
    try {
      console.log(`🔍 Verifying credential: ${credentialId}`)

      if (!this.client) {
        await this.initializeClient()
      }

      if (!this.client) {
        throw new Error('Failed to connect to PersonaChain')
      }

      // Query credential by ID
      const query = `/personachain.vc.Query/Credential`
      const queryData = {
        credentialId: credentialId
      }

      const response = await this.client.queryContractSmart(query, queryData)
      
      if (response && response.credential) {
        console.log(`✅ Credential verified on PersonaChain`)
        return response.credential.status !== 'revoked'
      }

      return false

    } catch (error) {
      console.error('❌ Error verifying credential:', error)
      return false
    }
  }

  /**
   * Get PersonaChain network status
   */
  async getNetworkStatus(): Promise<{ online: boolean; blockHeight?: number; chainId?: string }> {
    try {
      console.log(`📡 Checking PersonaChain network status`)

      if (!this.client) {
        await this.initializeClient()
      }

      if (!this.client) {
        return { online: false }
      }

      // Get latest block height
      const status = await this.client.status()
      
      return {
        online: true,
        blockHeight: parseInt(status.syncInfo.latestBlockHeight),
        chainId: status.nodeInfo.network
      }

    } catch (error) {
      console.error('❌ Error checking network status:', error)
      return { online: false }
    }
  }

  /**
   * Get wallet balance
   */
  async getBalance(address: string): Promise<{ amount: string; denom: string }[]> {
    try {
      if (!this.client) {
        await this.initializeClient()
      }

      if (!this.client) {
        throw new Error('Failed to connect to PersonaChain')
      }

      const balance = await this.client.getAllBalances(address)
      return balance

    } catch (error) {
      console.error('❌ Error getting balance:', error)
      return []
    }
  }

  /**
   * Generate new wallet
   */
  async generateWallet(): Promise<{ address: string; mnemonic: string; publicKey: string }> {
    try {
      const wallet = await DirectSecp256k1HdWallet.generate(24, {
        prefix: "persona"
      })

      const accounts = await wallet.getAccounts()
      const mnemonic = wallet.mnemonic
      
      return {
        address: accounts[0].address,
        mnemonic,
        publicKey: Buffer.from(accounts[0].pubkey).toString('base64')
      }

    } catch (error) {
      console.error('❌ Error generating wallet:', error)
      throw error
    }
  }
}

// Export singleton instance
export const personaChainService = new PersonaChainService()

// Convenience functions
export const createDIDOnChain = (publicKey: string, mnemonic?: string) =>
  personaChainService.createDID(publicKey, mnemonic)

export const storeCredentialOnChain = (did: string, credential: VerifiableCredential, mnemonic: string) =>
  personaChainService.storeCredential(did, credential, mnemonic)

export const getCredentialsFromChain = (did: string) =>
  personaChainService.getCredentials(did)

export const verifyCredentialOnChain = (credentialId: string) =>
  personaChainService.verifyCredential(credentialId)

export const resolveDIDOnChain = (did: string) =>
  personaChainService.resolveDID(did)

export const generatePersonaWallet = () =>
  personaChainService.generateWallet()