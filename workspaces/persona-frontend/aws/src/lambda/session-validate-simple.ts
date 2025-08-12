/**
 * Session Validate Lambda - Simple version without PersonaChain
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { SupabaseService } from '../lib/supabase-service';

const supabaseService = new SupabaseService();

interface SessionValidateRequest {
  session_token: string;
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

    const { session_token }: SessionValidateRequest = JSON.parse(event.body);

    // Validate input
    if (!session_token) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          success: false,
          message: 'Session token is required'
        }),
      };
    }

    console.log(`🔍 Validating session token`);

    // Get session from database
    const session = await supabaseService.getSession(session_token);
    
    if (!session) {
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          success: false,
          message: 'Invalid session token',
          valid: false
        }),
      };
    }

    // Check if session is expired
    const now = new Date();
    const expiresAt = new Date(session.expires_at);
    
    if (now > expiresAt || !session.is_active) {
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          success: false,
          message: 'Session expired or inactive',
          valid: false
        }),
      };
    }

    console.log(`✅ Session validated for DID: ${session.did}`);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        message: 'Session is valid',
        valid: true,
        session: {
          did: session.did,
          expires_at: session.expires_at,
          created_at: session.created_at
        }
      }),
    };

  } catch (error) {
    console.error('❌ Session validation error:', error);
    
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