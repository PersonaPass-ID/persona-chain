/**
 * PersonaPass Widget - Embeddable UI Component
 * 
 * A drop-in widget that provides a complete identity verification UI.
 * Can be embedded in any website with minimal configuration.
 */

import { PersonaPassSDK } from './PersonaPassSDK';
import {
  WidgetConfig,
  PersonaPassTheme,
  ProofType,
  ProofResponse,
  VerificationResult
} from './types';

export class PersonaPassWidget {
  private sdk: PersonaPassSDK;
  private config: WidgetConfig;
  private container: HTMLElement;
  private theme: PersonaPassTheme;
  
  constructor(sdk: PersonaPassSDK, config: WidgetConfig) {
    this.sdk = sdk;
    this.config = config;
    this.theme = { ...sdk.getConfig().theme, ...config.theme };
    
    // Get container element
    if (typeof config.container === 'string') {
      const element = document.querySelector(config.container);
      if (!element) {
        throw new Error(`Container element not found: ${config.container}`);
      }
      this.container = element as HTMLElement;
    } else {
      this.container = config.container;
    }
    
    this.initialize();
  }
  
  /**
   * Initialize the widget
   */
  private initialize(): void {
    this.render();
    this.attachEventListeners();
  }
  
  /**
   * Render the widget UI
   */
  private render(): void {
    const widgetId = `personapass-widget-${Date.now()}`;
    
    this.container.innerHTML = `
      <div id="${widgetId}" class="personapass-widget">
        <div class="personapass-header">
          <h3>Identity Verification</h3>
          <p>Verify your identity privately using zero-knowledge proofs</p>
        </div>
        
        <div class="personapass-status" id="status-${widgetId}">
          <div class="loading">Checking verification status...</div>
        </div>
        
        <div class="personapass-verification-types" id="types-${widgetId}" style="display: none;">
          <div class="verification-type" data-type="age-verification">
            <div class="type-icon">🎂</div>
            <div class="type-info">
              <h4>Age Verification</h4>
              <p>Prove you meet age requirements without revealing your exact age</p>
            </div>
            <button class="verify-btn" data-type="age-verification">Verify Age</button>
          </div>
          
          <div class="verification-type" data-type="jurisdiction-proof">
            <div class="type-icon">🌍</div>
            <div class="type-info">
              <h4>Location Proof</h4>
              <p>Prove your jurisdiction without revealing exact location</p>
            </div>
            <button class="verify-btn" data-type="jurisdiction-proof">Verify Location</button>
          </div>
          
          <div class="verification-type" data-type="accredited-investor">
            <div class="type-icon">💼</div>
            <div class="type-info">
              <h4>Accredited Investor</h4>
              <p>Prove investment eligibility without revealing net worth</p>
            </div>
            <button class="verify-btn" data-type="accredited-investor">Verify Status</button>
          </div>
          
          <div class="verification-type" data-type="anti-sybil">
            <div class="type-icon">👤</div>
            <div class="type-info">
              <h4>Proof of Personhood</h4>
              <p>Prove you're a unique human without revealing identity</p>
            </div>
            <button class="verify-btn" data-type="anti-sybil">Verify Personhood</button>
          </div>
        </div>
        
        <div class="personapass-results" id="results-${widgetId}" style="display: none;">
          <div class="result-content"></div>
          <button class="generate-another">Generate Another Proof</button>
        </div>
        
        <div class="personapass-footer">
          <p>Powered by <strong>PersonaPass</strong> - Privacy-first identity verification</p>
        </div>
      </div>
    `;
    
    this.injectStyles();
    this.loadUserStatus(widgetId);
  }
  
