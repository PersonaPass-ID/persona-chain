/**
 * Session Validation Lambda - Validate and refresh authentication sessions
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import * as crypto from 'crypto';
import { SupabaseService } from '../lib/supabase-service';
import { PersonaChainService } from '../lib/personachain-service';

const supabaseService = new SupabaseService();
const personaChainService = new PersonaChainService();

interface SessionValidateRequest {
  session_token: string;
  refresh?: boolean;
}

interface SessionValidateResponse {
  valid: boolean;
  did?: string;
  method_id?: string;
  method_type?: string;
  expires_at?: number;
  new_token?: string; // If refresh was requested
  permissions?: string[];
}

interface SessionData {
  did: string;
  method_id: string;
  method_type: string;
  issued_at: number;
  expires_at: number;
  nonce: string;
  permissions?: string[];
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Parse request body
    if (!event.body) {
      return createErrorResponse(400, 'Request body is required');
    }

    const requestBody: SessionValidateRequest = JSON.parse(event.body);
    const { session_token, refresh = false } = requestBody;

    // Validate required fields
    if (!session_token) {
      return createErrorResponse(400, 'Session token is required');
    }

    // Parse and verify session token
    let sessionData: SessionData;
    try {
      sessionData = parseSessionToken(session_token);
    } catch (error) {
      console.error('Invalid session token:', error);
      return createErrorResponse(401, 'Invalid session token');
    }

    // Check if session is expired
    if (Date.now() > sessionData.expires_at) {
      return createErrorResponse(401, 'Session expired');
    }

    // Validate DID still exists and is active
    try {
      const didDoc = await personaChainService.getDID(sessionData.did);
      if (!didDoc || didDoc.deactivated) {
        return createErrorResponse(401, 'DID no longer valid');
      }
    } catch (error) {
      console.error('DID validation failed:', error);
      return createErrorResponse(401, 'Failed to validate DID');
    }

    // Validate authentication method still exists and is active
    try {
      const authMethod = await supabaseService.getAuthMethodById(sessionData.method_id);
      if (!authMethod || !authMethod.is_active || authMethod.did !== sessionData.did) {
        return createErrorResponse(401, 'Authentication method no longer valid');
      }

      // Update last used timestamp
      await supabaseService.updateAuthMethod(sessionData.method_id, {
        last_used_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Auth method validation failed:', error);
      return createErrorResponse(401, 'Failed to validate authentication method');
    }

    // Generate new token if refresh is requested
    let newToken: string | undefined;
    if (refresh) {
      try {
        newToken = generateRefreshToken(sessionData);
      } catch (error) {
        console.error('Token refresh failed:', error);
        return createErrorResponse(500, 'Failed to refresh token');
      }
    }

    // Get user permissions based on DID and auth method
    const permissions = await getUserPermissions(sessionData.did, sessionData.method_type);

    const response: SessionValidateResponse = {
      valid: true,
      did: sessionData.did,
      method_id: sessionData.method_id,
      method_type: sessionData.method_type,
      expires_at: sessionData.expires_at,
      permissions: permissions,
      ...(newToken && { new_token: newToken })
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
    console.error('Session validation failed:', error);
    
    return createErrorResponse(500, 'Internal server error during session validation');
  }
};

// Helper function to parse and verify session token
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

// Helper function to generate a refreshed token
function generateRefreshToken(originalSession: SessionData): string {
  const newSessionData: SessionData = {
    ...originalSession,
    issued_at: Date.now(),
    expires_at: Date.now() + (24 * 60 * 60 * 1000), // Extend for 24 hours
    nonce: crypto.randomBytes(16).toString('hex') // New nonce for security
  };

  const payload = Buffer.from(JSON.stringify(newSessionData)).toString('base64');
  const signature = crypto
    .createHmac('sha256', process.env.SESSION_SECRET || 'default-secret')
    .update(payload)
    .digest('hex');

  return `${payload}.${signature}`;
}

// Helper function to get user permissions
async function getUserPermissions(did: string, methodType: string): Promise<string[]> {
  // Base permissions for all authenticated users
  const basePermissions = [
    'read:profile',
    'update:profile',
    'create:credentials',
    'read:credentials'
  ];

  // Additional permissions based on authentication method
  const methodPermissions: { [key: string]: string[] } = {
    'totp': [
      'high_security:transactions',
      'admin:settings'
    ],
    'oauth_microsoft': [
      'enterprise:integration',
      'team:collaboration'
    ],
    'oauth_google': [
      'cloud:integration',
      'workspace:access'
    ],
    'oauth_github': [
      'developer:tools',
      'code:integration'
    ]
  };

  // Try to get user-specific permissions from database
  try {
    const userPermissions = await supabaseService.getUserPermissions(did);
    return [...basePermissions, ...(methodPermissions[methodType] || []), ...userPermissions];
  } catch (error) {
    console.error('Failed to get user permissions:', error);
    return [...basePermissions, ...(methodPermissions[methodType] || [])];
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