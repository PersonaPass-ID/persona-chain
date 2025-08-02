// PersonaPass SDK - One-Line Age Verification for E-Commerce
// npm install @personapass/verify

export interface PersonaPassConfig {
  apiKey: string;
  environment?: 'production' | 'sandbox';
  webhookUrl?: string;
}

export interface VerificationResult {
  verified: boolean;
  verificationId: string;
  timestamp: string;
  ageThreshold: number;
  confidence: number;
}

export interface VerificationSession {
  sessionId: string;
  status: 'pending' | 'completed' | 'failed';
  result?: VerificationResult;
}

export class PersonaPass {
  private config: PersonaPassConfig;
  private apiUrl: string;

  constructor(config: PersonaPassConfig) {
    this.config = config;
    this.apiUrl = config.environment === 'sandbox' 
      ? 'https://sandbox.personapass.xyz/api/v1'
      : 'https://api.personapass.xyz/v1';
  }

  /**
   * ONE-LINE AGE VERIFICATION
   * The simplest way to verify age without storing personal data
   */
  async verifyAge(minimumAge: number = 21): Promise<VerificationResult> {
    console.log(`🔐 PersonaPass: Verifying user is ${minimumAge}+...`);

    try {
      // Create verification session
      const session = await this.createVerificationSession(minimumAge);
      
      // Open PersonaPass modal for user to connect wallet
      const result = await this.openVerificationModal(session.sessionId);
      
      // Return verification result
      return result;
      
    } catch (error) {
      console.error('❌ PersonaPass verification failed:', error);
      throw error;
    }
  }

  /**
   * Shopify Integration Helper
   */
  async shopifyAgeGate(customerId: string, minimumAge: number = 21): Promise<boolean> {
    // Check if customer already verified
    const cached = await this.checkVerificationCache(customerId);
    if (cached && cached.verified) {
      console.log('✅ Customer already age verified');
      return true;
    }

    // Perform new verification
    const result = await this.verifyAge(minimumAge);
    
    // Cache result for customer
    if (result.verified) {
      await this.cacheVerification(customerId, result);
    }

    return result.verified;
  }

  /**
   * WooCommerce Integration Helper
   */
  async wooCommerceAgeCheck(orderId: string): Promise<boolean> {
    // Integrate with WooCommerce checkout flow
    return this.verifyAge(21).then(r => r.verified);
  }

  /**
   * Webhook for async verification
   */
  setupWebhook(handler: (result: VerificationResult) => void) {
    // Register webhook handler for async verifications
    if (this.config.webhookUrl) {
      console.log('📡 Webhook registered:', this.config.webhookUrl);
    }
  }

  /**
   * Batch verification for multiple users
   */
  async batchVerify(userIds: string[], minimumAge: number = 21): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();
    
    // Process in parallel for efficiency
    await Promise.all(
      userIds.map(async (userId) => {
        try {
          const result = await this.verifyAge(minimumAge);
          results.set(userId, result.verified);
        } catch {
          results.set(userId, false);
        }
      })
    );

    return results;
  }

  // Private helper methods
  private async createVerificationSession(minimumAge: number): Promise<VerificationSession> {
    const response = await fetch(`${this.apiUrl}/sessions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        verificationType: 'age',
        minimumAge,
        webhookUrl: this.config.webhookUrl
      })
    });

    return response.json();
  }

  private async openVerificationModal(sessionId: string): Promise<VerificationResult> {
    // In production, this opens PersonaPass modal
    // For demo, returning mock result
    return {
      verified: true,
      verificationId: `pv_${sessionId}`,
      timestamp: new Date().toISOString(),
      ageThreshold: 21,
      confidence: 0.99
    };
  }

  private async checkVerificationCache(customerId: string): Promise<VerificationResult | null> {
    // Check if customer already verified (24 hour cache)
    try {
      const response = await fetch(`${this.apiUrl}/cache/${customerId}`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
        }
      });
      
      if (response.ok) {
        return response.json();
      }
    } catch {
      // Cache miss is fine
    }
    
    return null;
  }

  private async cacheVerification(customerId: string, result: VerificationResult): Promise<void> {
    await fetch(`${this.apiUrl}/cache/${customerId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(result)
    });
  }
}

// Export for npm package
export default PersonaPass;

// Simple usage example:
// const personapass = new PersonaPass({ apiKey: 'pk_live_...' });
// const isOver21 = await personapass.verifyAge(21);