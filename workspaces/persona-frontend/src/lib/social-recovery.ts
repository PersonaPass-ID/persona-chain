// 👥 PersonaPass Social Recovery System
// Allows trusted friends/family to help recover wallet access using Shamir's Secret Sharing

import { personaApiClient } from './api-client-updated'

// Social recovery types
export interface Guardian {
  id: string
  walletAddress: string
  publicKey: string
  name: string
  relationship: 'friend' | 'family' | 'colleague' | 'other'
  encryptedKeyShare: string    // Their piece of the recovery key
  addedAt: string
  status: 'pending' | 'active' | 'revoked'
  contactInfo?: {
    email?: string
    telegram?: string
    discord?: string
  }
}

export interface SocialRecoveryConfig {
  id: string
  userDID: string
  userWalletAddress: string
  guardians: Guardian[]
  threshold: number            // Number of guardians needed (e.g., 2 of 3)
  recoveryKeyHash: string     // Hash of the master recovery key
  createdAt: string
  lastUpdated: string
  isActive: boolean
}

export interface RecoveryRequest {
  id: string
  userDID: string
  userWalletAddress: string
  requestedAt: string
  executionDelay: number      // Time lock in milliseconds (e.g., 48 hours)
  guardiansNeeded: number
  guardiansResponded: Guardian[]
  guardianSignatures: GuardianSignature[]
  status: 'pending' | 'approved' | 'executed' | 'cancelled' | 'expired'
  newWalletAddress?: string   // New wallet to transfer identity to
}

export interface GuardianSignature {
  guardianWalletAddress: string
  signature: string
  signedMessage: string
  keyShare: string            // Decrypted key share
  signedAt: string
}

export interface RecoveryKeyShares {
  shares: string[]
  threshold: number
  totalShares: number
}

// Simple Shamir's Secret Sharing implementation for recovery keys
class ShamirSecretSharing {
  /**
   * Split a secret into multiple shares with threshold requirement
   */
  static splitSecret(secret: string, totalShares: number, threshold: number): string[] {
    // Simplified implementation - in production, use a proper cryptographic library
    const shares: string[] = []
    
    // Generate polynomial coefficients
    const coefficients = [this.stringToNumber(secret)]
    for (let i = 1; i < threshold; i++) {
      coefficients.push(Math.floor(Math.random() * 1000000))
    }
    
    // Generate shares using polynomial evaluation
    for (let x = 1; x <= totalShares; x++) {
      let y = coefficients[0]
      for (let i = 1; i < threshold; i++) {
        y += coefficients[i] * Math.pow(x, i)
      }
      shares.push(`${x}:${y}`)
    }
    
    return shares
  }
  
  /**
   * Reconstruct secret from threshold number of shares
   */
  static reconstructSecret(shares: string[], threshold: number): string {
    // Simplified implementation - in production, use proper Lagrange interpolation
    const points = shares.slice(0, threshold).map(share => {
      const [x, y] = share.split(':').map(Number)
      return { x, y }
    })
    
    // Calculate constant term (secret) using Lagrange interpolation
    let secret = 0
    for (let i = 0; i < threshold; i++) {
      let numerator = 1
      let denominator = 1
      
      for (let j = 0; j < threshold; j++) {
        if (i !== j) {
          numerator *= (0 - points[j].x)
          denominator *= (points[i].x - points[j].x)
        }
      }
      
      secret += points[i].y * (numerator / denominator)
    }
    
    return this.numberToString(Math.round(secret))
  }
  
  private static stringToNumber(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }
  
  private static numberToString(num: number): string {
    return num.toString(36)
  }
}

export class SocialRecoveryManager {
  private config: SocialRecoveryConfig | null = null
  
  constructor(private userDID: string, private userWalletAddress: string) {}
  
  /**
   * Initialize social recovery for a user
   */
  async initializeSocialRecovery(guardians: Omit<Guardian, 'id' | 'encryptedKeyShare' | 'addedAt' | 'status'>[], threshold: number): Promise<SocialRecoveryConfig> {
    // Generate master recovery key
    const masterRecoveryKey = this.generateRecoveryKey()
    
    // Split the recovery key using Shamir's Secret Sharing
    const keyShares = ShamirSecretSharing.splitSecret(masterRecoveryKey, guardians.length, threshold)
    
    // Create guardian objects with encrypted key shares
    const guardiansWithShares: Guardian[] = guardians.map((guardian, index) => ({
      ...guardian,
      id: `guardian_${Date.now()}_${index}`,
      encryptedKeyShare: this.encryptKeyShare(keyShares[index], guardian.publicKey),
      addedAt: new Date().toISOString(),
      status: 'pending' as const
    }))
    
    // Create social recovery configuration
    const config: SocialRecoveryConfig = {
      id: `recovery_${Date.now()}`,
      userDID: this.userDID,
      userWalletAddress: this.userWalletAddress,
      guardians: guardiansWithShares,
      threshold: threshold,
      recoveryKeyHash: this.hashRecoveryKey(masterRecoveryKey),
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      isActive: true
    }
    
    this.config = config
    
    // Store configuration (in production, this would be stored on blockchain or IPFS)
    this.storeRecoveryConfig(config)
    
    // Notify guardians
    await this.notifyGuardians(config, 'added')
    
    return config
  }
  