  /**
   * Inject widget styles
   */
  private injectStyles(): void {
    const styleId = 'personapass-widget-styles';
    if (document.getElementById(styleId)) return;
    
    const styles = document.createElement('style');
    styles.id = styleId;
    styles.textContent = `
      .personapass-widget {
        font-family: ${this.theme.fontFamily || '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'};
        background: ${this.theme.backgroundColor || '#ffffff'};
        border: 1px solid ${this.theme.primaryColor || '#e1e5e9'}20;
        border-radius: ${this.theme.borderRadius || '12px'};
        padding: 24px;
        max-width: 600px;
        margin: 0 auto;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      }
      
      .personapass-header {
        text-align: center;
        margin-bottom: 24px;
      }
      
      .personapass-header h3 {
        margin: 0 0 8px 0;
        color: ${this.theme.textColor || '#1a202c'};
        font-size: 24px;
        font-weight: 600;
      }
      
      .personapass-header p {
        margin: 0;
        color: ${this.theme.textColor || '#718096'};
        font-size: 14px;
      }
      
      .personapass-status {
        text-align: center;
        padding: 20px;
        margin-bottom: 20px;
      }
      
      .loading {
        color: ${this.theme.primaryColor || '#4299e1'};
        font-weight: 500;
      }
      
      .verification-type {
        display: flex;
        align-items: center;
        padding: 16px;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        margin-bottom: 12px;
        transition: all 0.2s ease;
      }
      
      .verification-type:hover {
        border-color: ${this.theme.primaryColor || '#4299e1'};
        box-shadow: 0 2px 8px rgba(66, 153, 225, 0.1);
      }
      
      .type-icon {
        font-size: 32px;
        margin-right: 16px;
        width: 48px;
        text-align: center;
      }
      
      .type-info {
        flex: 1;
        margin-right: 16px;
      }
      
      .type-info h4 {
        margin: 0 0 4px 0;
        color: ${this.theme.textColor || '#1a202c'};
        font-size: 16px;
        font-weight: 600;
      }
      
      .type-info p {
        margin: 0;
        color: ${this.theme.textColor || '#718096'};
        font-size: 14px;
        line-height: 1.4;
      }
      
      .verify-btn {
        background: ${this.theme.primaryColor || '#4299e1'};
        color: white;
        border: none;
        border-radius: 6px;
        padding: 10px 20px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .verify-btn:hover {
        background: ${this.theme.secondaryColor || '#3182ce'};
        transform: translateY(-1px);
      }
      
      .verify-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
      }
      
      .personapass-results {
        padding: 20px;
        background: #f7fafc;
        border-radius: 8px;
        text-align: center;
      }
      
      .result-success {
        color: #38a169;
        font-weight: 600;
        margin-bottom: 16px;
      }
      
      .result-error {
        color: #e53e3e;
        font-weight: 600;
        margin-bottom: 16px;
      }
      
      .proof-details {
        background: white;
        border-radius: 6px;
        padding: 16px;
        margin: 16px 0;
        text-align: left;
        font-family: monospace;
        font-size: 12px;
      }
      
      .generate-another {
        background: transparent;
        color: ${this.theme.primaryColor || '#4299e1'};
        border: 1px solid ${this.theme.primaryColor || '#4299e1'};
        border-radius: 6px;
        padding: 8px 16px;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .generate-another:hover {
        background: ${this.theme.primaryColor || '#4299e1'};
        color: white;
      }
      
      .personapass-footer {
        text-align: center;
        margin-top: 24px;
        padding-top: 16px;
        border-top: 1px solid #e2e8f0;
      }
      
      .personapass-footer p {
        margin: 0;
        font-size: 12px;
        color: #a0aec0;
      }
      
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      
      .spinner {
        display: inline-block;
        width: 20px;
        height: 20px;
        border: 3px solid #f3f3f3;
        border-top: 3px solid ${this.theme.primaryColor || '#4299e1'};
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
    `;
    
    document.head.appendChild(styles);
  }
  
  /**
   * Load user credential status
   */
  private async loadUserStatus(widgetId: string): Promise<void> {
    try {
      // For demo, we'll assume a wallet address is available
      const walletAddress = this.getWalletAddress();
      if (!walletAddress) {
        this.showWalletConnection(widgetId);
        return;
      }
      
      const status = await this.sdk.getCredentialStatus(walletAddress);
      
      if (status.hasCredentials) {
        this.showVerificationTypes(widgetId);
      } else {
        this.showCredentialSetup(widgetId);
      }
      
    } catch (error) {
      this.showError(widgetId, 'Failed to load credential status');
    }
  }
  
  /**
   * Show verification type selection
   */
  private showVerificationTypes(widgetId: string): void {
    const statusDiv = document.getElementById(`status-${widgetId}`);
    const typesDiv = document.getElementById(`types-${widgetId}`);
    
    if (statusDiv) statusDiv.style.display = 'none';
    if (typesDiv) typesDiv.style.display = 'block';
  }
  
  /**
   * Show wallet connection prompt
   */
  private showWalletConnection(widgetId: string): void {
    const statusDiv = document.getElementById(`status-${widgetId}`);
    if (statusDiv) {
      statusDiv.innerHTML = `
        <div class="result-error">
          Please connect your wallet to continue
        </div>
        <button class="verify-btn" onclick="PersonaPassWidget.connectWallet()">
          Connect Wallet
        </button>
      `;
    }
  }
  
  /**
   * Show credential setup prompt
   */
  private showCredentialSetup(widgetId: string): void {
    const statusDiv = document.getElementById(`status-${widgetId}`);
    if (statusDiv) {
      statusDiv.innerHTML = `
        <div class="result-error">
          No verified credentials found
        </div>
        <p>You need to verify your identity before generating proofs.</p>
        <button class="verify-btn" onclick="PersonaPassWidget.startVerification('${this.getWalletAddress()}')">
          Start Verification
        </button>
      `;
    }
  }
  
  /**
   * Show error message
   */
  private showError(widgetId: string, message: string): void {
    const statusDiv = document.getElementById(`status-${widgetId}`);
    if (statusDiv) {
      statusDiv.innerHTML = `
        <div class="result-error">${message}</div>
        <button class="verify-btn" onclick="location.reload()">
          Try Again
        </button>
      `;
    }
  }
  
