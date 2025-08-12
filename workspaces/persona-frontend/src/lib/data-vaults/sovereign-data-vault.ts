/**
 * DATA SOVEREIGNTY VAULTS
 * 
 * User-controlled encrypted data storage with granular access control,
 * versioning, and privacy-preserving sharing capabilities.
 */

import { createHash, randomBytes, createCipheriv, createDecipheriv } from 'crypto'
import { ec as EC } from 'elliptic'
import * as IPFS from 'ipfs-core'

export interface DataVault {
  id: string
  owner: string
  name: string
  description: string
  encryptionKey: string // Encrypted with user's key
  accessPolicies: AccessPolicy[]
  dataCategories: DataCategory[]
  metadata: VaultMetadata
  ipfsHash?: string // For decentralized storage
}

export interface DataCategory {
  id: string
  name: string
  type: 'personal' | 'medical' | 'financial' | 'professional' | 'social' | 'biometric'
  sensitivity: 'public' | 'private' | 'confidential' | 'secret'
  items: VaultItem[]
  retention: RetentionPolicy
}

export interface VaultItem {
  id: string
  name: string
  dataType: string
  encryptedData: string
  checksum: string
  size: number
  createdAt: Date
  modifiedAt: Date
  accessLog: AccessLogEntry[]
  versions: ItemVersion[]
}

export interface ItemVersion {
  version: number
  encryptedData: string
  checksum: string
  createdAt: Date
  createdBy: string
  changeDescription: string
}

export interface AccessPolicy {
  id: string
  principal: string // DID or address
  permissions: Permission[]
  constraints: AccessConstraint[]
  validFrom: Date
  validUntil?: Date
  active: boolean
}

export interface Permission {
  action: 'read' | 'write' | 'delete' | 'share' | 'admin'
  resource: string // Category ID or item ID
  conditions?: AccessCondition[]
}

export interface AccessConstraint {
  type: 'temporal' | 'geographic' | 'purpose' | 'frequency'
  value: any
}

export interface AccessCondition {
  field: string
  operator: 'equals' | 'contains' | 'greater' | 'less'
  value: any
}

export interface AccessLogEntry {
  timestamp: Date
  accessor: string
  action: string
  resource: string
  result: 'granted' | 'denied'
  metadata?: any
}

export interface RetentionPolicy {
  duration: number // Days
  action: 'delete' | 'archive' | 'review'
  autoDelete: boolean
}

export interface VaultMetadata {
  created: Date
  lastAccessed: Date
  totalSize: number
  itemCount: number
  version: string
  backupStatus: 'none' | 'local' | 'cloud' | 'distributed'
  encryptionAlgorithm: string
  compressionEnabled: boolean
}

export interface SharingRequest {
  requester: string
  purpose: string
  dataCategories: string[]
  duration: number // Hours
  conditions: AccessCondition[]
}

export interface DataQuery {
  categories?: string[]
  dateRange?: { from: Date; to: Date }
  sensitivity?: string[]
  tags?: string[]
  searchTerm?: string
}

/**
 * Sovereign Data Vault Manager
 */
export class SovereignDataVault {
  private ec: EC
  private ipfs: any // IPFS instance
  private readonly ENCRYPTION_ALGORITHM = 'aes-256-gcm'
  private readonly VAULT_VERSION = '1.0.0'
  
  constructor() {
    this.ec = new EC('secp256k1')
  }

