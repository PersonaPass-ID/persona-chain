/**
 * TOTP Verify Setup Lambda - Verify TOTP code and activate authentication method
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import * as speakeasy from 'speakeasy';
import * as crypto from 'crypto';
import { SupabaseService } from '../lib/supabase-service';
import { PersonaChainService } from '../lib/personachain-service';

const supabaseService = new SupabaseService();
const personaChainService = new PersonaChainService();

interface TOTPVerifySetupRequest {
  did: string;
  code: string; // 6-digit TOTP code
  signature: string;
}

interface TOTPVerifySetupResponse {
  success: boolean;
  method_id: string;
  blockchain_tx: string; // Transaction hash for on-chain linkage
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Parse request body
    if (!event.body) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
          'Access-Control-Allow-Methods': 'POST,OPTIONS'
        },
        body: JSON.stringify({
          success: false,
          message: 'Request body is required'
        })
      };
    }

    const requestBody: TOTPVerifySetupRequest = JSON.parse(event.body);
    const { did, code, signature } = requestBody;

    // Validate required fields
    if (!did || !code || !signature) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
          'Access-Control-Allow-Methods': 'POST,OPTIONS'
        },
        body: JSON.stringify({
          success: false,
          message: 'DID, code, and signature are required'
        })
      };
    }

    // Validate TOTP code format
    if (!/^\d{6}$/.test(code)) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
          'Access-Control-Allow-Methods': 'POST,OPTIONS'
        },
        body: JSON.stringify({
          success: false,
          message: 'Invalid TOTP code format'
        })
      };
    }

    // Rate limiting check
    const clientIp = event.requestContext?.identity?.sourceIp || 'unknown';
    const isAllowed = await checkRateLimit(did, clientIp);
    if (!isAllowed) {
      return {
        statusCode: 429,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
          'Access-Control-Allow-Methods': 'POST,OPTIONS'
        },
        body: JSON.stringify({
          success: false,
          message: 'Too many attempts. Please wait before trying again.'
        })
      };
    }

    // Get pending TOTP method
    let authMethod;
    try {
      authMethod = await supabaseService.getAuthMethodByDID(did, 'totp');
      if (!authMethod) {
        await recordFailedAttempt(did, clientIp, 'TOTP method not found');
        return {
          statusCode: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
            'Access-Control-Allow-Methods': 'POST,OPTIONS'
          },
          body: JSON.stringify({
            success: false,
            message: 'TOTP method not found. Please set up TOTP first.'
          })
        };
      }

      // Check if already verified
      if (authMethod.is_active) {
        return {
          statusCode: 409,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
            'Access-Control-Allow-Methods': 'POST,OPTIONS'
          },
          body: JSON.stringify({
            success: false,
            message: 'TOTP method already verified and active'
          })
        };
      }
    } catch (error) {
      console.error('Error retrieving TOTP method:', error);
      await recordFailedAttempt(did, clientIp, 'Database error');
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
          'Access-Control-Allow-Methods': 'POST,OPTIONS'
        },
        body: JSON.stringify({
          success: false,
          message: 'Internal server error'
        })
      };
    }

    // Decrypt TOTP secret
    let secret: string;
    try {
      secret = decryptTOTPSecret(authMethod.encrypted_secret, did);
    } catch (error) {
      console.error('Error decrypting TOTP secret:', error);
      await recordFailedAttempt(did, clientIp, 'Decryption error');
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
          'Access-Control-Allow-Methods': 'POST,OPTIONS'
        },
        body: JSON.stringify({
          success: false,
          message: 'Failed to decrypt TOTP secret'
        })
      };
    }

    // Verify TOTP code
    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: code,
      window: 2 // Allow ±60 seconds time drift
    });

    if (!verified) {
      await recordFailedAttempt(did, clientIp, 'Invalid TOTP code');
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
          'Access-Control-Allow-Methods': 'POST,OPTIONS'
        },
        body: JSON.stringify({
          success: false,
          message: 'Invalid TOTP code'
        })
      };
    }

    // TODO: Verify signature with DID document
    console.log('TODO: Verify signature with DID:', did, 'Signature:', signature);

    // Link authentication method to blockchain
    let blockchainTxHash: string;
    try {
      // Create message for PersonaChain
      const linkAuthMethodMsg = {
        did,
        method_id: authMethod.method_id,
        method_type: 'totp',
        public_key_hash: authMethod.public_key_hash,
        attestation: '', // Empty for TOTP
        is_primary: true, // First auth method is primary
        signer: did // In production, use actual controller address
      };

      // TODO: Send transaction to PersonaChain
      // For now, generate a mock transaction hash
      blockchainTxHash = generateMockTxHash(did, authMethod.method_id);
      console.log('TODO: Send LinkAuthMethod transaction to PersonaChain:', linkAuthMethodMsg);
    } catch (error) {
      console.error('Error linking to blockchain:', error);
      await recordFailedAttempt(did, clientIp, 'Blockchain error');
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
          'Access-Control-Allow-Methods': 'POST,OPTIONS'
        },
        body: JSON.stringify({
          success: false,
          message: 'Failed to link authentication method to blockchain'
        })
      };
    }

    // Update auth method as verified and active
    try {
      await supabaseService.updateAuthMethod(authMethod.id, {
        is_active: true,
        is_primary: true,
        blockchain_tx_hash: blockchainTxHash,
        blockchain_block_height: 1, // TODO: Get actual block height
        last_used_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating auth method:', error);
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
          'Access-Control-Allow-Methods': 'POST,OPTIONS'
        },
        body: JSON.stringify({
          success: false,
          message: 'Failed to update authentication method'
        })
      };
    }

    // Record successful authentication
    await recordSuccessfulAttempt(did, clientIp, 'TOTP verification');

    const response: TOTPVerifySetupResponse = {
      success: true,
      method_id: authMethod.method_id,
      blockchain_tx: blockchainTxHash
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
        'Access-Control-Allow-Methods': 'POST,OPTIONS'
      },
      body: JSON.stringify(response)
    };

  } catch (error) {
    console.error('TOTP verification failed:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
        'Access-Control-Allow-Methods': 'POST,OPTIONS'
      },
      body: JSON.stringify({
        success: false,
        message: 'Internal server error during TOTP verification'
      })
    };
  }
};

// Helper function to decrypt TOTP secret
function decryptTOTPSecret(encryptedData: string, did: string): string {
  const data = JSON.parse(encryptedData);
  const salt = Buffer.from(data.salt, 'hex');
  const iv = Buffer.from(data.iv, 'hex');
  const authTag = Buffer.from(data.authTag, 'hex');
  
  const key = crypto.pbkdf2Sync(
    process.env.MASTER_KEY + did,
    salt,
    100000,
    32,
    'sha256'
  );
  
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(data.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

// Rate limiting functions
async function checkRateLimit(did: string, ip: string): Promise<boolean> {
  try {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const attempts = await supabaseService.getAuthAttempts(did, ip, fifteenMinutesAgo);
    const failedAttempts = attempts.filter(attempt => !attempt.success);
    return failedAttempts.length < 5; // Max 5 failed attempts per 15 min
  } catch (error) {
    console.error('Error checking rate limit:', error);
    return true; // Allow on error to not block legitimate users
  }
}

async function recordFailedAttempt(did: string, ip: string, reason: string): Promise<void> {
  try {
    await supabaseService.recordAuthAttempt({
      did,
      method_type: 'totp',
      ip_address: ip,
      success: false,
      failure_reason: reason,
      attempted_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error recording failed attempt:', error);
  }
}

async function recordSuccessfulAttempt(did: string, ip: string, method: string): Promise<void> {
  try {
    await supabaseService.recordAuthAttempt({
      did,
      method_type: 'totp',
      ip_address: ip,
      success: true,
      failure_reason: null,
      attempted_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error recording successful attempt:', error);
  }
}

// Generate mock transaction hash for testing
function generateMockTxHash(did: string, methodId: string): string {
  const data = `${did}:${methodId}:${Date.now()}`;
  return '0x' + crypto.createHash('sha256').update(data).digest('hex');
}

// Handle OPTIONS requests for CORS
export const optionsHandler = async (): Promise<APIGatewayProxyResult> => {
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
      'Access-Control-Allow-Methods': 'POST,OPTIONS'
    },
    body: ''
  };
};