  /**
   * Attach event listeners
   */
  private attachEventListeners(): void {
    this.container.addEventListener('click', async (event) => {
      const target = event.target as HTMLElement;
      
      if (target.classList.contains('verify-btn')) {
        const proofType = target.getAttribute('data-type') as ProofType;
        if (proofType) {
          await this.generateProof(proofType);
        }
      }
      
      if (target.classList.contains('generate-another')) {
        this.showVerificationTypes(this.container.id);
      }
    });
  }
  
  /**
   * Generate proof for selected type
   */
  private async generateProof(proofType: ProofType): Promise<void> {
    try {
      const walletAddress = this.getWalletAddress();
      if (!walletAddress) {
        throw new Error('Wallet not connected');
      }
      
      // Disable all buttons during generation
      const buttons = this.container.querySelectorAll('button');
      buttons.forEach(btn => (btn as HTMLButtonElement).disabled = true);
      
      // Show loading state
      this.showLoading('Generating zero-knowledge proof...');
      
      const proof = await this.sdk.generateProof({
        type: proofType,
        walletAddress,
        purpose: `Identity verification for ${proofType}`,
        constraints: this.getConstraints(proofType)
      });
      
      this.showProofResult(proof);
      
      // Emit callback
      if (this.config.onProofGenerated) {
        this.config.onProofGenerated(proof);
      }
      
    } catch (error) {
      this.showError(this.container.id, 'Failed to generate proof');
      
      if (this.config.onError) {
        this.config.onError({
          code: 'PROOF_GENERATION_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    } finally {
      // Re-enable buttons
      const buttons = this.container.querySelectorAll('button');
      buttons.forEach(btn => (btn as HTMLButtonElement).disabled = false);
    }
  }
  
  /**
   * Show loading state
   */
  private showLoading(message: string): void {
    const resultsDiv = this.container.querySelector('.personapass-results') as HTMLElement;
    if (resultsDiv) {
      resultsDiv.style.display = 'block';
      resultsDiv.innerHTML = `
        <div class="loading">
          <div class="spinner"></div>
          <div style="margin-top: 12px;">${message}</div>
        </div>
      `;
    }
  }
  
  /**
   * Show proof generation result
   */
  private showProofResult(proof: ProofResponse): void {
    const resultsDiv = this.container.querySelector('.personapass-results') as HTMLElement;
    if (resultsDiv) {
      resultsDiv.innerHTML = `
        <div class="result-success">
          ✅ Zero-knowledge proof generated successfully!
        </div>
        <div class="proof-details">
          <strong>Proof ID:</strong> ${proof.proofId}<br>
          <strong>Type:</strong> ${proof.proof.type}<br>
          <strong>Generated:</strong> ${new Date(proof.proof.metadata.timestamp).toLocaleString()}<br>
          ${proof.proof.metadata.expiresAt ? `<strong>Expires:</strong> ${new Date(proof.proof.metadata.expiresAt).toLocaleString()}<br>` : ''}
        </div>
        <div style="margin-top: 16px;">
          <a href="${proof.downloadUrl}" target="_blank" class="verify-btn" style="text-decoration: none; margin-right: 8px;">
            Download Proof
          </a>
          <a href="${proof.verificationUrl}" target="_blank" class="verify-btn" style="text-decoration: none; background: transparent; color: ${this.theme.primaryColor || '#4299e1'}; border: 1px solid ${this.theme.primaryColor || '#4299e1'};">
            Verify Proof
          </a>
        </div>
        <button class="generate-another" style="margin-top: 16px;">Generate Another Proof</button>
      `;
    }
  }
  
  /**
   * Get wallet address (placeholder implementation)
   */
  private getWalletAddress(): string | null {
    // In a real implementation, this would integrate with wallet providers
    return '0x742d35Cc6634C0532925a3b8D2C7C51b45e89C9f'; // Mock wallet for demo
  }
  
  /**
   * Get constraints for proof type
   */
  private getConstraints(proofType: ProofType): Record<string, any> {
    switch (proofType) {
      case 'age-verification':
        return { minAge: 18 };
      case 'jurisdiction-proof':
        return { allowedRegions: ['US', 'EU', 'UK'] };
      case 'accredited-investor':
        return { minNetWorth: 1000000 };
      case 'anti-sybil':
        return { uniquenessSet: 'global', confidenceThreshold: 80 };
      default:
        return {};
    }
  }
  
  // Static methods for global callbacks
  static connectWallet(): void {
    // Placeholder for wallet connection
    alert('Wallet connection would be implemented here');
  }
  
  static async startVerification(walletAddress: string): Promise<void> {
    // Placeholder for verification flow
    alert(`Verification flow for ${walletAddress} would start here`);
  }
}