  /**
   * Create a new data vault
   */
  async createVault(
    owner: string,
    name: string,
    description: string,
    password: string
  ): Promise<DataVault> {
    try {
      // Generate vault ID
      const vaultId = this.generateVaultId(owner, name)
      
      // Generate encryption key for vault
      const vaultKey = randomBytes(32)
      const encryptedKey = await this.encryptVaultKey(vaultKey, password)
      
      // Initialize vault structure
      const vault: DataVault = {
        id: vaultId,
        owner,
        name,
        description,
        encryptionKey: encryptedKey,
        accessPolicies: [
          {
            id: this.generateId(),
            principal: owner,
            permissions: [
              { action: 'admin', resource: '*' }
            ],
            constraints: [],
            validFrom: new Date(),
            active: true
          }
        ],
        dataCategories: this.initializeCategories(),
        metadata: {
          created: new Date(),
          lastAccessed: new Date(),
          totalSize: 0,
          itemCount: 0,
          version: this.VAULT_VERSION,
          backupStatus: 'none',
          encryptionAlgorithm: this.ENCRYPTION_ALGORITHM,
          compressionEnabled: true
        }
      }
      
      // Store vault
      await this.storeVault(vault)
      
      console.log('🔒 Data sovereignty vault created:', vaultId)
      return vault
      
    } catch (error) {
      console.error('Failed to create vault:', error)
      throw new Error('Vault creation failed')
    }
  }

  /**
   * Store data in vault
   */
  async storeData(
    vaultId: string,
    categoryId: string,
    itemName: string,
    data: any,
    dataType: string,
    password: string
  ): Promise<VaultItem> {
    try {
      const vault = await this.getVault(vaultId)
      if (!vault) throw new Error('Vault not found')
      
      // Decrypt vault key
      const vaultKey = await this.decryptVaultKey(vault.encryptionKey, password)
      
      // Find category
      const category = vault.dataCategories.find(c => c.id === categoryId)
      if (!category) throw new Error('Category not found')
      
      // Compress data if enabled
      let processedData = JSON.stringify(data)
      if (vault.metadata.compressionEnabled) {
        processedData = await this.compressData(processedData)
      }
      
      // Encrypt data
      const encryptedData = await this.encryptData(processedData, vaultKey)
      
      // Create vault item
      const item: VaultItem = {
        id: this.generateId(),
        name: itemName,
        dataType,
        encryptedData,
        checksum: this.calculateChecksum(processedData),
        size: Buffer.byteLength(encryptedData),
        createdAt: new Date(),
        modifiedAt: new Date(),
        accessLog: [],
        versions: [
          {
            version: 1,
            encryptedData,
            checksum: this.calculateChecksum(processedData),
            createdAt: new Date(),
            createdBy: vault.owner,
            changeDescription: 'Initial version'
          }
        ]
      }
      
      // Add to category
      category.items.push(item)
      
      // Update vault metadata
      vault.metadata.itemCount++
      vault.metadata.totalSize += item.size
      vault.metadata.lastAccessed = new Date()
      
      // Store updated vault
      await this.storeVault(vault)
      
      // Log access
      this.logAccess(vault, 'write', item.id, vault.owner, 'granted')
      
      console.log('📦 Data stored in vault:', item.id)
      return item
      
    } catch (error) {
      console.error('Failed to store data:', error)
      throw error
    }
  }

  /**
   * Retrieve data from vault
   */
  async retrieveData(
    vaultId: string,
    itemId: string,
    password: string,
    requester?: string
  ): Promise<any> {
    try {
      const vault = await this.getVault(vaultId)
      if (!vault) throw new Error('Vault not found')
      
      // Check access permissions
      const hasAccess = await this.checkAccess(vault, itemId, 'read', requester || vault.owner)
      if (!hasAccess) {
        this.logAccess(vault, 'read', itemId, requester || vault.owner, 'denied')
        throw new Error('Access denied')
      }
      
      // Find item
      let item: VaultItem | undefined
      for (const category of vault.dataCategories) {
        item = category.items.find(i => i.id === itemId)
        if (item) break
      }
      
      if (!item) throw new Error('Item not found')
      
      // Decrypt vault key
      const vaultKey = await this.decryptVaultKey(vault.encryptionKey, password)
      
      // Decrypt data
      const decryptedData = await this.decryptData(item.encryptedData, vaultKey)
      
      // Decompress if needed
      let processedData = decryptedData
      if (vault.metadata.compressionEnabled) {
        processedData = await this.decompressData(decryptedData)
      }
      
      // Parse and return
      const data = JSON.parse(processedData)
      
      // Log access
      this.logAccess(vault, 'read', itemId, requester || vault.owner, 'granted')
      
      // Update last accessed
      vault.metadata.lastAccessed = new Date()
      await this.storeVault(vault)
      
      return data
      
    } catch (error) {
      console.error('Failed to retrieve data:', error)
      throw error
    }
  }

