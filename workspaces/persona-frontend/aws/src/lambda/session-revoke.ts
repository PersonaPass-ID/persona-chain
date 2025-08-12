/**
 * Session Revocation Lambda - Revoke authentication sessions (logout functionality)
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import * as crypto from 'crypto';
import { SupabaseService } from '../lib/supabase-service';

const supabaseService = new SupabaseService();

interface SessionRevokeRequest {
  session_token?: string;
  revoke_all?: boolean; // Revoke all sessions for the DID
  device_token?: string; // Revoke trusted device
}

interface SessionRevokeResponse {
  success: boolean;
  revoked_sessions: number;
  message: string;
}

interface SessionData {
  did: string;
  method_id: string;
  method_type: string;
  issued_at: number;
  expires_at: number;
  nonce: string;
  device_fingerprint?: string;
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Parse request body
    if (!event.body) {
      return createErrorResponse(400, 'Request body is required');
    }

    const requestBody: SessionRevokeRequest = JSON.parse(event.body);
    const { session_token, revoke_all = false, device_token } = requestBody;

    // Validate that at least one revocation method is specified
    if (!session_token && !revoke_all && !device_token) {
      return createErrorResponse(400, 'Must specify session_token, revoke_all, or device_token');
    }

    let did: string | undefined;
    let revokedCount = 0;

    // Parse session token if provided to get DID
    if (session_token) {
      try {
        const sessionData = parseSessionToken(session_token);
        did = sessionData.did;
        
        // Revoke specific session
        const sessionHash = crypto.createHash('sha256').update(session_token).digest('hex');
        const revoked = await supabaseService.revokeSession(sessionHash);
        if (revoked) {
          revokedCount++;
        }
      } catch (error) {
        console.error('Failed to parse session token:', error);
        return createErrorResponse(400, 'Invalid session token');
      }
    }

    // Revoke all sessions for DID if requested
    if (revoke_all && did) {
      try {
        const allSessionsRevoked = await supabaseService.revokeAllSessions(did);
        revokedCount += allSessionsRevoked;
      } catch (error) {
        console.error('Failed to revoke all sessions:', error);
        return createErrorResponse(500, 'Failed to revoke all sessions');
      }
    }

    // Revoke trusted device if requested
    if (device_token) {
      try {
        const deviceRevoked = await supabaseService.revokeTrustedDevice(device_token);
        if (deviceRevoked && !did) {
          // If we only had device_token, get DID from device record
          const deviceInfo = await supabaseService.getTrustedDeviceByToken(device_token);
          if (deviceInfo) {
            did = deviceInfo.did;
          }
        }
      } catch (error) {
        console.error('Failed to revoke trusted device:', error);
        // Continue - device revocation failure shouldn't fail the whole operation
      }
    }

    // Log the revocation event
    if (did) {
      const clientIp = event.requestContext?.identity?.sourceIp || 'unknown';
      await recordRevocationEvent(did, clientIp, {
        session_token: !!session_token,
        revoke_all: revoke_all,
        device_token: !!device_token,
        revoked_count: revokedCount
      });
    }

    let message = 'No sessions were revoked';
    if (revokedCount > 0) {
      message = `Successfully revoked ${revokedCount} session${revokedCount > 1 ? 's' : ''}`;
    }
    if (device_token) {
      message += device_token ? '. Trusted device revoked' : '. Failed to revoke trusted device';
    }

    const response: SessionRevokeResponse = {
      success: true,
      revoked_sessions: revokedCount,
      message: message
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
    console.error('Session revocation failed:', error);
    
    return createErrorResponse(500, 'Internal server error during session revocation');
  }
};

// Helper function to parse session token
function parseSessionToken(token: string): SessionData {
  const parts = token.split('.');
  if (parts.length !== 2) {
    throw new Error('Invalid token format');
  }

  const [payload, signature] = parts;

  // Verify signature
  const expectedSignature = crypto
    .createHmac('sha256', process.env.SESSION_SECRET || 'default-secret')
    .update(payload)
    .digest('hex');

  if (signature !== expectedSignature) {
    throw new Error('Invalid token signature');
  }

  // Parse payload
  try {
    const sessionData = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
    
    // Validate required fields
    if (!sessionData.did || !sessionData.method_id || !sessionData.method_type || 
        !sessionData.issued_at || !sessionData.expires_at || !sessionData.nonce) {
      throw new Error('Invalid session data structure');
    }

    return sessionData;
  } catch (error) {
    throw new Error('Failed to parse session data');
  }
}

// Helper function to record revocation events
async function recordRevocationEvent(did: string, ip: string, details: any): Promise<void> {
  try {
    await supabaseService.recordAuthAttempt({
      did,
      method_type: 'session_revoke',
      ip_address: ip,
      success: true,
      failure_reason: null,
      attempted_at: new Date().toISOString(),
      metadata: JSON.stringify(details)
    });
  } catch (error) {
    console.error('Error recording revocation event:', error);
    // Non-critical error, continue
  }
}

// Helper function to create error responses
function createErrorResponse(statusCode: number, message: string): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
      'Access-Control-Allow-Methods': 'POST,OPTIONS'
    },
    body: JSON.stringify({
      success: false,
      message
    })
  };
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