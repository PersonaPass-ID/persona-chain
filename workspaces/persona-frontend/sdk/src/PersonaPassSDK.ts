/**
 * PersonaPass SDK Core
 * 
 * Main SDK class for integrating PersonaPass privacy-preserving identity verification.
 * Provides methods for generating and verifying zero-knowledge proofs without
 * revealing personal information.
 */

import {
  PersonaPassConfig,
  ProofRequest,
  ProofResponse,
  VerificationResult,
  CredentialStatus,
  ProofGenerationOptions,
  PersonaPassError,
  EventHandler,
  EventType,
  PersonaPassEvent,
  NetworkType
} from './types';

export class PersonaPassSDK {
  private config: Required<PersonaPassConfig>;
  private eventHandlers: Map<EventType, EventHandler[]> = new Map();
  
  constructor(config: PersonaPassConfig) {
    // Validate required config
    if (!config.apiKey) {
      throw new Error('PersonaPass API key is required');
    }
    
    // Set defaults
    this.config = {
      apiKey: config.apiKey,
      baseUrl: config.baseUrl || this.getDefaultBaseUrl(config.network || 'development'),
      network: config.network || 'development',
      debug: config.debug || false,
      theme: config.theme || {}
    };
    
    if (this.config.debug) {
      console.log('🔐 PersonaPass SDK initialized', {
        network: this.config.network,
        baseUrl: this.config.baseUrl
      });
    }
  }
  
  /**
   * Generate a zero-knowledge proof for identity verification
   */
  async generateProof(
    request: ProofRequest,
    options: ProofGenerationOptions = {}
  ): Promise<ProofResponse> {
    try {
      this.emitEvent('verification_started', { request });
      
      if (this.config.debug) {
        console.log('🔮 Generating ZK proof:', request.type);
      }
      
      // Check for cached proof if enabled
      if (options.useCache) {
        const cachedProof = await this.getCachedProof(request);
        if (cachedProof) {
          if (this.config.debug) {
            console.log('✅ Using cached proof:', cachedProof.proofId);
          }
          return cachedProof;
        }
      }
      
      const response = await this.makeRequest<ProofResponse>('/api/zk-proofs/generate', {
        method: 'POST',
        body: JSON.stringify({
          credentialId: await this.getCredentialId(request.walletAddress),
          proofType: request.type,
          attributes: [], // Will be populated from verified credentials
          constraints: request.constraints,
          purpose: request.purpose,
          walletAddress: request.walletAddress,
          ...options.metadata
        })
      });
      
      // Cache proof if enabled
      if (options.persistProof) {
        await this.cacheProof(request, response);
      }
      
      this.emitEvent('proof_generated', { proof: response, request });
      
      if (this.config.debug) {
        console.log('✅ ZK proof generated:', response.proofId);
      }
      
      return response;
      
    } catch (error) {
      const personaPassError = this.createError('PROOF_GENERATION_FAILED', 
        'Failed to generate zero-knowledge proof', error);
      this.emitEvent('error', { error: personaPassError });
      throw personaPassError;
    }
  }
  
  /**
   * Verify a zero-knowledge proof
   */
  async verifyProof(proofId: string): Promise<VerificationResult> {
    try {
      if (this.config.debug) {
        console.log('🔍 Verifying proof:', proofId);
      }
      
      const response = await this.makeRequest<VerificationResult>(`/api/zk-proofs/verify/${proofId}`);
      
      this.emitEvent('proof_verified', { result: response, proofId });
      
      if (this.config.debug) {
        console.log(`${response.valid ? '✅' : '❌'} Proof verification:`, response.valid);
      }
      
      return response;
      
    } catch (error) {
      const personaPassError = this.createError('VERIFICATION_FAILED', 
        'Failed to verify proof', error);
      this.emitEvent('error', { error: personaPassError });
      throw personaPassError;
    }
  }
  
  /**
   * Get user's credential status
   */
  async getCredentialStatus(walletAddress: string): Promise<CredentialStatus> {
    try {
      if (this.config.debug) {
        console.log('📋 Fetching credential status for:', walletAddress);
      }
      
      const response = await this.makeRequest<CredentialStatus>(`/api/credentials/status/${walletAddress}`);
      return response;
      
    } catch (error) {
      const personaPassError = this.createError('CREDENTIAL_STATUS_FAILED', 
        'Failed to fetch credential status', error);
      this.emitEvent('error', { error: personaPassError });
      throw personaPassError;
    }
  }
  
