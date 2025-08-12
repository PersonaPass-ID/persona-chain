/**
 * Session Creation Lambda - Create authentication sessions for login flows
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import * as speakeasy from 'speakeasy';
import * as crypto from 'crypto';
import { SupabaseService } from '../lib/supabase-service';
import { PersonaChainService } from '../lib/personachain-service';

const supabaseService = new SupabaseService();
const personaChainService = new PersonaChainService();

interface SessionCreateRequest {
  did: string;
  method_type: 'totp' | 'oauth_microsoft' | 'oauth_google' | 'oauth_github';
  credential: string; // TOTP code or OAuth state
  signature?: string; // Optional DID signature for enhanced security
  remember_device?: boolean;
}

interface SessionCreateResponse {
  success: boolean;
  session_token: string;
  expires_at: number;
  method_id: string;
  permissions: string[];
  device_token?: string; // For remember device functionality
}

interface DeviceInfo {
  user_agent: string;
  ip_address: string;
  device_fingerprint: string;
  trusted: boolean;
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Parse request body
    if (!event.body) {
      return createErrorResponse(400, 'Request body is required');
    }

    const requestBody: SessionCreateRequest = JSON.parse(event.body);
    const { did, method_type, credential, signature, remember_device = false } = requestBody;

    // Validate required fields
    if (!did || !method_type || !credential) {
      return createErrorResponse(400, 'DID, method_type, and credential are required');
    }

    // Extract device information
    const clientIp = event.requestContext?.identity?.sourceIp || 'unknown';
    const userAgent = event.headers['User-Agent'] || 'unknown';
    const deviceInfo: DeviceInfo = {
      user_agent: userAgent,
      ip_address: clientIp,
      device_fingerprint: generateDeviceFingerprint(userAgent, clientIp),
      trusted: false
    };

    // Rate limiting check
    const isAllowed = await checkRateLimit(did, clientIp);
    if (!isAllowed) {
      return createErrorResponse(429, 'Too many login attempts. Please wait before trying again.');
    }

    // Validate DID exists and is active
    try {
      const didDoc = await personaChainService.getDID(did);
      if (!didDoc || didDoc.deactivated) {
        await recordFailedAttempt(did, clientIp, 'Invalid or deactivated DID');
        return createErrorResponse(404, 'DID not found or deactivated');
      }
    } catch (error) {
      console.error('DID validation failed:', error);
      await recordFailedAttempt(did, clientIp, 'DID validation error');
      return createErrorResponse(500, 'Failed to validate DID');
    }

    // Get authentication method
    let authMethod;
    try {
      authMethod = await supabaseService.getAuthMethodByDID(did, method_type);
      if (!authMethod || !authMethod.is_active) {
        await recordFailedAttempt(did, clientIp, 'Authentication method not found or inactive');
        return createErrorResponse(404, 'Authentication method not found or inactive');
      }
    } catch (error) {
      console.error('Error retrieving authentication method:', error);
      await recordFailedAttempt(did, clientIp, 'Database error');
      return createErrorResponse(500, 'Internal server error');
    }

    // Verify credential based on method type
    let credentialValid = false;
    try {
      switch (method_type) {
        case 'totp':
          credentialValid = await verifyTOTPCredential(authMethod, credential);
          break;
        case 'oauth_microsoft':
        case 'oauth_google':
        case 'oauth_github':
          credentialValid = await verifyOAuthCredential(authMethod, credential, method_type);
          break;
        default:
          throw new Error(`Unsupported method type: ${method_type}`);
      }
    } catch (error) {
      console.error('Credential verification failed:', error);
      await recordFailedAttempt(did, clientIp, 'Credential verification failed');
      return createErrorResponse(401, 'Invalid credentials');
    }

    if (!credentialValid) {
      await recordFailedAttempt(did, clientIp, 'Invalid credential');
      return createErrorResponse(401, 'Invalid credentials');
    }

    // TODO: Verify signature with DID document if provided
    if (signature) {
      console.log('TODO: Verify signature with DID:', did, 'Signature:', signature);
    }

    // Check if device is trusted (for remember device functionality)
    if (remember_device) {
      try {
        const trustedDevice = await supabaseService.getTrustedDevice(did, deviceInfo.device_fingerprint);
        if (trustedDevice) {
          deviceInfo.trusted = true;
        }
      } catch (error) {
        console.log('Device not previously trusted, continuing without trust');
      }
    }

    // Generate session token
    const sessionData = {
      did: did,
      method_id: authMethod.method_id,
      method_type: method_type,
      issued_at: Date.now(),
      expires_at: Date.now() + getSessionDuration(method_type, deviceInfo.trusted),
      nonce: crypto.randomBytes(16).toString('hex'),
      device_fingerprint: deviceInfo.device_fingerprint
    };

    const sessionToken = generateSessionToken(sessionData);

    // Store session in database for tracking and revocation capabilities
    await supabaseService.storeSession({
      session_id: crypto.randomUUID(),
      did: did,
      method_id: authMethod.method_id,
      session_token_hash: crypto.createHash('sha256').update(sessionToken).digest('hex'),
      device_info: JSON.stringify(deviceInfo),
      expires_at: new Date(sessionData.expires_at).toISOString(),
      created_at: new Date().toISOString()
    });

    // Store trusted device if requested and not already trusted
    let deviceToken: string | undefined;
    if (remember_device && !deviceInfo.trusted) {
      try {
        deviceToken = await storeTrustedDevice(did, deviceInfo);
      } catch (error) {
        console.error('Failed to store trusted device:', error);
        // Continue without device trust - not critical
      }
    }

    // Update auth method last used timestamp
    await supabaseService.updateAuthMethod(authMethod.id, {
      last_used_at: new Date().toISOString()
    });

    // Get user permissions
    const permissions = await getUserPermissions(did, method_type);

    // Record successful authentication
    await recordSuccessfulAttempt(did, clientIp, method_type);

    const response: SessionCreateResponse = {
      success: true,
      session_token: sessionToken,
      expires_at: sessionData.expires_at,
      method_id: authMethod.method_id,
      permissions: permissions,
      ...(deviceToken && { device_token: deviceToken })
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
    console.error('Session creation failed:', error);
    
    return createErrorResponse(500, 'Internal server error during session creation');
  }
};

// Helper function to verify TOTP credential
async function verifyTOTPCredential(authMethod: any, code: string): Promise<boolean> {
  // Validate TOTP code format
  if (!/^\d{6}$/.test(code)) {
    return false;
  }

  // Decrypt TOTP secret
  try {
    const secret = decryptTOTPSecret(authMethod.encrypted_secret, authMethod.did);
    
    // Verify TOTP code
    return speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: code,
      window: 2 // Allow ±60 seconds time drift
    });
  } catch (error) {
    console.error('TOTP verification error:', error);
    return false;
  }
}

// Helper function to verify OAuth credential (simplified for demo)
async function verifyOAuthCredential(authMethod: any, credential: string, provider: string): Promise<boolean> {
  // For OAuth, the credential could be a verification token or state parameter
  // In a real implementation, this would validate the OAuth flow completion
  
  try {
    // Decrypt stored OAuth tokens
    const tokenData = decryptOAuthTokens(authMethod.encrypted_tokens, authMethod.did);
    
    // Verify the credential matches expected OAuth state or verification token
    // This is a simplified check - in production, implement proper OAuth token validation
    const credentialHash = crypto.createHash('sha256').update(credential).digest('hex');
    const storedHash = crypto.createHash('sha256').update(tokenData.access_token).digest('hex').substring(0, 16);
    
    return credentialHash.substring(0, 16) === storedHash;
  } catch (error) {
    console.error('OAuth verification error:', error);
    return false;
  }
}

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

// Helper function to decrypt OAuth tokens
function decryptOAuthTokens(encryptedData: string, did: string): any {
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
  
  return JSON.parse(decrypted);
}

// Helper function to generate session token
function generateSessionToken(sessionData: any): string {
  const payload = Buffer.from(JSON.stringify(sessionData)).toString('base64');
  const signature = crypto
    .createHmac('sha256', process.env.SESSION_SECRET || 'default-secret')
    .update(payload)
    .digest('hex');

  return `${payload}.${signature}`;
}

// Helper function to get session duration based on method and device trust
function getSessionDuration(methodType: string, trustedDevice: boolean): number {
  const baseDuration = {
    'totp': 24 * 60 * 60 * 1000, // 24 hours for TOTP
    'oauth_microsoft': 12 * 60 * 60 * 1000, // 12 hours for OAuth
    'oauth_google': 12 * 60 * 60 * 1000,
    'oauth_github': 12 * 60 * 60 * 1000
  };

  const duration = baseDuration[methodType] || 8 * 60 * 60 * 1000; // Default 8 hours

  // Extend session for trusted devices
  return trustedDevice ? duration * 2 : duration;
}

// Helper function to generate device fingerprint
function generateDeviceFingerprint(userAgent: string, ipAddress: string): string {
  const data = `${userAgent}:${ipAddress}:${Date.now()}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}

// Helper function to store trusted device
async function storeTrustedDevice(did: string, deviceInfo: DeviceInfo): Promise<string> {
  const deviceToken = crypto.randomUUID();
  
  await supabaseService.storeTrustedDevice({
    device_token: deviceToken,
    did: did,
    device_fingerprint: deviceInfo.device_fingerprint,
    device_info: JSON.stringify(deviceInfo),
    trusted_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
  });

  return deviceToken;
}

// Helper function to get user permissions (similar to session-validate.ts)
async function getUserPermissions(did: string, methodType: string): Promise<string[]> {
  const basePermissions = [
    'read:profile',
    'update:profile',
    'create:credentials',
    'read:credentials'
  ];

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

  try {
    const userPermissions = await supabaseService.getUserPermissions(did);
    return [...basePermissions, ...(methodPermissions[methodType] || []), ...userPermissions];
  } catch (error) {
    console.error('Failed to get user permissions:', error);
    return [...basePermissions, ...(methodPermissions[methodType] || [])];
  }
}

// Rate limiting functions
async function checkRateLimit(did: string, ip: string): Promise<boolean> {
  try {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const attempts = await supabaseService.getAuthAttempts(did, ip, fifteenMinutesAgo);
    const failedAttempts = attempts.filter(attempt => !attempt.success);
    return failedAttempts.length < 10; // Max 10 failed login attempts per 15 min
  } catch (error) {
    console.error('Error checking rate limit:', error);
    return true; // Allow on error to not block legitimate users
  }
}

async function recordFailedAttempt(did: string, ip: string, reason: string): Promise<void> {
  try {
    await supabaseService.recordAuthAttempt({
      did,
      method_type: 'session_create',
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
      method_type: 'session_create',
      ip_address: ip,
      success: true,
      failure_reason: null,
      attempted_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error recording successful attempt:', error);
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