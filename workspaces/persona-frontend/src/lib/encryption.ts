// Web3 Identity Encryption Utilities
// Client-side encryption for sovereign data control

import { webcrypto } from 'crypto'

export interface EncryptedData {
  encryptedContent: string
  iv: string
  salt: string
  keyDerivationParams: {
    iterations: number
    algorithm: string
  }
}

export interface DecryptionResult {
  success: boolean
  data?: any
  error?: string
}

/**
 * Web3 Identity Encryption Service
 * Provides client-side encryption for sovereign data control
 */
export class IdentityEncryption {
  private static readonly ALGORITHM = 'AES-GCM'
  private static readonly KEY_LENGTH = 256
  private static readonly IV_LENGTH = 12
  private static readonly SALT_LENGTH = 32
  private static readonly ITERATIONS = 100000

  /**
   * Generate encryption key from wallet signature
   */
  static async deriveKeyFromSignature(
    walletSignature: string,
    salt: Uint8Array
  ): Promise<CryptoKey> {
    const encoder = new TextEncoder()
    const keyMaterial = await webcrypto.subtle.importKey(
      'raw',
      encoder.encode(walletSignature),
      'PBKDF2',
      false,
      ['deriveKey']
    )

    return await webcrypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: this.ITERATIONS,
        hash: 'SHA-256'
      },
      keyMaterial,
      {
        name: this.ALGORITHM,
        length: this.KEY_LENGTH
      },
      false,
      ['encrypt', 'decrypt']
    )
  }

  /**
   * Encrypt data using wallet-derived key
   */
  static async encryptData(
    data: any,
    walletSignature: string
  ): Promise<EncryptedData> {
    try {
      // Generate random salt and IV
      const salt = webcrypto.getRandomValues(new Uint8Array(this.SALT_LENGTH))
      const iv = webcrypto.getRandomValues(new Uint8Array(this.IV_LENGTH))

      // Derive encryption key from wallet signature
      const key = await this.deriveKeyFromSignature(walletSignature, salt)

      // Encrypt the data
      const encoder = new TextEncoder()
      const plaintextData = encoder.encode(JSON.stringify(data))
      
      const encryptedBuffer = await webcrypto.subtle.encrypt(
        {
          name: this.ALGORITHM,
          iv: iv
        },
        key,
        plaintextData
      )

      return {
        encryptedContent: this.bufferToBase64(encryptedBuffer),
        iv: this.bufferToBase64(iv),
        salt: this.bufferToBase64(salt),
        keyDerivationParams: {
          iterations: this.ITERATIONS,
          algorithm: 'PBKDF2'
        }
      }
    } catch (error) {
      console.error('❌ Encryption failed:', error)
      throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Decrypt data using wallet-derived key
   */
  static async decryptData(
    encryptedData: EncryptedData,
    walletSignature: string
  ): Promise<DecryptionResult> {
    try {
      // Convert base64 to buffers
      const encryptedBuffer = this.base64ToBuffer(encryptedData.encryptedContent)
      const iv = this.base64ToBuffer(encryptedData.iv)
      const salt = this.base64ToBuffer(encryptedData.salt)

      // Derive the same key
      const key = await this.deriveKeyFromSignature(walletSignature, salt)

      // Decrypt the data
      const decryptedBuffer = await webcrypto.subtle.decrypt(
        {
          name: this.ALGORITHM,
          iv: iv
        },
        key,
        encryptedBuffer
      )

      const decoder = new TextDecoder()
      const decryptedText = decoder.decode(decryptedBuffer)
      const data = JSON.parse(decryptedText)

      return {
        success: true,
        data
      }
    } catch (error) {
      console.error('❌ Decryption failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Decryption failed'
      }
    }
  }

  /**
   * Generate content hash for blockchain storage
   */
  static async generateContentHash(data: any): Promise<string> {
    const encoder = new TextEncoder()
    const dataBytes = encoder.encode(JSON.stringify(data))
    
    const hashBuffer = await webcrypto.subtle.digest('SHA-256', dataBytes)
    return this.bufferToHex(hashBuffer)
  }

  /**
   * Verify content integrity using hash
   */
  static async verifyContentHash(data: any, expectedHash: string): Promise<boolean> {
    const actualHash = await this.generateContentHash(data)
    return actualHash === expectedHash
  }

  // Utility functions
  private static bufferToBase64(buffer: ArrayBuffer): string {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)))
  }

  private static base64ToBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    return bytes.buffer
  }

  private static bufferToHex(buffer: ArrayBuffer): string {
    return Array.from(new Uint8Array(buffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  }
}

/**
 * Wallet signature generator for encryption keys
 */
export class WalletSignatureGenerator {
  /**
   * Generate deterministic signature for encryption
   * This creates a consistent key for the user's data
   */
  static async generateEncryptionSignature(
    walletType: string,
    walletAddress: string,
    purpose: 'encryption' | 'authentication' = 'encryption'
  ): Promise<string> {
    if (typeof window === 'undefined') {
      throw new Error('Wallet operations only available in browser')
    }

    const message = `PersonaPass ${purpose} key derivation\nAddress: ${walletAddress}\nTimestamp: ${Date.now()}`

    try {
      switch (walletType) {
        case 'keplr':
          if (!window.keplr) {
            throw new Error('Keplr wallet not available')
          }
          const keplrSignature = await window.keplr.signArbitrary(
            'cosmoshub-4',
            walletAddress,
            message
          )
          return keplrSignature.signature

        case 'leap':
          if (!window.leap) {
            throw new Error('Leap wallet not available')
          }
          const leapSignature = await window.leap.signArbitrary(
            'cosmoshub-4',
            walletAddress,
            message
          )
          return leapSignature.signature

        default:
          throw new Error(`Wallet type ${walletType} not supported for encryption`)
      }
    } catch (error) {
      console.error('❌ Wallet signature generation failed:', error)
      throw error
    }
  }
}