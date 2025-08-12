/**
 * Session Create Lambda - Simple version without PersonaChain
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import * as crypto from 'crypto';
import { SupabaseService } from '../lib/supabase-service';

const supabaseService = new SupabaseService();

interface SessionCreateRequest {
  did: string;
  device_fingerprint?: string;
  totp_verified?: boolean;
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

    const { did, device_fingerprint, totp_verified }: SessionCreateRequest = JSON.parse(event.body);

    // Validate input
    if (!did) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          success: false,
          message: 'DID is required'
        }),
      };
    }

    console.log(`📝 Creating session for DID: ${did}`);

    // Generate secure session token
    const sessionToken = crypto.randomBytes(32).toString('hex');
    
    // Set expiration (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Create session in database
    const session = await supabaseService.createSession({
      did: did,
      session_token: sessionToken,
      device_fingerprint: device_fingerprint || null,
      expires_at: expiresAt.toISOString(),
      is_active: true
    });

    console.log(`✅ Session created for DID: ${did}`);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        message: 'Session created successfully',
        session: {
          token: sessionToken,
          expires_at: expiresAt.toISOString(),
          did: did
        }
      }),
    };

  } catch (error) {
    console.error('❌ Session creation error:', error);
    
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