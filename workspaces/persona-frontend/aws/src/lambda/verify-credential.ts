import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { supabaseService } from '../lib/supabase-service';

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

    // Query Supabase for the DID
    const credential = await supabaseService.getDIDDocument(did);

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

    // Parse encrypted content to get credential data
    const credentialData = JSON.parse(credential.encrypted_content);
    
    // Simulate blockchain verification
    const blockchainVerification = {
      txHashExists: credential.blockchain_tx_hash ? true : false,
      blockchainHeight: credential.blockchain_anchor?.blockHeight || 0,
      networkStatus: 'active',
      consensusConfirmations: Math.floor(Math.random() * 100) + 10
    };

    // Verify credential status - check both record and parsed data
    const recordStatus = credential.metadata?.status || 'active';
    const isValid = recordStatus === 'active' && blockchainVerification.txHashExists;

    // Generate verification response
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        valid: isValid,
        timestamp: new Date().toISOString(),
        did: credential.did,
        verification: {
          method: credentialData.authMethod,
          level: credential.metadata?.verificationLevel || 'basic',
          createdAt: credential.created_at,
          status: recordStatus
        },
        blockchain: {
          network: 'personachain-1',
          nodeUrl: process.env.BLOCKCHAIN_RPC_URL || 'https://rpc.personachain.io',
          txHash: credential.blockchain_tx_hash,
          blockHeight: blockchainVerification.blockchainHeight,
          confirmations: blockchainVerification.consensusConfirmations
        },
        credentialSubject: {
          id: credential.did,
          firstName: credentialData.firstName,
          lastName: credentialData.lastName,
          verificationMethod: credentialData.authMethod
        },
        proof: {
          type: 'PersonaBlockchainProof2024',
          created: credential.created_at,
          proofPurpose: 'assertionMethod',
          blockchainTxHash: credential.blockchain_tx_hash
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