import { NextApiRequest, NextApiResponse } from 'next'
import { realIdentityStorage, VerifiableCredential } from '../../../lib/storage/real-identity-storage'
import { checkSupabaseConnection } from '../../../lib/storage/supabase-client'

interface WalletCredential {
  id: string
  did: string
  type: string[]
  status: 'valid' | 'revoked' | 'suspended'
  walletAddress: string
  firstName?: string
  lastName?: string
  walletType: string
  issuanceDate: string
  expirationDate?: string
  issuer: string
  credentialSubject: { [key: string]: any }
  blockchain?: {
    txHash?: string
    blockHeight?: number
    network: string
    contentHash?: string
  }
  verification?: {
    method: string
    walletType: string
  }
}

interface GetCredentialsResponse {
  success: boolean
  did?: string
  credentials?: WalletCredential[]
  storage?: {
    encrypted: boolean
    network: string
    totalCredentials: number
    activeCredentials: number
    storageProvider: string
  }
  error?: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<GetCredentialsResponse>) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    })
  }

  try {
    const { address } = req.query
    const { walletType = 'keplr' } = req.query

    if (!address || typeof address !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Wallet address is required'
      })
    }

    console.log(`🔍 Fetching credentials using REAL Web3 storage for wallet: ${address}`)

    // Check if Supabase is configured and connected
    let dbHealth
    try {
      dbHealth = await checkSupabaseConnection()
    } catch (error) {
      console.log(`⚠️ Supabase initialization failed, returning empty credentials for: ${address}`)
      return res.status(200).json({
        success: true,
        did: `did:cosmos:${address}`, // Generate fallback DID
        credentials: [],
        storage: {
          encrypted: true,
          network: 'personachain-1',
          totalCredentials: 0,
          activeCredentials: 0,
          storageProvider: 'Supabase Not Configured - Please set up environment variables'
        }
      })
    }
    
    if (!dbHealth.success) {
      console.log(`⚠️ Supabase not connected, returning empty credentials for: ${address}`)
      return res.status(200).json({
        success: true,
        did: `did:cosmos:${address}`, // Generate fallback DID
        credentials: [],
        storage: {
          encrypted: true,
          network: 'personachain-1',
          totalCredentials: 0,
          activeCredentials: 0,
          storageProvider: 'Supabase Connection Failed - Check configuration'
        }
      })
    }

    // Get DID for the wallet
    let did, credentialsResult, storageStats
    
    try {
      did = await realIdentityStorage.getDIDByWallet(address)
      
      if (!did) {
        console.log(`📝 No DID found for wallet: ${address}, returning empty credentials`)
        return res.status(200).json({
          success: true,
          did: null,
          credentials: [],
          storage: {
            encrypted: true,
            network: 'personachain-1',
            totalCredentials: 0,
            activeCredentials: 0,
            storageProvider: 'Real Supabase Database (No DID found)'
          }
        })
      }

      console.log(`🆔 Found DID for wallet: ${did}`)

      // Get all credentials for the DID using REAL storage
      credentialsResult = await realIdentityStorage.getVerifiableCredentials(
        did,
        address,
        walletType as string
      )

      if (!credentialsResult.success) {
        console.log(`⚠️ Failed to get credentials: ${credentialsResult.error}`)
        return res.status(200).json({
          success: true,
          did,
          credentials: [],
          storage: {
            encrypted: true,
            network: 'personachain-1',
            totalCredentials: 0,
            activeCredentials: 0,
            storageProvider: 'Real Supabase Database (Query failed)'
          }
        })
      }

      // Get storage statistics
      storageStats = await realIdentityStorage.getStorageStats(address)
      
    } catch (storageError) {
      console.error(`❌ Storage operation failed for ${address}:`, storageError)
      return res.status(200).json({
        success: true,
        did: `did:cosmos:${address}`, // Generate fallback DID
        credentials: [],
        storage: {
          encrypted: true,
          network: 'personachain-1',
          totalCredentials: 0,
          activeCredentials: 0,
          storageProvider: 'Storage Error - Check server logs'
        }
      })
    }

    // Convert VerifiableCredentials to WalletCredential format
    const credentials: WalletCredential[] = (credentialsResult.data || []).map(vc => ({
      id: vc.id,
      did: vc.credentialSubject.id,
      type: Array.isArray(vc.type) ? vc.type : [vc.type],
      status: 'valid' as const,
      walletAddress: address,
      firstName: vc.credentialSubject.firstName,
      lastName: vc.credentialSubject.lastName,
      walletType: vc.credentialSubject.walletType || walletType as string,
      issuanceDate: vc.issuanceDate,
      expirationDate: vc.expirationDate,
      issuer: typeof vc.issuer === 'string' ? vc.issuer : vc.issuer.id,
      credentialSubject: vc.credentialSubject,
      blockchain: {
        txHash: vc.proof?.blockchainTxHash || (vc.proof as any)?.blockchainAnchor?.tx_hash,
        network: 'personachain-1',
        contentHash: undefined // This would come from storage metadata
      },
      verification: {
        method: 'wallet-signature',
        walletType: walletType as string
      }
    }))

    const response: GetCredentialsResponse = {
      success: true,
      did,
      credentials,
      storage: {
        encrypted: true,
        network: 'personachain-1',
        totalCredentials: storageStats.totalCredentials,
        activeCredentials: credentials.filter(c => c.status === 'valid').length,
        storageProvider: 'REAL Web3 Hybrid (PersonaChain + Encrypted Supabase)'
      }
    }

    console.log(`✅ Returning ${credentials.length} encrypted credentials for ${address}`)
    
    return res.status(200).json(response)

  } catch (error) {
    console.error('❌ Web3 credentials fetch failed:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    })
  }
}