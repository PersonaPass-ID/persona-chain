/**
 * TOTP Setup Lambda - Generate TOTP secrets and QR codes for user authentication
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import * as crypto from 'crypto';
import { SupabaseService } from '../lib/supabase-service';

const supabaseService = new SupabaseService();

interface TOTPSetupRequest {
  did: string;
  signature: string; // Signed with DID key to prove ownership
}

interface TOTPSetupResponse {
  secret: string; // Base32 encoded secret
  qr_code: string; // Data URI for QR code
  backup_codes: string[]; // One-time recovery codes
  verification_required: boolean;
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

    const requestBody: TOTPSetupRequest = JSON.parse(event.body);
    const { did, signature } = requestBody;

    // Validate required fields
    if (!did || !signature) {
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
          message: 'DID and signature are required'
        })
      };
    }

    // Validate DID format
    if (!did.startsWith('did:persona:')) {
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
          message: 'Invalid DID format'
        })
      };
    }

    // TODO: Verify signature with DID document (requires PersonaChain RPC call)
    // For now, we'll skip signature verification in development
    console.log('TODO: Verify signature with DID:', did, 'Signature:', signature);

    // Check if TOTP is already set up for this DID
    try {
      const existingMethod = await supabaseService.getAuthMethodByDID(did, 'totp');
      if (existingMethod) {
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
            message: 'TOTP already set up for this DID'
          })
        };
      }
    } catch (error) {
      console.log('No existing TOTP method found, proceeding with setup');
    }

    // Generate TOTP secret
    const secret = speakeasy.generateSecret({
      name: `PersonaPass (${did.slice(-8)})`,
      issuer: 'PersonaPass',
      length: 32
    });

    if (!secret.base32) {
      throw new Error('Failed to generate TOTP secret');
    }

    // Generate QR code
    const otpauthURL = speakeasy.otpauthURL({
      secret: secret.base32,
      label: `PersonaPass:${did.slice(-8)}`,
      issuer: 'PersonaPass',
      encoding: 'base32'
    });

    const qrCodeDataURL = await QRCode.toDataURL(otpauthURL);

    // Generate backup/recovery codes
    const backupCodes = generateBackupCodes(8);

    // Create method ID
    const methodId = crypto.randomUUID();

    // Hash the secret for on-chain storage
    const publicKeyHash = crypto
      .createHash('sha256')
      .update(secret.base32)
      .digest('hex');

    // Encrypt and store TOTP secret in Supabase
    const encryptedSecret = encryptTOTPSecret(secret.base32, did);
    
    const authMethodData = {
      id: methodId,
      did,
      method_type: 'totp',
      method_id: methodId,
      encrypted_secret: encryptedSecret,
      public_key_hash: publicKeyHash,
      is_active: false, // Will be activated after verification
      is_primary: false, // Will be set after verification
      created_at: new Date().toISOString()
    };

    await supabaseService.storeAuthMethod(authMethodData);

    // Store backup codes
    for (const code of backupCodes) {
      const codeHash = crypto
        .createHash('sha256')
        .update(code + did) // Add DID as salt
        .digest('hex');
      
      await supabaseService.storeRecoveryCode(did, codeHash);
    }

    const response: TOTPSetupResponse = {
      secret: secret.base32,
      qr_code: qrCodeDataURL,
      backup_codes: backupCodes,
      verification_required: true
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
        'Access-Control-Allow-Methods': 'POST,OPTIONS'
      },
      body: JSON.stringify({
        success: true,
        data: response
      })
    };

  } catch (error) {
    console.error('TOTP setup failed:', error);
    
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
        message: 'Internal server error during TOTP setup'
      })
    };
  }
};

// Helper function to encrypt TOTP secret
function encryptTOTPSecret(secret: string, did: string): string {
  const salt = crypto.randomBytes(32);
  const key = crypto.pbkdf2Sync(
    process.env.MASTER_KEY + did, 
    salt, 
    100000, 
    32, 
    'sha256'
  );
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  let encrypted = cipher.update(secret, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  
  return JSON.stringify({
    salt: salt.toString('hex'),
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
    encrypted
  });
}

// Helper function to generate backup codes
function generateBackupCodes(count: number): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric codes
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push(code);
  }
  return codes;
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