  /**
   * Share data with selective disclosure
   */
  async shareData(
    vaultId: string,
    request: SharingRequest,
    password: string
  ): Promise<{ token: string; expiresAt: Date }> {
    try {
      const vault = await this.getVault(vaultId)
      if (!vault) throw new Error('Vault not found')
      
      // Create temporary access policy
      const policy: AccessPolicy = {
        id: this.generateId(),
        principal: request.requester,
        permissions: request.dataCategories.map(categoryId => ({
          action: 'read' as const,
          resource: categoryId,
          conditions: request.conditions
        })),
        constraints: [
          {
            type: 'temporal',
            value: { duration: request.duration }
          },
          {
            type: 'purpose',
            value: request.purpose
          }
        ],
        validFrom: new Date(),
        validUntil: new Date(Date.now() + request.duration * 3600 * 1000),
        active: true
      }
      
      // Add policy to vault
      vault.accessPolicies.push(policy)
      await this.storeVault(vault)
      
      // Generate access token
      const token = this.generateAccessToken(vaultId, policy.id, request.requester)
      
      console.log('🔗 Data shared with:', request.requester)
      return {
        token,
        expiresAt: policy.validUntil!
      }
      
    } catch (error) {
      console.error('Failed to share data:', error)
      throw error
    }
  }

  /**
   * Query vault data
   */
  async queryData(
    vaultId: string,
    query: DataQuery,
    password: string
  ): Promise<VaultItem[]> {
    try {
      const vault = await this.getVault(vaultId)
      if (!vault) throw new Error('Vault not found')
      
      let results: VaultItem[] = []
      
      // Filter by categories
      let categories = vault.dataCategories
      if (query.categories && query.categories.length > 0) {
        categories = categories.filter(c => query.categories!.includes(c.id))
      }
      
      // Filter by sensitivity
      if (query.sensitivity && query.sensitivity.length > 0) {
        categories = categories.filter(c => query.sensitivity!.includes(c.sensitivity))
      }
      
      // Collect items
      for (const category of categories) {
        for (const item of category.items) {
          // Filter by date range
          if (query.dateRange) {
            if (item.createdAt < query.dateRange.from || item.createdAt > query.dateRange.to) {
              continue
            }
          }
          
          // Filter by search term (requires decryption)
          if (query.searchTerm) {
            // This would require decrypting and searching
            // Skipping for performance in this example
          }
          
          results.push(item)
        }
      }
      
      return results
      
    } catch (error) {
      console.error('Query failed:', error)
      throw error
    }
  }

  /**
   * Export vault data (GDPR compliance)
   */
  async exportVault(
    vaultId: string,
    password: string,
    format: 'json' | 'csv' | 'encrypted'
  ): Promise<string> {
    try {
      const vault = await this.getVault(vaultId)
      if (!vault) throw new Error('Vault not found')
      
      // Decrypt vault key
      const vaultKey = await this.decryptVaultKey(vault.encryptionKey, password)
      
      // Collect all data
      const exportData: any = {
        vault: {
          id: vault.id,
          name: vault.name,
          description: vault.description,
          created: vault.metadata.created,
          owner: vault.owner
        },
        categories: []
      }
      
      // Decrypt and collect all items
      for (const category of vault.dataCategories) {
        const categoryData: any = {
          name: category.name,
          type: category.type,
          sensitivity: category.sensitivity,
          items: []
        }
        
        for (const item of category.items) {
          const decryptedData = await this.decryptData(item.encryptedData, vaultKey)
          const data = vault.metadata.compressionEnabled 
            ? await this.decompressData(decryptedData)
            : decryptedData
          
          categoryData.items.push({
            id: item.id,
            name: item.name,
            dataType: item.dataType,
            data: JSON.parse(data),
            createdAt: item.createdAt,
            modifiedAt: item.modifiedAt
          })
        }
        
        exportData.categories.push(categoryData)
      }
      
      // Format output
      switch (format) {
        case 'json':
          return JSON.stringify(exportData, null, 2)
          
        case 'csv':
          return this.convertToCSV(exportData)
          
        case 'encrypted':
          const encrypted = await this.encryptData(
            JSON.stringify(exportData),
            vaultKey
          )
          return encrypted
          
        default:
          throw new Error('Invalid export format')
      }
      
    } catch (error) {
      console.error('Export failed:', error)
      throw error
    }
  }

