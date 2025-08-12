/**
 * Enhanced Credential Operations Lambda
 * 
 * Advanced operations for credential storage including:
 * - Versioning and history
 * - Analytics and metrics
 * - Access tracking
 * - Backup management
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { supabaseService } from '../lib/supabase-service'

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json',
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  try {
    const path = event.path
    const method = event.httpMethod
    const walletAddress = event.pathParameters?.walletAddress
    const credentialId = event.pathParameters?.credentialId

    // Route to appropriate handler
    if (method === 'POST' && path.includes('/store')) {
      return await handleStoreCredential(event)
    }
    
    if (method === 'GET' && path.includes('/analytics')) {
      return await handleGetAnalytics(event, walletAddress!)
    }
    
    if (method === 'POST' && path.includes('/access')) {
      return await handleTrackAccess(event, walletAddress!, credentialId!)
    }
    
    if (method === 'GET' && credentialId) {
      return await handleGetCredential(event, walletAddress!, credentialId)
    }
    
    if (method === 'POST' && path.includes('/backup')) {
      return await handleCreateBackup(event, walletAddress!)
    }
    
    if (method === 'POST' && path.includes('/restore')) {
      return await handleRestoreBackup(event, walletAddress!)
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Endpoint not found' })
    }

  } catch (error) {
    console.error('Lambda error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
}

/**
 * Store enhanced credential
 */
async function handleStoreCredential(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const body = JSON.parse(event.body || '{}')
    const { walletAddress, credential, storageVersion } = body

    if (!walletAddress || !credential) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' })
      }
    }

    // Create enhanced verifiable credential structure
    const verifiableCredential = {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      id: credential.id,
      type: ['VerifiableCredential', credential.credentialType],
      issuer: 'did:persona:issuer',
      issuanceDate: credential.createdAt,
      expirationDate: credential.expiresAt,
      credentialSubject: credential.credentialData,
      version: credential.version,
      storageVersion,
      metadata: credential.metadata,
      blockchain: credential.blockchain,
      access: credential.access,
      compliance: credential.compliance,
      proof: {
        type: 'PersonaBlockchainProof2024',
        created: credential.createdAt,
        proofPurpose: 'assertionMethod'
      }
    }

    // Store enhanced credential in Supabase
    const storedCredential = await supabaseService.storeCredential(verifiableCredential, walletAddress)

    // Update wallet summary statistics
    await updateWalletStats(walletAddress, 'credential_added', {
      credentialId: credential.id,
      credentialType: credential.credentialType,
      size: credential.metadata.size
    })

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        credentialId: credential.id,
        version: credential.version,
        message: 'Credential stored successfully'
      })
    }

  } catch (error) {
    console.error('Store credential error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to store credential' })
    }
  }
}

/**
 * Get single credential (simplified for Supabase)
 */
async function handleGetCredential(
  event: APIGatewayProxyEvent,
  walletAddress: string,
  credentialId: string
): Promise<APIGatewayProxyResult> {
  try {
    // Get credential from Supabase
    const credential = await supabaseService.verifyCredential(credentialId)

    if (!credential) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Credential not found' })
      }
    }

    // Verify wallet ownership by checking identity record
    const identityRecord = await supabaseService.getDIDByWalletAddress(walletAddress)
    if (!identityRecord || identityRecord.did !== credential.subject_did) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Access denied - credential not owned by wallet' })
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(credential)
    }

  } catch (error) {
    console.error('Get credential error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to retrieve credential' })
    }
  }
}

/**
 * Get storage analytics
 */
