// Temporary DID Storage - Until PersonaChain implements custom DID modules
// This will be replaced when PersonaChain gets proper DID storage functionality

interface StoredDID {
  did: string
  walletAddress: string
  firstName: string
  lastName: string
  walletType: string
  createdAt: string
  txHash: string
  blockHeight: number
}

class TempDIDStorage {
  private storageKey = 'personapass_temp_dids'

  /**
   * Store DID temporarily (will be replaced by PersonaChain storage)
   */
  storeDID(didData: StoredDID): void {
    try {
      const existingDIDs = this.getAllDIDs()
      
      // Remove any existing DID for this wallet address
      const filteredDIDs = existingDIDs.filter(d => d.walletAddress !== didData.walletAddress)
      
      // Add the new DID
      filteredDIDs.push(didData)
      
      if (typeof window !== 'undefined') {
        localStorage.setItem(this.storageKey, JSON.stringify(filteredDIDs))
        console.log(`🗂️ Temporarily stored DID: ${didData.did} (until PersonaChain implements DID storage)`)
      }
    } catch (error) {
      console.error('Failed to store DID temporarily:', error)
    }
  }

  /**
   * Get DID by wallet address
   */
  getDIDByWallet(walletAddress: string): StoredDID | null {
    try {
      const allDIDs = this.getAllDIDs()
      return allDIDs.find(d => d.walletAddress === walletAddress) || null
    } catch (error) {
      console.error('Failed to retrieve DID:', error)
      return null
    }
  }

  /**
   * Get all stored DIDs
   */
  getAllDIDs(): StoredDID[] {
    try {
      if (typeof window === 'undefined') return []
      
      const stored = localStorage.getItem(this.storageKey)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Failed to get all DIDs:', error)
      return []
    }
  }

  /**
   * Check if wallet has existing DID
   */
  hasExistingDID(walletAddress: string): boolean {
    return this.getDIDByWallet(walletAddress) !== null
  }

  /**
   * Clear all temporary storage
   */
  clearAll(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.storageKey)
      console.log('🗑️ Cleared temporary DID storage')
    }
  }

  /**
   * Get storage statistics
   */
  getStats(): { totalDIDs: number; storageSize: string; note: string } {
    const allDIDs = this.getAllDIDs()
    const storageSize = typeof window !== 'undefined' 
      ? (localStorage.getItem(this.storageKey)?.length || 0) + ' bytes'
      : '0 bytes'
    
    return {
      totalDIDs: allDIDs.length,
      storageSize,
      note: 'This is temporary storage. DIDs will be migrated to PersonaChain when DID modules are implemented.'
    }
  }
}

export const tempDIDStorage = new TempDIDStorage()