  /**
   * Add a new guardian to existing social recovery
   */
  async addGuardian(guardian: Omit<Guardian, 'id' | 'encryptedKeyShare' | 'addedAt' | 'status'>): Promise<Guardian> {
    if (!this.config) {
      throw new Error('Social recovery not initialized')
    }
    
    // Generate new key shares with the additional guardian
    const masterKey = this.reconstructMasterKey() // This would need guardian signatures in production
    const newTotalShares = this.config.guardians.length + 1
    const keyShares = ShamirSecretSharing.splitSecret(masterKey, newTotalShares, this.config.threshold)
    
    // Create new guardian
    const newGuardian: Guardian = {
      ...guardian,
      id: `guardian_${Date.now()}`,
      encryptedKeyShare: this.encryptKeyShare(keyShares[keyShares.length - 1], guardian.publicKey),
      addedAt: new Date().toISOString(),
      status: 'pending'
    }
    
    // Update existing guardians with new key shares
    this.config.guardians = this.config.guardians.map((g, index) => ({
      ...g,
      encryptedKeyShare: this.encryptKeyShare(keyShares[index], g.publicKey)
    }))
    
    this.config.guardians.push(newGuardian)
    this.config.lastUpdated = new Date().toISOString()
    
    this.storeRecoveryConfig(this.config)
    await this.notifyGuardians(this.config, 'updated')
    
    return newGuardian
  }
  
  /**
   * Remove a guardian from social recovery
   */
  async removeGuardian(guardianId: string): Promise<void> {
    if (!this.config) {
      throw new Error('Social recovery not initialized')
    }
    
    this.config.guardians = this.config.guardians.filter(g => g.id !== guardianId)
    this.config.lastUpdated = new Date().toISOString()
    
    // Regenerate key shares for remaining guardians
    const masterKey = this.reconstructMasterKey()
    const keyShares = ShamirSecretSharing.splitSecret(masterKey, this.config.guardians.length, this.config.threshold)
    
    this.config.guardians = this.config.guardians.map((g, index) => ({
      ...g,
      encryptedKeyShare: this.encryptKeyShare(keyShares[index], g.publicKey)
    }))
    
    this.storeRecoveryConfig(this.config)
    await this.notifyGuardians(this.config, 'updated')
  }
  
  /**
   * Initiate account recovery process
   */
  async initiateRecovery(newWalletAddress: string, reason: string): Promise<RecoveryRequest> {
    if (!this.config) {
      throw new Error('Social recovery not configured')
    }
    
    const recoveryRequest: RecoveryRequest = {
      id: `recovery_req_${Date.now()}`,
      userDID: this.userDID,
      userWalletAddress: this.userWalletAddress,
      requestedAt: new Date().toISOString(),
      executionDelay: 48 * 60 * 60 * 1000, // 48 hour time lock
      guardiansNeeded: this.config.threshold,
      guardiansResponded: [],
      guardianSignatures: [],
      status: 'pending',
      newWalletAddress: newWalletAddress
    }
    
    // Store recovery request
    this.storeRecoveryRequest(recoveryRequest)
    
    // Notify all guardians
    await this.notifyGuardiansOfRecovery(recoveryRequest, reason)
    
    return recoveryRequest
  }
  
  /**
   * Guardian approves recovery request
   */
  async approveRecovery(recoveryRequestId: string, guardianWalletAddress: string, signature: string, keyShare: string): Promise<boolean> {
    const request = this.getRecoveryRequest(recoveryRequestId)
    if (!request) {
      throw new Error('Recovery request not found')
    }
    
    if (request.status !== 'pending') {
      throw new Error('Recovery request is not pending')
    }
    
    // Verify guardian is authorized
    const guardian = this.config?.guardians.find(g => g.walletAddress === guardianWalletAddress)
    if (!guardian) {
      throw new Error('Guardian not found')
    }
    
    // Add guardian signature
    const guardianSignature: GuardianSignature = {
      guardianWalletAddress,
      signature,
      signedMessage: `Approve recovery for ${request.userDID} to ${request.newWalletAddress}`,
      keyShare,
      signedAt: new Date().toISOString()
    }
    
    request.guardianSignatures.push(guardianSignature)
    request.guardiansResponded.push(guardian)
    
    // Check if we have enough approvals
    if (request.guardianSignatures.length >= request.guardiansNeeded) {
      request.status = 'approved'
    }
    
    this.storeRecoveryRequest(request)
    
    return request.status === 'approved'
  }
  
