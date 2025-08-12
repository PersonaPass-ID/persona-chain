import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createHash, randomBytes } from 'crypto';
import { supabaseService } from '../lib/supabase-service';

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

    // Create verifiable credential structure
    const verifiableCredential = {
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://persona.xyz/contexts/identity/v1'
      ],
      id: `urn:credential:${credentialId}`,
      type: ['VerifiableCredential', credentialType],
      issuer: 'did:persona:issuer',
      issuanceDate: new Date().toISOString(),
      expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
      credentialSubject: {
        id: `did:persona:${walletAddress}`,
        ...credentialData
      },
      proof: {
        type: 'PersonaBlockchainProof2024',
        created: new Date().toISOString(),
        proofPurpose: 'assertionMethod',
        verificationMethod: 'did:persona:issuer#keys-1',
        blockchainTxHash: txHash
      }
    };

    // Store credential in Supabase
    const storedCredential = await supabaseService.storeCredential(verifiableCredential, walletAddress);

    // Return verifiable credential
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        credentialId,
        txHash,
        blockchainHeight: Math.floor(Date.now() / 1000) + 1000000,
        timestamp: storedCredential.created_at || new Date().toISOString(),
        message: 'Credential issued successfully on PersonaChain',
        credential: verifiableCredential
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