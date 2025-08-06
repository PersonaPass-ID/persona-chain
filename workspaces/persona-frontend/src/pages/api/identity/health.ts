// Health Check API Endpoint for Real Infrastructure
// Verifies Supabase database and PersonaChain blockchain connections

import { NextApiRequest, NextApiResponse } from 'next'
import { checkSupabaseConnection } from '../../../lib/storage/supabase-client'
import { realIdentityStorage } from '../../../lib/storage/real-identity-storage'

interface HealthCheckResponse {
  success: boolean
  status: 'healthy' | 'degraded' | 'unhealthy'
  components: {
    database: {
      status: 'connected' | 'disconnected' | 'error'
      message: string
      responseTime?: number
    }
    blockchain: {
      status: 'connected' | 'disconnected' | 'error'
      message: string
      network?: string
      responseTime?: number
    }
    encryption: {
      status: 'working' | 'error'
      message: string
    }
  }
  timestamp: string
  environment: string
  message: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<HealthCheckResponse>) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      status: 'unhealthy',
      components: {
        database: { status: 'error', message: 'Method not allowed' },
        blockchain: { status: 'error', message: 'Method not allowed' },
        encryption: { status: 'error', message: 'Method not allowed' }
      },
      timestamp: new Date().toISOString(),
      environment: process.env.NEXT_PUBLIC_ENVIRONMENT || 'unknown',
      message: 'Method not allowed'
    })
  }

  const startTime = Date.now()
  console.log('🏥 Health Check: Starting infrastructure verification...')

  // Initialize component statuses
  const components = {
    database: { status: 'disconnected' as const, message: 'Not tested' },
    blockchain: { status: 'disconnected' as const, message: 'Not tested' },
    encryption: { status: 'error' as const, message: 'Not tested' }
  }

  let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'unhealthy'

  try {
    // Test 1: Supabase Database Connection
    console.log('🔍 Testing Supabase database connection...')
    const dbStartTime = Date.now()
    
    try {
      const dbHealth = await checkSupabaseConnection()
      const dbResponseTime = Date.now() - dbStartTime

      if (dbHealth.success) {
        components.database = {
          status: 'connected',
          message: 'Database connection successful',
          responseTime: dbResponseTime
        }
        console.log(`✅ Database: Connected (${dbResponseTime}ms)`)
      } else {
        components.database = {
          status: 'error',
          message: dbHealth.error || 'Connection failed',
          responseTime: dbResponseTime
        }
        console.log(`❌ Database: Failed - ${dbHealth.error}`)
      }
    } catch (dbError) {
      components.database = {
        status: 'error',
        message: dbError instanceof Error ? dbError.message : 'Database test failed'
      }
      console.log(`❌ Database: Error - ${components.database.message}`)
    }

    // Test 2: PersonaChain Blockchain Connection
    console.log('🔍 Testing PersonaChain blockchain connection...')
    const blockchainStartTime = Date.now()
    
    try {
      // Test RPC endpoint connectivity
      const rpcUrl = process.env.NEXT_PUBLIC_PERSONACHAIN_RPC || 'https://rpc.personapass.xyz'
      
      const response = await fetch(`${rpcUrl}/status`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      })

      const blockchainResponseTime = Date.now() - blockchainStartTime

      if (response.ok) {
        components.blockchain = {
          status: 'connected',
          message: 'PersonaChain RPC connection successful',
          network: 'PersonaChain',
          responseTime: blockchainResponseTime
        }
        console.log(`✅ Blockchain: Connected to PersonaChain (${blockchainResponseTime}ms)`)
      } else {
        components.blockchain = {
          status: 'error',
          message: `RPC endpoint returned ${response.status}`,
          network: 'PersonaChain',
          responseTime: blockchainResponseTime
        }
        console.log(`❌ Blockchain: HTTP ${response.status}`)
      }
    } catch (blockchainError) {
      components.blockchain = {
        status: 'error',
        message: blockchainError instanceof Error ? blockchainError.message : 'Blockchain test failed',
        network: 'PersonaChain'
      }
      console.log(`❌ Blockchain: Error - ${components.blockchain.message}`)
    }

    // Test 3: Encryption System
    console.log('🔍 Testing encryption system...')
    
    try {
      const { IdentityEncryption } = require('../../../lib/encryption')
      
      // Test data
      const testData = { test: 'health-check', timestamp: Date.now() }
      const testSignature = 'health-check-signature-' + Date.now()

      // Test encryption
      const encrypted = await IdentityEncryption.encryptData(testData, testSignature)
      
      // Test decryption
      const decrypted = await IdentityEncryption.decryptData(encrypted, testSignature)

      if (decrypted.success && JSON.stringify(decrypted.data) === JSON.stringify(testData)) {
        components.encryption = {
          status: 'working',
          message: 'Encryption/decryption test passed'
        }
        console.log('✅ Encryption: Working correctly')
      } else {
        components.encryption = {
          status: 'error',
          message: 'Encryption/decryption test failed'
        }
        console.log('❌ Encryption: Test failed')
      }
    } catch (encryptionError) {
      components.encryption = {
        status: 'error',
        message: encryptionError instanceof Error ? encryptionError.message : 'Encryption test failed'
      }
      console.log(`❌ Encryption: Error - ${components.encryption.message}`)
    }

    // Determine overall status
    const connectedComponents = Object.values(components).filter(c => 
      c.status === 'connected' || c.status === 'working'
    ).length

    if (connectedComponents === 3) {
      overallStatus = 'healthy'
    } else if (connectedComponents >= 1) {
      overallStatus = 'degraded'
    } else {
      overallStatus = 'unhealthy'
    }

    const totalTime = Date.now() - startTime
    const statusIcon = overallStatus === 'healthy' ? '✅' : overallStatus === 'degraded' ? '⚠️' : '❌'
    
    console.log(`${statusIcon} Health Check Complete: ${overallStatus.toUpperCase()} (${totalTime}ms)`)

    const response: HealthCheckResponse = {
      success: overallStatus !== 'unhealthy',
      status: overallStatus,
      components,
      timestamp: new Date().toISOString(),
      environment: process.env.NEXT_PUBLIC_ENVIRONMENT || 'development',
      message: `Infrastructure is ${overallStatus}. ${connectedComponents}/3 components operational.`
    }

    // Set appropriate HTTP status code
    const httpStatus = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 207 : 503

    return res.status(httpStatus).json(response)

  } catch (error) {
    console.error('❌ Health check failed:', error)
    
    return res.status(503).json({
      success: false,
      status: 'unhealthy',
      components,
      timestamp: new Date().toISOString(),
      environment: process.env.NEXT_PUBLIC_ENVIRONMENT || 'development',
      message: `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    })
  }
}