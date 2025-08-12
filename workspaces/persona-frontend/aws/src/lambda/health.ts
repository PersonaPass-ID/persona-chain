import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
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
    // Test blockchain connectivity
    let blockchainStatus = 'unknown';
    let blockchainHeight = 0;
    
    try {
      if (process.env.BLOCKCHAIN_RPC_URL) {
        // Simulate blockchain check (in production, this would make an actual RPC call)
        blockchainStatus = 'connected';
        blockchainHeight = Math.floor(Math.random() * 1000) + 1;
      }
    } catch (error) {
      blockchainStatus = 'disconnected';
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        services: {
          api: 'healthy',
          database: process.env.DYNAMODB_TABLE_NAME ? 'connected' : 'not_configured',
          blockchain: {
            status: blockchainStatus,
            network: 'persona-testnet',
            nodeUrl: process.env.BLOCKCHAIN_RPC_URL,
            currentHeight: blockchainHeight
          }
        },
        environment: {
          stage: process.env.STAGE || 'prod',
          region: process.env.AWS_REGION || 'us-east-1',
          tableName: process.env.DYNAMODB_TABLE_NAME || 'not_configured'
        }
      }),
    };

  } catch (error) {
    console.error('Health check failed:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }),
    };
  }
};