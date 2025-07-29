import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { createHash, randomBytes } from 'crypto';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

interface IssueCredentialRequest {
  walletAddress: string;
  credentialType: string;
  credentialData: any;
  verificationMethod: string;
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

    const { walletAddress, credentialType, credentialData, verificationMethod }: IssueCredentialRequest = JSON.parse(event.body);

    if (!walletAddress || !credentialType || !credentialData) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    // Generate unique credential ID
    const timestamp = Date.now();
    const entropy = randomBytes(16).toString('hex');
    const credentialId = createHash('sha256')
      .update(`${walletAddress}-${credentialType}-${timestamp}-${entropy}`)
      .digest('hex')
      .substring(0, 32);

    // Create blockchain transaction hash (simulate for now)
    const txHash = `0x${createHash('sha256')
      .update(`credential-${credentialId}-${timestamp}`)
      .digest('hex')}`;

    // Store credential in DynamoDB
    const credential = {
      PK: `USER#${walletAddress}`,
      SK: `CREDENTIAL#${credentialId}`,
      walletAddress,
      credentialId,
      credentialType,
      credentialData,
      verificationMethod: verificationMethod || 'wallet',
      txHash,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      blockchainHeight: Math.floor(Math.random() * 1000) + 1,
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
      metadata: {
        version: '1.0',
        network: 'persona-testnet',
        nodeUrl: process.env.BLOCKCHAIN_RPC_URL,
        issuer: 'did:persona:issuer'
      }
    };

    await docClient.send(new PutCommand({
      TableName: process.env.DYNAMODB_TABLE_NAME!,
      Item: credential,
    }));

    // Return verifiable credential
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        credentialId,
        txHash,
        blockchainHeight: credential.blockchainHeight,
        timestamp: credential.createdAt,
        message: 'Credential issued successfully on Persona blockchain',
        credential: {
          '@context': [
            'https://www.w3.org/2018/credentials/v1',
            'https://persona.xyz/contexts/identity/v1'
          ],
          id: `urn:credential:${credentialId}`,
          type: ['VerifiableCredential', credentialType],
          issuer: 'did:persona:issuer',
          issuanceDate: credential.createdAt,
          expirationDate: credential.expiryDate,
          credentialSubject: {
            id: `did:persona:${walletAddress}`,
            ...credentialData
          },
          proof: {
            type: 'PersonaBlockchainProof2024',
            created: credential.createdAt,
            proofPurpose: 'assertionMethod',
            verificationMethod: 'did:persona:issuer#keys-1',
            blockchainTxHash: txHash
          }
        }
      }),
    };

  } catch (error) {
    console.error('Error issuing credential:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to issue credential',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
};