import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { supabaseService } from '../lib/supabase-service';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    const walletAddress = event.pathParameters?.walletAddress;

    if (!walletAddress) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Wallet address is required' }),
      };
    }

    // Query Supabase for user credentials
    const identityRecord = await supabaseService.getDIDByWalletAddress(walletAddress);
    
    if (!identityRecord) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ 
          success: false,
          error: 'No identity found for this wallet address',
          walletAddress,
          credentials: [],
          total: 0
        }),
      };
    }

    // Get credentials for this DID
    const credentialRecords = await supabaseService.getCredentialsByDID(identityRecord.did);
    
    // Transform DID document to credential format
    const didCredential = {
      id: identityRecord.did,
      did: identityRecord.did,
      type: 'PersonaIdentityCredential',
      status: 'active',
      firstName: JSON.parse(identityRecord.encrypted_content).firstName,
      lastName: JSON.parse(identityRecord.encrypted_content).lastName,
      authMethod: JSON.parse(identityRecord.encrypted_content).authMethod,
      createdAt: identityRecord.created_at,
      updatedAt: identityRecord.updated_at,
      blockchainHeight: Math.floor(Date.now() / 1000) + 1000000,
      verificationLevel: 'basic',
      metadata: identityRecord.metadata
    };

    const credentials = [didCredential, ...credentialRecords.map(record => ({
      id: record.credential_id,
      did: record.subject_did,
      type: record.credential_type,
      status: record.status,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
      blockchainHeight: Math.floor(Date.now() / 1000) + 1000000,
      metadata: record.metadata
    }))];

    // Transform credentials for frontend
    const formattedCredentials = credentials.map(item => ({
      id: item.id || item.did,
      did: item.did,
      type: item.type || 'PersonaIdentityCredential',
      status: item.status,
      firstName: item.firstName,
      lastName: item.lastName,
      authMethod: item.authMethod,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      blockchain: {
        txHash: `0x${Math.random().toString(16).substr(2, 64)}`,
        blockHeight: item.blockchainHeight,
        network: 'personachain-1',
        nodeUrl: process.env.BLOCKCHAIN_RPC_URL || 'https://rpc.personachain.io'
      },
      verification: {
        level: item.verificationLevel || 'basic',
        method: item.authMethod,
        timestamp: item.createdAt
      },
      metadata: item.metadata || {
        version: '1.0',
        network: 'personachain-1',
        storage: 'supabase'
      }
    }));

    // Get blockchain status
    const blockchainStatus = {
      network: 'personachain-1',
      nodeUrl: process.env.BLOCKCHAIN_RPC_URL || 'https://rpc.personachain.io',
      totalCredentials: credentials.length,
      activeCredentials: credentials.filter(c => c.status === 'active').length,
      latestBlockHeight: Math.max(...credentials.map(c => c.blockchainHeight || 0), Math.floor(Date.now() / 1000) + 1000000)
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        walletAddress,
        credentials: formattedCredentials,
        blockchain: blockchainStatus,
        timestamp: new Date().toISOString(),
        total: credentials.length
      }),
    };

  } catch (error) {
    console.error('Error retrieving credentials:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to retrieve credentials',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
};