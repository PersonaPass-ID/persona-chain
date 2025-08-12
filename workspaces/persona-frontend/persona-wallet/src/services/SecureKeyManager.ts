import * as bip39 from 'bip39';
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
import { stringToPath } from '@cosmjs/crypto';

export interface SecureStorageOptions {
  requireBiometric?: boolean;
  sessionTimeout?: number;
  autoLock?: boolean;
}

export class SecureKeyManager {
  private static instance: SecureKeyManager;
  private encryptionKey: CryptoKey | null = null;
  private sessionStartTime: number = 0;
  private isLocked: boolean = true;
  private lockTimeout: number = 15 * 60 * 1000; // 15 minutes
  private lockTimer?: NodeJS.Timeout;

  static getInstance(): SecureKeyManager {
    if (!SecureKeyManager.instance) {
      SecureKeyManager.instance = new SecureKeyManager();
    }
    return SecureKeyManager.instance;
  }

  /**
   * Generate cryptographically secure mnemonic with enhanced entropy
   */
  async generateSecureMnemonic(): Promise<string> {
    try {
      // Collect additional entropy sources
      const entropy = await this.collectEntropy();
      
      // Use Web Crypto API for secure randomness
      const secureRandom = crypto.getRandomValues(new Uint8Array(32));
      
      // Combine entropy sources
      const combinedEntropy = await this.combineEntropy(entropy, secureRandom);
      
      // Generate mnemonic with enhanced entropy
      const mnemonic = bip39.entropyToMnemonic(combinedEntropy);
      
      // Validate mnemonic strength
      if (!this.validateMnemonicStrength(mnemonic)) {
        throw new Error('Generated mnemonic does not meet security requirements');
      }
      
      return mnemonic;
    } catch (error) {
      console.error('Error generating secure mnemonic:', error);
      throw new Error('Failed to generate secure mnemonic');
    }
  }

  /**
   * Collect additional entropy from various sources
   */
  private async collectEntropy(): Promise<Uint8Array> {
    const sources: number[] = [];
    
    // Timing entropy
    sources.push(performance.now());
    sources.push(Date.now());
    
    // Mouse/touch entropy (if available)
    if (typeof window !== 'undefined') {
      sources.push(window.screen.width);
      sources.push(window.screen.height);
      sources.push(Math.random() * 1000000);
    }
    
    // Memory entropy
    const memoryArray = new Uint8Array(16);
    crypto.getRandomValues(memoryArray);
    sources.push(...Array.from(memoryArray));
    
    return new Uint8Array(sources.map(s => s % 256));
  }

  /**
   * Combine multiple entropy sources using secure hashing
   */
  private async combineEntropy(entropy1: Uint8Array, entropy2: Uint8Array): Promise<Buffer> {
    const combined = new Uint8Array(entropy1.length + entropy2.length);
    combined.set(entropy1);
    combined.set(entropy2, entropy1.length);
    
    // Use SHA-256 to mix entropy sources
    return Buffer.from(await crypto.subtle.digest('SHA-256', combined));
  }

  /**
   * Validate mnemonic meets security requirements
   */
  private validateMnemonicStrength(mnemonic: string): boolean {
    const words = mnemonic.split(' ');
    
    // Must be 24 words for maximum security
    if (words.length !== 24) return false;
    
    // Validate using BIP-39
    if (!bip39.validateMnemonic(mnemonic)) return false;
    
    // Check entropy level (24 words = 256 bits entropy)
    const entropy = bip39.mnemonicToEntropy(mnemonic);
    return entropy.length === 64; // 32 bytes = 256 bits
  }

  /**
   * Create wallet with enhanced security
   */
  async createSecureWallet(mnemonic: string, password?: string): Promise<DirectSecp256k1HdWallet> {
    try {
      // Validate mnemonic
      if (!bip39.validateMnemonic(mnemonic)) {
        throw new Error('Invalid mnemonic phrase');
      }

      // Create wallet with secure derivation path
      const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
        hdPaths: [stringToPath("m/44'/118'/0'/0/0")],
        prefix: 'persona',
      });

      // If password provided, encrypt and store
      if (password) {
        await this.securelyStoreMnemonic(mnemonic, password);
      }

