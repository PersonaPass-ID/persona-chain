// 🔐 PersonaPass Multi-Method Backup & Recovery System
// Comprehensive backup solutions for wallet access recovery

// Recovery phrase implementation
export class RecoveryPhrase {
  /**
   * Generate BIP39 mnemonic recovery phrase
   */
  static generateMnemonic(): {
    phrase: string[]
    seed: string
    entropy: string
  } {
    // Simplified BIP39 word list (first 128 words for demo)
    const BIP39_WORDS = [
      'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract',
      'absurd', 'abuse', 'access', 'accident', 'account', 'accuse', 'achieve', 'acid',
      'acoustic', 'acquire', 'across', 'act', 'action', 'actor', 'actress', 'actual',
      'adapt', 'add', 'addict', 'address', 'adjust', 'admit', 'adult', 'advance',
      'advice', 'aerobic', 'affair', 'afford', 'afraid', 'again', 'age', 'agent',
      'agree', 'ahead', 'aim', 'air', 'airport', 'aisle', 'alarm', 'album',
      'alcohol', 'alert', 'alien', 'all', 'alley', 'allow', 'almost', 'alone',
      'alpha', 'already', 'also', 'alter', 'always', 'amateur', 'amazing', 'among',
      'amount', 'amused', 'analyst', 'anchor', 'ancient', 'anger', 'angle', 'angry',
      'animal', 'ankle', 'announce', 'annual', 'another', 'answer', 'antenna', 'antique',
      'anxiety', 'any', 'apart', 'apology', 'appear', 'apple', 'approve', 'april',
      'arch', 'arctic', 'area', 'arena', 'argue', 'arm', 'armed', 'armor',
      'army', 'around', 'arrange', 'arrest', 'arrive', 'arrow', 'art', 'article',
      'artist', 'artwork', 'ask', 'aspect', 'assault', 'asset', 'assist', 'assume',
      'asthma', 'athlete', 'atom', 'attack', 'attend', 'attitude', 'attract', 'auction',
      'audit', 'august', 'aunt', 'author', 'auto', 'autumn', 'average', 'avocado'
    ]
    
    // Generate 12 random words
    const phrase = []
    for (let i = 0; i < 12; i++) {
      const randomIndex = Math.floor(Math.random() * BIP39_WORDS.length)
      phrase.push(BIP39_WORDS[randomIndex])
    }
    
    // Generate entropy and seed (simplified for demo)
    const entropy = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
    
    const seed = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
    
    return {
      phrase,
      seed,
      entropy
    }
  }
  
  /**
   * Validate recovery phrase format
   */
  static validatePhrase(phrase: string[]): boolean {
    return phrase.length === 12 && phrase.every(word => word.length > 0)
  }
  
  /**
   * Derive wallet from recovery phrase
   */
  static deriveWallet(phrase: string[], passphrase?: string): {
    privateKey: string
    publicKey: string
    address: string
  } {
    // In production, use proper BIP39/BIP44 derivation
    const combinedSeed = phrase.join(' ') + (passphrase || '')
    
    // Simplified derivation for demo
    const hash = this.simpleHash(combinedSeed)
    
    return {
      privateKey: hash.substring(0, 64),
      publicKey: hash.substring(64, 128),
      address: 'persona1' + hash.substring(128, 160)
    }
  }
  
  private static simpleHash(input: string): string {
    let hash = 0
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16).padStart(192, '0')
  }
}

// Encrypted backup types
export interface EncryptedBackup {
  id: string
  type: 'cloud' | 'file' | 'qr' | 'hardware'
  encryptedData: string
  salt: string
  iv: string
  createdAt: string
  lastAccessed?: string
  metadata: {
    userDID: string
    walletAddress: string
    backupVersion: string
    description?: string
  }
}

export interface BackupData {
  userDID: string
  walletAddress: string
  recoveryPhrase?: string[]
  socialRecoveryConfig?: any
  identityCredentials?: any[]
  backupVersion: string
  createdAt: string
}

