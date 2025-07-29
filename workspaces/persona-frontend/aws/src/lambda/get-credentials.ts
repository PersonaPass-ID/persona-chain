import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

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

    // Query DynamoDB for user credentials
    const queryParams = {
      TableName: process.env.DYNAMODB_TABLE_NAME!,
      KeyConditionExpression: 'PK = :pk',
      ExpressionAttributeValues: {
        ':pk': `USER#${walletAddress}`,
      },
    };

    const result = await docClient.send(new QueryCommand(queryParams));
    const credentials = result.Items || [];

    // Transform credentials for frontend
    const formattedCredentials = credentials.map(item => ({
      id: item.SK?.replace('DID#', '') || item.did,
      did: item.did,
      type: 'PersonaIdentityCredential',
      status: item.status,
      firstName: item.firstName,
      lastName: item.lastName,
      authMethod: item.authMethod,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      blockchain: {
        txHash: item.txHash,
        blockHeight: item.blockchainHeight,
        network: 'persona-testnet',
        nodeUrl: process.env.BLOCKCHAIN_RPC_URL
      },
      verification: {
        level: item.verificationLevel || 'basic',
        method: item.authMethod,
        timestamp: item.createdAt
      },
      metadata: item.metadata || {
        version: '1.0',
        network: 'persona-testnet'
      }
    }));

    // Get blockchain status
    const blockchainStatus = {
      network: 'persona-testnet',
      nodeUrl: process.env.BLOCKCHAIN_RPC_URL,
      totalCredentials: credentials.length,
      activeCredentials: credentials.filter(c => c.status === 'active').length,
      latestBlockHeight: Math.max(...credentials.map(c => c.blockchainHeight || 0), 1)
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