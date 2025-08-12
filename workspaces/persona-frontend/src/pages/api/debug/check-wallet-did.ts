import { NextApiRequest, NextApiResponse } from 'next'
import { realIdentityStorage } from '../../../lib/storage/real-identity-storage'
import { checkSupabaseConnection } from '../../../lib/storage/supabase-client'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { wallet } = req.query
    
    if (!wallet || typeof wallet !== 'string') {
      return res.status(400).json({ 
        error: 'Wallet address required',
        usage: '?wallet=cosmos17em02n4rgky94xhc8e3q35zr4ht84pgzr0ajcd'
      })
    }

    console.log(`🔍 Checking DID status for wallet: ${wallet}`)

    // Check Supabase connection
    const dbHealth = await checkSupabaseConnection()
    
    // Get DID for the wallet
    const did = await realIdentityStorage.getDIDByWallet(wallet)
    
    // Get credentials if DID exists
    let credentials = null
    let credentialCount = 0
    
    if (did) {
      const credentialsResult = await realIdentityStorage.getVerifiableCredentials(
        did,
        wallet,
        'keplr' // default wallet type
      )
      
      if (credentialsResult.success) {
        credentials = credentialsResult.data
        credentialCount = credentials?.length || 0
      }
    }

    // Get storage stats
    const storageStats = await realIdentityStorage.getStorageStats(wallet)

    return res.status(200).json({
      success: true,
      wallet: wallet,
      database: {
        connected: dbHealth.success,
        provider: 'Supabase PostgreSQL',
        url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not configured'
      },
      identity: {
        hasDID: !!did,
        did: did || null,
        credentialCount: credentialCount,
        status: did ? 'CREATED' : 'NOT_FOUND'
      },
      storage: {
        totalCredentials: storageStats.totalCredentials,
        totalRecords: storageStats.totalRecords,
        lastActivity: storageStats.lastActivity
      },
      credentials: credentials?.slice(0, 3) || [], // Show first 3 credentials
      debug: {
        timestamp: new Date().toISOString(),
        nodeEnv: process.env.NODE_ENV
      }
    })

  } catch (error) {
    console.error('❌ Debug check failed:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      wallet: req.query.wallet
    })
  }
}