// Cloud backup providers
export interface CloudBackupProvider {
  name: string
  encrypt: (data: string, password: string) => Promise<EncryptedBackup>
  decrypt: (backup: EncryptedBackup, password: string) => Promise<string>
  store: (backup: EncryptedBackup) => Promise<string>
  retrieve: (backupId: string) => Promise<EncryptedBackup>
}

export class PersonaBackupManager {
  private userDID: string
  private walletAddress: string
  
  constructor(userDID: string, walletAddress: string) {
    this.userDID = userDID
    this.walletAddress = walletAddress
  }
  
  /**
   * Create comprehensive backup package
   */
  async createFullBackup(password: string, options: {
    includeRecoveryPhrase?: boolean
    includeSocialRecovery?: boolean
    includeCredentials?: boolean
  } = {}): Promise<{
    recoveryPhrase?: string[]
    encryptedBackup: EncryptedBackup
    qrCode: string
    printableBackup: string
  }> {
    // Generate recovery phrase if requested
    let recoveryPhrase: string[] | undefined
    if (options.includeRecoveryPhrase) {
      const mnemonic = RecoveryPhrase.generateMnemonic()
      recoveryPhrase = mnemonic.phrase
    }
    
    // Collect backup data
    const backupData: BackupData = {
      userDID: this.userDID,
      walletAddress: this.walletAddress,
      recoveryPhrase: recoveryPhrase,
      socialRecoveryConfig: options.includeSocialRecovery ? this.getSocialRecoveryConfig() : undefined,
      identityCredentials: options.includeCredentials ? this.getIdentityCredentials() : undefined,
      backupVersion: '1.0',
      createdAt: new Date().toISOString()
    }
    
    // Create encrypted backup
    const encryptedBackup = await this.encryptBackup(JSON.stringify(backupData), password)
    
    // Generate QR code for backup
    const qrCode = this.generateBackupQR(encryptedBackup)
    
    // Create printable backup
    const printableBackup = this.generatePrintableBackup(encryptedBackup, recoveryPhrase)
    
    return {
      recoveryPhrase,
      encryptedBackup,
      qrCode,
      printableBackup
    }
  }
  
  /**
   * Restore from backup
   */
  async restoreFromBackup(encryptedBackup: EncryptedBackup, password: string): Promise<{
    success: boolean
    backupData?: BackupData
    error?: string
  }> {
    try {
      const decryptedData = await this.decryptBackup(encryptedBackup, password)
      const backupData: BackupData = JSON.parse(decryptedData)
      
      // Validate backup data
      if (backupData.userDID !== this.userDID) {
        throw new Error('Backup does not match current user')
      }
      
      // Restore recovery phrase if present
      if (backupData.recoveryPhrase) {
        this.storeRecoveryPhrase(backupData.recoveryPhrase)
      }
      
      // Restore social recovery if present
      if (backupData.socialRecoveryConfig) {
        this.restoreSocialRecovery(backupData.socialRecoveryConfig)
      }
      
      // Restore credentials if present
      if (backupData.identityCredentials) {
        this.restoreCredentials(backupData.identityCredentials)
      }
      
      return {
        success: true,
        backupData
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to restore backup'
      }
    }
  }
  