async function handleGetAnalytics(
  event: APIGatewayProxyEvent,
  walletAddress: string
): Promise<APIGatewayProxyResult> {
  try {
    // Get wallet credentials from Supabase
    const credentialRecords = await supabaseService.getCredentialsByWallet(walletAddress)
    const credentials = credentialRecords.map(record => {
      const credentialData = JSON.parse(record.encrypted_credential)
      return {
        ...credentialData,
        metadata: record.metadata,
        access: credentialData.access || { totalReads: 0 }
      }
    })

    // Calculate analytics
    const totalCredentials = credentials.length
    const totalSize = credentials.reduce((sum, cred) => sum + (cred.metadata?.size || 0), 0)
    
    // Access patterns
    const accessPatterns = credentials.reduce((acc, cred) => {
      const pattern = cred.access?.accessPattern || 'rare'
      acc[pattern] = (acc[pattern] || 0) + 1
      return acc
    }, { frequent: 0, moderate: 0, rare: 0 })

    // Compression analysis
    const compressedCredentials = credentials.filter(c => c.metadata?.compressionType)
    const compressionRatio = compressedCredentials.length > 0 
      ? compressedCredentials.reduce((sum, c) => {
          const originalSize = JSON.stringify(c.credentialData).length
          return sum + (originalSize / (c.metadata?.size || originalSize))
        }, 0) / compressedCredentials.length
      : 1

    // Backup coverage
    const backupEnabledCredentials = credentials.filter(c => c.metadata?.backupEnabled)
    const backupCoverage = totalCredentials > 0 
      ? (backupEnabledCredentials.length / totalCredentials) * 100 
      : 0

    // Cost estimation (simplified)
    const monthlyStorageCost = (totalSize / 1024 / 1024) * 0.25 // $0.25 per GB per month
    const avgReadsPerMonth = credentials.reduce((sum, c) => sum + (c.access?.totalReads || 0), 0)
    const monthlyRequestCost = (avgReadsPerMonth / 1000000) * 0.25 // $0.25 per million requests

    const analytics = {
      totalCredentials,
      totalSize,
      storageEfficiency: Math.round((compressionRatio - 1) * 100),
      accessPatterns,
      compressionRatio: Math.round(compressionRatio * 100) / 100,
      backupCoverage: Math.round(backupCoverage),
      syncStatus: {
        synced: credentials.filter(c => c.metadata?.syncEnabled).length,
        pending: 0, // Would be calculated from sync queue
        failed: 0   // Would be calculated from sync errors
      },
      costMetrics: {
        monthlyStorageCost: Math.round(monthlyStorageCost * 100) / 100,
        monthlyRequestCost: Math.round(monthlyRequestCost * 100) / 100
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(analytics)
    }

  } catch (error) {
    console.error('Get analytics error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to retrieve analytics' })
    }
  }
}

/**
 * Track credential access (simplified for Supabase)
 */
async function handleTrackAccess(
  event: APIGatewayProxyEvent,
  walletAddress: string,
  credentialId: string
): Promise<APIGatewayProxyResult> {
  try {
    const body = JSON.parse(event.body || '{}')
    const { operation, timestamp, userAgent } = body

    // For now, just log the access - could be extended to store in analytics table
    console.log(`Access tracked: ${walletAddress} accessed ${credentialId} via ${operation} at ${timestamp}`)

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Access tracked successfully (logged)'
      })
    }

  } catch (error) {
    console.error('Track access error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to track access' })
    }
  }
}

/**
 * Create backup (simplified for Supabase)
 */
async function handleCreateBackup(
  event: APIGatewayProxyEvent,
  walletAddress: string
): Promise<APIGatewayProxyResult> {
  try {
    // Get all credentials for wallet
    const credentials = await supabaseService.getCredentialsByWallet(walletAddress)
    
    if (credentials.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'No credentials found for backup' })
      }
    }

    // Create backup manifest
    const backupId = `backup_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`
    const manifest = {
      backupId,
      walletAddress,
      createdAt: new Date().toISOString(),
      credentials: credentials.map(c => ({
        id: c.credential_id,
        type: c.credential_type,
        status: c.status
      })),
      totalCredentials: credentials.length,
      encryptionLevel: 'enhanced'
    }

    console.log(`Backup created: ${backupId} for wallet ${walletAddress} with ${credentials.length} credentials`)

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        backupId,
        manifest,
        message: 'Backup manifest created (actual backup would be stored in secure location)'
      })
    }

  } catch (error) {
    console.error('Create backup error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to create backup' })
    }
  }
}

/**
 * Restore from backup (simplified for Supabase)
 */
async function handleRestoreBackup(
  event: APIGatewayProxyEvent,
  walletAddress: string
): Promise<APIGatewayProxyResult> {
  try {
    const body = JSON.parse(event.body || '{}')
    const { backupId } = body

    console.log(`Restore backup ${backupId} for wallet ${walletAddress} requested`)

    // For now, return a success response indicating restore would be processed
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Backup restore initiated (would be processed from secure backup storage)',
        backupId,
        status: 'processing'
      })
    }

  } catch (error) {
    console.error('Restore backup error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to initiate backup restore' })
    }
  }
}

/**
 * Update wallet statistics (simplified for Supabase)
 */
async function updateWalletStats(
  walletAddress: string,
  operation: string,
  metadata: any
): Promise<void> {
  try {
    // Log statistics update - could be extended to store in analytics table
    console.log(`Wallet stats update: ${walletAddress} - ${operation}`, metadata)
  } catch (error) {
    console.warn('Failed to update wallet stats:', error)
  }
}