/**
 * PersonaPass Merchant SDK
 * 
 * Simple, privacy-preserving age verification for e-commerce
 * 
 * @example
 * ```javascript
 * import { PersonaPass } from '@personapass/verify';
 * 
 * const personapass = new PersonaPass({
 *   apiKey: 'pk_live_...',
 *   environment: 'production'
 * });
 * 
 * // Verify age with one line of code
 * const result = await personapass.verifyAge({
 *   minimumAge: 21,
 *   redirectUrl: 'https://yourstore.com/verified'
 * });
 * ```
 */

export interface PersonaPassConfig {
  apiKey: string;
  environment?: 'production' | 'sandbox';
  baseUrl?: string;
}

export interface VerifyAgeOptions {
  minimumAge: number;
  redirectUrl?: string;
  metadata?: Record<string, any>;
}

export interface VerificationResult {
  verified: boolean;
  sessionId: string;
  verificationId?: string;
  timestamp: string;
}

export interface VerificationSession {
  id: string;
  status: 'pending' | 'completed' | 'failed';
  minimumAge: number;
  createdAt: string;
  expiresAt: string;
  verificationUrl: string;
}

export class PersonaPass {
  private config: PersonaPassConfig;
  private baseUrl: string;

  constructor(config: PersonaPassConfig) {
    this.config = config;
    this.baseUrl = config.baseUrl || 
      (config.environment === 'sandbox' 
        ? 'https://sandbox.personapass.xyz/api/v1' 
        : 'https://api.personapass.xyz/v1');
  }

  /**
   * Create an age verification session
   */
  async createVerificationSession(options: VerifyAgeOptions): Promise<VerificationSession> {
    const response = await this.request('/verification/sessions', {
      method: 'POST',
      body: {
        minimum_age: options.minimumAge,
        redirect_url: options.redirectUrl,
        metadata: options.metadata
      }
    });

    return {
      id: response.id,
      status: response.status,
      minimumAge: response.minimum_age,
      createdAt: response.created_at,
      expiresAt: response.expires_at,
      verificationUrl: response.verification_url
    };
  }

  /**
   * Check verification status
   */
  async checkVerification(sessionId: string): Promise<VerificationResult> {
    const response = await this.request(`/verification/sessions/${sessionId}`, {
      method: 'GET'
    });

    return {
      verified: response.verified,
      sessionId: response.session_id,
      verificationId: response.verification_id,
      timestamp: response.timestamp
    };
  }

  /**
   * Simple one-step age verification
   */
  async verifyAge(options: VerifyAgeOptions): Promise<VerificationSession> {
    return this.createVerificationSession(options);
  }

  /**
   * Webhook signature verification
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    // TODO: Implement HMAC signature verification
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', this.config.apiKey)
      .update(payload)
      .digest('hex');
    
    return signature === expectedSignature;
  }

  /**
   * Make authenticated API request
   */
  private async request(path: string, options: any = {}): Promise<any> {
    const url = `${this.baseUrl}${path}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        'X-PersonaPass-Version': '2024-01-01',
        ...options.headers
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new PersonaPassError(error.message || response.statusText, response.status);
    }

    return response.json();
  }
}

export class PersonaPassError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'PersonaPassError';
  }
}

// Export convenience functions
export function createClient(config: PersonaPassConfig): PersonaPass {
  return new PersonaPass(config);
}

// React hook for easy integration
export function usePersonaPass(config: PersonaPassConfig) {
  const client = new PersonaPass(config);
  
  return {
    verifyAge: (options: VerifyAgeOptions) => client.verifyAge(options),
    checkVerification: (sessionId: string) => client.checkVerification(sessionId),
    client
  };
}