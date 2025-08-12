/**
 * OAuth Callback Lambda - Handle OAuth2/OIDC redirect callbacks and link external auth to DIDs
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import * as crypto from 'crypto';
import { SupabaseService } from '../lib/supabase-service';
import { PersonaChainService } from '../lib/personachain-service';

const supabaseService = new SupabaseService();
const personaChainService = new PersonaChainService();

interface OAuthCallbackRequest {
  code?: string;
  state?: string;
  error?: string;
  error_description?: string;
  provider: 'microsoft' | 'google' | 'github'; // Extensible for future providers
}

interface OAuthCallbackResponse {
  success: boolean;
  session_token?: string;
  method_id?: string;
  blockchain_tx?: string;
  redirect_url?: string;
}

interface StateData {
  did: string;
  nonce: string;
  timestamp: number;
  provider: string;
  redirect_url?: string;
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Parse query parameters
    const queryParams = event.queryStringParameters || {};
    const { code, state, error, error_description } = queryParams;
    
    // Determine provider from path or query params
    const pathParts = event.path.split('/');
    const provider = pathParts[pathParts.length - 1] || queryParams.provider || 'microsoft';
    
    if (!['microsoft', 'google', 'github'].includes(provider)) {
      return createErrorResponse(400, 'Unsupported OAuth provider');
    }

    // Handle OAuth error responses
    if (error) {
      console.error(`OAuth error from ${provider}:`, error, error_description);
      return createErrorResponse(400, `OAuth authentication failed: ${error_description || error}`);
    }

    // Validate required parameters
    if (!code || !state) {
      return createErrorResponse(400, 'Missing required OAuth parameters (code, state)');
    }

    // Decode and validate state parameter
    let stateData: StateData;
    try {
      const decodedState = Buffer.from(state, 'base64').toString('utf8');
      stateData = JSON.parse(decodedState);
      
      // Validate state structure
      if (!stateData.did || !stateData.nonce || !stateData.timestamp || !stateData.provider) {
        throw new Error('Invalid state structure');
      }
      
      // Check state expiry (5 minutes)
      if (Date.now() - stateData.timestamp > 5 * 60 * 1000) {
        throw new Error('State expired');
      }
      
      // Verify provider matches
      if (stateData.provider !== provider) {
        throw new Error('Provider mismatch');
      }
    } catch (error) {
      console.error('Invalid OAuth state:', error);
      return createErrorResponse(400, 'Invalid or expired OAuth state');
    }

    // Rate limiting check
    const clientIp = event.requestContext?.identity?.sourceIp || 'unknown';
    const isAllowed = await checkRateLimit(stateData.did, clientIp);
    if (!isAllowed) {
      return createErrorResponse(429, 'Too many OAuth attempts. Please wait before trying again.');
    }

    // Exchange authorization code for access token
    let tokenData;
    try {
      tokenData = await exchangeCodeForToken(provider, code, state);
    } catch (error) {
      console.error(`Token exchange failed for ${provider}:`, error);
      await recordFailedAttempt(stateData.did, clientIp, 'Token exchange failed');
      return createErrorResponse(500, 'Failed to exchange authorization code');
    }

    // Get user profile from OAuth provider
    let userProfile;
    try {
      userProfile = await getUserProfile(provider, tokenData.access_token);
    } catch (error) {
      console.error(`Profile fetch failed for ${provider}:`, error);
      await recordFailedAttempt(stateData.did, clientIp, 'Profile fetch failed');
      return createErrorResponse(500, 'Failed to retrieve user profile');
    }

    // Validate DID exists and is active
    try {
      const didDoc = await personaChainService.getDID(stateData.did);
      if (!didDoc || didDoc.deactivated) {
        await recordFailedAttempt(stateData.did, clientIp, 'Invalid or deactivated DID');
        return createErrorResponse(404, 'DID not found or deactivated');
      }
    } catch (error) {
      console.error('DID validation failed:', error);
      await recordFailedAttempt(stateData.did, clientIp, 'DID validation error');
      return createErrorResponse(500, 'Failed to validate DID');
    }

    // Check if OAuth method already exists for this DID
    try {
      const existingMethod = await supabaseService.getAuthMethodByDID(stateData.did, `oauth_${provider}`);
      if (existingMethod) {
        return createErrorResponse(409, `${provider} authentication already linked to this DID`);
      }
    } catch (error) {
      console.log(`No existing ${provider} method found, proceeding with linking`);
    }

    // Create method ID and attestation
    const methodId = crypto.randomUUID();
    const attestation = createOAuthAttestation(provider, userProfile, tokenData);
    
    // Hash the OAuth ID for on-chain storage (privacy-preserving)
    const publicKeyHash = crypto
      .createHash('sha256')
      .update(`${provider}:${userProfile.id}:${stateData.did}`)
      .digest('hex');

    // Store OAuth authentication method in Supabase
    const authMethodData = {
      id: methodId,
      did: stateData.did,
      method_type: `oauth_${provider}`,
      method_id: methodId,
      oauth_provider: provider,
      oauth_user_id: userProfile.id,
      oauth_email: userProfile.email,
      oauth_name: userProfile.name,
      encrypted_tokens: encryptOAuthTokens(tokenData, stateData.did),
      public_key_hash: publicKeyHash,
      attestation: attestation,
      is_active: true,
      is_primary: false, // OAuth methods are typically secondary
      created_at: new Date().toISOString()
    };

    await supabaseService.storeAuthMethod(authMethodData);

    // Link authentication method to blockchain
    let blockchainTxHash: string;
    try {
      const linkAuthMethodMsg = {
        did: stateData.did,
        method_id: methodId,
        method_type: `oauth_${provider}`,
        public_key_hash: publicKeyHash,
        attestation: attestation,
        is_primary: false,
        signer: stateData.did // In production, use actual controller address
      };

      // TODO: Send transaction to PersonaChain
      // For now, generate a mock transaction hash
      blockchainTxHash = generateMockTxHash(stateData.did, methodId);
      console.log('TODO: Send LinkAuthMethod transaction to PersonaChain:', linkAuthMethodMsg);
    } catch (error) {
      console.error('Error linking to blockchain:', error);
      await recordFailedAttempt(stateData.did, clientIp, 'Blockchain error');
      return createErrorResponse(500, 'Failed to link authentication method to blockchain');
    }

    // Update auth method with blockchain transaction hash
    try {
      await supabaseService.updateAuthMethod(methodId, {
        blockchain_tx_hash: blockchainTxHash,
        blockchain_block_height: 1, // TODO: Get actual block height
        last_used_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating auth method:', error);
      return createErrorResponse(500, 'Failed to update authentication method');
    }

    // Generate session token for immediate authentication
    const sessionToken = generateSessionToken(stateData.did, methodId, provider);

    // Record successful authentication
    await recordSuccessfulAttempt(stateData.did, clientIp, `OAuth ${provider}`);

    const response: OAuthCallbackResponse = {
      success: true,
      session_token: sessionToken,
      method_id: methodId,
      blockchain_tx: blockchainTxHash,
      redirect_url: stateData.redirect_url || process.env.DEFAULT_REDIRECT_URL
    };

    // For OAuth callbacks, we typically redirect to the frontend
    if (stateData.redirect_url) {
      const redirectUrl = new URL(stateData.redirect_url);
      redirectUrl.searchParams.append('success', 'true');
      redirectUrl.searchParams.append('session_token', sessionToken);
      redirectUrl.searchParams.append('method_id', methodId);

      return {
        statusCode: 302,
        headers: {
          'Location': redirectUrl.toString(),
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        },
        body: ''
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
      },
      body: JSON.stringify({
        success: true,
        data: response
      })
    };

  } catch (error) {
    console.error('OAuth callback failed:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
      },
      body: JSON.stringify({
        success: false,
        message: 'Internal server error during OAuth callback processing'
      })
    };
  }
};

// Helper function to exchange authorization code for access token
async function exchangeCodeForToken(provider: string, code: string, state: string): Promise<any> {
  const tokenEndpoints = {
    microsoft: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    google: 'https://oauth2.googleapis.com/token',
    github: 'https://github.com/login/oauth/access_token'
  };

  const clientCredentials = {
    microsoft: {
      client_id: process.env.MICROSOFT_CLIENT_ID,
      client_secret: process.env.MICROSOFT_CLIENT_SECRET,
      redirect_uri: process.env.MICROSOFT_REDIRECT_URI
    },
    google: {
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI
    },
    github: {
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      redirect_uri: process.env.GITHUB_REDIRECT_URI
    }
  };

  const credentials = clientCredentials[provider];
  const endpoint = tokenEndpoints[provider];

  const tokenPayload = new URLSearchParams({
    grant_type: 'authorization_code',
    code: code,
    client_id: credentials.client_id!,
    client_secret: credentials.client_secret!,
    redirect_uri: credentials.redirect_uri!
  });

  if (provider === 'microsoft') {
    tokenPayload.append('scope', 'openid profile email');
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    },
    body: tokenPayload
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Token exchange failed: ${response.status} ${errorData}`);
  }

  return response.json();
}

// Helper function to get user profile from OAuth provider
async function getUserProfile(provider: string, accessToken: string): Promise<any> {
  const profileEndpoints = {
    microsoft: 'https://graph.microsoft.com/v1.0/me',
    google: 'https://www.googleapis.com/oauth2/v2/userinfo',
    github: 'https://api.github.com/user'
  };

  const endpoint = profileEndpoints[provider];

  const response = await fetch(endpoint, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Profile fetch failed: ${response.status} ${errorData}`);
  }

  const profile = await response.json();
  
  // Normalize profile data across providers
  return {
    id: profile.id || profile.sub,
    email: profile.email || profile.mail,
    name: profile.name || profile.displayName || profile.login,
    verified: profile.verified_email !== false, // Most providers default to verified
    provider: provider
  };
}

// Helper function to create OAuth attestation
function createOAuthAttestation(provider: string, userProfile: any, tokenData: any): string {
  const attestationData = {
    provider: provider,
    user_id: userProfile.id,
    email: userProfile.email,
    email_verified: userProfile.verified,
    issued_at: Date.now(),
    expires_at: tokenData.expires_in ? Date.now() + (tokenData.expires_in * 1000) : null
  };

  // Create a verifiable attestation (simplified for demo)
  const attestation = {
    version: '1.0',
    type: 'oauth_attestation',
    data: attestationData,
    signature: crypto
      .createHmac('sha256', process.env.ATTESTATION_SECRET || 'default-secret')
      .update(JSON.stringify(attestationData))
      .digest('hex')
  };

  return JSON.stringify(attestation);
}

// Helper function to encrypt OAuth tokens
function encryptOAuthTokens(tokenData: any, did: string): string {
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
  
  let encrypted = cipher.update(JSON.stringify(tokenData), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  
  return JSON.stringify({
    salt: salt.toString('hex'),
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
    encrypted
  });
}

// Helper function to generate session token
function generateSessionToken(did: string, methodId: string, provider: string): string {
  const sessionData = {
    did: did,
    method_id: methodId,
    method_type: `oauth_${provider}`,
    issued_at: Date.now(),
    expires_at: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
    nonce: crypto.randomBytes(16).toString('hex')
  };

  const payload = Buffer.from(JSON.stringify(sessionData)).toString('base64');
  const signature = crypto
    .createHmac('sha256', process.env.SESSION_SECRET || 'default-secret')
    .update(payload)
    .digest('hex');

  return `${payload}.${signature}`;
}

// Rate limiting functions
async function checkRateLimit(did: string, ip: string): Promise<boolean> {
  try {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const attempts = await supabaseService.getAuthAttempts(did, ip, fifteenMinutesAgo);
    const failedAttempts = attempts.filter(attempt => !attempt.success);
    return failedAttempts.length < 3; // Max 3 failed OAuth attempts per 15 min (lower than TOTP)
  } catch (error) {
    console.error('Error checking rate limit:', error);
    return true; // Allow on error to not block legitimate users
  }
}

async function recordFailedAttempt(did: string, ip: string, reason: string): Promise<void> {
  try {
    await supabaseService.recordAuthAttempt({
      did,
      method_type: 'oauth',
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
      method_type: 'oauth',
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

// Helper function to create error responses
function createErrorResponse(statusCode: number, message: string): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
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
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
    },
    body: ''
  };
};