  /**
   * Execute approved recovery after time lock
   */
  async executeRecovery(recoveryRequestId: string): Promise<boolean> {
    const request = this.getRecoveryRequest(recoveryRequestId)
    if (!request) {
      throw new Error('Recovery request not found')
    }
    
    if (request.status !== 'approved') {
      throw new Error('Recovery request not approved')
    }
    
    // Check time lock
    const requestTime = new Date(request.requestedAt).getTime()
    const currentTime = Date.now()
    if (currentTime < requestTime + request.executionDelay) {
      throw new Error('Time lock has not expired')
    }
    
    // Reconstruct master recovery key
    const keyShares = request.guardianSignatures.map(sig => sig.keyShare)
    const masterKey = ShamirSecretSharing.reconstructSecret(keyShares, request.guardiansNeeded)
    
    // Verify reconstructed key matches stored hash
    if (this.hashRecoveryKey(masterKey) !== this.config?.recoveryKeyHash) {
      throw new Error('Invalid recovery key reconstruction')
    }
    
    // Transfer identity to new wallet (this would involve blockchain transactions)
    const success = await this.transferIdentity(request.userDID, request.newWalletAddress!, masterKey)
    
    if (success) {
      request.status = 'executed'
      this.storeRecoveryRequest(request)
    }
    
    return success
  }
  
  /**
   * Get social recovery configuration
   */
  getSocialRecoveryConfig(): SocialRecoveryConfig | null {
    return this.config
  }
  
  /**
   * Load existing social recovery configuration
   */
  async loadSocialRecoveryConfig(): Promise<SocialRecoveryConfig | null> {
    // In production, load from blockchain or decentralized storage
    const stored = localStorage.getItem(`social_recovery_${this.userDID}`)
    if (stored) {
      this.config = JSON.parse(stored)
      return this.config
    }
    return null
  }
  
  // Private helper methods
  
  private generateRecoveryKey(): string {
    // Generate a strong recovery key
    const bytes = new Uint8Array(32)
    crypto.getRandomValues(bytes)
    return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
  }
  
  private hashRecoveryKey(key: string): string {
    // In production, use proper cryptographic hash
    let hash = 0
    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return hash.toString(16)
  }
  
  private encryptKeyShare(keyShare: string, publicKey: string): string {
    // In production, use proper encryption with the guardian's public key
    // For now, just base64 encode for demo purposes
    return Buffer.from(`${keyShare}:${publicKey}`).toString('base64')
  }
  
  private decryptKeyShare(encryptedKeyShare: string, privateKey: string): string {
    // In production, use proper decryption
    const decoded = Buffer.from(encryptedKeyShare, 'base64').toString()
    return decoded.split(':')[0]
  }
  
  private reconstructMasterKey(): string {
    // In production, this would require guardian signatures to decrypt their key shares
    // For demo purposes, return a placeholder
    return 'master_recovery_key_placeholder'
  }
  
  private storeRecoveryConfig(config: SocialRecoveryConfig): void {
    // In production, store on blockchain or IPFS
    localStorage.setItem(`social_recovery_${this.userDID}`, JSON.stringify(config))
  }
  
  private storeRecoveryRequest(request: RecoveryRequest): void {
    // In production, store on blockchain or IPFS
    localStorage.setItem(`recovery_request_${request.id}`, JSON.stringify(request))
  }
  
  private getRecoveryRequest(requestId: string): RecoveryRequest | null {
    const stored = localStorage.getItem(`recovery_request_${requestId}`)
    return stored ? JSON.parse(stored) : null
  }
  
  private async notifyGuardians(config: SocialRecoveryConfig, action: 'added' | 'updated'): Promise<void> {
    // In production, send notifications via email, push notifications, or on-chain events
    console.log(`Notifying ${config.guardians.length} guardians that they were ${action} as recovery guardians for ${config.userDID}`)
    
    for (const guardian of config.guardians) {
      console.log(`Guardian ${guardian.name} (${guardian.walletAddress}) notified`)
    }
  }
  
  private async notifyGuardiansOfRecovery(request: RecoveryRequest, reason: string): Promise<void> {
    // In production, send urgent notifications to all guardians
    console.log(`RECOVERY REQUEST: User ${request.userDID} requests account recovery`)
    console.log(`Reason: ${reason}`)
    console.log(`New wallet: ${request.newWalletAddress}`)
    console.log(`Time lock: 48 hours`)
    console.log(`Guardians needed: ${request.guardiansNeeded}`)
  }
  
  private async transferIdentity(userDID: string, newWalletAddress: string, recoveryKey: string): Promise<boolean> {
    // In production, this would involve blockchain transactions to transfer identity
    console.log(`Transferring identity ${userDID} to new wallet ${newWalletAddress}`)
    
    try {
      // Simulate blockchain transaction
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Update DID document to point to new wallet
      // Update all credentials to be controlled by new wallet
      // Revoke old wallet's access
      
      console.log('Identity transfer completed successfully')
      return true
    } catch (error) {
      console.error('Identity transfer failed:', error)
      return false
    }
  }
}