  /**
   * Create emergency recovery kit
   */
  generateEmergencyKit(): {
    recoveryPhrase: string[]
    backupCodes: string[]
    instructions: string
    emergencyContacts: string[]
  } {
    const mnemonic = RecoveryPhrase.generateMnemonic()
    
    // Generate backup codes
    const backupCodes = []
    for (let i = 0; i < 10; i++) {
      const code = Array.from(crypto.getRandomValues(new Uint8Array(4)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase()
      backupCodes.push(`${code.substring(0, 4)}-${code.substring(4, 8)}`)
    }
    
    const instructions = `
PERSONAPASS EMERGENCY RECOVERY KIT

1. RECOVERY PHRASE (Keep Safe!)
   Write down these words in order: ${mnemonic.phrase.join(', ')}
   
2. BACKUP CODES (One-time use)
   ${backupCodes.map((code, i) => `   ${i + 1}. ${code}`).join('\n')}

3. RECOVERY INSTRUCTIONS
   - Use recovery phrase to restore wallet access
   - Use backup codes for emergency access (one-time only)
   - Contact guardians for social recovery
   - Visit https://recover.personapass.xyz for assistance

4. IMPORTANT NOTES
   - Keep this document secure and private
   - Store copies in multiple safe locations
   - Update emergency contacts regularly
   - Test recovery process periodically

Date Created: ${new Date().toLocaleDateString()}
User DID: ${this.userDID}
Wallet: ${this.walletAddress}
`
    
    return {
      recoveryPhrase: mnemonic.phrase,
      backupCodes,
      instructions,
      emergencyContacts: this.getEmergencyContacts()
    }
  }
  
  /**
   * Hardware backup integration
   */
  async createHardwareBackup(deviceType: 'yubikey' | 'ledger' | 'trezor'): Promise<{
    success: boolean
    backupId?: string
    error?: string
  }> {
    try {
      // In production, integrate with actual hardware devices
      switch (deviceType) {
        case 'yubikey':
          return this.createYubikeyBackup()
        case 'ledger':
          return this.createLedgerBackup()
        case 'trezor':
          return this.createTrezorBackup()
        default:
          throw new Error('Unsupported hardware device')
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Hardware backup failed'
      }
    }
  }
  
  /**
   * Test backup recovery
   */
  async testBackupRecovery(backup: EncryptedBackup, password: string): Promise<{
    valid: boolean
    canRestore: boolean
    backupAge: number
    issues: string[]
  }> {
    const issues: string[] = []
    let valid = false
    let canRestore = false
    
    try {
      // Test decryption
      const decryptedData = await this.decryptBackup(backup, password)
      const backupData: BackupData = JSON.parse(decryptedData)
      valid = true
      
      // Check backup age
      const backupAge = Date.now() - new Date(backup.createdAt).getTime()
      const maxAge = 90 * 24 * 60 * 60 * 1000 // 90 days
      
      if (backupAge > maxAge) {
        issues.push('Backup is older than 90 days - consider creating a new one')
      }
      
      // Validate backup data integrity
      if (!backupData.userDID || !backupData.walletAddress) {
        issues.push('Backup missing critical identity information')
      } else {
        canRestore = true
      }
      
      // Check recovery phrase validity
      if (backupData.recoveryPhrase && !RecoveryPhrase.validatePhrase(backupData.recoveryPhrase)) {
        issues.push('Recovery phrase format is invalid')
        canRestore = false
      }
      
    } catch (error) {
      issues.push('Failed to decrypt backup - check password')
    }
    
    return {
      valid,
      canRestore,
      backupAge: Date.now() - new Date(backup.createdAt).getTime(),
      issues
    }
  }
  
  // Private helper methods
  
  private async encryptBackup(data: string, password: string): Promise<EncryptedBackup> {
    // Generate salt and IV
    const salt = crypto.getRandomValues(new Uint8Array(16))
    const iv = crypto.getRandomValues(new Uint8Array(12))
    
    // Derive key from password (simplified for demo)
    const encoder = new TextEncoder()
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    )
    
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    )
    
    // Encrypt data
    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      encoder.encode(data)
    )
    
    return {
      id: `backup_${Date.now()}`,
      type: 'file',
      encryptedData: Array.from(new Uint8Array(encryptedBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join(''),
      salt: Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join(''),
      iv: Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join(''),
      createdAt: new Date().toISOString(),
      metadata: {
        userDID: this.userDID,
        walletAddress: this.walletAddress,
        backupVersion: '1.0'
      }
    }
  }
  
  private async decryptBackup(backup: EncryptedBackup, password: string): Promise<string> {
    // Convert hex strings back to Uint8Arrays
    const salt = new Uint8Array(backup.salt.match(/.{2}/g)!.map(byte => parseInt(byte, 16)))
    const iv = new Uint8Array(backup.iv.match(/.{2}/g)!.map(byte => parseInt(byte, 16)))
    const encryptedData = new Uint8Array(backup.encryptedData.match(/.{2}/g)!.map(byte => parseInt(byte, 16)))
    
    // Derive key from password
    const encoder = new TextEncoder()
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    )
    
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    )
    
