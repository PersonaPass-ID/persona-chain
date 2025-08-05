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
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { 
  DynamoDBDocumentClient, 
  QueryCommand, 
  PutCommand, 
  UpdateCommand,
  GetCommand,
  BatchGetCommand 
} from '@aws-sdk/lib-dynamodb'

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' })
const docClient = DynamoDBDocumentClient.from(client)

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

    // Generate DynamoDB keys
    const pk = `USER#${walletAddress}`
    const sk = `CRED#${credential.id}#v${credential.version}`

    // Store credential with enhanced metadata
    const item = {
      PK: pk,
      SK: sk,
      walletAddress,
      credentialId: credential.id,
      credentialType: credential.credentialType,
      version: credential.version,
      status: credential.status,
      credentialData: credential.credentialData,
      metadata: credential.metadata,
      blockchain: credential.blockchain,
      access: credential.access,
      compliance: credential.compliance,
      createdAt: credential.createdAt,
      updatedAt: credential.updatedAt,
      expiresAt: credential.expiresAt,
      storageVersion,
      // GSI fields
      gsi1pk: `CRED#${credential.id}`,
      gsi1sk: `v${credential.version}`,
      gsi2pk: `TYPE#${credential.credentialType}`,
      gsi2sk: credential.createdAt
    }

    await docClient.send(new PutCommand({
      TableName: process.env.DYNAMODB_TABLE_NAME!,
      Item: item
    }))

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
 * Get single credential with version support
 */
async function handleGetCredential(
  event: APIGatewayProxyEvent,
  walletAddress: string,
  credentialId: string
): Promise<APIGatewayProxyResult> {
  try {
    const queryParams = new URLSearchParams(event.queryStringParameters || {})
    const version = queryParams.get('version') || 'latest'

    let sk: string
    if (version === 'latest') {
      // Query for latest version
      const queryResult = await docClient.send(new QueryCommand({
        TableName: process.env.DYNAMODB_TABLE_NAME!,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk_prefix)',
        ExpressionAttributeValues: {
          ':pk': `USER#${walletAddress}`,
          ':sk_prefix': `CRED#${credentialId}#`
        },
        ScanIndexForward: false, // Get latest first
        Limit: 1
      }))

      if (!queryResult.Items || queryResult.Items.length === 0) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Credential not found' })
        }
      }

      const credential = queryResult.Items[0]
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(credential)
      }
    } else {
      // Get specific version
      sk = `CRED#${credentialId}#v${version}`
      
      const result = await docClient.send(new GetCommand({
        TableName: process.env.DYNAMODB_TABLE_NAME!,
        Key: {
          PK: `USER#${walletAddress}`,
          SK: sk
        }
      }))

      if (!result.Item) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Credential version not found' })
        }
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result.Item)
      }
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
    // Query all credentials for the wallet
    const queryResult = await docClient.send(new QueryCommand({
      TableName: process.env.DYNAMODB_TABLE_NAME!,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk_prefix)',
      ExpressionAttributeValues: {
        ':pk': `USER#${walletAddress}`,
        ':sk_prefix': 'CRED#'
      }
    }))

    const credentials = queryResult.Items || []

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
 * Track credential access
 */