  /**
   * Delete vault data (right to be forgotten)
   */
  async deleteData(
    vaultId: string,
    itemId: string,
    password: string,
    permanent: boolean = false
  ): Promise<boolean> {
    try {
      const vault = await this.getVault(vaultId)
      if (!vault) throw new Error('Vault not found')
      
      // Find and remove item
      for (const category of vault.dataCategories) {
        const index = category.items.findIndex(i => i.id === itemId)
        if (index !== -1) {
          const item = category.items[index]
          
          if (permanent) {
            // Permanent deletion
            category.items.splice(index, 1)
            console.log('🗑️ Data permanently deleted:', itemId)
          } else {
            // Soft delete (mark as deleted)
            item.encryptedData = ''
            item.modifiedAt = new Date()
            console.log('🗑️ Data marked as deleted:', itemId)
          }
          
          // Update metadata
          vault.metadata.itemCount--
          vault.metadata.totalSize -= item.size
          
          // Log deletion
          this.logAccess(vault, 'delete', itemId, vault.owner, 'granted')
          
          // Store updated vault
          await this.storeVault(vault)
          
          return true
        }
      }
      
      return false
      
    } catch (error) {
      console.error('Delete failed:', error)
      return false
    }
  }

  /**
   * Backup vault to IPFS
   */
  async backupToIPFS(vaultId: string, password: string): Promise<string> {
    try {
      // Initialize IPFS if not already
      if (!this.ipfs) {
        this.ipfs = await IPFS.create()
      }
      
      const vault = await this.getVault(vaultId)
      if (!vault) throw new Error('Vault not found')
      
      // Export encrypted vault
      const encryptedExport = await this.exportVault(vaultId, password, 'encrypted')
      
      // Add to IPFS
      const { cid } = await this.ipfs.add(encryptedExport)
      const ipfsHash = cid.toString()
      
      // Update vault with IPFS hash
      vault.ipfsHash = ipfsHash
      vault.metadata.backupStatus = 'distributed'
      await this.storeVault(vault)
      
      console.log('💾 Vault backed up to IPFS:', ipfsHash)
      return ipfsHash
      
    } catch (error) {
      console.error('IPFS backup failed:', error)
      throw error
    }
  }

  // Helper methods
  private generateVaultId(owner: string, name: string): string {
    return createHash('sha256')
      .update(`${owner}-${name}-${Date.now()}`)
      .digest('hex')
      .substring(0, 16)
  }

  private generateId(): string {
    return randomBytes(16).toString('hex')
  }

  private initializeCategories(): DataCategory[] {
    return [
      {
        id: this.generateId(),
        name: 'Personal Information',
        type: 'personal',
        sensitivity: 'private',
        items: [],
        retention: { duration: 365, action: 'review', autoDelete: false }
      },
      {
        id: this.generateId(),
        name: 'Medical Records',
        type: 'medical',
        sensitivity: 'confidential',
        items: [],
        retention: { duration: 2555, action: 'archive', autoDelete: false } // 7 years
      },
      {
        id: this.generateId(),
        name: 'Financial Data',
        type: 'financial',
        sensitivity: 'secret',
        items: [],
        retention: { duration: 2555, action: 'archive', autoDelete: false }
      },
      {
        id: this.generateId(),
        name: 'Professional Documents',
        type: 'professional',
        sensitivity: 'private',
        items: [],
        retention: { duration: 1095, action: 'review', autoDelete: false } // 3 years
      }
    ]
  }