      return wallet;
    } catch (error) {
      console.error('Error creating secure wallet:', error);
      throw new Error('Failed to create secure wallet');
    }
  }

  /**
   * Securely store encrypted mnemonic
   */
  private async securelyStoreMnemonic(mnemonic: string, password: string): Promise<void> {
    try {
      // Derive key from password using PBKDF2
      const key = await this.deriveKey(password);
      
      // Generate random IV
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      // Encrypt mnemonic
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        new TextEncoder().encode(mnemonic)
      );

      // Store encrypted data with IV
      const encryptedData = {
        encrypted: Array.from(new Uint8Array(encrypted)),
        iv: Array.from(iv),
        timestamp: Date.now()
      };

      // Store in secure storage (not localStorage for security)
      sessionStorage.setItem('persona_wallet_encrypted', JSON.stringify(encryptedData));
    } catch (error) {
      console.error('Error storing encrypted mnemonic:', error);
      throw new Error('Failed to securely store mnemonic');
    }
  }

  /**
   * Derive encryption key from password
   */
  private async deriveKey(password: string): Promise<CryptoKey> {
    // Use PBKDF2 for key derivation
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    // Generate salt (in production, store this securely)
    const salt = crypto.getRandomValues(new Uint8Array(16));

    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Start secure session with auto-lock
   */
  startSecureSession(timeout?: number): void {
    this.sessionStartTime = Date.now();
    this.isLocked = false;
    this.lockTimeout = timeout || this.lockTimeout;
    
    // Set up auto-lock timer
    this.setupAutoLock();
    
    // Track user activity
    this.setupActivityTracking();
  }

  /**
   * Set up automatic wallet locking
   */
  private setupAutoLock(): void {
    // Clear existing timer
    if (this.lockTimer) {
      clearTimeout(this.lockTimer);
    }

    // Set new timer
    this.lockTimer = setTimeout(() => {
      this.lockWallet();
    }, this.lockTimeout);
  }

  /**
   * Track user activity to reset lock timer
   */
  private setupActivityTracking(): void {
    const resetTimer = () => {
      if (!this.isLocked) {
        this.setupAutoLock();
      }
    };

    // Track various user interactions
    if (typeof window !== 'undefined') {
      window.addEventListener('click', resetTimer);
      window.addEventListener('keypress', resetTimer);
      window.addEventListener('scroll', resetTimer);
      window.addEventListener('mousemove', resetTimer);
    }
  }

  /**
   * Lock wallet and clear sensitive data
   */
  lockWallet(): void {
    this.isLocked = true;
    this.encryptionKey = null;
    
    // Clear sensitive data from memory
    this.clearSensitiveData();
    
    // Clear timers
    if (this.lockTimer) {
      clearTimeout(this.lockTimer);
    }

    // Notify application that wallet is locked
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('walletLocked'));
    }
  }

  /**
   * Check if wallet is locked
   */
  isWalletLocked(): boolean {
    return this.isLocked;
  }

  /**
   * Clear sensitive data from memory
   */
  private clearSensitiveData(): void {
    // Clear session storage
    sessionStorage.removeItem('persona_wallet_encrypted');
    
    // Force garbage collection if available
    if (typeof window !== 'undefined' && 'gc' in window) {
      (window as any).gc();
    }
  }

  /**
   * Validate transaction for security risks
   */
  validateTransaction(transaction: any): { isValid: boolean; warnings: string[] } {
    const warnings: string[] = [];
    let isValid = true;

    // Check for high-value transfers
    if (transaction.amount && parseInt(transaction.amount) > 1000000) { // 1M PERSONA
      warnings.push('High value transfer detected. Please verify recipient address.');
    }

    // Check for unknown recipient addresses
    if (!this.isKnownAddress(transaction.to)) {
      warnings.push('Sending to unknown address. Please verify recipient.');
    }

    // Check for suspicious gas fees
    if (transaction.fee && parseInt(transaction.fee) > 100000) { // 100K PERSONA fee
      warnings.push('Unusually high transaction fee detected.');
      isValid = false;
    }

    return { isValid, warnings };
  }

  /**
   * Check if address is in known contacts
   */
  private isKnownAddress(address: string): boolean {
    // In production, check against address book
    const knownAddresses = JSON.parse(
      localStorage.getItem('persona_contacts') || '[]'
    );
    return knownAddresses.some((contact: any) => contact.address === address);
  }

  /**
   * Generate secure backup data
   */
  async generateSecureBackup(password: string): Promise<{
    encryptedBackup: string;
    checksum: string;
    timestamp: number;
  }> {
    try {
      const walletData = {
        // Don't include actual mnemonic in backup
        addresses: this.getStoredAddresses(),
        contacts: JSON.parse(localStorage.getItem('persona_contacts') || '[]'),
        settings: JSON.parse(localStorage.getItem('persona_settings') || '{}'),
        timestamp: Date.now()
      };

      // Encrypt backup data
      const key = await this.deriveKey(password);
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        new TextEncoder().encode(JSON.stringify(walletData))
      );

      // Generate checksum
      const checksum = await crypto.subtle.digest(
        'SHA-256',
        encrypted
      );

      return {
        encryptedBackup: Array.from(new Uint8Array(encrypted)).join(','),
        checksum: Array.from(new Uint8Array(checksum)).join(','),
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error generating secure backup:', error);
      throw new Error('Failed to generate secure backup');
    }
  }

  /**
   * Get stored wallet addresses
   */
  private getStoredAddresses(): string[] {
    const walletData = localStorage.getItem('persona-wallet');
    if (walletData) {
      try {
        const parsed = JSON.parse(walletData);
        return [parsed.address];
      } catch {
        return [];
      }
    }
    return [];
  }

  /**
   * Destroy secure key manager instance
   */
  destroy(): void {
    this.lockWallet();
    this.clearSensitiveData();
    SecureKeyManager.instance = null as any;
  }
}

export const secureKeyManager = SecureKeyManager.getInstance();