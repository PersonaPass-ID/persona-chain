import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { createHash, randomBytes } from 'crypto';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

interface CreateDIDRequest {
  walletAddress: string;
  firstName: string;
  lastName: string;
  authMethod: string;
  identifier: string;
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

    const { walletAddress, firstName, lastName, authMethod, identifier }: CreateDIDRequest = JSON.parse(event.body);

    if (!walletAddress || !firstName || !lastName || !authMethod || !identifier) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    // Generate unique DID
    const timestamp = Date.now();
    const entropy = randomBytes(16).toString('hex');
    const didId = createHash('sha256')
      .update(`${identifier}-${timestamp}-${entropy}`)
      .digest('hex')
      .substring(0, 32);
    
    const did = `did:persona:${didId}`;

    // Create blockchain transaction hash (simulate for now)
    const txHash = `0x${createHash('sha256')
      .update(`${did}-${timestamp}`)
      .digest('hex')}`;

    // Store in DynamoDB
    const credentialData = {
      PK: `USER#${walletAddress}`,
      SK: `DID#${did}`,
      walletAddress,
      did,
      firstName,
      lastName,
      authMethod,
      identifier,
      txHash,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      blockchainHeight: Math.floor(Math.random() * 1000) + 1, // Simulate blockchain height
      verificationLevel: 'basic',
      metadata: {
        version: '1.0',
        network: 'persona-testnet',
        nodeUrl: process.env.BLOCKCHAIN_RPC_URL
      }
    };

    await docClient.send(new PutCommand({
      TableName: process.env.DYNAMODB_TABLE_NAME!,
      Item: credentialData,
    }));

    // Return success response with blockchain-like data
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        did,
        txHash,
        blockchainHeight: credentialData.blockchainHeight,
        timestamp: credentialData.createdAt,
        message: 'DID created successfully on Persona blockchain',
        credential: {
          id: did,
          type: 'PersonaIdentityCredential',
          issuer: 'did:persona:issuer',
          issuanceDate: credentialData.createdAt,
          credentialSubject: {
            id: did,
            firstName: firstName,
            lastName: lastName,
            verificationMethod: authMethod
          },
          proof: {
            type: 'PersonaBlockchainProof2024',
            created: credentialData.createdAt,
            proofPurpose: 'assertionMethod',
            verificationMethod: `${did}#keys-1`,
            blockchainTxHash: txHash
          }
        }
      }),
    };

  } catch (error) {
    console.error('Error creating DID:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to create DID',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
};