  /**
   * Start identity verification flow
   */
  async startVerification(walletAddress: string, redirectUrl?: string): Promise<string> {
    try {
      if (this.config.debug) {
        console.log('🚀 Starting verification flow for:', walletAddress);
      }
      
      const response = await this.makeRequest<{ verificationUrl: string }>('/api/verification/start', {
        method: 'POST',
        body: JSON.stringify({
          walletAddress,
          redirectUrl,
          apiKey: this.config.apiKey
        })
      });
      
      return response.verificationUrl;
      
    } catch (error) {
      const personaPassError = this.createError('VERIFICATION_START_FAILED', 
        'Failed to start verification', error);
      this.emitEvent('error', { error: personaPassError });
      throw personaPassError;
    }
  }
  
  /**
   * Subscribe to SDK events
   */
  on<T = any>(eventType: EventType, handler: EventHandler<T>): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler as EventHandler);
  }
  
  /**
   * Unsubscribe from SDK events
   */
  off<T = any>(eventType: EventType, handler: EventHandler<T>): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler as EventHandler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }
  
  /**
   * Get SDK configuration
   */
  getConfig(): Readonly<PersonaPassConfig> {
    return { ...this.config };
  }
  
  /**
   * Update SDK configuration
   */
  updateConfig(updates: Partial<PersonaPassConfig>): void {
    this.config = { ...this.config, ...updates };
    
    if (this.config.debug) {
      console.log('🔧 PersonaPass SDK config updated:', updates);
    }
  }
  
  // Private methods
  
  private getDefaultBaseUrl(network: NetworkType): string {
    switch (network) {
      case 'mainnet':
        return 'https://api.personapass.me';
      case 'testnet':
        return 'https://testnet-api.personapass.me';
      case 'development':
      default:
        return 'http://localhost:3000';
    }
  }
  
  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;
    
    const requestOptions: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
        'X-PersonaPass-SDK': 'js-1.0.0',
        ...options.headers
      }
    };
    
    const response = await fetch(url, requestOptions);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  private async getCredentialId(walletAddress: string): Promise<string> {
    try {
      const response = await this.makeRequest<{ credentialId: string }>(`/api/credentials/primary/${walletAddress}`);
      return response.credentialId;
    } catch (error) {
      throw new Error(`No verified credentials found for wallet: ${walletAddress}`);
    }
  }
  
  private async getCachedProof(request: ProofRequest): Promise<ProofResponse | null> {
    // In a real implementation, this would check localStorage/IndexedDB
    const cacheKey = this.getCacheKey(request);
    const cached = localStorage.getItem(cacheKey);
    
    if (cached) {
      const proof = JSON.parse(cached);
      // Check if proof is still valid
      if (!proof.expiresAt || new Date(proof.expiresAt) > new Date()) {
        return proof;
      } else {
        localStorage.removeItem(cacheKey);
      }
    }
    
    return null;
  }
  
  private async cacheProof(request: ProofRequest, proof: ProofResponse): Promise<void> {
    const cacheKey = this.getCacheKey(request);
    localStorage.setItem(cacheKey, JSON.stringify(proof));
  }
  
  private getCacheKey(request: ProofRequest): string {
    return `personapass_proof_${request.type}_${request.walletAddress}_${JSON.stringify(request.constraints)}`;
  }
  
  private emitEvent<T = any>(type: EventType, data: T): void {
    const event: PersonaPassEvent<T> = {
      type,
      data,
      timestamp: new Date().toISOString()
    };
    
    const handlers = this.eventHandlers.get(type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(event);
        } catch (error) {
          console.error('PersonaPass event handler error:', error);
        }
      });
    }
    
    if (this.config.debug) {
      console.log('📡 PersonaPass event:', event);
    }
  }
  
  private createError(code: string, message: string, originalError?: any): PersonaPassError {
    return {
      code,
      message,
      details: originalError ? { originalMessage: originalError.message } : undefined,
      originalError: originalError instanceof Error ? originalError : undefined
    };
  }
}