  private async encryptVaultKey(key: Buffer, password: string): Promise<string> {
    const salt = randomBytes(32)
    const derivedKey = createHash('sha256').update(password + salt.toString('hex')).digest()
    const iv = randomBytes(16)
    const cipher = createCipheriv(this.ENCRYPTION_ALGORITHM, derivedKey, iv)
    
    const encrypted = Buffer.concat([cipher.update(key), cipher.final(), cipher.getAuthTag()])
    const combined = Buffer.concat([salt, iv, encrypted])
    
    return combined.toString('base64')
  }

  private async decryptVaultKey(encryptedKey: string, password: string): Promise<Buffer> {
    const combined = Buffer.from(encryptedKey, 'base64')
    const salt = combined.slice(0, 32)
    const iv = combined.slice(32, 48)
    const authTag = combined.slice(-16)
    const encrypted = combined.slice(48, -16)
    
    const derivedKey = createHash('sha256').update(password + salt.toString('hex')).digest()
    const decipher = createDecipheriv(this.ENCRYPTION_ALGORITHM, derivedKey, iv)
    decipher.setAuthTag(authTag)
    
    return Buffer.concat([decipher.update(encrypted), decipher.final()])
  }

  private async encryptData(data: string, key: Buffer): Promise<string> {
    const iv = randomBytes(16)
    const cipher = createCipheriv(this.ENCRYPTION_ALGORITHM, key, iv)
    
    const encrypted = Buffer.concat([
      cipher.update(Buffer.from(data)),
      cipher.final(),
      cipher.getAuthTag()
    ])
    
    const combined = Buffer.concat([iv, encrypted])
    return combined.toString('base64')
  }

  private async decryptData(encryptedData: string, key: Buffer): Promise<string> {
    const combined = Buffer.from(encryptedData, 'base64')
    const iv = combined.slice(0, 16)
    const authTag = combined.slice(-16)
    const encrypted = combined.slice(16, -16)
    
    const decipher = createDecipheriv(this.ENCRYPTION_ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)
    
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])
    return decrypted.toString()
  }

  private calculateChecksum(data: string): string {
    return createHash('sha256').update(data).digest('hex')
  }

  private async compressData(data: string): Promise<string> {
    // Implement compression (e.g., using zlib)
    return data // Placeholder
  }

  private async decompressData(data: string): Promise<string> {
    // Implement decompression
    return data // Placeholder
  }

  private async checkAccess(
    vault: DataVault,
    resource: string,
    action: Permission['action'],
    principal: string
  ): Promise<boolean> {
    // Check if principal has access to resource
    const policies = vault.accessPolicies.filter(p => 
      p.principal === principal && 
      p.active &&
      (!p.validUntil || p.validUntil > new Date())
    )
    
    for (const policy of policies) {
      for (const permission of policy.permissions) {
        if (permission.action === action || permission.action === 'admin') {
          if (permission.resource === '*' || permission.resource === resource) {
            return true
          }
        }
      }
    }
    
    return false
  }

  private logAccess(
    vault: DataVault,
    action: string,
    resource: string,
    accessor: string,
    result: 'granted' | 'denied'
  ): void {
    // Log access attempt
    // In production, this would be stored persistently
    console.log(`[ACCESS LOG] ${accessor} ${action} ${resource}: ${result}`)
  }

  private generateAccessToken(vaultId: string, policyId: string, principal: string): string {
    const payload = { vaultId, policyId, principal, issued: Date.now() }
    return Buffer.from(JSON.stringify(payload)).toString('base64')
  }

  private convertToCSV(data: any): string {
    // Convert to CSV format
    // Simplified implementation
    return JSON.stringify(data)
  }

  private async storeVault(vault: DataVault): Promise<void> {
    // Store vault (would use database or encrypted storage)
    // Placeholder for actual implementation
  }

  private async getVault(vaultId: string): Promise<DataVault | null> {
    // Retrieve vault from storage
    // Placeholder for actual implementation
    return null
  }
}

// Export singleton instance
export const dataVaultManager = new SovereignDataVault()