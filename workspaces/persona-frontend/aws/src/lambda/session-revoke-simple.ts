/**
 * Session Revoke Lambda - Simple version without PersonaChain
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { SupabaseService } from '../lib/supabase-service';

const supabaseService = new SupabaseService();

interface SessionRevokeRequest {
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

    const { session_token }: SessionRevokeRequest = JSON.parse(event.body);

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

    console.log(`🗑️ Revoking session`);

    // Revoke session in database (set is_active to false)
    const revoked = await supabaseService.revokeSession(session_token);
    
    if (revoked) {
      console.log(`✅ Session revoked successfully`);
      
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          success: true,
          message: 'Session revoked successfully',
          revoked: true
        }),
      };
    } else {
      return {
        statusCode: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          success: false,
          message: 'Session not found',
          revoked: false
        }),
      };
    }

  } catch (error) {
    console.error('❌ Session revocation error:', error);
    
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