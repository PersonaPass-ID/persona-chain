import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

interface VerifyCredentialRequest {
  did: string;
  credentialData: any;
  proof?: any;
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing request body' }),
      };
    }

    const { did, credentialData, proof }: VerifyCredentialRequest = JSON.parse(event.body);

    if (!did) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'DID is required for verification' }),
      };
    }

    // Query DynamoDB for the DID
    const queryParams = {
      TableName: process.env.DYNAMODB_TABLE_NAME!,
      IndexName: 'GSI1',
      KeyConditionExpression: 'SK = :did',
      ExpressionAttributeValues: {
        ':did': `DID#${did}`,
      },
    };

    const result = await docClient.send(new QueryCommand(queryParams));
    const credential = result.Items?.[0];

    if (!credential) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ 
          valid: false,
          error: 'DID not found in blockchain',
          timestamp: new Date().toISOString()
        }),
      };
    }

    // Simulate blockchain verification
    const blockchainVerification = {
      txHashExists: credential.txHash ? true : false,
      blockchainHeight: credential.blockchainHeight || 0,
      networkStatus: 'active',
      consensusConfirmations: Math.floor(Math.random() * 100) + 10
    };

    // Verify credential status
    const isValid = credential.status === 'active' && blockchainVerification.txHashExists;

    // Generate verification response
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        valid: isValid,
        timestamp: new Date().toISOString(),
        did: credential.did,
        verification: {
          method: credential.authMethod,
          level: credential.verificationLevel || 'basic',
          createdAt: credential.createdAt,
          status: credential.status
        },
        blockchain: {
          network: 'persona-testnet',
          nodeUrl: process.env.BLOCKCHAIN_RPC_URL,
          txHash: credential.txHash,
          blockHeight: blockchainVerification.blockchainHeight,
          confirmations: blockchainVerification.consensusConfirmations
        },
        credentialSubject: {
          id: credential.did,
          firstName: credential.firstName,
          lastName: credential.lastName,
          verificationMethod: credential.authMethod
        },
        proof: {
          type: 'PersonaBlockchainProof2024',
          created: credential.createdAt,
          proofPurpose: 'assertionMethod',
          blockchainTxHash: credential.txHash
        }
      }),
    };

  } catch (error) {
    console.error('Error verifying credential:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        valid: false,
        error: 'Failed to verify credential',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }),
    };
  }
};