    // Decrypt data
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      encryptedData
    )
    
    return new TextDecoder().decode(decryptedBuffer)
  }
  
  private generateBackupQR(backup: EncryptedBackup): string {
    // In production, use proper QR code library
    const backupUrl = `https://recover.personapass.xyz/restore?backup=${backup.id}&data=${backup.encryptedData.substring(0, 100)}...`
    return `QR_CODE:${backupUrl}`
  }
  
  private generatePrintableBackup(backup: EncryptedBackup, recoveryPhrase?: string[]): string {
    return `
╔════════════════════════════════════════════════════════════════╗
║                    PERSONAPASS BACKUP DOCUMENT                ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  ⚠️  KEEP THIS DOCUMENT SECURE AND PRIVATE  ⚠️               ║
║                                                                ║
║  User DID: ${this.userDID.substring(0, 40)}...        ║
║  Wallet:   ${this.walletAddress.substring(0, 40)}...          ║
║  Created:  ${new Date(backup.createdAt).toLocaleDateString()}                             ║
║                                                                ║
╠════════════════════════════════════════════════════════════════╣
║  RECOVERY PHRASE (Write down in order):                       ║
║                                                                ║
${recoveryPhrase ? recoveryPhrase.map((word, i) => `║  ${(i + 1).toString().padStart(2, ' ')}. ${word.padEnd(12, ' ')}                                            ║`).join('\n') : '║  No recovery phrase included in this backup                    ║'}
║                                                                ║
╠════════════════════════════════════════════════════════════════╣
║  BACKUP ID: ${backup.id}                          ║
║                                                                ║
║  Recovery Instructions:                                        ║
║  1. Visit https://recover.personapass.xyz                     ║
║  2. Upload this backup or scan QR code                        ║
║  3. Enter your backup password                                 ║
║  4. Follow restoration steps                                   ║
║                                                                ║
║  Emergency: Contact your guardians for social recovery        ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
`
  }
  
  private getSocialRecoveryConfig(): any {
    // Get from localStorage or API
    const stored = localStorage.getItem(`social_recovery_${this.userDID}`)
    return stored ? JSON.parse(stored) : null
  }
  
  private getIdentityCredentials(): any[] {
    // Get from localStorage or API
    const stored = localStorage.getItem(`credentials_${this.userDID}`)
    return stored ? JSON.parse(stored) : []
  }
  
  private getEmergencyContacts(): string[] {
    // Get from stored emergency contacts
    const stored = localStorage.getItem(`emergency_contacts_${this.userDID}`)
    return stored ? JSON.parse(stored) : []
  }
  
  private storeRecoveryPhrase(phrase: string[]): void {
    localStorage.setItem(`recovery_phrase_${this.userDID}`, JSON.stringify(phrase))
  }
  
  private restoreSocialRecovery(config: any): void {
    localStorage.setItem(`social_recovery_${this.userDID}`, JSON.stringify(config))
  }
  
  private restoreCredentials(credentials: any[]): void {
    localStorage.setItem(`credentials_${this.userDID}`, JSON.stringify(credentials))
  }
  
  // Hardware device integrations (simplified for demo)
  
  private async createYubikeyBackup(): Promise<{ success: boolean; backupId?: string; error?: string }> {
    // In production, integrate with Yubikey WebAuthn API
    console.log('Creating Yubikey backup...')
    return { success: true, backupId: `yubikey_${Date.now()}` }
  }
  
  private async createLedgerBackup(): Promise<{ success: boolean; backupId?: string; error?: string }> {
    // In production, integrate with Ledger device
    console.log('Creating Ledger backup...')
    return { success: true, backupId: `ledger_${Date.now()}` }
  }
  
  private async createTrezorBackup(): Promise<{ success: boolean; backupId?: string; error?: string }> {
    // In production, integrate with Trezor device
    console.log('Creating Trezor backup...')
    return { success: true, backupId: `trezor_${Date.now()}` }
  }
}