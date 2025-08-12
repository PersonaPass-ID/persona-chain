/**
 * TOTP Verify Lambda - Simple version without PersonaChain
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import * as speakeasy from 'speakeasy';
import { SupabaseService } from '../lib/supabase-service';

const supabaseService = new SupabaseService();

interface TOTPVerifyRequest {
  did: string;
  token: string; // 6-digit TOTP code from user
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    // Parse request body
    if (!event.body) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          success: false,
          message: 'Request body is required'
        }),
      };
    }

    const { did, token }: TOTPVerifyRequest = JSON.parse(event.body);

    // Validate input
    if (!did || !token) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          success: false,
          message: 'DID and TOTP token are required'
        }),
      };
    }

    console.log(`🔐 Verifying TOTP for DID: ${did}`);

    // Get stored TOTP secret from database
    const authMethod = await supabaseService.getAuthMethod(did, 'totp');
    
    if (!authMethod || !authMethod.encrypted_secret) {
      return {
        statusCode: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          success: false,
          message: 'TOTP not set up for this DID'
        }),
      };
    }

    // Decrypt the secret
    const decryptedSecret = supabaseService.decrypt(authMethod.encrypted_secret);

    // Verify the TOTP token
    const verified = speakeasy.totp.verify({
      secret: decryptedSecret,
      encoding: 'base32',
      token: token,
      window: 2 // Allow for time drift
    });

    if (verified) {
      console.log(`✅ TOTP verified for DID: ${did}`);
      
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          success: true,
          message: 'TOTP token verified successfully',
          verified: true
        }),
      };
    } else {
      console.log(`❌ Invalid TOTP token for DID: ${did}`);
      
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          success: false,
          message: 'Invalid TOTP token',
          verified: false
        }),
      };
    }

  } catch (error) {
    console.error('❌ TOTP verification error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: false,
        message: 'Internal server error'
      }),
    };
  }
};