async function handleTrackAccess(
  event: APIGatewayProxyEvent,
  walletAddress: string,
  credentialId: string
): Promise<APIGatewayProxyResult> {
  try {
    const body = JSON.parse(event.body || '{}')
    const { operation, timestamp, userAgent } = body

    // Update access statistics
    const updateResult = await docClient.send(new UpdateCommand({
      TableName: process.env.DYNAMODB_TABLE_NAME!,
      Key: {
        PK: `USER#${walletAddress}`,
        SK: `CRED#${credentialId}#v1` // Assume latest version for now
      },
      UpdateExpression: `
        SET access.lastAccessed = :timestamp,
            access.totalReads = if_not_exists(access.totalReads, :zero) + :increment,
            #userAgent = :userAgent
      `,
      ExpressionAttributeNames: {
        '#userAgent': 'lastUserAgent'
      },
      ExpressionAttributeValues: {
        ':timestamp': timestamp,
        ':zero': 0,
        ':increment': operation === 'read' ? 1 : 0,
        ':userAgent': userAgent
      }
    }))

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Access tracked successfully'
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
 * Create backup
 */
async function handleCreateBackup(
  event: APIGatewayProxyEvent,
  walletAddress: string
): Promise<APIGatewayProxyResult> {
  try {
    // Query all backup-enabled credentials
    const queryResult = await docClient.send(new QueryCommand({
      TableName: process.env.DYNAMODB_TABLE_NAME!,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk_prefix)',
      FilterExpression: 'metadata.backupEnabled = :backupEnabled',
      ExpressionAttributeValues: {
        ':pk': `USER#${walletAddress}`,
        ':sk_prefix': 'CRED#',
        ':backupEnabled': true
      }
    }))

    const credentials = queryResult.Items || []
    
    if (credentials.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'No credentials enabled for backup' })
      }
    }

    // Create backup manifest
    const backupId = `backup_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`
    const manifest = {
      backupId,
      walletAddress,
      createdAt: new Date().toISOString(),
      credentials: credentials.map(c => ({
        id: c.credentialId,
        version: c.version,
        size: c.metadata?.size || 0,
        checksum: c.metadata?.checksum
      })),
      totalSize: credentials.reduce((sum, c) => sum + (c.metadata?.size || 0), 0),
      compressionRatio: 1, // Would be calculated
      encryptionLevel: 'enhanced'
    }

    // Store backup manifest
    await docClient.send(new PutCommand({
      TableName: process.env.DYNAMODB_TABLE_NAME!,
      Item: {
        PK: `USER#${walletAddress}`,
        SK: `BACKUP#${backupId}`,
        backupId,
        manifest,
        credentials,
        createdAt: manifest.createdAt,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() // 90 days
      }
    }))

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        backupId,
        manifest
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
 * Restore from backup
 */
async function handleRestoreBackup(
  event: APIGatewayProxyEvent,
  walletAddress: string
): Promise<APIGatewayProxyResult> {
  try {
    const body = JSON.parse(event.body || '{}')
    const { backupId, overwriteExisting = false, selectiveRestore } = body

    // Retrieve backup
    const backupResult = await docClient.send(new GetCommand({
      TableName: process.env.DYNAMODB_TABLE_NAME!,
      Key: {
        PK: `USER#${walletAddress}`,
        SK: `BACKUP#${backupId}`
      }
    }))

    if (!backupResult.Item) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Backup not found' })
      }
    }

    const backup = backupResult.Item
    let credentialsToRestore = backup.credentials

    // Filter for selective restore
    if (selectiveRestore && Array.isArray(selectiveRestore)) {
      credentialsToRestore = backup.credentials.filter((c: any) => 
        selectiveRestore.includes(c.credentialId)
      )
    }

    let restoredCount = 0
    let skippedCount = 0
    const errors: string[] = []

    // Restore each credential
    for (const credential of credentialsToRestore) {
      try {
        const pk = `USER#${walletAddress}`
        const sk = `CRED#${credential.credentialId}#v${credential.version}`

        // Check if exists (unless overwriting)
        if (!overwriteExisting) {
          const existingResult = await docClient.send(new GetCommand({
            TableName: process.env.DYNAMODB_TABLE_NAME!,
            Key: { PK: pk, SK: sk }
          }))

          if (existingResult.Item) {
            skippedCount++
            continue
          }
        }

        // Restore credential
        await docClient.send(new PutCommand({
          TableName: process.env.DYNAMODB_TABLE_NAME!,
          Item: {
            PK: pk,
            SK: sk,
            ...credential,
            restoredAt: new Date().toISOString(),
            restoredFrom: backupId
          }
        }))

        restoredCount++

      } catch (error) {
        errors.push(`Failed to restore ${credential.credentialId}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        restoredCount,
        skippedCount,
        errors: errors.length > 0 ? errors : undefined
      })
    }

  } catch (error) {
    console.error('Restore backup error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to restore backup' })
    }
  }
}

/**
 * Update wallet statistics
 */
async function updateWalletStats(
  walletAddress: string,
  operation: string,
  metadata: any
): Promise<void> {
  try {
    await docClient.send(new UpdateCommand({
      TableName: process.env.DYNAMODB_TABLE_NAME!,
      Key: {
        PK: `USER#${walletAddress}`,
        SK: 'STATS'
      },
      UpdateExpression: `
        SET lastUpdated = :timestamp,
            totalCredentials = if_not_exists(totalCredentials, :zero) + :increment,
            totalSize = if_not_exists(totalSize, :zero) + :size,
            operations = if_not_exists(operations, :zero) + :one
      `,
      ExpressionAttributeValues: {
        ':timestamp': new Date().toISOString(),
        ':zero': 0,
        ':one': 1,
        ':increment': operation === 'credential_added' ? 1 : 0,
        ':size': metadata.size || 0
      }
    }))
  } catch (error) {
    console.warn('Failed to update wallet stats:', error)
  }
}